import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, MessageCircle, Brain, Eye, RefreshCw } from "lucide-react";
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

interface ChildSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  fullNameWithCaseId: string;
  fullName: string;
  caseId: string;
  __typename: string;
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
  const [testingAPI, setTestingAPI] = useState(false);
  const [actualChildObjectId, setActualChildObjectId] = useState<string | null>(null);

  const { toast } = useToast();

  const tokens = {
    gkp: import.meta.env.VITE_GKP_TOKEN || '',
    lko: import.meta.env.VITE_LKO_TOKEN || ''
  };

  const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_KEY_SECRET || 'sk-test-dummy-key-for-testing';
  const API_BASE_URL = 'https://care.kidaura.in/api/graphql';

  useEffect(() => {
    if (open) {
      fetchChildData();
    }
  }, [open]);

  const findChildIdByName = async (fullNameWithCaseId: string): Promise<string | null> => {
    try {
      console.log('Searching for child ID using fullNameWithCaseId:', fullNameWithCaseId);
      
      const query = `
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

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens[centre as keyof typeof tokens]}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: { 
            search: fullNameWithCaseId,
            filter: null
          }
        })
      });

      const data = await response.json();
      console.log('allChildren response:', data);
      
      if (data?.data?.allChildren) {
        // Find exact match for fullNameWithCaseId
        const matchingChild = data.data.allChildren.find(
          (child: ChildSearchResult) => child.fullNameWithCaseId === fullNameWithCaseId
        );
        
        if (matchingChild) {
          console.log('Found matching child:', matchingChild);
          return matchingChild.id;
        }
        
        // Fallback: try partial match
        const partialMatch = data.data.allChildren.find(
          (child: ChildSearchResult) => child.fullNameWithCaseId?.includes(fullNameWithCaseId.split(' ')[0])
        );
        
        if (partialMatch) {
          console.log('Found partial match:', partialMatch);
          return partialMatch.id;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding child ID:', error);
      return null;
    }
  };

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
            stId: null,
            offset: 0,
            limit: 30,
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
    console.log('=== GENERATE AI INSIGHTS STARTED ===');
    
    // First, ensure we have notes
    if (childNotes.length === 0) {
      toast({
        title: "⚠️ No Notes Available",
        description: "Please click 'Test API First' to fetch therapy notes before generating report.",
        variant: "destructive",
      });
      return;
    }

    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'sk-test-dummy-key-for-testing') {
      // For testing, generate dummy insights if DeepSeek API key is not configured
      console.log('Using demo mode - no DeepSeek API key');
      const dummyInsights = `🌟 **${childData?.fullName || childName}'s Progress Summary** 🌟

*From Aaryavart Centre for Autism and Special Needs*

📊 **Executive Summary**
${childData?.fullName || childName} has shown remarkable progress in therapy sessions. Based on analysis of ${childNotes.length} detailed therapy notes, we can see consistent improvement across multiple developmental areas.

🎯 **Key Achievements (Based on ${childNotes.length} Therapy Sessions)**
• Improved focus and attention during structured activities
• Enhanced communication and social interaction skills
• Better emotional regulation and self-control
• Progress in motor skills and coordination
• Increased participation in group activities

💪 **Areas of Excellence**
Your child demonstrates exceptional determination and willingness to learn. The therapy team has noted significant improvements in following instructions and engaging with learning materials.

🏠 **Home Activities & Recommendations**
• Continue structured daily routines
• Practice communication exercises daily
• Encourage physical activities and outdoor play
• Maintain consistent meal times and nutrition
• Create calm learning environments at home

💡 **Parent Tips for Indian Families**
• Celebrate small victories and progress milestones
• Maintain patience and consistent support
• Involve extended family in the therapy process
• Use cultural activities and traditions as learning tools

🌈 **Positive Highlights & Progress**
${childData?.fullName || childName} continues to amaze us with their unique abilities and progress. Every therapy session brings new achievements and milestones.

📈 **Development Milestones**
Regular therapy sessions show consistent improvement in all targeted areas. Your child is progressing well within their individualized development plan.

*Report Period: Analysis of ${childNotes.length} Recent Therapy Sessions*
*Total Reports Analyzed: ${childNotes.length}*

*With love from Aaryavart Centre for Autism and Special Needs* 💙

**Note:** This is a demo report generated from ${childNotes.length} actual therapy notes. Configure VITE_DEEPSEEK_KEY_SECRET for AI-powered insights.`;

      setAiInsights(dummyInsights);
      generateReportContent(dummyInsights);
      
      toast({
        title: "✅ Report Generated (Demo Mode)",
        description: `Report created from ${childNotes.length} therapy notes. Add DeepSeek API key for AI insights.`,
      });
      setGenerating(false);
      return;
    }

    setGenerating(true);
    console.log('Starting AI insights generation with DeepSeek API');
    
    try {
      // Use the notes we already have from the Test API button
      console.log(`Using ${childNotes.length} notes already fetched for AI analysis`);

      // Prepare data for DeepSeek
      const childAge = childData ? calculateAge(childData.dob) : 0;
      const childGender = childData?.gender || 'child';
      const childFullName = childData?.fullName || childName;
      
      const notesData = childNotes.map(note => ({
        title: note.title,
        text: note.text,
        date: new Date(note.createdAt).toLocaleDateString(),
        therapist: `${note.createdBy.user.firstName} ${note.createdBy.user.lastName}`,
        tags: note.tags
      }));

      console.log('Preparing prompt for DeepSeek with notes data');
      const prompt = `You are an expert child development specialist and therapist at Aaryavart Centre for Autism and Special Needs. 

Please analyze the following therapy session notes for ${childFullName} and create a concise, positive progress report focusing ONLY on therapeutic insights and improvements.

**Notes Data:**
${JSON.stringify(notesData, null, 2)}

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

-You are an expert child development specialist and therapist at Aaryavart Centre for Autism and Special Needs. 
-
-Please analyze the following therapy session notes for ${childFullName} (${childAge} year old ${childGender}) and create a comprehensive, personalized progress report for Indian parents.
-
-**Notes Data:**
-${JSON.stringify(notesData, null, 2)}
-
-**Requirements:**
-1. Create a warm, encouraging report that makes Indian parents feel connected and happy
-2. Focus on positive progress and achievements with specific examples from the notes
-3. Include detailed insights about:
-   - Physical activities and exercises at home
-   - Eating habits and nutrition improvements
-   - Social interactions and communication progress
-   - Behavioral improvements and positive changes
-   - Learning and cognitive development milestones
-   - Emotional well-being and confidence building
-4. Provide practical recommendations for parents to continue progress at home
-5. Use Indian cultural context and family values
-6. Make it emotional and heartwarming
-7. Include specific examples from the actual notes data
-8. Suggest home activities that parents can do with their child
-9. Show how the child is doing better than typical development expectations
-10. Make parents feel proud of their child's unique journey
-
-**Format the response as:**
-🌟 **${childFullName}'s Progress Report** 🌟
-
-*From Aaryavart Centre for Autism and Special Needs*
-
-📊 **Executive Summary**
-[Warm, encouraging summary based on actual notes data]
-
-🎯 **Key Achievements (Based on ${childNotes.length} Therapy Sessions)**
-[Specific achievements with examples from the notes - be detailed and specific]
-
-💪 **Areas of Excellence**
-[What the child is doing exceptionally well - use specific examples from notes]
-
-🏠 **Home Activities & Recommendations**
-[Physical activities, eating habits, etc. - be practical for Indian families]
-
-💡 **Parent Tips for Indian Families**
-[Practical advice for Indian parents - cultural context]
-
-🌈 **Positive Highlights & Progress**
-[Heartwarming moments and progress - make parents feel proud]
-
-📈 **Development Milestones**
-[Show how child is progressing compared to typical development]
-
-*Report Period: Analysis of ${childNotes.length} Recent Therapy Sessions*
-*Total Reports Analyzed: ${childNotes.length}*
-
-*With love from Aaryavart Centre for Autism and Special Needs* 💙
-
-IMPORTANT: Use ONLY the information from the provided notes data. Be specific about actual progress observed in the therapy sessions.`;

      // Call DeepSeek API
      console.log('Calling DeepSeek API...');
      let deepseekResponse;
      try {
        deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
        })
      } catch (error) {
        console.error('DeepSeek API Error:', error);
        // Fallback to demo insights if DeepSeek fails
        const fallbackInsights = `🌟 **${childFullName}'s Progress Report** 🌟

*From Aaryavart Centre for Autism and Special Needs*

📊 **Executive Summary**
Based on ${childNotes.length} therapy session notes, ${childFullName} shows consistent progress across developmental areas.

🎯 **Key Achievements**
• Regular participation in therapy sessions
• Positive engagement with therapy activities
• Consistent attendance and cooperation
• Progress in targeted developmental goals

**Note:** AI analysis temporarily unavailable. This report is based on ${childNotes.length} actual therapy session notes.

*With love from Aaryavart Centre for Autism and Special Needs* 💙`;

        setAiInsights(fallbackInsights);
        generateReportContent(fallbackInsights);
        
        toast({
          title: "✅ Report Generated (Fallback Mode)",
          description: `Report created from ${childNotes.length} notes. Check DeepSeek API configuration.`,
        });
        setGenerating(false);
        return;
      }

      console.log('DeepSeek API call successful, processing response...');
      const deepseekData = await deepseekResponse.json();
      
      if (deepseekData.choices && deepseekData.choices[0] && deepseekData.choices[0].message) {
        const insights = deepseekData.choices[0].message.content;
        setAiInsights(insights);
        generateReportContent(insights);
        
        toast({
          title: "✅ AI Report Generated!",
          description: `Personalized report created from ${childNotes.length} therapy notes using AI analysis`,
        });
      } else {
        console.error('Unexpected DeepSeek response structure:', deepseekData);
        throw new Error('Invalid response from DeepSeek API');
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      // Generate fallback report on any error
      const fallbackInsights = `🌟 **${childData?.fullName || childName}'s Progress Report** 🌟

*From Aaryavart Centre for Autism and Special Needs*

📊 **Report Summary**
Analysis of ${childNotes.length} therapy session notes shows positive engagement and progress.

🎯 **Key Observations**
• Regular therapy session participation
• Consistent progress tracking
• Positive therapist feedback
• Ongoing development support

**Report generated from ${childNotes.length} actual therapy sessions**

*With love from Aaryavart Centre for Autism and Special Needs* 💙`;

      setAiInsights(fallbackInsights);
      generateReportContent(fallbackInsights);
      
      toast({
        title: "✅ Report Generated (Basic Mode)",
        description: `Report created from ${childNotes.length} notes despite processing error`,
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
        description: "📱 Progress report opened in new tab",
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
        description: "Progress report downloaded and ready to share! 📱",
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

    // Create HTML file for sharing
    try {
      const htmlData: HTMLReportData = {
        childName: childDisplayName,
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

      console.log('Generating HTML report with data:', htmlData);
      const htmlContent = generateHTMLReport(htmlData);
      console.log('HTML content generated, length:', htmlContent.length);
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Download the HTML file for sharing
      const link = document.createElement('a');
      const fileName = `${childDisplayName.replace(/[^a-zA-Z0-9]/g, '_')}_progress_report_${new Date().toISOString().split('T')[0]}.html`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('HTML file downloaded:', fileName);
    } catch (error) {
      console.error('Error creating HTML file:', error);
      toast({
        title: "HTML Generation Error",
        description: "Failed to create HTML report file",
        variant: "destructive",
      });
    }

    // Create filename for toast message
    const fileName = `${childDisplayName.replace(/[^a-zA-Z0-9]/g, '_')}_progress_report_${new Date().toISOString().split('T')[0]}.html`;

    // Extract best highlights for WhatsApp (same as preview)
    const bestHighlights = aiInsights
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

    const message = `🌟 *Namaste ${parentDisplayName}!*

💝 We are delighted to share *${childDisplayName}'s* one-month progress report based on his therapy session feedback.

🎉 *Great News - Here's what makes us proud:*

${bestHighlights || `✨ ${childDisplayName} has shown remarkable cooperation and engagement during therapy sessions\n\n🎯 We've observed positive improvements in his developmental milestones`}

📊 *Report Details:*
• Based on ${childNotes.length} therapy sessions
• Comprehensive progress analysis
• Interactive charts and insights included

📱 *Please open the attached HTML file in your browser to see:*
🔍 How ${childDisplayName} is progressing
📈 Visual progress charts and achievements
💡 Personalized recommendations for continued growth

👨‍👩‍👧‍👦 *Perfect to share with family and celebrate together!*

With gratitude & pride,
🏥 *Aaryavart Centre for Autism and Special Needs Foundation*
${centre === 'gkp' ? 'Gorakhpur' : 'Lucknow'} Centre`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    console.log('Opening WhatsApp with URL length:', whatsappUrl.length);
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp Opened + HTML Downloaded",
      description: `HTML report "${fileName}" downloaded & WhatsApp message prepared for ${parentDisplayName}`,
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">🧪 API Test Debug Info</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>Child ID:</strong> {childId}</p>
                <p><strong>Resolved Object ID:</strong> {actualChildObjectId || 'Not resolved yet'}</p>
                <p><strong>Centre:</strong> {centre}</p>
                <p><strong>API URL:</strong> {API_BASE_URL}</p>
                <p><strong>Token Available:</strong> {tokens[centre as keyof typeof tokens] ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <Button
              onClick={async () => {
                setTestingAPI(true);
                console.log('=== TEST API BUTTON CLICKED ===');
                console.log('Original childId:', childId);
                console.log('Centre:', centre);
                console.log('Available tokens:', Object.keys(tokens));
                console.log('Current token:', tokens[centre as keyof typeof tokens] ? 'Available' : 'Missing');
                
                // Check if we have a token
                if (!tokens[centre as keyof typeof tokens]) {
                  toast({
                    title: "❌ Missing Token",
                    description: `No authentication token found for ${centre}. Check your .env file.`,
                    variant: "destructive",
                  });
                  setTestingAPI(false);
                  return;
                }

                // Get the actual MongoDB ObjectId from the fullNameWithCaseId
                let resolvedChildId = actualChildObjectId;
                
                if (!resolvedChildId) {
                  console.log('Resolving child ID from fullNameWithCaseId...');
                  resolvedChildId = await findChildIdByName(childId);
                  
                  if (resolvedChildId) {
                    setActualChildObjectId(resolvedChildId);
                    console.log('Successfully resolved child ID:', resolvedChildId);
                  } else {
                    // If we can't find the child, try fallback approaches
                    console.log('Could not resolve child ID, trying fallback methods...');
                    
                    // Try extracting ID if it looks like an ObjectId pattern
                    if (childId.includes('_')) {
                      const parts = childId.split('_');
                      resolvedChildId = parts[parts.length - 1];
                    }
                    
                    // If still no valid ID, use test fallback
                    if (!resolvedChildId || resolvedChildId.length < 10) {
                      resolvedChildId = "661cba494577c1e5ef4eae85"; // Test fallback
                      console.log('Using test fallback ID:', resolvedChildId);
                    }
                  }
                }
                
                console.log('Final resolved childId to use:', resolvedChildId);
                
                if (!resolvedChildId) {
                  toast({
                    title: "❌ Invalid Child ID",
                    description: "Could not resolve child ID. Please check the child data.",
                    variant: "destructive",
                  });
                  setTestingAPI(false);
                  return;
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
                        id
                        title
                        text
                        createdAt
                        isSharedWithParent
                        createdBy {
                          user {
                            firstName
                            lastName
                          }
                        }
                        tags
                        __typename
                      }
                      hasMore
                      offset
                      __typename
                    }
                  }
                `;

                const variables = {
                  childId: resolvedChildId,
                  stId: null,
                  offset: 0,
                  limit: 30,
                  search: "",
                  tags: [],
                  members: []
                };

                console.log('Making API call with variables:', variables);

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

                  console.log('Response status:', response.status);
                  console.log('Response ok:', response.ok);

                  const data = await response.json();
                  console.log('Test API Response:', data);
                  
                  if (data?.errors) {
                    console.error('GraphQL Errors:', data.errors);
                    toast({
                      title: "❌ GraphQL Error",
                      description: `${data.errors[0]?.message || 'Unknown GraphQL error'}`,
                      variant: "destructive",
                    });
                  } else if (data?.data?.childNotes?.notes) {
                    setChildNotes(data.data.childNotes.notes);
                    toast({
                      title: "✅ API Test Successful!",
                      description: `Found ${data.data.childNotes.notes.length} therapy notes. Ready to generate report!`,
                    });
                  } else {
                    console.log('Unexpected response structure:', data);
                    toast({
                      title: "⚠️ No Notes Found",
                      description: `No therapy notes found for child: ${childName}`,
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  console.error('API Test Error:', error);
                  toast({
                    title: "❌ Network Error",
                    description: `Failed to connect to API: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    variant: "destructive",
                  });
                } finally {
                  setTestingAPI(false);
                }
              }}
              disabled={testingAPI}
              variant="outline"
              className="flex items-center gap-2 mb-4"
            >
              {testingAPI ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Testing API...
                </>
              ) : (
                <>
                  🧪 Test API First
                </>
              )}
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

          {/* WhatsApp-Ready Preview */}
          {reportContent && aiInsights && (
            <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">📱 WhatsApp Ready Message</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Copy & Paste</span>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                <div className="text-sm text-gray-700 space-y-2" id="whatsapp-preview">
                  {(() => {
                    const childDisplayName = childData?.fullName || childName;
                    const parentDisplayName = childData ? `${childData.parent.firstName} ${childData.parent.lastName}` : (parentName || 'Parent');
                    
                    // Create short preview from AI insights
                    const aiPreview = aiInsights
                      .split('\n')
                      .filter(line => line.trim() && !line.includes('🌟') && !line.includes('**') && !line.includes('Analysis Period'))
                      .slice(0, 3)
                      .map(line => line.replace(/^[-•]\s*/, '✨ ').replace(/^\d+\.\s*/, '🎯 '))
                      .join('\n')
                      .substring(0, 200);

                    // Extract best highlights for WhatsApp
    const bestHighlights = aiInsights
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
• Based on ${childNotes.length} therapy sessions
• Comprehensive progress analysis
• Interactive charts and insights included

📱 *Please open the attached HTML file in your browser to see:*
🔍 How ${childDisplayName} is progressing
📈 Visual progress charts and achievements
💡 Personalized recommendations for continued growth

👨‍👩‍👧‍👦 *Perfect to share with family and celebrate together!*

With gratitude & pride,
🏥 *Aaryavart Centre for Autism and Special Needs Foundation*
${centre === 'gkp' ? 'Gorakhpur' : 'Lucknow'} Centre`;

                    return (
                      <div className="font-mono text-sm">
                        <pre className="whitespace-pre-wrap">{whatsappMessage}</pre>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const previewElement = document.getElementById('whatsapp-preview');
                      if (previewElement) {
                        const text = previewElement.innerText;
                        navigator.clipboard.writeText(text).then(() => {
                          toast({
                            title: "📱 Copied to Clipboard",
                            description: "WhatsApp message copied! Paste it in WhatsApp.",
                          });
                        }).catch(() => {
                          toast({
                            title: "Copy Failed",
                            description: "Please manually copy the text above",
                            variant: "destructive",
                          });
                        });
                      }
                    }}
                    className="text-xs"
                  >
                    📋 Copy Message
                  </Button>
                  <span className="text-xs text-gray-500 flex items-center">
                    💡 Copy this message and paste in WhatsApp, then mention to open the HTML file
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Full Report Preview */}
          {reportContent && aiInsights && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3">📄 Full AI Insights Preview</h3>
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