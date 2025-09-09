import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, Users, Building2, RefreshCw, MessageCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WhatsAppDialog from './WhatsAppDialog';

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

interface ActiveParentsTableProps {
  centre?: string;
  showConsolidated?: boolean;
}

const ActiveParentsTable: React.FC<ActiveParentsTableProps> = ({ 
  centre = 'gkp', 
  showConsolidated = false 
}) => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState(centre);
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const { toast } = useToast();

  const centres = {
    gkp: 'Gorakhpur',
    lko: 'Lucknow'
  };

  const tokens = {
    gkp: import.meta.env.VITE_GKP_TOKEN,
    lko: import.meta.env.VITE_LKO_TOKEN
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://care.kidaura.in/api/graphql';

  const fetchActiveParents = async (fetchCentre = selectedCentre) => {
    setLoading(true);
    try {
      // Get current year and month for the query
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const paddedMonth = String(month).padStart(2, '0');
      const start = `${year}-${paddedMonth}-01T00:00:00.000Z`;
      const end = month < 12
        ? `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00.000Z`
        : `${year + 1}-01-01T00:00:00.000Z`;

      // Use the same query as invoices to get child data
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
      const invoices = data?.data?.invoices || [];

      // Extract unique children from invoices and group by parent
      const parentMap = new Map<string, Parent>();
      
      invoices.forEach((invoice: any) => {
        console.log('Invoice:', invoice);
        if (invoice.child) {
          const child = invoice.child;
          const parentKey = `${child.fatherName || 'Unknown'}_${child.phone || 'No Phone'}`;
          
          if (parentMap.has(parentKey)) {
            const existingParent = parentMap.get(parentKey)!;
            // Check if this child is already added
            const childExists = existingParent.children.some(c => c.id === child.id);
            if (!childExists) {
              existingParent.children.push({
                id: child.id,
                fullNameWithCaseId: child.fullNameWithCaseId,
                isActive: true
              });
            }
          } else {
            parentMap.set(parentKey, {
              id: parentKey,
              name: child.fatherName || 'Unknown Parent',
              phone: child.phone || 'No Phone',
              email: child.email,
              centre: fetchCentre,
              children: [{
                id: child.id,
                fullNameWithCaseId: child.fullNameWithCaseId,
                isActive: true
              }]
            });
          }
        }
      });

      return Array.from(parentMap.values());
    } catch (error) {
      console.error(`Error fetching active parents for ${fetchCentre}:`, error);
      return [];
    }
  };

  const fetchConsolidatedParents = async () => {
    setLoading(true);
    try {
      const [gkpParents, lkoParents] = await Promise.all([
        fetchActiveParents('gkp'),
        fetchActiveParents('lko')
      ]);

      const allParents = [...gkpParents, ...lkoParents];
      setParents(allParents);
      
      toast({
        title: "Active Parents Data Fetched",
        description: `Found ${allParents.length} active parents across both centres`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch active parents data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSingleCentreData = async () => {
    setLoading(true);
    try {
      const fetchedParents = await fetchActiveParents();
      setParents(fetchedParents);
      
      toast({
        title: "Data Fetched Successfully",
        description: `Found ${fetchedParents.length} active parents in ${centres[selectedCentre as keyof typeof centres]}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch active parents data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showConsolidated) {
      fetchConsolidatedParents();
    } else {
      loadSingleCentreData();
    }
  }, [selectedCentre, showConsolidated]);

  const formatPhone = (phone: string) => {
    if (!phone || phone === 'No Phone') return 'N/A';
    return phone.startsWith('91') ? phone.substring(2) : phone;
  };

  const totalParents = parents.length;
  const totalChildren = parents.reduce((sum, parent) => sum + parent.children.length, 0);

  // Selection functions
  const allSelected = parents.length > 0 && parents.every(parent => selectedParentIds.includes(parent.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedParentIds([]);
    } else {
      setSelectedParentIds(parents.map(parent => parent.id));
    }
  };

  const toggleSelect = (parentId: string) => {
    setSelectedParentIds(selectedParentIds.includes(parentId)
      ? selectedParentIds.filter(id => id !== parentId)
      : [...selectedParentIds, parentId]);
  };

  const selectedParents = parents.filter(parent => selectedParentIds.includes(parent.id));

  // WhatsApp functions
  const openWhatsApp = (phone: string, parentName: string, childrenNames: string[]) => {
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const childrenList = childrenNames.join(', ');
    const message = `Hello ${parentName},\n\nI hope you and your children (${childrenList}) are doing well. This is a message from Aaryavart Centre for Autism and Special Needs.\n\nPlease let us know if you need any assistance.\n\nBest regards,\nAaryavart Centre Team`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleBulkWhatsApp = () => {
    if (selectedParents.length === 0) return;
    
    selectedParents.forEach(parent => {
      const childrenNames = parent.children.map(child => child.fullNameWithCaseId);
      openWhatsApp(parent.phone, parent.name, childrenNames);
    });

    toast({
      title: "WhatsApp Messages Opened",
      description: `Opened WhatsApp for ${selectedParents.length} parents`,
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Active Parents & Children
            </CardTitle>
            <CardDescription>List of all active parents and their children in the centre</CardDescription>
          </div>
          
          <div className="flex gap-3 items-center">
            {!showConsolidated && (
              <Select value={selectedCentre} onValueChange={setSelectedCentre}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gkp">Gorakhpur</SelectItem>
                  <SelectItem value="lko">Lucknow</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <Button 
              onClick={handleBulkWhatsApp}
              disabled={selectedParentIds.length === 0}
              className={`flex items-center gap-2 ${
                selectedParentIds.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              Send WhatsApp ({selectedParentIds.length})
            </Button>
            
            <Button 
              onClick={showConsolidated ? fetchConsolidatedParents : loadSingleCentreData} 
              disabled={loading} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh Data'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Parents</p>
                <p className="text-3xl font-bold text-gray-900">{totalParents}</p>
                <p className="text-xs text-gray-500 mt-1">Active this month</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Children</p>
                <p className="text-3xl font-bold text-gray-900">{totalChildren}</p>
                <p className="text-xs text-gray-500 mt-1">Across all parents</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Avg Children/Parent</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalParents > 0 ? (totalChildren / totalParents).toFixed(1) : '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per family</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Parents Table */}
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Parent Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone Number</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                {showConsolidated && <th className="text-left py-3 px-4 font-semibold text-gray-700">Centre</th>}
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Children</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Children</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((parent, index) => (
                <tr key={parent.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedParentIds.includes(parent.id)}
                      onChange={() => toggleSelect(parent.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {parent.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block">{parent.name}</span>
                        <span className="text-xs text-gray-500">Parent</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="font-mono text-sm text-gray-700">
                        {formatPhone(parent.phone)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {parent.email ? (
                      <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                        {parent.email}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 italic">N/A</span>
                    )}
                  </td>
                  {showConsolidated && (
                    <td className="py-3 px-4">
                      <Badge 
                        variant="outline" 
                        className={`${
                          parent.centre === 'gkp' 
                            ? 'border-green-200 text-green-700 bg-green-50' 
                            : 'border-blue-200 text-blue-700 bg-blue-50'
                        }`}
                      >
                        {centres[parent.centre as keyof typeof centres] || parent.centre}
                      </Badge>
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <div className="space-y-1 max-w-xs">
                      {parent.children.map((child) => (
                        <div key={child.id} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          <span className="text-sm text-gray-700 font-medium truncate">
                            {child.fullNameWithCaseId}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className="bg-blue-600 text-white font-semibold px-3 py-1">
                      {parent.children.length}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {parents.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Parents Found</h3>
              <p className="text-gray-500">No active parents found for the selected criteria</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveParentsTable;
