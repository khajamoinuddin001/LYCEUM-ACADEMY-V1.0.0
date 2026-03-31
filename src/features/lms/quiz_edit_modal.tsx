import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, HelpCircle, CheckCircle2, Circle, Type, CheckSquare, Loader2 } from '@/components/common/icons';
import type { LmsLesson, QuizQuestion, QuizQuestionType } from '@/types';

interface QuizEditModalProps {
  lesson: Omit<LmsLesson, 'id'> | LmsLesson | null;
  onClose: () => void;
  onSave: (quizData: Omit<LmsLesson, 'id'> | LmsLesson) => void;
}

const QuizEditModal: React.FC<QuizEditModalProps> = ({ lesson, onClose, onSave }) => {
  const [localQuiz, setLocalQuiz] = useState<Partial<LmsLesson>>({});
  const [error, setError] = useState('');
  const isNew = !lesson || !('id' in lesson);

  useEffect(() => {
    const initialData = lesson ? JSON.parse(JSON.stringify(lesson)) : { type: 'quiz', quiz: [] };
    if (!initialData.quiz) initialData.quiz = [];
    setLocalQuiz(initialData);
    setError('');
  }, [lesson]);

  const handleSave = () => {
    if (!localQuiz.title?.trim()) {
      setError('Quiz title is required.');
      return;
    }
    if (!localQuiz.quiz || localQuiz.quiz.length === 0) {
      setError('Add at least one question.');
      return;
    }
    // Basic validation for questions
    for (const q of localQuiz.quiz) {
      if (!q.question.trim()) {
        setError('All questions must have text.');
        return;
      }
      if (q.type === 'mcq') {
        if (!q.options || q.options.some(opt => !opt.trim())) {
          setError('All MCQ options must be filled.');
          return;
        }
      } else if (q.type === 'fill-in-blanks' || q.type === 'true-false') {
        if (!q.correctAnswer?.trim()) {
          setError('Correct answer is required for all questions.');
          return;
        }
      }
    }

    onSave({ ...localQuiz, type: 'quiz' } as LmsLesson);
  };

  const addQuestion = (type: QuizQuestionType) => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      type,
      question: '',
      options: type === 'mcq' ? ['', '', '', ''] : undefined,
      correctAnswerIndex: type === 'mcq' ? 0 : undefined,
      correctAnswer: type === 'true-false' ? 'true' : '',
    };
    setLocalQuiz(prev => ({ ...prev, quiz: [...(prev.quiz || []), newQuestion] }));
  };

  const removeQuestion = (index: number) => {
    setLocalQuiz(prev => ({ ...prev, quiz: (prev.quiz || []).filter((_, i) => i !== index) }));
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    setLocalQuiz(prev => {
      const newQuiz = [...(prev.quiz || [])];
      newQuiz[index] = { ...newQuiz[index], ...updates };
      return { ...prev, quiz: newQuiz };
    });
  };

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-fast">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-lyceum-blue/10 rounded-lg text-lyceum-blue">
                <HelpCircle size={20} />
             </div>
             <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{isNew ? 'Create New Quiz' : 'Edit Quiz'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className={labelClasses}>Quiz Title</label>
            <input 
              type="text" 
              value={localQuiz.title || ''} 
              onChange={e => setLocalQuiz(p => ({ ...p, title: e.target.value }))} 
              className={inputClasses} 
              placeholder="e.g., Module 1 Final Assessment"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2 dark:border-gray-700">
               <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Questions</h3>
               <div className="flex gap-2">
                  <button onClick={() => addQuestion('mcq')} className="inline-flex items-center px-2 py-1 bg-lyceum-blue/10 text-lyceum-blue rounded text-xs font-bold hover:bg-lyceum-blue/20 transition-colors">
                    <CheckSquare size={14} className="mr-1" /> MCQ
                  </button>
                  <button onClick={() => addQuestion('fill-in-blanks')} className="inline-flex items-center px-2 py-1 bg-green-500/10 text-green-600 rounded text-xs font-bold hover:bg-green-500/20 transition-colors">
                    <Type size={14} className="mr-1" /> Fill Blanks
                  </button>
                  <button onClick={() => addQuestion('true-false')} className="inline-flex items-center px-2 py-1 bg-purple-500/10 text-purple-600 rounded text-xs font-bold hover:bg-purple-500/20 transition-colors">
                    <CheckCircle2 size={14} className="mr-1" /> T/F
                  </button>
               </div>
            </div>

            {localQuiz.quiz?.length === 0 ? (
               <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No questions added yet. Use the buttons above to add questions.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {localQuiz.quiz?.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600 relative group">
                    <button onClick={() => removeQuestion(idx)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="flex items-center gap-2 mb-3">
                       <span className="text-xs font-black text-lyceum-blue uppercase bg-lyceum-blue/10 px-2 py-0.5 rounded">Q{idx + 1}</span>
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{q.type.replace('-', ' ')}</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <textarea 
                          rows={2} 
                          value={q.question} 
                          onChange={e => updateQuestion(idx, { question: e.target.value })} 
                          className={inputClasses} 
                          placeholder="Enter question text..."
                        />
                      </div>

                      {q.type === 'mcq' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options?.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <button 
                                onClick={() => updateQuestion(idx, { correctAnswerIndex: optIdx })}
                                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${q.correctAnswerIndex === optIdx ? 'bg-lyceum-blue border-lyceum-blue text-white' : 'border-gray-300 hover:border-lyceum-blue'}`}
                              >
                                {q.correctAnswerIndex === optIdx ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full" />}
                              </button>
                              <input 
                                type="text" 
                                value={opt} 
                                onChange={e => {
                                  const newOpts = [...(q.options || [])];
                                  newOpts[optIdx] = e.target.value;
                                  updateQuestion(idx, { options: newOpts });
                                }} 
                                className={inputClasses} 
                                placeholder={`Option ${optIdx + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'fill-in-blanks' && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Correct Answer</label>
                          <input 
                            type="text" 
                            value={q.correctAnswer || ''} 
                            onChange={e => updateQuestion(idx, { correctAnswer: e.target.value })} 
                            className={inputClasses} 
                            placeholder="Enter the expected answer..."
                          />
                        </div>
                      )}

                      {q.type === 'true-false' && (
                        <div className="flex gap-4">
                          <button 
                            onClick={() => updateQuestion(idx, { correctAnswer: 'true' })}
                            className={`flex-1 py-2 rounded-md border-2 font-bold transition-all ${q.correctAnswer === 'true' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-green-500'}`}
                          >
                            TRUE
                          </button>
                          <button 
                            onClick={() => updateQuestion(idx, { correctAnswer: 'false' })}
                            className={`flex-1 py-2 rounded-md border-2 font-bold transition-all ${q.correctAnswer === 'false' ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-red-500'}`}
                          >
                            FALSE
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-center text-red-500 font-medium bg-red-50 dark:bg-red-900/20 py-2 rounded-md border border-red-100 dark:border-red-900/50">{error}</p>}
        </div>

        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium">Cancel</button>
          <button onClick={handleSave} className="ml-3 px-6 py-2 bg-lyceum-blue text-white rounded-md text-sm font-bold shadow-sm hover:bg-lyceum-blue-dark transition-all">Save Quiz</button>
        </div>
      </div>
    </div>
  );
};

export default QuizEditModal;
