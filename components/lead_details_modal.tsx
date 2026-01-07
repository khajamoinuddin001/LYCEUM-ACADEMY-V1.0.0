
import React, { useState, useEffect } from 'react';
import type { LeadDetailsModalProps, CrmLead, Quotation, QuotationStatus, User } from '../types';
import { X, Mail, Phone, Building2, User as UserIcon, IndianRupee, Edit, Share2, UserCheck, FileText, Plus } from './icons';

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
        Accepted: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
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

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };
        if (lead) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lead, onClose]);

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
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-lyceum-blue">{lead.stage}</p>
                            <h2 id="lead-details-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">{lead.title}</h2>
                        </div>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                        <DetailRow icon={<IndianRupee size={20} />} label="Value" value={`₹${lead.value.toLocaleString('en-IN')}`} />
                        <DetailRow icon={<Building2 size={20} />} label="Company" value={lead.company} />
                        { }
                        <DetailRow icon={<UserIcon size={20} />} label="Contact Person" value={lead.contact} />
                        <DetailRow icon={<Mail size={20} />} label="Email" value={lead.email} />
                        <DetailRow icon={<Phone size={20} />} label="Phone" value={lead.phone} />
                        <DetailRow icon={<Share2 size={20} />} label="Source" value={lead.source} />
                        <DetailRow icon={<UserCheck size={20} />} label="Assigned To" value={lead.assignedTo} />
                        {lead.notes && (
                            <div className="flex items-start py-3">
                                <div className="text-gray-400 dark:text-gray-500 w-6 mr-4 flex-shrink-0 pt-1"><FileText size={20} /></div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Notes</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{lead.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    { }
                    <div className="mt-6">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quotations</h3>
                            {(user.role === 'Admin' || user.permissions?.['CRM']?.create) && (
                                <button
                                    onClick={() => onNewQuotation(lead)}
                                    className="inline-flex items-center px-3 py-1 text-xs font-semibold text-white bg-lyceum-blue rounded-md hover:bg-lyceum-blue-dark transition-colors"
                                >
                                    <Plus size={14} className="mr-1.5" />
                                    New Quotation
                                </button>
                            )}
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {(lead.quotations && lead.quotations.length > 0) ? (
                                lead.quotations.map(q => <QuotationRow key={q.id} quotation={q} onEdit={() => onEditQuotation(lead, q)} user={user} />)
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                                    No quotations have been created for this lead yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg space-x-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lyceum-blue"
                    >
                        Close
                    </button>
                    {(user.role === 'Admin' || user.permissions?.['CRM']?.update) && (
                        <button
                            type="button"
                            onClick={() => onEdit(lead)}
                            className="inline-flex items-center px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lyceum-blue"
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
            `}</style>
        </div>
    );
};

export default LeadDetailsModal;
