import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle2, 
  FileStack, 
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Loader2
} from '@/components/common/icons';
import { FormTemplate, FormAssignment, FormSubmission, FormField, FormSection } from '@/types';
import * as api from '@/utils/api';
import SignaturePad from '@/components/common/signature_pad';

interface StudentFormFillerProps {
  assignment: FormAssignment;
  template: FormTemplate;
  onClose: () => void;
  onSubmitted: (submission: FormSubmission) => void;
}

const StudentFormFiller: React.FC<StudentFormFillerProps> = ({ assignment, template, onClose, onSubmitted }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load existing draft if any
    const savedDraft = localStorage.getItem(`form_draft_${assignment.id}`);
    if (savedDraft) {
      setFormData(JSON.parse(savedDraft));
    }
  }, [assignment.id]);

  if (!template || !template.sections) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-violet-600 animate-spin" />
          <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Loading Form Template...</p>
        </div>
      </div>
    );
  }

  const currentSection = template.sections[currentSectionIdx];
  const isLastSection = currentSectionIdx === template.sections.length - 1;

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      const newErrors = { ...errors };
      delete newErrors[fieldId];
      setErrors(newErrors);
    }
  };

  const validateSection = (section: FormSection) => {
    const sectionErrors: Record<string, string> = {};
    section.fields.forEach(field => {
      // Check visibility logic
      const isVisible = checkVisibility(field);
      if (!isVisible) return;

      if (field.required && !formData[field.id]) {
        sectionErrors[field.id] = `${field.label} is required`;
      }
    });
    setErrors(sectionErrors);
    return Object.keys(sectionErrors).length === 0;
  };

  const checkVisibility = (field: FormField) => {
    if (!field.conditionalLogic) return true;
    const { fieldId, operator, value } = field.conditionalLogic;
    const sourceValue = formData[fieldId];

    if (operator === 'equals') return sourceValue === value;
    if (operator === 'not-equals') return sourceValue !== value;
    if (operator === 'contains') return String(sourceValue).toLowerCase().includes(String(value).toLowerCase());
    return true;
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      if (isLastSection) {
        handleSubmit();
      } else {
        setCurrentSectionIdx(prev => prev + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentSectionIdx(prev => Math.max(0, prev - 1));
    window.scrollTo(0, 0);
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    localStorage.setItem(`form_draft_${assignment.id}`, JSON.stringify(formData));
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));
    setIsSavingDraft(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submission = await api.submitForm(assignment.id, formData);
      localStorage.removeItem(`form_draft_${assignment.id}`);
      onSubmitted(submission);
    } catch (err) {
      console.error(err);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const isVisible = checkVisibility(field);
    if (!isVisible) return null;

    const error = errors[field.id];
    const commonClasses = `w-full px-4 py-3 bg-white dark:bg-gray-900 border ${error ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-violet-500'} rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 transition-all font-medium text-gray-900 dark:text-white`;

    return (
      <div key={field.id} className="space-y-2 animate-in fade-in duration-300">
        <div className="flex justify-between items-end">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {String(field.label || 'Field')}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {field.helpText && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{String(field.helpText)}</span>}
        </div>

        {field.type === 'text' && (
          <input 
            type="text" 
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          />
        )}

        {field.type === 'long-text' && (
          <textarea 
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
            rows={4}
          />
        )}

        {field.type === 'email' && (
          <input 
            type="email" 
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          />
        )}

        {field.type === 'phone' && (
          <input 
            type="tel" 
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          />
        )}

        {field.type === 'date' && (
          <input 
            type="date" 
            value={formData[field.id] || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          />
        )}

        {field.type === 'number' && (
          <input 
            type="number" 
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          />
        )}

        {field.type === 'dropdown' && (
          <select 
            value={formData[field.id] || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            className={commonClasses}
          >
            <option value="">Select option</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )}

        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name={field.id}
                  value={opt}
                  checked={formData[field.id] === opt}
                  onChange={e => handleFieldChange(field.id, e.target.value)}
                  className="w-5 h-5 text-violet-600 focus:ring-violet-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map(opt => {
              const currentValues = formData[field.id] || [];
              const isChecked = currentValues.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    value={opt}
                    checked={isChecked}
                    onChange={e => {
                      const newValues = e.target.checked 
                        ? [...currentValues, opt]
                        : currentValues.filter((v: string) => v !== opt);
                      handleFieldChange(field.id, newValues);
                    }}
                    className="w-5 h-5 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {field.type === 'file-upload-note' && (
          <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100 dark:border-amber-800/50">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{String(field.label || 'Field')}</p>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1">{field.placeholder || 'Required in Documents Manager'}</p>
              </div>
            </div>
            <button 
              onClick={() => window.open('/?app=Document%20manager', '_blank')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-amber-600/20 transition-all active:scale-95 whitespace-nowrap"
            >
              <span>Upload Documents</span>
              <ExternalLink size={14} />
            </button>
          </div>
        )}

        {field.type === 'signature' && (
          <SignaturePad 
            onSave={val => handleFieldChange(field.id, val)} 
            initialValue={formData[field.id]}
            type={field.signatureType}
            declarationText={field.declarationText}
            required={field.required}
          />
        )}

        {error && <p className="text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1">{error}</p>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors">
            <X size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-gray-900 dark:text-white leading-none">{template.title}</h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Assignment ID: {assignment.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >
            {isSavingDraft ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-100 dark:bg-gray-800 w-full flex-shrink-0">
        <div 
          className="h-full bg-violet-600 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(124,58,237,0.5)]"
          style={{ width: `${((currentSectionIdx + 1) / template.sections.length) * 100}%` }}
        />
      </div>

      <div className="flex-grow overflow-y-auto p-6 md:p-12 bg-gray-50 dark:bg-gray-950/20">
        <div className="max-w-3xl mx-auto py-8">
          {/* Section Info */}
          <div className="mb-10 animate-in fade-in duration-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-violet-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-violet-500/20">
                Step {currentSectionIdx + 1} of {template.sections.length}
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{currentSection.title}</h1>
            {currentSection.description && (
              <p className="text-gray-500 dark:text-gray-400 font-medium italic">
                {currentSection.description}
              </p>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-10">
            {currentSection.fields.map(renderField)}
          </div>

          {/* Navigation */}
          <div className="mt-16 flex items-center justify-between pb-24">
            <button 
              onClick={handlePrevious}
              disabled={currentSectionIdx === 0}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-all active:scale-95"
            >
              <ArrowLeft size={20} />
              <span>Previous</span>
            </button>

            <button 
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-10 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black shadow-xl shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>{isLastSection ? 'Submit Form' : 'Continue'}</span>
                  {!isLastSection && <ArrowRight size={20} />}
                  {isLastSection && <CheckCircle2 size={20} />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default StudentFormFiller;
