import React, { useState, useEffect } from 'react';
import { Clock, User, CheckCircle, X, AlertCircle, ChevronDown, ChevronUp, Download, Eye, TrendingUp } from '@/components/common/icons';
import type { Contact } from '@/types';

interface SessionHistoryProps {
  contacts: Contact[];
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

const SessionHistoryComponent: React.FC<SessionHistoryProps> = ({ contacts }) => {
  const [sessions, setSessions] = useState<MockSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    studentId: number | 'all';
    visaType: string | 'all';
    verdict: string | 'all';
  }>({
    studentId: 'all',
    visaType: 'all',
    verdict: 'all'
  });

  useEffect(() => {
    const allSessions: MockSession[] = [];
    contacts.forEach(contact => {
      const mockSessions = (contact.metadata?.mockInterviewSessions || []) as any[];
      const sortedSessions = [...mockSessions].sort((a, b) => 
        new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
      );
      sortedSessions.forEach((session, index) => {
        allSessions.push({
          ...session,
          student_name: contact.name,
          questions_count: session.questions?.length || 0,
          correct_count: session.questions?.filter((q: any) => q.is_correct === true).length || 0,
          incorrect_count: session.questions?.filter((q: any) => q.is_correct === false).length || 0,
          attempt_number: index + 1
        });
      });
    });
    setSessions(allSessions);
  }, [contacts]);

