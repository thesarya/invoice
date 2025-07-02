
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNo: string;
  total: number;
  child?: {
    fullNameWithCaseId?: string;
    phone?: string;
  };
}

interface PaymentLinkDialogProps {
  invoice: Invoice;
}

const PaymentLinkDialog: React.FC<PaymentLinkDialogProps> = ({ invoice }) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(invoice.total || 0);
  const [phone, setPhone] = useState(invoice.child?.phone || '');
  const [name, setName] = useState(invoice.child?.fullNameWithCaseId || '');
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generatePaymentLink = async () => {
    if (!phone || phone.length !== 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a customer name",
        variant: "destructive",
      });
      return;
    }

    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock payment link - replace with actual PhonePe API integration
      const mockLink = `https://phonepay.com/pay?amount=${amount}&ref=${invoice.invoiceNo}&name=${encodeURIComponent(name)}&phone=${phone}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(mockLink);
      
      toast({
        title: "Payment Link Generated",
        description: "Link copied to clipboard",
      });

      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate payment link",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-1">
          <Link className="h-3 w-3" />
          Pay Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Payment Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          <div>
            <Label htmlFor="phone-number">Phone Number</Label>
            <Input
              id="phone-number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter 10-digit phone number"
              maxLength={10}
            />
          </div>
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
          <div className="text-sm text-gray-600">
            Invoice: {invoice.invoiceNo}
          </div>
          <Button 
            onClick={generatePaymentLink} 
            disabled={generating}
            className="w-full"
          >
            {generating ? 'Generating...' : 'Generate & Copy Link'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentLinkDialog;
