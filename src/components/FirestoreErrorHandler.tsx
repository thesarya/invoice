import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { connectToFirestore } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface FirestoreErrorHandlerProps {
  onRetry?: () => void;
  onFallbackMode?: (enabled: boolean) => void;
}

const FirestoreErrorHandler: React.FC<FirestoreErrorHandlerProps> = ({
  onRetry,
  onFallbackMode
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "Internet connection is back online",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setFallbackMode(true);
      onFallbackMode?.(true);
      toast({
        title: "Connection Lost",
        description: "Working in offline mode with cached data",
        variant: "destructive",
      });
    };

    // Listen for Firestore-specific errors
    const handleFirestoreError = (event: ErrorEvent) => {
      const errorMessage = event.message || event.error?.message || '';
      
      // Check for specific Firestore Listen channel errors
      if (errorMessage.includes('firestore.googleapis.com') || 
          errorMessage.includes('Listen/channel') ||
          errorMessage.includes('ERR_ABORTED')) {
        
        console.error('Firestore Listen channel error detected:', errorMessage);
        setFirestoreError(errorMessage);
        
        // Enable fallback mode after multiple failures
        if (retryCount >= 3) {
          setFallbackMode(true);
          onFallbackMode?.(true);
          toast({
            title: "Firestore Connection Failed",
            description: "Switching to offline mode. Some real-time features may be unavailable.",
            variant: "destructive",
          });
        }
      }
    };

    // Listen for network errors
    const handleNetworkError = (event: Event) => {
      console.error('Network error detected:', event);
      if (!isOnline) {
        setFallbackMode(true);
        onFallbackMode?.(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('error', handleFirestoreError);
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('firestore') || 
          event.reason?.message?.includes('Listen/channel')) {
        handleFirestoreError(new ErrorEvent('firestore-error', {
          message: event.reason.message
        }));
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleFirestoreError);
    };
  }, [retryCount, isOnline, onFallbackMode, toast]);

  const handleRetry = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect to Firestore.",
        variant: "destructive",
      });
      return;
    }

    setRetryCount(prev => prev + 1);
    setFirestoreError(null);
    setIsConnecting(true);
    
    try {
      console.log('Attempting to reconnect to Firestore with authenticated user...');
      
      // Wait for proper Firestore connection
      const connected = await connectToFirestore();
      
      if (connected) {
        toast({
          title: "Connection Restored",
          description: "Successfully reconnected to Firestore.",
        });
        
        // Call parent retry function
        onRetry?.();
        
        // Reset fallback mode
        setFallbackMode(false);
        onFallbackMode?.(false);
      } else {
        throw new Error('Failed to establish Firestore connection');
      }
      
    } catch (error) {
      console.error('Retry failed:', error);
      toast({
        title: "Retry Failed",
        description: "Unable to reconnect. Continuing in offline mode.",
        variant: "destructive",
      });
      
      // Enable fallback mode after failed retry
      if (retryCount >= 2) {
        setFallbackMode(true);
        onFallbackMode?.(true);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleForceFallback = () => {
    setFallbackMode(true);
    setFirestoreError(null);
    onFallbackMode?.(true);
    toast({
      title: "Offline Mode Enabled",
      description: "Using cached data. Real-time updates disabled.",
    });
  };

  // Don't render if no errors and online
  if (!firestoreError && isOnline && !fallbackMode) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="border-red-200 bg-red-50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-red-800">
            {isOnline ? (
              <><Wifi className="h-4 w-4" /> Connection Issue</>
            ) : (
              <><WifiOff className="h-4 w-4" /> Offline Mode</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {firestoreError && (
              <div className="text-xs text-red-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Firestore connection failed. Using cached data.</span>
                </div>
              </div>
            )}
            
            {!isOnline && (
              <div className="text-xs text-red-700">
                <div className="flex items-start gap-2">
                  <WifiOff className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>No internet connection. Working offline.</span>
                </div>
              </div>
            )}

            {fallbackMode && (
              <div className="text-xs text-amber-700 bg-amber-100 p-2 rounded">
                📱 Offline mode active - some features may be limited
              </div>
            )}

            <div className="flex gap-2">
              {isOnline && (
                <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRetry}
                className="flex-1"
                disabled={isConnecting || !user}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isConnecting ? 'animate-spin' : ''}`} />
                {isConnecting ? 'Connecting...' : `Retry (${retryCount})`}
              </Button>
              )}
              
              {!fallbackMode && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={handleForceFallback}
                  className="flex-1"
                >
                  Use Offline
                </Button>
              )}
            </div>
            
            {retryCount > 0 && (
              <div className="text-xs text-gray-600">
                Retry attempts: {retryCount}/3
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirestoreErrorHandler;