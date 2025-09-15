import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, Users, Building2, RefreshCw, MessageCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BulkWhatsAppReminderDialog from './BulkWhatsAppReminderDialog';
import AisensyTestDialog from './AisensyTestDialog';

interface Child {
  id: string;
  fullNameWithCaseId: string;
  fatherName: string;
  phone: string;
  email?: string;
  centre: string;
  isActive: boolean;
  lastActivityDate?: string;
  deactivationReason?: string;
}

interface DeactiveChildrenTableProps {
  centre?: string;
  showConsolidated?: boolean;
}

const DeactiveChildrenTable: React.FC<DeactiveChildrenTableProps> = ({ 
  centre = 'gkp', 
  showConsolidated = false 
}) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState(centre);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
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

  const fetchDeactiveChildren = async (fetchCentre = selectedCentre) => {
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

      // Query to get all children and filter for inactive ones
      const query = `
        query Children($startDate: DateTime, $endDate: DateTime) {
          children(
            startDate: $startDate
            endDate: $endDate
          ) {
            id
            fullNameWithCaseId
            fatherName
            phone
            email
            isActive
            lastActivityDate
            deactivationReason
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
          variables: { startDate: start, endDate: end }
        })
      });

      const data = await response.json();
      const allChildren = data?.data?.children || [];

      // Filter for inactive children and add centre information
      const deactiveChildren = allChildren
        .filter((child: any) => !child.isActive)
        .map((child: any) => ({
          ...child,
          centre: fetchCentre
        }));

      return deactiveChildren;
    } catch (error) {
      console.error(`Error fetching deactive children for ${fetchCentre}:`, error);
      return [];
    }
  };

  const fetchConsolidatedData = async () => {
    setLoading(true);
    try {
      const [gkpChildren, lkoChildren] = await Promise.all([
        fetchDeactiveChildren('gkp'),
        fetchDeactiveChildren('lko')
      ]);

      const allChildren = [...gkpChildren, ...lkoChildren];
      setChildren(allChildren);
      
      toast({
        title: "Deactive Children Data Fetched",
        description: `Found ${allChildren.length} deactive children across both centres`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch deactive children data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSingleCentreData = async () => {
    setLoading(true);
    try {
      const fetchedChildren = await fetchDeactiveChildren();
      setChildren(fetchedChildren);
      
      toast({
        title: "Data Fetched Successfully",
        description: `Found ${fetchedChildren.length} deactive children in ${centres[selectedCentre as keyof typeof centres]}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch deactive children data",
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
  }, [selectedCentre, showConsolidated]);

  const formatPhone = (phone: string) => {
    if (!phone || phone === 'No Phone') return 'N/A';
    return phone.startsWith('91') ? phone.substring(2) : phone;
  };

  const totalChildren = children.length;
  const totalCentres = showConsolidated ? 2 : 1;

  // Selection functions
  const allSelected = children.length > 0 && children.every(child => selectedChildIds.includes(child.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedChildIds([]);
    } else {
      setSelectedChildIds(children.map(child => child.id));
    }
  };

  const toggleSelect = (childId: string) => {
    setSelectedChildIds(selectedChildIds.includes(childId)
      ? selectedChildIds.filter(id => id !== childId)
      : [...selectedChildIds, childId]);
  };

  const selectedChildren = children.filter(child => selectedChildIds.includes(child.id));

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Deactive Children
            </CardTitle>
            <CardDescription>List of all deactive children across centres</CardDescription>
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
            
            <BulkWhatsAppReminderDialog
              selectedParents={selectedChildren.map(child => ({
                id: child.id,
                name: child.fatherName,
                phone: child.phone,
                email: child.email,
                children: [{
                  id: child.id,
                  fullNameWithCaseId: child.fullNameWithCaseId,
                  isActive: child.isActive
                }],
                centre: child.centre
              }))}
              trigger={
                <Button 
                  disabled={selectedChildIds.length === 0}
                  className={`flex items-center gap-2 ${
                    selectedChildIds.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  Send Reactivation Reminders ({selectedChildIds.length})
                </Button>
              }
            />
            
            <AisensyTestDialog
              trigger={
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test Aisensy
                </Button>
              }
            />
            
            <Button 
              onClick={showConsolidated ? fetchConsolidatedData : loadSingleCentreData} 
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
                <p className="text-sm font-medium text-gray-600 mb-1">Total Deactive Children</p>
                <p className="text-3xl font-bold text-red-600">{totalChildren}</p>
                <p className="text-xs text-gray-500 mt-1">Across {totalCentres} centre{totalCentres > 1 ? 's' : ''}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Gorakhpur</p>
                <p className="text-3xl font-bold text-gray-900">
                  {children.filter(child => child.centre === 'gkp').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Deactive children</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Lucknow</p>
                <p className="text-3xl font-bold text-gray-900">
                  {children.filter(child => child.centre === 'lko').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Deactive children</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Children Table */}
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Child Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Parent Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                {showConsolidated && <th className="text-left py-3 px-4 font-semibold text-gray-700">Centre</th>}
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Activity</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Deactivation Reason</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {children.map((child, index) => (
                <tr key={child.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedChildIds.includes(child.id)}
                      onChange={() => toggleSelect(child.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                        {child.fullNameWithCaseId.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block">{child.fullNameWithCaseId}</span>
                        <span className="text-xs text-red-500">Deactive</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <span className="font-medium text-gray-900 block">{child.fatherName}</span>
                      <span className="text-xs text-gray-500">Parent</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm text-gray-700">
                          {formatPhone(child.phone)}
                        </span>
                      </div>
                      {child.email && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                          {child.email}
                        </div>
                      )}
                    </div>
                  </td>
                  {showConsolidated && (
                    <td className="py-3 px-4">
                      <Badge 
                        variant="outline" 
                        className={`${
                          child.centre === 'gkp' 
                            ? 'border-green-200 text-green-700 bg-green-50' 
                            : 'border-blue-200 text-blue-700 bg-blue-50'
                        }`}
                      >
                        {centres[child.centre as keyof typeof centres] || child.centre}
                      </Badge>
                    </td>
                  )}
                  <td className="py-3 px-4">
                    {child.lastActivityDate ? (
                      <span className="text-sm text-gray-600">
                        {new Date(child.lastActivityDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Unknown</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {child.deactivationReason ? (
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        {child.deactivationReason}
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Not specified</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <BulkWhatsAppReminderDialog
                      selectedParents={[{
                        id: child.id,
                        name: child.fatherName,
                        phone: child.phone,
                        email: child.email,
                        children: [{
                          id: child.id,
                          fullNameWithCaseId: child.fullNameWithCaseId,
                          isActive: child.isActive
                        }],
                        centre: child.centre
                      }]}
                      trigger={
                        <button 
                          className="px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-xs flex items-center gap-1"
                          title="Send reactivation reminder"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Send Reminder
                        </button>
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {children.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Deactive Children Found</h3>
              <p className="text-gray-500">No deactive children found for the selected criteria</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeactiveChildrenTable;
