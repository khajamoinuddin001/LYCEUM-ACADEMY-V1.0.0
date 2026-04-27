import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  X as CloseIcon, 
  ArrowRight, 
  User, 
  Calendar, 
  FileStack, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Save,
  Loader2
} from '@/components/common/icons';
import { FormSubmission, FormAssignment, FormTemplate, Contact, FormField, User as UserType } from '@/types';
import * as api from '@/utils/api';

interface SubmissionReviewProps {
  submission: FormSubmission;
  user: UserType;
  isInline?: boolean;
  onClose: () => void;
  onProcessed: () => void;
}

const SubmissionReview: React.FC<SubmissionReviewProps> = ({ submission, user, isInline, onClose, onProcessed }) => {
  const [assignment, setAssignment] = useState<FormAssignment | null>(null);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingNotes, setProcessingNotes] = useState(submission.processingNotes || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const isStaff = user?.role === 'Admin' || user?.role === 'Staff';
  const isSubmissionOwner = user?.id === submission.studentId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [asgns, tmpls, fetchedContacts] = await Promise.all([
          api.getFormAssignments(),
          api.getFormTemplates(),
          api.getContacts()
        ]);

        const asgn = asgns.find(a => a.id === submission.assignmentId);
        const tmpl = tmpls.find(t => t.id === asgn?.templateId);
        const ctc = fetchedContacts.find(c => c.id === submission.studentId || c.userId === submission.studentId);

        setAssignment(asgn || null);
        setTemplate(tmpl || null);
        setContact(ctc || null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [submission]);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await api.processFormSubmission(submission.id, 'Approved', processingNotes);
      onProcessed();
    } catch (error: any) {
      alert(error.message || 'Failed to approve submission');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!processingNotes.trim()) {
      alert('Please provide a reason for rejection in processing notes.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.processFormSubmission(submission.id, 'Rejected', processingNotes);
      onProcessed();
    } catch (err) {
      console.error(err);
      alert('Failed to reject submission.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getExistingValue = (mapping: string) => {
    if (!contact || !mapping) return null;
    const path = mapping.split('.');
    let current: any = contact;
    for (const segment of path) {
      if (current && typeof current === 'object' && segment in current) {
        current = current[segment];
      } else {
        return null;
      }
    }
    // If the final result is an object (and not null), return a descriptive string to prevent React rendering crashes
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      return '[Complex Object]';
    }
    return current;
  };

  if (isLoading) {
    if (isInline) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-violet-600" size={32} /></div>;
    return <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 z-[60] flex items-center justify-center"><Loader2 className="animate-spin text-violet-600" size={48} /></div>;
  }

  const content = (
    <div className={`w-full ${isInline ? '' : 'max-w-4xl bg-gray-50 dark:bg-gray-900 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-500'}`}>
      {/* Header */}
      <header className={`px-8 py-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between ${isInline ? 'rounded-t-3xl' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400">
              <FileStack size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none">Review Submission</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{String(template?.title || 'Unknown Template')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
            <CloseIcon size={24} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 space-y-8">
          {/* Student Info Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-400 text-2xl font-black uppercase overflow-hidden">
                {contact?.avatarUrl ? <img src={contact.avatarUrl} alt="" className="w-full h-full object-cover" /> : String(contact?.name?.[0] || '?')}
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white leading-none mb-2">{String(contact?.name || 'Unknown Student')}</h3>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                  <div className="flex items-center gap-1"><User size={14} /> <span>{String(contact?.contactId || '')}</span></div>
                  <div className="flex items-center gap-1"><Clock size={14} /> <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span></div>
                </div>
              </div>
            </div>
            <button 
                onClick={() => window.open(`/?app=Contacts&id=${contact?.id}`, '_blank')}
                className="p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 rounded-xl text-gray-500 transition-all flex items-center gap-2"
            >
              <span className="text-xs font-bold">View Profile</span>
              <ExternalLink size={16} />
            </button>
          </div>

          {/* Submission Data Comparison */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">Data Comparison & Approval</h4>
            
            {template?.sections.map(section => (
              <div key={section.id} className="space-y-4">
                <h5 className="text-sm font-black text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-3 py-1 rounded w-fit">{String(section.title || 'Untitled Section')}</h5>
                <div className="space-y-3">
                  {section.fields.map(field => {
                    const submittedValue = submission.data[field.id];
                    
                    if (submittedValue === undefined && field.type !== 'signature') return null;

                    return (
                      <div key={field.id} className="grid grid-cols-12 gap-4 p-4 rounded-2xl border transition-all bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                        {/* Field Label & Logic */}
                        <div className="col-span-12 md:col-span-4 space-y-1">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{String(field.label || 'Field')}</p>
                        </div>

                        {/* Submitted Data */}
                        <div className="col-span-12 md:col-span-4">
                           <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Submitted Value</p>
                           {field.type === 'signature' ? (
                              <div className="h-16 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-1">
                                {submittedValue?.startsWith('data:image') ? (
                                    <img src={submittedValue} alt="Signature" className="h-full object-contain mx-auto" />
                                ) : (
                                    <p className="text-sm font-handwriting h-full flex items-center justify-center italic text-gray-600">
                                        {submittedValue?.replace('TEXT_SIG:', '') || 'No Signature'}
                                    </p>
                                )}
                              </div>
                           ) : (
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {String(submittedValue || '—')}
                              </p>
                           )}
                        </div>

                        {/* Actions (Hidden per user request - no profile update) */}
                        <div className="col-span-12 md:col-span-4 flex items-center justify-end">
                           {/* Contact update functionality removed here to focus purely on form submission */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Processing Notes */}
          {(isStaff || submission.processingNotes) && (
            <div className={`space-y-4 pt-8 border-t border-gray-100 dark:border-gray-800 ${!isStaff ? 'animate-in slide-in-from-bottom-2 duration-700' : ''}`}>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block flex items-center gap-2">
                <MessageSquare size={14} className="text-violet-500" />
                {isStaff ? 'Internal Processing Notes / Rejection Reason' : 'Reviewer Feedback & Notes'}
              </label>
              {isStaff ? (
                <textarea 
                   value={processingNotes}
                   onChange={e => setProcessingNotes(e.target.value)}
                   placeholder="Add context for this review or reason for rejection..."
                   className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-sm font-medium"
                   rows={3}
                />
              ) : (
                <div className="p-6 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 rounded-2xl">
                  <p className="text-sm font-bold text-violet-900 dark:text-violet-100 italic leading-relaxed">
                    "{submission.processingNotes}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
      <footer className={`px-8 py-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3 flex-shrink-0 ${isInline ? 'rounded-b-3xl' : ''}`}>
        <button 
          onClick={onClose}
          className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold transition-all"
        >
          {isStaff ? 'Cancel' : 'Close'}
        </button>
        
        {isStaff && (
          <>
            <button 
              onClick={handleReject}
              disabled={isProcessing}
              className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-black transition-all active:scale-95 disabled:opacity-50"
            >
              Reject Submission
            </button>

            <button 
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex items-center gap-2 px-8 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black shadow-xl shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Approve Submission</span>
            </button>
          </>
        )}
      </footer>
    </div>
  );

  if (isInline) return content;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex justify-end animate-in fade-in duration-300">
      {content}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .slide-in-from-right {
          animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
        .font-handwriting {
          font-family: 'Dancing Script', cursive;
        }
      `}</style>
    </div>
  );
};

export default SubmissionReview;
