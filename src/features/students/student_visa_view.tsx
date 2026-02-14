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
    Save
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { updateVisaOperationSlotBooking } from '@/utils/api';

interface StudentVisaViewProps {
    operation: VisaOperation | null;
}

export const StudentVisaView: React.FC<StudentVisaViewProps> = ({ operation }) => {
    const [showCgi, setShowCgi] = useState(false);
    const [vacPreferred, setVacPreferred] = useState<string[]>(operation?.slotBookingData?.vacPreferred || []);
    const [viPreferred, setViPreferred] = useState<string[]>(operation?.slotBookingData?.viPreferred || []);
    const [isSaving, setIsSaving] = useState(false);
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Progress */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Status Timeline */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8">Process Timeline</h3>
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-gray-700" />
                            <div className="space-y-8">
                                {steps.map((step, idx) => (
                                    <div key={idx} className="relative pl-12">
                                        <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 z-10 ${step.status === 'completed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'
                                            }`}>
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

                    {/* Important Reminders */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-3xl p-8">
                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">Important Notice</h3>
                        <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                            Please ensure all your documents are uploaded in the "Documents" section. For any queries regarding your visa process, please reach out to your counselor through the "Tickets" application.
                        </p>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    {/* CGI Credentials Box */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                        <div className="flex items-center gap-3 mb-8 relative">
                            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl">
                                <KeyRound size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">CGI Portal</h3>
                        </div>

                        <div className="space-y-6 relative">
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
                                    <button
                                        onClick={() => setShowCgi(!showCgi)}
                                        className="text-orange-600 hover:text-orange-700 transition-colors"
                                    >
                                        {showCgi ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 font-mono text-sm text-slate-700 dark:text-slate-300">
                                    <Lock size={14} className="text-slate-400" />
                                    {showCgi ? (operation.cgiData?.password || '••••••••') : '••••••••'}
                                </div>
                            </div>

                            {/* Security Questions Summary */}
                            <div className="space-y-3">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Security Setup</div>
                                {[1, 2, 3].map(num => {
                                    const question = (operation.cgiData as any)[`securityQuestion${num}`];
                                    const answer = (operation.cgiData as any)[`securityAnswer${num}`];
                                    const hasData = !!question || !!answer;

                                    if (!hasData) return null;

                                    return (
                                        <div key={num} className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-2xl border border-slate-100 dark:border-gray-700 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                                    <ShieldCheck size={12} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {num}</span>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {question || 'Question not set'}
                                                </p>
                                                <p className="text-xs font-mono text-orange-600 dark:text-orange-400">
                                                    Ans: {showCgi ? (answer || '••••••••') : '••••••••'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {!(operation.cgiData as any)?.securityQuestion1 &&
                                    !(operation.cgiData as any)?.securityQuestion2 &&
                                    !(operation.cgiData as any)?.securityQuestion3 && (
                                        <div className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-slate-200 dark:border-gray-700 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">No security questions configured</p>
                                        </div>
                                    )}
                            </div>

                            {!operation.showCgiOnPortal && (
                                <div className="mt-6 p-4 bg-slate-100 dark:bg-gray-800 rounded-2xl border border-dashed border-slate-300 dark:border-gray-600 flex flex-col items-center text-center">
                                    <Lock size={20} className="text-slate-400 mb-2" />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-snug">
                                        Detailed credentials are currently hidden for security. Contact your counselor to enable access.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Slot & Interview Box */}
                    {(operation.slotBookingData?.vacConsulate || operation.slotBookingData?.viConsulate || operation.slotBookingData?.consulate) && (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                            <div className="flex items-center gap-3 mb-8 relative">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <Calendar size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Appointments</h3>
                            </div>

                            <div className="space-y-6 relative text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-2xl border border-slate-100 dark:border-gray-700 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VAC Appointment</div>
                                            {(operation.slotBookingData.vacConsulate || operation.slotBookingData.consulate) && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-bold border border-blue-100 dark:border-blue-800/50">
                                                    <MapPin size={10} />
                                                    {operation.slotBookingData.vacConsulate || operation.slotBookingData.consulate}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="font-bold text-slate-700 dark:text-slate-200">
                                                {operation.slotBookingData.vacDate || '---'}
                                            </div>
                                            <div className="text-xs text-slate-500">{operation.slotBookingData.vacTime || '--:--'}</div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-2xl border border-slate-100 dark:border-gray-700 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VI Appointment</div>
                                            {(operation.slotBookingData.viConsulate || operation.slotBookingData.consulate) && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-bold border border-indigo-100 dark:border-indigo-800/50">
                                                    <MapPin size={10} />
                                                    {operation.slotBookingData.viConsulate || operation.slotBookingData.consulate}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="font-bold text-slate-700 dark:text-slate-200">
                                                {operation.slotBookingData.viDate || '---'}
                                            </div>
                                            <div className="text-xs text-slate-500">{operation.slotBookingData.viTime || '--:--'}</div>
                                        </div>
                                    </div>
                                </div>

                                {operation.visaInterviewData?.visaOutcome && (
                                    <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-1 ${operation.visaInterviewData.visaOutcome === 'Approved'
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-400'
                                        }`}>
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Visa Outcome</div>
                                        <div className="text-lg font-black uppercase tracking-tight">
                                            {operation.visaInterviewData.visaOutcome}
                                        </div>
                                        {operation.visaInterviewData.remarks && (
                                            <div className="text-xs italic opacity-80 mt-1">
                                                "{operation.visaInterviewData.remarks}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Preferences Selection for Students */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <MapPin size={20} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Preferred Locations</h3>
                            {isLocked && (
                                <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                                    <ShieldCheck size={12} />
                                    Finalized
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* VAC Preferences */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">VAC Preferred (Select Multiple)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Hyderabad', 'Chennai', 'Mumbai', 'New Delhi', 'Kolkata'].map(city => (
                                            <button
                                                key={`vac-${city}`}
                                                disabled={isLocked}
                                                onClick={() => {
                                                    setVacPreferred(prev =>
                                                        prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
                                                    );
                                                }}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${vacPreferred.includes(city)
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                    : 'bg-slate-50 dark:bg-gray-900/50 border-slate-100 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                                                    } ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* VI Preferences */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">VI Preferred (Select Multiple)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Hyderabad', 'Chennai', 'Mumbai', 'New Delhi', 'Kolkata'].map(city => (
                                            <button
                                                key={`vi-${city}`}
                                                disabled={isLocked}
                                                onClick={() => {
                                                    setViPreferred(prev =>
                                                        prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
                                                    );
                                                }}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${viPreferred.includes(city)
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                                    : 'bg-slate-50 dark:bg-gray-900/50 border-slate-100 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                                                    } ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {city}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {!isLocked ? (
                                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                    <button
                                        onClick={() => handleSavePreferences(false)}
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-slate-100 dark:bg-gray-900/50 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition-all border border-slate-200 dark:border-gray-700 flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        Save Draft
                                    </button>
                                    <button
                                        onClick={() => handleSavePreferences(true)}
                                        disabled={isSaving}
                                        className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck size={18} />
                                        Confirm & Lock Selections
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-dashed border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex flex-col items-center text-center gap-2">
                                    <Lock size={20} className="text-emerald-600" />
                                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">
                                        Your preferences have been finalized and sent to the processing team.
                                    </p>
                                </div>
                            )}
                        </div>
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
        </div>
    );
};
