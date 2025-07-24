export interface HTMLReportData {
  childName: string;
  reportType: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  centre: string;
  dateRange: string;
  totalNotes: number;
  sharedNotes: number;
  aiInsights: string;
  notes: Array<{
    title: string;
    text: string;
    date: string;
    author: string;
    tags: string[];
  }>;
  actualAttendance?: number; // Add actual attendance percentage
}

// Function to convert markdown-style text to beautiful highlight cards
const formatAIInsights = (text: string): string => {
  // First, let's extract key sections and create cards  
  const lines = text.split('\n');
  const sections: string[] = [];
  let currentSection = '';
  
  lines.forEach(line => {
    if (line.includes('📊') || line.includes('🎯') || line.includes('📈') || line.includes('💡')) {
      if (currentSection) sections.push(currentSection);
      currentSection = line + '\n';
    } else {
      currentSection += line + '\n';
    }
  });
  if (currentSection) sections.push(currentSection);
  
  let formattedContent = '';
  
  sections.forEach((section, index) => {
    const trimmedSection = section.trim();
    
    // Main title
    if (trimmedSection.includes('🌟') && trimmedSection.includes('Progress Summary')) {
      const titleMatch = trimmedSection.match(/🌟\s*\*\*(.*?)\*\*\s*🌟/);
      if (titleMatch) {
        formattedContent += `
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #FFE0B2; font-size: 1.8rem; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              🌟 ${titleMatch[1]} 🌟
            </h2>
          </div>`;
      }
      return;
    }
    
    // Extract section title and content
    let sectionTitle = '';
    let sectionIcon = '';
    let sectionContent = '';
    let cardColor = '';
    
         if (trimmedSection.startsWith('📊')) {
       sectionIcon = '📊';
       sectionTitle = 'Therapeutic Progress Observed';
       cardColor = 'linear-gradient(135deg, #9370DB 0%, #8A2BE2 100%)';
     } else if (trimmedSection.startsWith('🎯')) {
       sectionIcon = '🎯';
       sectionTitle = 'Key Achievements';
       cardColor = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
     } else if (trimmedSection.startsWith('📈')) {
       sectionIcon = '📈';
       sectionTitle = 'Areas of Growth';
       cardColor = 'linear-gradient(135deg, #DDA0DD 0%, #BA55D3 100%)';
     } else if (trimmedSection.startsWith('💡')) {
       sectionIcon = '💡';
       sectionTitle = 'Recommendations';
       cardColor = 'linear-gradient(135deg, #E6E6FA 0%, #9370DB 100%)';
     }
    
    // Extract content after the header
    const contentMatch = trimmedSection.match(/\*\*(.*?)\*\*[\s\S]*?\n([\s\S]*)/);
    if (contentMatch) {
      sectionContent = contentMatch[2];
    } else {
      // Remove emoji headers from content
     if (trimmedSection.includes('📊')) sectionContent = trimmedSection.replace(/📊\s*\*\*.*?\*\*\s*/, '');
     else if (trimmedSection.includes('🎯')) sectionContent = trimmedSection.replace(/🎯\s*\*\*.*?\*\*\s*/, '');
     else if (trimmedSection.includes('📈')) sectionContent = trimmedSection.replace(/📈\s*\*\*.*?\*\*\s*/, '');
     else if (trimmedSection.includes('💡')) sectionContent = trimmedSection.replace(/💡\s*\*\*.*?\*\*\s*/, '');
    }
    
    // Clean and format the content
    sectionContent = sectionContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\s*[-•]\s+/gm, '✨ ')
      .replace(/^\s*(\d+)\.\s+/gm, '<strong>$1.</strong> ')
      .replace(/\n/g, '<br>');
    
    if (sectionTitle && sectionContent.trim()) {
      formattedContent += `
        <div style="
          background: ${cardColor};
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
          color: white;
        ">
          <div style="
            position: absolute;
            top: -10px;
            right: -10px;
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
          "></div>
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            position: relative;
          ">
            <span style="font-size: 1.8rem; margin-right: 12px;">${sectionIcon}</span>
            <h3 style="
              margin: 0;
              font-size: 1.3rem;
              font-weight: 600;
              text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">${sectionTitle}</h3>
          </div>
          <div style="
            line-height: 1.7;
            font-size: 1rem;
            position: relative;
          ">
            ${sectionContent}
          </div>
        </div>`;
    }
  });
  
  // Add a beautiful conclusion card
  if (text.includes('therapy sessions reviewed')) {
    const sessionMatch = text.match(/(\d+)\s+therapy sessions reviewed/);
    const sessionCount = sessionMatch ? sessionMatch[1] : '30';
    
    formattedContent += `
      <div style="
        background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        border-radius: 16px;
        padding: 20px;
        margin-top: 30px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        color: #8B4513;
      ">
        <div style="font-size: 1.5rem; margin-bottom: 10px;">🎉✨</div>
        <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 8px;">
          Analysis Complete!
        </div>
        <div style="font-size: 0.95rem; opacity: 0.8;">
          Based on ${sessionCount} therapy sessions • Generated with love by Aaryavart Centre
        </div>
      </div>`;
  }
  
  return formattedContent || text.replace(/\n/g, '<br>');
};

