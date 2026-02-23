
import React, { useState, useEffect } from 'react';
import type { LeadDetailsModalProps, CrmLead, Quotation, QuotationStatus, User, Contact } from '@/types';
import { X, Mail, Phone, Building2, User as UserIcon, IndianRupee, Edit, Share2, UserCheck, FileText, Plus, GraduationCap, School, Globe2, Clock } from '@/components/common/icons';
import * as api from '@/utils/api';

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | number; }> = ({ icon, label, value }) => {
    if (!value) return null;

    return (
        <div className="flex items-start py-3">
            <div className="text-gray-400 dark:text-gray-500 w-6 mr-4 flex-shrink-0">{icon}</div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );
};

const QuotationRow: React.FC<{ quotation: Quotation; onEdit: () => void; user: User; }> = ({ quotation, onEdit, user }) => {
    const statusClasses: { [key in QuotationStatus]: string } = {
        Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        Sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        Agreed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Accepted by Student': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        'In Review': 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300',
        Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };

    return (
        <div className="flex items-center justify-between py-3 group">
            <div>
                <p className="text-xs text-lyceum-blue font-mono mb-0.5">{quotation.quotationNumber || `#${quotation.id}`}</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">{quotation.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created on {quotation.date}
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <div className="text-right">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                        ₹{quotation.total.toLocaleString('en-IN')}
                    </p>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[quotation.status]}`}>
                        {quotation.status}
                    </span>
                </div>
                {(user.role === 'Admin' || user.permissions?.['CRM']?.update) && quotation.status === 'Draft' && (
                    <button
                        onClick={onEdit}
                        className="p-1 text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-lyceum-blue opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Edit quotation ${quotation.title}`}
                    >
                        <Edit size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ lead, onClose, onEdit, onNewQuotation, onEditQuotation, user }) => {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);
    const [fetchingApps, setFetchingApps] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };
        if (lead) {
            window.addEventListener('keydown', handleKeyDown);
            fetchStudentApps();
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lead, onClose]);

    const fetchStudentApps = async () => {
        if (!lead?.email) return;
        setFetchingApps(true);
        try {
            const contacts = await api.getContacts();
            const contact = contacts.find(c => c.email?.toLowerCase() === lead.email.toLowerCase());
            if (contact?.visaInformation?.universityApplication?.universities) {
                setApplications(contact.visaInformation.universityApplication.universities.filter((u: any) => u.universityName));
            } else {
                setApplications([]);
            }
        } catch (error) {
            console.error('Failed to fetch student apps:', error);
        } finally {
            setFetchingApps(false);
        }
    };

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsAnimatingOut(false);
            onClose();
        }, 200);
    };

    if (!lead) return null;

    const animationClass = isAnimatingOut ? 'animate-fade-out-fast' : 'animate-fade-in-fast';
    const modalAnimationClass = isAnimatingOut ? 'animate-scale-out' : 'animate-scale-in';

    return (
        <div
            className={`fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 ${animationClass}`}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-details-title"
        >
            <div
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-lyceum-blue uppercase tracking-widest">{lead.stage}</p>
                            <h2 id="lead-details-title" className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{lead.title}</h2>
                        </div>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" aria-label="Close">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="mt-8 border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        <DetailRow icon={<IndianRupee size={20} className="text-emerald-500" />} label="Projected Value" value={`₹${lead.value.toLocaleString('en-IN')}`} />
                        <DetailRow icon={<Building2 size={20} className="text-blue-500" />} label="Affiliation / Company" value={lead.company} />
                        <DetailRow icon={<UserIcon size={20} className="text-indigo-500" />} label="Point of Contact" value={lead.contact} />
                        <DetailRow icon={<Mail size={20} className="text-orange-500" />} label="Email Address" value={lead.email} />
                        <DetailRow icon={<Phone size={20} className="text-rose-500" />} label="Primary Phone" value={lead.phone} />
                        <DetailRow icon={<Share2 size={20} className="text-violet-500" />} label="Lead Acquisition Source" value={lead.source} />
                        <DetailRow icon={<UserCheck size={20} className="text-teal-500" />} label="Personnel Assigned" value={lead.assignedTo} />
                        {lead.notes && (
                            <div className="flex items-start py-4">
                                <div className="text-gray-400 dark:text-gray-500 w-6 mr-4 flex-shrink-0 pt-1 leading-none"><FileText size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Administrative Notes</p>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* University Applications Section */}
                    {applications.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                <GraduationCap size={16} className="text-lyceum-blue" />
                                University Applications
                            </h3>
                            <div className="space-y-3">
                                {applications.map((app, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50/80 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-lyceum-blue group-hover:text-white transition-all shadow-sm border border-gray-100 dark:border-gray-700">
                                                {app.logoUrl ? (
                                                    <img src={`${api.API_BASE_URL}${app.logoUrl}`} alt="" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <School size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 dark:text-white">{app.universityName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-black text-lyceum-blue uppercase tracking-widest">{app.ackNumber || 'DRAFT'}</span>
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                                                        <Globe2 size={10} /> {app.country}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${app.status === 'Offer Received' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' :
                                            app.status === 'Applied' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10' :
                                                'bg-slate-100 text-slate-500 dark:bg-slate-500/10'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between pb-4">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <FileText size={16} className="text-lyceum-blue" />
                                Quotations
                            </h3>
                            {(user.role === 'Admin' || user.permissions?.['CRM']?.create) && (
                                <button
                                    onClick={() => onNewQuotation(lead)}
                                    className="inline-flex items-center px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-lyceum-blue rounded-xl hover:bg-lyceum-blue-dark transition-all shadow-md shadow-blue-500/10"
                                >
                                    <Plus size={14} className="mr-1.5" />
                                    New Quotation
                                </button>
                            )}
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {(lead.quotations && lead.quotations.length > 0) ? (
                                lead.quotations.map(q => <QuotationRow key={q.id} quotation={q} onEdit={() => onEditQuotation(lead, q)} user={user} />)
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 dark:bg-gray-900/30 rounded-[32px] border-2 border-dashed border-gray-100 dark:border-gray-800">
                                    <Clock size={24} className="text-gray-300 mb-2" />
                                    <p className="text-xs font-bold text-gray-400">No active quotations found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end p-6 bg-gray-50/80 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 rounded-b-lg space-x-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-sm text-sm font-bold text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all active:scale-95"
                    >
                        Close
                    </button>
                    {(user.role === 'Admin' || user.permissions?.['CRM']?.update) && (
                        <button
                            type="button"
                            onClick={() => onEdit(lead)}
                            className="inline-flex items-center px-6 py-2.5 bg-lyceum-blue border border-transparent rounded-2xl shadow-lg shadow-blue-500/20 text-sm font-black text-white hover:bg-lyceum-blue-dark transition-all active:scale-95 hover:scale-[1.02]"
                        >
                            <Edit size={16} className="mr-2" />
                            Edit Lead
                        </button>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-out-fast { from { opacity: 1; } to { opacity: 0; } }
                .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
                .animate-fade-out-fast { animation: fade-out-fast 0.2s ease-in forwards; }
                @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes scale-out { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
                .animate-scale-out { animation: scale-out 0.2s ease-in forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
            `}</style>
        </div>
    );
};

export default LeadDetailsModal;
