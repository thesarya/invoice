import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, Calendar, Building2, Database, Settings } from "lucide-react";


interface StreamlinedControlPanelProps {
  // Data filters
  showConsolidated: boolean;
  setShowConsolidated: (value: boolean) => void;
  centre: string;
  setCentre: (value: string) => void;
  year: number;
  setYear: (value: number) => void;
  month: number;
  setMonth: (value: number) => void;
  
  // Actions
  onRefreshData: () => void;
  onExportData: () => void;
  onReloadConfig: () => void;
  
  // State
  loading: boolean;
  isConfigured: boolean;
  
  // Data summary
  totalInvoices?: number;
  totalRevenue?: number;
  activeUsers?: {
    activeChildren: number;
    activeMember: number;
  };
}

const StreamlinedControlPanel: React.FC<StreamlinedControlPanelProps> = ({
  showConsolidated,
  setShowConsolidated,
  centre,
  setCentre,
  year,
  setYear,
  month,
  setMonth,
  onRefreshData,
  onExportData,
  onReloadConfig,
  loading,
  isConfigured,
  totalInvoices = 0,
  totalRevenue = 0,
  activeUsers
}) => {
  const centres = {
    gkp: 'Gorakhpur',
    lko: 'Lucknow'
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Data Control Panel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConfigured ? "default" : "destructive"} className="text-xs">
              {isConfigured ? 'API Configured' : 'API Not Configured'}
            </Badge>
            {activeUsers && (
              <Badge variant="outline" className="text-xs">
                {activeUsers.activeChildren} Active Students
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Data Source Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Data Source</Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="consolidated-switch" className="text-sm text-gray-600">
                  Single Centre
                </Label>
                <input
                  id="consolidated-switch"
                  type="checkbox"
                  checked={showConsolidated}
                  onChange={(e) => setShowConsolidated(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <Label htmlFor="consolidated-switch" className="text-sm text-gray-600">
                  All Centres
                </Label>
              </div>
            </div>
            
            {!showConsolidated && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Select Centre</Label>
                <Select value={centre} onValueChange={setCentre}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gkp">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Gorakhpur
                      </div>
                    </SelectItem>
                    <SelectItem value="lko">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Lucknow
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* Time Period Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Time Period
            </Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Month</Label>
                <Select value={month.toString()} onValueChange={(value) => setMonth(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((monthName, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {monthName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Year</Label>
                <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((yearOption) => (
                      <SelectItem key={yearOption} value={yearOption.toString()}>
                        {yearOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        {(totalInvoices > 0 || totalRevenue > 0) && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{totalInvoices}</p>
                <p className="text-xs text-gray-600">Total Invoices</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Total Revenue</p>
              </div>
              {activeUsers && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{activeUsers.activeChildren}</p>
                    <p className="text-xs text-gray-600">Active Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{activeUsers.activeMember}</p>
                    <p className="text-xs text-gray-600">Active Members</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={onRefreshData} 
            disabled={loading} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-1 min-w-[140px]"
          >
            <Database className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Refresh Data'}
          </Button>
          
          <Button 
            onClick={onExportData} 
            variant="outline" 
            className="flex items-center gap-2 min-w-[120px]"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          
          <Button 
            onClick={onReloadConfig} 
            variant="outline"
            className="flex items-center gap-2 min-w-[120px]"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Config
          </Button>
        </div>
        
        {/* Configuration Warning */}
        {!isConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className="font-medium text-amber-800 mb-1">API Configuration Required</h4>
                <p className="text-sm text-amber-700">
                  Please configure your API keys in Settings to access invoice data and enable all features.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreamlinedControlPanel;