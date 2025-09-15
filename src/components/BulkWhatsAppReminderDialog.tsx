import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { aisensyService } from '@/lib/aisensy';
import { parentInvoiceService, type Parent } from '@/lib/parent-invoice-service';

interface BulkWhatsAppReminderDialogProps {
  selectedParents: Parent[];
  trigger: React.ReactNode;
}

interface ReminderStatus {
  parentName: string;
  childName: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string;
}

const BulkWhatsAppReminderDialog: React.FC<BulkWhatsAppReminderDialogProps> = ({ 
  selectedParents, 
  trigger 
}) => {
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reminderStatuses, setReminderStatuses] = useState<ReminderStatus[]>([]);
  const [useAisensy, setUseAisensy] = useState(false); // Default to WhatsApp Web
  const { toast } = useToast();

  // Auto-set the correct method when dialog opens
  useEffect(() => {
    if (open) {
      const isConfigured = aisensyService.isConfigured();
      console.log('Aisensy configured:', isConfigured);
      setUseAisensy(isConfigured);
    }
  }, [open]);

  const handleSendReminders = async () => {
    if (selectedParents.length === 0) {
      toast({
        title: "No Parents Selected",
        description: "Please select at least one parent to send reminders",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setReminderStatuses([]);

    try {
      // Step 1: Fetch invoice data for selected parents
      toast({
        title: "Fetching Invoice Data",
        description: "Getting invoice information for selected parents...",
      });

      const parentInvoiceData = await parentInvoiceService.fetchInvoicesForParents(selectedParents);
      console.log('Fetched parent invoice data:', parentInvoiceData);
      
      // Check if any parents have invoices
      const parentsWithInvoices = parentInvoiceData.filter(data => data.invoices.length > 0);
      if (parentsWithInvoices.length === 0) {
        toast({
          title: "No Invoices Found",
          description: "No invoices found for the selected parents in the current month",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }
      
      // Step 2: Generate payment links
      toast({
        title: "Generating Payment Links",
        description: "Creating Razorpay payment links for invoices...",
      });

      const dataWithPaymentLinks = await parentInvoiceService.generatePaymentLinksForParents(parentInvoiceData);
      console.log('Generated payment links data:', dataWithPaymentLinks);
      
      // Debug: Show detailed payment link information
      dataWithPaymentLinks.forEach((parentData, index) => {
        console.log(`Parent ${index + 1}: ${parentData.parent.name}`);
        console.log(`  Invoices: ${parentData.invoices.length}`);
        console.log(`  Payment Links: ${Object.keys(parentData.paymentLinks).length}`);
        Object.entries(parentData.paymentLinks).forEach(([invoiceId, link]) => {
          console.log(`    Invoice ${invoiceId}: ${link}`);
        });
      });
      
      // Check if any payment links were created
      const parentsWithPaymentLinks = dataWithPaymentLinks.filter(data => Object.keys(data.paymentLinks).length > 0);
      if (parentsWithPaymentLinks.length === 0) {
        console.warn('No payment links were created, but proceeding with reminders using fallback messages');
        toast({
          title: "No Payment Links Created",
          description: "Proceeding with reminders using fallback messages.",
          variant: "destructive",
        });
        // Don't return here - continue with reminders using fallback messages
      } else {
        toast({
          title: "Payment Links Generated",
          description: `Successfully created ${parentsWithPaymentLinks.length} payment links`,
        });
      }
      
      // Step 3: Prepare reminder data
      console.log('Preparing reminder data...');
      const reminders = parentInvoiceService.prepareReminderData(dataWithPaymentLinks);
      console.log('Prepared reminders:', reminders);
      console.log('Number of reminders prepared:', reminders.length);
      
      if (reminders.length === 0) {
        console.error('No reminders were prepared - this should not happen');
        toast({
          title: "No Reminders Prepared",
          description: "No reminders were prepared from the invoice data. Check console for details.",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // Initialize status tracking
      const initialStatuses: ReminderStatus[] = reminders.map(reminder => ({
        parentName: reminder.parentName,
        childName: reminder.childName,
        status: 'pending'
      }));
      setReminderStatuses(initialStatuses);

      // Step 4: Send WhatsApp reminders
      // ALWAYS check Aisensy configuration before attempting to use it
      const isAisensyConfigured = aisensyService.isConfigured();
      
      console.log('WhatsApp sending method check:', {
        useAisensy,
        isConfigured: isAisensyConfigured,
        willUseAisensy: useAisensy && isAisensyConfigured
      });
      
      // FORCE WhatsApp Web if Aisensy is not configured
      if (!isAisensyConfigured) {
        console.log('Aisensy not configured - FORCING WhatsApp Web fallback');
        toast({
          title: "Using WhatsApp Web",
          description: "Aisensy not configured. Opening WhatsApp Web for each parent.",
        });
        
        // Skip Aisensy and go directly to WhatsApp Web
        // Fallback: Open WhatsApp Web for each reminder
        toast({
          title: "Opening WhatsApp",
          description: `Opening WhatsApp for ${reminders.length} parents...`,
        });

        reminders.forEach((reminder, index) => {
          setTimeout(() => {
            try {
              console.log('Creating WhatsApp URL for reminder:', reminder);
              const whatsappUrl = aisensyService.createFallbackWhatsAppMessage(reminder);
              console.log('Generated WhatsApp URL:', whatsappUrl);
              window.open(whatsappUrl, '_blank');
              
              // Update status
              setReminderStatuses(prev => {
                const updated = [...prev];
                if (updated[index]) {
                  updated[index].status = 'sent';
                }
                return updated;
              });
            } catch (error) {
              console.error('Error creating WhatsApp URL:', error);
              setReminderStatuses(prev => {
                const updated = [...prev];
                if (updated[index]) {
                  updated[index].status = 'failed';
                  updated[index].error = error instanceof Error ? error.message : 'Unknown error';
                }
                return updated;
              });
            }
          }, index * 1000); // Stagger opening to avoid browser blocking
        });

        toast({
          title: "WhatsApp Opened",
          description: "WhatsApp has been opened for all selected parents",
        });
        
        setProcessing(false);
        return;
      }
      
      // Only use Aisensy if it's properly configured
      if (useAisensy && isAisensyConfigured) {
        toast({
          title: "Sending WhatsApp Reminders",
          description: `Sending ${reminders.length} reminders via Aisensy...`,
        });

        // Update statuses to processing
        setReminderStatuses(prev => prev.map(status => ({ ...status, status: 'processing' })));

        const results = await aisensyService.sendBulkPaymentReminders(reminders);
        
        // Update statuses based on results
        setReminderStatuses(prev => {
          const updated = [...prev];
          let successCount = 0;
          let failCount = 0;

          results.errors.forEach((error, index) => {
            if (index < updated.length) {
              updated[index].status = 'failed';
              updated[index].error = error;
              failCount++;
            }
          });

          // Mark remaining as successful
          for (let i = results.errors.length; i < updated.length; i++) {
            updated[i].status = 'sent';
            successCount++;
          }

          return updated;
        });

        toast({
          title: "WhatsApp Reminders Sent",
          description: `Successfully sent ${results.success} reminders. ${results.failed} failed.`,
        });
      } else {
        // Fallback: Use WhatsApp Web for any remaining cases
        console.log('Using WhatsApp Web fallback for remaining cases');
        toast({
          title: "Opening WhatsApp",
          description: `Opening WhatsApp for ${reminders.length} parents...`,
        });

        reminders.forEach((reminder, index) => {
          setTimeout(() => {
            const whatsappUrl = aisensyService.createFallbackWhatsAppMessage(reminder);
            window.open(whatsappUrl, '_blank');
            
            // Update status
            setReminderStatuses(prev => {
              const updated = [...prev];
              if (updated[index]) {
                updated[index].status = 'sent';
              }
              return updated;
            });
          }, index * 1000); // Stagger opening to avoid browser blocking
        });

        toast({
          title: "WhatsApp Opened",
          description: "WhatsApp has been opened for all selected parents",
        });
      }

    } catch (error) {
      console.error('Error sending WhatsApp reminders:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      
      // Update all statuses to failed
      setReminderStatuses(prev => prev.map(status => ({
        ...status,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      })));
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send WhatsApp reminders",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: ReminderStatus['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ReminderStatus['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'sent':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
    }
  };

  const totalReminders = reminderStatuses.length;
  const sentCount = reminderStatuses.filter(s => s.status === 'sent').length;
  const failedCount = reminderStatuses.filter(s => s.status === 'failed').length;
  const processingCount = reminderStatuses.filter(s => s.status === 'processing').length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Send WhatsApp Payment Reminders
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Selected Parents:</span>
                <span className="ml-2 font-semibold">{selectedParents.length}</span>
              </div>
              <div>
                <span className="text-blue-700">Total Reminders:</span>
                <span className="ml-2 font-semibold">{totalReminders}</span>
              </div>
              <div>
                <span className="text-blue-700">Sent:</span>
                <span className="ml-2 font-semibold text-green-600">{sentCount}</span>
              </div>
              <div>
                <span className="text-blue-700">Failed:</span>
                <span className="ml-2 font-semibold text-red-600">{failedCount}</span>
              </div>
            </div>
          </div>

          {/* Method Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold">Sending Method</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="method"
                  checked={useAisensy && aisensyService.isConfigured()}
                  onChange={() => {
                    if (aisensyService.isConfigured()) {
                      setUseAisensy(true);
                    }
                  }}
                  disabled={!aisensyService.isConfigured()}
                  className="text-blue-600"
                />
                <span className={!aisensyService.isConfigured() ? 'text-gray-400' : ''}>
                  Aisensy API (Recommended)
                  {!aisensyService.isConfigured() && ' - Not Configured'}
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="method"
                  checked={!useAisensy || !aisensyService.isConfigured()}
                  onChange={() => setUseAisensy(false)}
                  className="text-blue-600"
                />
                <span>WhatsApp Web (Fallback)</span>
              </label>
            </div>
            {!aisensyService.isConfigured() && (
              <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                <strong>Note:</strong> Aisensy API is not configured. WhatsApp Web will be used automatically.
                To configure Aisensy, add VITE_AISENSY_API_KEY to your .env file.
                <br />
                <button 
                  onClick={async () => {
                    console.log('Testing Aisensy configuration...');
                    const isWorking = await aisensyService.testAisensyConnection();
                    toast({
                      title: isWorking ? "Aisensy Working" : "Aisensy Not Working",
                      description: isWorking ? "Aisensy API is working correctly" : "Aisensy API is not working",
                      variant: isWorking ? "default" : "destructive",
                    });
                  }}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  Test Aisensy Connection
                </button>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSendReminders}
              disabled={processing || selectedParents.length === 0}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {processingCount > 0 ? 'Sending...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reminders ({selectedParents.length} parents)
                </>
              )}
            </Button>
          </div>

          {/* Status List */}
          {reminderStatuses.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Reminder Status</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {reminderStatuses.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status.status)}
                      <div>
                        <span className="font-medium">{status.parentName}</span>
                        <span className="text-gray-500 ml-2">({status.childName})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(status.status)}>
                        {status.status}
                      </Badge>
                      {status.error && (
                        <span className="text-xs text-red-600 max-w-xs truncate" title={status.error}>
                          {status.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Payment links are valid until the 9th of next month</li>
              <li>• Parents will receive personalized messages with their child's information</li>
              <li>• Aisensy API requires proper configuration in environment variables</li>
              <li>• WhatsApp Web fallback opens individual chat windows</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkWhatsAppReminderDialog;
