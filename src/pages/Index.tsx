import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Trophy, RefreshCw } from "lucide-react";
import InvoiceStatsCards from '../components/InvoiceStatsCards';
import ImprovedAnalytics from '../components/ImprovedAnalytics';
import InvoiceTable from '../components/InvoiceTable';
import DeactiveChildrenTable from '../components/DeactiveChildrenTable';
import Navigation from "@/components/Navigation";
import ChildSelectorDialog from '@/components/ChildSelectorDialog';
import StreamlinedControlPanel from '@/components/StreamlinedControlPanel';
import RedundantDataProvider from '@/components/RedundantDataProvider';
import FirestoreErrorHandler from '@/components/FirestoreErrorHandler';

import { firebaseApiKeyManager } from "@/lib/firebase-api-key-manager";
import { useAuth } from "@/contexts/AuthContext";

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

interface MonthlyRevenueData {
  month: string;
  gkp: number;
  lko: number;
  revenue: number;
}

interface YearlyRevenueData {
  year: number;
  gkp: number;
  lko: number;
  total: number;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [consolidatedInvoices, setConsolidatedInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [centre, setCentre] = useState('gkp');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showConsolidated, setShowConsolidated] = useState(false);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [yearlyRevenue, setYearlyRevenue] = useState<YearlyRevenueData[]>([]);
  const [activeUsers, setActiveUsers] = useState<{ activeChildren: number; activeMember: number } | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  const centres = {
    gkp: 'Gorakhpur',
    lko: 'Lucknow'
  };

  // Check if API keys are configured and get them
  useEffect(() => {
    if (!user || authLoading) return;
    
    const checkConfiguration = async () => {
      try {
        // Ensure keys are loaded first
        await firebaseApiKeyManager.loadKeys();
        const configured = firebaseApiKeyManager.isConfigured();
        const keys = firebaseApiKeyManager.getKeys();
        
        setIsConfigured(configured);
        console.log('API Configuration Status:', configured);
        console.log('Saved Keys:', {
          hasGkpToken: !!keys.gkpToken,
          hasLkoToken: !!keys.lkoToken,
          gkpTokenLength: keys.gkpToken?.length || 0,
          lkoTokenLength: keys.lkoToken?.length || 0,
          apiUrl: keys.apiUrl
        });
      } catch (error) {
        console.error('Error checking API configuration:', error);
        setIsConfigured(false);
      }
    };
    checkConfiguration();
  }, [user, authLoading]);

