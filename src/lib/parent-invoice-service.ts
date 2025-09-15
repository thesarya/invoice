import { razorpayService } from './razorpay';

interface Parent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  children: Child[];
  centre: string;
}

interface Child {
  id: string;
  fullNameWithCaseId: string;
  isActive: boolean;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  total: number;
  invoiceStatus: string;
  child: {
    id: string;
    fullNameWithCaseId: string;
    fatherName: string;
    phone: string;
    email?: string;
  };
}

interface ParentInvoiceData {
  parent: Parent;
  invoices: Invoice[];
  paymentLinks: { [invoiceId: string]: string };
}

class ParentInvoiceService {
  private API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://care.kidaura.in/api/graphql';
  
  private tokens = {
    gkp: import.meta.env.VITE_GKP_TOKEN,
    lko: import.meta.env.VITE_LKO_TOKEN
  };

  /**
   * Fetch invoices for selected parents
   */
  async fetchInvoicesForParents(parents: Parent[]): Promise<ParentInvoiceData[]> {
    const results: ParentInvoiceData[] = [];

    for (const parent of parents) {
      try {
        const invoices = await this.fetchInvoicesForParent(parent);
        results.push({
          parent,
          invoices,
          paymentLinks: {}
        });
      } catch (error) {
        console.error(`Error fetching invoices for parent ${parent.name}:`, error);
        // Still add the parent with empty invoices
        results.push({
          parent,
          invoices: [],
          paymentLinks: {}
        });
      }
    }

    return results;
  }

  /**
   * Fetch invoices for a single parent
   */
  private async fetchInvoicesForParent(parent: Parent): Promise<Invoice[]> {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const paddedMonth = String(month).padStart(2, '0');
    const start = `${year}-${paddedMonth}-01T00:00:00.000Z`;
    const end = month < 12
      ? `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00.000Z`
      : `${year + 1}-01-01T00:00:00.000Z`;

    // Get child IDs for this parent
    const childIds = parent.children.map(child => child.id);

    const query = `
      query Invoices($startDate: DateTime, $endDate: DateTime, $childId: ID, $status: [InvoiceStatus], $paymentMode: PaymentMode) {
        invoices(
          startDate: $startDate
          endDate: $endDate
          childId: $childId
          status: $status
          paymentMode: $paymentMode
        ) {
          id
          invoiceNo
          total
          invoiceStatus
          createdAt
          invoiceDate
          child {
            id
            fullNameWithCaseId
            fatherName
            phone
            email
          }
        }
      }
    `;

    const allInvoices: Invoice[] = [];

    // Fetch invoices for each child
    for (const childId of childIds) {
      try {
        const response = await fetch(`${this.API_BASE_URL}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tokens[parent.centre as keyof typeof this.tokens]}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query,
            variables: { 
              startDate: start, 
              endDate: end, 
              childId: childId, 
              status: null, 
              paymentMode: null 
            }
          })
        });

        const data = await response.json();
        const invoices = data?.data?.invoices || [];
        
        // Filter invoices for this specific child and add centre info
        const childInvoices = invoices
          .filter((invoice: any) => invoice.child?.id === childId)
          .map((invoice: any) => ({
            ...invoice,
            centre: parent.centre
          }));
        
        allInvoices.push(...childInvoices);
      } catch (error) {
        console.error(`Error fetching invoices for child ${childId}:`, error);
      }
    }

    return allInvoices;
  }

  /**
   * Generate payment links for all invoices of selected parents
   */
  async generatePaymentLinksForParents(parentInvoiceData: ParentInvoiceData[]): Promise<ParentInvoiceData[]> {
    const results = [...parentInvoiceData];

    console.log('Starting payment link generation for parents...');

    for (const parentData of results) {
      const paymentLinks: { [invoiceId: string]: string } = {};

      console.log(`Generating payment links for parent: ${parentData.parent.name} (${parentData.invoices.length} invoices)`);

      for (const invoice of parentData.invoices) {
        try {
          // EXACT same logic as working BulkPaymentLinkDialog
          // Clean phone number (remove +91 if present)
          let phone = invoice.child?.phone || '';
          if (phone.startsWith('+91')) {
            phone = phone.substring(3);
          }
          if (phone.startsWith('91')) {
            phone = phone.substring(2);
          }

          // Use default email if not provided
          const email = invoice.child?.email || 'payment@aaryavart.com';

          const response = await razorpayService.createInvoicePaymentLink(invoice, {
            name: invoice.child?.fullNameWithCaseId || 'Customer',
            phone: phone || '9999999999', // Default phone if missing
            email: email,
            amount: invoice.total > 0 ? invoice.total : 1, // Minimum ₹1
          });

          paymentLinks[invoice.id] = response.short_url;
          console.log(`Payment link created successfully for invoice ${invoice.invoiceNo}: ${response.short_url}`);
        } catch (error) {
          console.error(`Error generating payment link for invoice ${invoice.invoiceNo}:`, error);
          // Continue with other invoices even if one fails
        }
      }

      parentData.paymentLinks = paymentLinks;
      console.log(`Payment links for ${parentData.parent.name}:`, Object.keys(paymentLinks).length, 'links created');
    }

    return results;
  }

  /**
   * Prepare reminder data for WhatsApp sending
   */
  prepareReminderData(parentInvoiceData: ParentInvoiceData[]): Array<{
    phone: string;
    parentName: string;
    childName: string;
    paymentLink: string;
    amount: number;
    dueDate: string;
  }> {
    const reminders: Array<{
      phone: string;
      parentName: string;
      childName: string;
      paymentLink: string;
      amount: number;
      dueDate: string;
    }> = [];

    console.log(`Preparing reminder data for ${parentInvoiceData.length} parents`);

    for (const parentData of parentInvoiceData) {
      const { parent, invoices, paymentLinks } = parentData;

      console.log(`Processing parent: ${parent.name} with ${invoices.length} invoices and ${Object.keys(paymentLinks).length} payment links`);

      // Group invoices by child
      const childInvoices = new Map<string, Invoice[]>();
      invoices.forEach(invoice => {
        const childId = invoice.child.id;
        if (!childInvoices.has(childId)) {
          childInvoices.set(childId, []);
        }
        childInvoices.get(childId)!.push(invoice);
      });

      console.log(`Grouped invoices into ${childInvoices.size} children`);

      // Create reminder for each child
      for (const [childId, childInvoiceList] of childInvoices) {
        const child = parent.children.find(c => c.id === childId);
        if (!child) {
          console.warn(`Child with ID ${childId} not found in parent's children list`);
          continue;
        }

        // Calculate total amount for this child
        const totalAmount = childInvoiceList.reduce((sum, invoice) => sum + invoice.total, 0);
        
        // Get the first available payment link for this child
        const firstInvoice = childInvoiceList[0];
        const paymentLink = paymentLinks[firstInvoice.id];

        console.log(`Child: ${child.fullNameWithCaseId}, Invoices: ${childInvoiceList.length}, Total Amount: ${totalAmount}, Payment Link: ${paymentLink ? 'Available' : 'Missing'}`);

        // Calculate due date (10th of next month)
        const currentDate = new Date();
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 10);
        const dueDate = nextMonth.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        // Use payment link if available, otherwise use a fallback message
        const finalPaymentLink = paymentLink || 'Please contact the center for payment details';

        reminders.push({
          phone: parent.phone,
          parentName: parent.name,
          childName: child.fullNameWithCaseId,
          paymentLink: finalPaymentLink,
          amount: totalAmount,
          dueDate
        });

        console.log(`Added reminder for ${parent.name} - ${child.fullNameWithCaseId} (${paymentLink ? 'with payment link' : 'without payment link'})`);
      }
    }

    console.log(`Total reminders prepared: ${reminders.length}`);
    return reminders;
  }
}

export const parentInvoiceService = new ParentInvoiceService();
export type { Parent, Child, Invoice, ParentInvoiceData };
