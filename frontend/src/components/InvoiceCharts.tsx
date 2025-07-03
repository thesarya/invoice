import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface InvoiceChartsProps {
  revenueByDay: { day: number; revenue: number }[];
  statusData: { name: string; value: number; color: string }[];
  monthlyRevenue: { month: string; revenue: number }[];
  quarterlyRevenue: { quarter: string; revenue: number }[];
  yearlyRevenue: { year: number; revenue: number }[];
  selectedCentre: string; // "gkp" | "lko" | "consolidated"
  onCentreChange: (centre: string) => void;
}

const centreOptions = [
  { label: 'Lucknow', value: 'lko' },
  { label: 'Gorakhpur', value: 'gkp' },
  { label: 'Combined', value: 'consolidated' },
];

const InvoiceCharts: React.FC<InvoiceChartsProps> = ({
  revenueByDay,
  statusData,
  monthlyRevenue,
  quarterlyRevenue,
  yearlyRevenue,
  selectedCentre,
  onCentreChange
}) => {
  const centreLabel = selectedCentre === "gkp"
    ? "Gorakhpur"
    : selectedCentre === "lko"
    ? "Lucknow"
    : "Both Centres";

  // Projected growth: simple linear projection based on current year data
  const totalSoFar = monthlyRevenue.reduce((sum, m) => sum + (m.revenue || 0), 0);
  const monthsWithData = monthlyRevenue.filter(m => m.revenue > 0).length;
  const projectedGrowth = monthsWithData > 0 ? Math.round((totalSoFar / monthsWithData) * 12) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="col-span-2 flex justify-end mb-4">
        <select
          className="border rounded px-3 py-1 text-sm shadow"
          value={selectedCentre}
          onChange={e => onCentreChange(e.target.value)}
        >
          {centreOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {/* Revenue Analysis Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Revenue Analysis
          </CardTitle>
          <CardDescription>Monthly collected revenue for {centreLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                formatter={(value) => [`₹${value}`, 'Collected']}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600">
            <strong>Projected Yearly Revenue:</strong> ₹{projectedGrowth.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Revenue Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Quarterly Revenue
          </CardTitle>
          <CardDescription>Quarterly revenue for {centreLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={quarterlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                formatter={(value) => [`₹${value}`, 'Revenue']}
                labelFormatter={(label) => `${label}`}
              />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={3} dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Mode Pie Chart Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Payment Mode Distribution
          </CardTitle>
          <CardDescription>How users paid in {centreLabel}</CardDescription>
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
