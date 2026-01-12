import React, { useState, useEffect } from 'react';
import type { Contact, Visitor, User } from '../types';
import { ArrowLeft, Clock, Calendar, MessageSquare, AlertCircle } from './icons';
import * as api from '../utils/api';

interface ContactVisitsViewProps {
    contact: Contact;
    onNavigateBack: () => void;
    user: User;
}

const ContactVisitsView: React.FC<ContactVisitsViewProps> = ({ contact, onNavigateBack, user }) => {
    const [visits, setVisits] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingVisitId, setEditingVisitId] = useState<number | null>(null);
    const [editPurpose, setEditPurpose] = useState('');

    useEffect(() => {
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
        fetchVisits();
    }, [contact.id]);

    const handleEditClick = (visit: Visitor) => {
        setEditingVisitId(visit.id);
        setEditPurpose(visit.purpose || '');
    };

    const handleSavePurpose = async (visitId: number) => {
        try {
            const updatedVisit = await api.updateVisitorPurpose(visitId, editPurpose);
            setVisits(prev => prev.map(v => v.id === visitId ? { ...v, purpose: updatedVisit.purpose } : v));
            setEditingVisitId(null);
        } catch (error) {
            console.error("Failed to update purpose:", error);
            alert("Failed to update purpose.");
        }
    };

    const handleCancelEdit = () => {
        setEditingVisitId(null);
        setEditPurpose('');
    };

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
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
                <div className="space-y-4">
                    {visits.map(visit => (
                        <div key={visit.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${visit.status === 'Checked-in' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                visit.status === 'Checked-out' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                            {visit.status}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(visit.createdAt || visit.checkIn || '').toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-gray-400" />
                                            <span className="font-medium">Check-in:</span> {formatDateTime(visit.checkIn)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-gray-400" />
                                            <span className="font-medium">Check-out:</span> {formatDateTime(visit.checkOut)}
                                        </div>
                                        {/* Scheduled time if relevant, maybe only if no check-in yet */}
                                        {!visit.checkIn && visit.scheduledCheckIn && (
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-gray-400" />
                                                <span className="font-medium">Scheduled:</span> {formatDateTime(visit.scheduledCheckIn)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <MessageSquare size={16} className="mt-1 text-gray-400 flex-shrink-0" />
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-900 dark:text-gray-100 block mb-1">Purpose of Visit:</span>
                                                {editingVisitId === visit.id ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={editPurpose}
                                                            onChange={(e) => setEditPurpose(e.target.value)}
                                                            className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-lyceum-blue"
                                                        />
                                                        <button onClick={() => handleSavePurpose(visit.id)} className="px-3 py-1 text-xs font-medium text-white bg-lyceum-blue rounded-md hover:bg-lyceum-blue-dark">Save</button>
                                                        <button onClick={handleCancelEdit} className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {visit.purpose || <span className="italic text-gray-400">No purpose recorded</span>}
                                                        {(user.role === 'Admin' || user.permissions?.['Reception']?.update) && (
                                                            <button
                                                                onClick={() => handleEditClick(visit)}
                                                                className="ml-2 text-xs text-lyceum-blue hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContactVisitsView;
