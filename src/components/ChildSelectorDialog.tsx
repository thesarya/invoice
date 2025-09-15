import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, RefreshCw } from "lucide-react";
import ChildReportDialog from './ChildReportDialog';
import { firebaseApiKeyManager } from "@/lib/firebase-api-key-manager";

interface ChildSelectorDialogProps {
  centre: string;
  trigger: React.ReactNode;
}

interface ChildOption {
  id: string;
  name: string;
  fullNameWithCaseId: string;
}

interface InvoiceWithChild {
  child: {
    id: string;
    firstName: string;
    lastName: string;
    fullNameWithCaseId: string;
    __typename: string;
  } | null;
  __typename: string;
}

const ChildSelectorDialog: React.FC<ChildSelectorDialogProps> = ({ centre, trigger }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableChildren, setAvailableChildren] = useState<ChildOption[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildOption | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const getToken = (centre: string) => {
    try {
      const savedKeys = firebaseApiKeyManager.getKeys();
      return centre === 'gkp' ? savedKeys.gkpToken : savedKeys.lkoToken;
    } catch (error) {
      console.error('Error getting token:', error);
      return centre === 'gkp' ? import.meta.env.VITE_GKP_TOKEN : import.meta.env.VITE_LKO_TOKEN;
    }
  };

  const API_BASE_URL = 'https://care.kidaura.in/api/graphql';

  const fetchAllActiveChildren = async () => {
    setLoading(true);
    try {
      console.log('Fetching all active children from invoices...');
      
      const currentDate = new Date();
      const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      
      const query = `
        query Invoices($startDate: DateTime, $endDate: DateTime, $childId: ID, $status: [InvoiceStatus], $paymentMode: PaymentMode) {
          invoices(
            startDate: $startDate
            endDate: $endDate
            childId: $childId
            status: $status
            paymentMode: $paymentMode
          ) {
            child {
              id
              firstName
              lastName
              fullNameWithCaseId
              __typename
            }
            __typename
          }
        }
      `;

      const token = getToken(centre);
      
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: {
            startDate: oneMonthAgo.toISOString(),
            endDate: endOfCurrentMonth.toISOString(),
            childId: null,
            status: null,
            paymentMode: null
          }
        })
      });

      const data = await response.json();
      console.log('Invoices response for children:', data);
      
      if (data?.data?.invoices) {
        // Extract unique children from invoices
        const childrenMap = new Map();
        
        data.data.invoices.forEach((invoice: InvoiceWithChild) => {
          if (invoice.child && invoice.child.id) {
            childrenMap.set(invoice.child.id, {
              id: invoice.child.id,
              name: `${invoice.child.firstName || ''} ${invoice.child.lastName || ''}`.trim(),
              fullNameWithCaseId: invoice.child.fullNameWithCaseId || `${invoice.child.firstName} ${invoice.child.lastName}`
            });
          }
        });
        
        const uniqueChildren = Array.from(childrenMap.values())
          .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`Found ${uniqueChildren.length} unique active children:`, uniqueChildren);
        setAvailableChildren(uniqueChildren);
        
        toast({
          title: "✅ Children Loaded",
          description: `Found ${uniqueChildren.length} active children with recent invoices`,
        });
      } else {
        toast({
          title: "⚠️ No Data",
          description: "No active children found in recent invoices",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching active children:', error);
      toast({
        title: "❌ Error",
        description: "Failed to fetch active children",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAllActiveChildren();
    }
  }, [open]);

  const handleGenerateReport = (child: ChildOption) => {
    setSelectedChild(child);
    setOpen(false);
    setReportDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Select Child for Progress Report
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Header Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Active Children</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Centre:</strong> {centre === 'gkp' ? 'Gorakhpur' : 'Lucknow'}</p>
                <p><strong>Children Found:</strong> {availableChildren.length}</p>
                <p><strong>Source:</strong> Recent invoices (last 2 months)</p>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="text-center">
              <Button
                onClick={fetchAllActiveChildren}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading Children...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Refresh List
                  </>
                )}
              </Button>
            </div>

            {/* Children List */}
            {availableChildren.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableChildren.map((child) => (
                  <div
                    key={child.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {child.fullNameWithCaseId || child.name}
                        </h4>
                        <p className="text-sm text-gray-600">ID: {child.id}</p>
                      </div>
                      <Button
                        onClick={() => handleGenerateReport(child)}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      >
                        Generate Report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No active children found. Click "Refresh List" to try again.</p>
                </div>
              )
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading active children...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Child Report Dialog */}
      {selectedChild && (
        <ChildReportDialog
          childId={selectedChild.id}
          childName={selectedChild.fullNameWithCaseId || selectedChild.name}
          parentPhone=""
          parentName=""
          centre={centre}
          trigger={<div />}
        />
      )}
    </>
  );
};

export default ChildSelectorDialog;