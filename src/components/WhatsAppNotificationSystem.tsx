import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Users, UserX, Bell, Gift, Calendar, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WhatsAppNotificationSystemProps {
  defaultPhone: string;
  studentName: string;
  parentName: string;
  paymentLink?: string;
  isActive: boolean;
  trigger: React.ReactNode;
  centre?: string;
}

type NotificationType = 
  | 'fee_reminder' 
  | 'important_notice' 
  | 'payment_details' 
  | 'online_offer'
  | 'book_consultation';

interface NotificationTemplate {
  id: NotificationType;
  title: string;
  icon: React.ReactNode;
  description: string;
  template: string;
  activeOnly?: boolean;
  inactiveOnly?: boolean;
}

const WhatsAppNotificationSystem: React.FC<WhatsAppNotificationSystemProps> = ({ 
  defaultPhone, 
  studentName, 
  parentName, 
  paymentLink,
  isActive,
  trigger,
  centre = 'Aaryavart Center for Autism'
}) => {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(defaultPhone);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationType>('fee_reminder');
  const [customMessage, setCustomMessage] = useState('');
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const { toast } = useToast();

  const notificationTemplates: NotificationTemplate[] = [
    {
      id: 'fee_reminder',
      title: 'Fee Reminder',
      icon: <CreditCard className="h-4 w-4" />,
      description: 'Send payment reminder with link',
      activeOnly: true,
      template: `Dear ${parentName || 'Parent'},\n\nThis is a reminder for fee payment for ${studentName || 'your child'}.\n\n${paymentLink ? `Payment Link: ${paymentLink}\n\n⚠️ IMPORTANT: This payment link is valid only until 9th of this month.\n\nPlease make the payment before 10th to avoid any inconvenience. If payment is not made before the deadline, you will need to make the payment at the centre.` : 'Please visit the centre for fee payment details.'}\n\nThank you for your cooperation.\n\nBest regards,\n${centre}`
    },
    {
      id: 'important_notice',
      title: 'Important Notice',
      icon: <Bell className="h-4 w-4" />,
      description: 'Send important announcements',
      template: `Dear ${parentName || 'Parent'},\n\nWe have an important notice regarding ${studentName || 'your child'}.\n\n[Please add your important notice here]\n\nFor any queries, please contact us at the centre.\n\nBest regards,\n${centre}`
    },
    {
      id: 'payment_details',
      title: 'Payment Confirmation',
      icon: <CreditCard className="h-4 w-4" />,
      description: 'Send payment confirmation details',
      activeOnly: true,
      template: `Dear ${parentName || 'Parent'},\n\nThank you for the fee payment for ${studentName || 'your child'}.\n\nPayment Details:\n- Amount: [Amount]\n- Date: [Date]\n- Transaction ID: [Transaction ID]\n\nYour payment has been successfully processed. Receipt will be provided at the centre.\n\nThank you for your trust in us.\n\nBest regards,\n${centre}`
    },
    {
      id: 'online_offer',
      title: 'Special Offer',
      icon: <Gift className="h-4 w-4" />,
      description: 'Send special offers and promotions',
      template: `Dear ${parentName || 'Parent'},\n\n🎉 Special Offer Alert! 🎉\n\nWe have an exclusive offer for ${isActive ? studentName || 'your child' : 'you'}!\n\n[Offer Details]\n- Discount: [Percentage/Amount]\n- Valid Until: [Date]\n- Terms: [Terms and Conditions]\n\n${isActive ? 'This offer is specially designed for our active students.' : 'This is a special comeback offer for you!'}\n\nDon\'t miss out on this opportunity!\n\nFor more details, contact us at the centre.\n\nBest regards,\n${centre}`
    },
    {
      id: 'book_consultation',
      title: 'Book Consultation',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Invite for consultation booking',
      inactiveOnly: true,
      template: `Dear ${parentName || 'Parent'},\n\nWe hope you and ${studentName || 'your child'} are doing well.\n\nWe would like to invite you for a consultation to discuss ${studentName || 'your child'}\'s progress and how we can continue to support their development.\n\nConsultation Benefits:\n✅ Personalized assessment\n✅ Updated therapy recommendations\n✅ Progress evaluation\n✅ Family guidance\n\nTo book your consultation:\n📞 Call us at: [Phone Number]\n📧 Email us at: [Email]\n🏢 Visit us at the centre\n\nWe look forward to seeing you soon!\n\nBest regards,\n${centre}`
    }
  ];

  const availableTemplates = notificationTemplates.filter(template => {
    if (template.activeOnly && !isActive) return false;
    if (template.inactiveOnly && isActive) return false;
    return true;
  });

  const handleSendWhatsApp = () => {
    // Clean phone number for WhatsApp
    let cleanPhone = phone;
    if (cleanPhone.startsWith('+91')) {
      cleanPhone = cleanPhone.substring(3);
    }
    if (!cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    }

    // Validate phone number
    if (cleanPhone.length !== 12) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    const selectedTemplateData = availableTemplates.find(t => t.id === selectedTemplate);
    const message = useCustomMessage ? customMessage : selectedTemplateData?.template || '';

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please select a template or enter a custom message",
        variant: "destructive",
      });
      return;
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setOpen(false);
    
    toast({
      title: "WhatsApp Opened",
      description: `${selectedTemplateData?.title || 'Custom message'} sent via WhatsApp`,
    });
  };

  const displayPhone = defaultPhone.startsWith('91') ? defaultPhone.substring(2) : defaultPhone;
  const selectedTemplateData = availableTemplates.find(t => t.id === selectedTemplate);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp Notification System
            <Badge variant={isActive ? "default" : "secondary"} className="ml-2">
              {isActive ? (
                <><Users className="h-3 w-3 mr-1" />Active</>
              ) : (
                <><UserX className="h-3 w-3 mr-1" />Inactive</>
              )}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Contact Details</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Student:</strong> {studentName || 'N/A'}</p>
              <p><strong>Parent:</strong> {parentName || 'N/A'}</p>
              <p><strong>Phone:</strong> {displayPhone}</p>
              <p><strong>Status:</strong> {isActive ? 'Active Student' : 'Inactive Student'}</p>
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter 10-digit phone number"
              className="mt-1"
            />
          </div>

          {/* Template Selection */}
          <div>
            <Label>Notification Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {availableTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setUseCustomMessage(false);
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {template.icon}
                    <span className="font-medium text-sm">{template.title}</span>
                  </div>
                  <p className="text-xs text-gray-600">{template.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Message Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="custom"
              checked={useCustomMessage}
              onChange={(e) => setUseCustomMessage(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="custom" className="text-sm">Use custom message</Label>
          </div>

          {/* Message Preview/Edit */}
          <div>
            <Label>Message {useCustomMessage ? '(Custom)' : '(Preview)'}</Label>
            <textarea
              value={useCustomMessage ? customMessage : selectedTemplateData?.template || ''}
              onChange={(e) => {
                if (useCustomMessage) {
                  setCustomMessage(e.target.value);
                }
              }}
              placeholder={useCustomMessage ? "Enter your custom message..." : "Message preview"}
              className="mt-1 min-h-[200px] w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly={!useCustomMessage}
            />
            {!useCustomMessage && (
              <p className="text-xs text-gray-500 mt-1">
                This is a preview of the selected template. Check "Use custom message" to edit.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSendWhatsApp} className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Send WhatsApp Message
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppNotificationSystem;