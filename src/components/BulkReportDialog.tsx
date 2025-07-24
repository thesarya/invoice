import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, RefreshCw, Eye, Send, Download, MessageCircle } from "lucide-react";
import { generateHTMLReport, HTMLReportData } from "@/lib/html-report-generator";

interface Invoice {
  id: string;
  invoiceNo: string;
  total: number;
  child?: {
    fullNameWithCaseId?: string;
    fatherName?: string;
    phone?: string;
    email?: string;
  };
  centre?: string;
}

interface ChildNote {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  isSharedWithParent: boolean;
  tags: string[];
  createdBy: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface BulkReportDialogProps {
  selectedInvoices: Invoice[];
  onReportsGenerated: (reports: { [key: string]: { htmlContent: string; aiInsights: string; childNotes: ChildNote[] } }) => void;
}

interface ReportData {
  htmlContent: string;
  aiInsights: string;
  childNotes: ChildNote[];
  fileName: string;
}

const BulkReportDialog: React.FC<BulkReportDialogProps> = ({ selectedInvoices, onReportsGenerated }) => {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<{ [key: string]: ReportData }>({});
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Get environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://care.kidaura.in/api/graphql';
  const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_KEY_SECRET || 'sk-test-dummy-key-for-testing';
  const tokens = {
    gkp: import.meta.env.VITE_GKP_TOKEN,
    lucknow: import.meta.env.VITE_LKO_TOKEN
  };

  const generateBulkReports = async () => {
    if (selectedInvoices.length === 0) return;

    setGenerating(true);
    setProgress(0);
    const newReports: { [key: string]: ReportData } = {};

    try {
      for (let i = 0; i < selectedInvoices.length; i++) {
        const invoice = selectedInvoices[i];
        setProgress(Math.round(((i + 1) / selectedInvoices.length) * 100));

        try {
          const childId = invoice.child?.fullNameWithCaseId || 'test-child-id';
          const centre = invoice.centre || 'gkp';
          const token = tokens[centre as keyof typeof tokens];

          // Step 1: Find actual child ID
          let resolvedChildId = childId;
          try {
            const childSearchQuery = `
              query allChildren($search: String, $filter: childrenFilterInput) {
                allChildren(searchQuery: $search, filter: $filter) {
                  id
                  firstName
                  lastName
                  fullNameWithCaseId
                  fullName
                  caseId
                  __typename
                }
              }
            `;

            const childSearchResponse = await fetch(API_BASE_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: childSearchQuery,
                variables: { search: childId, filter: null }
              })
            });

            const childSearchData = await childSearchResponse.json();
                         if (childSearchData?.data?.allChildren) {
               const matchingChild = childSearchData.data.allChildren.find(
                 (child: { fullNameWithCaseId: string; id: string }) => child.fullNameWithCaseId === childId
               );
              if (matchingChild) {
                resolvedChildId = matchingChild.id;
              }
            }
          } catch (error) {
            console.log('Child ID resolution failed, using original ID');
          }

          // Step 2: Fetch child notes
          const notesQuery = `
            query childNotes($childId: ID!, $offset: Int, $limit: Int) {
              childNotes(childId: $childId, offset: $offset, limit: $limit) {
                id
                title
                text
                createdAt
                isSharedWithParent
                tags
                createdBy {
                  user {
                    firstName
                    lastName
                  }
                }
              }
            }
          `;

          const notesResponse = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: notesQuery,
              variables: { childId: resolvedChildId, offset: 0, limit: 30 }
            })
          });

          const notesData = await notesResponse.json();
          const childNotes = notesData?.data?.childNotes || [];

          // Step 3: Generate AI insights
          let aiInsights = '';
          const childFullName = invoice.child?.fullNameWithCaseId || 'Child';
          
          if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== 'sk-test-dummy-key-for-testing' && childNotes.length > 0) {
            try {
              const prompt = `You are an expert child development specialist and therapist at Aaryavart Centre for Autism and Special Needs. 
Please analyze the following therapy session notes for ${childFullName} and create a concise, positive progress report focusing ONLY on therapeutic insights and improvements.

**Notes Data:**
${JSON.stringify(childNotes, null, 2)}

**Requirements:**
1. Focus ONLY on therapeutic progress and improvements from the notes
2. Be specific about what progress was observed in the actual notes
3. Keep it encouraging and positive for parents
4. No personal details (address, phone, etc.) - only therapy insights
5. Use simple, clear language that parents can understand

**Format the response as a simple progress summary:**

🌟 **${childFullName}'s Progress Summary** 🌟

📊 **Therapeutic Progress Observed:**
[List specific improvements and progress observed in the therapy notes]

🎯 **Key Achievements:**
[Highlight the main achievements and milestones from the notes]

📈 **Areas of Growth:**
[Mention specific areas where growth was noted]

💡 **Recommendations:**
[Simple suggestions based on the observed progress]

**Analysis Period:** ${childNotes.length} therapy sessions reviewed

*With gratitude for your trust in your child's development journey.*

**Aaryavart Centre for Autism and Special Needs**
`;

              const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'deepseek-chat',
                  messages: [
                    {
                      role: 'user',
                      content: prompt
                    }
                  ],
                  max_tokens: 1000,
                  temperature: 0.7
                })
              });

              const aiData = await aiResponse.json();
              aiInsights = aiData.choices?.[0]?.message?.content || '';
            } catch (aiError) {
              console.error('AI API Error:', aiError);
            }
          }

          // Fallback insights if AI fails
          if (!aiInsights) {
            aiInsights = `🌟 **${childFullName}'s Progress Summary** 🌟

📊 **Therapeutic Progress Observed:**
Based on ${childNotes.length} therapy sessions, ${childFullName} has shown consistent engagement and positive response to therapeutic interventions.

🎯 **Key Achievements:**
• Regular attendance and participation in therapy sessions
• Positive cooperation with therapeutic activities
• Developing trust and rapport with therapy team

📈 **Areas of Growth:**
• Continued improvement in therapeutic goals
• Building confidence through structured activities
• Strengthening developmental skills

💡 **Recommendations:**
• Continue current therapeutic approach
• Maintain regular session schedule
• Celebrate small victories and progress

**Analysis Period:** ${childNotes.length} therapy sessions reviewed

*With gratitude for your trust in your child's development journey.*

**Aaryavart Centre for Autism and Special Needs**`;
          }

          // Step 4: Generate HTML report
          const htmlData: HTMLReportData = {
            childName: childFullName,
            reportType: 'custom',
            centre: centre === 'gkp' ? 'Gorakhpur' : 'Lucknow',
            dateRange: `Analysis of ${childNotes.length} reports`,
            totalNotes: childNotes.length,
            sharedNotes: childNotes.filter(note => note.isSharedWithParent).length,
            aiInsights,
            notes: childNotes.slice(0, 5).map(note => ({
              title: note.title,
              text: note.text,
              date: new Date(note.createdAt).toLocaleDateString(),
              author: `${note.createdBy.user.firstName} ${note.createdBy.user.lastName}`,
              tags: note.tags
            }))
          };

          const htmlContent = generateHTMLReport(htmlData);
          const fileName = `${childFullName.replace(/[^a-zA-Z0-9]/g, '_')}_progress_report_${new Date().toISOString().split('T')[0]}.html`;

          newReports[invoice.id] = {
            htmlContent,
            aiInsights,
            childNotes,
            fileName
          };

          toast({
            title: "Report Generated",
            description: `Generated report for ${childFullName}`,
          });

        } catch (error) {
          console.error(`Error generating report for ${invoice.child?.fullNameWithCaseId}:`, error);
          toast({
            title: "Error",
            description: `Failed to generate report for ${invoice.child?.fullNameWithCaseId}`,
            variant: "destructive",
          });
        }
      }

      setGeneratedReports(newReports);
      onReportsGenerated(newReports);
      
      toast({
        title: "Bulk Generation Complete",
        description: `Generated ${Object.keys(newReports).length} reports`,
      });

    } catch (error) {
      console.error('Error in bulk report generation:', error);
      toast({
        title: "Error",
        description: "Failed to generate some reports",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const previewReport = (report: ReportData, invoice: Invoice) => {
    // Create WhatsApp preview dialog
    const childDisplayName = invoice.child?.fullNameWithCaseId || 'Child';
    const parentDisplayName = invoice.child?.fatherName || 'Parent';
    
    // Create short preview from AI insights
    const aiPreview = report.aiInsights
      .split('\n')
      .filter(line => line.trim() && !line.includes('🌟') && !line.includes('**') && !line.includes('Analysis Period'))
      .slice(0, 3)
      .map(line => line.replace(/^[-•]\s*/, '✨ ').replace(/^\d+\.\s*/, '🎯 '))
      .join('\n')
      .substring(0, 200);

         // Extract best highlights for WhatsApp
     const bestHighlights = report.aiInsights
       .split('\n')
       .filter(line => {
         const lower = line.toLowerCase();
         return line.trim() && 
                (lower.includes('improvement') || lower.includes('progress') || 
                 lower.includes('achievement') || lower.includes('better') ||
                 lower.includes('good') || lower.includes('excellent') ||
                 lower.includes('wonderful') || lower.includes('mastered') ||
                 lower.includes('developed') || lower.includes('successful')) &&
                !line.includes('🌟') && !line.includes('**') && !line.includes('Analysis Period');
       })
       .slice(0, 2)
       .map(line => line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim())
       .join('\n\n');

     const whatsappMessage = `🌟 *Namaste ${parentDisplayName}!*

💝 We are delighted to share *${childDisplayName}'s* one-month progress report based on his therapy session feedback.

🎉 *Great News - Here's what makes us proud:*

${bestHighlights || `✨ ${childDisplayName} has shown remarkable cooperation and engagement during therapy sessions\n\n🎯 We've observed positive improvements in his developmental milestones`}

📊 *Report Details:*
• Based on ${report.childNotes.length} therapy sessions
• Comprehensive progress analysis
• Interactive charts and insights included

📱 *Please open the attached HTML file in your browser to see:*
🔍 How ${childDisplayName} is progressing
📈 Visual progress charts and achievements
💡 Personalized recommendations for continued growth

👨‍👩‍👧‍👦 *Perfect to share with family and celebrate together!*

With gratitude & pride,
🏥 *Aaryavart Centre for Autism and Special Needs Foundation*
${invoice.centre === 'gkp' ? 'Gorakhpur' : 'Lucknow'} Centre`;

    // Create modal to show preview
    const modalHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 20px; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80%; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #16a34a; font-weight: 600;">📱 WhatsApp Ready Message</h3>
            <button onclick="this.closest('div').parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <pre style="white-space: pre-wrap; font-family: monospace; font-size: 13px; margin: 0;">${whatsappMessage}</pre>
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="navigator.clipboard.writeText(\`${whatsappMessage.replace(/`/g, '\\`')}\`).then(() => alert('📱 Copied! Paste in WhatsApp'))" style="background: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">📋 Copy Message</button>
            <button onclick="window.open('${URL.createObjectURL(new Blob([report.htmlContent], { type: 'text/html' }))}', '_blank')" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">👁️ View HTML</button>
          </div>
        </div>
      </div>
    `;

    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement);
  };

  const downloadReport = (report: ReportData) => {
    const blob = new Blob([report.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sendWhatsApp = (invoice: Invoice, report: ReportData) => {
    const phone = invoice.child?.phone;
    if (!phone) {
      toast({
        title: "No Phone Number",
        description: "Parent phone number not available",
        variant: "destructive",
      });
      return;
    }

    let cleanPhone = phone;
    if (cleanPhone.startsWith('+91')) {
      cleanPhone = cleanPhone.substring(3);
    }
    if (!cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    }

    const childDisplayName = invoice.child?.fullNameWithCaseId || 'Child';
    const parentDisplayName = invoice.child?.fatherName || 'Parent';
    
    // Download the HTML file first
    downloadReport(report);

    // Create short preview for WhatsApp
    const aiPreview = report.aiInsights
      .split('\n')
      .filter(line => line.trim() && !line.includes('🌟') && !line.includes('**'))
      .slice(0, 2)
      .join(' ')
      .substring(0, 120) + '...';

    const message = `🌟 *Namaste ${parentDisplayName}!*

🎉 Great news! ${childDisplayName} is making wonderful progress at Aaryavart!

✨ *Quick Progress Highlights:*
${aiPreview}

📊 *${report.childNotes.length} therapy sessions analyzed*

🎨 *Beautiful HTML Report Downloaded!*
📱 Check your Downloads folder & open the HTML file to see:
• Interactive progress charts 📈
• Achievement badges 🏆  
• Detailed insights & recommendations 💡

👨‍👩‍👧‍👦 Perfect to share with family!

With gratitude & pride,
🏥 Aaryavart Centre • ${invoice.centre === 'gkp' ? 'Gorakhpur' : 'Lucknow'}`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp Opened + HTML Downloaded",
      description: `Report for ${childDisplayName} downloaded & WhatsApp message prepared`,
    });
  };

  const formatAmount = (amount: number) => `₹${amount.toLocaleString()}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700"
          disabled={selectedInvoices.length === 0}
        >
          <FileText className="h-4 w-4" />
          Bulk Reports ({selectedInvoices.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Progress Report Generation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          {generating && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
              <div className="text-center text-sm text-gray-600 mt-2">
                Generating reports... {progress}%
              </div>
            </div>
          )}

          {/* Selected Invoices */}
          <div>
            <h3 className="font-semibold mb-3">Selected Children ({selectedInvoices.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{invoice.child?.fullNameWithCaseId || 'Unknown Child'}</div>
                    <div className="text-sm text-gray-600">
                      Parent: {invoice.child?.fatherName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.child?.phone ? 
                        (invoice.child.phone.startsWith('91') ? invoice.child.phone.substring(2) : invoice.child.phone) 
                        : 'No phone'} • {invoice.centre || 'GKP'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {generatedReports[invoice.id] ? (
                      <>
                        <Badge className="bg-green-100 text-green-800">Generated</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => previewReport(generatedReports[invoice.id], invoice)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReport(generatedReports[invoice.id])}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        {invoice.child?.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendWhatsApp(invoice, generatedReports[invoice.id])}
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={generateBulkReports} 
              disabled={generating || selectedInvoices.length === 0}
              className="flex-1"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Reports...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate All Reports
                </>
              )}
            </Button>

            {Object.keys(generatedReports).length > 0 && (
              <Button 
                variant="outline"
                onClick={() => {
                  Object.values(generatedReports).forEach(report => {
                    downloadReport(report);
                  });
                  toast({
                    title: "All Reports Downloaded",
                    description: `Downloaded ${Object.keys(generatedReports).length} reports`,
                  });
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkReportDialog; 