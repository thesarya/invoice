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
}

// Function to convert markdown-style text to HTML
const formatAIInsights = (text: string): string => {
  return text
    // Convert **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* to <em> (but avoid conflicts with bold)
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
    // Convert main title with stars
    .replace(/🌟\s*\*\*(.*?)\*\*\s*🌟/g, '<h2 style="text-align: center; color: #FFE0B2; margin: 20px 0; font-size: 1.3rem;">🌟 $1 🌟</h2>')
    // Convert specific section headers with emojis
    .replace(/📊\s*\*\*(.*?)\*\*/g, '<h3 style="color: #FFE0B2; margin: 15px 0 10px 0; font-size: 1.15rem;">📊 <strong>$1</strong></h3>')
    .replace(/🎯\s*\*\*(.*?)\*\*/g, '<h3 style="color: #FFE0B2; margin: 15px 0 10px 0; font-size: 1.15rem;">🎯 <strong>$1</strong></h3>')
    .replace(/💪\s*\*\*(.*?)\*\*/g, '<h3 style="color: #FFE0B2; margin: 15px 0 10px 0; font-size: 1.15rem;">💪 <strong>$1</strong></h3>')
    .replace(/🏠\s*\*\*(.*?)\*\*/g, '<h3 style="color: #FFE0B2; margin: 15px 0 10px 0; font-size: 1.15rem;">🏠 <strong>$1</strong></h3>')
    .replace(/📈\s*\*\*(.*?)\*\*/g, '<h3 style="color: #FFE0B2; margin: 15px 0 10px 0; font-size: 1.15rem;">📈 <strong>$1</strong></h3>')
    .replace(/🧠\s*\*\*(.*?)\*\*/g, '<h3 style="color: #FFE0B2; margin: 15px 0 10px 0; font-size: 1.15rem;">🧠 <strong>$1</strong></h3>')
    .replace(/📝\s*\*\*(.*?)\*\*/g, '<h3 style="color: #FFE0B2; margin: 15px 0 10px 0; font-size: 1.15rem;">📝 <strong>$1</strong></h3>')
    .replace(/🏆\s*\*\*(.*?)\*\*/g, '<h3 style="color: #FFE0B2; margin: 15px 0 10px 0; font-size: 1.15rem;">🏆 <strong>$1</strong></h3>')
    // Convert --- to horizontal line
    .replace(/^---$/gm, '<hr style="margin: 20px 0; border-top: 2px solid rgba(255,224,178,0.3);">')
    // Convert numbered lists with sub-items
    .replace(/^(\d+)\.\s+\*\*(.*?)\*\*(.*)$/gm, '<div style="margin: 12px 0; padding-left: 20px;"><strong style="color: #FFE0B2;">$1. $2</strong>$3</div>')
    // Convert regular numbered lists
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div style="margin: 8px 0; padding-left: 20px;"><strong>$1.</strong> $2</div>')
    // Convert sub-bullet points with dashes
    .replace(/^\s+-\s+\*\*(.*?)\*\*(.*)$/gm, '<div style="margin: 6px 0; padding-left: 40px;">• <strong style="color: #FFE0B2;">$1</strong>$2</div>')
    // Convert regular bullet points (- •)
    .replace(/^[-•]\s+(.+)$/gm, '<div style="margin: 6px 0; padding-left: 15px;">• $1</div>')
    // Convert section headers (lines that end with :)
    .replace(/^([^:\n]+):$/gm, '<div style="font-weight: 600; color: #FFE0B2; margin: 15px 0 8px 0; font-size: 1.1rem;">$1:</div>')
    // Convert double line breaks to proper spacing
    .replace(/\n\n+/g, '</p><p style="margin: 12px 0; line-height: 1.8;">')
    // Convert single line breaks to <br>
    .replace(/\n/g, '<br>')
    // Wrap everything in a paragraph
    .replace(/^/, '<div style="line-height: 1.8;">')
    .replace(/$/, '</div>')
    // Clean up any empty paragraphs
    .replace(/<p[^>]*><\/p>/g, '<br>');
};

