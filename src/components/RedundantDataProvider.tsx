import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Alert component replaced with div-based implementation
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Database, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RedundantDataProviderProps {
  children: React.ReactNode;
  onConnectionError?: (error: Error) => void;
  fallbackData?: any;
}

interface ConnectionStatus {
  firebase: 'connected' | 'disconnected' | 'error';
  api: 'connected' | 'disconnected' | 'error';
  lastSync: Date | null;
}

const RedundantDataProvider: React.FC<RedundantDataProviderProps> = ({
  children,
  onConnectionError,
  fallbackData
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    firebase: 'disconnected',
    api: 'disconnected',
    lastSync: null
  });
  const [redundantData, setRedundantData] = useState<any>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { toast } = useToast();
  const connectionCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor Firebase connection status
  useEffect(() => {
    const checkConnections = async () => {
      try {
        // Check Firebase connection
        const firebaseStatus = await checkFirebaseConnection();
        
        // Check API connection
        const apiStatus = await checkApiConnection();
        
        setConnectionStatus(prev => ({
          ...prev,
          firebase: firebaseStatus,
          api: apiStatus,
          lastSync: new Date()
        }));

        // If both connections fail, show fallback
        if (firebaseStatus === 'error' && apiStatus === 'error') {
          setShowFallback(true);
          if (onConnectionError) {
            onConnectionError(new Error('Both Firebase and API connections failed'));
          }
        } else {
          setShowFallback(false);
        }
      } catch (error) {
        console.error('Connection check failed:', error);
        setShowFallback(true);
      }
    };

    // Initial check
    checkConnections();

    // Set up periodic connection checks
    connectionCheckRef.current = setInterval(checkConnections, 30000); // Check every 30 seconds

    return () => {
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
    };
  }, [onConnectionError]);

  const checkFirebaseConnection = async (): Promise<'connected' | 'disconnected' | 'error'> => {
    try {
      // Try to access Firebase auth state
      const { auth } = await import('@/lib/firebase');
      if (auth.currentUser !== undefined) {
        return 'connected';
      }
      return 'disconnected';
    } catch (error) {
      console.error('Firebase connection check failed:', error);
      return 'error';
    }
  };

  const checkApiConnection = async (): Promise<'connected' | 'disconnected' | 'error'> => {
    try {
      // Try a simple API health check
      const response = await fetch('https://care.kidaura.in/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: '{ __typename }'
        })
      });
      
      if (response.ok) {
        return 'connected';
      }
      return 'error';
    } catch (error) {
      console.error('API connection check failed:', error);
      return 'error';
    }
  };

  const handleRetryConnection = async () => {
    toast({
      title: "Retrying Connections",
      description: "Checking Firebase and API connectivity...",
    });

    try {
      const firebaseStatus = await checkFirebaseConnection();
      const apiStatus = await checkApiConnection();
      
      setConnectionStatus({
        firebase: firebaseStatus,
        api: apiStatus,
        lastSync: new Date()
      });

      if (firebaseStatus === 'connected' || apiStatus === 'connected') {
        setShowFallback(false);
        toast({
          title: "Connection Restored",
          description: "Successfully reconnected to services",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to services. Using cached data.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Retry Failed",
        description: "Connection retry unsuccessful. Please check your internet connection.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'disconnected': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="redundant-data-provider">
      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <Card className={`${isMinimized ? 'w-48' : 'w-64'} shadow-lg transition-all duration-200`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Connection Status
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronUp className="h-3 w-3" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          {!isMinimized && (
            <CardContent className="pt-0">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span>Firebase:</span>
                  <span className={`flex items-center gap-1 ${getStatusColor(connectionStatus.firebase)}`}>
                    {getStatusIcon(connectionStatus.firebase)}
                    {connectionStatus.firebase}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>API:</span>
                  <span className={`flex items-center gap-1 ${getStatusColor(connectionStatus.api)}`}>
                    {getStatusIcon(connectionStatus.api)}
                    {connectionStatus.api}
                  </span>
                </div>
                {connectionStatus.lastSync && (
                  <div className="text-xs text-gray-500 mt-1">
                    Last check: {connectionStatus.lastSync.toLocaleTimeString()}
                  </div>
                )}
              </div>
              {(connectionStatus.firebase === 'error' || connectionStatus.api === 'error') && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-2" 
                  onClick={handleRetryConnection}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Fallback Data Alert */}
      {showFallback && (
        <div className="mb-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-yellow-800">
                  Connection issues detected. Using cached/fallback data. Some features may be limited.
                </span>
                <Button size="sm" variant="outline" onClick={handleRetryConnection}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redundant Data Container - This div provides redundant data handling */}
      <div 
        id="redundant-data-container"
        className="redundant-data-container"
        data-connection-status={JSON.stringify(connectionStatus)}
        data-fallback-active={showFallback}
        data-last-sync={connectionStatus.lastSync?.toISOString()}
      >
        {children}
      </div>

      {/* Hidden fallback data storage */}
      <div 
        id="fallback-data-storage" 
        className="hidden"
        data-fallback-data={JSON.stringify(fallbackData || {
          invoices: [],
          activeUsers: { activeChildren: 0, activeMember: 0 },
          stats: { totalRevenue: 0, totalInvoices: 0, paidInvoices: 0, pendingInvoices: 0 },
          lastUpdate: new Date().toISOString()
        })}
      >
        {/* This div stores redundant/fallback data for offline access */}
      </div>
    </div>
  );
};

export default RedundantDataProvider;