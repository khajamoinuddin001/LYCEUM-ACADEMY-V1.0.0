

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Contact, LmsCourse, CalendarEvent, Visitor, User, AccountingTransaction } from '@/types';
import { GraduationCap, BookOpen, CalendarClock, Paperclip, CheckCircle2, Circle, Trophy, Calendar, Upload, Download, User as UserIcon, ArrowLeft, DollarSign, Receipt, AlertCircle, X, Copy, CreditCard } from '@/components/common/icons';
import * as api from '@/utils/api';
import StudentAppointmentModal from './student_appointment_modal';

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
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState<{ upiId: string; qrCode: string } | null>(null);

    useEffect(() => {
        if (isPaymentModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isPaymentModalOpen]);
    const [docsLoading, setDocsLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showChecklistDetails, setShowChecklistDetails] = useState(false);
    const [showUniversityDetails, setShowUniversityDetails] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [activeCounselor, setActiveCounselor] = useState<{ name: string; details: any } | null>(null);
    const [totalPending, setTotalPending] = useState<number>(0);
    const [totalAgreed, setTotalAgreed] = useState<number>(0);
    const [totalPaid, setTotalPaid] = useState<number>(0);
    const [isAccountsLoading, setIsAccountsLoading] = useState(true);

    useEffect(() => {
        if (student) {
            api.getContactVisits(student.id).then(setVisits).catch(console.error);
            loadDocuments(student.id);
            loadTransactions(student);
            api.getPaymentSettings().then(setPaymentSettings).catch(console.error);

            const interval = setInterval(() => {
                api.getContactVisits(student.id).then(v => {
                    setVisits(prev => JSON.stringify(prev) !== JSON.stringify(v) ? v : prev);
                }).catch(console.error);

                // Silent document reload (no spinner)
                api.getContactDocuments(student.id).then(d => {
                    setDocuments(prev => JSON.stringify(prev) !== JSON.stringify(d) ? d : prev);
                }).catch(console.error);

                // Silent accounts reload
                api.getTransactions().then(allTransactions => {
                    calculateBalance(student, allTransactions);
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

    const calculateBalance = (contact: Contact, allTransactions: AccountingTransaction[]) => {
        // Match transactions by ID or Name
        const studentTransactions = allTransactions.filter(
            (t) => (t.contactId === contact.id || (t.customerName && contact.name && t.customerName.toLowerCase().trim() === contact.name.toLowerCase().trim())) && (t.type === 'Income' || t.type === 'Invoice')
        );

        // 1. Total Amount = Total Agreed Amount (Sum of all AR entries' original totals)
        const arEntries = (contact as any).metadata?.accountsReceivable || [];
        const totalAgreedAmount = arEntries.reduce((sum: number, entry: any) => {
            const remaining = parseFloat(entry.remainingAmount) || 0;
            const paid = parseFloat(entry.paidAmount) || 0;
            return sum + remaining + paid;
        }, 0);
        // 2. Paid Amount = Sum of Paid Invoices/Income
        const studentPaidAmount = studentTransactions
            .filter((t) => t.status === 'Paid')
            .reduce((sum, t) => sum + t.amount, 0);

        // 3. Pending = Total Agreed - Total Invoiced (regardless of payment status)
        const totalInvoiced = studentTransactions.reduce((sum, t) => sum + t.amount, 0);

        const calculatedPending = Math.max(0, totalAgreedAmount - totalInvoiced);
        setTotalAgreed(totalAgreedAmount);
        setTotalPaid(studentPaidAmount);
        setTotalPending(arEntries.length > 0 ? calculatedPending : 0);
    };

    const loadTransactions = async (contact: Contact) => {
        try {
            setIsAccountsLoading(true);
            const allTransactions = await api.getTransactions();
            calculateBalance(contact, allTransactions);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setIsAccountsLoading(false);
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


    const handleScheduleAppointment = async (date: string, time: string, purpose: string) => {
        if (!student) return;
        try {
            const scheduledCheckIn = new Date(`${date}T${time}`).toISOString();

            await api.saveVisitor({
                name: student.name,
                company: student.phone || '',
                host: activeCounselor?.name || student.counselorAssigned || 'Reception',
                scheduledCheckIn,
                purpose: purpose,
                status: 'Scheduled'
            });

            setIsAppointmentModalOpen(false);
            alert("Appointment scheduled successfully! It will appear in your visits list.");

            // Refresh visits
            api.getContactVisits(student.id).then(setVisits).catch(console.error);

        } catch (error: any) {
            console.error("Failed to schedule:", error);
            alert("Failed to schedule appointment: " + error.message);
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
                        <>
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
                            <button
                                onClick={() => onAppSelect('Documents')}
                                className="w-full mt-4 py-2 text-xs font-bold text-lyceum-blue bg-lyceum-blue/5 rounded-lg hover:bg-lyceum-blue/10 transition-colors"
                            >
                                View All Documents
                            </button>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No documents on file.</p>
                    )}
                </InfoCard>

                <InfoCard icon={<DollarSign size={20} />} title="Accounts">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Account Overview
                        </p>
                        {isAccountsLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-lyceum-blue"></div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Total Amount */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-500 uppercase tracking-wider">Total Amount</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {new Intl.NumberFormat('en-IN', {
                                        style: 'currency',
                                        currency: 'INR',
                                        minimumFractionDigits: 0
                                    }).format(totalAgreed)}
                                </p>
                            </div>
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-blue-100 dark:border-blue-800">
                                <DollarSign className="text-blue-500" size={18} />
                            </div>
                        </div>

                        {/* Paid & Pending Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800">
                                <p className="text-[10px] font-bold text-green-700 dark:text-green-500 uppercase tracking-wider">Paid Amount</p>
                                <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
                                    {new Intl.NumberFormat('en-IN', {
                                        style: 'currency',
                                        currency: 'INR',
                                        minimumFractionDigits: 0
                                    }).format(totalPaid)}
                                </p>
                            </div>
                            <div
                                onClick={() => totalPending > 0 && setIsPaymentModalOpen(true)}
                                className={`bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-100 dark:border-yellow-800 ${totalPending > 0 ? 'cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors' : ''}`}
                            >
                                <p className="text-[10px] font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider">Pending</p>
                                <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
                                    {new Intl.NumberFormat('en-IN', {
                                        style: 'currency',
                                        currency: 'INR',
                                        minimumFractionDigits: 0
                                    }).format(totalPending)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => onAppSelect('Accounts')}
                        className="w-full mt-4 py-2 text-xs font-bold text-lyceum-blue bg-lyceum-blue/5 rounded-lg hover:bg-lyceum-blue/10 transition-colors flex items-center justify-center gap-2"
                    >
                        View Full Accounts
                    </button>
                    {totalPending > 0 && (
                        <div className="mt-3 flex items-start gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                            <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                            <p>Please ensure all pending payments are cleared at time!</p>
                        </div>
                    )}
                </InfoCard>

                <InfoCard icon={<CalendarClock size={20} />} title="Upcoming Deadlines">
                    {upcomingEvents.length > 0 ? (
                        <ul className="space-y-3">
                            {upcomingEvents.map((event, index) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const target = new Date(event.start);
                                target.setHours(0, 0, 0, 0);
                                const diffTime = target.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                let daysLeftText = '';
                                let daysLeftColor = 'text-gray-500';

                                if (diffDays === 0) {
                                    daysLeftText = 'Today';
                                    daysLeftColor = 'text-red-600 font-bold';
                                } else if (diffDays === 1) {
                                    daysLeftText = 'Tomorrow';
                                    daysLeftColor = 'text-orange-500 font-medium';
                                } else if (diffDays < 0) {
                                    daysLeftText = 'Overdue';
                                    daysLeftColor = 'text-red-700 font-bold';
                                } else {
                                    daysLeftText = `${diffDays} days left`;
                                    daysLeftColor = 'text-blue-600 font-medium';
                                }

                                return (
                                    <li key={`${event.type}-${index}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                                        <div className="flex items-center">
                                            <div className="text-center mr-4 flex-shrink-0 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 min-w-[3.5rem]">
                                                <p className="text-xs text-red-500 font-bold uppercase tracking-wider">{event.start.toLocaleString('default', { month: 'short' })}</p>
                                                <p className="text-xl font-black text-gray-800 dark:text-gray-100 leading-none mt-0.5">{event.start.getDate()}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{event.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{event.start.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                            </div>
                                        </div>

                                        <div className={`flex flex-col items-center justify-center min-w-[5rem] px-3 py-1.5 rounded-lg ${diffDays === 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800' :
                                            diffDays === 1 ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800' :
                                                diffDays < 0 ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700' :
                                                    'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                                            }`}>
                                            {diffDays === 0 ? (
                                                <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Today</span>
                                            ) : diffDays === 1 ? (
                                                <span className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Tmrw</span>
                                            ) : diffDays < 0 ? (
                                                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Done</span>
                                            ) : (
                                                <>
                                                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400 leading-none">{diffDays}</span>
                                                    <span className="text-[10px] font-bold text-blue-400 dark:text-blue-300 uppercase tracking-wider mt-0.5">Days Left</span>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No upcoming deadlines.</p>
                    )}
                </InfoCard>

                {/* Your Counselor Section */}
                {/* Your Counselor Section */}
                {/* Your Counselor Section */}
                {/* Your Counselor Section */}
                <InfoCard icon={<UserIcon size={20} />} title="Your Counselors">
                    {student.counselorAssigned || student.counselorAssigned2 ? (
                        <div className="space-y-6 divide-y divide-gray-100 dark:divide-gray-700">
                            {[
                                { name: student.counselorAssigned, details: student.counselorDetails },
                                { name: student.counselorAssigned2, details: student.counselorDetails2 }
                            ].filter(c => c.name).map((counselor, idx) => (
                                <div key={idx} className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${idx > 0 ? 'pt-6' : ''}`}>
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-12 h-12 rounded-full bg-lyceum-blue/10 flex items-center justify-center text-lyceum-blue font-bold text-xl flex-shrink-0">
                                            {counselor.name!.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{counselor.name}</h3>
                                            </div>
                                            {counselor.details?.phone ? (() => {
                                                let isAvailable = true;
                                                const details = counselor.details;
                                                if (details.shiftStart && details.shiftEnd) {
                                                    const now = new Date();
                                                    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
                                                    if (details.workingDays && Array.isArray(details.workingDays) && !details.workingDays.includes(dayName)) {
                                                        isAvailable = false;
                                                    } else {
                                                        const [startH, startM] = details.shiftStart.split(':').map(Number);
                                                        const [endH, endM] = details.shiftEnd.split(':').map(Number);
                                                        const currentH = now.getHours();
                                                        const currentM = now.getMinutes();
                                                        const currentTime = currentH * 60 + currentM;
                                                        const startTime = startH * 60 + startM;
                                                        const endTime = endH * 60 + endM;
                                                        isAvailable = currentTime >= startTime && currentTime < endTime;
                                                    }
                                                }

                                                return (
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {isAvailable ? 'Available' : 'Unavailable'}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wide">{counselor.details.phone}</span>
                                                    </div>
                                                );
                                            })() : null}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => {
                                                setActiveCounselor({ name: counselor.name!, details: counselor.details });
                                                setIsAppointmentModalOpen(true);
                                            }}
                                            className="w-full px-5 py-2.5 bg-lyceum-blue text-white text-sm font-semibold rounded-lg shadow-md hover:bg-lyceum-blue-dark hover:shadow-lg transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
                                        >
                                            Schedule Appointment
                                        </button>
                                        {visits.filter(v =>
                                            v.status === 'Scheduled' &&
                                            v.host === counselor.name &&
                                            new Date(v.scheduledCheckIn || '') > new Date()
                                        ).map(appt => (
                                            <div key={appt.id} className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800 text-right mt-2">
                                                <p className="text-xs font-bold text-lyceum-blue uppercase tracking-wide mb-0.5">Upcoming</p>
                                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                                    {new Date(appt.scheduledCheckIn!).toLocaleString(undefined, {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-3">
                                <UserIcon size={24} />
                            </div>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">No Counselor Assigned</p>
                            <p className="text-sm text-gray-500 mt-1">Contact administration for assistance.</p>
                        </div>
                    )}
                </InfoCard>

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


            <StudentAppointmentModal
                isOpen={isAppointmentModalOpen}
                onClose={() => setIsAppointmentModalOpen(false)}
                onSave={handleScheduleAppointment}
                counselorName={activeCounselor?.name || student.counselorAssigned || 'Counselor'}
                shiftStart={activeCounselor?.details?.shiftStart || student.counselorDetails?.shiftStart}
                shiftEnd={activeCounselor?.details?.shiftEnd || student.counselorDetails?.shiftEnd}
            />

            {/* Payment Information Modal */}
            {isPaymentModalOpen && paymentSettings && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md top-0 left-0 w-full h-full">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Information</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Scan QR or use UPI ID to pay</p>
                            </div>
                            <button
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col items-center overflow-y-auto custom-scrollbar">
                            {paymentSettings.qrCode ? (
                                <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 mb-6 shrink-0">
                                    <img
                                        src={paymentSettings.qrCode}
                                        alt="Payment QR Code"
                                        className="w-56 h-56 object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-56 h-56 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center p-4 mb-6 shrink-0">
                                    <CreditCard size={40} className="text-gray-300 mb-2" />
                                    <p className="text-xs text-gray-500">QR code not available</p>
                                </div>
                            )}

                            {paymentSettings.upiId ? (
                                <div className="w-full space-y-3 mb-6">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block text-center">UPI ID</label>
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <code className="flex-1 font-mono text-sm text-center text-lyceum-blue font-bold">{paymentSettings.upiId}</code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(paymentSettings.upiId);
                                                alert('UPI ID copied to clipboard!');
                                            }}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-400 dark:text-gray-500 transition-colors"
                                            title="Copy UPI ID"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">No UPI ID configured.</p>
                            )}

                            <div className="w-full space-y-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                <p className="text-xs text-blue-800 dark:text-blue-300 flex gap-2">
                                    <span className="font-bold shrink-0">Note:</span>
                                    <span>This QR code could be changed any time so please do not save it.</span>
                                </p>
                                <p className="text-xs text-blue-800 dark:text-blue-300 flex gap-2">
                                    <span className="font-bold shrink-0">Action:</span>
                                    <span>After doing successful payment contact your respected counselor or share payment details with your info on <strong>7075840681</strong>.</span>
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-center shrink-0 rounded-b-2xl">
                            <button
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="px-6 py-2 bg-lyceum-blue text-white font-bold rounded-xl shadow-lg hover:bg-lyceum-blue-dark transition-all transform hover:scale-105 active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default StudentDashboard;
