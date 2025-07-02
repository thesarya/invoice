import { useState, useEffect } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import InvoiceStatsCards from "../components/InvoiceStatsCards";
import InvoiceCharts from "../components/InvoiceCharts";
import InvoiceTable from "../components/InvoiceTable";

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

const Index = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [consolidatedInvoices, setConsolidatedInvoices] = useState<Invoice[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [centre, setCentre] = useState("gkp");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showConsolidated, setShowConsolidated] = useState(false);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<{
    activeChildren: number;
    activeMember: number;
  } | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const { toast } = useToast();

  const centres = {
    gkp: "Gorakhpur",
    lko: "Lucknow",
  };

  const tokens = {
    gkp: import.meta.env.VITE_GKP_TOKEN as string,
    lko: import.meta.env.VITE_LKO_TOKEN as string,
  };

  const fetchInvoices = async (fetchCentre = centre) => {
    setLoading(true);
    const paddedMonth = String(month).padStart(2, "0");
    const start = `${year}-${paddedMonth}-01T00:00:00.000Z`;
    const end =
      month < 12
        ? `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00.000Z`
        : `${year + 1}-01-01T00:00:00.000Z`;

    const query = `
      query Invoices($startDate: DateTime, $endDate: DateTime) {
        invoices(startDate: $startDate, endDate: $endDate) {
          id invoiceNo paymentMode createdAt invoiceStatus total invoiceDate
          child { fullNameWithCaseId fatherName phone email }
        }
      }
    `;

    try {
      const response = await fetch("https://care.kidaura.in/api/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens[fetchCentre as keyof typeof tokens]}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { startDate: start, endDate: end },
        }),
      });

      const data = await response.json();
      const fetchedInvoices = data?.data?.invoices || [];

      const invoicesWithCentre = fetchedInvoices.map((inv: Invoice) => ({
        ...inv,
        centre: fetchCentre,
      }));

      return invoicesWithCentre;
    } catch (error) {
      console.error(`Error fetching invoices for ${fetchCentre}:`, error);
      return [];
    }
  };

  const fetchConsolidatedData = async () => {
    setLoading(true);
    try {
      const [gkpInvoices, lkoInvoices] = await Promise.all([
        fetchInvoices("gkp"),
        fetchInvoices("lko"),
      ]);

      const allInvoices = [...gkpInvoices, ...lkoInvoices];
      setConsolidatedInvoices(allInvoices);

      toast({
        title: "Consolidated Data Fetched",
        description: `Found ${allInvoices.length} invoices across both centres`,
      });
    } catch (error) {
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
      const paddedMonth = String(m).padStart(2, "0");
      const start = `${year}-${paddedMonth}-01T00:00:00.000Z`;
      const end =
        m < 12
          ? `${year}-${String(m + 1).padStart(2, "0")}-01T00:00:00.000Z`
          : `${year + 1}-01-01T00:00:00.000Z`;

      try {
        const [gkpData, lkoData] = await Promise.all([
          fetchMonthData("gkp", start, end),
          fetchMonthData("lko", start, end),
        ]);

        const monthName = new Date(year, m - 1).toLocaleString("default", {
          month: "short",
        });
        const gkpRevenue = gkpData.reduce(
          (sum: number, inv: Invoice) => sum + (inv.total || 0),
          0
        );
        const lkoRevenue = lkoData.reduce(
          (sum: number, inv: Invoice) => sum + (inv.total || 0),
          0
        );

        monthlyData.push({
          month: monthName,
          gkp: gkpRevenue,
          lko: lkoRevenue,
          revenue: gkpRevenue + lkoRevenue,
        });
      } catch (error) {
        console.error(`Error fetching data for month ${m}:`, error);
        monthlyData.push({
          month: new Date(year, m - 1).toLocaleString("default", {
            month: "short",
          }),
          gkp: 0,
          lko: 0,
          revenue: 0,
        });
      }
    }
    setMonthlyRevenue(monthlyData);
  };

  const fetchMonthData = async (
    fetchCentre: string,
    start: string,
    end: string
  ) => {
    const query = `
      query Invoices($startDate: DateTime, $endDate: DateTime) {
        invoices(startDate: $startDate, endDate: $endDate) {
          id invoiceNo paymentMode createdAt invoiceStatus total invoiceDate
          child { fullNameWithCaseId fatherName phone email }
        }
      }
    `;

    try {
      const response = await fetch("https://care.kidaura.in/api/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens[fetchCentre as keyof typeof tokens]}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { startDate: start, endDate: end },
        }),
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
      setInvoices(fetchedInvoices);

      toast({
        title: "Data Fetched Successfully",
        description: `Found ${fetchedInvoices.length} invoices for ${
          centres[centre as keyof typeof centres]
        } in ${month}/${year}`,
      });
    } catch (error) {
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
      const response = await fetch("https://care.kidaura.in/api/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens[fetchCentre as keyof typeof tokens]}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setActiveUsers({
        activeChildren: data?.data?.childrenCount?.activeChildren ?? 0,
        activeMember: data?.data?.membersCount?.activeMember ?? 0,
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
        await fetch("https://care.kidaura.in/api/graphql", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens[centre as keyof typeof tokens]}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: mutation, variables: { id } }),
        });
      }
      toast({
        title: "Invoices Sent",
        description: `Sent ${selectedInvoiceIds.length} invoices.`,
      });
      setSelectedInvoiceIds([]);
      await loadSingleCentreData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invoices.",
        variant: "destructive",
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
  }, [year, month, centre, showConsolidated]);

  useEffect(() => {
    fetchMonthlyRevenue();
  }, [year]);

  useEffect(() => {
    fetchActiveUsers();
  }, [year, month, centre]);

  const currentInvoices = showConsolidated ? consolidatedInvoices : invoices;

  const filteredInvoices = currentInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.child?.fullNameWithCaseId
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.child?.fatherName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      invoice.invoiceStatus?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const exportData = () => {
    const dataStr = JSON.stringify(filteredInvoices, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices_${
      showConsolidated ? "consolidated" : centre
    }_${month}_${year}.json`;
    link.click();
  };

  const totalRevenue = filteredInvoices.reduce(
    (sum, invoice) => sum + (invoice.total || 0),
    0
  );
  const totalInvoices = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter(
    (inv) => inv.invoiceStatus?.toLowerCase() === "paid"
  ).length;
  const pendingInvoices = filteredInvoices.filter(
    (inv) =>
      inv.invoiceStatus?.toLowerCase() === "draft" ||
      inv.invoiceStatus?.toLowerCase() === "pending"
  ).length;

  const statusData = [
    { name: "Paid", value: paidInvoices, color: "#00C49F" },
    { name: "Pending/Draft", value: pendingInvoices, color: "#FF8042" },
  ];

  const revenueByDay = filteredInvoices
    .reduce((acc, invoice) => {
      const date = new Date(invoice.invoiceDate).getDate();
      const existing = acc.find((item) => item.day === date);
      if (existing) {
        existing.revenue += invoice.total || 0;
      } else {
        acc.push({ day: date, revenue: invoice.total || 0 });
      }
      return acc;
    }, [] as { day: number; revenue: number }[])
    .sort((a, b) => a.day - b.day);

  // Calculate quarterly revenue from monthly data
  const quarterlyRevenue = monthlyRevenue.reduce((acc, monthData) => {
    const monthIndex = new Date(`${monthData.month} 1, ${year}`).getMonth();
    const quarter = Math.floor(monthIndex / 3) + 1;
    const quarterName = `Q${quarter} ${year}`;

    const existing = acc.find((q) => q.quarter === quarterName);
    if (existing) {
      existing.revenue += monthData.revenue || 0;
    } else {
      acc.push({ quarter: quarterName, revenue: monthData.revenue || 0 });
    }
    return acc;
  }, [] as { quarter: string; revenue: number }[]);

  // Calculate yearly revenue
  const yearlyRevenue = [
    {
      year: year,
      revenue: monthlyRevenue.reduce(
        (sum, month) => sum + (month.revenue || 0),
        0
      ),
    },
  ];

  // Prepare monthly revenue data for charts
  const monthlyRevenueForChart = monthlyRevenue.map((month) => ({
    month: month.month,
    revenue: month.revenue || 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Aaryavart Invoice Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and analyze invoice data across different centres
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="consolidated"
                checked={showConsolidated}
                onCheckedChange={(checked) =>
                  setShowConsolidated(checked === true)
                }
              />
              <label htmlFor="consolidated" className="text-sm font-medium">
                Show Consolidated Data
              </label>
            </div>

            {!showConsolidated && (
              <Select value={centre} onValueChange={setCentre}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gkp">Gorakhpur</SelectItem>
                  <SelectItem value="lko">Lucknow</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24"
              min="2020"
              max="2030"
            />

            <Input
              type="number"
              placeholder="Month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-24"
              min="1"
              max="12"
            />

            <Button
              onClick={
                showConsolidated ? fetchConsolidatedData : loadSingleCentreData
              }
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? "Loading..." : "Refresh Data"}
            </Button>

            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Active Users */}
        {activeUsers && (
          <div style={{ marginBottom: 16 }}>
            <Card>
              <CardHeader>
                <CardTitle>Active Users This Month</CardTitle>
                <CardDescription>
                  Active Children: {activeUsers.activeChildren} | Active
                  Members: {activeUsers.activeMember}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

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

        {/* Tabs for Invoices and Charts */}
        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="charts">Analytics & Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-6">
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

          <TabsContent value="charts" className="mt-6">
            <InvoiceCharts
              revenueByDay={revenueByDay}
              statusData={statusData}
              monthlyRevenue={monthlyRevenueForChart}
              quarterlyRevenue={quarterlyRevenue}
              yearlyRevenue={yearlyRevenue}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
