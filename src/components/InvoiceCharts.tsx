import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calendar, AlertTriangle, Clock } from "lucide-react";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

interface LatePayingCustomer {
  name: string;
  fatherName?: string;
  phone?: string;
  email?: string;
  pendingAmount: number;
  overdueDays: number;
  centre: string;
  invoiceCount: number;
  lastReminderDate?: string;
}

interface InvoiceChartsProps {
  revenueByDay: { day: number; revenue: number }[];
  statusData: { name: string; value: number; color: string }[];
  monthlyRevenue: { month: string; gkp: number; lko: number }[];
  quarterlyRevenue: { quarter: string; gkp: number; lko: number }[];
  yearlyRevenue: { year: number; gkp: number; lko: number; revenue: number }[];
  latePayingCustomers?: LatePayingCustomer[];
}

const InvoiceCharts: React.FC<InvoiceChartsProps> = ({ 
  revenueByDay, 
  statusData, 
  monthlyRevenue, 
  quarterlyRevenue, 
  yearlyRevenue,
  latePayingCustomers = []
}) => {
  const colors = {
    gkp: '#8884d8',
    lko: '#82ca9d',
    gkpLight: '#a8a4e8',
    lkoLight: '#a2d4b8'
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ₹{entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    return phone.startsWith('91') ? phone.substring(2) : phone;
  };

  const getOverdueStatus = (days: number) => {
    if (days <= 7) return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    if (days <= 30) return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  return (
    <div className="space-y-6">
      {/* Revenue Analysis and Payment Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Revenue Analysis
            </CardTitle>
            <CardDescription>Revenue trends across different time periods</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="monthly" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                <TabsTrigger value="monthly" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Monthly</TabsTrigger>
                <TabsTrigger value="quarterly" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Quarterly</TabsTrigger>
                <TabsTrigger value="yearly" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Yearly</TabsTrigger>
              </TabsList>
              
              <TabsContent value="monthly" className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="gkp" fill={colors.gkp} name="Gorakhpur" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lko" fill={colors.lko} name="Lucknow" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="quarterly" className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quarterlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="quarter" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="gkp" fill={colors.gkp} name="Gorakhpur" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lko" fill={colors.lko} name="Lucknow" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Quarterly Revenue Summary - Compact */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {quarterlyRevenue.map((quarter, index) => (
                    <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-3 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 text-xs mb-2">{quarter.quarter}</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">GKP:</span>
                          <span className="font-medium text-blue-700 text-xs">₹{(quarter.gkp/1000).toFixed(1)}K</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">LKO:</span>
                          <span className="font-medium text-green-700 text-xs">₹{(quarter.lko/1000).toFixed(1)}K</span>
                        </div>
                        <div className="border-t border-blue-200 pt-1 mt-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-700">Total:</span>
                            <span className="font-bold text-purple-700 text-xs">₹{((quarter.gkp + quarter.lko)/1000).toFixed(1)}K</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="yearly" className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yearlyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="year" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="gkp" fill={colors.gkp} name="Gorakhpur" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lko" fill={colors.lko} name="Lucknow" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Payment Status Distribution
            </CardTitle>
            <CardDescription>Overview of invoice payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} invoices`, 'Count']} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Late Paying Customers */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Late Paying Customers
          </CardTitle>
          <CardDescription>Customers with pending payments and overdue amounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gkp" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="gkp" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">Gorakhpur</TabsTrigger>
              <TabsTrigger value="lko" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">Lucknow</TabsTrigger>
            </TabsList>
            
            <TabsContent value="gkp" className="mt-4">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {latePayingCustomers
                  .filter(customer => customer.centre === 'gkp')
                  .slice(0, 10)
                  .map((customer, index) => {
                    const overdueStatus = getOverdueStatus(customer.overdueDays);
                    return (
                      <div key={index} className={`rounded-lg p-4 border ${overdueStatus.bg} ${overdueStatus.border}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">{customer.name}</h4>
                            {customer.fatherName && (
                              <p className="text-xs text-gray-600">Father: {customer.fatherName}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-700">₹{customer.pendingAmount.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{customer.invoiceCount} pending</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>📞 {formatPhone(customer.phone)}</span>
                          <span className={`font-medium ${overdueStatus.color}`}>
                            <Clock className="inline h-3 w-3 mr-1" />
                            {customer.overdueDays} days overdue
                          </span>
                        </div>
                        {customer.lastReminderDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Last Reminder: {new Date(customer.lastReminderDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                {latePayingCustomers.filter(customer => customer.centre === 'gkp').length === 0 && (
                  <div className="text-center text-gray-500 py-8">No late paying customers</div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="lko" className="mt-4">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {latePayingCustomers
                  .filter(customer => customer.centre === 'lko')
                  .slice(0, 10)
                  .map((customer, index) => {
                    const overdueStatus = getOverdueStatus(customer.overdueDays);
                    return (
                      <div key={index} className={`rounded-lg p-4 border ${overdueStatus.bg} ${overdueStatus.border}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">{customer.name}</h4>
                            {customer.fatherName && (
                              <p className="text-xs text-gray-600">Father: {customer.fatherName}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-700">₹{customer.pendingAmount.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{customer.invoiceCount} pending</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>📞 {formatPhone(customer.phone)}</span>
                          <span className={`font-medium ${overdueStatus.color}`}>
                            <Clock className="inline h-3 w-3 mr-1" />
                            {customer.overdueDays} days overdue
                          </span>
                        </div>
                        {customer.lastReminderDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Last Reminder: {new Date(customer.lastReminderDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                {latePayingCustomers.filter(customer => customer.centre === 'lko').length === 0 && (
                  <div className="text-center text-gray-500 py-8">No late paying customers</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceCharts;
