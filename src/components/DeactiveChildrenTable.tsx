import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, Users, Building2, RefreshCw, MessageCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BulkWhatsAppReminderDialog from './BulkWhatsAppReminderDialog';
import AisensyTestDialog from './AisensyTestDialog';
import WhatsAppNotificationSystem from './WhatsAppNotificationSystem';
import { firebaseApiKeyManager } from "@/lib/firebase-api-key-manager";

interface Child {
  id: string;
  fullNameWithCaseId: string;
  fullName: string;
  deactivated: boolean;
  deactivationTime?: string;
  centre: string;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    contactNo: string;
    primaryEmail?: string;
  }[];
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

  // Get tokens from API key manager
  const getTokens = () => {
    try {
      const savedKeys = firebaseApiKeyManager.getKeys();
      return {
        gkp: savedKeys.gkpToken || import.meta.env.VITE_GKP_TOKEN,
        lko: savedKeys.lkoToken || import.meta.env.VITE_LKO_TOKEN
      };
    } catch (error) {
      console.error('Error getting tokens:', error);
      return {
        gkp: import.meta.env.VITE_GKP_TOKEN,
        lko: import.meta.env.VITE_LKO_TOKEN
      };
    }
  };

  const getApiUrl = () => {
    try {
      const savedKeys = firebaseApiKeyManager.getKeys();
      return savedKeys.apiUrl || import.meta.env.VITE_API_BASE_URL || 'https://care.kidaura.in/api/graphql';
    } catch (error) {
      return import.meta.env.VITE_API_BASE_URL || 'https://care.kidaura.in/api/graphql';
    }
  };

  const tokens = getTokens();
  const API_BASE_URL = getApiUrl();

  const fetchDeactiveChildren = async (fetchCentre = selectedCentre) => {
    setLoading(true);
    try {
      // Get the token for the specific centre
      const currentTokens = getTokens();
      const requiredToken = currentTokens[fetchCentre as keyof typeof currentTokens];
      
      if (!requiredToken) {
        console.log(`No ${fetchCentre.toUpperCase()} token found for deactive children`);
        toast({
          title: "API Token Required",
          description: `Please add your ${fetchCentre.toUpperCase()} organization token in Settings and save it to continue`,
          variant: "destructive",
        });
        return [];
      }
      
      console.log(`Fetching deactive children for ${fetchCentre} with token: ${requiredToken.substring(0, 10)}...`);

      // Query to get all children using allChildrenPaginated
      const query = `
        query allChildrenPaginated($search: String, $filter: childrenFilterInput, $offset: Int, $limit: Int) {
          allChildrenPaginated(
            searchQuery: $search
            filter: $filter
            offset: $offset
            limit: $limit
          ) {
            children {
              id
              fullNameWithCaseId
              fullName
              deactivated
              deactivationTime
              parent {
                id
                firstName
                lastName
                contactNo
                primaryEmail
              }
            }
            hasMore
            offset
          }
        }
      `;

      console.log('Fetching all children to filter for deactivated ones...');

      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${requiredToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: {
            search: "",
            offset: 0,
            limit: 100,
            filter: {
              conditions: [],
              therapy: []
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP ${response.status} error for ${fetchCentre}:`, {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          requestUrl: API_BASE_URL,
          requestHeaders: {
            'Authorization': `Bearer ${requiredToken.substring(0, 10)}...`,
            'Content-Type': 'application/json'
          },
          requestBody: JSON.stringify({ query })
        });
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        throw new Error(`GraphQL error: ${data.errors[0]?.message || 'Unknown error'}`);
      }
      
      const allChildren = data?.data?.allChildrenPaginated?.children || [];
      console.log(`Found ${allChildren.length} total children for ${fetchCentre}`);
      
      // Log active/inactive breakdown
      const activeCount = allChildren.filter((child: any) => !child.deactivated).length;
      const inactiveCount = allChildren.filter((child: any) => child.deactivated).length;
      console.log(`Active children: ${activeCount}, Deactivated children: ${inactiveCount}`);
      
      // Log some sample data for debugging
      if (allChildren.length > 0) {
        console.log('Sample child data:', {
          first: allChildren[0],
          activeStatus: allChildren.map((c: any) => ({ id: c.id, name: c.fullNameWithCaseId, deactivated: c.deactivated })).slice(0, 5)
        });
      }

      // Filter for deactivated children and add centre information
      const deactiveChildren = allChildren
        .filter((child: any) => child.deactivated)
        .map((child: any) => ({
          ...child,
          centre: fetchCentre,
          // Ensure parent is always an array
          parent: Array.isArray(child.parent) ? child.parent : [child.parent]
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
      console.log(`Consolidated data: GKP=${gkpChildren.length}, LKO=${lkoChildren.length}, Total=${allChildren.length}`);
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
      console.log(`Single centre data for ${selectedCentre}: ${fetchedChildren.length} deactive children`);
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
                name: `${child.parent[0]?.firstName || ''} ${child.parent[0]?.lastName || ''}`,
                phone: child.parent[0]?.contactNo || '',
                email: child.parent[0]?.primaryEmail,
                children: [{
                  id: child.id,
                  fullNameWithCaseId: child.fullNameWithCaseId,
                  isActive: !child.deactivated
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
                  Bulk Fee Reminder ({selectedChildIds.length})
                </Button>
              }
            />
            
            <Button 
              disabled={selectedChildIds.length === 0}
              className={`flex items-center gap-2 ${
                selectedChildIds.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white'
              }`}
              onClick={() => {
                // Handle bulk notification for selected children
                selectedChildren.forEach(child => {
                  // Open WhatsApp notification for each selected child
                  const phone = child.parent[0]?.contactNo || '';
                  const message = `Dear ${child.parent[0]?.firstName || 'Parent'}, this is a notification regarding ${child.fullNameWithCaseId}.`;
                  const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                });
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Bulk Notification ({selectedChildIds.length})
            </Button>
            
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
                      <span className="font-medium text-gray-900 block">{child.parent[0]?.firstName || ''} {child.parent[0]?.lastName || ''}</span>
                      <span className="text-xs text-gray-500">Parent</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {child.parent.map((parent, parentIndex) => (
                        <div key={parent.id || parentIndex} className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm text-gray-700">
                            {formatPhone(parent.contactNo || '')}
                          </span>
                        </div>
                      ))}
                      {child.parent[0]?.primaryEmail && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                          {child.parent[0].primaryEmail}
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
                    {child.deactivationTime ? (
                      <span className="text-sm text-gray-600">
                        {new Date(child.deactivationTime).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Unknown</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      Deactivated
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <WhatsAppNotificationSystem
                      defaultPhone={child.parent[0]?.contactNo || ''}
                      studentName={child.fullNameWithCaseId}
                      parentName={`${child.parent[0]?.firstName || ''} ${child.parent[0]?.lastName || ''}`}
                      isActive={false}
                      centre={centres[child.centre as keyof typeof centres] || child.centre}
                      trigger={
                        <button 
                          className="px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-xs flex items-center gap-1"
                          title="Send notification to inactive student"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Send Notification
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
