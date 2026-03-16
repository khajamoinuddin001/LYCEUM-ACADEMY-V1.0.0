// Improved Mock Interview Report Generation
// Use this to replace the downloadPDF function in session_history.tsx and contact_mock_interview_view.tsx

import type { MockInterviewSession } from './types';

interface MockSession {
  id: string;
  attempt_number?: number;
  student_name?: string;
  visa_type: string;
  session_date: string;
  questions_count?: number;
  questions?: Array<{
    is_correct?: boolean;
    difficulty?: string;
    category?: string;
    question_text?: string;
    notes?: string;
  }>;
  overall_average: number;
  verdict: string;
  ai_feedback?: string;
}

const generateImprovedMockReport = (session: MockSession) => {
  const correctCount = session.questions?.filter((q) => q.is_correct === true).length || 0;
  const incorrectCount = session.questions?.filter((q) => q.is_correct === false).length || 0;
  const attemptNumber = session.attempt_number || 1;
  const sessionId = session.id;
  const accuracy = session.questions_count > 0 ? ((correctCount / session.questions_count) * 100).toFixed(1) : '0.0';

  // Generate questions HTML
  let questionsHtml = '';
  if (session.questions && session.questions.length > 0) {
    session.questions.forEach((q, index: number) => {
      const correctStatus = q.is_correct ? 'correct' : 'incorrect';
      const correctText = q.is_correct ? 'Student answered correctly' : 'Student needs to work on this';
      const correctIcon = q.is_correct ? '✓' : '✗';
      
      let difficultyClass = '';
      if (q.difficulty === 'easy') {
        difficultyClass = 'question-difficulty-easy';
      } else if (q.difficulty === 'medium') {
        difficultyClass = 'question-difficulty-medium';
      } else if (q.difficulty === 'hard') {
        difficultyClass = 'question-difficulty-hard';
      }

      questionsHtml += `
        <div class="question-item">
          <div class="question-header">
            <div class="question-number">Q${index + 1}</div>
            <div class="question-meta">
              ${q.category ? `<span class="question-category">${q.category}</span>` : ''}
              ${q.difficulty ? `<span class="${difficultyClass}">${q.difficulty}</span>` : ''}
            </div>
          </div>
          <div class="question-text">${q.question_text || 'No question text'}</div>
          <div class="question-status ${correctStatus}">
            ${correctIcon} Correct
            <span>${correctText}</span>
          </div>
          ${q.notes ? `
          <div class="notes-box">
            <div class="notes-label">Notes:</div>
            <div class="notes-text">${q.notes}</div>
          </div>
          ` : ''}
        </div>`;
    });
  }

  // AI Feedback section
  let aiFeedbackSection = '';
  if (session.ai_feedback) {
    aiFeedbackSection = `
    <div class="section">
      <h3 class="section-title">AI Feedback Report</h3>
      <div class="feedback">
        <h3>Artificial Intelligence Analysis</h3>
        <div class="feedback-content">${session.ai_feedback}</div>
      </div>
    </div>`;
  }

  // Generate verdict class
  const verdictClass = session.verdict.toLowerCase().replace('review required', 'review');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock Interview Report - ${sessionId}</title>
  <style>
    @page { size: A4; margin: 1.2cm; }
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      line-height: 1.6;
      color: #1f2937;
      background: #f8fafc;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    /* HEADER */
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: #ffffff;
      padding: 45px 35px;
      text-align: center;
      border-radius: 12px;
      margin-bottom: 35px;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    }
    
    .logo {
      font-size: 32px;
      font-weight: 800;
      margin: 0 0 8px 0;
      letter-spacing: 2px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .tagline {
      font-size: 13px;
      font-weight: 500;
      margin: 0 0 20px 0;
      opacity: 0.95;
      letter-spacing: 0.5px;
    }
    
    .report-info {
      display: flex;
      justify-content: center;
      gap: 50px;
      margin-top: 20px;
      font-size: 13px;
      background: rgba(255, 255, 255, 0.15);
      padding: 15px 25px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }
    
    .report-info-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .report-info-item strong {
      color: #ffffff;
      font-weight: 600;
    }
    
    .report-info-item span {
      color: #dbeafe;
      font-weight: 500;
    }
    
    /* SECTIONS */
    .section {
      margin-bottom: 30px;
      padding: 28px;
      background: #f8fafc;
      border-radius: 12px;
      border-left: 5px solid #1e40af;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #1e40af;
      margin: 0 0 22px 0;
      padding-bottom: 12px;
      border-bottom: 3px solid #3b82f6;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section-title::before {
      content: '◆';
      font-size: 12px;
      color: #3b82f6;
    }
    
    /* INFO GRID */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
    }
    
    .info-item {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
    }
    
    .info-item strong {
      color: #1e40af;
      font-weight: 600;
      min-width: 160px;
    }
    
    .info-item span {
      color: #374151;
      font-weight: 600;
    }
    
    /* METRICS */
    .metrics {
      display: flex;
      justify-content: space-around;
      gap: 18px;
      margin: 25px 0;
    }
    
    .metric {
      text-align: center;
      padding: 22px;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      flex: 1;
      position: relative;
      overflow: hidden;
    }
    
    .metric::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #1e40af, #3b82f6);
    }
    
    .metric-value {
      font-size: 36px;
      font-weight: 800;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 5px;
    }
    
    .metric-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    
    /* VERDICT */
    .verdict {
      text-align: center;
      padding: 35px;
      border-radius: 16px;
      font-size: 24px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    }
    
    .verdict.approved {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    }
    
    .verdict.rejected {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
    }
    
    .verdict.review {
      background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
    }
    
    /* QUESTIONS */
    .questions-list {
      margin-top: 25px;
    }
    
    .question-item {
      margin-bottom: 22px;
      padding: 22px;
      background: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
    }
    
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      padding-bottom: 14px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .question-number {
      font-size: 14px;
      font-weight: 700;
      color: #1e40af;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      padding: 10px 18px;
      border-radius: 8px;
      border: 2px solid #bfdbfe;
    }
    
    .question-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 11px;
    }
    
    .question-category {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      color: #0369a1;
      padding: 7px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .question-difficulty-easy {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      color: #065f46;
      padding: 7px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .question-difficulty-medium {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
      padding: 7px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .question-difficulty-hard {
      background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
      color: #991b1b;
      padding: 7px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .question-text {
      font-size: 13px;
      color: #1f2937;
      flex: 1;
      font-weight: 500;
      line-height: 1.7;
    }
    
    .question-status {
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    
    .question-status.correct {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: #ffffff;
    }
    
    .question-status.incorrect {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      color: #ffffff;
    }
    
    .question-status span {
      margin-left: 8px;
      font-weight: 400;
      font-size: 10px;
      opacity: 0.9;
    }
    
    /* NOTES */
    .notes-box {
      margin-top: 15px;
      padding: 16px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }
    
    .notes-label {
      color: #1e40af;
      font-weight: 600;
      font-size: 11px;
      margin-bottom: 5px;
    }
    
    .notes-text {
      color: #374151;
      font-size: 11px;
      line-height: 1.6;
    }
    
    /* FEEDBACK */
    .feedback {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      padding: 28px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      margin-top: 0;
      line-height: 1.8;
    }
    
    .feedback h3 {
      color: #1e40af;
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .feedback-content {
      white-space: pre-wrap;
      color: #374151;
      font-size: 11px;
      line-height: 1.7;
    }
    
    /* FOOTER */
    .footer {
      text-align: center;
      margin-top: 45px;
      padding: 30px 20px;
      border-top: 3px solid #e5e7eb;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 12px 12px 0 0;
    }
    
    .footer-content p {
      margin: 8px 0;
      color: #6b7280;
      font-weight: 500;
    }
    
    .footer-content strong {
      color: #1e40af;
    }
    
    .disclaimer {
      margin-top: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 2px solid #fbbf24;
      border-radius: 12px;
      font-size: 10px;
      color: #92400e;
      line-height: 1.7;
    }
    
    .disclaimer strong {
      display: block;
      margin-bottom: 8px;
      font-size: 11px;
      color: #78350f;
    }
    
    @media print {
      body { background: #ffffff; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <div class="logo">LYCEUM ACADEMY</div>
      <div class="tagline">Mock Interview Assessment Report</div>
      <div class="report-info">
        <div class="report-info-item">
          <strong>Session ID:</strong>
          <span>${sessionId}</span>
        </div>
        <div class="report-info-item">
          <strong>Attempt #:</strong>
          <span>#${attemptNumber}</span>
        </div>
      </div>
    </div>

    <!-- INTERVIEW INFORMATION -->
    <div class="section">
      <h3 class="section-title">Interview Information</h3>
      <div class="info-grid">
        <div class="info-item">
          <strong>Student Name:</strong>
          <span>${session.student_name || 'N/A'}</span>
        </div>
        <div class="info-item">
          <strong>Visa Type:</strong>
          <span>${session.visa_type}</span>
        </div>
        <div class="info-item">
          <strong>Mock Interview Date:</strong>
          <span>${new Date(session.session_date).toLocaleString()}</span>
        </div>
        <div class="info-item">
          <strong>Overall Average:</strong>
          <span>${session.overall_average.toFixed(2)}/5.00</span>
        </div>
      </div>
    </div>

    <!-- PERFORMANCE SUMMARY -->
    <div class="section">
      <h3 class="section-title">Performance Summary</h3>
      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${session.questions_count || 0}</div>
          <div class="metric-label">Total Questions</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${correctCount}</div>
          <div class="metric-label">Correct</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${incorrectCount}</div>
          <div class="metric-label">Incorrect</div>
        </div>
        <div class="metric">
          <div class="metric-value">${accuracy}%</div>
          <div class="metric-label">Accuracy</div>
        </div>
      </div>
    </div>

    <!-- VERDICT -->
    <div class="section">
      <h3 class="section-title">Final Verdict</h3>
      <div class="verdict ${verdictClass}">
        ${session.verdict}
      </div>
    </div>

    <!-- QUESTIONS -->
    <div class="section">
      <h3 class="section-title">Questions Asked (${session.questions?.length || 0})</h3>
      <div class="questions-list">
        ${questionsHtml}
      </div>
    </div>

    <!-- AI FEEDBACK -->
    ${aiFeedbackSection}

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-content">
        <p><strong>Lyceum Academy</strong> - Mock Interview Assessment System</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p style="font-size: 10px;">Report ID: ${sessionId}</p>
        <div class="disclaimer">
          <strong>⚠️ IMPORTANT DISCLAIMER</strong>
          This is a mock interview assessment conducted by Lyceum Academy to evaluate student readiness. 
          The approval verdict in this report is based solely on the mock interview performance and does not 
          guarantee approval in the actual visa interview with consular officers. Final visa approval decisions 
          are at the sole discretion of the interviewing officer and depend on various factors including but not 
          limited to documentation, ties to home country, financial stability, and consular discretion. 
          Students should use this report as a learning tool to identify areas for improvement and continue 
          preparing for their actual interview.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  // Open print window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  return htmlContent;
};

export default generateImprovedMockReport;
