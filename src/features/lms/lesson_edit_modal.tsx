import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from '@/components/common/icons';
import type { LmsLesson, LessonAttachment, QuizQuestion } from '@/types';

interface LessonEditModalProps {
  lesson: Omit<LmsLesson, 'id'> | LmsLesson | null;
  onClose: () => void;
  onSave: (lessonData: Omit<LmsLesson, 'id'> | LmsLesson) => void;
}

const LessonEditModal: React.FC<LessonEditModalProps> = ({ lesson, onClose, onSave }) => {
  const [localLesson, setLocalLesson] = useState<Partial<LmsLesson>>({});
  const [error, setError] = useState('');
  const isNew = !lesson || !('id' in lesson);

  useEffect(() => {
    const initialData = lesson ? JSON.parse(JSON.stringify(lesson)) : {};
    if (!initialData.attachments) initialData.attachments = [];
    if (!initialData.quiz) initialData.quiz = [];
    setLocalLesson(initialData);
    setError('');
  }, [lesson]);

  const handleSave = () => {
    if (!localLesson.title?.trim() || !localLesson.content?.trim()) {
      setError('Title and content are required.');
      return;
    }
    onSave(localLesson as LmsLesson);
  };
  const handleAttachmentChange = (index: number, field: keyof LessonAttachment, value: string) => {
    setLocalLesson(prev => {
        const newAttachments = [...(prev.attachments || [])];
        newAttachments[index] = { ...newAttachments[index], [field]: value };
        return { ...prev, attachments: newAttachments };
    });
  };
  const addAttachment = () => {
    setLocalLesson(prev => ({...prev, attachments: [...(prev.attachments || []), {id: `att-${Date.now()}`, name:'', url:''}]}));
  };
  const removeAttachment = (index: number) => {
    setLocalLesson(prev => ({...prev, attachments: (prev.attachments || []).filter((_, i) => i !== index)}));
  };
  const handleQuestionChange = (qIndex: number, value: string) => {
    setLocalLesson(prev => {
        const newQuiz = [...(prev.quiz || [])];
        newQuiz[qIndex].question = value;
        return { ...prev, quiz: newQuiz };
    });
  };
   const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    setLocalLesson(prev => {
        const newQuiz = [...(prev.quiz || [])];
        newQuiz[qIndex].options[optIndex] = value;
        return { ...prev, quiz: newQuiz };
    });
  };
  const setCorrectAnswer = (qIndex: number, optIndex: number) => {
     setLocalLesson(prev => {
        const newQuiz = [...(prev.quiz || [])];
        newQuiz[qIndex].correctAnswerIndex = optIndex;
        return { ...prev, quiz: newQuiz };
    });
  };
   const addQuestion = () => {
    const newQuestion: QuizQuestion = { id: `q-${Date.now()}`, question: '', options: ['', '', '', ''], correctAnswerIndex: 0 };
    setLocalLesson(prev => ({...prev, quiz: [...(prev.quiz || []), newQuestion]}));
  };
  const removeQuestion = (qIndex: number) => {
    setLocalLesson(prev => ({...prev, quiz: (prev.quiz || []).filter((_, i) => i !== qIndex)}));
  };
  
  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const sectionHeaderClasses = "text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-700 mb-4";


  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-fast">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl flex flex-col" style={{maxHeight: '90vh'}} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{isNew ? 'Create New Lesson' : 'Edit Lesson'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          {}
          <div className="space-y-4">
            <div>
              <label htmlFor="lesson-title" className={labelClasses}>Lesson Title</label>
              <input id="lesson-title" type="text" value={localLesson.title || ''} onChange={e => setLocalLesson(p => ({...p, title: e.target.value}))} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="lesson-content" className={labelClasses}>Content (Markdown supported)</label>
              <textarea id="lesson-content" rows={8} value={localLesson.content || ''} onChange={e => setLocalLesson(p => ({...p, content: e.target.value}))} className={inputClasses} />
            </div>
          </div>
          
           {}
          <div>
            <h3 className={sectionHeaderClasses}>Attachments / Resources</h3>
            <div className="space-y-3">
              {(localLesson.attachments || []).map((att, index) => (
                <div key={att.id || index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <input type="text" placeholder="File Name" value={att.name} onChange={e => handleAttachmentChange(index, 'name', e.target.value)} className={`${inputClasses} flex-grow`} />
                  <input type="text" placeholder="File URL" value={att.url} onChange={e => handleAttachmentChange(index, 'url', e.target.value)} className={`${inputClasses} flex-grow`} />
                  <button onClick={() => removeAttachment(index)} className="p-2 text-gray-500 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <button onClick={addAttachment} className="mt-3 inline-flex items-center text-sm font-medium text-lyceum-blue hover:underline"><Plus size={16} className="mr-1" /> Add Attachment</button>
          </div>
          
          {}
          <div>
            <h3 className={sectionHeaderClasses}>Knowledge Check / Quiz</h3>
            <div className="space-y-4">
              {(localLesson.quiz || []).map((q, qIndex) => (
                <div key={q.id || qIndex} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Question {qIndex + 1}</label>
                    <button onClick={() => removeQuestion(qIndex)} className="p-1 text-gray-500 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <textarea rows={2} placeholder="Enter the question text..." value={q.question} onChange={e => handleQuestionChange(qIndex, e.target.value)} className={inputClasses}/>
                  <div className="mt-3 space-y-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Options (select correct answer)</label>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input type="radio" name={`correct-answer-${q.id}`} checked={q.correctAnswerIndex === optIndex} onChange={() => setCorrectAnswer(qIndex, optIndex)} className="h-4 w-4 text-lyceum-blue focus:ring-lyceum-blue" />
                        <input type="text" placeholder={`Option ${optIndex + 1}`} value={opt} onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)} className={inputClasses} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
             <button onClick={addQuestion} className="mt-3 inline-flex items-center text-sm font-medium text-lyceum-blue hover:underline"><Plus size={16} className="mr-1" /> Add Question</button>
          </div>

          {error && <p className="text-sm text-center text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">Cancel</button>
          <button onClick={handleSave} className="ml-3 px-4 py-2 bg-lyceum-blue text-white rounded-md text-sm">Save</button>
        </div>
      </div>
    </div>
  );
};

export default LessonEditModal;