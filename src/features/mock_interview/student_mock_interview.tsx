import React, { useState, useEffect } from 'react';
import { Clock, User, CheckCircle, X, AlertCircle, ChevronDown, ChevronUp, Download, Calendar, Trophy, Target, TrendingUp, BookOpen, GraduationCap } from '@/components/common/icons';
import type { Contact } from '@/types';

interface StudentMockInterviewViewProps {
  student: Contact;
  onNavigateBack: () => void;
}

interface MockSession {
  id: string;
  student_id: number;
  student_name?: string;
  visa_type: string;
  session_date: string;
  overall_average: number;
  verdict: string;
  questions: any[];
  questions_count: number;
  correct_count?: number;
  incorrect_count?: number;
  ai_feedback?: string;
  attempt_number?: number;
}

const VerdictBadge: React.FC<{ verdict: string }> = ({ verdict }) => {
  const styles = {
    'Approved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700',
    'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700',
    'Review Required': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${styles[verdict as keyof typeof styles] || styles['Review Required']}`}>
      {verdict === 'Approved' && <CheckCircle size={16} />}
      {verdict === 'Rejected' && <X size={16} />}
      {verdict === 'Review Required' && <AlertCircle size={16} />}
      {verdict}
    </div>
  );
};

const ScoreCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</div>
    <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
  </div>
);

const QuestionCard: React.FC<{ question: any; index: number }> = ({ question, index }) => {
  const difficultyColors = {
    'easy': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'medium': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'hard': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const isCorrect = question.is_correct === true;
  const isIncorrect = question.is_correct === false;
  const hasStatus = question.is_correct !== undefined;

  return (
    <div className={`bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-5 border-2 hover:shadow-lg transition-all duration-300 ${
      hasStatus
        ? isCorrect
          ? 'border-green-200 dark:border-green-700'
          : 'border-red-200 dark:border-red-700'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {question.category || 'General'}
            </span>
            {question.difficulty && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${difficultyColors[question.difficulty as keyof typeof difficultyColors] || difficultyColors.medium}`}>
                {question.difficulty}
              </span>
            )}
            {hasStatus && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                isCorrect
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {isCorrect ? (
                  <>
                    <CheckCircle size={14} />
                    Correct
                  </>
                ) : (
                  <>
                    <X size={14} />
                    Incorrect
                  </>
                )}
              </span>
            )}
          </div>
          <p className="text-gray-800 dark:text-gray-100 font-medium text-sm leading-relaxed mb-3">
            {question.question_text || 'No question text'}
          </p>
          {question.notes && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <BookOpen size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1 uppercase tracking-wide">
                    Counsellor's Remarks
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{question.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StudentMockInterviewView: React.FC<StudentMockInterviewViewProps> = ({ student, onNavigateBack }) => {
  const [sessions, setSessions] = useState<MockSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load sessions from student's metadata
    const mockSessions = (student.metadata?.mockInterviewSessions || []) as any[];
    // Sort by date descending
    const sortedSessions = [...mockSessions].sort((a, b) => 
      new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    );
    setSessions(sortedSessions);
    setLoading(false);
  }, [student]);

  const downloadPDF = (session: MockSession) => {
    const correctCount = session.questions?.filter((q: any) => q.is_correct === true).length || 0;
    const incorrectCount = session.questions?.filter((q: any) => q.is_correct === false).length || 0;
    const attemptNumber = session.attempt_number || 1;
    const sessionId = session.id;
    const accuracy = session.questions_count > 0 ? ((correctCount / session.questions_count) * 100).toFixed(1) : '0.0';

    // Generate questions HTML
    let questionsHtml = '';
    if (session.questions && session.questions.length > 0) {
      session.questions.forEach((q: any, index: number) => {
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
          <span>${session.student_name || student.name}</span>
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
          The approval verdict in this report is based solely on mock interview performance and does not 
          guarantee approval in actual visa interview with consular officers. Final visa approval decisions 
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-lyceum-blue border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your sessions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 md:p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lyceum-blue to-blue-600 flex items-center justify-center shadow-lg">
                <GraduationCap size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  Mock Interviews
                </h1>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <User size={16} />
                  {student.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-lyceum-blue to-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-lg shadow-lg">
                <span className="text-3xl">{sessions.length}</span> Sessions
              </div>
            </div>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-12 border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <Calendar size={48} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Mock Interview Sessions Yet</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto mb-8">
                Your counsellor will schedule mock interviews when you're ready. Check back later!
              </p>
              <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Target size={18} />
                <span>Practice makes perfect!</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map((session, index) => (
              <div key={session.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                {/* Session Header */}
                <div
                  className="p-6 md:p-8 cursor-pointer bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300"
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                        session.verdict === 'Approved' 
                          ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white' 
                          : session.verdict === 'Rejected'
                          ? 'bg-gradient-to-br from-red-400 to-rose-600 text-white'
                          : 'bg-gradient-to-br from-amber-400 to-orange-600 text-white'
                      }`}>
                        {session.verdict === 'Approved' && <Trophy size={28} />}
                        {session.verdict === 'Rejected' && <X size={28} />}
                        {session.verdict === 'Review Required' && <Target size={28} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gray-900 text-white dark:bg-gray-700 dark:text-gray-200">
                            #{sessions.length - index}
                          </span>
                          <VerdictBadge verdict={session.verdict} />
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-2">
                            <Calendar size={16} />
                            {new Date(session.session_date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                          <span className="flex items-center gap-2">
                            <User size={16} />
                            {session.visa_type}
                          </span>
                          <span className="flex items-center gap-2">
                            <BookOpen size={16} />
                            {session.questions_count} questions
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Score</div>
                        <div className={`text-3xl font-bold ${
                          session.overall_average >= 4 
                            ? 'text-green-600 dark:text-green-400' 
                            : session.overall_average >= 3
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {session.overall_average.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-400">/ 5</div>
                      </div>
                      {expandedSession === session.id ? (
                        <ChevronUp size={24} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={24} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedSession === session.id && (
                  <div className="p-6 md:p-8 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <ScoreCard
                        icon={<BookOpen size={24} className="text-blue-600 dark:text-blue-400" />}
                        label="Total Questions"
                        value={session.questions_count}
                        color="bg-blue-600"
                      />
                      <ScoreCard
                        icon={<CheckCircle size={24} className="text-green-600 dark:text-green-400" />}
                        label="Correct"
                        value={`${session.correct_count || 0} (${session.questions_count > 0 ? ((session.correct_count || 0) / session.questions_count * 100).toFixed(0) : 0}%)`}
                        color="bg-green-600"
                      />
                      <ScoreCard
                        icon={<X size={24} className="text-red-600 dark:text-red-400" />}
                        label="Incorrect"
                        value={`${session.incorrect_count || 0} (${session.questions_count > 0 ? ((session.incorrect_count || 0) / session.questions_count * 100).toFixed(0) : 0}%)`}
                        color="bg-red-600"
                      />
                      <ScoreCard
                        icon={<TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />}
                        label="Average Score"
                        value={session.overall_average.toFixed(2)}
                        color="bg-purple-600"
                      />
                    </div>

                    {/* Questions Section */}
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <BookOpen size={20} className="text-white" />
                        </div>
                        Questions Asked ({session.questions?.length || 0})
                      </h3>
                      <div className="space-y-4">
                        {session.questions?.map((q: any, idx: number) => (
                          <QuestionCard key={idx} question={q} index={idx} />
                        ))}
                      </div>
                    </div>

                    {/* AI Feedback */}
                    {session.ai_feedback && (
                      <div className="mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <TrendingUp size={20} className="text-white" />
                          </div>
                          AI Feedback Report
                        </h3>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-800">
                          <div className="prose prose-sm dark:prose-invert text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {session.ai_feedback}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Download Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => downloadPDF(session)}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:-translate-y-1"
                      >
                        <Download size={20} />
                        Download PDF Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMockInterviewView;