  // Listen for storage changes (when settings are updated)
  useEffect(() => {
    if (!user || authLoading) return;
    
    const handleStorageChange = () => {
      try {
        const configured = firebaseApiKeyManager.isConfigured();
        setIsConfigured(configured);
        console.log('Settings updated, rechecking configuration:', configured);
      } catch (error) {
        console.error('Error checking configuration after storage change:', error);
        setIsConfigured(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, authLoading]);

  // Always try to use API key manager first, fallback to environment variables
  const getTokens = () => {
    try {
      const savedKeys = firebaseApiKeyManager.getKeys();
      console.log('Retrieved keys from manager:', {
        hasGkpToken: !!savedKeys.gkpToken,
        hasLkoToken: !!savedKeys.lkoToken,
        gkpTokenLength: savedKeys.gkpToken?.length || 0,
        lkoTokenLength: savedKeys.lkoToken?.length || 0
      });
      
      if (savedKeys && savedKeys.gkpToken && savedKeys.lkoToken) {
        console.log('Using saved API keys from settings');
        return {
          gkp: savedKeys.gkpToken,
          lko: savedKeys.lkoToken
        };
      }
    } catch (error) {
      console.error('Error getting saved API keys:', error);
    }
    
    console.log('Using environment variable API keys');
    return {
      gkp: import.meta.env.VITE_GKP_TOKEN,
      lko: import.meta.env.VITE_LKO_TOKEN
    };
  };

  const getApiUrl = () => {
    try {
      const savedKeys = firebaseApiKeyManager.getKeys();
      if (savedKeys && savedKeys.apiUrl) {
        console.log('Using saved API URL from settings:', savedKeys.apiUrl);
        return savedKeys.apiUrl;
      }
    } catch (error) {
      console.error('Error getting saved API URL:', error);
    }
    
    console.log('Using environment variable API URL');
    return import.meta.env.VITE_API_BASE_URL || 'https://care.kidaura.in/api/graphql';
  };

  // Don't render until authentication is complete
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const tokens = getTokens();
  const API_BASE_URL = getApiUrl();

  const fetchInvoices = async (fetchCentre = centre) => {
    // Check if API keys are configured
    try {
      const savedKeys = firebaseApiKeyManager.getKeys();
      console.log('fetchInvoices - Checking keys:', {
        hasGkpToken: !!savedKeys.gkpToken,
        hasLkoToken: !!savedKeys.lkoToken,
        fetchCentre,
        tokens: {
          gkp: tokens.gkp ? 'Present' : 'Missing',
          lko: tokens.lko ? 'Present' : 'Missing'
        }
      });
      
      // Check if the required token for the specific centre is available
      const requiredToken = fetchCentre === 'gkp' ? savedKeys.gkpToken : savedKeys.lkoToken;
      if (!requiredToken) {
        console.log(`No ${fetchCentre.toUpperCase()} token found, showing toast`);
        toast({
          title: "API Token Required",
          description: `Please add your ${fetchCentre.toUpperCase()} organization token in Settings and save it to continue`,
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/settings'}
            >
              Go to Settings
            </Button>
          ),
        });
        return;
      }
    } catch (error) {
      console.error('Error checking API keys:', error);
      toast({
        title: "Configuration Error",
        description: "Unable to check API configuration. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const paddedMonth = String(month).padStart(2, '0');
    const start = `${year}-${paddedMonth}-01T00:00:00.000Z`;
    const end = month < 12
      ? `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00.000Z`
      : `${year + 1}-01-01T00:00:00.000Z`;

    const query = `
      query Invoices($startDate: DateTime, $endDate: DateTime, $childId: ID, $status: [InvoiceStatus], $paymentMode: PaymentMode) {
        invoices(
          startDate: $startDate
          endDate: $endDate
          childId: $childId
          status: $status
          paymentMode: $paymentMode
        ) {
          id invoiceNo paymentMode createdAt invoiceStatus total invoiceDate
          child { fullNameWithCaseId fatherName phone email }
        }
      }
    `;

    console.log('Fetching invoices with:', {
      fetchCentre,
      API_BASE_URL,
      token: tokens[fetchCentre as keyof typeof tokens] ? 'Present' : 'Missing',
      start,
      end
    });

    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens[fetchCentre as keyof typeof tokens]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: { startDate: start, endDate: end, childId: null, status: null, paymentMode: null }
        })
      });

      console.log('API Response Status:', response.status);
      
      if (!response.ok) {
        console.error('API Response Error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error Response Body:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      
      const fetchedInvoices = data?.data?.invoices || [];
      console.log('Fetched Invoices Count:', fetchedInvoices.length);
      
      const invoicesWithCentre = fetchedInvoices.map((inv: Invoice) => ({
        ...inv,
        centre: fetchCentre
      }));

      return invoicesWithCentre;
    } catch (error) {
      console.error(`Error fetching invoices for ${fetchCentre}:`, error);
      toast({
        title: "Error Fetching Data",
        description: `Failed to fetch invoices for ${fetchCentre}. Check console for details.`,
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchConsolidatedData = async () => {
    setLoading(true);
    try {
      const [gkpInvoices, lkoInvoices] = await Promise.all([
        fetchInvoices('gkp'),
        fetchInvoices('lko')
      ]);

      // Ensure we always have arrays, never undefined
      const safeGkpInvoices = gkpInvoices || [];
      const safeLkoInvoices = lkoInvoices || [];
      const allInvoices = [...safeGkpInvoices, ...safeLkoInvoices];
      setConsolidatedInvoices(allInvoices);
      
      toast({
        title: "Consolidated Data Fetched",
        description: `Found ${allInvoices.length} invoices across both centres`,
      });
    } catch (error) {
      // Set empty array on error to prevent undefined
      setConsolidatedInvoices([]);
      toast({
        title: "Error",
        description: "Failed to fetch consolidated data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyRevenue = async () => {
    const monthlyData = [];
    for (let m = 1; m <= 12; m++) {
      const paddedMonth = String(m).padStart(2, '0');
      const start = `${year}-${paddedMonth}-01T00:00:00.000Z`;
      const end = m < 12
        ? `${year}-${String(m + 1).padStart(2, '0')}-01T00:00:00.000Z`
        : `${year + 1}-01-01T00:00:00.000Z`;

      try {
        const [gkpData, lkoData] = await Promise.all([
          fetchMonthData('gkp', start, end),
          fetchMonthData('lko', start, end)
        ]);

        const monthName = new Date(year, m - 1).toLocaleString('default', { month: 'short' });
        const gkpRevenue = gkpData.reduce((sum: number, inv: Invoice) => sum + (inv.total || 0), 0);
        const lkoRevenue = lkoData.reduce((sum: number, inv: Invoice) => sum + (inv.total || 0), 0);
        
        monthlyData.push({
          month: monthName,
          gkp: gkpRevenue,
          lko: lkoRevenue,
          revenue: gkpRevenue + lkoRevenue
        });
      } catch (error) {
        console.error(`Error fetching data for month ${m}:`, error);
        monthlyData.push({
          month: new Date(year, m - 1).toLocaleString('default', { month: 'short' }),
          gkp: 0,
          lko: 0,
          revenue: 0
        });
      }
    }
    setMonthlyRevenue(monthlyData);
  };

  const fetchYearlyRevenue = async () => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const yearlyData = [];

    for (const yearToFetch of [lastYear, currentYear]) {
      try {
        const start = `${yearToFetch}-01-01T00:00:00.000Z`;
        const end = `${yearToFetch + 1}-01-01T00:00:00.000Z`;

        const [gkpData, lkoData] = await Promise.all([
          fetchMonthData('gkp', start, end),
          fetchMonthData('lko', start, end)
        ]);

        const gkpRevenue = gkpData.reduce((sum: number, inv: Invoice) => sum + (inv.total || 0), 0);
        const lkoRevenue = lkoData.reduce((sum: number, inv: Invoice) => sum + (inv.total || 0), 0);

        yearlyData.push({
          year: yearToFetch,
          gkp: gkpRevenue,
          lko: lkoRevenue,
          total: gkpRevenue + lkoRevenue
        });
      } catch (error) {
        console.error(`Error fetching data for year ${yearToFetch}:`, error);
        yearlyData.push({
          year: yearToFetch,
          gkp: 0,
          lko: 0,
          total: 0
        });
      }
    }
    setYearlyRevenue(yearlyData);
  };

  const fetchMonthData = async (fetchCentre: string, start: string, end: string) => {
    // Check if API keys are configured
    try {
      const savedKeys = firebaseApiKeyManager.getKeys();
      if (!savedKeys.gkpToken && !savedKeys.lkoToken) {
        toast({
          title: "API Keys Required",
          description: "Please add your organization tokens in Settings and save them to continue",
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/settings'}
            >
              Go to Settings
            </Button>
          ),
        });
        return [];
      }
    } catch (error) {
      console.error('Error checking API keys in fetchMonthData:', error);
      return [];
    }

    const query = `
      query Invoices($startDate: DateTime, $endDate: DateTime, $childId: ID, $status: [InvoiceStatus], $paymentMode: PaymentMode) {
        invoices(
          startDate: $startDate
          endDate: $endDate
          childId: $childId
          status: $status
          paymentMode: $paymentMode
        ) {
          id invoiceNo paymentMode createdAt invoiceStatus total invoiceDate
          child { fullNameWithCaseId fatherName phone email }
        }
      }
    `;

    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens[fetchCentre as keyof typeof tokens]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: { startDate: start, endDate: end, childId: null, status: null, paymentMode: null }
        })
      });

      const data = await response.json();
      return data?.data?.invoices || [];
    } catch (error) {
      return [];
    }
  };

  const loadSingleCentreData = async () => {
    setLoading(true);
    try {
      const fetchedInvoices = await fetchInvoices();
      // Ensure we always set an array, never undefined
      setInvoices(fetchedInvoices || []);
      
      toast({
        title: "Data Fetched Successfully",
        description: `Found ${(fetchedInvoices || []).length} invoices for ${centres[centre as keyof typeof centres]} in ${month}/${year}`,
      });
    } catch (error) {
      // Set empty array on error to prevent undefined
      setInvoices([]);
      toast({
        title: "Error",
        description: "Failed to fetch invoice data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveUsers = async (fetchCentre = centre) => {
    // Check if API keys are configured
    try {
      const savedKeys = firebaseApiKeyManager.getKeys();
      if (!savedKeys.gkpToken && !savedKeys.lkoToken) {
        toast({
          title: "API Keys Required",
          description: "Please add your organization tokens in Settings and save them to continue",
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/settings'}
            >
              Go to Settings
            </Button>
          ),
        });
        return;
      }
    } catch (error) {
      console.error('Error checking API keys in fetchActiveUsers:', error);
      return;
    }

    const query = `
      query totalActiveUsers {
        childrenCount {
          activeChildren
          __typename
        }
        membersCount {
          activeMember
          __typename
        }
      }
    `;
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens[fetchCentre as keyof typeof tokens]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      setActiveUsers({
        activeChildren: data?.data?.childrenCount?.activeChildren ?? 0,
        activeMember: data?.data?.membersCount?.activeMember ?? 0
      });
    } catch (error) {
      setActiveUsers(null);
    }
  };

  const handleBulkSend = async () => {
    if (selectedInvoiceIds.length === 0) return;
    setLoading(true);
    try {
      for (const id of selectedInvoiceIds) {
        const mutation = `
          mutation SendInvoice($id: ID!) {
            sendInvoice(id: $id)
          }
        `;
        await fetch(`${API_BASE_URL}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens[centre as keyof typeof tokens]}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: mutation, variables: { id } })
        });
      }
      toast({
        title: 'Invoices Sent',
        description: `Sent ${selectedInvoiceIds.length} invoices.`,
      });
      setSelectedInvoiceIds([]);
      await loadSingleCentreData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invoices.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showConsolidated) {
      fetchConsolidatedData();
    } else {
      loadSingleCentreData();
    }
  }, [year, month, centre, showConsolidated, isConfigured]);

  useEffect(() => {
    fetchMonthlyRevenue();
  }, [year]);

  useEffect(() => {
    fetchYearlyRevenue();
  }, [year]);

  useEffect(() => {
    fetchActiveUsers();
  }, [year, month, centre]);

  const currentInvoices = showConsolidated ? consolidatedInvoices : invoices;

  // Add null check to prevent filter error
  const filteredInvoices = (currentInvoices || []).filter(invoice => {
    const matchesSearch = invoice.child?.fullNameWithCaseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.child?.fatherName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      invoice.invoiceStatus?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const exportData = () => {
    const dataStr = JSON.stringify(filteredInvoices, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices_${showConsolidated ? 'consolidated' : centre}_${month}_${year}.json`;
    link.click();
  };

  const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const totalInvoices = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter(inv => inv.invoiceStatus?.toLowerCase() === 'paid').length;
  const pendingInvoices = filteredInvoices.filter(inv => inv.invoiceStatus?.toLowerCase() === 'draft' || inv.invoiceStatus?.toLowerCase() === 'pending').length;

  const statusData = [
    { name: 'Paid', value: paidInvoices, color: '#00C49F' },
    { name: 'Pending/Draft', value: pendingInvoices, color: '#FF8042' },
  ];

  const revenueByDay = filteredInvoices.reduce((acc, invoice) => {
    const date = new Date(invoice.invoiceDate).getDate();
    const existing = acc.find(item => item.day === date);
    if (existing) {
      existing.revenue += invoice.total || 0;
    } else {
      acc.push({ day: date, revenue: invoice.total || 0 });
    }
    return acc;
  }, [] as { day: number; revenue: number }[]).sort((a, b) => a.day - b.day);

  // Prepare monthly revenue data for charts (separate for each centre)
  const monthlyRevenueForChart = monthlyRevenue.map(month => ({
    month: month.month,
    gkp: month.gkp || 0,
    lko: month.lko || 0
  }));

  // Calculate quarterly revenue for each centre
  const quarterlyRevenue = monthlyRevenue.reduce((acc, monthData) => {
    const monthIndex = new Date(`${monthData.month} 1, ${year}`).getMonth();
    const quarter = Math.floor(monthIndex / 3) + 1;
    const quarterName = `Q${quarter} ${year}`;
    let existing = acc.find(q => q.quarter === quarterName);
    if (!existing) {
      existing = { quarter: quarterName, gkp: 0, lko: 0 };
      acc.push(existing);
    }
    existing.gkp += monthData.gkp || 0;
    existing.lko += monthData.lko || 0;
    return acc;
  }, [] as { quarter: string; gkp: number; lko: number }[]);

  // Prepare yearly revenue data for charts
  const yearlyRevenueForChart = yearlyRevenue.map(yearData => ({
    year: yearData.year,
    gkp: yearData.gkp || 0,
    lko: yearData.lko || 0,
    total: yearData.total || 0
  }));

  // Calculate customer insights
  const calculateCustomerInsights = () => {
    const customerMap = new Map<string, {
      name: string;
      fatherName?: string;
      phone?: string;
      email?: string;
      totalPaid: number;
      totalPending: number;
      invoiceCount: number;
      paidInvoiceCount: number;
      pendingInvoiceCount: number;
      centre: string;
      lastPaymentDate?: string;
      lastInvoiceDate?: string;
      invoices: Invoice[];
    }>();

    // Use consolidated invoices for customer insights (full year data)
    const allInvoices = showConsolidated ? consolidatedInvoices : filteredInvoices;
    
    // Group invoices by customer - add null check
    (allInvoices || []).forEach(invoice => {
      const customerKey = `${invoice.child?.fullNameWithCaseId || 'Unknown'}_${invoice.centre}`;
      const existing = customerMap.get(customerKey);
      
      if (existing) {
        existing.invoiceCount++;
        existing.invoices.push(invoice);
        
        if (invoice.invoiceStatus === 'PAID') {
          existing.totalPaid += invoice.total || 0;
          existing.paidInvoiceCount++;
          if (!existing.lastPaymentDate || new Date(invoice.invoiceDate) > new Date(existing.lastPaymentDate)) {
            existing.lastPaymentDate = invoice.invoiceDate;
          }
        } else {
          existing.totalPending += invoice.total || 0;
          existing.pendingInvoiceCount++;
        }
        
        if (!existing.lastInvoiceDate || new Date(invoice.invoiceDate) > new Date(existing.lastInvoiceDate)) {
          existing.lastInvoiceDate = invoice.invoiceDate;
        }
      } else {
        customerMap.set(customerKey, {
          name: invoice.child?.fullNameWithCaseId || 'Unknown',
          fatherName: invoice.child?.fatherName,
          phone: invoice.child?.phone,
          email: invoice.child?.email,
          totalPaid: invoice.invoiceStatus === 'PAID' ? (invoice.total || 0) : 0,
          totalPending: invoice.invoiceStatus !== 'PAID' ? (invoice.total || 0) : 0,
          invoiceCount: 1,
          paidInvoiceCount: invoice.invoiceStatus === 'PAID' ? 1 : 0,
          pendingInvoiceCount: invoice.invoiceStatus !== 'PAID' ? 1 : 0,
          centre: invoice.centre || 'unknown',
          lastPaymentDate: invoice.invoiceStatus === 'PAID' ? invoice.invoiceDate : undefined,
          lastInvoiceDate: invoice.invoiceDate,
          invoices: [invoice]
        });
      }
    });

    const latePayingCustomers = Array.from(customerMap.values())
      .filter(customer => customer.totalPending > 0)
      .map(customer => {
        const today = new Date();
        const lastInvoiceDate = new Date(customer.lastInvoiceDate || '');
        const overdueDays = Math.floor((today.getTime() - lastInvoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          name: customer.name,
          fatherName: customer.fatherName,
          phone: customer.phone,
          email: customer.email,
          pendingAmount: customer.totalPending,
          overdueDays: Math.max(0, overdueDays),
          centre: customer.centre,
          invoiceCount: customer.pendingInvoiceCount,
          lastReminderDate: customer.lastInvoiceDate // Using last invoice date as proxy for reminder date
        };
      })
      .sort((a, b) => b.overdueDays - a.overdueDays);

    return { latePayingCustomers };
  };

  const { latePayingCustomers } = calculateCustomerInsights();

  const selectedCentre = centre === 'gkp' ? 'GKP' : 'Lucknow';
  const handleCentreChange = (newCentre: 'GKP' | 'Lucknow') => {
    setCentre(newCentre === 'GKP' ? 'gkp' : 'lko');
  };

  return (
    <RedundantDataProvider 
      onConnectionError={(error) => {
        console.error('Connection error detected:', error);
        toast({
          title: "Connection Issue",
          description: "Firestore connection failed. Using fallback data.",
          variant: "destructive",
        });
      }}
      fallbackData={{
        invoices: invoices || [],
        consolidatedInvoices: consolidatedInvoices || [],
        activeUsers: activeUsers || { activeChildren: 0, activeMember: 0 },
        stats: { totalRevenue, totalInvoices, paidInvoices, pendingInvoices }
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation selectedCentre={selectedCentre} onCentreChange={handleCentreChange} />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Invoice Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and analyze invoice data across different centres
            </p>
          </div>
          
          {/* Quick Action */}
          <div className="flex items-center gap-3">
            <ChildSelectorDialog
              centre={centre}
              trigger={
                <Button variant="outline" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Generate Report
                </Button>
              }
            />
          </div>
        </div>

        {/* Streamlined Control Panel */}
        <div className="mb-6">
          <StreamlinedControlPanel
            showConsolidated={showConsolidated}
            setShowConsolidated={setShowConsolidated}
            centre={centre}
            setCentre={setCentre}
            year={year}
            setYear={setYear}
            month={month}
            setMonth={setMonth}
            onRefreshData={showConsolidated ? fetchConsolidatedData : loadSingleCentreData}
            onExportData={exportData}
            onReloadConfig={() => {
              try {
                const configured = firebaseApiKeyManager.isConfigured();
                setIsConfigured(configured);
                console.log('Manually reloaded configuration:', configured);
                toast({
                  title: "Configuration Reloaded",
                  description: `API keys ${configured ? 'found' : 'not found'}. ${configured ? 'You can now fetch data.' : 'Please configure API keys in Settings.'}`,
                });
              } catch (error) {
                console.error('Error reloading configuration:', error);
                toast({
                  title: "Configuration Error",
                  description: "Unable to reload configuration. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            loading={loading}
            isConfigured={isConfigured}
            totalInvoices={totalInvoices}
            totalRevenue={totalRevenue}
            activeUsers={activeUsers}
          />
        </div>

        {/* Stats Cards */}
        <InvoiceStatsCards
          totalRevenue={totalRevenue}
          totalInvoices={totalInvoices}
          paidInvoices={paidInvoices}
          pendingInvoices={pendingInvoices}
          month={month}
          year={year}
          showConsolidated={showConsolidated}
          centres={centres}
          centre={centre}
        />

        {/* Tabs for Active Students, Deactive Children, and Charts */}
        <Tabs defaultValue="active-students" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active-students">Active Students</TabsTrigger>
            <TabsTrigger value="deactive-children">Deactive Children</TabsTrigger>
            <TabsTrigger value="charts">Analytics & Charts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active-students" className="mt-6">
            <InvoiceTable
              filteredInvoices={filteredInvoices}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              showConsolidated={showConsolidated}
              centres={centres}
              tokens={tokens}
              selectedInvoiceIds={selectedInvoiceIds}
              setSelectedInvoiceIds={setSelectedInvoiceIds}
              onBulkSend={handleBulkSend}
            />
          </TabsContent>
          
          <TabsContent value="deactive-children" className="mt-6">
            <DeactiveChildrenTable
              centre={centre}
              showConsolidated={showConsolidated}
            />
          </TabsContent>
          
          <TabsContent value="charts" className="mt-6">
            <ImprovedAnalytics
              revenueByDay={revenueByDay}
              statusData={statusData}
              monthlyRevenue={monthlyRevenueForChart}
              quarterlyRevenue={quarterlyRevenue}
              yearlyRevenue={yearlyRevenueForChart}
              latePayingCustomers={latePayingCustomers}
              totalRevenue={totalRevenue}
              totalInvoices={totalInvoices}
              paidInvoices={paidInvoices}
              pendingInvoices={pendingInvoices}
              activeUsers={activeUsers}
              centre={centre}
              showConsolidated={showConsolidated}
            />
          </TabsContent>


        </Tabs>
      </div>
        
        {/* Firestore Error Handler for Listen channel errors */}
        <FirestoreErrorHandler 
          onRetry={() => {
            // Retry data fetching operations
            if (showConsolidated) {
              fetchConsolidatedData();
            } else {
              loadSingleCentreData();
            }
            fetchActiveUsers();
          }}
          onFallbackMode={(enabled) => {
            if (enabled) {
              console.log('Fallback mode enabled - using cached data');
              toast({
                title: "Offline Mode",
                description: "Using cached data due to connection issues",
                variant: "default",
              });
            }
          }}
        />
      </div>
    </RedundantDataProvider>
  );
};

export default Index;
