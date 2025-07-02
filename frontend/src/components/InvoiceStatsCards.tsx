
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, TrendingUp, Users } from "lucide-react";

interface InvoiceStatsCardsProps {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  month: number;
  year: number;
  showConsolidated: boolean;
  centres: { [key: string]: string };
  centre: string;
}

const InvoiceStatsCards: React.FC<InvoiceStatsCardsProps> = ({
  totalRevenue,
  totalInvoices,
  paidInvoices,
  pendingInvoices,
  month,
  year,
  showConsolidated,
  centres,
  centre
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 opacity-90" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
          <p className="text-xs opacity-90 mt-1">
            {month}/{year} - {showConsolidated ? 'Both Centres' : centres[centre as keyof typeof centres]}
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Total Invoices</CardTitle>
          <FileText className="h-4 w-4 opacity-90" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInvoices}</div>
          <p className="text-xs opacity-90 mt-1">Generated this month</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Paid Invoices</CardTitle>
          <TrendingUp className="h-4 w-4 opacity-90" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{paidInvoices}</div>
          <p className="text-xs opacity-90 mt-1">
            {totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Pending</CardTitle>
          <Users className="h-4 w-4 opacity-90" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingInvoices}</div>
          <p className="text-xs opacity-90 mt-1">Awaiting payment</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceStatsCards;
