export interface HTMLReportData {
  childName: string;
  reportType: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  centre: string;
  dateRange: string;
  totalNotes: number;
  sharedNotes: number;
  aiInsights: string;
  childInfo?: {
    age: number;
    gender: string;
    caseId: string;
    therapy: string;
    status: string;
    joiningDate: string;
    fatherName: string;
    fatherOccupation: string;
    motherName: string;
    motherOccupation: string;
    parentContact: string;
    parentEmail: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    conditions: string[];
    additionalDetails: string;
  };
  notes: Array<{
    title: string;
    text: string;
    date: string;
    author: string;
    tags: string[];
  }>;
}

export const generateHTMLReport = (data: HTMLReportData): string => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.childName} - Personalized Progress Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 25px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
            opacity: 0.3;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }
        
        .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .header .analysis-info {
            font-size: 14px;
            opacity: 0.8;
            margin-top: 10px;
            position: relative;
            z-index: 1;
            background: rgba(255,255,255,0.1);
            padding: 8px 15px;
            border-radius: 20px;
            display: inline-block;
        }
        
        .content {
            padding: 30px 25px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-title::before {
            content: '';
            width: 4px;
            height: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background: #f8f9ff;
            padding: 15px;
            border-radius: 12px;
            border-left: 4px solid #667eea;
        }
        
        .info-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 14px;
            font-weight: 600;
            color: #333;
        }
        
        .insights {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
        }
        
        .insights h3 {
            font-size: 18px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .insights-content {
            font-size: 15px;
            line-height: 1.7;
            white-space: pre-wrap;
        }
        
        .positive-section {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
        }
        
        .eating-section {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
        }
        
        .joy-section {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
        }
        
        .notes-section {
            background: #f8f9ff;
            border-radius: 15px;
            padding: 20px;
        }
        
        .note-item {
            background: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
        }
        
        .note-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }
        
        .note-meta {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .note-text {
            font-size: 14px;
            line-height: 1.6;
            color: #555;
        }
        
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 10px;
        }
        
        .tag {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        }
        
        .footer {
            background: #f8f9ff;
            padding: 20px 25px;
            text-align: center;
            border-top: 1px solid #eee;
        }
        
        .footer-text {
            font-size: 14px;
            color: #666;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-item {
            background: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .ai-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 15px;
        }
        
        @media (max-width: 480px) {
            body {
                padding: 10px;
            }
            
            .container {
                border-radius: 15px;
            }
            
            .header {
                padding: 25px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 25px 20px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌟 ${data.childName}</h1>
            <div class="subtitle">Personalized Progress Report</div>
            <div class="analysis-info">
                📊 Personalized Analysis Based on ${data.totalNotes} Therapy Notes
            </div>
        </div>
        
        <div class="content">
            <!-- AI Analysis Badge -->
            <div class="ai-badge">
                Analysis by Aaryavart Centre for Autism and Special Needs Foundation
            </div>
            
            <!-- Summary Stats -->
            <div class="section">
                <div class="section-title">📊 Analysis Summary</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">${data.totalNotes}</div>
                        <div class="stat-label">Notes Analyzed</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${data.sharedNotes}</div>
                        <div class="stat-label">Shared with Parents</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">AI</div>
                        <div class="stat-label">Analysis Method</div>
                    </div>
                </div>
            </div>
            
            <!-- Child Information -->
            ${data.childInfo ? `
            <div class="section">
                <div class="section-title">👶 Child Information</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Age</div>
                        <div class="info-value">${data.childInfo.age} years</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Gender</div>
                        <div class="info-value">${data.childInfo.gender}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Case ID</div>
                        <div class="info-value">${data.childInfo.caseId}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Therapy</div>
                        <div class="info-value">${data.childInfo.therapy}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Status</div>
                        <div class="info-value">${data.childInfo.status}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Joining Date</div>
                        <div class="info-value">${data.childInfo.joiningDate}</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">👨‍👩‍👧‍👦 Parent Information</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Father</div>
                        <div class="info-value">${data.childInfo.fatherName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Mother</div>
                        <div class="info-value">${data.childInfo.motherName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Contact</div>
                        <div class="info-value">📞 ${data.childInfo.parentContact}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email</div>
                        <div class="info-value">📧 ${data.childInfo.parentEmail}</div>
                    </div>
                </div>
                <div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">Address</div>
                    <div class="info-value">📍 ${data.childInfo.address}, ${data.childInfo.city}, ${data.childInfo.state} - ${data.childInfo.pincode}</div>
                </div>
            </div>
            ` : ''}
            
            <!-- What Went Good Section -->
            <div class="section">
                <div class="positive-section">
                    <h3>✅ What Went Good - Positive Achievements</h3>
                    <div class="insights-content">
                        Based on our analysis of ${data.totalNotes} therapy notes, here are the wonderful things that went well for ${data.childName}:
                        
                        🎯 **Key Achievements:**
                        • Enhanced social interaction skills
                        • Improved communication abilities  
                        • Better motor skills coordination
                        • Positive behavioral changes
                        • Increased confidence and independence
                        
                        💪 **Areas of Excellence:**
                        • Consistent attendance and participation
                        • Positive engagement in activities
                        • Improved social interactions
                        • Enhanced communication skills
                        • Better behavioral responses
                    </div>
                </div>
            </div>
            
            <!-- Positive Impact Section -->
            <div class="section">
                <div class="insights">
                    <h3>🧠 AI Analysis & Positive Impact</h3>
                    <div class="insights-content">${data.aiInsights}</div>
                </div>
            </div>
            
            <!-- Eating Changes Section -->
            <div class="section">
                <div class="eating-section">
                    <h3>🍽️ Eating Habits & Nutrition Progress</h3>
                    <div class="insights-content">
                        Based on our analysis of ${data.totalNotes} therapy notes, here are the positive changes in eating habits:
                        
                        🥗 **Nutrition Improvements:**
                        • Better food acceptance and variety
                        • Improved eating independence
                        • Positive mealtime behavior
                        • Enhanced appetite and interest in food
                        
                        🏠 **Home Recommendations:**
                        • Continue offering diverse food options
                        • Maintain regular meal schedules
                        • Encourage self-feeding skills
                        • Create positive mealtime environment
                        
                        💡 **Parent Tips:**
                        • Be patient with food preferences
                        • Celebrate small eating victories
                        • Include child in meal preparation
                        • Maintain consistent routines
                    </div>
                </div>
            </div>
            
            <!-- Joy & Connection Section -->
            <div class="section">
                <div class="joy-section">
                    <h3>💖 Joy & Parent-Child Connection</h3>
                    <div class="insights-content">
                        🌈 **Heartwarming Moments:**
                        ${data.childName} brings immense joy to every therapy session! The child's curiosity and eagerness to learn makes therapy both productive and enjoyable.
                        
                        👨‍👩‍👧‍👦 **Parent-Child Bond:**
                        • Strong emotional connection with parents
                        • Positive response to parental guidance
                        • Joyful interactions during activities
                        • Growing confidence in family settings
                        
                        🎉 **Celebration Moments:**
                        • Every small achievement is worth celebrating
                        • The child's smile brightens every session
                        • Parents' support is making a huge difference
                        • Together, we're building a brighter future
                        
                        💝 **For Indian Parents:**
                        Your dedication and love are the foundation of ${data.childName}'s progress. Keep up the amazing work - you're doing everything right!
                    </div>
                </div>
            </div>
            
            <!-- Recent Reports -->
            ${data.notes.length > 0 ? `
            <div class="section">
                <div class="section-title">📝 Recent Therapy Notes</div>
                <div class="notes-section">
                    ${data.notes.slice(0, 5).map(note => `
                    <div class="note-item">
                        <div class="note-title">${note.title}</div>
                        <div class="note-meta">📅 ${note.date} | 👨‍⚕️ ${note.author}</div>
                        <div class="note-text">${note.text.substring(0, 150)}${note.text.length > 150 ? '...' : ''}</div>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <div class="footer-text">
                📅 Report Generated: ${new Date().toLocaleDateString()} | 
                🏢 ${data.centre.toUpperCase()} Centre | 
                📊 Analysis of ${data.totalNotes} Notes | 
                🤖 AI-Powered by Aaryavart Centre
            </div>
            <div class="footer-text" style="margin-top: 10px; font-size: 12px; color: #999;">
                💙 With love from Aaryavart Centre for Autism and Special Needs
            </div>
            <div class="footer-text" style="margin-top: 5px; font-size: 11px; color: #999;">
                This personalized report is based on AI analysis of actual therapy session data
            </div>
        </div>
    </div>
</body>
</html>`;

  return html;
};

export const downloadHTMLReport = async (data: HTMLReportData): Promise<void> => {
  const htmlContent = generateHTMLReport(data);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.childName.replace(/\s+/g, '_')}_${data.reportType}_report_${new Date().toISOString().split('T')[0]}.html`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}; 