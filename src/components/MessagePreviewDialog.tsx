import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Textarea component not available, using regular textarea
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Edit3, Eye, Users, Phone, Mail, CreditCard, Bell, Loader2 } from "lucide-react";
import { aisensyService } from '@/lib/aisensy';

interface MessageRecipient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  childName: string;
  centre?: string;
  paymentLink?: string;
  amount?: number;
}

interface MessageTemplate {
  type: 'notification' | 'fee_reminder' | 'payment';
  title: string;
  icon: React.ReactNode;
  defaultMessage: string;
}

interface MessagePreviewDialogProps {
  recipients: MessageRecipient[];
  messageType: 'notification' | 'fee_reminder' | 'payment';
  trigger: React.ReactNode;
  onSent?: (results: any) => void;
}

const MessagePreviewDialog: React.FC<MessagePreviewDialogProps> = ({
  recipients,
  messageType,
  trigger,
  onSent
}) => {
  const [open, setOpen] = useState(false);
  const [editedRecipients, setEditedRecipients] = useState<MessageRecipient[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [sendingMethod, setSendingMethod] = useState<'api' | 'whatsapp'>('api');
  const [processing, setProcessing] = useState(false);
  const [bulkEdit, setBulkEdit] = useState(false);
  const [bulkName, setBulkName] = useState('');
  const [bulkPhone, setBulkPhone] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const { toast } = useToast();

  const messageTemplates: Record<string, MessageTemplate> = {
    notification: {
      type: 'notification',
      title: 'General Notification',
      icon: <Bell className="h-4 w-4" />,
      defaultMessage: 'Dear {parentName}, this is an important notification regarding {childName} at {centre}. Please contact us if you have any questions.'
    },
    fee_reminder: {
      type: 'fee_reminder',
      title: 'Fee Reminder',
      icon: <CreditCard className="h-4 w-4" />,
      defaultMessage: 'Dear {parentName}, this is a reminder for fee payment for {childName}. Amount: ₹{amount}. {paymentLink ? `Payment Link: ${paymentLink}` : "Please visit our center for payment."}'
    },
    payment: {
      type: 'payment',
      title: 'Payment Information',
      icon: <MessageCircle className="h-4 w-4" />,
      defaultMessage: 'Dear {parentName}, payment information for {childName}. Amount: ₹{amount}. {paymentLink ? `Pay online: ${paymentLink}` : "Please contact us for payment details."}'
    }
  };

  const currentTemplate = messageTemplates[messageType];

  useEffect(() => {
    if (open && recipients.length > 0) {
      setEditedRecipients(recipients.map(r => ({ ...r })));
      setCustomMessage(currentTemplate.defaultMessage);
    }
  }, [open, recipients, currentTemplate.defaultMessage]);

  const formatMessage = (message: string, recipient: MessageRecipient): string => {
    return message
      .replace('{parentName}', recipient.name)
      .replace('{childName}', recipient.childName)
      .replace('{centre}', recipient.centre || 'Aaryavart Center')
      .replace('{amount}', recipient.amount?.toString() || '0')
      .replace('{paymentLink}', recipient.paymentLink || '');
  };

  const updateRecipient = (index: number, field: keyof MessageRecipient, value: string) => {
    const updated = [...editedRecipients];
    updated[index] = { ...updated[index], [field]: value };
    setEditedRecipients(updated);
  };

  const applyBulkChanges = () => {
    const updated = editedRecipients.map(recipient => ({
      ...recipient,
      ...(bulkName && { name: bulkName }),
      ...(bulkPhone && { phone: bulkPhone })
    }));
    setEditedRecipients(updated);
    if (bulkMessage) {
      setCustomMessage(bulkMessage);
    }
    setBulkEdit(false);
    toast({
      title: "Bulk Changes Applied",
      description: "Changes have been applied to all recipients"
    });
  };

  const sendMessages = async () => {
    setProcessing(true);
    try {
      const results = [];
      
      for (const recipient of editedRecipients) {
        const finalMessage = formatMessage(customMessage, recipient);
        
        if (sendingMethod === 'api') {
          // Send via Aisensy API
          try {
            const result = await aisensyService.sendWhatsAppMessage({
              phone: recipient.phone,
              templateId: 'custom_message',
              parameters: {
                parentName: recipient.name,
                childName: recipient.childName,
                message: finalMessage
              }
            });
            results.push({ recipient: recipient.name, status: 'sent', result });
          } catch (error) {
            results.push({ recipient: recipient.name, status: 'failed', error: error.message });
          }
        } else {
          // Open WhatsApp Web
          const cleanPhone = recipient.phone.replace(/[^0-9]/g, '');
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`;
          window.open(whatsappUrl, '_blank');
          results.push({ recipient: recipient.name, status: 'opened', url: whatsappUrl });
        }
        
        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast({
        title: "Messages Processed",
        description: `${results.filter(r => r.status === 'sent' || r.status === 'opened').length} messages processed successfully`
      });
      
      onSent?.(results);
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send some messages",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentTemplate.icon}
            Preview & Edit {currentTemplate.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-900">Message Summary</h3>
              <Badge variant="outline">{editedRecipients.length} Recipients</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Type:</span>
                <span className="ml-2 font-semibold capitalize">{messageType.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-blue-700">Recipients:</span>
                <span className="ml-2 font-semibold">{editedRecipients.length}</span>
              </div>
              <div>
                <span className="text-blue-700">Method:</span>
                <span className="ml-2 font-semibold capitalize">{sendingMethod}</span>
              </div>
              <div>
                <span className="text-blue-700">Status:</span>
                <span className="ml-2 font-semibold text-green-600">Ready</span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Edit Recipients
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Bulk Edit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              {/* Message Template */}
              <div className="space-y-2">
                <Label htmlFor="message">Message Template</Label>
                <textarea
                  id="message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter your message template..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500">
                  Use placeholders: {'{parentName}'}, {'{childName}'}, {'{centre}'}, {'{amount}'}, {'{paymentLink}'}
                </p>
              </div>

              {/* Preview Messages */}
              <div className="space-y-3">
                <h4 className="font-semibold">Message Previews</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {editedRecipients.slice(0, 5).map((recipient, index) => (
                    <div key={recipient.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{recipient.name}</span>
                        <Badge variant="outline" className="text-xs">{recipient.phone}</Badge>
                      </div>
                      <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                        {formatMessage(customMessage, recipient)}
                      </div>
                    </div>
                  ))}
                  {editedRecipients.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      ... and {editedRecipients.length - 5} more recipients
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-3">
                {editedRecipients.map((recipient, index) => (
                  <div key={recipient.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{recipient.childName}</span>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`name-${index}`}>Parent Name</Label>
                        <Input
                          id={`name-${index}`}
                          value={recipient.name}
                          onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`phone-${index}`}>Phone Number</Label>
                        <Input
                          id={`phone-${index}`}
                          value={recipient.phone}
                          onChange={(e) => updateRecipient(index, 'phone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold">Apply Changes to All Recipients</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulk-name">Parent Name (leave empty to keep individual names)</Label>
                    <Input
                      id="bulk-name"
                      value={bulkName}
                      onChange={(e) => setBulkName(e.target.value)}
                      placeholder="e.g., Parent"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bulk-phone">Phone Number (leave empty to keep individual phones)</Label>
                    <Input
                      id="bulk-phone"
                      value={bulkPhone}
                      onChange={(e) => setBulkPhone(e.target.value)}
                      placeholder="e.g., 9999999999"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bulk-message">Message Template (leave empty to keep current)</Label>
                  <textarea
                    id="bulk-message"
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    rows={3}
                    placeholder="Enter new message template for all recipients..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <Button onClick={applyBulkChanges} className="w-full">
                  Apply to All Recipients
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Sending Options */}
          <div className="space-y-4">
            <h4 className="font-semibold">Sending Method</h4>
            <div className="flex gap-4">
              <Button
                variant={sendingMethod === 'api' ? 'default' : 'outline'}
                onClick={() => setSendingMethod('api')}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send via API
              </Button>
              <Button
                variant={sendingMethod === 'whatsapp' ? 'default' : 'outline'}
                onClick={() => setSendingMethod('whatsapp')}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Open WhatsApp
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              {sendingMethod === 'api' 
                ? 'Messages will be sent automatically via Aisensy API' 
                : 'WhatsApp Web will open for each recipient (manual sending)'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={sendMessages}
              disabled={processing || editedRecipients.length === 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send {currentTemplate.title} ({editedRecipients.length})
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagePreviewDialog;
export type { MessageRecipient };