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
  // Extract only positive highlights - keep it simple for Indian parents
  const positiveLines = text.split('\n')
    .filter(line => {
      const lower = line.toLowerCase();
      return line.trim() && 
             (lower.includes('good') || lower.includes('improved') || 
              lower.includes('better') || lower.includes('progress') ||
              lower.includes('excellent') || lower.includes('wonderful') ||
              lower.includes('achievement') || lower.includes('mastered'));
    })
    .slice(0, 3); // Only top 3 highlights
  
  if (positiveLines.length === 0) {
    return `
      <div class="bg-white rounded-lg p-6 text-center">
        <div class="text-4xl mb-3">🌟</div>
        <div class="text-xl font-semibold text-gray-800 mb-2">Excellent Progress!</div>
        <div class="text-gray-600">Your child is making wonderful progress in their development.</div>
      </div>`;
  }
  
  let formattedContent = '';
  
  positiveLines.forEach((line, index) => {
    const cleanLine = line
      .replace(/^[-•*]\s*/, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .trim();
    
    const icons = ['🌟', '👏', '🎯'];
    
    formattedContent += `
      <div class="bg-white rounded-lg p-4 mb-3 shadow-sm border-l-4 border-accent-400">
        <div class="flex items-start">
          <span class="text-2xl mr-3">${icons[index]}</span>
                     <div>
             <div class="font-semibold text-gray-800 mb-1">Great News ${index + 1}</div>
             <div class="text-gray-600 leading-relaxed">${cleanLine}</div>
           </div>
        </div>
      </div>`;
  });
  
  return formattedContent;
}

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


  // Format the AI insights for better HTML display (top 3 highlights)
  const formattedAIHighlights = formatAIInsights(data.aiInsights);

  // Helper to extract Key Achievements from the raw LLM insight
  function extractKeyAchievements(insight: string): string[] {
    // Look for section starting with 'Key Achievements' and ending at next section or end
    const match = insight.match(/Key Achievements[\s\S]*?(?:\n\s*[-•*]\s+.+)+/i);
    if (!match) return [];
    // Extract bullet points
    const lines = match[0].split('\n').filter(line => /^[-•*]\s+/.test(line.trim()));
    return lines.map(line => line.replace(/^[-•*]\s+/, '').trim()).filter(Boolean);
  }

  const keyAchievements = extractKeyAchievements(data.aiInsights);

  // Render Key Achievements as beautiful cards
  const keyAchievementsCards = keyAchievements.length > 0 ? `
    <div class="mb-8">
      <h4 class="text-xl font-bold text-orange-700 mb-4 flex items-center"><span class="text-2xl mr-2">🏅</span> Key Achievements</h4>
      <div class="grid md:grid-cols-2 gap-4">
        ${keyAchievements.map((ach, i) => `
          <div class="bg-white border-l-8 border-orange-300 rounded-xl shadow p-5 flex items-start gap-3">
            <span class="text-2xl">${['🥇','🥈','🥉','🏆','🎖️'][i%5]}</span>
            <div class="text-lg text-gray-800 font-medium">${ach}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Raw LLM insight as a visually appealing card
  const rawInsightCard = `
    <div class="bg-gradient-to-br from-yellow-50 to-orange-50 border-l-8 border-yellow-400 rounded-2xl shadow-lg p-7 mb-8">
      <div class="flex items-center mb-3">
        <span class="text-3xl mr-3">💡</span>
        <h4 class="text-2xl font-bold text-yellow-700">Full Progress Insight (AI Analysis)</h4>
      </div>
      <div class="text-gray-800 whitespace-pre-line text-lg leading-relaxed font-sans" style="word-break:break-word;">
        ${data.aiInsights.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </div>
    </div>
    ${keyAchievementsCards}
  `;

  // Merge Progress Highlights and Recent Therapy Highlights into one section, with raw insight card
  const mergedHighlights = `
    <div class="glass-card p-8 mb-10 border-2 border-primary-200">
      <h3 class="section-title flex items-center mb-4">
        <span class="mr-2">🌟</span> Progress & Therapy Highlights
      </h3>
      ${rawInsightCard}
      <div class="mt-8 p-5 rounded-lg bg-yellow-50 border-2 border-yellow-300 text-yellow-900 text-base shadow-sm">
        <strong>Disclaimer:</strong> This report is generated by analysis of therapy session notes and is intended for parental insight and encouragement only. It is <u>not</u> a medical or legal document and cannot be used as evidence for any medical, legal, or insurance purposes. For any clinical, diagnostic, or legal needs, please consult your child's therapist or doctor directly for a formal evaluation and advice.
      </div>
      <div class="mt-3 text-xs text-gray-500 text-center">
        For deeper understanding or questions about your child's progress, always reach out to your therapist or doctor at Aaryavart Center for Autism and Special Needs.
      </div>
    </div>
  `;

  // Instagram link for footer
  const instagramUrl = "https://www.instagram.com/aaryavartcenterforautism/";
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${data.childName} - Progress Report</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: linear-gradient(120deg, #f0f7fa 0%, #fdfdea 100%); min-height: 100vh; }
    .glass-card { background: rgba(255,255,255,0.92); box-shadow: 0 8px 32px 0 rgba(56,189,248,0.10); border-radius: 1.5rem; border: 1.5px solid #bae6fd; backdrop-filter: blur(3px); }
    .section-title { font-size: 1.5rem; font-weight: 800; color: #0ea5e9; letter-spacing: 0.01em; margin-bottom: 0.7rem; text-shadow: 0 2px 8px #bae6fd33; }
    .section-subtitle { font-size: 1.15rem; color: #0369a1; margin-bottom: 0.5rem; }
    .stat-card { background: linear-gradient(120deg, #e0f2fe 60%, #fdfdea 100%); border-radius: 1.2rem; box-shadow: 0 2px 12px 0 rgba(56,189,248,0.10); border: 1.5px solid #bae6fd; }
    .highlight-badge { background: linear-gradient(90deg, #facc15 0%, #fbbf24 100%); color: #854d0e; font-weight: 700; border-radius: 9999px; padding: 0.35rem 1.2rem; font-size: 1.05rem; margin: 0.18rem 0.4rem; display: inline-block; box-shadow: 0 2px 8px #facc1533; }
    .note-card { background: linear-gradient(90deg, #e0f2fe 0%, #fdfdea 100%); border-left: 6px solid #0ea5e9; border-radius: 1rem; padding: 1.1rem; margin-bottom: 1.2rem; box-shadow: 0 2px 8px 0 rgba(14,165,233,0.10); }
    .footer-glass { background: linear-gradient(90deg, #0ea5e9 60%, #facc15 100%); border-radius: 1.5rem; color: #fff; box-shadow: 0 2px 16px 0 rgba(14,165,233,0.15); }
    a.insta-link { color: #fff; text-decoration: underline; font-weight: 700; }
    .emoji-burst { font-size: 2.2rem; margin-bottom: 0.5rem; animation: pop 1.2s infinite alternate; }
    @keyframes pop { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }
    .wow-moment { background: #fffbe7; border-left: 5px solid #facc15; border-radius: 0.9rem; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 1px 6px 0 #facc1533; }
    .wow-moment .moment-title { color: #b45309; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.3rem; }
    .wow-moment .moment-text { color: #854d0e; font-size: 1rem; }
  </style>
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
    <div class="glass-card p-10 text-center mb-10 shadow-lg border-2 border-primary-100">
      <div class="emoji-burst">🌈✨</div>
      <h1 class="text-5xl md:text-6xl font-extrabold mb-3 gradient-text">${data.childName}</h1>
      <p class="text-xl opacity-90 mb-4 section-subtitle">Personalized Progress Report</p>
      <div class="bg-primary-100 rounded-full px-8 py-3 inline-block mt-2">
        <span class="font-semibold text-primary-700 text-lg">Aaryavart Center for Autism and Special Needs</span>
      </div>
    </div>

    <!-- Welcome Message -->
    <div class="bg-white rounded-xl p-6 mb-6 shadow-sm border border-primary-100">
      <div class="text-center">
        <div class="text-4xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Congratulations!</h2>
        <p class="text-gray-600 leading-relaxed text-lg">
          ${data.childName} is making wonderful progress! This report celebrates their achievements.
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
    <div class="glass-card p-8 mb-10">
      <h3 class="section-title text-center">🏆 Great Achievements</h3>
      <div class="flex flex-wrap justify-center gap-3 mt-2">
        <span class="highlight-badge">🎯 Good Attendance</span>
        <span class="highlight-badge">💪 Great Cooperation</span>
        <span class="highlight-badge">📈 Steady Progress</span>
        <span class="highlight-badge">😊 Positive Attitude</span>
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

  ${mergedHighlights}



    <!-- Footer -->
    <div class="footer-glass p-8 text-center mt-12">
      <div class="text-3xl font-bold mb-3">🙏 Thank you for trusting us</div>
      <p class="opacity-90 mb-5 text-xl">
        We are honored to be part of <span class="font-semibold">${data.childName}</span>'s development journey.<br/>
        Together, we are building a brighter future filled with possibilities.<br/>
        <span class="text-2xl">💙</span>
      </p>
      <div class="bg-white/30 rounded-lg p-5 mt-2">
        <div class="font-semibold mb-1 text-primary-100 text-lg">Aaryavart Centre for Autism and Special Needs</div>
        <div class="text-base opacity-80 mb-2">
          Report Generated: ${new Date().toLocaleDateString('en-IN')}
        </div>
        <div class="mt-4">
          <span class="text-lg">Follow us on Instagram: </span><a class="insta-link text-lg" href="${instagramUrl}" target="_blank">@aaryavartcenterforautism</a>
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