  const filteredSessions = sessions.filter(session => {
    if (filter.studentId !== 'all' && session.student_id !== filter.studentId) return false;
    if (filter.verdict !== 'all' && session.verdict !== filter.verdict) return false;
    if (filter.visaType !== 'all' && session.visa_type !== filter.visaType) return false;
    return true;
  });

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'Approved': return <CheckCircle size={20} className="text-green-500" />;
      case 'Rejected': return <X size={20} className="text-red-500" />;
      case 'Review Required': return <AlertCircle size={20} className="text-yellow-500" />;
      default: return <AlertCircle size={20} className="text-gray-500" />;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'Review Required': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const downloadPDF = (session: MockSession) => {
    const correctCount = session.questions?.filter((q: any) => q.is_correct === true).length || 0;
    const incorrectCount = session.questions?.filter((q: any) => q.is_correct === false).length || 0;
    const attemptNumber = session.attempt_number || 1;
    const sessionId = session.id;

    const html = document.createElement('html');
    const head = document.createElement('head');
    head.innerHTML = `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Mock Interview Report - ${sessionId}</title>
    <style>
      @page { size: A4; margin: 1.5cm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 11px;
        line-height: 1.6;
        color: #1f2937;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .container {
        max-width: 750px;
        margin: 0 auto;
        background: #ffffff;
        padding: 30px;
      }
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
      .header .logo {
        font-size: 32px;
        font-weight: 800;
        margin: 0 0 8px 0;
        letter-spacing: 2px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      }
      .header .tagline {
        font-size: 13px;
        font-weight: 500;
        margin: 0 0 20px 0;
        opacity: 0.95;
        letter-spacing: 0.5px;
      }
      .header .report-info {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin-top: 15px;
        font-size: 13px;
        background: rgba(255, 255, 255, 0.1);
        padding: 12px 20px;
        border-radius: 4px;
      }
      .header strong {
        color: #ffffff;
        font-weight: 600;
      }
      .header span {
        color: #e0f2fe;
      }
      .section {
        margin-bottom: 30px;
        padding: 25px;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 4px solid #1e40af;
      }
      .section-title {
        font-size: 16px;
        font-weight: 700;
        color: #1e40af;
        margin: 0 0 20px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid #e5e7eb;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 15px;
      }
      .info-item {
        display: flex;
        align-items: center;
        padding: 15px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
      }
      .info-item strong {
        color: #1e40af;
        font-weight: 600;
        min-width: 140px;
      }
      .info-item span {
        color: #374151;
        font-weight: 500;
      }
      .metrics {
        display: flex;
        justify-content: space-around;
        gap: 20px;
        margin: 20px 0;
      }
      .metric {
        text-align: center;
        padding: 20px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }
      .metric-value {
        font-size: 28px;
        font-weight: 700;
        color: #1e40af;
      }
      .metric-label {
        font-size: 11px;
        color: #6b7280;
        text-transform: uppercase;
        margin-top: 8px;
        font-weight: 600;
      }
      .verdict {
        text-align: center;
        padding: 30px;
        border-radius: 8px;
        font-size: 20px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: #ffffff;
      }
      .verdict.approved {
        background: linear-gradient(135deg, #059669 0%, #10b981 100%);
        color: #ffffff;
      }
      .verdict.rejected {
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
        color: #ffffff;
      }
      .verdict.review {
        background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
        color: #ffffff;
      }
      .questions-list {
        margin-top: 20px;
      }
      .question-item {
        margin-bottom: 20px;
        padding: 20px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }
      .question-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e7eb;
      }
      .question-number {
        font-size: 14px;
        font-weight: 700;
        color: #1e40af;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
        padding: 8px 16px;
        border-radius: 6px;
      }
      .question-meta {
        display: flex;
        align-items: center;
        gap: 15px;
        font-size: 12px;
      }
      .question-category {
        background: #dbeafe;
        color: #0369a1;
        padding: 6px 12px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 11px;
        text-transform: uppercase;
      }
      .question-difficulty {
        background: #fef3c7;
        color: #92400e;
        padding: 6px 12px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 11px;
      }
      .question-text {
        font-size: 14px;
        color: #1f2937;
        flex: 1;
      }
      .question-status {
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 12px;
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
        margin-left: 10px;
      }
      .feedback {
        background: #ffffff;
        padding: 25px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-top: 20px;
        line-height: 1.8;
      }
      .feedback h3 {
        color: #1e40af;
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 15px 0;
      }
      .feedback-content {
        white-space: pre-wrap;
        color: #374151;
        font-size: 11px;
      }
      .footer {
        text-align: center;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
        color: #6b7280;
        font-size: 11px;
      }
      .footer p {
        margin: 5px 0;
      }
      .footer .disclaimer {
        margin-top: 15px;
        padding: 15px;
        background: #fef3c7;
        border: 1px solid #fbbf24;
        border-radius: 6px;
        font-size: 10px;
        color: #92400e;
      }
      .disclaimer strong {
        display: block;
        margin-bottom: 8px;
        font-size: 11px;
        color: #78350f;
      }
    </style>`;
    
    const body = document.createElement('body');
    body.innerHTML = `<div class="container">
      <div class="header">
        <div class="logo">LYCEUM ACADEMY</div>
        <div class="tagline">Mock Interview Assessment Report</div>
        <div class="report-info">
          <div class="info"><strong>Session ID:</strong> <span>${sessionId}</span></div>
          <div class="info"><strong>Attempt #:</strong> <span>#${attemptNumber}</span></div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Interview Information</h3>
        <div class="info-grid">
          <div class="info-item"><strong>Student Name:</strong> <span>${session.student_name || 'N/A'}</span></div>
          <div class="info-item"><strong>Visa Type:</strong> <span>${session.visa_type}</span></div>
          <div class="info-item"><strong>Mock Interview Date:</strong> <span>${new Date(session.session_date).toLocaleString()}</span></div>
          <div class="info-item"><strong>Overall Average:</strong> <span>${session.overall_average.toFixed(2)}/5.00</span></div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Performance Summary</h3>
        <div class="metrics">
          <div class="metric">
            <div class="metric-value">${session.questions_count || 0}</div>
            <div class="metric-label">Total Questions</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #059669;">${correctCount}</div>
            <div class="metric-label">Correct</div>
          </div>
          <div class="metric">
            <div class="metric-value" style="color: #dc2626;">${incorrectCount}</div>
            <div class="metric-label">Incorrect</div>
          </div>
          <div class="metric">
            <div class="metric-value">${session.questions_count > 0 ? ((correctCount / session.questions_count) * 100).toFixed(1) : 0}%</div>
            <div class="metric-label">Accuracy</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Final Verdict</h3>
        <div class="verdict ${session.verdict.toLowerCase()}">
          ${session.verdict}
        </div>
      </div>`;

    if (session.questions && session.questions.length > 0) {
      const questionsList = document.createElement('div');
      questionsList.className = 'questions-list';

      session.questions.forEach((q: any, index: number) => {
        const correctStatus = q.is_correct ? 'correct' : 'incorrect';
        const correctText = q.is_correct ? 'Student answered correctly' : 'Student needs to work on this';
        const diffClass = q.difficulty === 'easy' ? 'question-difficulty' : q.difficulty === 'medium' ? 'question-difficulty' : 'question-difficulty';
        
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        questionItem.innerHTML = `<div class="question-header">
            <div class="question-number">${index + 1}</div>
            <div class="question-meta">
              ${q.difficulty ? `<span class="${diffClass}">${q.difficulty}</span>` : ''}
            </div>
          </div>
          <div class="question-text">${q.question_text || 'No question text'}</div>
          <div class="question-status ${correctStatus}">
            ${q.is_correct ? '✓ Correct' : '✗ Incorrect'}
            <span>${correctText}</span>
          </div>
          ${q.notes ? `
          <div style="margin-top: 12px; padding: 15px; background: #f8fafc; border-radius: 6px; border: 1px solid #e5e7eb;">
            <strong style="color: #1e40af; display: block; margin-bottom: 4px;">Notes:</strong>
            <span style="color: #374151;">${q.notes}</span>
          </div>
          ` : ''}
        </div>`;
        
        questionsList.appendChild(questionItem);
      });

      const questionsSection = document.createElement('div');
      questionsSection.className = 'section';
      questionsSection.innerHTML = `<h3 class="section-title">Questions Asked (${session.questions.length})</h3>` + questionsList.outerHTML;
      body.appendChild(questionsSection);
    }

    if (session.ai_feedback) {
      const feedbackSection = document.createElement('div');
      feedbackSection.className = 'section';
      feedbackSection.innerHTML = `<h3 class="section-title">AI Feedback Report</h3>
        <div class="feedback">
          <div class="feedback-content">${session.ai_feedback}</div>
        </div>`;
      body.appendChild(feedbackSection);
    }

    const footer = document.createElement('div');
    footer.className = 'footer';
    footer.innerHTML = `<p><strong>Lyceum Academy</strong> - Mock Interview Assessment System</p>
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
      </div>`;
    body.appendChild(footer);

    html.appendChild(head);
    html.appendChild(body);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html.outerHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Mock Interview History
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {sessions.length} total sessions recorded
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <User size={14} className="inline mr-1" />
              Student
            </label>
            <select
              value={filter.studentId}
              onChange={(e) => setFilter({ ...filter, studentId: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all"
            >
              <option value="all">All Students</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <CheckCircle size={14} className="inline mr-1" />
              Visa Type
            </label>
            <select
              value={filter.visaType}
              onChange={(e) => setFilter({ ...filter, visaType: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all"
            >
              <option value="all">All Visa Types</option>
              <option value="F-1">F-1</option>
              <option value="F-2">F-2</option>
              <option value="F-3">F-3</option>
              <option value="J-1">J-1</option>
              <option value="J-2">J-2</option>
              <option value="B-1">B-1</option>
              <option value="B-2">B-2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <AlertCircle size={14} className="inline mr-1" />
              Verdict
            </label>
            <select
              value={filter.verdict}
              onChange={(e) => setFilter({ ...filter, verdict: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all"
            >
              <option value="all">All Verdicts</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Review Required">Review Required</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Showing</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{filteredSessions.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl p-12 border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <Clock size={40} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Sessions Found</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Adjust your filters or check back later
              </p>
            </div>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div key={session.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
              <div
                className={`p-6 cursor-pointer transition-all ${
                  expandedSession === session.id ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-purple-900/20 dark:to-pink-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {getVerdictIcon(session.verdict)}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                          Attempt #{session.attempt_number || 1}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white text-lg">
                          {session.id}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100">
                          <User size={16} />
                          {session.student_name || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={16} />
                          {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle size={16} />
                          {session.visa_type}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye size={16} />
                          {session.questions_count || 0} questions
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold">
                          Score: <span className={`text-lg ${session.overall_average >= 4 ? 'text-green-600' : session.overall_average >= 3 ? 'text-amber-600' : 'text-red-600'}`}>{session.overall_average.toFixed(2)}/5</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-5 py-2.5 rounded-2xl text-sm font-bold ${
                      session.verdict === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      session.verdict === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {session.verdict}
                    </div>
                    {expandedSession === session.id ? (
                      <ChevronUp size={24} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={24} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedSession === session.id && (
                <div className="p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl text-center shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase">Total</div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {session.questions_count}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">questions</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl text-center shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase">Correct</div>
                      <div className="text-3xl font-bold text-green-600">
                        {session.correct_count || 0}
                      </div>
                      <div className="text-xs text-green-600/60 mt-1 font-medium">
                        {session.questions_count > 0 ? ((session.correct_count || 0) / session.questions_count * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl text-center shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase">Incorrect</div>
                      <div className="text-3xl font-bold text-red-600">
                        {session.incorrect_count || 0}
                      </div>
                      <div className="text-xs text-red-600/60 mt-1 font-medium">
                        {session.questions_count > 0 ? ((session.incorrect_count || 0) / session.questions_count * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl text-center shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-semibold uppercase">Average</div>
                      <div className="text-3xl font-bold text-purple-600">
                        {session.overall_average.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">out of 5</div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Eye size={20} className="text-white" />
                      </div>
                      Questions Asked ({session.questions?.length || 0})
                    </h3>
                    <div className="space-y-4">
                      {session.questions?.map((q: any, index: number) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg shadow-md">
                              {index + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                {q.category || 'General'}
                              </span>
                              {q.difficulty && (
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${
                                  q.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                  q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                                  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                }`}>
                                  {q.difficulty}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-900 dark:text-gray-100 font-medium text-base leading-relaxed">
                            {q.question_text || 'No question text'}
                          </p>
                          {q.notes && (
                            <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                              <span className="font-semibold text-sm text-blue-600 dark:text-blue-400">Note:</span>{' '}
                              <span className="text-sm text-gray-700 dark:text-gray-300">{q.notes}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {session.ai_feedback && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <TrendingUp size={20} className="text-white" />
                        </div>
                        AI Feedback Report
                      </h3>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <div className="prose prose-sm dark:prose-invert text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                          {session.ai_feedback}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => downloadPDF(session)} className="flex items-center px-6 py-3 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-2xl font-semibold hover:shadow-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:-translate-y-1">
                      <Download size={20} className="mr-2" />
                      Download PDF Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SessionHistoryComponent;
