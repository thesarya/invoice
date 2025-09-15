import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Eye, EyeOff, TestTube, CheckCircle, XCircle, Cloud, CloudOff } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { firebaseApiKeyManager } from "@/lib/firebase-api-key-manager";
import { aiService } from "@/lib/ai-service";
import { aisensyService } from "@/lib/aisensy";

interface ApiKeys {
  gkpToken: string;
  lkoToken: string;
  apiUrl: string;
  aisensyKey: string;
  chatgptKey: string;
  geminiKey: string;
  deepseekKey: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gkpToken: '',
    lkoToken: '',
    apiUrl: 'https://care.kidaura.in/api/graphql',
    aisensyKey: '',
    chatgptKey: '',
    geminiKey: '',
    deepseekKey: '',
    razorpayKeyId: '',
    razorpayKeySecret: ''
  });

  const [showKeys, setShowKeys] = useState<{[key: string]: boolean}>({});
  const [testing, setTesting] = useState<{[key: string]: boolean}>({});
  const [testResults, setTestResults] = useState<{[key: string]: 'success' | 'error' | null}>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load saved keys from Firebase on component mount
  useEffect(() => {
    const loadKeys = async () => {
      if (user) {
        try {
          const keys = await firebaseApiKeyManager.loadKeys();
          setApiKeys(keys);
        } catch (error) {
          console.error('Error loading API keys from Firebase:', error);
          toast({
            title: "Firebase Not Set Up",
            description: "Using local storage. Set up Firestore database for cloud storage.",
            variant: "destructive",
          });
        }
      }
      setLoading(false);
    };

    loadKeys();
  }, [user, toast]);

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleInputChange = (key: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveKeys = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save API keys",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const success = await firebaseApiKeyManager.saveKeys(apiKeys);
      if (success) {
        toast({
          title: "Settings Saved",
          description: "All API keys have been saved to cloud storage",
        });
      } else {
        throw new Error('Failed to save to Firebase');
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: "Firebase Not Available",
        description: "Saved to local storage. Set up Firestore for cloud storage.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testApiConnection = async (type: string) => {
    setTesting(prev => ({ ...prev, [type]: true }));
    setTestResults(prev => ({ ...prev, [type]: null }));

    try {
      let success = false;
      
      switch (type) {
        case 'gkp':
          if (apiKeys.gkpToken && apiKeys.apiUrl) {
            const response = await fetch(apiKeys.apiUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKeys.gkpToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: `query { childrenCount { activeChildren } }`
              })
            });
            success = response.ok;
          }
          break;
          
        case 'lko':
          if (apiKeys.lkoToken && apiKeys.apiUrl) {
            const response = await fetch(apiKeys.apiUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKeys.lkoToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: `query { childrenCount { activeChildren } }`
              })
            });
            success = response.ok;
          }
          break;
          
        case 'aisensy':
          if (apiKeys.aisensyKey) {
            console.log('Testing Aisensy connection with key:', apiKeys.aisensyKey ? `${apiKeys.aisensyKey.substring(0, 20)}...` : 'empty');
            success = await aisensyService.testAisensyConnection();
          } else {
            console.log('No Aisensy key found in apiKeys');
          }
          break;
          
        case 'gemini':
          if (apiKeys.geminiKey) {
            const result = await aiService.testConnection('gemini');
            success = result.success;
          }
          break;
          
        case 'deepseek':
          if (apiKeys.deepseekKey) {
            const result = await aiService.testConnection('deepseek');
            success = result.success;
          }
          break;
      }

      setTestResults(prev => ({ ...prev, [type]: success ? 'success' : 'error' }));
      
      toast({
        title: success ? "Connection Successful" : "Connection Failed",
        description: success ? `${type.toUpperCase()} API connection is working` : `Failed to connect to ${type.toUpperCase()} API`,
        variant: success ? "default" : "destructive",
      });
    } catch (error) {
      setTestResults(prev => ({ ...prev, [type]: 'error' }));
      toast({
        title: "Connection Failed",
        description: `Error testing ${type.toUpperCase()} API connection`,
        variant: "destructive",
      });
    } finally {
      setTesting(prev => ({ ...prev, [type]: false }));
    }
  };

  const getTestIcon = (type: string) => {
    if (testing[type]) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />;
    }
    if (testResults[type] === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (testResults[type] === 'error') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <TestTube className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation selectedCentre="Settings" onCentreChange={() => {}} />
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading API keys from cloud storage...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation selectedCentre="Settings" onCentreChange={() => {}} />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings & API Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your API keys and test connections
          </p>
        </div>

        <Tabs defaultValue="api-keys" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="razorpay">Razorpay</TabsTrigger>
            <TabsTrigger value="ai-services">AI Services</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Main API Configuration</CardTitle>
                <CardDescription>
                  Configure your main API endpoint and organization tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api-url">API Base URL</Label>
                  <Input
                    id="api-url"
                    value={apiKeys.apiUrl}
                    onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                    placeholder="https://care.kidaura.in/api/graphql"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="gkp-token">GKP Token</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testApiConnection('gkp')}
                          disabled={testing.gkp || !apiKeys.gkpToken}
                        >
                          {getTestIcon('gkp')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility('gkpToken')}
                        >
                          {showKeys.gkpToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Input
                      id="gkp-token"
                      type={showKeys.gkpToken ? "text" : "password"}
                      value={apiKeys.gkpToken}
                      onChange={(e) => handleInputChange('gkpToken', e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="lko-token">LKO Token</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testApiConnection('lko')}
                          disabled={testing.lko || !apiKeys.lkoToken}
                        >
                          {getTestIcon('lko')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility('lkoToken')}
                        >
                          {showKeys.lkoToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Input
                      id="lko-token"
                      type={showKeys.lkoToken ? "text" : "password"}
                      value={apiKeys.lkoToken}
                      onChange={(e) => handleInputChange('lkoToken', e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="razorpay" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Razorpay Payment Gateway</CardTitle>
                <CardDescription>
                  Configure Razorpay for payment link generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="razorpay-key-id">Razorpay Key ID</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleKeyVisibility('razorpayKeyId')}
                    >
                      {showKeys.razorpayKeyId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Input
                    id="razorpay-key-id"
                    type={showKeys.razorpayKeyId ? "text" : "password"}
                    value={apiKeys.razorpayKeyId}
                    onChange={(e) => handleInputChange('razorpayKeyId', e.target.value)}
                    placeholder="rzp_test_..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="razorpay-key-secret">Razorpay Key Secret</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleKeyVisibility('razorpayKeySecret')}
                    >
                      {showKeys.razorpayKeySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Input
                    id="razorpay-key-secret"
                    type={showKeys.razorpayKeySecret ? "text" : "password"}
                    value={apiKeys.razorpayKeySecret}
                    onChange={(e) => handleInputChange('razorpayKeySecret', e.target.value)}
                    placeholder="Your Razorpay secret key"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Razorpay Setup Instructions</h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Sign up at <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="underline">razorpay.com</a></li>
                    <li>Go to Settings → API Keys in your dashboard</li>
                    <li>Generate a new key pair</li>
                    <li>Copy the Key ID and Key Secret</li>
                    <li>Paste them in the fields above</li>
                    <li>Use test keys for development, live keys for production</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Services Configuration</CardTitle>
                <CardDescription>
                  Configure AI service API keys for enhanced functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="chatgpt-key">ChatGPT API Key</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleKeyVisibility('chatgptKey')}
                    >
                      {showKeys.chatgptKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Input
                    id="chatgpt-key"
                    type={showKeys.chatgptKey ? "text" : "password"}
                    value={apiKeys.chatgptKey}
                    onChange={(e) => handleInputChange('chatgptKey', e.target.value)}
                    placeholder="sk-..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleKeyVisibility('geminiKey')}
                    >
                      {showKeys.geminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="gemini-key"
                      type={showKeys.geminiKey ? "text" : "password"}
                      value={apiKeys.geminiKey}
                      onChange={(e) => handleInputChange('geminiKey', e.target.value)}
                      placeholder="AIza..."
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testApiConnection('gemini')}
                      disabled={testing.gemini || !apiKeys.geminiKey}
                    >
                      {getTestIcon('gemini')}
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="deepseek-key">DeepSeek API Key</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleKeyVisibility('deepseekKey')}
                    >
                      {showKeys.deepseekKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="deepseek-key"
                      type={showKeys.deepseekKey ? "text" : "password"}
                      value={apiKeys.deepseekKey}
                      onChange={(e) => handleInputChange('deepseekKey', e.target.value)}
                      placeholder="sk-..."
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testApiConnection('deepseek')}
                      disabled={testing.deepseek || !apiKeys.deepseekKey}
                    >
                      {getTestIcon('deepseek')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Integration</CardTitle>
                <CardDescription>
                  Configure Aisensy for WhatsApp notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="aisensy-key">Aisensy API Key</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testApiConnection('aisensy')}
                        disabled={testing.aisensy || !apiKeys.aisensyKey}
                      >
                        {getTestIcon('aisensy')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleKeyVisibility('aisensyKey')}
                      >
                        {showKeys.aisensyKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="aisensy-key"
                    type={showKeys.aisensyKey ? "text" : "password"}
                    value={apiKeys.aisensyKey}
                    onChange={(e) => handleInputChange('aisensyKey', e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">WhatsApp Setup Instructions</h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Sign up at <a href="https://aisensy.com" target="_blank" rel="noopener noreferrer" className="underline">aisensy.com</a></li>
                    <li>Apply for WhatsApp Business API</li>
                    <li>Create a payment reminder template</li>
                    <li>Get your API key from the dashboard</li>
                    <li>Paste the API key above and test the connection</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button 
            onClick={saveKeys} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Quick Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Setup Guide</CardTitle>
            <CardDescription>
              Follow these steps to get started quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
                <h3 className="font-semibold mb-2">Add API Keys</h3>
                <p className="text-sm text-gray-600">Paste your organization tokens and API keys in the respective fields</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
                <h3 className="font-semibold mb-2">Test Connections</h3>
                <p className="text-sm text-gray-600">Use the test buttons to verify your API connections are working</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">3</div>
                <h3 className="font-semibold mb-2">Save & Use</h3>
                <p className="text-sm text-gray-600">Save your settings and start sending notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
