import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { razorpayService } from "@/lib/razorpay";
import { aisensyService } from '@/lib/aisensy';

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

interface BulkPaymentLinkWithWhatsAppDialogProps {
  selectedInvoices: Invoice[];
  trigger: React.ReactNode;
}

interface ProcessingStatus {
  invoiceId: string;
  invoiceNo: string;
  childName: string;
  parentName: string;
  status: 'pending' | 'generating_link' | 'link_generated' | 'sending_whatsapp' | 'completed' | 'failed';
  paymentLink?: string;
  error?: string;
}

const BulkPaymentLinkWithWhatsAppDialog: React.FC<BulkPaymentLinkWithWhatsAppDialogProps> = ({ 
  selectedInvoices, 
  trigger 
}) => {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStatuses, setProcessingStatuses] = useState<ProcessingStatus[]>([]);
  const [expiryDays, setExpiryDays] = useState(7);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notifySMS, setNotifySMS] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const { toast } = useToast();

  const processInvoices = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "No Invoices Selected",
        description: "Please select at least one invoice to process",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    
    // Initialize processing statuses
    const initialStatuses: ProcessingStatus[] = selectedInvoices.map(invoice => ({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      childName: invoice.child?.fullNameWithCaseId || 'N/A',
      parentName: invoice.child?.fatherName || 'N/A',
      status: 'pending'
    }));
    setProcessingStatuses(initialStatuses);

    const results: { [invoiceId: string]: string } = {};
    const reminders: Array<{
      phone: string;
      parentName: string;
      childName: string;
      paymentLink: string;
      amount: number;
      dueDate: string;
    }> = [];

    try {
      // Step 1: Generate payment links for all invoices
      toast({
        title: "Generating Payment Links",
        description: `Creating payment links for ${selectedInvoices.length} invoices...`,
      });

      for (let i = 0; i < selectedInvoices.length; i++) {
        const invoice = selectedInvoices[i];
        
        try {
          // Update status to generating
          setProcessingStatuses(prev => prev.map(status => 
            status.invoiceId === invoice.id 
              ? { ...status, status: 'generating_link' }
              : status
          ));

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

          results[invoice.id] = response.short_url;

          // Update status to link generated
          setProcessingStatuses(prev => prev.map(status => 
            status.invoiceId === invoice.id 
              ? { ...status, status: 'link_generated', paymentLink: response.short_url }
              : status
          ));

          // Prepare reminder data
          const currentDate = new Date();
          const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 10);
          const dueDate = nextMonth.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });

          reminders.push({
            phone: invoice.child?.phone || '',
            parentName: invoice.child?.fatherName || 'Parent',
            childName: invoice.child?.fullNameWithCaseId || 'Child',
            paymentLink: response.short_url,
            amount: invoice.total,
            dueDate
          });

        } catch (error) {
          console.error(`Error generating payment link for invoice ${invoice.invoiceNo}:`, error);
          
          // Extract meaningful error message
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
            // Check for common authentication errors
            if (errorMessage.includes('Authentication failed') || errorMessage.includes('401')) {
              errorMessage = 'Authentication failed - Check Razorpay API credentials';
            } else if (errorMessage.includes('403')) {
              errorMessage = 'Access forbidden - Check Razorpay API permissions';
            } else if (errorMessage.includes('404')) {
              errorMessage = 'API endpoint not found';
            } else if (errorMessage.includes('500')) {
              errorMessage = 'Server error - Try again later';
            }
          }
          
          // Update status to failed
          setProcessingStatuses(prev => prev.map(status => 
            status.invoiceId === invoice.id 
              ? { 
                  ...status, 
                  status: 'failed', 
                  error: errorMessage
                }
              : status
          ));
        }

        // Add small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const successfulLinks = Object.keys(results).length;
      toast({
        title: "Payment Links Generated",
        description: `Successfully created ${successfulLinks} payment links`,
      });

      // Step 2: Send WhatsApp reminders
      if (reminders.length > 0) {
        toast({
          title: "Sending WhatsApp Reminders",
          description: `Sending reminders for ${reminders.length} invoices...`,
        });

        // Update statuses to sending WhatsApp
        setProcessingStatuses(prev => prev.map(status => 
          results[status.invoiceId] 
            ? { ...status, status: 'sending_whatsapp' }
            : status
        ));

        // Check if Aisensy is configured and use it, otherwise fallback to WhatsApp Web
        const isAisensyConfigured = aisensyService.isConfigured();
        
        if (isAisensyConfigured) {
          // Use Aisensy API
          toast({
            title: "Sending WhatsApp Reminders via Aisensy",
            description: `Sending ${reminders.length} reminders via Aisensy API...`,
          });

          const results = await aisensyService.sendBulkPaymentReminders(reminders);
          
          // Update statuses based on results
          setProcessingStatuses(prev => prev.map(status => {
            const matchingReminder = reminders.find(r => 
              r.parentName === status.parentName && 
              r.childName === status.childName
            );
            if (matchingReminder) {
              // Check if this reminder was successful
              const isSuccess = results.success > 0 && !results.errors.some(error => 
                error.includes(status.parentName)
              );
              return { 
                ...status, 
                status: isSuccess ? 'completed' : 'failed',
                error: isSuccess ? undefined : 'WhatsApp sending failed'
              };
            }
            return status;
          }));

          toast({
            title: "WhatsApp Reminders Sent via Aisensy",
            description: `Successfully sent ${results.success} reminders. ${results.failed} failed.`,
          });
        } else {
          // Use WhatsApp Web fallback
          toast({
            title: "Opening WhatsApp Web",
            description: `Aisensy not configured. Opening WhatsApp Web for ${reminders.length} invoices...`,
          });

          reminders.forEach((reminder, index) => {
            setTimeout(() => {
              try {
                const whatsappUrl = aisensyService.createFallbackWhatsAppMessage(reminder);
                window.open(whatsappUrl, '_blank');
                
                // Update status
                setProcessingStatuses(prev => prev.map(status => {
                  const matchingReminder = reminders.find(r => 
                    r.parentName === status.parentName && 
                    r.childName === status.childName
                  );
                  if (matchingReminder && matchingReminder === reminder) {
                    return { ...status, status: 'completed' };
                  }
                  return status;
                }));
              } catch (error) {
                console.error('Error creating WhatsApp URL:', error);
                setProcessingStatuses(prev => prev.map(status => {
                  const matchingReminder = reminders.find(r => 
                    r.parentName === status.parentName && 
                    r.childName === status.childName
                  );
                  if (matchingReminder && matchingReminder === reminder) {
                    return { ...status, status: 'failed', error: 'WhatsApp URL creation failed' };
                  }
                  return status;
                }));
              }
            }, index * 1000); // Stagger opening to avoid browser blocking
          });

          toast({
            title: "WhatsApp Web Opened",
            description: "WhatsApp Web has been opened for all invoices",
          });
        }
      }

    } catch (error) {
      console.error('Error in bulk processing:', error);
      toast({
        title: "Error",
        description: "Failed to process some invoices",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };


  const getStatusIcon = (status: ProcessingStatus['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
      case 'generating_link':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'link_generated':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'sending_whatsapp':
        return <Loader2 className="w-4 h-4 animate-spin text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ProcessingStatus['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'generating_link':
        return 'bg-blue-100 text-blue-700';
      case 'link_generated':
        return 'bg-green-100 text-green-700';
      case 'sending_whatsapp':
        return 'bg-orange-100 text-orange-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
    }
  };


  const totalInvoices = processingStatuses.length;
  const completedCount = processingStatuses.filter(s => s.status === 'completed').length;
  const failedCount = processingStatuses.filter(s => s.status === 'failed').length;
  const processingCount = processingStatuses.filter(s => 
    s.status === 'generating_link' || s.status === 'sending_whatsapp'
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            send whatspp fees reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Simple Summary */}
          <div className="text-center">
            <p className="text-lg font-semibold">Selected Invoices: {selectedInvoices.length}</p>
            {processingStatuses.length > 0 && (
              <p className="text-sm text-gray-600">
                Completed: {completedCount} | Processing: {processingCount} | Failed: {failedCount}
              </p>
            )}
          </div>

          {/* Simple Settings */}
          <div className="flex gap-4 items-center justify-center">
            <div>
              <Label htmlFor="expiry">Expiry (Days)</Label>
              <Input
                id="expiry"
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                min="1"
                max="365"
                className="w-20"
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

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={processInvoices}
              disabled={processing || selectedInvoices.length === 0}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {processingCount > 0 ? 'Processing...' : 'Starting...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  send whatspp fees reminder ({selectedInvoices.length} invoices)
                </>
              )}
            </Button>
          </div>

          {/* Status List */}
          {processingStatuses.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-2">
              {processingStatuses.map((status, index) => (
                <div key={status.invoiceId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    <span className="font-medium">{status.invoiceNo}</span>
                    <span className="text-sm text-gray-600">- {status.childName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(status.status)}>
                      {status.status.replace('_', ' ')}
                    </Badge>
                    {status.error && (
                      <span className="text-xs text-red-600" title={status.error}>
                        {status.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPaymentLinkWithWhatsAppDialog;
