export interface RazorpayCustomer {
  name: string;
  contact: string;
  email: string;
}

export interface RazorpayNotify {
  sms: boolean;
  email: boolean;
}

export interface RazorpayNotes {
  [key: string]: string;
}

export interface CreatePaymentLinkRequest {
  upi_link?: boolean;
  amount: number;
  currency?: string;
  accept_partial?: boolean;
  first_min_partial_amount?: number;
  expire_by?: number;
  reference_id?: string;
  description?: string;
  customer: RazorpayCustomer;
  notify: RazorpayNotify;
  reminder_enable?: boolean;
  notes?: RazorpayNotes;
  callback_url?: string;
  callback_method?: string;
}

export interface PaymentLinkResponse {
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
  customer: RazorpayCustomer;
  notify: RazorpayNotify;
  reminder_enable: boolean;
  notes: RazorpayNotes;
  callback_url: string;
  callback_method: string;
  created_at: number;
  updated_at: number;
  status?: string;
}

export interface ResendNotificationResponse {
  success: boolean;
}

class RazorpayService {
  private baseUrl: string;
  private keyId: string;
  private keySecret: string;

  constructor() {
    this.keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
    this.keySecret = import.meta.env.VITE_RAZORPAY_KEY_SECRET || '';
    
    // Always use proxy to avoid CORS issues
    this.baseUrl = '/api/razorpay';
    
    if (!this.keyId || !this.keySecret) {
      console.warn('Razorpay API keys not found in environment variables');
    }
  }

  private getAuthHeader(): string {
    const credentials = btoa(`${this.keyId}:${this.keySecret}`);
    return `Basic ${credentials}`;
  }

  async createPaymentLink(data: CreatePaymentLinkRequest): Promise<PaymentLinkResponse> {
    const response = await fetch(`${this.baseUrl}/payment_links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.description || 'Failed to create payment link');
    }

    return response.json();
  }

  async updatePaymentLink(paymentLinkId: string, data: Partial<CreatePaymentLinkRequest>): Promise<PaymentLinkResponse> {
    const response = await fetch(`${this.baseUrl}/payment_links/${paymentLinkId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.description || 'Failed to update payment link');
    }

    return response.json();
  }

  async resendNotification(paymentLinkId: string, medium: 'sms' | 'email'): Promise<ResendNotificationResponse> {
    const response = await fetch(`${this.baseUrl}/payment_links/${paymentLinkId}/notify_by/${medium}`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.description || `Failed to resend ${medium} notification`);
    }

    return response.json();
  }

  async getPaymentLink(paymentLinkId: string): Promise<PaymentLinkResponse> {
    const response = await fetch(`${this.baseUrl}/payment_links/${paymentLinkId}`, {
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.description || 'Failed to fetch payment link');
    }

    return response.json();
  }

  // Method to get all payment links (to find existing ones for an invoice)
  async getAllPaymentLinks(): Promise<{ items: PaymentLinkResponse[] }> {
    const response = await fetch(`${this.baseUrl}/payment_links`, {
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.description || 'Failed to fetch payment links');
    }

    return response.json();
  }

  // Method to find existing payment link for an invoice
  async findPaymentLinkByInvoice(invoiceNo: string): Promise<PaymentLinkResponse | null> {
    try {
      const response = await this.getAllPaymentLinks();
      const paymentLink = response.items.find(link => 
        link.notes?.invoice_no === invoiceNo && 
        link.status !== 'cancelled'
      );
      return paymentLink || null;
    } catch (error) {
      console.error('Error finding payment link by invoice:', error);
      return null;
    }
  }

  async cancelPaymentLink(paymentLinkId: string): Promise<PaymentLinkResponse> {
    const response = await fetch(`${this.baseUrl}/payment_links/${paymentLinkId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.description || 'Failed to cancel payment link');
    }

    return response.json();
  }

  // Helper method to create a payment link for an invoice
  async createInvoicePaymentLink(invoice: {
    id: string;
    invoiceNo: string;
    total: number;
    child?: {
      fullNameWithCaseId?: string;
      phone?: string;
      email?: string;
    };
  }, customerData: {
    name: string;
    phone: string;
    email: string;
    amount: number; // Add amount parameter
  }): Promise<PaymentLinkResponse> {
    const expireBy = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now

    // Clean phone number (remove +91 or 91 prefix)
    let cleanPhone = customerData.phone;
    if (cleanPhone.startsWith('+91')) {
      cleanPhone = cleanPhone.substring(3);
    }
    if (cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.substring(2);
    }

    // Ensure phone number is 10 digits
    if (cleanPhone.length !== 10) {
      cleanPhone = '9999999999'; // Default phone if invalid
    }

    // Use default email if not provided or invalid
    const email = customerData.email && customerData.email.includes('@') 
      ? customerData.email 
      : 'payment@aaryavart.com';

    // Create unique reference_id to avoid conflicts
    const timestamp = Date.now();
    const uniqueReferenceId = `${invoice.invoiceNo}_${timestamp}`;

    const paymentLinkData: CreatePaymentLinkRequest = {
      upi_link: false, // Set to false to enable all payment methods (UPI, cards, netbanking, etc.)
      amount: customerData.amount * 100, // Use the amount from form, convert to paise
      currency: 'INR',
      accept_partial: false,
      expire_by: expireBy,
      reference_id: uniqueReferenceId,
      description: `Payment for invoice #${invoice.invoiceNo}`,
      customer: {
        name: customerData.name,
        contact: cleanPhone,
        email: email,
      },
      notify: {
        sms: true,
        email: email !== 'payment@aaryavart.com', // Only send email if it's a real email
      },
      reminder_enable: true,
      notes: {
        invoice_id: invoice.id,
        invoice_no: invoice.invoiceNo,
        policy_name: 'Kidaura Care',
      },
      callback_url: `${window.location.origin}/payment-callback`,
      callback_method: 'get',
    };

    return this.createPaymentLink(paymentLinkData);
  }
}

export const razorpayService = new RazorpayService(); 