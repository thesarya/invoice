import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Filter, Phone, Mail, CheckCircle, FileText as DraftIcon, Clock, Layers, Copy, MessageCircle } from "lucide-react";
import PaymentLinkDialog from './PaymentLinkDialog';
import BulkPaymentLinkWithWhatsAppDialog from './BulkPaymentLinkWithWhatsAppDialog';
import BulkReportDialog from './BulkReportDialog';
import WhatsAppDialog from './WhatsAppDialog';
import ChildReportDialog from './ChildReportDialog';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  invoiceNo: string;
  paymentMode: string;
  createdAt: string;
  invoiceStatus: string;
  total: number;
  invoiceDate: string;
  child?: {
    fullNameWithCaseId?: string;
    fatherName?: string;
    phone?: string;
    email?: string;
  };
  centre?: string;
}

interface InvoiceTableProps {
  filteredInvoices: Invoice[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  showConsolidated: boolean;
  centres: { [key: string]: string };
  tokens: { [key: string]: string };
  selectedInvoiceIds: string[];
  setSelectedInvoiceIds: (ids: string[]) => void;
  onBulkSend: () => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  filteredInvoices,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  showConsolidated,
  centres,
  tokens,
  selectedInvoiceIds,
  setSelectedInvoiceIds,
  onBulkSend
}) => {
  const [openDialogId, setOpenDialogId] = React.useState<string | null>(null);
  const [dialogInvoice, setDialogInvoice] = React.useState<Invoice | null>(null);
  const [dialogLoading, setDialogLoading] = React.useState(false);
  const [paymentLinks, setPaymentLinks] = React.useState<{[key: string]: string}>({});
  const [generatedReports, setGeneratedReports] = React.useState<{[key: string]: { htmlContent: string; aiInsights: string; childNotes: unknown[] }}>({});
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const color = status?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    return <Badge className={color}>{status || 'Unknown'}</Badge>;
  };

  const allSelected = filteredInvoices.length > 0 && filteredInvoices.every(inv => selectedInvoiceIds.includes(inv.id));
  console.log("allSelected",filteredInvoices)
  const toggleSelectAll = () => {
    if (allSelected) setSelectedInvoiceIds([]);
    else setSelectedInvoiceIds(filteredInvoices.map(inv => inv.id));
  };
  const toggleSelect = (id: string) => {
    setSelectedInvoiceIds(selectedInvoiceIds.includes(id)
      ? selectedInvoiceIds.filter(i => i !== id)
      : [...selectedInvoiceIds, id]);
  };

  const handleOpenDialog = async (id: string) => {
    setOpenDialogId(id);
    setDialogLoading(true);
    try {
      const invoice = filteredInvoices.find(inv => inv.id === id);
      const centreKey = invoice?.centre || Object.keys(tokens)[0];
      const query = `
        query Invoice($id: ID!) {
          invoice(id: $id) {
            id
            invoiceNo
            invoiceStatus
            paymentMode
            createdAt
            total
            invoiceDate
            child { fullNameWithCaseId }
          }
        }
      `;
      const response = await fetch('https://care.kidaura.in/api/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens[centreKey as keyof typeof tokens]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, variables: { id } })
      });
      const data = await response.json();
      setDialogInvoice(data?.data?.invoice);
    } catch (e) {
      setDialogInvoice(null);
    } finally {
      setDialogLoading(false);
    }
  };
  const handleCloseDialog = () => {
    setOpenDialogId(null);
    setDialogInvoice(null);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Invoice Details
            </CardTitle>
            <CardDescription>Detailed view of all invoices</CardDescription>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-64"
            />
            <div className="flex gap-2">
              {[
                { 
                  label: 'All', 
                  value: 'all', 
                  icon: Layers,
                  activeBg: 'bg-gradient-to-r from-indigo-500 to-purple-600',
                  inactiveBg: 'bg-gradient-to-r from-gray-100 to-gray-200',
                  activeText: 'text-white',
                  inactiveText: 'text-gray-700',
                  border: 'border-gray-300'
                },
                { 
                  label: 'Paid', 
                  value: 'paid', 
                  icon: CheckCircle,
                  activeBg: 'bg-gradient-to-r from-green-500 to-emerald-600',
                  inactiveBg: 'bg-gradient-to-r from-green-50 to-emerald-50',
                  activeText: 'text-white',
                  inactiveText: 'text-green-700',
                  border: 'border-green-200'
                },
                { 
                  label: 'Draft', 
                  value: 'draft', 
                  icon: DraftIcon,
                  activeBg: 'bg-gradient-to-r from-yellow-500 to-orange-600',
                  inactiveBg: 'bg-gradient-to-r from-yellow-50 to-orange-50',
                  activeText: 'text-white',
                  inactiveText: 'text-yellow-700',
                  border: 'border-yellow-200'
                },
                { 
                  label: 'Open', 
                  value: 'open', 
                  icon: Clock,
                  activeBg: 'bg-gradient-to-r from-blue-500 to-cyan-600',
                  inactiveBg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
                  activeText: 'text-white',
                  inactiveText: 'text-blue-700',
                  border: 'border-blue-200'
                },
              ].map((status) => {
                const IconComponent = status.icon;
                const isActive = statusFilter === status.value;
                return (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`
                      relative px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 
                      flex items-center gap-2 shadow-sm hover:shadow-md transform hover:scale-105
                      ${isActive 
                        ? `${status.activeBg} ${status.activeText} border-transparent shadow-lg` 
                        : `${status.inactiveBg} ${status.inactiveText} ${status.border} hover:shadow-md`
                      }
                    `}
                    type="button"
                  >
                    <IconComponent className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                    {status.label}
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-current"></div>
                    )}
                  </button>
                );
              })}
            </div>
            
            
            <BulkPaymentLinkWithWhatsAppDialog
              selectedInvoices={filteredInvoices.filter(inv => selectedInvoiceIds.includes(inv.id))}
              trigger={
                <button
                  className={`
                    relative px-4 py-2 rounded-lg font-medium transition-all duration-200 
                    flex items-center gap-2 shadow-sm hover:shadow-md transform hover:scale-105
                    ${selectedInvoiceIds.length === 0
                      ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                    }
                  `}
                  disabled={selectedInvoiceIds.length === 0}
                >
                  <MessageCircle className="h-4 w-4" />
                  send whatspp fees reminder ({selectedInvoiceIds.length})
                </button>
              }
            />
            <BulkReportDialog 
              selectedInvoices={filteredInvoices.filter(inv => selectedInvoiceIds.includes(inv.id))}
              onReportsGenerated={(reports) => {
                setGeneratedReports(prev => ({
                  ...prev,
                  ...reports
                }));
              }}
            />
            <button
              className={`
                relative px-4 py-2 rounded-lg font-medium transition-all duration-200 
                flex items-center gap-2 shadow-sm hover:shadow-md transform hover:scale-105
                ${selectedInvoiceIds.length === 0
                  ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700'
                }
              `}
              onClick={onBulkSend}
              disabled={selectedInvoiceIds.length === 0}
            >
              <FileText className="h-4 w-4" />
              Send Selected ({selectedInvoiceIds.length})
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice No</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Child Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Parent</th>
                {showConsolidated && <th className="text-left py-3 px-4 font-semibold text-gray-700">Centre</th>}
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Link</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedInvoiceIds.includes(invoice.id)}
                      onChange={() => toggleSelect(invoice.id)}
                    />
                  </td>
                  <td className="py-3 px-4 font-medium text-blue-600">{invoice.invoiceNo}</td>
                  <td className="py-3 px-4">{invoice.child?.fullNameWithCaseId || 'N/A'}</td>
                  <td className="py-3 px-4">{invoice.child?.fatherName || 'N/A'}</td>
                  {showConsolidated && (
                    <td className="py-3 px-4">
                      <Badge variant="outline">
                        {centres[invoice.centre as keyof typeof centres] || invoice.centre}
                      </Badge>
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      {invoice.child?.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {invoice.child.phone.startsWith('91') ? invoice.child.phone.substring(2) : invoice.child.phone}
                        </div>
                      )}
                      {invoice.child?.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          {invoice.child.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold">₹{invoice.total?.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    {paymentLinks[invoice.id] ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          Generated
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(paymentLinks[invoice.id]);
                              toast({
                                title: "Payment Link Copied",
                                description: "Payment link has been copied to clipboard",
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to copy payment link",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 p-1"
                          title="Copy payment link"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {invoice.child?.phone && (
                          <WhatsAppDialog
                            defaultPhone={invoice.child.phone}
                            studentName={invoice.child?.fullNameWithCaseId || ''}
                            parentName={invoice.child?.fatherName || ''}
                            paymentLink={paymentLinks[invoice.id]}
                            trigger={
                              <button
                                className="text-xs text-green-600 hover:text-green-800 p-1"
                                title="Send WhatsApp message"
                              >
                                <MessageCircle className="h-3 w-3" />
                              </button>
                            }
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Not generated</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(invoice.invoiceStatus)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <PaymentLinkDialog 
                        invoice={invoice} 
                        onPaymentLinkGenerated={(invoiceId, paymentLink) => {
                          setPaymentLinks(prev => ({
                            ...prev,
                            [invoiceId]: paymentLink
                          }));
                        }}
                      />
                      <ChildReportDialog
                        childId={invoice.child?.fullNameWithCaseId || 'test-child-id'}
                        childName={invoice.child?.fullNameWithCaseId || 'Unknown Child'}
                        parentPhone={invoice.child?.phone}
                        parentName={invoice.child?.fatherName}
                        centre={invoice.centre || 'gkp'}
                        trigger={
                          <button 
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs flex items-center gap-1"
                            onClick={() => console.log('Invoice child data:', invoice.child)}
                          >
                            <FileText className="h-3 w-3" />
                            Report
                          </button>
                        }
                      />

                      <Dialog open={openDialogId === invoice.id} onOpenChange={(open) => open ? handleOpenDialog(invoice.id) : handleCloseDialog()}>
                        <DialogTrigger asChild>
                          <button className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs">View</button>
                        </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invoice Details</DialogTitle>
                          <DialogDescription>
                            {dialogLoading && <div>Loading...</div>}
                            {!dialogLoading && dialogInvoice && (
                              <div>
                                <div><b>Invoice No:</b> {dialogInvoice.invoiceNo}</div>
                                <div><b>Status:</b> {dialogInvoice.invoiceStatus}</div>
                                <div><b>Payment Mode:</b> {dialogInvoice.paymentMode}</div>
                                <div><b>Total:</b> ₹{dialogInvoice.total}</div>
                                <div><b>Date:</b> {new Date(dialogInvoice.invoiceDate).toLocaleDateString()}</div>
                                <div><b>Child:</b> {dialogInvoice.child?.fullNameWithCaseId}</div>
                                {/* Add more fields as needed */}
                              </div>
                            )}
                            {!dialogLoading && !dialogInvoice && <div>Failed to load invoice details.</div>}
                          </DialogDescription>
                        </DialogHeader>
                                              </DialogContent>
                      </Dialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices found for the selected criteria</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceTable;
