interface AisensyConfig {
  apiKey: string;
  baseUrl: string;
  templateId: string;
  templateName?: string; // Alternative to template ID
}

interface WhatsAppMessage {
  phone: string;
  templateId: string;
  parameters: {
    [key: string]: string;
  };
}

interface AisensyResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface AisensyTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
}

interface AisensyTemplatesResponse {
  templates: AisensyTemplate[];
}

class AisensyService {
  private config: AisensyConfig;
  private cachedTemplateId: string | null = null;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_AISENSY_API_KEY || '',
      baseUrl: import.meta.env.VITE_AISENSY_BASE_URL || 'https://backend.aisensy.com/campaign/t1/api',
      templateId: import.meta.env.VITE_AISENSY_TEMPLATE_ID || 'payment_reminder_template',
      templateName: import.meta.env.VITE_AISENSY_TEMPLATE_NAME || 'fees_payment_remind'
    };

    if (!this.config.apiKey) {
      console.warn('Aisensy API key not configured. WhatsApp reminders will use fallback mode.');
      console.warn('Please set VITE_AISENSY_API_KEY in your .env file to use Aisensy API.');
      console.warn('Current VITE_AISENSY_API_KEY value:', import.meta.env.VITE_AISENSY_API_KEY ? 'Set' : 'Not set');
      console.warn('Environment variables available:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_AISENSY')));
      console.warn('All environment variables:', Object.keys(import.meta.env));
    } else {
      console.log('Aisensy API key is configured and ready to use.');
      console.log('API Key (first 20 chars):', this.config.apiKey.substring(0, 20) + '...');
    }
  }

  /**
   * Check if Aisensy is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Test Aisensy API connection
   */
  async testAisensyConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('Aisensy not configured - cannot test connection');
      return false;
    }

    try {
      console.log('Testing Aisensy API connection...');
      console.log('Base URL:', this.config.baseUrl);
      console.log('Template Name:', this.config.templateName);
      
      // Try to fetch templates to test the connection
      const response = await fetch(`${this.config.baseUrl}/templates`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Aisensy test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Aisensy API connection successful');
        console.log('Available templates:', data);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Aisensy API test failed:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Aisensy API test error:', error);
      return false;
    }
  }

  /**
   * Fetch all templates from Aisensy API
   */
  async fetchTemplates(): Promise<AisensyTemplatesResponse> {
    if (!this.config.apiKey) {
      throw new Error('Aisensy API key not configured');
    }

    try {
      const response = await fetch('https://app.aisensy.com/api/get-templates', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch templates');
      }

      return data;
    } catch (error) {
      console.error('Aisensy Templates API Error:', error);
      throw error;
    }
  }

  /**
   * Get template ID by template name
   */
  async getTemplateId(templateName?: string): Promise<string> {
    // Return cached template ID if available
    if (this.cachedTemplateId) {
      return this.cachedTemplateId;
    }

    const searchName = templateName || this.config.templateName;
    
    try {
      const templatesResponse = await this.fetchTemplates();
      const templates = templatesResponse.templates || [];
      
      // Find template by name (case-insensitive, partial match)
      const template = templates.find(t => 
        t.name.toLowerCase().includes(searchName.toLowerCase()) ||
        searchName.toLowerCase().includes(t.name.toLowerCase())
      );

      if (template && template.status === 'approved') {
        this.cachedTemplateId = template.id;
        console.log(`Found template: ${template.name} with ID: ${template.id}`);
        return template.id;
      }

      // If exact match not found, try to find any approved template
      const approvedTemplate = templates.find(t => t.status === 'approved');
      if (approvedTemplate) {
        this.cachedTemplateId = approvedTemplate.id;
        console.log(`Using approved template: ${approvedTemplate.name} with ID: ${approvedTemplate.id}`);
        return approvedTemplate.id;
      }

      throw new Error(`No approved template found with name containing: ${searchName}`);
    } catch (error) {
      console.error('Error fetching template ID:', error);
      // Fallback to configured template ID
      return this.config.templateId;
    }
  }

  /**
   * Send WhatsApp message using Aisensy API
   */
  async sendWhatsAppMessage(message: WhatsAppMessage): Promise<AisensyResponse> {
    if (!this.config.apiKey) {
      throw new Error('Aisensy API key not configured');
    }

    try {
      // Get the actual template ID dynamically
      const actualTemplateId = await this.getTemplateId();
      
      const response = await fetch(`${this.config.baseUrl}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          phone: message.phone,
          templateId: actualTemplateId,
          parameters: message.parameters
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send WhatsApp message');
      }

      return {
        success: true,
        messageId: data.messageId
      };
    } catch (error) {
      console.error('Aisensy API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send bulk WhatsApp messages for payment reminders
   */
  async sendBulkPaymentReminders(reminders: Array<{
    phone: string;
    parentName: string;
    childName: string;
    paymentLink: string;
    amount: number;
    dueDate: string;
  }>): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const reminder of reminders) {
      try {
        // Clean phone number (ensure it starts with country code)
        let cleanPhone = reminder.phone;
        if (cleanPhone.startsWith('+91')) {
          cleanPhone = cleanPhone.substring(3);
        }
        if (!cleanPhone.startsWith('91')) {
          cleanPhone = '91' + cleanPhone;
        }

        const message: WhatsAppMessage = {
          phone: cleanPhone,
          templateId: await this.getTemplateId(), // Get dynamic template ID
          parameters: {
            parent_name: reminder.parentName,
            child_name: reminder.childName,
            amount: `₹${reminder.amount.toLocaleString('en-IN')}`,
            payment_link: reminder.paymentLink,
            due_date: reminder.dueDate,
            centre_name: 'Aaryavart Centre for Autism'
          }
        };

        const result = await this.sendWhatsAppMessage(message);
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${reminder.parentName}: ${result.error}`);
        }

        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
        results.errors.push(`${reminder.parentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Create a fallback WhatsApp message (direct WhatsApp Web link)
   * This is used when Aisensy API is not available
   */
  createFallbackWhatsAppMessage(reminder: {
    phone: string;
    parentName: string;
    childName: string;
    paymentLink: string;
    amount: number;
    dueDate: string;
  }): string {
    const cleanPhone = reminder.phone.startsWith('91') ? reminder.phone : `91${reminder.phone}`;
    
    const message = `Dear ${reminder.parentName},

This is a payment reminder for ${reminder.childName}'s fees at Aaryavart Centre for Autism.

💰 Amount: ₹${reminder.amount.toLocaleString('en-IN')}
📅 Due Date: ${reminder.dueDate}
🔗 Payment Link: ${reminder.paymentLink}

⚠️ IMPORTANT: Please make the payment before the due date to avoid any inconvenience.

Thank you for your cooperation.

Best regards,
Aaryavart Centre Team`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
}

export const aisensyService = new AisensyService();
export type { WhatsAppMessage, AisensyResponse };
