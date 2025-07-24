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

export const generateHTMLReport = (data: HTMLReportData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${data.childName} - Progress Report</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; background: #f4f7fa; margin: 0; padding: 0; }
    .container { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0 0 8px; font-size: 2rem; }
    .header .subtitle { font-size: 1.1rem; opacity: 0.9; }
    .section { padding: 28px 24px; border-bottom: 1px solid #f0f0f0; }
    .section:last-child { border-bottom: none; }
    .section-title { font-size: 1.3rem; color: #667eea; margin-bottom: 16px; font-weight: 600; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
    .info-item { background: #f8f9ff; padding: 12px; border-radius: 10px; }
    .info-label { font-size: 0.9rem; color: #888; margin-bottom: 4px; }
    .info-value { font-size: 1rem; color: #333; font-weight: 500; }
    .ai-section { background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%); color: #fff; border-radius: 12px; padding: 20px; margin-bottom: 18px; }
    .notes-section { background: #f8f9ff; border-radius: 12px; padding: 18px; }
    .note-item { background: #fff; border-left: 4px solid #667eea; border-radius: 8px; margin-bottom: 14px; padding: 12px; }
    .note-title { font-weight: 600; color: #333; margin-bottom: 6px; }
    .note-meta { font-size: 0.85rem; color: #888; margin-bottom: 8px; }
    .note-text { font-size: 0.98rem; color: #555; }
    .footer { background: #f8f9ff; text-align: center; padding: 18px 24px; font-size: 0.95rem; color: #888; }
    @media (max-width: 600px) {
      .container { border-radius: 10px; }
      .header, .section, .footer { padding: 16px 8px; }
      .info-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌟 ${data.childName}</h1>
      <div class="subtitle">Therapeutic Progress Report</div>
      <div style="margin-top:10px;font-size:0.95rem;">${data.centre ? data.centre.toUpperCase() + " Centre" : ""}</div>
    </div>
    <div class="section">
      <div class="section-title">📊 Analysis Summary</div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Therapy Sessions Analyzed</div><div class="info-value">${data.totalNotes}</div></div>
        <div class="info-item"><div class="info-label">Analysis Period</div><div class="info-value">${data.dateRange}</div></div>
      </div>
      <div style="margin-top:10px;">Analysis Method: <b>AI-powered therapeutic insights</b></div>
    </div>
    <div class="section ai-section">
      <div style="font-size:1.1rem;font-weight:600;margin-bottom:10px;">🧠 Progress Insights</div>
      <div>${data.aiInsights}</div>
    </div>
    <div class="section">
      <div class="section-title">📝 Therapy Session Notes</div>
      <div class="notes-section">
        ${data.notes && data.notes.length > 0 ? data.notes.slice(0, 5).map(note => `
          <div class="note-item">
            <div class="note-title">${note.title}</div>
            <div class="note-meta">📅 ${note.date} | 👨‍⚕️ ${note.author}</div>
            <div class="note-text">${note.text.substring(0, 150)}${note.text.length > 150 ? '...' : ''}</div>
          </div>
        `).join('') : '<div>No therapy notes available for this period.</div>'}
      </div>
    </div>
    <div class="footer">
      Report Generated: ${new Date().toLocaleDateString()}<br>
      With gratitude, Aaryavart Centre for Autism and Special Needs
    </div>
  </div>
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