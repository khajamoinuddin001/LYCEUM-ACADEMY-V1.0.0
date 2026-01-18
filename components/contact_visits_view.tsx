import React, { useState, useEffect, useRef } from 'react';
import type { Contact, Visitor, User } from '../types';
import { ArrowLeft, Clock, Calendar, MessageSquare, AlertCircle, ChevronDown, CheckCircle } from './icons';
import * as api from '../utils/api';

interface ContactVisitsViewProps {
    contact: Contact;
    onNavigateBack: () => void;
    user: User;
}

const ACTIONS = [
    "Counselling",
    "DS-160 Started",
    "DS-160 Reviewed",
    "DS-160 Submitted",
    "CGI Credentials Created",
    "Documents Submitted"
];

const ContactVisitsView: React.FC<ContactVisitsViewProps> = ({ contact, onNavigateBack, user }) => {
    const [visits, setVisits] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingVisitId, setUpdatingVisitId] = useState<number | null>(null);
    const purposeTimers = useRef<{ [key: string]: any }>({});

    const canEdit = user.role !== 'Student';

    useEffect(() => {
        fetchVisits();
    }, [contact.id]);

    const fetchVisits = async () => {
        setIsLoading(true);
        try {
            const data = await api.getContactVisits(contact.id);
            setVisits(data);
        } catch (error) {
            console.error("Failed to fetch visits:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionChange = async (visit: Visitor, action: string) => {
        if (!action) return;
        setUpdatingVisitId(visit.id);
        try {
            const currentSegments = visit.visitSegments && visit.visitSegments.length > 0
                ? [...visit.visitSegments]
                : [{ department: visit.host, purpose: visit.purpose || '', timestamp: visit.checkIn }];
            currentSegments[currentSegments.length - 1].action = action;
            await api.saveVisitor({ ...visit, visitSegments: currentSegments });
            await fetchVisits();
        } catch (error) {
            console.error("Failed to update visit action:", error);
            alert("Failed to update visit.");
        } finally {
            setUpdatingVisitId(null);
        }
    };

    const handlePurposeChange = (visit: Visitor, segmentIndex: number, newPurpose: string) => {
        const timerKey = `${visit.id}-${segmentIndex}`;

        // Phase 1: Optimistic UI update
        const segments = visit.visitSegments && visit.visitSegments.length > 0
            ? [...visit.visitSegments]
            : [{ department: visit.host, purpose: visit.purpose || '', timestamp: visit.checkIn }];

        if (segments[segmentIndex]) {
            segments[segmentIndex].purpose = newPurpose;
            const rootPurpose = segmentIndex === 0 ? newPurpose : visit.purpose;

            setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, visitSegments: segments, purpose: rootPurpose } : v));

            // Phase 2: Debounced API call
            if (purposeTimers.current[timerKey]) {
                clearTimeout(purposeTimers.current[timerKey]);
            }

            purposeTimers.current[timerKey] = setTimeout(async () => {
                try {
                    await api.saveVisitor({
                        ...visit,
                        purpose: rootPurpose,
                        visitSegments: segments
                    });
                    console.log(`Synced purpose for visit ${visit.id} segment ${segmentIndex}`);
                } catch (e) {
                    console.error("Failed to sync purpose", e);
                }
            }, 1000);
        }
    };

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    const calculateDuration = (start?: string, end?: string) => {
        if (!start || !end) return 'Ongoing';
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const diffValid = !isNaN(startTime) && !isNaN(endTime);
        if (!diffValid) return '-';

        const diffMs = endTime - startTime;
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm w-full mx-auto animate-fade-in p-6">
            <div className="flex items-center mb-6">
                <button
                    onClick={onNavigateBack}
                    className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Visit History: {contact.name}</h1>
            </div>

            {isLoading ? (
                <div className="text-center py-8">Loading visits...</div>
            ) : visits.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No visits recorded for this contact.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {visits.map((visit, index) => {
                        const segments = visit.visitSegments && visit.visitSegments.length > 0
                            ? visit.visitSegments
                            : [{ department: visit.host, purpose: visit.purpose || '', timestamp: visit.checkIn }];
                        const isCheckedOut = visit.status === 'Checked-out';

                        return (
                            <div key={visit.id} className="border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                                {/* Header */}
                                <div className="flex flex-wrap justify-between items-start mb-6 font-bold text-lg text-gray-900 dark:text-gray-100">
                                    <div className="mb-2">
                                        <div>Visit number:- #{visit.dailySequenceNumber || (visits.length - index)}</div>
                                        <div className="text-base font-normal mt-1">check-in:- {formatDateTime(visit.checkIn)}</div>
                                    </div>
                                    <div className="text-right mb-2">
                                        <div>Duration:- {calculateDuration(visit.checkIn, visit.checkOut || (isCheckedOut ? undefined : new Date().toISOString()))}</div>
                                        <div className="text-base font-normal mt-1">check-out:- {formatDateTime(visit.checkOut)}</div>
                                    </div>
                                </div>

                                {/* Segments */}
                                <div className="space-y-4">
                                    {segments.map((segment, segIdx) => (
                                        <div key={segIdx} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                            <div className="mb-4">
                                                <span className="font-bold mr-2">department:-</span>
                                                <span>{segment.department || 'Reception Desk'}</span>
                                            </div>
                                            <div className="mb-4 flex items-center">
                                                <span className="font-bold mr-2 whitespace-nowrap">purpose of visit :-</span>
                                                <input
                                                    type="text"
                                                    className="flex-1 border-b border-gray-400 bg-transparent focus:border-black dark:focus:border-white focus:outline-none px-1 py-0.5"
                                                    value={segment.purpose}
                                                    onChange={(e) => handlePurposeChange(visit, segIdx, e.target.value)}
                                                    placeholder="Enter purpose..."
                                                    disabled={!canEdit}
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">Action</span>
                                                <div className="relative inline-block w-64 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 h-10 rounded-md">
                                                    <select
                                                        className="w-full h-full appearance-none bg-transparent px-2 font-bold focus:outline-none"
                                                        value={segment.action || ''}
                                                        onChange={(e) => handleActionChange(visit, e.target.value)}
                                                        disabled={!canEdit || updatingVisitId === visit.id}
                                                    >
                                                        <option value="">Select Action...</option>
                                                        {ACTIONS.map(a => (
                                                            <option key={a} value={a}>{a}</option>
                                                        ))}
                                                    </select>
                                                    {canEdit && (
                                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-xs text-black dark:text-gray-300">
                                                            <ChevronDown size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default ContactVisitsView;
