import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TestTube, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { aisensyService } from '@/lib/aisensy';

const AisensyTestDialog: React.FC<{ trigger: React.ReactNode }> = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    templates: any[];
    templateId: string | null;
    error: string | null;
  }>({ templates: [], templateId: null, error: null });
  const { toast } = useToast();

  const runTest = async () => {
    setTesting(true);
    setTestResults({ templates: [], templateId: null, error: null });

    try {
      // Test 1: Fetch all templates
      toast({
        title: "Testing Aisensy Connection",
        description: "Fetching templates from Aisensy API...",
      });

      const templatesResponse = await aisensyService.fetchTemplates();
      console.log('Templates response:', templatesResponse);

      // Test 2: Get template ID
      const templateId = await aisensyService.getTemplateId();
      console.log('Template ID:', templateId);

      setTestResults({
        templates: templatesResponse.templates || [],
        templateId,
        error: null
      });

      toast({
        title: "Test Successful!",
        description: `Found ${templatesResponse.templates?.length || 0} templates. Template ID: ${templateId}`,
      });

    } catch (error) {
      console.error('Aisensy test error:', error);
      setTestResults({
        templates: [],
        templateId: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Aisensy",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            Aisensy API Test
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Button */}
          <div className="flex justify-center">
            <Button
              onClick={runTest}
              disabled={testing}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Aisensy Connection...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Aisensy API
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          {testResults.templates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-green-700">Connection Successful!</h3>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Template ID Found:</h4>
                <code className="bg-green-100 px-2 py-1 rounded text-green-800 font-mono">
                  {testResults.templateId}
                </code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">All Available Templates:</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {testResults.templates.map((template, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{template.name}</span>
                        <span className="text-gray-500 ml-2">({template.category})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          template.status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {template.status}
                        </span>
                        <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                          {template.id}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {testResults.error && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-red-700">Connection Failed</h3>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Error:</h4>
                <code className="bg-red-100 px-2 py-1 rounded text-red-800">
                  {testResults.error}
                </code>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Troubleshooting:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Check if your API key is correct</li>
                  <li>• Verify your template name matches exactly</li>
                  <li>• Ensure your template is approved</li>
                  <li>• Check your internet connection</li>
                </ul>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">What This Test Does:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Connects to Aisensy API using your API key</li>
              <li>• Fetches all available templates</li>
              <li>• Finds the template ID for your payment reminder template</li>
              <li>• Shows all templates and their status</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AisensyTestDialog;
