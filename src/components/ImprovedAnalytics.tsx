import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Users, UserPlus, UserMinus, DollarSign, Calendar, Target, Award } from "lucide-react";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";

interface ImprovedAnalyticsProps {
  revenueByDay: { day: number; revenue: number; }[];
  statusData: { name: string; value: number; color: string; }[];
  monthlyRevenue: { month: string; gkp: number; lko: number; }[];
  quarterlyRevenue: { quarter: string; gkp: number; lko: number; }[];
  yearlyRevenue: { year: number; gkp: number; lko: number; total: number; }[];
  latePayingCustomers: any[];
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  activeUsers?: {
    activeChildren: number;
    activeMember: number;
  };
  centre: string;
  showConsolidated: boolean;
}

const ImprovedAnalytics: React.FC<ImprovedAnalyticsProps> = ({
  revenueByDay,
  statusData,
  monthlyRevenue,
  quarterlyRevenue,
  yearlyRevenue,
  latePayingCustomers,
  totalRevenue,
  totalInvoices,
  paidInvoices,
  pendingInvoices,
  activeUsers,
  centre,
  showConsolidated
}) => {
  const colors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#f97316'
  };

  const totalActiveStudents = activeUsers?.activeChildren || 0;
  const totalInactiveStudents = Math.max(0, totalInvoices - totalActiveStudents);
  const monthlyGrowthRate = 5.2; // Mock data - would be calculated from historical data
  const revenueGrowthRate = 12.8; // Mock data - would be calculated from historical data
  const averageRevenuePerStudent = totalActiveStudents > 0 ? totalRevenue / totalActiveStudents : 0;

  // Mock data for charts - would be calculated from historical data
  const studentTrends = [
    { month: 'Jan', joined: 15, left: 3, net: 12 },
    { month: 'Feb', joined: 20, left: 5, net: 15 },
    { month: 'Mar', joined: 18, left: 2, net: 16 },
    { month: 'Apr', joined: 25, left: 4, net: 21 },
    { month: 'May', joined: 22, left: 6, net: 16 },
    { month: 'Jun', joined: 30, left: 3, net: 27 }
  ];

  const revenueProgress = [
    { month: 'Jan', target: 100000, actual: 95000, percentage: 95 },
    { month: 'Feb', target: 110000, actual: 115000, percentage: 104.5 },
    { month: 'Mar', target: 120000, actual: 118000, percentage: 98.3 },
    { month: 'Apr', target: 125000, actual: 130000, percentage: 104 },
    { month: 'May', target: 130000, actual: 128000, percentage: 98.5 },
    { month: 'Jun', target: 135000, actual: 142000, percentage: 105.2 }
  ];

  const centreComparison = [
    { centre: 'GKP', students: Math.floor(totalActiveStudents * 0.6), revenue: Math.floor(totalRevenue * 0.6), growth: 8.5 },
    { centre: 'LKO', students: Math.floor(totalActiveStudents * 0.4), revenue: Math.floor(totalRevenue * 0.4), growth: 12.3 }
  ];

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
              {entry.name}: {typeof entry.value === 'number' && entry.name.includes('Revenue') 
                ? `₹${entry.value.toLocaleString()}` 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (rate < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return 'text-green-600';
    if (rate < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const pieData = [
    { name: 'Active Students', value: totalActiveStudents, color: colors.success },
    { name: 'Inactive Students', value: totalInactiveStudents, color: colors.danger }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Active Students</p>
                <p className="text-2xl font-bold text-blue-900">{totalActiveStudents}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(monthlyGrowthRate)}
                  <span className={`text-xs font-medium ${getGrowthColor(monthlyGrowthRate)}`}>
                    {monthlyGrowthRate > 0 ? '+' : ''}{monthlyGrowthRate.toFixed(1)}% this month
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Revenue Growth</p>
                <p className="text-2xl font-bold text-green-900">{revenueGrowthRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(revenueGrowthRate)}
                  <span className={`text-xs font-medium ${getGrowthColor(revenueGrowthRate)}`}>
                    vs last month
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Avg Revenue/Student</p>
                <p className="text-2xl font-bold text-orange-900">₹{averageRevenuePerStudent.toLocaleString()}</p>
                <p className="text-xs text-orange-600 mt-1">per month</p>
              </div>
              <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Inactive Students</p>
                <p className="text-2xl font-bold text-purple-900">{totalInactiveStudents}</p>
                <p className="text-xs text-purple-600 mt-1">potential reactivation</p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                <UserMinus className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="student-trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="student-trends" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Student Trends
          </TabsTrigger>
          <TabsTrigger value="revenue-progress" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Revenue Progress
          </TabsTrigger>
          <TabsTrigger value="centre-comparison" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Centre Comparison
          </TabsTrigger>
          <TabsTrigger value="student-distribution" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Distribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student-trends" className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Student Joining & Leaving Trends
              </CardTitle>
              <CardDescription>
                Track student enrollment patterns and identify growth opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={studentTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="joined" 
                    stroke={colors.success} 
                    strokeWidth={3}
                    name="Students Joined"
                    dot={{ fill: colors.success, strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="left" 
                    stroke={colors.danger} 
                    strokeWidth={3}
                    name="Students Left"
                    dot={{ fill: colors.danger, strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    stroke={colors.primary} 
                    strokeWidth={3}
                    name="Net Growth"
                    dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              {/* Trend Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Students Joined</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {studentTrends.reduce((sum, trend) => sum + trend.joined, 0)}
                  </p>
                  <p className="text-xs text-green-600">Total this year</p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserMinus className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">Students Left</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {studentTrends.reduce((sum, trend) => sum + trend.left, 0)}
                  </p>
                  <p className="text-xs text-red-600">Total this year</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Net Growth</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {studentTrends.reduce((sum, trend) => sum + trend.net, 0)}
                  </p>
                  <p className="text-xs text-blue-600">Total this year</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue-progress" className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Revenue Progress vs Targets
              </CardTitle>
              <CardDescription>
                Monitor revenue performance against monthly targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueProgress} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="target" fill={colors.accent} name="Target Revenue" opacity={0.7} />
                  <Bar dataKey="actual" fill={colors.success} name="Actual Revenue" />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Achievement Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {revenueProgress.slice(-3).map((progress, index) => (
                  <div key={progress.month} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{progress.month}</span>
                      <Badge 
                        variant={progress.percentage >= 100 ? "default" : "secondary"}
                        className={progress.percentage >= 100 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                      >
                        {progress.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-medium">₹{progress.target.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Actual:</span>
                        <span className="font-medium">₹{progress.actual.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="centre-comparison" className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Centre Performance Comparison
              </CardTitle>
              <CardDescription>
                Compare performance metrics across different centres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-4">Student Count by Centre</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={centreComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="centre" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="students" fill={colors.primary} name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-4">Revenue by Centre</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={centreComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="centre" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" fill={colors.success} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Centre Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {centreComparison.map((centre) => (
                  <div key={centre.centre} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">{centre.centre}</h4>
                      <div className="flex items-center gap-1">
                        {getGrowthIcon(centre.growth)}
                        <span className={`text-sm font-medium ${getGrowthColor(centre.growth)}`}>
                          {centre.growth > 0 ? '+' : ''}{centre.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-medium">{centre.students}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-medium">₹{centre.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg/Student:</span>
                        <span className="font-medium">₹{Math.round(centre.revenue / centre.students).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student-distribution" className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Student Distribution
              </CardTitle>
              <CardDescription>
                Overview of active vs inactive student distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-4 text-center">Student Status Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-col justify-center space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">Active Students</span>
                    </div>
                    <p className="text-3xl font-bold text-green-900 mb-1">{totalActiveStudents}</p>
                    <p className="text-sm text-green-600">
                      {((totalActiveStudents / (totalActiveStudents + totalInactiveStudents)) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-800">Inactive Students</span>
                    </div>
                    <p className="text-3xl font-bold text-red-900 mb-1">{totalInactiveStudents}</p>
                    <p className="text-sm text-red-600">
                      {((totalInactiveStudents / (totalActiveStudents + totalInactiveStudents)) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-800 mb-2">Reactivation Opportunity</h5>
                    <p className="text-sm text-blue-600">
                      Focus on reactivating {totalInactiveStudents} inactive students to boost revenue by up to 
                      ₹{(totalInactiveStudents * averageRevenuePerStudent).toLocaleString()} per month.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImprovedAnalytics;