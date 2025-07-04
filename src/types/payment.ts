// Payment-related type definitions

export interface Customer {
  name: string;
  contact: string;
  email: string;
}

export interface PaymentNotification {
  sms: boolean;
  email: boolean;
}

export interface PaymentNotes {
  [key: string]: string;
}

export interface PaymentLink {
  id: string;
  short_url: string;
  view_less: boolean;
  amount: number;
  currency: string;
  accept_partial: boolean;
  first_min_partial_amount: number;
  expire_by: number;
  reference_id: string;
  description: string;
  customer: Customer;
  notify: PaymentNotification;
  reminder_enable: boolean;
  notes: PaymentNotes;
  callback_url: string;
  callback_method: string;
  created_at: number;
  updated_at: number;
}

export interface PaymentStatus {
  status: 'success' | 'failed' | 'pending' | 'processing';
  message: string;
  paymentId?: string;
  amount?: number;
  referenceId?: string;
}

export interface PaymentLinkFormData {
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  description: string;
  expiryDays: number;
  reminderEnabled: boolean;
  notifySMS: boolean;
  notifyEmail: boolean;
}

export interface PaymentLinkUpdateData {
  amount?: number;
  description?: string;
  customer?: Customer;
  notify?: PaymentNotification;
  reminder_enable?: boolean;
  expire_by?: number;
}

// Payment callback parameters from Razorpay
export interface PaymentCallbackParams {
  razorpay_payment_id?: string;
  razorpay_payment_link_id?: string;
  razorpay_payment_link_reference_id?: string;
  razorpay_payment_link_status?: string;
  razorpay_signature?: string;
}

// Error types
export interface RazorpayError {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: Record<string, unknown>;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface NotificationResponse {
  success: boolean;
} 