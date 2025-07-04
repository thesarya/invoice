import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link, Copy, Edit, Send, RefreshCw, ExternalLink, Calendar, Bell, Plus } from "lucide-react";
import { razorpayService, PaymentLinkResponse } from "@/lib/razorpay";

interface Invoice {
  id: string;
  invoiceNo: string;
  total: number;
  child?: {
    fullNameWithCaseId?: string;
    phone?: string;
    email?: string;
  };
}

interface PaymentLinkDialogProps {
  invoice: Invoice;
  onPaymentLinkGenerated?: (invoiceId: string, paymentLink: string) => void;
}

const PaymentLinkDialog: React.FC<PaymentLinkDialogProps> = ({ invoice, onPaymentLinkGenerated }) => {
  const [open, setOpen] = useState(false);
  // Set a minimum amount of 1 rupee if invoice.total is 0, null, or undefined
  const [amount, setAmount] = useState(() => {
    const invoiceAmount = invoice.total || 0;
    return invoiceAmount > 0 ? invoiceAmount : 1;
  });
  const [phone, setPhone] = useState(invoice.child?.phone || '');
  const [name, setName] = useState(invoice.child?.fullNameWithCaseId || '');
  const [email, setEmail] = useState(invoice.child?.email || '');
  const [description, setDescription] = useState(`Payment for invoice #${invoice.invoiceNo}`);
  const [expiryDays, setExpiryDays] = useState(7);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notifySMS, setNotifySMS] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const { toast } = useToast();

  // Initialize form state when dialog opens
  useEffect(() => {
    if (open) {
      if (paymentLink) {
        // Update form state with current payment link values
        setAmount(paymentLink.amount / 100); // Convert from paise to rupees
        setName(paymentLink.customer.name);
        // Display phone without 91 prefix
        const phone = paymentLink.customer.contact;
        setPhone(phone.startsWith('91') ? phone.substring(2) : phone);
        setEmail(paymentLink.customer.email);
        setDescription(paymentLink.description);
        
        // Calculate expiry days from expire_by timestamp
        const now = Math.floor(Date.now() / 1000);
        const daysLeft = Math.ceil((paymentLink.expire_by - now) / (24 * 60 * 60));
        setExpiryDays(Math.max(1, daysLeft));
      } else {
        // Check for existing payment link for this invoice
        checkExistingPaymentLink();
      }
    }
  }, [open, paymentLink, invoice]);

  // Check if payment link already exists for this invoice
  const checkExistingPaymentLink = async () => {
    try {
      const existingLink = await razorpayService.findPaymentLinkByInvoice(invoice.invoiceNo);
      if (existingLink) {
        setPaymentLink(existingLink);
        toast({
          title: "Existing Payment Link Found",
          description: "A payment link already exists for this invoice. You can edit it or create a new one.",
        });
      } else {
        // Reset form for new payment link
        const invoiceAmount = invoice.total || 0;
        setAmount(invoiceAmount > 0 ? invoiceAmount : 1);
        // Display phone without 91 prefix
        const phone = invoice.child?.phone || '';
        setPhone(phone.startsWith('91') ? phone.substring(2) : phone);
        setName(invoice.child?.fullNameWithCaseId || '');
        setEmail(invoice.child?.email || '');
        setDescription(`Payment for invoice #${invoice.invoiceNo}`);
        setExpiryDays(7);
        setReminderEnabled(true);
        setNotifySMS(true);
        setNotifyEmail(true);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error checking existing payment link:', error);
      // Fallback to creating new payment link
      const invoiceAmount = invoice.total || 0;
      setAmount(invoiceAmount > 0 ? invoiceAmount : 1);
      const phone = invoice.child?.phone || '';
      setPhone(phone.startsWith('91') ? phone.substring(2) : phone);
      setName(invoice.child?.fullNameWithCaseId || '');
      setEmail(invoice.child?.email || '');
      setDescription(`Payment for invoice #${invoice.invoiceNo}`);
      setExpiryDays(7);
      setReminderEnabled(true);
      setNotifySMS(true);
      setNotifyEmail(true);
      setIsEditing(false);
    }
  };

  const validateForm = () => {
    // Validate amount first
    if (!amount || amount <= 0 || isNaN(amount)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than ₹0",
        variant: "destructive",
      });
      return false;
    }

    // Validate phone number (optional for bulk generation)
    let cleanPhone = phone;
    if (cleanPhone.startsWith('+91')) {
      cleanPhone = cleanPhone.substring(3);
    }
    if (cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    if (phone && cleanPhone.length !== 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number or leave it empty",
        variant: "destructive",
      });
      return false;
    }

    // Validate customer name
    if (!name.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a customer name",
        variant: "destructive",
      });
      return false;
    }

    // Validate email (optional)
    if (email.trim() && !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address or leave it empty",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const generatePaymentLink = async () => {
    if (!validateForm()) return;

    // Debug logging
    console.log('Generating payment link with:', {
      amount,
      name: name.trim(),
      phone,
      email: email.trim(),
      invoiceTotal: invoice.total
    });

    setGenerating(true);

    try {
      // Clean phone number for API call
      let cleanPhone = phone;
      if (cleanPhone.startsWith('+91')) {
        cleanPhone = cleanPhone.substring(3);
      }
      if (cleanPhone.startsWith('91')) {
        cleanPhone = cleanPhone.substring(2);
      }

      const response = await razorpayService.createInvoicePaymentLink(invoice, {
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim(),
        amount: amount, // Pass the amount from form
      });

      setPaymentLink(response);
      
      // Update form state with the created payment link values
      setAmount(response.amount / 100); // Convert from paise to rupees
      setName(response.customer.name);
      // Display phone without 91 prefix
      const contactPhone = response.customer.contact;
      setPhone(contactPhone.startsWith('91') ? contactPhone.substring(2) : contactPhone);
      setEmail(response.customer.email);
      setDescription(response.description);
      
      // Notify parent component about the generated payment link
      if (onPaymentLinkGenerated) {
        onPaymentLinkGenerated(invoice.id, response.short_url);
      }
      
      toast({
        title: "Payment Link Generated",
        description: "Payment link created successfully",
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error generating payment link:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate payment link",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const updatePaymentLink = async () => {
    if (!validateForm() || !paymentLink) return;

    setGenerating(true);

    try {
      const expireBy = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60);
      
      const response = await razorpayService.updatePaymentLink(paymentLink.id, {
        amount: amount * 100, // Convert to paise
        description: description,
        customer: {
          name: name.trim(),
          contact: phone,
          email: email.trim(),
        },
        notify: {
          sms: notifySMS,
          email: notifyEmail,
        },
        reminder_enable: reminderEnabled,
        expire_by: expireBy,
      });

      setPaymentLink(response);
      
              // Update form state with the updated payment link values
        setAmount(response.amount / 100); // Convert from paise to rupees
        setName(response.customer.name);
        // Display phone without 91 prefix
        const contactPhone = response.customer.contact;
        setPhone(contactPhone.startsWith('91') ? contactPhone.substring(2) : contactPhone);
        setEmail(response.customer.email);
        setDescription(response.description);
      
      toast({
        title: "Payment Link Updated",
        description: "Payment link updated successfully",
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating payment link:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update payment link",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const resendNotification = async (medium: 'sms' | 'email') => {
    if (!paymentLink) return;

    setSendingNotification(true);

    try {
      await razorpayService.resendNotification(paymentLink.id, medium);
      
      toast({
        title: "Notification Sent",
        description: `${medium.toUpperCase()} notification sent successfully`,
      });
    } catch (error) {
      console.error(`Error sending ${medium} notification:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to send ${medium} notification`,
        variant: "destructive",
      });
    } finally {
      setSendingNotification(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const openPaymentLink = (url: string) => {
    window.open(url, '_blank');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount / 100); // Convert from paise to rupees
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <Link className="h-3 w-3" />
          Pay Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            {paymentLink ? 'Payment Link Details' : 'Generate Payment Link'}
          </DialogTitle>
        </DialogHeader>

        {!paymentLink ? (
          // Create Payment Link Form
          <div className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="customer">Customer</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Enter amount"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Payment description"
                  />
                </div>
                <div>
                  <Label htmlFor="expiry">Expiry (Days)</Label>
                  <Input
                    id="expiry"
                    type="number"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    placeholder="Days until expiry"
                    min="1"
                    max="365"
                  />
                </div>
              </TabsContent>

              <TabsContent value="customer" className="space-y-4">
                <div>
                  <Label htmlFor="customer-name">Customer Name *</Label>
                  <Input
                    id="customer-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone-number">Phone Number *</Label>
                  <Input
                    id="phone-number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder"
                    checked={reminderEnabled}
                    onCheckedChange={(checked) => setReminderEnabled(checked as boolean)}
                  />
                  <Label htmlFor="reminder">Enable Payment Reminders</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms-notify"
                    checked={notifySMS}
                    onCheckedChange={(checked) => setNotifySMS(checked as boolean)}
                  />
                  <Label htmlFor="sms-notify">Send SMS Notification</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-notify"
                    checked={notifyEmail}
                    onCheckedChange={(checked) => setNotifyEmail(checked as boolean)}
                  />
                  <Label htmlFor="email-notify">Send Email Notification</Label>
                </div>
              </TabsContent>
            </Tabs>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <strong>Invoice:</strong> {invoice.invoiceNo}
            </div>

            <Button 
              onClick={generatePaymentLink} 
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Payment Link'
              )}
            </Button>
          </div>
        ) : (
          // Payment Link Details
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800">Payment Link Created</h3>
                  <p className="text-sm text-green-600">Link ID: {paymentLink.id}</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Amount</Label>
                <p className="text-lg font-semibold">{formatAmount(paymentLink.amount)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Reference ID</Label>
                <p className="text-sm">{paymentLink.reference_id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Customer</Label>
                <p className="text-sm">{paymentLink.customer.name}</p>
                <p className="text-xs text-gray-500">{paymentLink.customer.contact}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Expires On</Label>
                <p className="text-sm">{formatDate(paymentLink.expire_by)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={paymentLink.short_url}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(paymentLink.short_url)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openPaymentLink(paymentLink.short_url)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-1"
              >
                <Edit className="h-3 w-3" />
                {isEditing ? 'Cancel Edit' : 'Edit Link'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => resendNotification('sms')}
                disabled={sendingNotification}
                className="flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                Resend SMS
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => resendNotification('email')}
                disabled={sendingNotification}
                className="flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                Resend Email
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPaymentLink(null);
                  setIsEditing(false);
                  // Reset form for new payment link
                  const invoiceAmount = invoice.total || 0;
                  setAmount(invoiceAmount > 0 ? invoiceAmount : 1);
                  const phone = invoice.child?.phone || '';
                  setPhone(phone.startsWith('91') ? phone.substring(2) : phone);
                  setName(invoice.child?.fullNameWithCaseId || '');
                  setEmail(invoice.child?.email || '');
                  setDescription(`Payment for invoice #${invoice.invoiceNo}`);
                  setExpiryDays(7);
                  setReminderEnabled(true);
                  setNotifySMS(true);
                  setNotifyEmail(true);
                }}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Create New Link
              </Button>
            </div>

            {isEditing && (
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium">Edit Payment Link</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-amount">Amount (₹)</Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-expiry">Expiry (Days)</Label>
                    <Input
                      id="edit-expiry"
                      type="number"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(Number(e.target.value))}
                      min="1"
                      max="365"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-reminder"
                      checked={reminderEnabled}
                      onCheckedChange={(checked) => setReminderEnabled(checked as boolean)}
                    />
                    <Label htmlFor="edit-reminder">Enable Reminders</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-sms"
                      checked={notifySMS}
                      onCheckedChange={(checked) => setNotifySMS(checked as boolean)}
                    />
                    <Label htmlFor="edit-sms">SMS Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-email"
                      checked={notifyEmail}
                      onCheckedChange={(checked) => setNotifyEmail(checked as boolean)}
                    />
                    <Label htmlFor="edit-email">Email Notifications</Label>
                  </div>
                </div>
                <Button 
                  onClick={updatePaymentLink} 
                  disabled={generating}
                  className="w-full"
                >
                  {generating ? 'Updating...' : 'Update Payment Link'}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentLinkDialog;
