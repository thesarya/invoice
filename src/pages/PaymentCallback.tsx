import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface PaymentStatus {
  status: 'success' | 'failed' | 'pending' | 'processing';
  message: string;
  paymentId?: string;
  amount?: number;
  referenceId?: string;
}

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processPaymentCallback = async () => {
      try {
        // Get parameters from URL
        const razorpayPaymentId = searchParams.get('razorpay_payment_id');
        const razorpayPaymentLinkId = searchParams.get('razorpay_payment_link_id');
        const razorpayPaymentLinkReferenceId = searchParams.get('razorpay_payment_link_reference_id');
        const razorpayPaymentLinkStatus = searchParams.get('razorpay_payment_link_status');
        const razorpaySignature = searchParams.get('razorpay_signature');

        console.log('Payment callback parameters:', {
          razorpayPaymentId,
          razorpayPaymentLinkId,
          razorpayPaymentLinkReferenceId,
          razorpayPaymentLinkStatus,
          razorpaySignature
        });

        // Determine payment status based on parameters
        let status: PaymentStatus;

        if (razorpayPaymentLinkStatus === 'paid') {
          status = {
            status: 'success',
            message: 'Payment completed successfully!',
            paymentId: razorpayPaymentId || undefined,
            referenceId: razorpayPaymentLinkReferenceId || undefined,
          };
        } else if (razorpayPaymentLinkStatus === 'cancelled') {
          status = {
            status: 'failed',
            message: 'Payment was cancelled by the user.',
            referenceId: razorpayPaymentLinkReferenceId || undefined,
          };
        } else if (razorpayPaymentLinkStatus === 'expired') {
          status = {
            status: 'failed',
            message: 'Payment link has expired.',
            referenceId: razorpayPaymentLinkReferenceId || undefined,
          };
        } else {
          status = {
            status: 'pending',
            message: 'Payment is being processed. Please wait...',
            referenceId: razorpayPaymentLinkReferenceId || undefined,
          };
        }

        setPaymentStatus(status);
      } catch (error) {
        console.error('Error processing payment callback:', error);
        setPaymentStatus({
          status: 'failed',
          message: 'An error occurred while processing the payment.',
        });
      } finally {
        setLoading(false);
      }
    };

    processPaymentCallback();
  }, [searchParams]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'failed':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'pending':
        return <Clock className="h-12 w-12 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="h-12 w-12 text-blue-500" />;
      default:
        return <AlertCircle className="h-12 w-12 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {paymentStatus && getStatusIcon(paymentStatus.status)}
          </div>
          <CardTitle className="text-xl">
            {paymentStatus?.status === 'success' ? 'Thank You!' : 'Payment Status'}
          </CardTitle>
          <CardDescription>
            {paymentStatus?.status === 'success' 
              ? "Thank you for paying on time! It's great to have you as part of our community." 
              : paymentStatus?.message
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentStatus && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                {getStatusBadge(paymentStatus.status)}
              </div>
              
              {paymentStatus.paymentId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Payment ID:</span>
                  <span className="text-sm font-mono">{paymentStatus.paymentId}</span>
                </div>
              )}
              
              {paymentStatus.referenceId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Reference ID:</span>
                  <span className="text-sm font-mono">{paymentStatus.referenceId}</span>
                </div>
              )}
              
              {paymentStatus.amount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Amount:</span>
                  <span className="text-sm font-semibold">
                    ₹{paymentStatus.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 space-y-2">
            {paymentStatus?.status === 'success' && (
              <>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-lg mb-2">Stay Connected!</h3>
                  <p className="text-sm mb-3">Follow us on Instagram for updates, tips, and community stories.</p>
                  <Button 
                    onClick={() => window.open('https://www.instagram.com/aaryavartcenterforautism/', '_blank')}
                    className="w-full bg-white text-purple-600 hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Follow @aaryavartcenterforautism
                  </Button>
                </div>

              </>
            )}
            

          </div>

          {paymentStatus?.status === 'failed' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                If you believe this is an error, please contact our support team with your reference ID.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback; 