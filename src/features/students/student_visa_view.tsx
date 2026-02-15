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
    Download
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { updateVisaOperationSlotBooking, updateDs160Status, downloadDocument, downloadVisaOperationItem, getToken, API_BASE_URL } from '@/utils/api';

interface StudentVisaViewProps {
    operation: VisaOperation | null;
}

export const StudentVisaView: React.FC<StudentVisaViewProps> = ({ operation }) => {
    const [showCgi, setShowCgi] = useState(false);
    const [vacPreferred, setVacPreferred] = useState<string[]>(operation?.slotBookingData?.vacPreferred || []);
    const [viPreferred, setViPreferred] = useState<string[]>(operation?.slotBookingData?.viPreferred || []);
    const [isSaving, setIsSaving] = useState(false);
    const [dsRejectionReason, setDsRejectionReason] = useState('');
    const [isDsSubmitting, setIsDsSubmitting] = useState(false);
    const isLocked = !!operation?.slotBookingData?.preferencesLocked;

    useEffect(() => {
        if (operation?.slotBookingData) {
            setVacPreferred(operation.slotBookingData.vacPreferred || []);
            setViPreferred(operation.slotBookingData.viPreferred || []);
        }
    }, [operation]);

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

    const handleDsStatusUpdate = async (status: 'accepted' | 'rejected') => {
        if (!operation) return;
        if (status === 'rejected' && !dsRejectionReason) {
            alert('Please provide a reason for rejection.');
            return;
        }

        setIsDsSubmitting(true);
        try {
            await updateDs160Status(operation.id, {
                studentStatus: status,
                rejectionReason: status === 'rejected' ? dsRejectionReason : ''
            });
            alert(`DS-160 details ${status === 'accepted' ? 'approved' : 'rejected'} successfully!`);
            window.location.reload(); // Refresh to get updated status
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
        { name: 'DS-160', status: (operation.status.includes('DS') || operation.status === 'form_completed') ? 'completed' : 'pending' },
        { name: 'CGI Credentials', status: (operation.cgiData?.username && !operation.cgiData?.username.includes('•')) ? 'completed' : 'pending' },
        { name: 'Slot Booking', status: isSlotBooked ? 'completed' : 'pending' },
        { name: 'Visa Interview', status: !!operation.visaInterviewData?.visaOutcome ? 'completed' : 'pending' }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* 1. DS-160 Review Box */}
                <div className="space-y-6">
                    {operation.dsData?.confirmationNumber ? (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                            <div className="flex items-center justify-between mb-6 relative">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                                        <FileText size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">DS-160 Review</h3>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${operation.dsData.studentStatus === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    operation.dsData.studentStatus === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                    {operation.dsData.studentStatus}
                                </div>
                            </div>

                            <div className="space-y-4 relative flex-1">
                                <div className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-2xl border border-slate-100 dark:border-gray-700">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confirmation #</div>
                                    <div className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
                                        {operation.dsData.confirmationNumber}
                                    </div>
                                </div>

                                {((operation.dsData.fillingDocuments && operation.dsData.fillingDocuments.length > 0) || operation.dsData.fillingDocumentId) && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2 px-1">
                                            <FileText size={14} className="text-blue-500" />
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">DS-160 Filling Documents</span>
                                        </div>
                                        <div className="space-y-2">
                                            {/* Legacy Single Document */}
                                            {operation.dsData.fillingDocumentId && !operation.dsData.fillingDocuments?.some(d => d.id === operation.dsData.fillingDocumentId) && (
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
                                                        {operation.dsData.fillingDocumentName || 'ds-160.pdf'}
                                                    </span>
                                                    <button onClick={() => handlePreviewFile(operation.dsData!.fillingDocumentId!)} className="text-blue-600 hover:text-blue-700"><Eye size={14} /></button>
                                                </div>
                                            )}
                                            {/* Multi Documents */}
                                            {operation.dsData.fillingDocuments?.map((doc, index) => (
                                                <div key={doc.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-600 rounded">{index + 1}</span>
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{doc.name}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handlePreviewFile(doc.id)} className="text-blue-600 hover:text-blue-700"><Eye size={14} /></button>
                                                        <button onClick={() => handleDownloadFile(doc.id, doc.name)} className="text-blue-600 hover:text-blue-700"><Download size={14} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {operation.dsData.studentStatus === 'pending' && ((operation.dsData.fillingDocuments && operation.dsData.fillingDocuments.length > 0) || operation.dsData.fillingDocumentId) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-700 space-y-3">
                                        <textarea
                                            placeholder="Reason for rejection..."
                                            value={dsRejectionReason}
                                            onChange={(e) => setDsRejectionReason(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900/50 border border-slate-200 rounded-lg text-xs"
                                            rows={2}
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleDsStatusUpdate('accepted')} disabled={isDsSubmitting} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700">Approve</button>
                                            <button onClick={() => handleDsStatusUpdate('rejected')} disabled={isDsSubmitting} className="flex-1 bg-rose-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-rose-700">Reject</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-gray-800 rounded-3xl p-8 border border-dashed border-slate-200 h-full flex flex-col items-center justify-center text-center">
                            <FileText size={32} className="text-slate-300 mb-2" />
                            <p className="text-sm font-bold text-slate-400">DS-160 Review Pending</p>
                        </div>
                    )}
                </div>

                {/* 2. CGI Portal Box */}
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

                {/* 3. Preferred Locations & Booking */}
                <div className="space-y-6 flex flex-col h-full">
                    {/* Slot Details (Visible if booked) */}
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
                {/* Process Timeline (Full Width/Col-Span) */}
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

                {/* Important Notice Sidebar */}
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
    );
};