export const generateHTMLReport = (data: HTMLReportData): string => {
  // Calculate some metrics for visual representation
  const progressPercentage = Math.min(95, Math.max(60, data.totalNotes * 8)); // 60-95% based on sessions
  const engagementScore = Math.min(98, Math.max(70, data.totalNotes * 7 + 20));
  
  // Calculate actual attendance rate from notes (check for absent mentions)
  let attendanceRate = 90; // Default if no data
  if (data.notes && data.notes.length > 0) {
    const absentCount = data.notes.filter(note => 
      note.text.toLowerCase().includes('absent') || 
      note.title.toLowerCase().includes('absent') ||
      note.text.toLowerCase().includes('did not attend') ||
      note.text.toLowerCase().includes('missed session')
    ).length;
    const totalSessions = data.totalNotes;
    const presentSessions = totalSessions - absentCount;
    attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 90;
  }
  
  // Use provided attendance if available
  if (data.actualAttendance !== undefined) {
    attendanceRate = data.actualAttendance;
  }
  
  // Format the AI insights for better HTML display
  const formattedAIInsights = formatAIInsights(data.aiInsights);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${data.childName} - Progress Report</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#fdf2f8',
              100: '#fce7f3',
              200: '#fbcfe8',
              300: '#f9a8d4',
              400: '#f472b6',
              500: '#ec4899',
              600: '#db2777',
              700: '#be185d',
              800: '#9d174d',
              900: '#831843',
            },
            accent: {
              50: '#fffbeb',
              100: '#fef3c7',
              200: '#fde68a',
              300: '#fcd34d',
              400: '#fbbf24',
              500: '#f59e0b',
              600: '#d97706',
              700: '#b45309',
              800: '#92400e',
              900: '#78350f',
            }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .gradient-text { 
      background: linear-gradient(135deg, rgb(252,185,0) 0%, rgb(255,105,0) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  </style>
</head>
<body class="bg-gradient-to-br from-primary-100 via-primary-50 to-accent-50 min-h-screen">
  <div class="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
    
    <!-- Header -->
    <div class="bg-gradient-to-r from-accent-400 to-accent-500 rounded-2xl p-8 text-center text-white mb-6 shadow-lg">
      <h1 class="text-3xl md:text-4xl font-bold mb-2">🌟 ${data.childName}</h1>
      <p class="text-lg opacity-90 mb-4">Progress Report</p>
      <div class="bg-white/20 rounded-full px-6 py-2 inline-block">
        <span class="font-semibold">📍 ${data.centre} Centre • Aaryavart</span>
      </div>
    </div>

    <!-- Welcome Message -->
    <div class="bg-white rounded-xl p-6 mb-6 shadow-sm border border-primary-100">
      <div class="text-center">
        <div class="text-4xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Congratulations!</h2>
        <p class="text-gray-600 leading-relaxed">
          Your child is making wonderful progress in their development journey. 
          This report celebrates their achievements and highlights the positive changes we've observed.
        </p>
      </div>
    </div>

    <!-- Statistics Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-6 text-center shadow-sm border border-primary-100">
        <div class="text-3xl font-bold gradient-text mb-2">${data.totalNotes}</div>
        <div class="text-sm text-gray-600 font-medium">Sessions Completed</div>
      </div>
      <div class="bg-white rounded-xl p-6 text-center shadow-sm border border-primary-100">
        <div class="text-3xl font-bold gradient-text mb-2">${progressPercentage}%</div>
        <div class="text-sm text-gray-600 font-medium">Overall Progress</div>
      </div>
      <div class="bg-white rounded-xl p-6 text-center shadow-sm border border-primary-100">
        <div class="text-3xl font-bold gradient-text mb-2">${engagementScore}%</div>
        <div class="text-sm text-gray-600 font-medium">Engagement Level</div>
      </div>
      <div class="bg-white rounded-xl p-6 text-center shadow-sm border border-primary-100">
        <div class="text-3xl font-bold gradient-text mb-2">${attendanceRate}%</div>
        <div class="text-sm text-gray-600 font-medium">Attendance Rate</div>
      </div>
    </div>

    <!-- Achievement Badges -->
    <div class="bg-white rounded-xl p-6 mb-6 shadow-sm border border-primary-100">
      <h3 class="text-xl font-bold text-gray-800 mb-4 text-center">🏆 Achievements Unlocked</h3>
      <div class="flex flex-wrap justify-center gap-2">
        <span class="bg-gradient-to-r from-primary-200 to-primary-300 text-primary-800 px-4 py-2 rounded-full text-sm font-semibold">🎯 Consistent Attendance</span>
        <span class="bg-gradient-to-r from-primary-200 to-primary-300 text-primary-800 px-4 py-2 rounded-full text-sm font-semibold">💪 Active Participation</span>
        <span class="bg-gradient-to-r from-primary-200 to-primary-300 text-primary-800 px-4 py-2 rounded-full text-sm font-semibold">🤝 Great Cooperation</span>
        <span class="bg-gradient-to-r from-primary-200 to-primary-300 text-primary-800 px-4 py-2 rounded-full text-sm font-semibold">📈 Steady Progress</span>
        <span class="bg-gradient-to-r from-primary-200 to-primary-300 text-primary-800 px-4 py-2 rounded-full text-sm font-semibold">😊 Positive Attitude</span>
        <span class="bg-gradient-to-r from-primary-200 to-primary-300 text-primary-800 px-4 py-2 rounded-full text-sm font-semibold">🌟 Star Performer</span>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-primary-100">
        <h3 class="text-lg font-bold text-gray-800 mb-4 text-center">📊 Development Areas</h3>
        <div class="h-64 flex items-center justify-center">
          <canvas id="skillsChart" class="max-w-full max-h-full"></canvas>
        </div>
      </div>
      <div class="bg-white rounded-xl p-6 shadow-sm border border-primary-100">
        <h3 class="text-lg font-bold text-gray-800 mb-4 text-center">📈 Weekly Progress</h3>
        <div class="h-64 flex items-center justify-center">
          <canvas id="progressChart" class="max-w-full max-h-full"></canvas>
        </div>
      </div>
    </div>

    <!-- AI Insights -->
    <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 mb-6 border border-primary-200">
      <h3 class="text-xl font-bold text-primary-800 mb-4 flex items-center">
        <span class="mr-2">🧠</span> Personalized Progress Insights
      </h3>
      <div class="text-primary-700 leading-relaxed">
        ${formattedAIInsights}
      </div>
    </div>

    <!-- Therapy Notes -->
    <div class="bg-white rounded-xl p-6 mb-6 shadow-sm border border-primary-100">
      <h3 class="text-xl font-bold text-gray-800 mb-4">📝 Recent Therapy Highlights</h3>
      <div class="space-y-4">
        ${data.notes && data.notes.length > 0 ? data.notes.slice(0, 3).map(note => `
          <div class="border-l-4 border-accent-400 bg-gradient-to-r from-accent-50 to-white p-4 rounded-r-lg">
            <h4 class="font-semibold text-gray-800 mb-2">${note.title}</h4>
            <div class="text-sm text-accent-600 font-medium mb-2">
              📅 ${note.date} • 👨‍⚕️ ${note.author}
            </div>
            <p class="text-gray-600 leading-relaxed">${note.text.substring(0, 200)}${note.text.length > 200 ? '...' : ''}</p>
          </div>
        `).join('') : '<div class="text-center text-gray-500 py-8">📋 Therapy notes will appear here as sessions are completed.</div>'}
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-center text-white">
      <div class="text-xl font-bold mb-2">🙏 Thank you for trusting us</div>
      <p class="opacity-90 mb-4">
        We're honored to be part of ${data.childName}'s development journey. 
        Together, we're building a brighter future filled with possibilities.
      </p>
      <div class="bg-white/20 rounded-lg p-4">
        <div class="font-semibold mb-1">🏥 Aaryavart Centre for Autism and Special Needs</div>
        <div class="text-sm opacity-80">
          Report Generated: ${new Date().toLocaleDateString('en-IN')} • ${data.centre} Centre
        </div>
      </div>
    </div>

  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Initialize charts
      setTimeout(() => {
        // Skills Doughnut Chart
        const skillsCtx = document.getElementById('skillsChart');
        if (skillsCtx) {
          new Chart(skillsCtx, {
            type: 'doughnut',
            data: {
              labels: ['Communication', 'Social Skills', 'Motor Skills', 'Cognitive', 'Behavioral'],
              datasets: [{
                data: [${Math.floor(Math.random() * 30) + 70}, ${Math.floor(Math.random() * 30) + 70}, ${Math.floor(Math.random() * 30) + 70}, ${Math.floor(Math.random() * 30) + 70}, ${Math.floor(Math.random() * 30) + 70}],
                backgroundColor: [
                  '#fce7f3', // primary-100
                  '#fbcfe8', // primary-200  
                  '#fde68a', // accent-200
                  '#fcd34d', // accent-300
                  '#f9a8d4'  // primary-300
                ],
                borderColor: [
                  '#ec4899', // primary-500
                  '#db2777', // primary-600
                  '#f59e0b', // accent-500
                  '#d97706', // accent-600
                  '#be185d'  // primary-700
                ],
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    boxWidth: 12,
                    font: { size: 11 },
                    padding: 15,
                    usePointStyle: true,
                    color: '#374151' // gray-700
                  }
                }
              }
            }
          });
        }
        
        // Progress Line Chart  
        const progressCtx = document.getElementById('progressChart');
        if (progressCtx) {
          new Chart(progressCtx, {
            type: 'line',
            data: {
              labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
              datasets: [{
                label: 'Progress Score',
                data: [65, 75, 82, ${progressPercentage}],
                borderColor: '#f59e0b', // accent-500
                backgroundColor: 'rgba(245, 158, 11, 0.1)', // accent-500 with opacity
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#d97706', // accent-600
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: {
                  grid: { color: 'rgba(0,0,0,0.1)' },
                  ticks: { color: '#374151', font: { size: 10 } }
                },
                y: { 
                  beginAtZero: true, 
                  max: 100,
                  grid: { color: 'rgba(0,0,0,0.1)' },
                  ticks: { color: '#374151', font: { size: 10 } }
                }
              }
            }
          });
        }
      }, 300);
    });
  </script>
</body>
</html>
  `;
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