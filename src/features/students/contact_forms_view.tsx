import React, { useState, useEffect } from 'react';
import type { Contact, User, FormAssignment, FormSubmission, FormTemplate } from '@/types';
import * as api from '@/utils/api';
import { 
  FileStack, 
  Plus, 
  ArrowLeft, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ExternalLink,
  Loader2,
  Calendar
} from '@/components/common/icons';
import SubmissionReview from '../forms/submission_review';

interface ContactFormsViewProps {
  contact: Contact;
  onNavigateBack: () => void;
  user?: User | null;
}

const ContactFormsView: React.FC<ContactFormsViewProps> = ({ contact, onNavigateBack, user }) => {
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [asgns, subs, tmpls] = await Promise.all([
        api.getFormAssignments(),
        api.getFormSubmissions(),
        api.getFormTemplates()
      ]);
      
      // Filter assignments for this specific contact
      const contactAsgns = asgns.filter(a => 
        String(a.studentId) === String(contact.id) || 
        (contact.userId && String(a.studentId) === String(contact.userId))
      );
      
      setAssignments(contactAsgns);
      setSubmissions(subs);
      setTemplates(tmpls);
    } catch (err) {
      console.error('Failed to fetch forms data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contact.id]);

  const isStaffOrAdmin = user?.role === 'Admin' || user?.role === 'Staff';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Submitted': return <Clock size={12} />;
      case 'Approved': return <CheckCircle2 size={12} />;
      case 'Rejected': return <AlertCircle size={12} />;
      case 'Pending': return <Clock size={12} />;
      default: return null;
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this form assignment?')) return;
    try {
      await api.deleteFormAssignment(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete assignment');
    }
  };

  const filteredAssignments = assignments.filter(asgn => {
    const template = templates.find(t => t.id === asgn.templateId);
    return template?.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm w-full mx-auto animate-fade-in border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-700 gap-6">
        <div>
          <button
            onClick={onNavigateBack}
            className="flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-violet-600 mb-3 transition-colors"
          >
            <ArrowLeft size={14} className="mr-2" />
            Back to Details
          </button>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Forms Library
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Student: {contact.name}
          </p>
        </div>
        
        {isStaffOrAdmin && (
          <button className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl transition-all shadow-xl shadow-violet-500/20 active:scale-95">
            <Plus size={20} />
            <span className="font-black text-sm uppercase tracking-widest">Assign Form</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search & Filter Bar - Hidden when reviewing */}
        {!selectedSubmission && (
          <div className="flex items-center gap-4 bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="relative flex-grow">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Filter forms by name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
            <button className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-violet-300 rounded-xl text-gray-500 transition-all">
              <Filter size={20} />
            </button>
          </div>
        )}

        {/* Forms List or Inline Review */}
        <div className="grid grid-cols-1 gap-4">
          {selectedSubmission && user ? (
            <div className="animate-fade-in">
                <SubmissionReview 
                  submission={selectedSubmission}
                  user={user}
                  isInline={true}
                  onClose={() => setSelectedSubmission(null)}
                  onProcessed={() => { setSelectedSubmission(null); fetchData(); }}
                />
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
               <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
               <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Hydrating Forms Hub...</p>
            </div>
          ) : filteredAssignments.length > 0 ? (
            filteredAssignments.map((asgn) => {
              const template = templates.find(t => t.id === asgn.templateId);
              const submission = submissions.find(s => s.id === asgn.submissionId);
              
              return (
                <div 
                  key={asgn.id} 
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-500/50 transition-all hover:shadow-xl hover:shadow-violet-500/5"
                >
                  <div className="flex items-center gap-5 mb-4 sm:mb-0">
                    <div className="w-14 h-14 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-sm">
                      <FileStack size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 dark:text-gray-100 group-hover:text-violet-600 transition-colors uppercase tracking-tight text-base leading-tight">
                        {String(template?.title || 'Unknown Form')}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={12} />
                          Assigned: {new Date(asgn.assignedAt).toLocaleDateString()}
                        </span>
                        {submission && (
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 size={12} />
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-transparent ${getStatusColor(asgn.status)}`}>
                      {getStatusIcon(asgn.status)}
                      {String(asgn.status || 'Pending')}
                    </span>
                    
                    <div className="flex items-center gap-2 border-l border-gray-100 dark:border-gray-700 ml-2 pl-4">
                      {asgn.submissionId && (
                        <button 
                          onClick={() => setSelectedSubmission(submission || null)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-gray-600 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl transition-all border border-gray-100 dark:border-gray-800 hover:border-violet-200"
                          title="View Submission Details"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest">Review</span>
                          <ExternalLink size={14} />
                        </button>
                      )}
                      {isStaffOrAdmin && (
                        <button 
                           onClick={() => handleDeleteAssignment(asgn.id)}
                           className="p-3 text-gray-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20 rounded-xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50" 
                           title="Revoke Assignment"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
               <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-[28px] flex items-center justify-center shadow-sm mb-6">
                  <FileStack size={40} className="text-gray-200 dark:text-gray-700" />
               </div>
               <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest mb-2">Empty Registry</h3>
               <p className="text-sm font-bold text-gray-400 italic">No forms have been allocated to this contact yet.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ContactFormsView;
