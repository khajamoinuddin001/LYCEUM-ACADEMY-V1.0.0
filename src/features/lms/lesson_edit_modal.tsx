import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, FileUp, Video, FileText, Image as ImageIcon, Loader2 } from '@/components/common/icons';
import type { LmsLesson, LessonAttachment, QuizQuestion } from '@/types';
import * as api from '@/utils/api';

interface LessonEditModalProps {
  lesson: Omit<LmsLesson, 'id'> | LmsLesson | null;
  onClose: () => void;
  onSave: (lessonData: Omit<LmsLesson, 'id'> | LmsLesson) => void;
}

const LessonEditModal: React.FC<LessonEditModalProps> = ({ lesson, onClose, onSave }) => {
  const [localLesson, setLocalLesson] = useState<Partial<LmsLesson>>({});
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const isNew = !lesson || !('id' in lesson);

  useEffect(() => {
    const initialData = lesson ? JSON.parse(JSON.stringify(lesson)) : {};
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
          
          
          {/* Live Presentation File */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className={sectionHeaderClasses + " mb-0"}>Live Presentation File</h3>
              <p className="text-[10px] text-gray-500">PDF, Video, or Image for live class</p>
            </div>
            
            {localLesson.presentationUrl ? (
              <div className="p-4 bg-lyceum-blue/5 dark:bg-lyceum-blue/10 rounded-lg border border-lyceum-blue/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                    {localLesson.presentationType === 'pdf' && <FileText className="text-red-500" size={20} />}
                    {localLesson.presentationType === 'video' && <Video className="text-blue-500" size={20} />}
                    {localLesson.presentationType === 'image' && <ImageIcon className="text-green-500" size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase">{localLesson.presentationType} Presentation</p>
                    <a href={localLesson.presentationUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-lyceum-blue hover:underline">View Asset</a>
                  </div>
                </div>
                <button 
                  onClick={() => setLocalLesson(p => ({...p, presentationId: undefined, presentationType: undefined, presentationUrl: undefined}))}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="application/pdf,video/*,image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    setIsUploading(true);
                    try {
                      const result = await api.uploadLmsAsset(file);
                      let type: 'pdf' | 'video' | 'image' = 'pdf';
                      if (file.type.startsWith('video/')) type = 'video';
                      else if (file.type.startsWith('image/')) type = 'image';
                      
                      setLocalLesson(p => ({
                        ...p,
                        presentationId: result.id,
                        presentationUrl: result.url,
                        presentationType: type
                      }));
                    } catch (err: any) {
                      setError(err.message || 'Failed to upload presentation file.');
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  className="hidden"
                  id="presentation-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="presentation-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 size={32} className="text-lyceum-blue animate-spin mb-2" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FileUp size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload PDF, Video, or Image</span>
                      <span className="text-xs text-gray-400 mt-1">Recommended for live presentation</span>
                    </div>
                  )}
                </label>
              </div>
            )}
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