import React from 'react';
import { VisaOperation } from '@/types';
import {
    KeyRound,
    User as UserIcon,
    Lock,
    ShieldCheck,
    FileText,
    CheckCircle2,
    Clock,
    Eye,
    EyeOff,
    Calendar,
    MapPin,
    Save,
    AlertCircle,
    Download,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Trash2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { updateVisaOperationSlotBooking, updateDs160Status, updateVisaOperationDs160, downloadDocument, downloadVisaOperationItem, getToken, API_BASE_URL, addDs160DocumentReview, deleteDs160Document } from '@/utils/api';
import type { User } from '@/types';

interface StudentVisaViewProps {
    operations: VisaOperation[];
    user?: User;
}

interface DocumentReviewItemProps {
    doc: any;
    index: number;
    updatedAt: string;
    isSubmitting: boolean;
    isFlowVerified?: boolean;
    isLatest?: boolean;
    user?: User;
    onPreview: (id: number) => void;
    onDownload: (id: number, name: string) => void;
    onDelete?: (id: number) => void;
    onSubmit: (id: number, status: 'Approved' | 'Rejected', comment: string) => void;
}

const DocumentReviewItem: React.FC<DocumentReviewItemProps & { createdAt?: string }> = ({ doc, index, updatedAt, createdAt, isSubmitting, isLatest, isFlowVerified, user, onPreview, onDownload, onDelete, onSubmit }) => {
    const [rejectionBoxOpen, setRejectionBoxOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isExpanded, setIsExpanded] = useState(isLatest);

    const formattedDate = () => {
        const dateStr = doc.uploadedAt || updatedAt || createdAt;
        if (!dateStr) return 'Date Pending';
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 'Date Pending' : date.toLocaleDateString();
    };

    return (
        <div className={`p-5 bg-white dark:bg-gray-900/40 rounded-[28px] border ${isLatest ? 'border-blue-200 dark:border-blue-900/50 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/5' : 'border-slate-100 dark:border-gray-800/60'} transition-all relative overflow-hidden group`}>
            {isLatest && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-bl-xl shadow-sm z-10">
                    Latest
                </div>
            )}
            
            <div className="flex justify-between items-start gap-3">
                <div className="flex gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 ${isLatest ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-slate-50 dark:bg-gray-800 text-slate-400'} flex items-center justify-center text-sm font-black`}>
                        {index}
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight truncate pr-2">{doc.name}</div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <Clock size={10} /> {formattedDate()}
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${doc.lastStatus === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                doc.lastStatus === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                                    'bg-amber-100 text-amber-600'
                                }`}>
                                {doc.lastStatus || 'Action Required'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 relative z-20">
                    <button onClick={() => onPreview(doc.id)} className="p-2.5 bg-slate-50 dark:bg-gray-800/80 rounded-xl text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors shadow-sm" title="Preview"><Eye size={16} /></button>
                    <button onClick={() => onDownload(doc.id, doc.name)} className="p-2.5 bg-slate-50 dark:bg-gray-800/80 rounded-xl text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors shadow-sm" title="Download"><Download size={16} /></button>
                    {(user?.role === 'Admin' || user?.role === 'Staff') && onDelete && (
                        <button onClick={() => onDelete(doc.id)} className="p-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm" title="Delete Version"><Trash2 size={16} /></button>
                    )}
                </div>
            </div>

            {!isLatest && !isExpanded && (
                <button 
                    onClick={() => setIsExpanded(true)}
                    className="mt-4 w-full py-2.5 bg-slate-50 dark:bg-gray-800/40 rounded-xl text-[10px] font-black text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2 border border-dashed border-slate-200 dark:border-gray-700"
                >
                    View Response Details <ChevronDown size={14} />
                </button>
            )}

            {isExpanded && (
                <div className="animate-fade-in space-y-4 pt-4 mt-2">
                    {/* Review History */}
                    {doc.reviews && doc.reviews.length > 0 && (
                        <div className="space-y-2 border-t border-slate-50 dark:border-gray-800 pt-4">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Review History</div>
                            {doc.reviews.map((rev: any, rIdx: number) => (
                                <div key={rIdx} className="bg-slate-50 dark:bg-gray-800/30 p-3 rounded-2xl border border-slate-100 dark:border-gray-800">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${rev.status === 'Approved' ? 'bg-emerald-100/50 text-emerald-600' : 'bg-rose-100/50 text-rose-600'}`}>
                                            {rev.status}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-medium">{new Date(rev.timestamp).toLocaleString()}</span>
                                    </div>
                                    {rev.comment && <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-white dark:bg-gray-900/50 p-2.5 rounded-xl border border-slate-50 dark:border-gray-800 mb-2">"{rev.comment}"</p>}
                                    <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                        <UserIcon size={11} /> {rev.userName} ({rev.role})
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action Bar */}
                    {isLatest && doc.lastStatus !== 'Approved' && !isFlowVerified && (
                        <div className="pt-2 border-t border-slate-50 dark:border-gray-800 animate-fade-in">
                            {!rejectionBoxOpen ? (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => onSubmit(doc.id, 'Approved', 'Approved by student')}
                                        disabled={isSubmitting}
                                        className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                                    >
                                        Approve Document
                                    </button>
                                    <button
                                        onClick={() => setRejectionBoxOpen(true)}
                                        className="flex-1 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-all border border-slate-200 dark:border-gray-700"
                                    >
                                        Reject
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Please provide details for rejection..."
                                        className="w-full p-4 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none min-h-[100px]"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => onSubmit(doc.id, 'Rejected', rejectionReason)}
                                            disabled={!rejectionReason || isSubmitting}
                                            className="flex-[2] bg-rose-600 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-200 dark:shadow-none"
                                        >
                                            Confirm Rejection
                                        </button>
                                        <button
                                            onClick={() => setRejectionBoxOpen(false)}
                                            className="flex-1 bg-slate-100 dark:bg-gray-800 text-slate-500 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all border border-slate-200 dark:border-gray-700"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {!isLatest && (
                        <button 
                            onClick={() => setIsExpanded(false)}
                            className="w-full py-2 text-[9px] font-black text-slate-300 hover:text-slate-400 uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-1.5"
                        >
                            Hide Review Details <ChevronUp size={12} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export const StudentVisaView: React.FC<StudentVisaViewProps> = ({ operations = [], user }) => {
    const sortedOperations = [...operations].sort((a, b) => b.id - a.id);
    const [selectedOpId, setSelectedOpId] = useState<number | null>(sortedOperations[0]?.id || null);

    const operation = sortedOperations.find(op => op.id === selectedOpId) || sortedOperations[0] || null;

    const dsData = operation?.dsData;
    const isDsArray = Array.isArray(dsData);
    const groups = isDsArray ? (dsData as any[]) : (dsData ? [{ main: dsData, dependencies: dsData.dependencies || [] }] : []);

    const [showCgi, setShowCgi] = useState(false);
    const [vacPreferred, setVacPreferred] = useState<string[]>([]);
    const [viPreferred, setViPreferred] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDsSubmitting, setIsDsSubmitting] = useState(false);
    const [expandedGroupIdx, setExpandedGroupIdx] = useState<number | null>(null);

    // Default expand the latest group when groups change
    useEffect(() => {
        if (groups.length > 0) {
            setExpandedGroupIdx(groups.length - 1);
        }
    }, [groups.length]);

    useEffect(() => {
        if (sortedOperations.length > 0 && !selectedOpId) {
            setSelectedOpId(sortedOperations[0].id);
        }
    }, [sortedOperations, selectedOpId]);

    useEffect(() => {
        if (operation?.slotBookingData) {
            setVacPreferred(operation.slotBookingData.vacPreferred || []);
            setViPreferred(operation.slotBookingData.viPreferred || []);
        } else {
            setVacPreferred([]);
            setViPreferred([]);
        }
    }, [operation]);

    const isLocked = !!operation?.slotBookingData?.preferencesLocked;

    const handleSavePreferences = async (lock: boolean = false) => {
        if (!operation) return;

        if (lock) {
            if (!vacPreferred.length || !viPreferred.length) {
                alert('Please select at least one preferred location for both VAC and VI.');
                return;
            }
            if (!confirm('Once confirmed, you will not be able to change these preferences. Are you sure?')) {
                return;
            }
        }

        setIsSaving(true);
        try {
            await updateVisaOperationSlotBooking(operation.id, {
                slotBookingData: {
                    vacPreferred,
                    viPreferred,
                    preferencesLocked: lock ? true : isLocked
                }
            });
            alert(lock ? 'Preferences confirmed and locked!' : 'Preferences saved!');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            alert('Failed to save preferences. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReviewSubmit = async (documentId: number, status: 'Approved' | 'Rejected', comment: string) => {
        if (!operation) return;
        setIsDsSubmitting(true);
        try {
            await addDs160DocumentReview(operation.id, documentId, {
                role: 'Student',
                status,
                comment
            });
            alert(`Document ${status === 'Approved' ? 'approved' : 'rejected'} successfully!`);
            window.location.reload();
        } catch (error) {
            console.error('Failed to submit review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setIsDsSubmitting(false);
        }
    };

    const handlePreviewFile = async (documentId: number) => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE_URL}/visa-operations/items/${documentId}?preview=true`, {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });
            if (!response.ok) throw new Error('Failed to fetch document');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Preview failed:', error);
            alert('Could not preview document.');
        }
    };

    const handleDownloadFile = async (documentId: number, filename: string) => {
        try {
            await downloadVisaOperationItem(documentId, filename);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Could not download document.');
        }
    };

    const handleDeleteDocument = async (documentId: number) => {
        if (!operation || !window.confirm('Are you sure you want to delete this specific version of the document?')) return;
        setIsDsSubmitting(true);
        try {
            await deleteDs160Document(operation.id, documentId);
            alert('Document version deleted successfully!');
            window.location.reload();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Could not delete document.');
        } finally {
            setIsDsSubmitting(false);
        }
    };

    if (!operation) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                <FileText size={64} className="mx-auto text-gray-300 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Visa Application Found</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Your visa processing hasn't started yet. Once your counselor initiates the process, you'll be able to track it here.
                </p>
            </div>
        );
    }

    const isSlotBooked = !!(operation.slotBookingData?.vacDate || operation.slotBookingData?.viDate);
    const steps = [
        { name: 'DS-160', status: (groups.some(g => (g.main?.documentId || g.main?.confirmationDocumentId || g.main?.fillingDocuments?.length > 0))) ? 'completed' : 'pending' },
        { name: 'CGI Credentials', status: (operation.cgiData?.username && !operation.cgiData?.username.includes('•')) ? 'completed' : 'pending' },
        { name: 'Slot Booking', status: isSlotBooked ? 'completed' : 'pending' },
        { name: 'Visa Interview', status: !!operation.visaInterviewData?.visaOutcome ? 'completed' : 'pending' }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in flex flex-col lg:flex-row gap-6">
            {/* Attempts Sidebar */}
            {sortedOperations.length > 1 && (
                <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Visa Attempts</h3>
                        <div className="space-y-2">
                            {sortedOperations.map((op, idx) => {
                                const attemptNumber = sortedOperations.length - idx;
                                const isSelected = op.id === operation.id;
                                return (
                                    <button
                                        key={op.id}
                                        onClick={() => setSelectedOpId(op.id)}
                                        className={`w-full text-left p-3 rounded-xl transition-all border ${isSelected
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/20'
                                            : 'bg-slate-50 dark:bg-gray-900/50 border-transparent hover:bg-slate-100 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                                Attempt #{attemptNumber}
                                            </span>
                                            {isSelected && <CheckCircle2 size={12} className="text-indigo-500" />}
                                        </div>
                                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-500 truncate">
                                            {op.country}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            {new Date(op.createdAt).toLocaleDateString()}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 space-y-8">
                {/* Project Header */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/40 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <FileText size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Visa Application</h1>
                                    <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                        {operation.vopNumber}
                                    </span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">{operation.country} • {operation.name}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Application Status</div>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase tracking-wide border ${isSlotBooked
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-2 ring-emerald-500/20'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                <CheckCircle2 size={16} />
                                {isSlotBooked ? 'Slot Booked' : operation.status}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Previous Attempt Link */}
                {(() => {
                    const currentIndex = sortedOperations.findIndex(op => op.id === operation.id);
                    const previousOperation = sortedOperations[currentIndex + 1];

                    if (previousOperation) {
                        return (
                            <div
                                onClick={() => setSelectedOpId(previousOperation.id)}
                                className="bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 text-slate-400 group-hover:text-lyceum-blue transition-colors">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Previous Application</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            {previousOperation.country}
                                            <span className="text-slate-300">•</span>
                                            <span className="text-xs font-medium text-slate-500">{new Date(previousOperation.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 group-hover:text-lyceum-blue transition-colors">
                                    View Details <ArrowRight size={16} />
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* DS-160 Review Box */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col relative overflow-hidden group min-h-full">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                            <div className="flex items-center gap-3 mb-6 relative">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <FileText size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Document Review</h3>
                            </div>

                            <div className="space-y-4 relative flex-1">
                                {[...groups].reverse().map((group, rIdx) => {
                                    const originalIdx = groups.length - 1 - rIdx;
                                    const isExpanded = expandedGroupIdx === originalIdx;
                                    
                                    return (
                                        <div key={originalIdx} className="space-y-4">
                                            {/* Group Header - Iteractive Accordion */}
                                            <div 
                                                onClick={() => setExpandedGroupIdx(isExpanded ? null : originalIdx)}
                                                className={`group/header flex items-center gap-4 cursor-pointer p-2 -mx-2 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isExpanded ? 'mb-2' : ''}`}
                                            >
                                                <div className={`h-px flex-1 ${isExpanded ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-gray-800'}`}></div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isExpanded ? 'text-blue-500' : 'text-slate-400'}`}>
                                                        Group {originalIdx + 1}
                                                    </span>
                                                    {originalIdx === groups.length - 1 && (
                                                        <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[7px] font-black uppercase tracking-widest rounded-md animate-pulse">
                                                            Latest
                                                        </span>
                                                    )}
                                                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                        <ChevronDown size={14} className={isExpanded ? 'text-blue-500' : 'text-slate-400'} />
                                                    </div>
                                                </div>
                                                <div className={`h-px flex-1 ${isExpanded ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-gray-800'}`}></div>
                                            </div>

                                            {isExpanded && (
                                                <div className="space-y-6 animate-fade-in-up">
                                                    {/* Main Applicant */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between px-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">{group.main?.name || 'Primary Applicant'}</span>
                                                            </div>
                                                            {group.main?.confirmationNumber && (
                                                                <span className="text-[9px] font-mono bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-blue-600 border border-blue-100 dark:border-blue-800">
                                                                    {group.main.confirmationNumber}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Global Status Badges */}
                                                        <div className="flex flex-wrap gap-2 px-1">
                                                            {group.main?.studentStatus === 'accepted' && (
                                                                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 px-2 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-wider">
                                                                    <CheckCircle2 size={10} /> Filling Accepted
                                                                </div>
                                                            )}
                                                            {group.main?.adminStatus === 'accepted' && (
                                                                <div className="space-y-1.5">
                                                                    <div className="bg-emerald-600 text-white px-2 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-black text-white uppercase tracking-wider shadow-sm shadow-emerald-200 dark:shadow-none w-fit">
                                                                        <ShieldCheck size={10} /> Verified by Director
                                                                    </div>
                                                                    {(() => {
                                                                        const directorReview = [...(group.main?.fillingDocuments || [])]
                                                                            .flatMap(d => d.reviews || [])
                                                                            .filter(r => r.role === 'Academy Director')
                                                                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                                                                        return directorReview?.comment ? (
                                                                            <div className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800/50 italic max-w-md">
                                                                                "{directorReview.comment}"
                                                                            </div>
                                                                        ) : null;
                                                                    })()}
                                                                </div>
                                                            )}
                                                            {group.main?.adminStatus === 'rejected' && (
                                                                <div className="space-y-1.5">
                                                                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 px-2 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-black text-rose-600 uppercase tracking-wider w-fit">
                                                                        <AlertCircle size={10} /> Director Rejected
                                                                    </div>
                                                                    {group.main?.rejectionReason && (
                                                                        <div className="text-[10px] font-medium text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-xl border border-rose-100 dark:border-rose-800/50 italic max-w-md">
                                                                            "{group.main.rejectionReason}"
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Documents for Main */}
                                                        <div className="space-y-3">
                                                            {group.main?.fillingDocuments ? (
                                                                (() => {
                                                                    const docs = [...(group.main.fillingDocuments || [])];
                                                                    const totalDocs = docs.length;
                                                                    return docs.reverse().map((doc, dIdx) => (
                                                                        <DocumentReviewItem 
                                                                            key={doc.id} 
                                                                            doc={doc} 
                                                                            index={totalDocs - dIdx} 
                                                                            updatedAt={operation.updatedAt}
                                                                            createdAt={operation.createdAt}
                                                                            isSubmitting={isDsSubmitting}
                                                                            isLatest={dIdx === 0}
                                                                            isFlowVerified={group.main?.adminStatus === 'accepted'}
                                                                            user={user}
                                                                            onPreview={handlePreviewFile}
                                                                            onDownload={handleDownloadFile}
                                                                            onDelete={handleDeleteDocument}
                                                                            onSubmit={handleReviewSubmit}
                                                                        />
                                                                    ));
                                                                })()
                                                            ) : group.main?.fillingDocumentId ? (
                                                                <DocumentReviewItem 
                                                                    doc={{ id: group.main.fillingDocumentId, name: group.main.fillingDocumentName || 'DS-160 Filling' }} 
                                                                    index={1} 
                                                                    updatedAt={operation.updatedAt}
                                                                    createdAt={operation.createdAt}
                                                                    isSubmitting={isDsSubmitting}
                                                                    isLatest={true}
                                                                    isFlowVerified={group.main?.adminStatus === 'accepted'}
                                                                    user={user}
                                                                    onPreview={handlePreviewFile}
                                                                    onDownload={handleDownloadFile}
                                                                    onDelete={handleDeleteDocument}
                                                                    onSubmit={handleReviewSubmit}
                                                                />
                                                            ) : (
                                                                <div className="text-center p-4 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700">
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">No documents yet</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Main Confirmation */}
                                                        {group.main?.confirmationDocumentId && (
                                                            <div className="relative group overflow-hidden">
                                                                {/* Animated Gradient Border Sparkle Effect */}
                                                                <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-3xl opacity-30 group-hover:opacity-100 blur-[2px] transition-all duration-500 animate-pulse"></div>
                                                                
                                                                <div className="relative bg-white dark:bg-slate-900/90 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-3xl shadow-xl shadow-emerald-500/5 backdrop-blur-sm">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                                                                                <ShieldCheck size={18} />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Official</span>
                                                                                <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">DS-160 Confirmation</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 rounded-full text-[9px] font-black text-emerald-600 uppercase tracking-widest whitespace-nowrap">
                                                                            Verified
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/10 group/row hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all">
                                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                                                <FileText size={16} className="text-slate-400" />
                                                                            </div>
                                                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-200 truncate pr-4">{group.main.confirmationDocumentName}</span>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button 
                                                                                onClick={() => handlePreviewFile(group.main.confirmationDocumentId)} 
                                                                                className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 rounded-xl transition-colors"
                                                                                title="View Document"
                                                                            >
                                                                                <Eye size={16} />
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleDownloadFile(group.main.confirmationDocumentId, group.main.confirmationDocumentName)} 
                                                                                className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                                                                                title="Download Official PDF"
                                                                            >
                                                                                <Download size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Dependents */}
                                                    {group.dependencies && group.dependencies.length > 0 && (
                                                        <div className="space-y-6 pt-4 border-t border-slate-50 dark:border-gray-800">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <UserIcon size={14} className="text-purple-500" />
                                                                <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">Dependents</span>
                                                            </div>
                                                            <div className="space-y-8">
                                                                {group.dependencies.map((dep: any, depIdx: number) => (
                                                                    <div key={depIdx} className="space-y-4">
                                                                        <div className="flex items-center justify-between px-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                                                                <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Dependent {depIdx + 1}</span>
                                                                            </div>
                                                                            {dep.confirmationNumber && (
                                                                                <span className="text-[9px] font-mono bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded text-purple-600 border border-purple-100 dark:border-purple-800">
                                                                                    {dep.confirmationNumber}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Dependent Global Status */}
                                                                        <div className="flex flex-wrap gap-2 px-1">
                                                                            {dep?.studentStatus === 'accepted' && (
                                                                                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 px-2 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-wider">
                                                                                    <CheckCircle2 size={10} /> Filling Accepted
                                                                                </div>
                                                                            )}
                                                                            {dep?.adminStatus === 'accepted' && (
                                                                                <div className="space-y-1.5">
                                                                                    <div className="bg-emerald-600 text-white px-2 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-black text-white uppercase tracking-wider shadow-sm shadow-emerald-200 dark:shadow-none w-fit">
                                                                                        <ShieldCheck size={10} /> Verified by Director
                                                                                    </div>
                                                                                    {(() => {
                                                                                        const directorReview = [...(dep?.fillingDocuments || [])]
                                                                                            .flatMap(d => d.reviews || [])
                                                                                            .filter(r => r.role === 'Academy Director')
                                                                                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                                                                                        return directorReview?.comment ? (
                                                                                            <div className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800/50 italic max-w-md">
                                                                                                "{directorReview.comment}"
                                                                                            </div>
                                                                                        ) : null;
                                                                                    })()}
                                                                                </div>
                                                                            )}
                                                                            {dep?.adminStatus === 'rejected' && (
                                                                                <div className="space-y-1.5">
                                                                                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 px-2 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-black text-rose-600 uppercase tracking-wider w-fit">
                                                                                        <AlertCircle size={10} /> Director Rejected
                                                                                    </div>
                                                                                    {dep?.rejectionReason && (
                                                                                        <div className="text-[10px] font-medium text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-xl border border-rose-100 dark:border-rose-800/50 italic max-w-md">
                                                                                            "{dep.rejectionReason}"
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="space-y-3">
                                                                            {dep.fillingDocuments ? (
                                                                                (() => {
                                                                                    const docs = [...(dep.fillingDocuments || [])];
                                                                                    const totalDocs = docs.length;
                                                                                    return docs.reverse().map((doc, dIdx) => (
                                                                                        <DocumentReviewItem 
                                                                                            key={doc.id} 
                                                                                            doc={doc} 
                                                                                            index={totalDocs - dIdx} 
                                                                                            updatedAt={operation.updatedAt}
                                                                                            createdAt={operation.createdAt}
                                                                                            isSubmitting={isDsSubmitting}
                                                                                            isLatest={dIdx === 0}
                                                                                            isFlowVerified={dep?.adminStatus === 'accepted'}
                                                                                            user={user}
                                                                                            onPreview={handlePreviewFile}
                                                                                            onDownload={handleDownloadFile}
                                                                                            onDelete={handleDeleteDocument}
                                                                                            onSubmit={handleReviewSubmit}
                                                                                        />
                                                                                    ));
                                                                                })()
                                                                            ) : dep.fillingDocumentId ? (
                                                                                <DocumentReviewItem 
                                                                                    doc={{ id: dep.fillingDocumentId, name: dep.fillingDocumentName || 'DS-160 Filling' }} 
                                                                                    index={1} 
                                                                                    updatedAt={operation.updatedAt}
                                                                                    createdAt={operation.createdAt}
                                                                                    isSubmitting={isDsSubmitting}
                                                                                    isLatest={true}
                                                                                    isFlowVerified={dep?.adminStatus === 'accepted'}
                                                                                    user={user}
                                                                                    onPreview={handlePreviewFile}
                                                                                    onDownload={handleDownloadFile}
                                                                                    onDelete={handleDeleteDocument}
                                                                                    onSubmit={handleReviewSubmit}
                                                                                />
                                                                            ) : (
                                                                                <div className="text-center p-3 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700">
                                                                                    <p className="text-[9px] text-slate-400 font-bold">Waiting for documents</p>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {dep.confirmationDocumentId && (
                                                                            <div className="relative group overflow-hidden mt-2">
                                                                                {/* Subtle Glow Effect */}
                                                                                <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-2xl opacity-10 group-hover:opacity-40 blur-[1px] transition-all duration-500"></div>
                                                                                
                                                                                <div className="relative bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/20 p-3 rounded-2xl backdrop-blur-sm transition-all group-hover:bg-white dark:group-hover:bg-slate-900">
                                                                                    <div className="flex items-center justify-between mb-3">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <ShieldCheck size={14} className="text-emerald-500" />
                                                                                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Confirmation</span>
                                                                                        </div>
                                                                                        <span className="px-1.5 py-0.5 bg-emerald-500/10 rounded-md text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Ready</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between items-center bg-white dark:bg-slate-800/60 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors">
                                                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate pr-2">{dep.confirmationDocumentName}</span>
                                                                                        <div className="flex gap-1.5">
                                                                                            <button onClick={() => handlePreviewFile(dep.confirmationDocumentId)} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"><Eye size={14} /></button>
                                                                                            <button onClick={() => handleDownloadFile(dep.confirmationDocumentId, dep.confirmationDocumentName)} className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"><Download size={14} /></button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {groups.length === 0 && (
                                    <div className="flex flex-col items-center justify-center text-center py-12">
                                        <FileText size={48} className="text-slate-200 mb-4" />
                                        <h4 className="text-sm font-black text-slate-400 uppercase">No Documents Available</h4>
                                        <p className="text-[10px] text-slate-400 mt-2 max-w-[180px]">Staff will upload documents for your review soon.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CGI Portal Box */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                        <div className="flex items-center gap-3 mb-6 relative">
                            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl">
                                <KeyRound size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">CGI Portal</h3>
                        </div>

                        <div className="space-y-4 relative flex-1">
                            <div className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-2xl border border-slate-100 dark:border-gray-700">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Username</div>
                                <div className="flex items-center gap-2 font-mono text-sm text-slate-700 dark:text-slate-300">
                                    <UserIcon size={14} className="text-slate-400" />
                                    {operation.cgiData?.username || 'Not Available'}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-2xl border border-slate-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</div>
                                    <button onClick={() => setShowCgi(!showCgi)} className="text-orange-600 hover:text-orange-700"><Eye size={14} /></button>
                                </div>
                                <div className="flex items-center gap-2 font-mono text-sm text-slate-700 dark:text-slate-300">
                                    <Lock size={14} className="text-slate-400" />
                                    {showCgi ? (operation.cgiData?.password || '••••••••') : '••••••••'}
                                </div>
                            </div>

                            {/* Security Questions Summary */}
                            <div className="space-y-3 pt-2">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Security Setup</div>
                                {[1, 2, 3].map(num => {
                                    const question = (operation.cgiData as any)[`securityQuestion${num}`];
                                    const answer = (operation.cgiData as any)[`securityAnswer${num}`];
                                    const hasData = !!question || !!answer;

                                    if (!hasData) return null;

                                    return (
                                        <div key={num} className="p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-slate-100 dark:border-gray-700 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                                    <ShieldCheck size={10} />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Question {num}</span>
                                            </div>

                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                                                    {question || 'Question not set'}
                                                </p>
                                                <p className="text-xs font-mono text-orange-600 dark:text-orange-400">
                                                    Ans: {showCgi ? (answer || '••••••••') : '••••••••'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {!operation.showCgiOnPortal && (
                                <div className="mt-4 p-3 bg-slate-100 dark:bg-gray-800 rounded-xl border border-dashed border-slate-300 text-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Detailed credentials hidden for security.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preferred Locations & Booking */}
                    <div className="space-y-6 flex flex-col h-full">
                        {/* Slot Details */}
                        {(operation.slotBookingData?.vacConsulate || operation.slotBookingData?.viConsulate || operation.slotBookingData?.consulate) && (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                                <div className="flex items-center gap-3 mb-4 relative">
                                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl"><Calendar size={20} /></div>
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Confirmed Slot</h3>
                                </div>
                                <div className="space-y-3 relative">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">VAC</span>
                                        <span className="font-bold text-slate-800">{operation.slotBookingData.vacConsulate || operation.slotBookingData.consulate || '---'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Date</span>
                                        <span className="font-bold text-slate-800">{operation.slotBookingData.vacDate || '---'} {operation.slotBookingData.vacTime}</span>
                                    </div>
                                    <div className="border-t border-slate-100 my-2"></div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">VI</span>
                                        <span className="font-bold text-slate-800">{operation.slotBookingData.viConsulate || operation.slotBookingData.consulate || '---'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Date</span>
                                        <span className="font-bold text-slate-800">{operation.slotBookingData.viDate || '---'} {operation.slotBookingData.viTime}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex-1 relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                    <MapPin size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Preferred Locations</h3>
                                {isLocked && (
                                    <div className="ml-auto p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><ShieldCheck size={14} /></div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">VAC Preferred</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Hyderabad', 'Chennai', 'Mumbai', 'New Delhi', 'Kolkata'].map(city => (
                                            <button
                                                key={`vac-${city}`}
                                                disabled={isLocked}
                                                onClick={() => setVacPreferred(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city])}
                                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${vacPreferred.includes(city) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-200'}`}
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">VI Preferred</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Hyderabad', 'Chennai', 'Mumbai', 'New Delhi', 'Kolkata'].map(city => (
                                            <button
                                                key={`vi-${city}`}
                                                disabled={isLocked}
                                                onClick={() => setViPreferred(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city])}
                                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${viPreferred.includes(city) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-emerald-200'}`}
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {!isLocked ? (
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={() => handleSavePreferences(false)} disabled={isSaving} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200">Save Draft</button>
                                        <button onClick={() => handleSavePreferences(true)} disabled={isSaving} className="flex-[2] py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">Confirm & Lock</button>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-emerald-50 border border-dashed border-emerald-200 rounded-xl text-center">
                                        <p className="text-[10px] font-bold text-emerald-800 uppercase">Preferences Locked</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Timeline & Notice */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Process Timeline */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8">Process Timeline</h3>
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-gray-700" />
                            <div className="space-y-8">
                                {steps.map((step, idx) => (
                                    <div key={idx} className="relative pl-12">
                                        <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 z-10 ${step.status === 'completed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                                            {step.status === 'completed' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${step.status === 'completed' ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>{step.name}</h4>
                                            <p className="text-sm text-slate-500">{step.status === 'completed' ? 'Task completed successfully' : 'Pending action'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Important Notice */}
                    <div className="col-span-1">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-3xl p-8 sticky top-6">
                            <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">Important Notice</h3>
                            <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                                Please ensure all your documents are uploaded in the "Documents" section. For any queries regarding your visa process, please reach out to your counselor through the "Tickets" application.
                            </p>
                        </div>
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
            </div >
        </div >
    );
};
