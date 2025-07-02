
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calendar } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface InvoiceChartsProps {
  revenueByDay: { day: number; revenue: number }[];
  statusData: { name: string; value: number; color: string }[];
  monthlyRevenue: { month: string; revenue: number }[];
  quarterlyRevenue: { quarter: string; revenue: number }[];
  yearlyRevenue: { year: number; revenue: number }[];
}

const InvoiceCharts: React.FC<InvoiceChartsProps> = ({ 
  revenueByDay, 
  statusData, 
  monthlyRevenue, 
  quarterlyRevenue, 
  yearlyRevenue 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Revenue Analysis
          </CardTitle>
          <CardDescription>Revenue trends across different time periods</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="quarterly" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={quarterlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="quarter" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#82ca9d" 
                    strokeWidth={3}
                    dot={{ fill: '#82ca9d', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="yearly" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="year" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Bar dataKey="revenue" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Payment Status Distribution
          </CardTitle>
          <CardDescription>Overview of invoice payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceCharts;
