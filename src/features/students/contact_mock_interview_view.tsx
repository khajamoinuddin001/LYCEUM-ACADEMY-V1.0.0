import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, X, AlertCircle, ChevronDown, ChevronUp, Download, Plus } from '@/components/common/icons';
import type { Contact } from '@/types';

interface ContactMockInterviewViewProps {
  contact: Contact;
  user?: any;
  onNavigateBack: () => void;
  onNavigateToApps?: () => void;
}

interface MockSession {
  id: string;
  student_id: number;
  visa_type: string;
  session_date: string;
  overall_average: number;
  verdict: string;
  questions: any[];
  ai_feedback?: string;
  counsellor_override?: boolean;
  overall_comments?: string;
}

const ContactMockInterviewView: React.FC<ContactMockInterviewViewProps> = ({
  contact,
  user,
  onNavigateBack,
  onNavigateToApps
}) => {
  const [sessions, setSessions] = useState<MockSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    // Load mock sessions from contact metadata
    const mockSessions = (contact.metadata?.mockInterviewSessions || []) as MockSession[];
    // Sort by date descending
    mockSessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
    setSessions(mockSessions);
  }, [contact]);

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

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Mock Interview Report - ${session.id}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
    .header h1 { color: #1e40af; margin: 0; }
    .header p { color: #666; margin: 5px 0; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
    .info-item { }
    .info-item strong { color: #1e40af; }
    .verdict { text-align: center; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .verdict.approved { background: #d1fae5; color: #065f46; }
    .verdict.rejected { background: #fee2e2; color: #991b1b; }
    .verdict.review { background: #fef3c7; color: #92400e; }
    .feedback { background: #f9fafb; padding: 20px; border-radius: 10px; border-left: 4px solid #1e40af; }
    .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
    .disclaimer { margin-top: 20px; padding: 20px; background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; font-size: 10px; color: #92400e; line-height: 1.7; }
    .disclaimer strong { display: block; margin-bottom: 8px; font-size: 11px; color: #78350f; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Lyceum Academy</h1>
    <p>Mock Interview Report</p>
    <p><strong>Session ID:</strong> ${session.id}</p>
  </div>

  <div class="section">
    <h2>Interview Information</h2>
    <div class="info-grid">
      <div class="info-item"><strong>Student Name:</strong> ${contact.name}</div>
      <div class="info-item"><strong>Visa Type:</strong> ${session.visa_type}</div>
      <div class="info-item"><strong>Mock Interview Date:</strong> ${new Date(session.session_date).toLocaleString()}</div>
      <div class="info-item"><strong>Overall Average:</strong> ${session.overall_average.toFixed(2)}/5.00</div>
    </div>
  </div>

  <div class="section">
    <h2>Performance Summary</h2>
    <div class="info-grid">
      <div class="info-item"><strong>Total Questions:</strong> ${session.questions?.length || 0}</div>
      <div class="info-item"><strong>Correct Answers:</strong> ${correctCount}</div>
      <div class="info-item"><strong>Incorrect Answers:</strong> ${incorrectCount}</div>
      <div class="info-item"><strong>Accuracy:</strong> ${session.questions?.length > 0 ? ((correctCount / session.questions.length) * 100).toFixed(1) : 0}%</div>
    </div>
  </div>

  <div class="section">
    <div class="verdict ${session.verdict.toLowerCase()}">
      <h2 style="margin: 0 0 10px 0;">${session.verdict}</h2>
    </div>
  </div>

  ${session.ai_feedback ? `
  <div class="section">
    <h2>AI Feedback Report</h2>
    <div class="feedback">
      ${session.ai_feedback.replace(/\n/g, '<br>')}
    </div>
  </div>
  ` : ''}

  ${session.overall_comments ? `
  <div class="section">
    <h2>Overall Comments</h2>
    <div class="feedback">
      ${session.overall_comments.replace(/\n/g, '<br>')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated on ${new Date().toLocaleString()} | Lyceum Academy Mock Interview System</p>
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
</body>
</html>`;

    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mock_Interview_${session.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Also try to open print dialog
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }
    }, 100);
  };


  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={onNavigateBack}
            className="text-lyceum-blue hover:text-blue-700 font-medium mb-2"
          >
            ← Back to Contact
          </button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Mock Interviews - {contact.name}
          </h1>
        </div>
        <button
          onClick={onNavigateToApps}
          className="flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          New Mock Interview
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No mock interview sessions found for {contact.name}.
            </p>
            <button
              onClick={onNavigateToApps}
              className="flex items-center justify-center px-6 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus size={20} className="mr-2" />
              Conduct First Mock Interview
            </button>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              {/* Session Header */}
              <div
                className="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {getVerdictIcon(session.verdict)}
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800 dark:text-gray-100">
                          {session.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(session.session_date).toLocaleString()}
                        </span>
                        <span>
                          {session.visa_type}
                        </span>
                        <span>
                          Score: {session.overall_average.toFixed(2)}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getVerdictColor(session.verdict)}`}>
                      {session.verdict}
                    </div>
                    {expandedSession === session.id ? (
                      <ChevronUp size={20} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSession === session.id && (
                <div className="p-6 bg-gray-50 dark:bg-gray-900">
                  {/* Question-wise breakdown */}
                  {session.questions && session.questions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                        Question-wise Performance
                      </h3>
                      <div className="space-y-2">
                        {session.questions.map((q: any, index: number) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-500">
                                    Q{index + 1}
                                  </span>
                                  <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                    {q.category}
                                  </span>
                                  {q.is_correct !== undefined && (
                                    <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                                      q.is_correct
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    }`}>
                                      {q.is_correct ? '✓ Correct' : '✗ Incorrect'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-800 dark:text-gray-100">
                                  {q.question_text}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                  {q.scores ? ((q.scores.context + q.scores.body_language + q.scores.fluency + q.scores.grammar) / 4).toFixed(1) : '-'}/5
                                </div>
                              </div>
                            </div>
                            {q.notes && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                  "{q.notes}"
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Feedback */}
                  {session.ai_feedback && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                        AI Feedback Report
                      </h3>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                        <div className="prose prose-sm dark:prose-invert text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {session.ai_feedback}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Overall Comments */}
                  {session.overall_comments && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                        Overall Comments
                      </h3>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300">
                          {session.overall_comments}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => downloadPDF(session)}
                      className="flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download size={16} className="mr-2" />
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

export default ContactMockInterviewView;
