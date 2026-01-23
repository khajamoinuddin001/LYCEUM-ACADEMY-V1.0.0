

import React, { useEffect, useState, useRef } from 'react';
import type { Contact, LmsCourse, CalendarEvent, Visitor, User } from '../types';
import { GraduationCap, BookOpen, CalendarClock, Paperclip, CheckCircle2, Circle, Trophy, Calendar, Upload, Download } from './icons';
import * as api from '../utils/api';

interface StudentDashboardProps {
    student?: Contact;
    courses: LmsCourse[];
    events: CalendarEvent[];
    onAppSelect: (appName: string) => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 ${className}`}>
        <div className="flex items-center mb-5">
            <div className="p-2.5 rounded-lg bg-lyceum-blue/10 dark:bg-lyceum-blue/20 text-lyceum-blue mr-3.5">
                {icon}
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
        {children}
    </div>
);

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, courses, events, onAppSelect }) => {
    const [visits, setVisits] = useState<Visitor[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [docsLoading, setDocsLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showChecklistDetails, setShowChecklistDetails] = useState(false);
    const [showUniversityDetails, setShowUniversityDetails] = useState(false);

    useEffect(() => {
        if (student) {
            api.getContactVisits(student.id).then(setVisits).catch(console.error);
            loadDocuments(student.id);

            const interval = setInterval(() => {
                api.getContactVisits(student.id).then(v => {
                    setVisits(prev => JSON.stringify(prev) !== JSON.stringify(v) ? v : prev);
                }).catch(console.error);

                // Silent document reload (no spinner)
                api.getContactDocuments(student.id).then(d => {
                    setDocuments(prev => JSON.stringify(prev) !== JSON.stringify(d) ? d : prev);
                }).catch(console.error);
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [student]);

    const loadDocuments = async (contactId: number) => {
        try {
            setDocsLoading(true);
            const docs = await api.getContactDocuments(contactId);
            setDocuments(docs);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setDocsLoading(false);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !student) return;

        try {
            setUploading(true);
            await api.uploadDocument(student.id, file);
            await loadDocuments(student.id);
        } catch (error) {
            console.error('Failed to upload document:', error);
            alert('Failed to upload document. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDownloadDocument = async (doc: any) => {
        try {
            await api.downloadDocument(doc.id, doc.name);
        } catch (error) {
            console.error('Failed to download document:', error);
            alert('Failed to download document. Please try again.');
        }
    };

    if (!student) {
        return (
            <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600">
                <div className="bg-lyceum-blue/10 p-4 rounded-full mb-4">
                    <GraduationCap size={48} className="text-lyceum-blue" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Welcome to Lyceum Academy!</h1>
                <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-md">Your student profile is being initialized. If this message persists, please contact support.</p>
                <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue/90 transition-colors">Refresh Dashboard</button>
            </div>
        );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Collect all upcoming deadlines
    const allDeadlines: Array<{ title: string; start: Date; type: string }> = [];

    // Add calendar events
    (events || []).forEach(e => {
        const start = new Date(e.start);
        if (start >= today) {
            allDeadlines.push({ title: e.title, start, type: 'event' });
        }
    });

    // Add VAC Date from visa information
    if (student.visaInformation?.visaInterview?.vacDate) {
        const vacDate = new Date(student.visaInformation.visaInterview.vacDate);
        if (vacDate >= today) {
            allDeadlines.push({
                title: 'VAC Appointment',
                start: vacDate,
                type: 'vac'
            });
        }
    }

    // Add VI Date from visa information
    if (student.visaInformation?.visaInterview?.viDate) {
        const viDate = new Date(student.visaInformation.visaInterview.viDate);
        if (viDate >= today) {
            allDeadlines.push({
                title: 'Visa Interview',
                start: viDate,
                type: 'vi'
            });
        }
    }

    // Sort all deadlines by date and take top 5
    const upcomingEvents = allDeadlines
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 5);

    const checklist = student.checklist || [];
    const completedCount = checklist.filter(item => item.completed).length;
    const totalCount = checklist.length;
    const checklistProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const universityApplication = student.visaInformation?.universityApplication;
    const universities = universityApplication?.universities || [];

    const checklistGroups = (() => {
        const groups: { key: string; items: any[] }[] = [];
        const indexByKey: Record<string, number> = {};

        checklist.forEach(item => {
            const rawText = item.text || '';
            const [maybeGroup, rest] = rawText.split(' - ');
            const key = rest ? maybeGroup : 'Application Checklist';
            const label = rest || rawText;
            const extendedItem = { ...item, displayText: label };
            if (indexByKey[key] === undefined) {
                indexByKey[key] = groups.length;
                groups.push({ key, items: [extendedItem] });
            } else {
                groups[indexByKey[key]].items.push(extendedItem);
            }
        });

        return groups;
    })();
    const sectionOrder = ['University Checklist', 'DS 160', 'CGI', 'Sevis fee', 'SEVIS Fee', 'Visa Interview Preparation', 'Post Visa Guidance', 'Application Checklist'];
    const sectionHeaders = checklistGroups
        .map(g => g.key)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .sort((a, b) => {
            const ia = sectionOrder.indexOf(a);
            const ib = sectionOrder.indexOf(b);
            if (ia === -1 && ib === -1) return a.localeCompare(b);
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
        });

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome, {student.name}!</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Here's a summary of your academic progress and activities.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InfoCard icon={<CheckCircle2 size={20} />} title="Application Checklist">
                    {checklist.length > 0 ? (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <span className="text-sm font-medium text-lyceum-blue">Progress</span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{completedCount} of {totalCount} complete</p>
                                </div>
                                {totalCount > 0 && (
                                    <button
                                        onClick={() => setShowChecklistDetails(!showChecklistDetails)}
                                        className="text-xs font-semibold text-lyceum-blue hover:underline"
                                    >
                                        {showChecklistDetails ? 'Hide details' : 'View details'}
                                    </button>
                                )}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div className="bg-lyceum-blue h-2.5 rounded-full" style={{ width: `${checklistProgress}%` }}></div>
                            </div>
                            {showChecklistDetails ? (
                                <ol className="mt-3 space-y-3 max-h-56 overflow-y-auto pr-1 text-sm">
                                    {checklistGroups.map((group, idx) => (
                                        <li key={group.key}>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {idx + 1}. {group.key}
                                            </p>
                                            <ul className="mt-1 space-y-1">
                                                {group.items.map(item => (
                                                    <li key={item.id} className="flex items-start">
                                                        {(item.type === 'checkbox' || !item.type) && (
                                                            <span className="mt-0.5 mr-2 flex-shrink-0">
                                                                {item.completed ? (
                                                                    <CheckCircle2 size={14} className="text-green-500" />
                                                                ) : (
                                                                    <Circle size={14} className="text-gray-300 dark:text-gray-600" />
                                                                )}
                                                            </span>
                                                        )}
                                                        <div className="flex-1">
                                                            <p className={`text-xs sm:text-sm ${item.completed && item.type === 'checkbox'
                                                                ? 'line-through text-gray-500'
                                                                : 'text-gray-800 dark:text-gray-200'
                                                                }`}>
                                                                {item.displayText}
                                                            </p>
                                                            {item.type === 'text' && (
                                                                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                                                                    Remark: {item.response && item.response.trim() !== '' ? item.response : 'Not added yet'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <ul className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {sectionHeaders.map((section, idx) => (
                                        <li key={section} className="flex items-center text-sm font-medium text-gray-800 dark:text-gray-200">
                                            <CheckCircle2 size={16} className="text-lyceum-blue mr-2 flex-shrink-0" />
                                            {idx + 1}. {section}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">Checklist not available.</p>
                    )}
                </InfoCard>

                <InfoCard icon={<Calendar size={20} />} title="Office Visits">
                    {visits.length > 0 ? (
                        <ul className="space-y-3">
                            {visits.slice(0, 5).map(visit => (
                                <li key={visit.id} className="flex flex-col border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {new Date(visit.checkIn || visit.createdAt!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${visit.status === 'Checked-in' ? 'bg-green-100 text-green-800' :
                                            visit.status === 'Checked-out' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                                            }`}>{visit.status}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Purpose: {visit.purpose || 'N/A'}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No office visits recorded.</p>
                    )}
                </InfoCard>

                <InfoCard icon={<GraduationCap size={20} />} title="University Details">
                    {universities.length > 0 ? (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {universities.length} university{universities.length > 1 ? ' applications' : ' application'}
                                </p>
                                <button
                                    onClick={() => setShowUniversityDetails(!showUniversityDetails)}
                                    className="text-xs font-semibold text-lyceum-blue hover:underline"
                                >
                                    {showUniversityDetails ? 'Hide details' : 'View details'}
                                </button>
                            </div>
                            <ul className="space-y-1">
                                {universities.map((uni, index) => (
                                    <li key={index} className="text-sm text-gray-800 dark:text-gray-200 truncate">
                                        {uni.universityName || `University #${index + 1}`}
                                    </li>
                                ))}
                            </ul>
                            {showUniversityDetails && (
                                <div className="mt-4 space-y-4 max-h-52 overflow-y-auto pr-1">
                                    {universities.map((uni, index) => (
                                        <div key={index} className="border-t border-gray-200 dark:border-gray-700 pt-3 first:border-t-0 first:pt-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                {uni.universityName || `University #${index + 1}`}
                                            </p>
                                            {uni.course && (
                                                <p className="text-xs text-gray-600 dark:text-gray-300">Course: {uni.course}</p>
                                            )}
                                            {uni.applicationSubmissionDate && (
                                                <p className="text-xs text-gray-600 dark:text-gray-300">Application Submitted: {uni.applicationSubmissionDate}</p>
                                            )}
                                            {uni.status && (
                                                <p className="text-xs text-gray-600 dark:text-gray-300">Status: {uni.status}</p>
                                            )}
                                            {uni.remarks && (
                                                <p className="text-xs text-gray-600 dark:text-gray-300">Remarks: {uni.remarks}</p>
                                            )}
                                        </div>
                                    ))}
                                    {(universityApplication?.academicInformation || universityApplication?.languageProficiency) && (
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                            {universityApplication.academicInformation && (
                                                <div className="mb-2">
                                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Academic Information</p>
                                                    {universityApplication.academicInformation.passingBodyUniversity && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                                            Passing Body/University: {universityApplication.academicInformation.passingBodyUniversity}
                                                        </p>
                                                    )}
                                                    {universityApplication.academicInformation.passingYear && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                                            Passing Year: {universityApplication.academicInformation.passingYear}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {universityApplication.languageProficiency && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Language Proficiency</p>
                                                    {universityApplication.languageProficiency.languageProficiency && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                                            Exam: {universityApplication.languageProficiency.languageProficiency}
                                                        </p>
                                                    )}
                                                    {universityApplication.languageProficiency.score && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                                            Score: {universityApplication.languageProficiency.score}
                                                        </p>
                                                    )}
                                                    {universityApplication.languageProficiency.examDate && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                                            Exam Date: {universityApplication.languageProficiency.examDate}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No university application details available.</p>
                    )}
                </InfoCard>

                <InfoCard icon={<Paperclip size={20} />} title="Documents">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {docsLoading ? 'Loading documents...' : documents.length > 0 ? `${documents.length} document${documents.length > 1 ? 's' : ''}` : 'No documents uploaded yet.'}
                        </p>
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                id="student-doc-upload"
                            />
                            <label
                                htmlFor="student-doc-upload"
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-lyceum-blue rounded-md hover:bg-lyceum-blue-dark cursor-pointer ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                <Upload size={14} className="mr-1.5" />
                                {uploading ? 'Uploading...' : 'Upload'}
                            </label>
                        </div>
                    </div>
                    {docsLoading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-lyceum-blue mx-auto"></div>
                        </div>
                    ) : documents.length > 0 ? (
                        <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {documents.slice(0, 5).map((doc) => (
                                <li key={doc.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center min-w-0">
                                        <Paperclip size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                                        <span className="text-gray-800 dark:text-gray-200 truncate">{doc.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDownloadDocument(doc)}
                                        className="inline-flex items-center text-xs font-semibold text-lyceum-blue hover:underline flex-shrink-0 ml-2"
                                    >
                                        <Download size={14} className="mr-1" />
                                        Download
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No documents on file.</p>
                    )}
                </InfoCard>

                <InfoCard icon={<CalendarClock size={20} />} title="Upcoming Deadlines">
                    {upcomingEvents.length > 0 ? (
                        <ul className="space-y-3">
                            {upcomingEvents.map((event, index) => (
                                <li key={`${event.type}-${index}`} className="flex items-start">
                                    <div className="text-center mr-4 flex-shrink-0">
                                        <p className="text-xs text-red-500 font-bold">{event.start.toLocaleString('default', { month: 'short' }).toUpperCase()}</p>
                                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100 -mt-1">{event.start.getDate()}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{event.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{event.start.toLocaleDateString()}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No upcoming deadlines.</p>
                    )}
                </InfoCard>

                {/* Your Counselor Section */}
                {/* Your Counselor Section */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 p-6 rounded-xl shadow-lg border border-indigo-400 dark:border-indigo-500">
                    <h2 className="text-xl font-bold text-white mb-3">Your Counselor</h2>
                    <div className="flex items-center justify-between">
                        <div className="text-white">
                            {student.counselorAssigned ? (
                                <>
                                    <p className="text-lg font-semibold">{student.counselorAssigned}</p>
                                    <p className="text-indigo-100 text-sm mt-1">Available to assist you</p>
                                </>
                            ) : (
                                <p className="text-indigo-100 text-sm italic">No counselor assigned yet.</p>
                            )}
                        </div>
                        {student.counselorAssigned && (
                            <button
                                onClick={() => onAppSelect('Calendar')}
                                className="bg-white hover:bg-indigo-50 text-indigo-600 font-semibold px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                            >
                                Schedule Appointment
                            </button>
                        )}
                    </div>
                </div>

                {/* Need Help Section - At Bottom */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 p-8 rounded-xl shadow-lg border border-blue-400 dark:border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Need Help?</h2>
                            <p className="text-blue-50 text-sm">Raise a support ticket and our team will assist you</p>
                        </div>
                        <button
                            onClick={() => onAppSelect('Tickets')}
                            className="bg-white hover:bg-blue-50 text-blue-600 font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                            Raise Ticket
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
            @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
            }
        `}</style>
        </div>
    );
};

export default StudentDashboard;
