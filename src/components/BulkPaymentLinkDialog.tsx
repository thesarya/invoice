import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link, Copy, Send, RefreshCw, ExternalLink, MessageCircle } from "lucide-react";
import { razorpayService } from "@/lib/razorpay";
import WhatsAppDialog from './WhatsAppDialog';

interface Invoice {
  id: string;
  invoiceNo: string;
  total: number;
  child?: {
    fullNameWithCaseId?: string;
    fatherName?: string;
    phone?: string;
    email?: string;
  };
  centre?: string;
}

interface BulkPaymentLinkDialogProps {
  selectedInvoices: Invoice[];
  onPaymentLinksGenerated: (links: { [invoiceId: string]: string }) => void;
}

const BulkPaymentLinkDialog: React.FC<BulkPaymentLinkDialogProps> = ({ 
  selectedInvoices, 
  onPaymentLinksGenerated 
}) => {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<{ [invoiceId: string]: string }>({});
  const [expiryDays, setExpiryDays] = useState(7);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notifySMS, setNotifySMS] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const { toast } = useToast();

  const generateBulkPaymentLinks = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "No Invoices Selected",
        description: "Please select at least one invoice to generate payment links",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    const newLinks: { [invoiceId: string]: string } = {};

    try {
      for (const invoice of selectedInvoices) {
        try {
          // Clean phone number (remove +91 if present)
          let phone = invoice.child?.phone || '';
          if (phone.startsWith('+91')) {
            phone = phone.substring(3);
          }
          if (phone.startsWith('91')) {
            phone = phone.substring(2);
          }

          // Use default email if not provided
          const email = invoice.child?.email || 'payment@aaryavart.com';

          const response = await razorpayService.createInvoicePaymentLink(invoice, {
            name: invoice.child?.fullNameWithCaseId || 'Customer',
            phone: phone || '9999999999', // Default phone if missing
            email: email,
            amount: invoice.total > 0 ? invoice.total : 1, // Minimum ₹1
          });

          newLinks[invoice.id] = response.short_url;
          
          toast({
            title: "Payment Link Generated",
            description: `Generated link for invoice ${invoice.invoiceNo}`,
          });

        } catch (error) {
          console.error(`Error generating payment link for invoice ${invoice.invoiceNo}:`, error);
          toast({
            title: "Error",
            description: `Failed to generate payment link for invoice ${invoice.invoiceNo}`,
            variant: "destructive",
          });
        }
      }

      setGeneratedLinks(newLinks);
      onPaymentLinksGenerated(newLinks);
      
      toast({
        title: "Bulk Generation Complete",
        description: `Generated ${Object.keys(newLinks).length} payment links`,
      });

    } catch (error) {
      console.error('Error in bulk payment link generation:', error);
      toast({
        title: "Error",
        description: "Failed to generate some payment links",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
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

  const openWhatsApp = (phone: string, studentName: string, parentName: string, paymentLink: string) => {
    // Get clean phone number for WhatsApp (always ensure 91 prefix)
    let cleanPhone = phone;
    if (cleanPhone.startsWith('+91')) {
      cleanPhone = cleanPhone.substring(3);
    }
    if (!cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    }

    const message = `Dear ${parentName || 'Parent'},

This is a reminder for payment for ${studentName || 'your child'}.

Payment Link: ${paymentLink}

⚠️ IMPORTANT: This payment link is valid only until 9th of this month.

Please make the payment before 10th to avoid any inconvenience. If payment is not made before the deadline, you will need to make the payment at the centre.

Thank you for your cooperation.

Best regards,
Aaryavart Center for Autism`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex items-center gap-1"
          disabled={selectedInvoices.length === 0}
        >
          <Link className="h-3 w-3" />
          Bulk Pay Links ({selectedInvoices.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Bulk Payment Link Generation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Settings */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Generation Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Expiry (Days)</Label>
                <Input
                  id="expiry"
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  min="1"
                  max="365"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminder"
                  checked={reminderEnabled}
                  onCheckedChange={(checked) => setReminderEnabled(checked as boolean)}
                />
                <Label htmlFor="reminder">Enable Reminders</Label>
              </div>
            </div>
          </div>

          {/* Invoice List */}
          <div>
            <h3 className="font-semibold mb-3">Selected Invoices ({selectedInvoices.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{invoice.invoiceNo}</div>
                    <div className="text-sm text-gray-600">
                      {invoice.child?.fullNameWithCaseId || 'N/A'} - {invoice.child?.fatherName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.child?.phone ? 
                        (invoice.child.phone.startsWith('91') ? invoice.child.phone.substring(2) : invoice.child.phone) 
                        : 'No phone'} • {formatAmount(invoice.total)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {generatedLinks[invoice.id] ? (
                      <>
                        <Badge className="bg-green-100 text-green-800">Generated</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(generatedLinks[invoice.id])}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {invoice.child?.phone && (
                          <WhatsAppDialog
                            defaultPhone={invoice.child.phone}
                            studentName={invoice.child?.fullNameWithCaseId || ''}
                            parentName={invoice.child?.fatherName || ''}
                            paymentLink={generatedLinks[invoice.id]}
                            trigger={
                              <Button
                                size="sm"
                                variant="outline"
                              >
                                <MessageCircle className="h-3 w-3" />
                              </Button>
                            }
                          />
                        )}
                      </>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            {Object.keys(generatedLinks).length === 0 ? (
              <Button 
                onClick={generateBulkPaymentLinks} 
                disabled={generating || selectedInvoices.length === 0}
                className="flex-1"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate All Payment Links'
                )}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={generateBulkPaymentLinks} 
                  disabled={generating}
                  variant="outline"
                >
                  Regenerate All
                </Button>
                <Button 
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </>
            )}
          </div>

          {/* Summary */}
          {Object.keys(generatedLinks).length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Generation Summary</h3>
              <div className="text-sm text-green-700">
                <p>✅ Generated {Object.keys(generatedLinks).length} payment links</p>
                <p>📱 Use WhatsApp buttons to send payment reminders</p>
                <p>📋 Links are valid until 9th of this month</p>
                <p>⚠️ Payment must be made before 10th to avoid centre payment</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPaymentLinkDialog; 