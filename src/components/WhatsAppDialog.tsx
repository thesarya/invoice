import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send } from "lucide-react";

interface WhatsAppDialogProps {
  defaultPhone: string;
  studentName: string;
  parentName: string;
  paymentLink: string;
  trigger: React.ReactNode;
}

const WhatsAppDialog: React.FC<WhatsAppDialogProps> = ({ 
  defaultPhone, 
  studentName, 
  parentName, 
  paymentLink, 
  trigger 
}) => {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(defaultPhone);
  const { toast } = useToast();

  const handleSendWhatsApp = () => {
    // Clean phone number for WhatsApp (always ensure 91 prefix)
    let cleanPhone = phone;
    if (cleanPhone.startsWith('+91')) {
      cleanPhone = cleanPhone.substring(3);
    }
    if (!cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    }

    // Validate phone number
    if (cleanPhone.length !== 12) { // 91 + 10 digits
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
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
    setOpen(false);
    
    toast({
      title: "WhatsApp Opened",
      description: "WhatsApp has been opened with the payment reminder message",
    });
  };

  // Clean phone number for display (remove 91 prefix)
  const displayPhone = defaultPhone.startsWith('91') ? defaultPhone.substring(2) : defaultPhone;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Send WhatsApp Payment Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2">Payment Reminder Details</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Student:</strong> {studentName || 'N/A'}</p>
              <p><strong>Parent:</strong> {parentName || 'N/A'}</p>
              <p><strong>Payment Link:</strong> {paymentLink}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone.startsWith('91') ? phone.substring(2) : phone}
              onChange={(e) => {
                const value = e.target.value;
                // Add 91 prefix if not present
                setPhone(value.startsWith('91') ? value : '91' + value);
              }}
              placeholder="Enter 10-digit phone number"
              maxLength={12}
            />
            <p className="text-xs text-gray-500 mt-1">
              Current: {displayPhone} • WhatsApp will use: 91{displayPhone}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-medium text-yellow-800 mb-2">Message Preview</h4>
            <div className="text-sm text-yellow-700">
              <p>Dear {parentName || 'Parent'},</p>
              <p>This is a reminder for payment for {studentName || 'your child'}.</p>
              <p>Payment Link: {paymentLink}</p>
              <p>⚠️ IMPORTANT: This payment link is valid only until 9th of this month.</p>
              <p>Please make the payment before 10th to avoid any inconvenience.</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSendWhatsApp}
              className="flex-1 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send WhatsApp Message
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppDialog; 