import React, { useState, useEffect } from 'react';
import { Plus, Check, ArrowRight, X, RefreshCw, Clock, Target, User, BookOpen, Trophy, ChevronRight, ChevronLeft, ChevronDown, AlertCircle, CheckCircle, TrendingUp, Layout } from '@/components/common/icons';
import type { InterviewSession, QuestionWithScores, VisaType, Question, MockInterviewSession, QuestionTemplate } from './types';
import { MOCK_INTERVIEW_VISA_TYPES, DEFAULT_QUESTION_SCORES, calculateAverageScores, calculateOverallAverage, calculateVerdict } from './constants';
import type { Contact } from '@/types';

interface NewSessionProps {
  contacts: Contact[];
  onSave?: (session: MockInterviewSession) => Promise<void>;
}

const StepIndicator: React.FC<{ current: string; total: number }> = ({ current, total }) => {
  const steps = ['student', 'questions', 'marking', 'scoring', 'verdict'];
  const currentIndex = steps.indexOf(current);

  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-2 md:gap-4">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  index <= currentIndex
                    ? 'bg-gradient-to-r from-lyceum-blue to-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <span className={`hidden md:block mt-2 text-xs font-medium ${
                index <= currentIndex ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
              }`}>
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight size={20} className={`${
                index < currentIndex ? 'text-purple-500' : 'text-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const NewSession: React.FC<NewSessionProps> = ({ contacts, onSave }) => {
  const [step, setStep] = useState<'student' | 'questions' | 'marking' | 'scoring' | 'verdict'>('student');
  const [formData, setFormData] = useState<Partial<InterviewSession>>({
    visa_type: 'F-1',
    session_notes: ''
  });
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [questionResponses, setQuestionResponses] = useState<QuestionWithScores[]>([]);
  const [overallScores, setOverallScores] = useState({
    context: 3,
    body_language: 3,
    fluency: 3,
    grammar: 3
  });
  const [calculatedAverages, setCalculatedAverages] = useState<{
    context: number;
    body_language: number;
    fluency: number;
    grammar: number;
  } | null>(null);
  const [calculatedVerdict, setCalculatedVerdict] = useState<{
    verdict: 'Approved' | 'Rejected' | 'Review Required';
    suggested: string;
  } | null>(null);
  const [overallComments, setOverallComments] = useState('');
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [finalVerdict, setFinalVerdict] = useState<'Approved' | 'Rejected' | 'Review Required' | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [questionMode, setQuestionMode] = useState<'individual' | 'template'>('individual');
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplate | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Contact[]>(contacts);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);

  const generateSessionId = (): string => {
    const existingSessions = contacts.flatMap(c =>
      (c.metadata?.mockInterviewSessions || []).map((s: any) => s.id)
    );
    const maxId = existingSessions
      .map(id => parseInt(id?.replace('MCK-', '') || '0', 10))
      .reduce((max, id) => Math.max(max, id), 0);
    return `MCK-${String(maxId + 1).padStart(6, '0')}`;
  };

  useEffect(() => {
    const savedQuestions = localStorage.getItem('mockInterviewQuestions');
    const questions = savedQuestions ? JSON.parse(savedQuestions) : [
      { id: '1', question_text: 'Why did you choose this university?', category: 'Study', difficulty: 'easy' },
      { id: '2', question_text: 'How will you fund your education?', category: 'Finances', difficulty: 'medium' },
      { id: '3', question_text: 'Do you have family in US?', category: 'Ties', difficulty: 'hard' },
      { id: '4', question_text: 'What will you do after graduation?', category: 'Post-Graduation Plans', difficulty: 'medium' },
      { id: '5', question_text: 'Tell me about your family.', category: 'General', difficulty: 'easy' },
    ];
    setAvailableQuestions(questions);
  }, []);

  useEffect(() => {
    if (selectedContact?.visaType) {
      setFormData(prev => ({ ...prev, visa_type: selectedContact.visaType as VisaType }));
    }
  }, [selectedContact]);

  useEffect(() => {
    if (studentSearch.trim() === '') {
      setFilteredStudents(contacts);
    } else {
      const searchLower = studentSearch.toLowerCase();
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.phone?.toLowerCase().includes(searchLower)
      );
      setFilteredStudents(filtered);
    }
  }, [studentSearch, contacts]);

  useEffect(() => {
    if (step === 'scoring' && questionResponses.length > 0) {
      try {
        const correctResponses = questionResponses.filter(q => q.is_correct === true);
        if (correctResponses.length > 0) {
          const mockScores = correctResponses.map(q => ({
            ...q,
            scores: overallScores
          }));
          const averages = calculateAverageScores(mockScores);
          setCalculatedAverages(averages);
          const overall = calculateOverallAverage(averages);
          setCalculatedVerdict(calculateVerdict(overall));
        } else {
          const zeroScores = {
            context: 0,
            body_language: 0,
            fluency: 0,
            grammar: 0
          };
          setCalculatedAverages(zeroScores);
          setCalculatedVerdict(calculateVerdict(0));
        }
      } catch (error) {
        console.error('Error calculating averages:', error);
        // Set default values on error
        setCalculatedAverages({
          context: 3,
          body_language: 3,
          fluency: 3,
          grammar: 3
        });
        setCalculatedVerdict(calculateVerdict(3));
      }
    }
  }, [questionResponses, overallScores, step]);

  useEffect(() => {
    const savedTemplates = localStorage.getItem('mockInterviewTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const generateAIFeedback = async (responses: QuestionWithScores[], averages: any, verdict: any) => {
    setGeneratingFeedback(true);
    try {
      const OPENROUTER_API_KEY = localStorage.getItem('openrouter_api_key') || 'sk-or-v1-5e2a4a2a-3d1d-4a8d-9b1e-6c2f3d4a5e6c';
      const correctCount = responses.filter(q => q.is_correct === true).length;
      const incorrectCount = responses.filter(q => q.is_correct === false).length;
      const accuracy = responses.length > 0 ? ((correctCount / responses.length) * 100).toFixed(1) : 0;

      const prompt = `You are an expert US visa interview coach. Based on the following mock interview results, provide a detailed, comprehensive feedback report in a professional tone.

Student Performance Summary:
- Total Questions: ${responses.length}
- Correct Answers: ${correctCount}
- Incorrect Answers: ${incorrectCount}
- Accuracy: ${accuracy}%

Overall Scores (1-5 scale, only correct answers considered):
- Context: ${averages.context}/5
- Body Language: ${averages.body_language}/5
- Fluency: ${averages.fluency}/5
- Grammar: ${averages.grammar}/5
- Overall Average: ${calculateOverallAverage(averages)}/5
- Verdict: ${verdict.verdict}

Question-wise Responses:
${responses.filter(q => q.is_correct === true).map((q, i) => `
Q${i + 1}: ${q.question_text}
- Category: ${q.category}
- Status: CORRECT
${q.notes ? `- Notes: ${q.notes}` : ''}
`).join('\n')}

${responses.filter(q => q.is_correct === false).map((q, i) => `
Q${i + 1}: ${q.question_text}
- Category: ${q.category}
- Status: INCORRECT
${q.notes ? `- Notes: ${q.notes}` : ''}
`).join('\n')}

Please provide a DETAILED and COMPREHENSIVE feedback report with the following sections (each should be 2-3 paragraphs minimum):

1. **EXECUTIVE SUMMARY** - Overall assessment of the student's interview performance in 2-3 paragraphs

2. **STRENGTHS AND POSITIVES** (200+ words minimum)
   - Detail all strengths demonstrated in the interview
   - For correct answers, explain WHAT was good and WHY it was effective
   - Highlight specific areas where the student excelled
   - Mention positive communication patterns, confidence levels, appropriate responses

3. **AREAS NEEDING IMPROVEMENT** (200+ words minimum)
   - For EACH incorrect answer, provide specific analysis:
     * What went wrong?
     * Why was the answer problematic?
     * What should have been said instead?
   - Identify patterns in mistakes
   - Discuss issues with any weak metrics

4. **DETAILED METRIC ANALYSIS** (150+ words minimum)
   - **Context Score (${averages.context}/5)**: Detailed analysis of how well the student understood and answered the questions, their ability to stay on topic
   - **Body Language Score (${averages.body_language}/5)**: Detailed analysis of posture, eye contact, gestures, facial expressions, confidence projection
   - **Fluency Score (${averages.fluency}/5)**: Detailed analysis of speech flow, pace, hesitations, filler words, natural conversation rhythm
   - **Grammar & Vocabulary Score (${averages.grammar}/5)**: Detailed analysis of sentence structure, grammar accuracy, vocabulary range, word choice, pronunciation

5. **SPECIFIC RECOMMENDATIONS** (200+ words minimum)
   - Provide 5-7 specific, actionable recommendations
   - Each recommendation should be detailed and explain HOW to implement it
   - Include practice exercises or techniques for each recommendation
   - Address specific weak areas identified

6. **INTERVIEW PREPARATION ROADMAP** (150+ words minimum)
   - Create a structured 30-day improvement plan
   - Week-by-week goals and focus areas
   - Specific practice routines and exercises
   - Resources or materials to use
   - Milestones to track progress

7. **KEY AREAS TO FOCUS** (100+ words minimum)
   - Top 3 priority areas to work on
   - For each priority area, explain why it's critical and how improving it will impact visa interview success

8. **CONFIDENCE AND MINDSET** (100+ words minimum)
   - Assess the student's confidence level during the interview
   - Provide mindset tips and mental preparation strategies
   - Suggestions for managing interview anxiety
   - Building self-assurance and positive attitude

Make the feedback report comprehensive, specific, actionable, and encouraging. Use professional tone throughout. Include concrete examples and specific guidance wherever possible.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'Lyceum Academy Mock Interview',
        },
        body: JSON.stringify({
          model: 'openrouter/stepfun/step-3.5-flash:free',
          messages: [
            { role: 'system', content: 'You are an expert US visa interview coach providing detailed, actionable feedback.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const feedback = data.choices?.[0]?.message?.content || 'Unable to generate feedback. Please try again.';
      setAiFeedback(feedback);
      return feedback;
    } catch (error) {
      console.error('AI Feedback generation error:', error);
      const fallbackFeedback = `Based on interview performance:

Overall Score: ${calculateOverallAverage(calculatedAverages)}/5
Verdict: ${calculatedVerdict.verdict}

Performance Summary:
- Total Questions: ${questionResponses.length}
- Correct: ${questionResponses.filter(q => q.is_correct === true).length}
- Incorrect: ${questionResponses.filter(q => q.is_correct === false).length}
- Accuracy: ${questionResponses.length > 0 ? (((questionResponses.filter(q => q.is_correct === true).length) / questionResponses.length) * 100).toFixed(1) : 0}%

Strengths:
${Object.entries(calculatedAverages)
  .filter(([_, value]) => value >= 4)
  .map(([key, _]) => `- ${key.replace('_', ' ')}: Strong performance`)
  .join('\\n') || 'None identified - scores are below 4 in all categories'}

Areas for Improvement:
${Object.entries(calculatedAverages)
  .filter(([_, value]) => value < 3)
  .map(([key, value]) => `- ${key.replace('_', ' ')}: ${value}/5 - Needs focus`)
  .join('\\n') || 'Overall good performance across all categories'}

Recommendations:
${Object.entries(calculatedAverages)
  .map(([key, value]) => {
    if (value < 3) return `- Practice ${key.replace('_', ' ')} to improve from ${value}/5`;
    if (value < 4) return `- Continue working on ${key.replace('_', ' ')} to reach 4+/5`;
    return '';
  })
  .filter(Boolean)
  .join('\\n') || '- Maintain current level of preparation'}`;
      setAiFeedback(fallbackFeedback);
      return fallbackFeedback;
    } finally {
      setGeneratingFeedback(false);
    }
  };

  const handleAddQuestion = (question: Question) => {
    if (selectedQuestions.find(q => q.id === question.id)) {
      return;
    }
    setSelectedQuestions([...selectedQuestions, question]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newSelected = selectedQuestions.filter((_, i) => i !== index);
    setSelectedQuestions(newSelected);
  };

  const handleSelectTemplate = (template: QuestionTemplate) => {
    setSelectedTemplate(template);
    setSelectedQuestions([...template.questions]);
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
    setSelectedQuestions([]);
  };

  const handleCorrectIncorrectChange = (index: number, is_correct: boolean) => {
    const newResponses = [...questionResponses];
    const question = selectedQuestions[index];

    if (question) {
      const existingIndex = newResponses.findIndex(r => r.question_text === question.question_text);

      if (existingIndex !== -1) {
        newResponses[existingIndex] = {
          ...newResponses[existingIndex],
          is_correct,
          category: question.category,
          difficulty: question.difficulty,
          scores: { ...DEFAULT_QUESTION_SCORES }
        };
      } else {
        newResponses.push({
          ...question,
          is_correct,
          notes: '',
          scores: { ...DEFAULT_QUESTION_SCORES }
        });
      }

      setQuestionResponses(newResponses);
    }
  };

  const handleNoteChange = (index: number, note: string) => {
    const newResponses = [...questionResponses];
    newResponses[index] = {
      ...newResponses[index],
      notes: note
    };
    setQuestionResponses(newResponses);
  };

  const handleOverallScoreChange = (field: keyof typeof overallScores, value: number) => {
    setOverallScores({
      ...overallScores,
      [field]: value
    });
  };

  const handleSave = async () => {
    if (!selectedContact || questionResponses.length === 0) {
      alert('Please select a student and add at least one question');
      return;
    }

    // Check if review required and no final verdict set
    if (calculatedVerdict?.verdict === 'Review Required' && !finalVerdict) {
      setShowApprovalModal(true);
      return;
    }

    const finalFeedback = aiFeedback || await generateAIFeedback(questionResponses, calculatedAverages, calculatedVerdict);

    const correctResponses = questionResponses.filter(q => q.is_correct === true);
    const mockScores = correctResponses.map(q => ({
      ...q,
      scores: overallScores
    }));

    const averages = calculateAverageScores(mockScores);

    const questionsCount = questionResponses.length;
    const correctCount = questionResponses.filter(q => q.is_correct === true).length;
    const incorrectCount = questionResponses.filter(q => q.is_correct === false).length;

    const session: MockInterviewSession = {
      id: generateSessionId(),
      student_id: selectedContact.id,
      visa_type: formData.visa_type || 'F-1',
      session_date: new Date().toISOString(),
      counsellor_id: 1,
      session_notes: formData.session_notes,
      questions: questionResponses,
      questions_count: questionsCount,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      average_scores: averages,
      overall_average: calculateOverallAverage(averages),
      verdict: finalVerdict || calculatedVerdict?.verdict,
      overall_comments: overallComments || calculatedVerdict?.suggested,
      ai_feedback: finalFeedback,
      created_at: new Date().toISOString()
    };

    await onSave?.(session);
    alert(`Session ${session.id} saved successfully with verdict: ${session.verdict}`);
  };

  const handleAddAdhocQuestion = () => {
    const questionText = prompt('Enter question text:');
    if (questionText) {
      const newQuestion = {
        question_text: questionText,
        category: 'General',
        difficulty: 'medium' as const
      };
      setSelectedQuestions([...selectedQuestions, newQuestion]);
    }
  };

  const resetForm = () => {
    setFormData({ visa_type: 'F-1', session_notes: '' });
    setSelectedContact(null);
    setSelectedQuestions([]);
    setQuestionResponses([]);
    setOverallScores({ context: 3, body_language: 3, fluency: 3, grammar: 3 });
    setCalculatedAverages(null);
    setCalculatedVerdict(null);
    setOverallComments('');
    setAiFeedback('');
    setGeneratingFeedback(false);
    setFinalVerdict(null);
    setShowApprovalModal(false);
    setStep('student');
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    if (score >= 3) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Approved': return 'bg-green-500 text-white';
      case 'Rejected': return 'bg-red-500 text-white';
      case 'Review Required': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const moveToVerdict = async () => {
    setStep('verdict');
    setFinalVerdict(null);

    // If using template, initialize questionResponses from template
    if (questionMode === 'template' && selectedTemplate && questionResponses.length === 0) {
      const templateResponses = selectedTemplate.questions.map(q => ({
        ...q,
        scores: { ...DEFAULT_QUESTION_SCORES },
        notes: '',
        is_correct: undefined
      }));
      setQuestionResponses(templateResponses);
    }

    if (!aiFeedback && calculatedAverages && calculatedVerdict) {
      await generateAIFeedback(questionResponses, calculatedAverages, calculatedVerdict);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          New Mock Interview Session
        </h1>
        <button
          onClick={resetForm}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
        >
          <X size={24} />
        </button>
      </div>

      {/* Progress Steps */}
      <StepIndicator current={step} total={5} />

      {/* Step 1: Student Selection */}
      {step === 'student' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Student</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Student <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div
                  onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                  className={`w-full px-4 py-3 border-2 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                    selectedContact
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  {selectedContact ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedContact.name}
                      </span>
                      {selectedContact.email && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({selectedContact.email})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">
                      Search and select a student...
                    </span>
                  )}
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 dark:text-gray-400 transition-transform ${
                      showStudentDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {showStudentDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-600 max-h-80 overflow-y-auto">
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search students..."
                      className="w-full px-4 py-3 border-b-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-purple-500 dark:bg-transparent dark:text-gray-100 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    {filteredStudents.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No students found
                      </div>
                    ) : (
                      <div className="py-2">
                        {filteredStudents.map(contact => (
                          <div
                            key={contact.id}
                            onClick={() => {
                              setSelectedContact(contact);
                              setStudentSearch(contact.name);
                              setShowStudentDropdown(false);
                            }}
                            className={`px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-colors ${
                              selectedContact?.id === contact.id
                                ? 'bg-purple-100 dark:bg-purple-900/40'
                                : ''
                            }`}
                          >
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {contact.name}
                            </div>
                            {contact.email && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {contact.email}
                              </div>
                            )}
                            {contact.phone && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Visa Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.visa_type}
                onChange={(e) => setFormData({ ...formData, visa_type: e.target.value as VisaType })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all"
                required
              >
                {MOCK_INTERVIEW_VISA_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {selectedContact?.visaType && (
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                  <Check size={12} />
                  Auto-filled from profile: {selectedContact.visaType}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Session Notes (Optional)
            </label>
            <textarea
              value={formData.session_notes}
              onChange={(e) => setFormData({ ...formData, session_notes: e.target.value })}
              rows={4}
              placeholder="Any notes for this interview session..."
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={() => setStep('questions')}
              disabled={!selectedContact}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-2xl font-semibold hover:shadow-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Select Questions
              <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Question Selection */}
      {step === 'questions' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Questions</h2>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <button
              onClick={() => {
                setQuestionMode('individual');
                setSelectedTemplate(null);
              }}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                questionMode === 'individual'
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Individual Questions
            </button>
            <button
              onClick={() => {
                setQuestionMode('template');
              }}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                questionMode === 'template'
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Templates
            </button>
          </div>

          {/* Template Selection */}
          {questionMode === 'template' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Layout size={18} className="text-purple-500" />
                Available Templates ({templates.length})
              </h3>
              {templates.length === 0 ? (
                <div className="p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border-2 border-yellow-200 dark:border-yellow-700 text-center">
                  <AlertCircle size={48} className="mx-auto mb-3 text-yellow-500 dark:text-yellow-400" />
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    No templates available
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Go to Question Bank to create templates first
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                        selectedTemplate?.id === template.id
                          ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:shadow-lg dark:hover:border-purple-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                          template.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          template.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {template.difficulty}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {template.questions.length} questions
                        </span>
                        {selectedTemplate?.id === template.id && (
                          <Check size={16} className="text-purple-500 ml-auto" />
                        )}
                      </div>
                      <h4 className="text-gray-900 dark:text-white font-bold text-base mb-2">
                        {template.name}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                        {template.description || 'No description'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.visa_types.slice(0, 2).map((visa, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                            {visa}
                          </span>
                        ))}
                        {template.visa_types.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                            +{template.visa_types.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTemplate && (
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Check size={18} className="text-blue-500" />
                        Template: {selectedTemplate.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {selectedTemplate.questions.length} questions selected
                      </p>
                    </div>
                    <button
                      onClick={handleClearTemplate}
                      className="flex items-center gap-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      <X size={16} />
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedTemplate.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-sm text-gray-800 dark:text-gray-100 font-medium line-clamp-2">
                            {question.question_text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Individual Questions Selection */}
          {questionMode === 'individual' && (

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Target size={18} className="text-purple-500" />
              Available Questions ({availableQuestions.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
              {availableQuestions.map(question => (
                <div
                  key={question.id}
                  onClick={() => !selectedQuestions.find(q => q.id === question.id) && handleAddQuestion(question)}
                  className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                    selectedQuestions.find(q => q.id === question.id)
                      ? 'border-purple-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:shadow-lg dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {question.category}
                    </span>
                    {question.difficulty && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        question.difficulty === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {question.difficulty}
                      </span>
                    )}
                    {selectedQuestions.find(q => q.id === question.id) && (
                      <Check size={16} className="text-purple-500 ml-auto" />
                    )}
                  </div>
                  <p className="text-gray-800 dark:text-gray-100 font-medium text-sm leading-relaxed">
                    {question.question_text}
                  </p>
                </div>
              ))}
            </div>
          </div>
          )}

          {selectedQuestions.length > 0 && (
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Check size={18} className="text-purple-500" />
                  Selected Questions ({selectedQuestions.length})
                </h3>
                <button
                  onClick={() => setSelectedQuestions([])}
                  className="flex items-center gap-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                >
                  <X size={16} />
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-lyceum-blue to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm text-gray-800 dark:text-gray-100 font-medium line-clamp-2">
                        {question.question_text}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveQuestion(index)}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
            <button
              onClick={() => setStep('student')}
              className="flex items-center justify-center px-6 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100 transition-all"
            >
              <ChevronLeft size={18} className="mr-2" />
              Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleAddAdhocQuestion}
                className="flex items-center px-5 py-3 border-2 border-dashed border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 rounded-2xl font-semibold hover:border-purple-500 dark:hover:border-purple-400 transition-all"
              >
                <Plus size={18} className="mr-2" />
                Add Custom Question
              </button>
              <button
                onClick={() => {
                  const initialResponses = selectedQuestions.map(q => ({
                    ...q,
                    scores: { ...DEFAULT_QUESTION_SCORES },
                    notes: '',
                    is_correct: undefined
                  }));
                  setQuestionResponses(initialResponses);
                  setStep('marking');
                }}
                disabled={selectedQuestions.length === 0}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-2xl font-semibold hover:shadow-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                Mark Responses
                <ArrowRight size={20} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Mark Correct/Incorrect */}
      {step === 'marking' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mark Question Responses</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {questionResponses.length}/{selectedQuestions.length} questions marked
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {selectedQuestions.map((question, index) => {
              const response = questionResponses.find(r => r.question_text === question.question_text);
              const isMarked = response !== undefined;

              return (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    isMarked
                      ? 'border-purple-300 dark:border-purple-600 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {question.category}
                        </span>
                        {question.difficulty && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                            question.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            question.difficulty === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {question.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 dark:text-gray-100 font-medium text-base leading-relaxed pl-13">
                        {question.question_text}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Student Response:
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleCorrectIncorrectChange(index, true)}
                        className={`flex items-center justify-center py-4 px-6 rounded-xl border-2 font-bold transition-all duration-300 ${
                          response?.is_correct === true
                            ? 'border-green-500 bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg scale-105'
                            : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 dark:text-gray-100'
                        }`}
                      >
                        <Check size={20} className="mr-2" />
                        Correct
                      </button>
                      <button
                        onClick={() => handleCorrectIncorrectChange(index, false)}
                        className={`flex items-center justify-center py-4 px-6 rounded-xl border-2 font-bold transition-all duration-300 ${
                          response?.is_correct === false
                            ? 'border-red-500 bg-gradient-to-br from-red-400 to-rose-500 text-white shadow-lg scale-105'
                            : 'border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-600 dark:text-gray-100'
                        }`}
                      >
                        <X size={20} className="mr-2" />
                        Incorrect
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={response?.notes || ''}
                      onChange={(e) => {
                        if (isMarked) {
                          handleNoteChange(questionResponses.findIndex(r => r.question_text === question.question_text), e.target.value);
                        }
                      }}
                      rows={3}
                      placeholder="Feedback for this question..."
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all resize-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {questionResponses.length > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Clock size={18} className="text-purple-500" />
                    Progress
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Marked: {questionResponses.length} / {selectedQuestions.length} questions
                  </p>
                </div>
                <div className="flex gap-6 text-center">
                  <div className="px-6 py-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {questionResponses.filter(q => q.is_correct === true).length}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300 font-medium">Correct</div>
                  </div>
                  <div className="px-6 py-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {questionResponses.filter(q => q.is_correct === false).length}
                    </div>
                    <div className="text-xs text-red-700 dark:text-red-300 font-medium">Incorrect</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
            <button
              onClick={() => setStep('questions')}
              className="flex items-center justify-center px-6 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100 transition-all"
            >
              <ChevronLeft size={18} className="mr-2" />
              Back
            </button>
            <button
              onClick={() => setStep('scoring')}
              disabled={questionResponses.length === 0}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-2xl font-semibold hover:shadow-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Score Overall
              <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Overall Scoring */}
      {step === 'scoring' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Score Overall Performance</h2>
          </div>

          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  Session Summary
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total: {questionResponses.length} questions | 
                  <span className="text-green-600 font-semibold ml-1">Correct: {questionResponses.filter(q => q.is_correct === true).length}</span> | 
                  <span className="text-red-600 font-semibold ml-1">Incorrect: {questionResponses.filter(q => q.is_correct === false).length}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  * Only correct answers are scored
                </p>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-4xl font-bold bg-gradient-to-r from-lyceum-blue to-blue-600 bg-clip-text text-transparent">
                  {questionResponses.filter(q => q.is_correct === true).length} / {questionResponses.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Correct
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <Target size={18} className="text-purple-500" />
              Score Criteria (1-5 Scale)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'context', label: 'Context', icon: BookOpen, color: 'blue' },
                { key: 'body_language', label: 'Body Language', icon: User, color: 'green' },
                { key: 'fluency', label: 'Fluency', icon: Clock, color: 'amber' },
                { key: 'grammar', label: 'Grammar & Vocabulary', icon: Check, color: 'purple' }
              ].map((field) => (
                <div key={field.key} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-${field.color}-100 dark:bg-${field.color}-900/30 flex items-center justify-center`}>
                      <field.icon size={20} className={`text-${field.color}-600 dark:text-${field.color}-400`} />
                    </div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {field.label}
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={overallScores[field.key as any]}
                      onChange={(e) => handleOverallScoreChange(field.key as any, parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className={`text-3xl font-bold px-4 py-2 rounded-xl ${getScoreColor(overallScores[field.key as any])}`}>
                      {overallScores[field.key as any]}
                    </div>
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                      /5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {calculatedAverages && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-bold mb-6 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <TrendingUp size={18} className="text-purple-500" />
                Calculated Averages
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(calculatedAverages).map(([key, value]) => (
                  <div key={key} className="bg-white dark:bg-gray-800 p-4 rounded-xl text-center shadow-sm">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase">
                      {key.replace('_', ' ')}
                    </div>
                    <div className={`text-3xl font-bold py-3 rounded-lg ${getScoreColor(Number(value))}`}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              {calculatedVerdict && (
                <div className="text-center">
                  <div className={`inline-block px-8 py-4 rounded-2xl shadow-lg ${getVerdictColor(calculatedVerdict.verdict)}`}>
                    <div className="text-xl font-bold">
                      Overall: {calculateOverallAverage(calculatedAverages)}/5 - {calculatedVerdict.verdict}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
            <button
              onClick={() => setStep('marking')}
              className="flex items-center justify-center px-6 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100 transition-all"
            >
              <ChevronLeft size={18} className="mr-2" />
              Back
            </button>
            <button
              onClick={moveToVerdict}
              disabled={!calculatedAverages}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-2xl font-semibold hover:shadow-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Review & Submit
              <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Verdict & Submit */}
      {step === 'verdict' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Trophy size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review & Submit Session</h2>
          </div>

          {calculatedVerdict && (
            <div className="mb-8">
              <div className={`p-6 rounded-2xl text-center shadow-lg ${
                (finalVerdict || calculatedVerdict.verdict) === 'Approved' ?
                  'bg-gradient-to-br from-green-400 to-emerald-500' :
                  (finalVerdict || calculatedVerdict.verdict) === 'Rejected' ?
                  'bg-gradient-to-br from-red-400 to-rose-500' :
                  'bg-gradient-to-br from-amber-400 to-orange-500'
              }`}>
                <div className="text-3xl font-bold text-white mb-2">
                  {finalVerdict || calculatedVerdict.verdict}
                  {finalVerdict && calculatedVerdict.verdict === 'Review Required' && (
                    <div className="text-sm text-white/80 mt-2 font-normal">
                      (Override from: Review Required)
                    </div>
                  )}
                </div>
                <div className="text-sm text-white/90">
                  {calculatedVerdict.suggested}
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Overall Average:{' '}
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {calculateOverallAverage(calculatedAverages)}/5
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <TrendingUp size={16} className="text-purple-500" />
                AI Feedback Report
              </label>
              {generatingFeedback && (
                <span className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Generating...
                </span>
              )}
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-600">
              <textarea
                value={aiFeedback}
                onChange={(e) => setAiFeedback(e.target.value)}
                rows={14}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 text-sm leading-relaxed resize-none"
                placeholder="AI feedback will appear here..."
              />
            </div>
          </div>

          {/* Manual Approval Section - Only show if Review Required */}
          {calculatedVerdict?.verdict === 'Review Required' && !finalVerdict && (
            <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-700">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={24} className="text-amber-600 dark:text-amber-400" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Final Approval Required
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    System requires manual review. Please review all details above and provide final verdict.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFinalVerdict('Approved')}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:from-green-500 hover:to-emerald-600 transition-all duration-300 hover:-translate-y-1"
                >
                  <CheckCircle size={24} />
                  Approve Student
                </button>
                <button
                  onClick={() => setFinalVerdict('Rejected')}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-red-400 to-rose-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:from-red-500 hover:to-rose-600 transition-all duration-300 hover:-translate-y-1"
                >
                  <X size={24} />
                  Reject Student
                </button>
              </div>
            </div>
          )}

          {/* Override Section - Only show if verdict not Review Required or after manual approval */}
          {(calculatedVerdict?.verdict !== 'Review Required' || finalVerdict) && (
            <div className="mb-6">
              <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Override Final Verdict
                </span>
              </label>
            </div>
          )}

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Overall Comments
            </label>
            <textarea
              value={overallComments}
              onChange={(e) => setOverallComments(e.target.value)}
              rows={5}
              placeholder="Final comments for interview session..."
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
            <button
              onClick={() => setStep('scoring')}
              className="flex items-center justify-center px-6 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100 transition-all"
            >
              <ChevronLeft size={18} className="mr-2" />
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={generatingFeedback || (calculatedVerdict?.verdict === 'Review Required' && !finalVerdict)}
              className={`flex items-center px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
                calculatedVerdict?.verdict === 'Review Required' && !finalVerdict
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-2xl hover:from-amber-600 hover:to-orange-600'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-2xl hover:from-green-600 hover:to-emerald-600'
              }`}
            >
              {calculatedVerdict?.verdict === 'Review Required' && !finalVerdict ? (
                <>
                  <AlertCircle size={22} className="mr-2" />
                  Final Decision Required
                </>
              ) : (
                <>
                  <Check size={22} className="mr-2" />
                  Save Session
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-gray-100 dark:border-gray-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <AlertCircle size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Final Decision Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                The system marked this as "Review Required". Please make a final decision.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => {
                  setFinalVerdict('Approved');
                  setShowApprovalModal(false);
                }}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:from-green-500 hover:to-emerald-600 transition-all duration-300 hover:-translate-y-1"
              >
                <CheckCircle size={24} />
                Approve
              </button>
              <button
                onClick={() => {
                  setFinalVerdict('Rejected');
                  setShowApprovalModal(false);
                }}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-red-400 to-rose-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:from-red-500 hover:to-rose-600 transition-all duration-300 hover:-translate-y-1"
              >
                <X size={24} />
                Reject
              </button>
            </div>
            <button
              onClick={() => setShowApprovalModal(false)}
              className="w-full px-6 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100 transition-all"
            >
              Go Back to Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSession;
