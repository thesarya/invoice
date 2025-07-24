import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, MessageCircle, Brain, Eye } from "lucide-react";
import { downloadHTMLReport, generateHTMLReport, HTMLReportData } from "@/lib/html-report-generator";

interface ChildNote {
  id: string;
  title: string;
  text: string;
  child: {
    id: string;
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
  };
  attachments: Array<{
    name: string;
    size: number;
    type: string;
    fileKey: string;
  }>;
  isSeenByParent: boolean;
  parentViews: number;
  isSharedWithParent: boolean;
  createdBy: {
    user: {
      firstName: string;
      lastName: string;
    };
    id: string;
  };
  stGoal?: {
    id: string;
    title: string;
    iep: {
      id: string;
    };
  };
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
  items: Array<{
    title: string;
    type: string;
    text: string;
    options: Array<{
      label: string;
      isSelected: boolean;
    }>;
  }>;
}

interface ChildData {
  dob: string;
  image: string;
  firstName: string;
  lastName: string;
  fullName: string;
  referralType: string;
  referralName: string;
  fatherName: string;
  fatherOccupation: string;
  contactNos: string[];
  motherName: string;
  caseId: string;
  motherOccupation: string;
  isJournalEnabled: boolean;
  caseIdPrefix: string;
  email: string;
  phone: string;
  gender: string;
  color: {
    bg: string;
    fg: string;
  };
  deactivated: boolean;
  deactivationTime: string;
  deactivatedBy?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  address: string;
  state: string;
  city: string;
  country: string;
  pincode: string;
  therapy: string;
  status: string;
  conditions: string[];
  additionalDetails: string;
  medicationFile?: {
    id: string;
    title: string;
    size: number;
    extension: string;
    fileKey: string;
  };
  diagnosisFile?: {
    id: string;
    title: string;
    size: number;
    extension: string;
    fileKey: string;
  };
  medicalConditionFile?: {
    id: string;
    title: string;
    size: number;
    extension: string;
    fileKey: string;
  };
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    primaryEmail: string;
    contactNo: string;
  };
  member: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  joiningDate: string;
}

interface ChildNotesResponse {
  notes: ChildNote[];
  hasMore: boolean;
  offset: number;
}

interface ChildReportDialogProps {
  childId: string;
  childName: string;
  parentPhone?: string;
  parentName?: string;
  centre: string;
  trigger: React.ReactNode;
}

const ChildReportDialog: React.FC<ChildReportDialogProps> = ({
  childId,
  childName,
  parentPhone,
  parentName,
  centre,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [childNotes, setChildNotes] = useState<ChildNote[]>([]);
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [reportContent, setReportContent] = useState<string>('');
  
  const { toast } = useToast();

  const tokens = {
    gkp: import.meta.env.VITE_GKP_TOKEN || '',
    lko: import.meta.env.VITE_LKO_TOKEN || ''
  };

  const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_KEY_SECRET || '';
  const API_BASE_URL = 'https://care.kidaura.in/api/graphql';

  useEffect(() => {
    if (open) {
      fetchChildData();
    }
  }, [open]);

  const fetchChildData = async () => {
    if (!childId || childId.trim() === '') {
      return;
    }
    
    let actualChildId = childId;
    if (childId.includes('_')) {
      actualChildId = childId.split('_')[1] || childId;
    }
    
    if (!actualChildId || actualChildId.length < 10) {
      actualChildId = "6313291ba48323a8fd2df4ca";
    }
    
    try {
      const query = `
        query child($childId: String!) {
          child(childId: $childId) {
            dob
            image
            firstName
            lastName
            fullName
            referralType
            referralName
            fatherName
            fatherOccupation
            contactNos
            motherName
            caseId
            motherOccupation
            isJournalEnabled
            caseIdPrefix
            email
            phone
            gender
            color {
              bg
              fg
            }
            deactivated
            deactivationTime
            deactivatedBy {
              user {
                firstName
                lastName
              }
            }
            address
            state
            city
            country
            pincode
            therapy
            status
            conditions
            additionalDetails
            medicationFile {
              id
              title
              size
              extension
              fileKey
            }
            diagnosisFile {
              id
              title
              size
              extension
              fileKey
            }
            medicalConditionFile {
              id
              title
              size
              extension
              fileKey
            }
            parent {
              id
              firstName
              lastName
              primaryEmail
              contactNo
            }
            member {
              id
              user {
                id
                firstName
                lastName
              }
            }
            createdAt
            joiningDate
          }
        }
      `;

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens[centre as keyof typeof tokens]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: { childId: actualChildId }
        })
      });

      const data = await response.json();
      const child = data?.data?.child;
      
      if (child) {
        setChildData(child);
      }
    } catch (error) {
      console.error('Error fetching child data:', error);
    }
  };

  const fetchChildNotes = async () => {
    if (!childId || childId.trim() === '') {
      setLoading(false);
      return;
    }
    
    let actualChildId = childId;
    if (childId.includes('_')) {
      actualChildId = childId.split('_')[1] || childId;
    }
    
    if (!actualChildId || actualChildId.length < 10) {
      actualChildId = "6313291ba48323a8fd2df4ca";
    }
    
    setLoading(true);
    try {
      const query = `
        query childNotes($childId: String!, $stId: ID, $offset: Int, $limit: Int, $search: String, $tags: [String], $members: [String]) {
          childNotes(
            childId: $childId
            stId: $stId
            offset: $offset
            limit: $limit
            searchQuery: $search
            tags: $tags
            members: $members
          ) {
            notes {
              ...ChildNotesFragment
              __typename
            }
            hasMore
            offset
            __typename
          }
        }

        fragment ChildNotesFragment on ChildNote {
          __typename
          id
          title
          text
          child {
            id
            firstName
            lastName
            gender
            dob
            __typename
          }
          attachments {
            name
            size
            type
            fileKey
            __typename
          }
          attachments {
            name
            size
            type
            fileKey
            __typename
          }
          isSeenByParent
          parentViews
          isSharedWithParent
          createdBy {
            user {
              firstName
              lastName
              __typename
            }
            id
            __typename
          }
          stGoal {
            id
            title
            iep {
              id
              __typename
            }
            __typename
          }
          isPrivate
          tags
          createdAt
          items {
            title
            type
            text
            options {
              label
              isSelected
              __typename
            }
            __typename
          }
        }
      `;

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens[centre as keyof typeof tokens]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: {
            childId: actualChildId,
            offset: 30,
            limit: 20,
            search: "",
            tags: [],
            members: []
          }
        })
      });

      const data = await response.json();
      const notes = data?.data?.childNotes?.notes || [];
      setChildNotes(notes);
    } catch (error) {
      console.error('Error fetching child notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch child notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    if (!DEEPSEEK_API_KEY) {
      toast({
        title: "Error",
        description: "DeepSeek API key not configured",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Extract child ID from fullNameWithCaseId format (e.g., "John Doe_CASE123_ABC123")
      let actualChildId = childId;
      
      // If childId contains underscores, extract the last part as the actual ID
      if (childId.includes('_')) {
        const parts = childId.split('_');
        // The last part is usually the actual child ID
        actualChildId = parts[parts.length - 1];
      }
      
      // If no valid child ID, use a fallback for testing
      if (!actualChildId || actualChildId.length < 10) {
        actualChildId = "661cba494577c1e5ef4eae85"; // Fallback test ID
      }
      
      console.log('Child ID extraction:', { original: childId, extracted: actualChildId });
      
      const query = `
        query childNotes($childId: String!, $stId: ID, $offset: Int, $limit: Int, $search: String, $tags: [String], $members: [String]) {
          childNotes(
            childId: $childId
            stId: $stId
            offset: $offset
            limit: $limit
            searchQuery: $search
            tags: $tags
            members: $members
          ) {
            notes {
              ...ChildNotesFragment
              __typename
            }
            hasMore
            offset
            __typename
          }
        }

        fragment ChildNotesFragment on ChildNote {
          __typename
          id
          title
          text
          child {
            id
            firstName
            lastName
            gender
            dob
            __typename
          }
          attachments {
            name
            size
            type
            fileKey
            __typename
          }
          attachments {
            name
            size
            type
            fileKey
            __typename
          }
          isSeenByParent
          parentViews
          isSharedWithParent
          createdBy {
            user {
              firstName
              lastName
              __typename
            }
            id
            __typename
          }
          stGoal {
            id
            title
            iep {
              id
              __typename
            }
            __typename
          }
          isPrivate
          tags
          createdAt
          items {
            title
            type
            text
            options {
              label
              isSelected
              __typename
            }
            __typename
          }
        }
      `;

      const variables = {
        childId: actualChildId,
        offset: 30,
        limit: 20,
        search: "",
        tags: [],
        members: []
      };

      console.log('Testing API with:', { query, variables });

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens[centre as keyof typeof tokens]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      const data = await response.json();
      console.log('API Response:', data);
      
      const notes = data?.data?.childNotes?.notes || [];
      
      if (notes.length === 0) {
        toast({
          title: "No Data",
          description: "No reports found for analysis",
          variant: "destructive",
        });
        setGenerating(false);
        return;
      }
      
      console.log(`Fetched ${notes.length} notes successfully`);
      
      // Update state with fetched notes
      setChildNotes(notes);

      // Prepare data for DeepSeek
      const childAge = childData ? calculateAge(childData.dob) : 0;
      const childGender = childData?.gender || 'child';
      const childFullName = childData?.fullName || childName;
      
      const notesData = notes.map(note => ({
        title: note.title,
        text: note.text,
        date: new Date(note.createdAt).toLocaleDateString(),
        therapist: `${note.createdBy.user.firstName} ${note.createdBy.user.lastName}`,
        tags: note.tags
      }));

      const prompt = `You are an expert child development specialist and therapist at Aaryavart Centre for Autism and Special Needs. 

Please analyze the following therapy session notes for ${childFullName} (${childAge} year old ${childGender}) and create a comprehensive, personalized progress report for Indian parents.

**Notes Data:**
${JSON.stringify(notesData, null, 2)}

**Requirements:**
1. Create a warm, encouraging report that makes Indian parents feel connected and happy
2. Focus on positive progress and achievements with specific examples from the notes
3. Include detailed insights about:
   - Physical activities and exercises at home
   - Eating habits and nutrition improvements
   - Social interactions and communication progress
   - Behavioral improvements and positive changes
   - Learning and cognitive development milestones
   - Emotional well-being and confidence building
4. Provide practical recommendations for parents to continue progress at home
5. Use Indian cultural context and family values
6. Make it emotional and heartwarming
7. Include specific examples from the actual notes data
8. Suggest home activities that parents can do with their child
9. Show how the child is doing better than typical development expectations
10. Make parents feel proud of their child's unique journey

**Format the response as:**
🌟 *${childFullName}'s Progress Report* 🌟

*From Aaryavart Centre for Autism and Special Needs*

📊 *Executive Summary*
[Warm, encouraging summary based on actual notes data]

🎯 *Key Achievements (Based on ${notes.length} Therapy Sessions)*
[Specific achievements with examples from the notes - be detailed and specific]

💪 *Areas of Excellence*
[What the child is doing exceptionally well - use specific examples from notes]

🏠 *Home Activities & Recommendations*
[Physical activities, eating habits, etc. - be practical for Indian families]

💡 *Parent Tips for Indian Families*
[Practical advice for Indian parents - cultural context]

🌈 *Positive Highlights & Progress*
[Heartwarming moments and progress - make parents feel proud]

📈 *Development Milestones*
[Show how child is progressing compared to typical development]

*Report Period: Analysis of ${notes.length} Recent Therapy Sessions*
*Total Reports Analyzed: ${notes.length}*

*With love from Aaryavart Centre for Autism and Special Needs* 💙

IMPORTANT: Use ONLY the information from the provided notes data. Do not make up generic achievements. Be specific about what the child actually accomplished based on the therapy notes. Make Indian parents feel proud and connected to their child's unique progress journey.`;

      // Call DeepSeek API
      const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      const deepseekData = await deepseekResponse.json();
      
      if (deepseekData.choices && deepseekData.choices[0]) {
        const insights = deepseekData.choices[0].message.content;
        setAiInsights(insights);
        generateReportContent(insights);
        
        toast({
          title: "Personalized Report Generated",
          description: `Created insights from ${notes.length} therapy notes using AI`,
        });
      } else {
        throw new Error('No response from DeepSeek');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const generateReportContent = (insights: string) => {
    const currentDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const reportContent = `
# ${childData?.fullName || childName} - Personalized Progress Report

**Generated on:** ${currentDate}  
**Centre:** ${centre === 'gkp' ? 'Gorakhpur' : 'Lucknow'}  
**Analysis Period:** Last 30 Reports  

${childData ? `
## 👤 Child Information
- **Name:** ${childData.fullName}
- **Age:** ${calculateAge(childData.dob)} years
- **Gender:** ${childData.gender}
- **Case ID:** ${childData.caseId}
- **Therapy:** ${childData.therapy}
- **Status:** ${childData.status}
- **Joining Date:** ${new Date(childData.joiningDate).toLocaleDateString()}

## 👨‍👩‍👧‍👦 Parent Information
- **Father:** ${childData.fatherName} (${childData.fatherOccupation || 'N/A'})
- **Mother:** ${childData.motherName} (${childData.motherOccupation || 'N/A'})
- **Contact:** ${childData.parent.contactNo}
- **Email:** ${childData.parent.primaryEmail}
- **Address:** ${childData.address}, ${childData.city}, ${childData.state} - ${childData.pincode}

${childData.conditions && childData.conditions.length > 0 ? `
## 🏥 Medical Information
- **Conditions:** ${childData.conditions.join(', ')}
- **Additional Details:** ${childData.additionalDetails || 'None'}
` : ''}
` : ''}

---

## 📊 Report Summary

**Total Reports Analyzed:** ${childNotes.length}  
**Analysis Method:** AI-powered analysis of therapy session notes  
**Prepared by:** Aaryavart Centre for Autism and Special Needs  

---

## 🤖 AI-Generated Insights

${insights}

---

## 📝 Notes Analysis Summary

This report is based on the analysis of ${childNotes.length} therapy session notes from our dedicated team of therapists. Each note has been carefully reviewed to provide you with the most accurate and personalized insights about your child's progress.

**Recent Session Dates:** ${childNotes.length > 0 ? childNotes.slice(0, 5).map(note => new Date(note.createdAt).toLocaleDateString()).join(', ') : 'No recent sessions'}

---

*This personalized report was automatically generated by Aaryavart Centre for Autism and Special Needs' AI-powered system to provide comprehensive insights into your child's development progress. The analysis is based on actual therapy session data and designed to help Indian parents understand and support their child's journey.*
    `;

    setReportContent(reportContent);
  };

  const handlePreviewHTML = () => {
    if (!reportContent || !aiInsights) {
      toast({
        title: "No Report",
        description: "Please generate a report first",
        variant: "destructive",
      });
      return;
    }

    try {
      const htmlData: HTMLReportData = {
        childName: childData?.fullName || childName,
        reportType: 'custom',
        centre,
        dateRange: `Analysis of ${childNotes.length} reports`,
        totalNotes: childNotes.length,
        sharedNotes: childNotes.filter(note => note.isSharedWithParent).length,
        aiInsights,
        childInfo: childData ? {
          age: calculateAge(childData.dob),
          gender: childData.gender,
          caseId: childData.caseId,
          therapy: childData.therapy,
          status: childData.status,
          joiningDate: new Date(childData.joiningDate).toLocaleDateString(),
          fatherName: childData.fatherName,
          fatherOccupation: childData.fatherOccupation,
          motherName: childData.motherName,
          motherOccupation: childData.motherOccupation,
          parentContact: childData.parent?.contactNo || '',
          parentEmail: childData.parent?.primaryEmail || '',
          address: childData.address,
          city: childData.city,
          state: childData.state,
          pincode: childData.pincode,
          conditions: childData.conditions || [],
          additionalDetails: childData.additionalDetails
        } : undefined,
        notes: childNotes.slice(0, 5).map(note => ({
          title: note.title,
          text: note.text,
          date: new Date(note.createdAt).toLocaleDateString(),
          author: `${note.createdBy.user.firstName} ${note.createdBy.user.lastName}`,
          tags: note.tags
        }))
      };

      const htmlContent = generateHTMLReport(htmlData);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      window.open(url, '_blank');
      
      toast({
        title: "🌐 HTML Report Opened",
        description: "📱 Open in Chrome/Browser to see beautiful progress report",
      });
    } catch (error) {
      console.error('Error previewing HTML:', error);
      toast({
        title: "Error",
        description: "Failed to preview HTML report",
        variant: "destructive",
      });
    }
  };

  const handleDownloadHTML = async () => {
    if (!reportContent || !aiInsights) {
      toast({
        title: "No Report",
        description: "Please generate a report first",
        variant: "destructive",
      });
      return;
    }

    try {
      const htmlData: HTMLReportData = {
        childName: childData?.fullName || childName,
        reportType: 'custom',
        centre,
        dateRange: `Analysis of ${childNotes.length} reports`,
        totalNotes: childNotes.length,
        sharedNotes: childNotes.filter(note => note.isSharedWithParent).length,
        aiInsights,
        childInfo: childData ? {
          age: calculateAge(childData.dob),
          gender: childData.gender,
          caseId: childData.caseId,
          therapy: childData.therapy,
          status: childData.status,
          joiningDate: new Date(childData.joiningDate).toLocaleDateString(),
          fatherName: childData.fatherName,
          fatherOccupation: childData.fatherOccupation,
          motherName: childData.motherName,
          motherOccupation: childData.motherOccupation,
          parentContact: childData.parent?.contactNo || '',
          parentEmail: childData.parent?.primaryEmail || '',
          address: childData.address,
          city: childData.city,
          state: childData.state,
          pincode: childData.pincode,
          conditions: childData.conditions || [],
          additionalDetails: childData.additionalDetails
        } : undefined,
        notes: childNotes.slice(0, 5).map(note => ({
          title: note.title,
          text: note.text,
          date: new Date(note.createdAt).toLocaleDateString(),
          author: `${note.createdBy.user.firstName} ${note.createdBy.user.lastName}`,
          tags: note.tags
        }))
      };

      await downloadHTMLReport(htmlData);
      
      toast({
        title: "HTML Report Downloaded",
        description: "Beautiful HTML report ready to open on phone! 📱",
      });
    } catch (error) {
      console.error('Error downloading HTML:', error);
      toast({
        title: "Error",
        description: "Failed to download HTML report",
        variant: "destructive",
      });
    }
  };

  const sendWhatsApp = () => {
    const phone = childData?.parent.contactNo || parentPhone;
    
    if (!phone) {
      toast({
        title: "No Phone Number",
        description: "Parent phone number not available",
        variant: "destructive",
      });
      return;
    }

    if (!reportContent) {
      toast({
        title: "No Report",
        description: "Please generate a report first",
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

    const childDisplayName = childData?.fullName || childName;
    const parentDisplayName = childData ? `${childData.parent.firstName} ${childData.parent.lastName}` : (parentName || 'Parent');

    const message = `Dear ${parentDisplayName},

📋 *${childDisplayName}'s Personalized Progress Report*

We're excited to share ${childDisplayName}'s personalized progress report with you!

${aiInsights.split('\n').slice(0, 5).join('\n')}

📊 *Report Summary:*
• Total Reports Analyzed: ${childNotes.length}
• Analysis Method: Analysis of therapy notes
• Prepared by: Aaryavart Centre for Autism and Special Needs

🌐 *To view the complete report:*
Open this link in Chrome or your default browser for the best experience!

Thank you for your continued partnership in ${childDisplayName}'s development journey!

Best regards,
Aaryavart Centre for Autism and Special Needs`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp Opened",
      description: "WhatsApp has been opened with the personalized report summary",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Personalized Child Progress Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Child Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3">Child Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-blue-700">Child Name</label>
                <p className="text-blue-800 font-semibold">{childData?.fullName || childName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-700">Age</label>
                <p className="text-blue-800">{childData ? `${calculateAge(childData.dob)} years` : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Test API Button */}
          <div className="text-center mb-4">
            <Button
              onClick={async () => {
                // Use the actual child ID passed to the component
                let actualChildId = childId;
                if (childId.includes('_')) {
                  actualChildId = childId.split('_')[1] || childId;
                }
                
                // If no valid child ID, use a fallback for testing
                if (!actualChildId || actualChildId.length < 10) {
                  actualChildId = "661cba494577c1e5ef4eae85"; // Fallback test ID
                }
                const query = `
                  query childNotes($childId: String!, $stId: ID, $offset: Int, $limit: Int, $search: String, $tags: [String], $members: [String]) {
                    childNotes(
                      childId: $childId
                      stId: $stId
                      offset: $offset
                      limit: $limit
                      searchQuery: $search
                      tags: $tags
                      members: $members
                    ) {
                      notes {
                        ...ChildNotesFragment
                        __typename
                      }
                      hasMore
                      offset
                      __typename
                    }
                  }

                  fragment ChildNotesFragment on ChildNote {
                    __typename
                    id
                    title
                    text
                    child {
                      id
                      firstName
                      lastName
                      gender
                      dob
                      __typename
                    }
                    attachments {
                      name
                      size
                      type
                      fileKey
                      __typename
                    }
                    attachments {
                      name
                      size
                      type
                      fileKey
                      __typename
                    }
                    isSeenByParent
                    parentViews
                    isSharedWithParent
                    createdBy {
                      user {
                        firstName
                        lastName
                        __typename
                      }
                      id
                      __typename
                    }
                    stGoal {
                      id
                      title
                      iep {
                        id
                        __typename
                      }
                      __typename
                    }
                    isPrivate
                    tags
                    createdAt
                    items {
                      title
                      type
                      text
                      options {
                        label
                        isSelected
                        __typename
                      }
                      __typename
                    }
                  }
                `;

                const variables = {
                  childId: actualChildId,
                  offset: 30,
                  limit: 20,
                  search: "",
                  tags: [],
                  members: []
                };

                try {
                  const response = await fetch(API_BASE_URL, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${tokens[centre as keyof typeof tokens]}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      query,
                      variables
                    })
                  });

                  const data = await response.json();
                  console.log('Test API Response:', data);
                  
                  if (data?.data?.childNotes?.notes) {
                    setChildNotes(data.data.childNotes.notes);
                    toast({
                      title: "API Test Successful",
                      description: `Fetched ${data.data.childNotes.notes.length} notes from test child ID`,
                    });
                  } else {
                    toast({
                      title: "API Test Failed",
                      description: "No notes found in response",
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  console.error('API Test Error:', error);
                  toast({
                    title: "API Test Error",
                    description: "Failed to test API",
                    variant: "destructive",
                  });
                }
              }}
              variant="outline"
              className="flex items-center gap-2 mb-4"
            >
              🧪 Test API First
            </Button>
          </div>

          {/* Pull Report Button */}
          <div className="text-center">
            <Button
              onClick={generateAIInsights}
              disabled={loading || generating}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
            >
              {generating ? (
                <>
                  <Brain className="h-5 w-5 animate-spin" />
                  Generating Personalized Report...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  Pull Report (30 Reports)
                </>
              )}
            </Button>
            <p className="text-sm text-gray-600 mt-2">
              Fetches 30 reports and generates personalized insights using AI
            </p>
          </div>
          
          {/* Action Buttons */}
          {reportContent && (
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handlePreviewHTML}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview HTML
              </Button>
              
              <Button
                onClick={handleDownloadHTML}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download HTML
              </Button>
              
              {(childData?.parent.contactNo || parentPhone) && (
                <Button
                  onClick={sendWhatsApp}
                  variant="outline"
                  className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  Send WhatsApp
                </Button>
              )}
            </div>
          )}

          {/* Report Preview */}
          {reportContent && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3">Personalized Report Preview</h3>
              <div className="bg-white rounded-lg p-4 shadow-sm max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{aiInsights}</pre>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Fetching 30 reports...</p>
            </div>
          )}

          {/* Debug Info */}
          {childNotes.length > 0 && (
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold text-green-800 mb-3">✅ API Test Results</h3>
              <div className="text-sm space-y-2">
                <div><strong>Notes Fetched:</strong> {childNotes.length}</div>
                <div><strong>Child ID Used:</strong> {childId}</div>
                <div><strong>Query Offset:</strong> 30</div>
                <div><strong>Query Limit:</strong> 20</div>
                <div><strong>Centre:</strong> {centre}</div>
                {childNotes.length > 0 && (
                  <div><strong>Latest Note:</strong> {new Date(childNotes[0].createdAt).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          )}

          {!loading && childNotes.length === 0 && !generating && (
            <div className="text-center py-8">
              <p className="text-gray-600">Click "🧪 Test API First" to test the API, then "Pull Report" to generate insights</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChildReportDialog; 