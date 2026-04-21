import React, { useState, useEffect } from 'react';
import { 
  FileStack, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  LayoutGrid,
  ClipboardList,
  History,
  MoreVertical,
  Edit,
  Trash2,
  ChevronRight,
  User,
  ArrowUpRight,
  Loader2
} from '@/components/common/icons';
import * as api from '@/utils/api';
import { FormTemplate, FormAssignment, FormSubmission, User as UserType, Contact } from '@/types';
import FormBuilder from './form_builder';
import AssignmentModal from './form_assignment_modal';
import SubmissionReview from './submission_review';
import StudentFormFiller from './student_form_filler';

interface FormsViewProps {
  user: UserType;
  student?: Contact;
}

const FormsView: React.FC<FormsViewProps> = ({ user, student: propStudent }) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'assignments' | 'review'>('templates');
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState<FormSubmission | null>(null);
  const [fillingAssignment, setFillingAssignment] = useState<FormAssignment | null>(null);

  const isAdmin = user?.role === 'Admin';
  const isStaff = user?.role === 'Staff' || isAdmin;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tmpls, asgns, subs, ctcList] = await Promise.all([
        api.getFormTemplates(),
        api.getFormAssignments(),
        api.getFormSubmissions(),
        api.getContacts()
      ]);
      
      setTemplates(tmpls);
      setSubmissions(subs);
      setContacts(ctcList);

      // Robust student identification
      const isStudent = user?.role === 'Student';
      const allContacts = ctcList;

      // Find all possible identities for the student
      const myContacts = isStudent 
        ? allContacts.filter(c => 
            (c.userId && String(c.userId) === String(user?.id)) || 
            (user?.email && c.email && c.email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
            (user?.name && c.name && c.name.toLowerCase().trim() === user.name.toLowerCase().trim())
          )
        : [];

      const studentIds = isStudent 
        ? [
            ...myContacts.map(c => String(c.id)), 
            ...myContacts.map(c => String(c.contactId)),
            String(user?.id)
          ].filter(Boolean)
        : [];

      // If assignment studentId matches ANY of our identifiers, show it
      const filteredAsgns = isStudent 
        ? asgns.filter(a => {
            const aid = String(a.studentId);
            return studentIds.includes(aid) || 
                   myContacts.some(c => String(c.userId) === aid);
          })
        : asgns;
        
      setAssignments(filteredAsgns);
      setSubmissions(subs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!isAdmin) setActiveTab('assignments');
  }, [user]);

  const handleCreateTemplate = () => {
    const newTemplate: FormTemplate = {
      id: '',
      title: 'New Template',
      description: '',
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setEditingTemplate(newTemplate);
  };

  const handleSaveTemplate = async (template: FormTemplate) => {
    try {
      await api.saveFormTemplate(template);
      setEditingTemplate(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save template.');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (window.confirm('Are you sure you want to revoke this assignment?')) {
      await api.deleteFormAssignment(id);
      fetchData();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.deleteFormTemplate(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950/20 animate-in fade-in duration-500 overflow-hidden">
      {/* Header Section */}
      <div className="p-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm border border-violet-200 dark:border-violet-800/50">
                <FileStack size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Forms</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   System Online
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isStaff && (
                <button 
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                >
                  <ArrowUpRight size={18} />
                  <span>Assign Form</span>
                </button>
              )}
              {isAdmin && (
                <button 
                  onClick={handleCreateTemplate}
                  className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black shadow-xl shadow-violet-500/20 transition-all active:scale-95"
                >
                  <Plus size={20} />
                  <span>New Template</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-8 mt-10 border-b border-gray-100 dark:border-gray-800">
            {isAdmin && (
              <button 
                onClick={() => setActiveTab('templates')}
                className={`pb-4 text-sm font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === 'templates' ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Templates
                {activeTab === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-600 dark:bg-violet-400 rounded-full" />}
              </button>
            )}
            {(isStaff || user?.role === 'Student') && (
              <button 
                onClick={() => setActiveTab('assignments')}
                className={`pb-4 text-sm font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === 'assignments' ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {user?.role === 'Student' ? 'My Forms' : 'Active Assignments'}
                {activeTab === 'assignments' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-600 dark:bg-violet-400 rounded-full" />}
              </button>
            )}
            {isStaff && (
              <button 
                onClick={() => setActiveTab('review')}
                className={`pb-4 text-sm font-black uppercase tracking-[0.15em] transition-all relative ${activeTab === 'review' ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Review Queue
                <span className="ml-2 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[10px]">{submissions.filter(s => !s.processedAt).length}</span>
                {activeTab === 'review' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-600 dark:bg-violet-400 rounded-full" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-violet-600" size={48} />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {activeTab === 'templates' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map(tmpl => (
                    <div key={tmpl.id} className="group bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-2xl hover:shadow-violet-500/10 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-2xl text-violet-600">
                          <ClipboardList size={28} />
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setEditingTemplate(tmpl)} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors"><Edit size={16} /></button>
                           <button onClick={() => handleDeleteTemplate(tmpl.id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-2">{String(tmpl.title || 'Untitled Form')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 font-medium">{String(tmpl.description || '')}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tmpl.sections.length} Sections</span>
                        <button 
                          onClick={() => { setEditingTemplate(tmpl); }}
                          className="text-xs font-black text-violet-600 hover:text-violet-700 flex items-center gap-1"
                        >
                          Modify Template
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

               {activeTab === 'assignments' && (
                 <div className="space-y-6">
                   {/* Table View for Staff */}
                   {isStaff && (
                     <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                           <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                             <tr>
                               <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                               <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Form</th>
                               <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned</th>
                               <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                               <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                             </tr>
                           </thead>
                          <tbody className="divide-y dark:divide-gray-800">
                             {assignments.map(asgn => {
                               const student = contacts.find(c => String(c.id) === String(asgn.studentId)) || 
                                               contacts.find(c => c.userId && String(c.userId) === String(asgn.studentId));
                               const template = templates.find(t => t.id === asgn.templateId);
                               return (
                                 <tr key={asgn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                   <td className="px-6 py-4">
                                     <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-xs font-black uppercase">{String(student?.name?.[0] || '?')}</div>
                                       <div>
                                         <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{String(student?.name || 'Unknown')}</p>
                                         <p className="text-[10px] font-medium text-gray-400 mt-1">{String(student?.contactId || '')}</p>
                                       </div>
                                     </div>
                                   </td>
                                   <td className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">{String(template?.title || 'Unknown Form')}</td>
                                   <td className="px-6 py-4 text-xs font-medium text-gray-500">{new Date(asgn.assignedAt).toLocaleDateString()}</td>
                                   <td className="px-6 py-4">
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                       asgn.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                       asgn.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                       asgn.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                                       'bg-amber-100 text-amber-700'
                                     }`}>
                                       {String(asgn.status || 'Pending')}
                                     </span>
                                   </td>
                                    <td className="px-6 py-4">
                                      <button 
                                        onClick={() => handleDeleteAssignment(asgn.id)}
                                        className="text-xs font-black text-red-600 hover:text-red-700 flex items-center gap-1 uppercase tracking-tighter"
                                      >
                                        <Trash2 size={12} />
                                        Revoke
                                      </button>
                                    </td>
                                 </tr>
                               );
                             })}
                          </tbody>
                        </table>
                     </div>
                   )}

                   {/* Premium Card View for Students */}
                   {!isStaff && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignments.map(asgn => {
                          const template = templates.find(t => t.id === asgn.templateId);
                          return (
                            <div key={asgn.id} className="relative group overflow-hidden">
                              {/* Glowing background effect for high status */}
                              {asgn.status === 'Approved' && <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />}
                              
                              <div className="relative bg-white dark:bg-gray-900 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-2xl hover:shadow-violet-500/10 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                  <div className={`p-4 rounded-2xl shadow-lg ${
                                    asgn.status === 'Approved' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                    asgn.status === 'Submitted' ? 'bg-blue-500 text-white shadow-blue-500/20' :
                                    asgn.status === 'Rejected' ? 'bg-rose-500 text-white shadow-rose-500/20' :
                                    'bg-amber-500 text-white shadow-amber-500/20'
                                  }`}>
                                    <ClipboardList size={32} />
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    asgn.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                    asgn.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                                    asgn.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {asgn.status}
                                  </div>
                                </div>

                                <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2 uppercase tracking-tight">
                                  {String(template?.title || 'Unknown Form')}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 line-clamp-2 font-medium">
                                  {String(template?.description || 'Please complete this form to proceed with your application.')}
                                </p>

                                <div className="space-y-4">
                                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2">
                                      <Clock size={14} className="text-gray-400" />
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Received</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{new Date(asgn.assignedAt).toLocaleDateString()}</span>
                                  </div>

                                  {asgn.submissionId ? (
                                    <button 
                                       onClick={() => setReviewingSubmission(submissions.find(s => s.id === asgn.submissionId) || null)}
                                       className="w-full py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                      {asgn.status === 'Submitted' ? 'Review Submission' : 'View Results'}
                                      <ChevronRight size={16} />
                                    </button>
                                  ) : (
                                    <button 
                                       onClick={() => setFillingAssignment(asgn)}
                                       className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-violet-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                      Fill Form Now
                                      <ArrowUpRight size={18} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                     </div>
                   )}

                   {assignments.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-32 text-center bg-white dark:bg-gray-900 rounded-[40px] border border-dashed border-gray-200 dark:border-gray-800">
                         <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-[32px] flex items-center justify-center mb-6">
                            <FileStack size={48} className="text-gray-200" />
                         </div>
                         <h3 className="text-2xl font-black text-gray-300 uppercase tracking-[0.2em] mb-2">No Forms Assigned</h3>
                         <p className="text-sm font-medium text-gray-400 max-w-sm italic">You don't have any pending rituals. Once your counselor assigns a form, it will appear here in high fidelity.</p>
                      </div>
                   )}
                 </div>
               )}

              {activeTab === 'review' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {submissions.filter(s => !s.processedAt).map(sub => {
                    const student = contacts.find(c => c.id === sub.studentId || c.userId === sub.studentId);
                    const asgn = assignments.find(a => a.id === sub.assignmentId);
                    const template = templates.find(t => t.id === asgn?.templateId);
                    return (
                      <div key={sub.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
                             <AlertCircle size={28} />
                           </div>
                            <div>
                              <h4 className="font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tight">{String(student?.name || 'Unknown Student')}</h4>
                              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{String(template?.title || 'Unknown Form')}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={12} />
                            <span>{new Date(sub.submittedAt).toLocaleString()}</span>
                          </div>
                          <button 
                            onClick={() => setReviewingSubmission(sub)}
                            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black text-xs shadow-lg shadow-violet-500/20 transition-all active:scale-95"
                          >
                            Review Submission
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {submissions.filter(s => !s.processedAt).length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                       <CheckCircle2 size={64} className="text-emerald-100 mb-4" />
                       <h3 className="text-xl font-black text-gray-300 uppercase tracking-widest">Review Queue is Empty</h3>
                       <p className="text-sm font-medium text-gray-400 mt-2 italic">All caught up! No submissions waiting for approval.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {editingTemplate && (
        <FormBuilder 
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}

      {showAssignModal && (
        <AssignmentModal 
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => { setShowAssignModal(false); fetchData(); }}
        />
      )}

      {reviewingSubmission && (
        <SubmissionReview 
          submission={reviewingSubmission}
          user={user}
          onClose={() => setReviewingSubmission(null)}
          onProcessed={() => { setReviewingSubmission(null); fetchData(); }}
        />
      )}

      {fillingAssignment && (
        <StudentFormFiller 
          assignment={fillingAssignment}
          template={templates.find(t => t.id === fillingAssignment.templateId)!}
          onClose={() => setFillingAssignment(null)}
          onSubmitted={() => { setFillingAssignment(null); fetchData(); }}
        />
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-bottom {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .slide-in-from-bottom-4 {
          animation-name: slide-in-bottom;
        }
      `}</style>
    </div>
  );
};

export default FormsView;