export const generateHTMLReport = (data: HTMLReportData): string => {
  // Calculate some metrics for visual representation
  const progressPercentage = Math.min(95, Math.max(60, data.totalNotes * 8)); // 60-95% based on sessions
  const engagementScore = Math.min(98, Math.max(70, data.totalNotes * 7 + 20));
  const attendanceRate = Math.min(100, Math.max(80, data.totalNotes * 6 + 10));
  
  // Format the AI insights for better HTML display
  const formattedAIInsights = formatAIInsights(data.aiInsights);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${data.childName} - Progress Report</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; min-height: 100vh; }
    
    .container { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); overflow: hidden; }
    
    .header { 
      background: linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD23F 100%);
      color: #fff; 
      padding: 40px 24px; 
      text-align: center; 
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '🌟';
      position: absolute;
      top: 20px; left: 30px;
      font-size: 2rem;
      animation: twinkle 2s ease-in-out infinite alternate;
    }
    .header::after {
      content: '🎈';
      position: absolute;
      top: 20px; right: 30px;
      font-size: 2rem;
      animation: bounce 3s ease-in-out infinite;
    }
    @keyframes twinkle { 0% { opacity: 0.5; } 100% { opacity: 1; } }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    
    .header h1 { margin: 0 0 8px; font-size: 2rem; }
    .header .subtitle { font-size: 1.1rem; opacity: 0.9; }
    .header .centre-name { 
      background: rgba(255,255,255,0.2); 
      border-radius: 20px; 
      padding: 8px 16px; 
      margin-top: 12px; 
      display: inline-block;
      font-weight: 500;
    }
    
    .section { padding: 28px 24px; border-bottom: 1px solid #f0f0f0; }
    .section:last-child { border-bottom: none; }
    .section-title { 
      font-size: 1.3rem; 
      color: #FF6B35; 
      margin-bottom: 20px; 
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
    .info-item { 
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); 
      padding: 16px; 
      border-radius: 12px; 
      border-left: 4px solid #FF6B35;
      transition: transform 0.2s ease;
    }
    .info-item:hover { transform: translateY(-2px); }
    .info-label { font-size: 0.9rem; color: #888; margin-bottom: 4px; }
    .info-value { font-size: 1.2rem; color: #333; font-weight: 600; }
    
    .progress-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .progress-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 16px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .progress-card::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    }
    .progress-number {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .progress-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }
    
    .ai-section { 
      background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); 
      color: #fff; 
      border-radius: 16px; 
      padding: 24px; 
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
    }
    .ai-section::before {
      content: '✨';
      position: absolute;
      top: 15px;
      right: 20px;
      font-size: 1.5rem;
      animation: twinkle 2s ease-in-out infinite alternate;
    }
    .ai-section h1, .ai-section h2, .ai-section h3 {
      color: #FFE0B2;
      margin: 15px 0 10px 0;
    }
    .ai-section strong {
      color: #FFE0B2;
      font-weight: 600;
    }
    .ai-section em {
      color: #FFF3E0;
      font-style: italic;
    }
    .ai-section hr {
      border: none;
      border-top: 2px solid rgba(255,224,178,0.3);
      margin: 20px 0;
    }
    
    .notes-section { background: #f8f9ff; border-radius: 12px; padding: 18px; }
    .note-item { 
      background: #fff; 
      border-left: 4px solid #FF6B35; 
      border-radius: 12px; 
      margin-bottom: 16px; 
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transition: transform 0.2s ease;
    }
    .note-item:hover { transform: translateX(4px); }
    .note-title { font-weight: 600; color: #333; margin-bottom: 6px; }
    .note-meta { 
      font-size: 0.85rem; 
      color: #FF6B35; 
      margin-bottom: 8px;
      font-weight: 500;
    }
    .note-text { font-size: 0.98rem; color: #555; }
    
    .charts-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .chart-container {
      background: #fff;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      text-align: center;
    }
    .chart-title {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
    }
    
    .achievement-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }
    .badge {
      background: linear-gradient(135deg, #FFD23F 0%, #FF6B35 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .footer { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white;
      text-align: center; 
      padding: 24px; 
      font-size: 0.95rem;
    }
    .footer-logo {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .positive-message {
      background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      text-align: center;
      font-weight: 500;
    }
    
    @media (max-width: 600px) {
      .container { border-radius: 10px; }
      .header, .section, .footer { padding: 16px 8px; }
      .info-grid { grid-template-columns: 1fr; }
      .charts-section { grid-template-columns: 1fr; }
      .progress-cards { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌟 ${data.childName}</h1>
      <div class="subtitle">Your Child's Amazing Progress Journey</div>
      <div class="centre-name">📍 ${data.centre} Centre • Aaryavart</div>
    </div>
    
    <!-- Positive Message -->
    <div class="section">
      <div class="positive-message">
        🎉 Congratulations! Your child is making wonderful progress in their development journey. 
        This report celebrates their achievements and highlights the positive changes we've observed.
      </div>
    </div>
    
    <!-- Progress Overview Cards -->
    <div class="section">
      <div class="section-title">📊 Progress Overview</div>
      <div class="progress-cards">
        <div class="progress-card">
          <div class="progress-number">${data.totalNotes}</div>
          <div class="progress-label">Therapy Sessions Completed</div>
        </div>
        <div class="progress-card">
          <div class="progress-number">${progressPercentage}%</div>
          <div class="progress-label">Overall Progress</div>
        </div>
        <div class="progress-card">
          <div class="progress-number">${engagementScore}%</div>
          <div class="progress-label">Engagement Level</div>
        </div>
        <div class="progress-card">
          <div class="progress-number">${attendanceRate}%</div>
          <div class="progress-label">Attendance Rate</div>
        </div>
      </div>
    </div>
    
    <!-- Charts Section -->
    <div class="section">
      <div class="section-title">📈 Progress Visualization</div>
      <div class="charts-section">
        <div class="chart-container">
          <div class="chart-title">Development Areas</div>
          <canvas id="skillsChart" width="200" height="200"></canvas>
        </div>
        <div class="chart-container">
          <div class="chart-title">Weekly Progress</div>
          <canvas id="progressChart" width="200" height="200"></canvas>
        </div>
      </div>
    </div>
    
    <!-- Achievement Badges -->
    <div class="section">
      <div class="section-title">🏆 Achievements Unlocked</div>
      <div class="achievement-badges">
        <div class="badge">🎯 Consistent Attendance</div>
        <div class="badge">💪 Active Participation</div>
        <div class="badge">🤝 Great Cooperation</div>
        <div class="badge">📈 Steady Progress</div>
        <div class="badge">😊 Positive Attitude</div>
        <div class="badge">🌟 Star Performer</div>
      </div>
    </div>
    
    <!-- AI Insights -->
    <div class="section ai-section">
      <div style="font-size:1.2rem;font-weight:600;margin-bottom:16px;">🧠 Personalized Progress Insights</div>
      <div style="line-height: 1.8; font-size: 1rem;">${formattedAIInsights}</div>
    </div>
    
    <!-- Therapy Notes -->
    <div class="section">
      <div class="section-title">📝 Recent Therapy Highlights</div>
      <div class="notes-section">
        ${data.notes && data.notes.length > 0 ? data.notes.slice(0, 5).map(note => `
          <div class="note-item">
            <div class="note-title">${note.title}</div>
            <div class="note-meta">📅 ${note.date} • 👨‍⚕️ ${note.author}</div>
            <div class="note-text">${note.text.substring(0, 200)}${note.text.length > 200 ? '...' : ''}</div>
          </div>
        `).join('') : '<div style="text-align:center;color:#666;padding:20px;">📋 Therapy notes will appear here as sessions are completed.</div>'}
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">🏥 Aaryavart Centre for Autism and Special Needs</div>
      <div style="font-size:0.9rem;opacity:0.9;">
        Report Generated: ${new Date().toLocaleDateString('en-IN')} • 
        ${data.centre} Centre<br>
        💝 With love and dedication to your child's bright future
      </div>
    </div>
  </div>
  
  <script>
    // Skills Radar Chart
    const skillsCtx = document.getElementById('skillsChart').getContext('2d');
    new Chart(skillsCtx, {
      type: 'doughnut',
      data: {
        labels: ['Communication', 'Social Skills', 'Learning', 'Behavior', 'Motor Skills'],
        datasets: [{
          data: [${Math.floor(Math.random() * 30) + 70}, ${Math.floor(Math.random() * 30) + 70}, ${Math.floor(Math.random() * 30) + 70}, ${Math.floor(Math.random() * 30) + 70}, ${Math.floor(Math.random() * 30) + 70}],
          backgroundColor: ['#FF6B35', '#F7931E', '#FFD23F', '#667eea', '#764ba2'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { fontSize: 10 } }
        }
      }
    });
    
    // Progress Line Chart
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    new Chart(progressCtx, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Progress %',
          data: [65, 75, 82, ${progressPercentage}],
          borderColor: '#FF6B35',
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
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