import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, ExternalLink } from "lucide-react";

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
  const [phone, setPhone] = useState("");
  const [name, setName] = useState(invoice.child?.fullNameWithCaseId || "");
  const [generating, setGenerating] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string>("");
  const { toast } = useToast();

  // Process phone number when component mounts or invoice changes
  useEffect(() => {
    const processPhoneNumber = (phoneNumber: string) => {
      if (!phoneNumber) return "";

      // Remove all non-digit characters
      const digitsOnly = phoneNumber.replace(/\D/g, "");

      // If phone number is 12 digits and starts with 91, remove the 91 prefix
      if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
        return digitsOnly.substring(2);
      }

      // If phone number is already 10 digits or less, return as is
      return digitsOnly.slice(0, 10);
    };

    setPhone(processPhoneNumber(invoice.child?.phone || ""));
  }, [invoice.child?.phone]);

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
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/payments/generate-payment-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            phone,
            name: name.trim(),
            invoiceNo: invoice.invoiceNo,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setPaymentLink(data.data.paymentUrl);

        // Copy to clipboard
        await navigator.clipboard.writeText(data.data.paymentUrl);

        toast({
          title: "Payment Link Generated",
          description: "Link copied to clipboard successfully",
        });
      } else {
        throw new Error(data.message || "Failed to generate payment link");
      }
    } catch (error) {
      console.error("Payment link generation error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate payment link",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
  };

  const openPaymentLink = () => {
    if (paymentLink) {
      window.open(paymentLink, "_blank");
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
              onChange={handlePhoneChange}
              placeholder="Enter 10-digit phone number"
              maxLength={10}
            />
            {phone && phone.length < 10 && (
              <p className="text-xs text-amber-600 mt-1">
                Phone number should be 10 digits
              </p>
            )}
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

          {paymentLink && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700 mb-2">
                Payment link generated successfully!
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={openPaymentLink}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Link
                </Button>
                <Button
                  onClick={() => navigator.clipboard.writeText(paymentLink)}
                  size="sm"
                  variant="outline"
                >
                  Copy Again
                </Button>
              </div>
            </div>
          )}

          <Button
            onClick={generatePaymentLink}
            disabled={generating}
            className="w-full"
          >
            {generating ? "Generating..." : "Generate & Copy Link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentLinkDialog;
