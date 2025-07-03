import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Filter, Phone, Mail } from "lucide-react";
import PaymentLinkDialog from './PaymentLinkDialog';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

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
  const [dialogInvoice, setDialogInvoice] = React.useState<any>(null);
  const [dialogLoading, setDialogLoading] = React.useState(false);
  const [paymentLinks, setPaymentLinks] = useState<{ [invoiceId: string]: string }>({});

  const getStatusBadge = (status: string) => {
    const color = status?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    return <Badge className={color}>{status || 'Unknown'}</Badge>;
  };

  const allSelected = filteredInvoices.length > 0 && filteredInvoices.every(inv => selectedInvoiceIds.includes(inv.id));
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

  useEffect(() => {
    async function fetchLinks() {
      if (filteredInvoices.length === 0) return;
      const ids = filteredInvoices.map(inv => inv.id);
      const { data, error } = await supabase
        .from("payment_links")
        .select("invoice_id, payment_url")
        .in("invoice_id", ids);
      if (!error && data) {
        const map: { [invoiceId: string]: string } = {};
        data.forEach((row: any) => {
          map[row.invoice_id] = row.payment_url;
        });
        setPaymentLinks(map);
      }
    }
    fetchLinks();
  }, [filteredInvoices]);

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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <button
              className="ml-2 px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
              onClick={onBulkSend}
              disabled={selectedInvoiceIds.length === 0}
            >
              Send Selected
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Link</th>
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
                          {invoice.child.phone}
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
                  <td className="py-3 px-4">{getStatusBadge(invoice.invoiceStatus)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-blue-600 underline">
                    {paymentLinks[invoice.id] ? (
                      <a href={paymentLinks[invoice.id]} target="_blank" rel="noopener noreferrer">Link</a>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <PaymentLinkDialog invoice={invoice} />
                    <Dialog open={openDialogId === invoice.id} onOpenChange={(open) => open ? handleOpenDialog(invoice.id) : handleCloseDialog()}>
                      <DialogTrigger asChild>
                        <button className="ml-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-xs">View</button>
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
