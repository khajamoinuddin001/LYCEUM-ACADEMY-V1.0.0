import React, { useState, useEffect, useRef } from 'react';
import { Contact, UniversityCourse } from '@/types';
import * as api from '@/utils/api';
import {
    GraduationCap, Search, School, Globe2, Calendar,
    CheckCircle2, Clock, Filter, ChevronRight, X,
    Check, Bookmark, FileText, Search as SearchIcon,
    Award, Copy, ArrowRight, User as UserIcon, Mail,
    Phone, Briefcase, Trash2, Edit3, MoreVertical,
    AlertCircle, CheckCircle, BookOpen, Languages, Folder, Key, Plus, Sparkles, Settings, Save,
    ClipboardList
} from 'lucide-react';
import ContactDocumentsView from '../students/contact_documents_view';
import ApplicationCredentialsView from '../students/application_credentials_view';
import ManualApplicationModal from './manual_application_modal';
import TaskModal from '../tasks/task_modal';

interface UniversityApplicationViewProps {
    user: any;
}

const DEFAULT_MESSAGES = [
    { text: "Please upload your updated passport copy.", requiresDoc: true },
    { text: "Financial documents are missing, please upload them.", requiresDoc: true },
    { text: "Your application is under review by the university.", requiresDoc: false },
    { text: "Please provide your original marksheet for verification.", requiresDoc: true },
    { text: "Application fee payment is pending. Please upload the receipt.", requiresDoc: true },
    { text: "Condition met. Awaiting final offer.", requiresDoc: false },
    { text: "Please upload your IELTS/PTE/TOEFL scorecard.", requiresDoc: true },
    { text: "Your affidavit of support is required. Please upload.", requiresDoc: true }
];

const UniversityApplicationView: React.FC<UniversityApplicationViewProps> = ({ user }) => {
    const [predefinedMessages, setPredefinedMessages] = useState<any[]>(DEFAULT_MESSAGES);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [universityCourses, setUniversityCourses] = useState<UniversityCourse[]>([]);

    useEffect(() => {
        const fetchGlobalMessages = async () => {
            try {
                const globalMessages = await api.getSystemSetting<any[]>('predefined_messages');
                if (globalMessages && Array.isArray(globalMessages)) {
                    setPredefinedMessages(globalMessages);
                }
            } catch (error) {
                console.error('Failed to fetch global messages:', error);
            } finally {
                setIsLoadingMessages(false);
            }
        };
        const fetchUniversityCourses = async () => {
            try {
                const data = await api.getUniversityCourses();
                setUniversityCourses(data);
            } catch (error) {
                console.error('Failed to fetch university courses:', error);
            }
        };
        fetchGlobalMessages();
        fetchUniversityCourses();
    }, []);

    const saveGlobalMessages = async (messages: any[]) => {
        try {
            await api.saveSystemSetting('predefined_messages', messages);
        } catch (error) {
            console.error('Failed to save global messages:', error);
            alert('Failed to save messages to the server. Your changes might not be visible to other staff.');
        }
    };

    const [students, setStudents] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [expandedStudent, setExpandedStudent] = useState<Contact | null>(null);
    const [selectedApp, setSelectedApp] = useState<{ student: Contact; app: any; idx: number } | null>(null);
    const [updating, setUpdating] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [editingRemarks, setEditingRemarks] = useState(false);
    const [remarksInput, setRemarksInput] = useState('');
    const [savingRemarks, setSavingRemarks] = useState(false);
    const [studentRemarkInput, setStudentRemarkInput] = useState('');
    const [savingStudentRemark, setSavingStudentRemark] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [requiresDocToggle, setRequiresDocToggle] = useState(false);
    const [showMessageManager, setShowMessageManager] = useState(false);
    const [editingMsgIdx, setEditingMsgIdx] = useState<number | null>(null);
    const [msgInput, setMsgInput] = useState('');
    const [msgRequiresDoc, setMsgRequiresDoc] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showDocuments, setShowDocuments] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [modalScrollAmount, setModalScrollAmount] = useState(0);
    const modalScrollRef = useRef<HTMLDivElement>(null);
    const [editingDateAppIdx, setEditingDateAppIdx] = useState<{ studentId: string, appIdx: number } | null>(null);
    const [newDateValue, setNewDateValue] = useState('');
    const [originalContacts, setOriginalContacts] = useState<Contact[]>([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [prefilledTask, setPrefilledTask] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');
    const [editingInternalNote, setEditingInternalNote] = useState(false);
    const [internalNoteInput, setInternalNoteInput] = useState('');
    const [savingInternalNote, setSavingInternalNote] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await api.getContacts();
            setOriginalContacts(data);

            // Deduplicate contacts by userId or email, but prioritize keeping contacts that have university applications
            const uniqueContactsMap = new Map();
            data.forEach(c => {
                const identifier = c.userId || c.email || c.id;
                const hasApp = c.visaInformation?.universityApplication?.universities &&
                    c.visaInformation.universityApplication.universities.length > 0 &&
                    c.visaInformation.universityApplication.universities.some(u => u.universityName);

                if (!uniqueContactsMap.has(identifier)) {
                    uniqueContactsMap.set(identifier, c);
                } else if (hasApp) {
                    const existing = uniqueContactsMap.get(identifier);
                    const existingHasApp = existing.visaInformation?.universityApplication?.universities &&
                        existing.visaInformation.universityApplication.universities.length > 0 &&
                        existing.visaInformation.universityApplication.universities.some(u => u.universityName);
                    if (!existingHasApp) {
                        uniqueContactsMap.set(identifier, c);
                    }
                }
            });
            const uniqueContacts = Array.from(uniqueContactsMap.values());

            // Filter students who have at least one university application
            const applicants = uniqueContacts.filter(s =>
                s.visaInformation?.universityApplication?.universities &&
                s.visaInformation.universityApplication.universities.length > 0 &&
                s.visaInformation.universityApplication.universities.some(u => u.universityName)
            );
            setStudents(applicants);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSelectApp = async (item: { student: Contact, app: any, idx: number }) => {
        // Open immediately with current data
        setSelectedApp(item);
        setModalScrollAmount(0);
        setIsSidebarExpanded(false);
        setShowDocuments(false);
        setShowCredentials(false);
        setRefreshing(true);

        // Fetch fresh data in background to ensure latest documents/status
        try {
            const data = await api.getContacts();

            // Deduplicate logic (same as in fetchStudents)
            const uniqueContactsMap = new Map();
            data.forEach(c => {
                const identifier = c.userId || c.email || c.id;
                const hasApp = c.visaInformation?.universityApplication?.universities &&
                    c.visaInformation.universityApplication.universities.length > 0 &&
                    c.visaInformation.universityApplication.universities.some(u => u.universityName);

                if (!uniqueContactsMap.has(identifier)) {
                    uniqueContactsMap.set(identifier, c);
                } else if (hasApp) {
                    const existing = uniqueContactsMap.get(identifier);
                    const existingHasApp = existing.visaInformation?.universityApplication?.universities &&
                        existing.visaInformation.universityApplication.universities.length > 0 &&
                        existing.visaInformation.universityApplication.universities.some(u => u.universityName);
                    if (!existingHasApp) {
                        uniqueContactsMap.set(identifier, c);
                    }
                }
            });
            const freshStudents = Array.from(uniqueContactsMap.values());
            setStudents(freshStudents);

            // Update the selected app with fresh data if still open
            const freshStudent = freshStudents.find(s => s.id === item.student.id);
            if (freshStudent && freshStudent.visaInformation?.universityApplication?.universities) {
                const freshApp = freshStudent.visaInformation.universityApplication.universities[item.idx];
                setSelectedApp(prev => {
                    if (prev && prev.student.id === item.student.id && prev.idx === item.idx) {
                        return {
                            ...prev,
                            student: freshStudent,
                            app: freshApp
                        };
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error('Background fetch failed:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleAddOrUpdateMessage = () => {
        if (!msgInput.trim()) return;

        const newMessage = { text: msgInput.trim(), requiresDoc: msgRequiresDoc };
        if (editingMsgIdx !== null) {
            const updated = [...predefinedMessages];
            updated[editingMsgIdx] = newMessage;
            setPredefinedMessages(updated);
            saveGlobalMessages(updated);
        } else {
            const updated = [...predefinedMessages, newMessage];
            setPredefinedMessages(updated);
            saveGlobalMessages(updated);
        }

        setMsgInput('');
        setMsgRequiresDoc(false);
        setEditingMsgIdx(null);
    };

    const handleDeleteMessage = (index: number) => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            const updated = predefinedMessages.filter((_: any, i: number) => i !== index);
            setPredefinedMessages(updated);
            saveGlobalMessages(updated);
        }
    };

    const handleUpdateStatus = async (student: Contact, appIdx: number, newStatus: string) => {
        setUpdating(true);
        try {
            const updatedStudent = { ...student };
            if (updatedStudent.visaInformation?.universityApplication?.universities) {
                updatedStudent.visaInformation.universityApplication.universities[appIdx].status = newStatus;

                // Add a remark if it's being updated by staff
                const existingRemarks = updatedStudent.visaInformation.universityApplication.universities[appIdx].remarks || '';
                const timestamp = new Date().toLocaleString();
                updatedStudent.visaInformation.universityApplication.universities[appIdx].remarks =
                    `${existingRemarks}\n[${timestamp}] Updated to ${newStatus} by ${user.name}`;

                await api.saveContact(updatedStudent, false);

                // Update local state
                setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
                if (selectedApp?.student.id === student.id) {
                    setSelectedApp({
                        student: updatedStudent,
                        app: updatedStudent.visaInformation!.universityApplication!.universities[appIdx],
                        idx: appIdx
                    });
                }
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveTask = async (task: any) => {
        try {
            await api.saveTask(task);
            fetchStudents(true); // Refresh data
        } catch (error) {
            console.error('Failed to save task:', error);
            alert('Failed to save task');
        }
    };

    const handleDeferApplication = async (student: Contact, appIdx: number) => {
        if (window.confirm('Are you sure you want to defer this application?\n\nThis will close the current application and create a duplicate with the same details.')) {
            setUpdating(true);
            try {
                // Generate new ACK synchronously to wait for it safely before saving
                let newAck = `ACK-DEFERRED-${Date.now()}`;
                try {
                    const nextAckRes = await api.getNextAckNumber();
                    if (nextAckRes && nextAckRes.ackNumber) {
                        newAck = nextAckRes.ackNumber;
                    }
                } catch (ackError) {
                    console.error('Failed to get next ACK number, using fallback:', ackError);
                }

                const updatedStudent = { ...student };
                if (updatedStudent.visaInformation?.universityApplication?.universities) {
                    const currentApp = updatedStudent.visaInformation.universityApplication.universities[appIdx];

                    // Clone application details before modifying the original
                    const duplicateApp = {
                        ...currentApp,
                        ackNumber: newAck,
                        status: 'Shortlisted',
                        applicationSubmissionDate: new Date().toISOString(),
                        remarks: `[${new Date().toLocaleString()}] Application deferred from original ACK: ${currentApp.ackNumber || 'Unknown'} by ${user.name}`
                    };

                    // Update original application to Deferred
                    const existingRemarks = currentApp.remarks || '';
                    const timestamp = new Date().toLocaleString();
                    currentApp.previousStatus = currentApp.status;
                    currentApp.status = 'Application Deferred';
                    currentApp.remarks = `${existingRemarks}\n[${timestamp}] Application deferred to new ACK: ${newAck} by ${user.name}`;

                    updatedStudent.visaInformation.universityApplication.universities.push(duplicateApp);

                    await api.saveContact(updatedStudent, false);

                    // Update UI state
                    setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
                    setSelectedApp({
                        student: updatedStudent,
                        app: currentApp,
                        idx: appIdx
                    });
                }
            } catch (error) {
                console.error('Failed to defer application:', error);
                alert('Failed to defer application. Please try again.');
            } finally {
                setUpdating(false);
            }
        }
    };

    const handleDeleteApplication = async (student: Contact, appIdx: number) => {
        if (window.confirm('Are you sure you want to permanently delete this application? This action cannot be undone.')) {
            setUpdating(true);
            try {
                const updatedStudent = { ...student };
                if (updatedStudent.visaInformation?.universityApplication?.universities) {
                    updatedStudent.visaInformation.universityApplication.universities.splice(appIdx, 1);
                    await api.saveContact(updatedStudent, false);

                    // Update UI state
                    setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
                    setSelectedApp(null); // Close the detail view
                }
            } catch (error) {
                console.error('Failed to delete application:', error);
                alert('Failed to delete application. Please try again.');
            } finally {
                setUpdating(false);
            }
        }
    };

    const handleUpdateSubmissionDate = async (student: Contact, appIdx: number) => {
        if (!newDateValue) return;
        setUpdating(true);
        try {
            const updatedStudent = { ...student };
            if (updatedStudent.visaInformation?.universityApplication?.universities) {
                updatedStudent.visaInformation.universityApplication.universities[appIdx].applicationSubmissionDate = newDateValue;

                // Add a remark if it's being updated by staff
                const existingRemarks = updatedStudent.visaInformation.universityApplication.universities[appIdx].remarks || '';
                const timestamp = new Date().toLocaleString();
                updatedStudent.visaInformation.universityApplication.universities[appIdx].remarks =
                    `${existingRemarks}\n[${timestamp}] Submission date updated to ${new Date(newDateValue).toLocaleDateString()} by ${user.name}`;

                await api.saveContact(updatedStudent, false);

                // Update local state
                setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s));
                if (selectedApp?.student.id === student.id && selectedApp.idx === appIdx) {
                    setSelectedApp({
                        ...selectedApp,
                        student: updatedStudent,
                        app: updatedStudent.visaInformation!.universityApplication!.universities[appIdx]
                    });
                }
                setEditingDateAppIdx(null);
            }
        } catch (error) {
            console.error('Failed to update submission date:', error);
            alert('Failed to update submission date. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveStudentRemark = async (newRemark: string, requiresDocument: boolean) => {
        if (!selectedApp) return;
        setSavingStudentRemark(true);
        try {
            const updatedStudent = { ...selectedApp.student };
            if (updatedStudent.visaInformation?.universityApplication?.universities) {
                updatedStudent.visaInformation.universityApplication.universities[selectedApp.idx].studentRemark = newRemark;

                // Set the request date if we are newly enabling the document request
                // or if it's already enabled and we are updating the message
                if (requiresDocument) {
                    updatedStudent.visaInformation.universityApplication.universities[selectedApp.idx].documentRequestDate =
                        updatedStudent.visaInformation.universityApplication.universities[selectedApp.idx].documentRequestDate || new Date().toISOString();
                } else {
                    // Clear the date if request is toggled off
                    delete updatedStudent.visaInformation.universityApplication.universities[selectedApp.idx].documentRequestDate;
                }

                updatedStudent.visaInformation.universityApplication.universities[selectedApp.idx].requiresDocument = requiresDocument;

                await api.saveContact(updatedStudent, false);

                // Update local state
                setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
                setSelectedApp({
                    ...selectedApp,
                    student: updatedStudent,
                    app: updatedStudent.visaInformation.universityApplication.universities[selectedApp.idx]
                });
                setEditingRemarks(false);
            }
        } catch (error) {
            console.error('Failed to save student remark:', error);
            alert('Failed to save student remark');
        } finally {
            setSavingStudentRemark(false);
        }
    };

    const handleSaveInternalNote = async (newNote: string) => {
        if (!selectedApp) return;
        setSavingInternalNote(true);
        try {
            const updatedStudent = { ...selectedApp.student };
            if (updatedStudent.visaInformation?.universityApplication?.universities) {
                updatedStudent.visaInformation.universityApplication.universities[selectedApp.idx].internalNote = newNote;

                await api.saveContact(updatedStudent, false);

                // Update local state
                setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
                setSelectedApp({
                    ...selectedApp,
                    student: updatedStudent,
                    app: updatedStudent.visaInformation.universityApplication.universities[selectedApp.idx]
                });
                setEditingInternalNote(false);
            }
        } catch (error) {
            console.error('Failed to save internal note:', error);
            alert('Failed to save internal note');
        } finally {
            setSavingInternalNote(false);
        }
    };

    const allApps = students.flatMap(student =>
        (student.visaInformation?.universityApplication?.universities || [])
            .filter(u => u.universityName)
            .map((app, idx) => ({ student, app, idx }))
    );

    const filteredApps = allApps.filter(item => {
        const matchesSearch =
            (item.student.name && item.student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.app.universityName && item.app.universityName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.app.ackNumber && item.app.ackNumber.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = filterStatus === 'All' || item.app.status === filterStatus;

        // Check if application is completed
        const isCompleted = ['Received I20', 'Rejected', 'Application Deferred'].includes(item.app.status);

        let matchesTab = false;
        if (activeTab === 'ongoing' && !isCompleted) matchesTab = true;
        if (activeTab === 'completed' && isCompleted) matchesTab = true;

        return matchesSearch && matchesStatus && matchesTab;
    }).sort((a, b) => {
        const ackA = a.app.ackNumber || '';
        const ackB = b.app.ackNumber || '';
        return ackB.localeCompare(ackA, undefined, { numeric: true, sensitivity: 'base' });
    });

    const getStatusColor = (status: string) => {
        const colors: any = {
            'Shortlisted': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
            'Applied': 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
            'In Review': 'bg-violet-100 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
            'Offer Received': 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
            'On Hold': 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
            'Rejected': 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
            'Application Deferred': 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
        };
        return colors[status] || colors['Shortlisted'];
    };

    return (
        <div className="h-full flex flex-col bg-[#f8fafc] dark:bg-[#0f172a] p-8 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="w-12 h-12 rounded-2xl bg-lyceum-blue text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <GraduationCap size={28} />
                        </div>
                        Application Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Verify credentials and manage student admission statuses</p>

                    {/* Tabs */}
                    <div className="flex gap-4 mt-6 border-b border-gray-200 dark:border-gray-800">
                        <button
                            onClick={() => setActiveTab('ongoing')}
                            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'ongoing'
                                ? 'border-lyceum-blue text-lyceum-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Ongoing Applications
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'completed'
                                ? 'border-lyceum-blue text-lyceum-blue'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Completed Applications
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-auto mb-2">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lyceum-blue transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search student, university, or ACK..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white w-full md:w-80 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-lyceum-blue outline-none transition-all"
                        />
                    </div>

                    <div className="relative flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-1.5 shadow-sm">
                        <Filter size={16} className="text-gray-400 mr-2" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-0 outline-none cursor-pointer py-2 pl-0 pr-8"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Applied">Applied</option>
                            <option value="In Review">In Review</option>
                            <option value="Offer Received">Offer Received</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Application Deferred">Application Deferred</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchStudents}
                        className="p-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 hover:text-lyceum-blue hover:border-lyceum-blue transition-all shadow-sm"
                        title="Refresh Data"
                    >
                        <Clock size={20} />
                    </button>

                    <button
                        onClick={() => setShowApplyModal(true)}
                        className="hidden sm:flex items-center gap-2 px-6 py-3.5 bg-lyceum-blue hover:bg-blue-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-lyceum-blue/20"
                    >
                        <Plus size={18} />
                        Apply University
                    </button>

                    {/* Mobile Apply Button */}
                    <button
                        onClick={() => setShowApplyModal(true)}
                        className="sm:hidden p-3.5 bg-lyceum-blue hover:bg-blue-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-lyceum-blue/20"
                        title="Apply University"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-lyceum-blue rounded-full animate-spin" />
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-gray-800/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-800">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
                            <SearchIcon size={32} className="text-gray-300" />
                        </div>
                        <p className="text-xl font-bold text-gray-400">No applications found matching your criteria</p>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto bg-white dark:bg-[#1a1d24] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-[#1e2330]/50 border-b border-gray-100 dark:border-gray-800/60 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-4 font-extrabold rounded-tl-2xl">ACK Number</th>
                                    <th className="px-6 py-4 font-extrabold">Applicant</th>
                                    <th className="px-6 py-4 font-extrabold">University & Course</th>
                                    <th className="px-6 py-4 font-extrabold">Degree</th>
                                    <th className="px-6 py-4 font-extrabold">Submission Date</th>
                                    <th className="px-6 py-4 font-extrabold">Status</th>
                                    <th className="px-6 py-4 font-extrabold text-right rounded-tr-2xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40">
                                {filteredApps.map((item, i) => {
                                    const statusColorClass = getStatusColor(item.app.status);

                                    return (
                                        <tr
                                            key={`${item.student.id}-${item.idx}`}
                                            className="group hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                            onClick={() => handleSelectApp(item)}
                                        >
                                            <td className="px-6 py-4">
                                                {item.app.ackNumber ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-extrabold text-xs tracking-widest text-lyceum-blue uppercase">
                                                            {item.app.ackNumber}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.app.ackNumber || ''); }}
                                                            className="text-gray-300 hover:text-lyceum-blue transition-colors outline-none"
                                                            title="Copy ACK"
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.student.name}</span>
                                                    <span className="text-[11px] text-gray-500 truncate mt-0.5">{item.student.email}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col min-w-0 max-w-[250px] lg:max-w-xs">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate" title={item.app.universityName}>
                                                        {item.app.universityName}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate mt-0.5">
                                                        <School size={10} className="shrink-0" />
                                                        <span className="truncate" title={item.app.course}>{item.app.course}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {item.app.degree ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                                            <GraduationCap size={14} />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                                                            {item.app.degree}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                    <Calendar size={12} className="text-gray-400 shrink-0" />
                                                    {editingDateAppIdx?.studentId === item.student.id && editingDateAppIdx?.appIdx === item.idx ? (
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="date"
                                                                value={newDateValue}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => setNewDateValue(e.target.value)}
                                                                className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-xs focus:ring-2 focus:ring-lyceum-blue focus:border-lyceum-blue outline-none"
                                                            />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdateSubmissionDate(item.student, item.idx);
                                                                }}
                                                                disabled={updating}
                                                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingDateAppIdx(null);
                                                                }}
                                                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 group/date cursor-pointer">
                                                            <span>{item.app.applicationSubmissionDate ? new Date(item.app.applicationSubmissionDate).toLocaleDateString() : 'N/A'}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingDateAppIdx({ studentId: item.student.id, appIdx: item.idx });
                                                                    try {
                                                                        setNewDateValue(item.app.applicationSubmissionDate ? new Date(item.app.applicationSubmissionDate).toISOString().split('T')[0] : '');
                                                                    } catch {
                                                                        setNewDateValue('');
                                                                    }
                                                                }}
                                                                className="opacity-0 group-hover/date:opacity-100 text-gray-400 hover:text-lyceum-blue transition-opacity"
                                                            >
                                                                <Edit3 size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className={`inline-flex px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${statusColorClass} items-center gap-1.5`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
                                                    {item.app.status}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSelectApp(item); }}
                                                    className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 group-hover:text-lyceum-blue group-hover:bg-lyceum-blue/10 transition-colors"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal Overlay */}
            {selectedApp && (
                <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => { setSelectedApp(null); setIsSidebarExpanded(false); setShowDocuments(false); setShowCredentials(false); }} />
                    <div className="relative w-full h-full bg-[#fcfcfd] dark:bg-[#0f172a] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">

                        {/* Left: Student Profile & Stats */}
                        <div
                            className={`hidden md:flex flex-col bg-white dark:bg-[#151c2f] border-r border-gray-100 dark:border-gray-800/60 shrink-0 overflow-y-auto transition-all duration-300 custom-scrollbar ${isSidebarExpanded ? 'w-[400px] lg:w-[450px] p-8 lg:p-12 cursor-default' : 'w-[120px] p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1e2330]'}`}
                            onClick={() => !isSidebarExpanded && setIsSidebarExpanded(true)}
                            title={!isSidebarExpanded ? "Click to expand student details" : ""}
                        >
                            {isSidebarExpanded && (
                                <div className="flex justify-start mb-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsSidebarExpanded(false); }}
                                        className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                                    >
                                        <ChevronRight size={16} className="rotate-180" /> Minimize
                                    </button>
                                </div>
                            )}

                            <div className={`text-center flex flex-col items-center justify-start ${isSidebarExpanded ? 'mb-8 mt-4' : 'mt-0 shrink-0'}`}>
                                <div className={`${isSidebarExpanded ? 'w-24 h-24 text-4xl mb-4' : 'w-16 h-16 text-2xl mb-3'} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-xl shadow-blue-500/20 uppercase transition-all duration-300 shrink-0`}>
                                    {selectedApp.student.name.charAt(0)}
                                </div>
                                <h2 className={`${isSidebarExpanded ? 'text-xl' : 'text-[11px]'} font-black text-gray-900 dark:text-white leading-tight transition-all duration-300 ${!isSidebarExpanded && 'break-words w-full text-center'}`}>
                                    {isSidebarExpanded ? selectedApp.student.name : selectedApp.student.name.split(' ')[0]}
                                </h2>
                                {isSidebarExpanded && (
                                    <p className="text-sm text-gray-500 font-medium mt-1 animate-in fade-in zoom-in duration-300">{selectedApp.student.email}</p>
                                )}
                            </div>

                            {isSidebarExpanded && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-[24px] border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <BookOpen size={12} /> Academic Record
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold mb-0.5">SSC</p>
                                                <p className="text-lg font-black text-gray-900 dark:text-white">{selectedApp.student.visaInformation?.universityApplication?.academicInformation?.sscPercentage || '0'}%</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold mb-0.5">INTER</p>
                                                <p className="text-lg font-black text-gray-900 dark:text-white">{selectedApp.student.visaInformation?.universityApplication?.academicInformation?.intermediatePercentage || '0'}%</p>
                                            </div>
                                        </div>
                                        {selectedApp.student.visaInformation?.universityApplication?.academicInformation?.degreePercentage && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                                                <p className="text-[10px] text-gray-500 font-bold">DEGREE</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-white">{selectedApp.student.visaInformation.universityApplication.academicInformation.degreePercentage}%</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-[24px] border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Languages size={12} /> English Proficiency
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{selectedApp.student.visaInformation?.universityApplication?.languageProficiency?.languageProficiency || 'None'}</p>
                                            <div className="px-3 py-1 bg-lyceum-blue text-white rounded-lg text-xs font-black">
                                                {selectedApp.student.visaInformation?.universityApplication?.languageProficiency?.score || '0'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <a href={`mailto:${selectedApp.student.email}`} className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-lyceum-blue hover:text-lyceum-blue transition-all">
                                            <Mail size={18} /> Send Email
                                        </a>
                                        <a href={`tel:${selectedApp.student.phone}`} className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-lyceum-blue hover:text-lyceum-blue transition-all">
                                            <Phone size={18} /> Call Student
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Application Details & Management */}
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            {/* Header — flex sibling to scroll area */}
                            <div className={`relative w-full shrink-0 transition-all duration-700 ease-in-out border-b overflow-hidden tracking-tight ${modalScrollAmount > 50
                                ? 'h-20 sm:h-24 border-gray-200/50 dark:border-gray-800/50 shadow-sm'
                                : 'h-36 sm:h-40 border-transparent'
                                }`}>

                                {/* Layered backgrounds — cross-fade for smooth transition */}
                                <div className={`absolute inset-0 pointer-events-none bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl transition-opacity duration-700 ${modalScrollAmount > 50 ? 'opacity-100' : 'opacity-0'}`} />
                                <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-[#0f172a] dark:via-[#0f172a] dark:to-blue-950/20 transition-opacity duration-700 ${modalScrollAmount > 50 ? 'opacity-0' : 'opacity-100'}`} />

                                <div className="relative max-w-7xl mx-auto flex items-center justify-between h-full px-8 lg:px-12">
                                    <div className="flex items-center gap-6 md:gap-8 transition-all duration-500">
                                        <div className={`transition-all duration-500 rounded-[32px] bg-white shadow-2xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 dark:border-white/5 ${modalScrollAmount > 50 ? 'w-14 h-14 p-2' : 'w-24 h-24 md:w-28 md:h-28 p-4'}`}>
                                            {(() => {
                                                const lUrl = selectedApp.app.logoUrl || universityCourses.find(uc => uc.universityName === selectedApp.app.universityName)?.logoUrl;
                                                return lUrl ? (
                                                    <img src={`${api.API_BASE_URL}${lUrl}`} alt="" className="w-full h-full object-contain" />
                                                ) : (
                                                    <span className={`font-black text-gray-400 transition-all duration-500 ${modalScrollAmount > 50 ? 'text-xl' : 'text-4xl'}`}>
                                                        {selectedApp.app.universityName.charAt(0)}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div>
                                            <div className={`flex flex-wrap items-center gap-2 text-[11px] font-black tracking-widest uppercase transition-all duration-500 overflow-hidden ${modalScrollAmount > 50 ? 'opacity-0 max-h-0 mb-0' : 'opacity-100 max-h-16 mb-2'}`}>
                                                <span className="text-lyceum-blue bg-blue-100 dark:bg-blue-500/20 px-3 py-1 border border-blue-200/50 dark:border-blue-500/30 rounded-xl">{selectedApp.app.ackNumber || 'NO-ACK'}</span>
                                            </div>
                                            <h2 className={`font-black text-gray-900 dark:text-white leading-tight tracking-tight flex flex-wrap items-center gap-3 transition-all duration-500 ${modalScrollAmount > 50 ? 'text-xl sm:text-2xl mb-0' : 'text-2xl md:text-3xl lg:text-4xl mb-1'}`}>
                                                {selectedApp.app.universityName}
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => { setShowDocuments(true); setShowCredentials(false); }} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-lyceum-blue hover:text-white dark:bg-gray-800 dark:hover:bg-lyceum-blue text-xs font-bold text-gray-600 dark:text-gray-300 rounded-xl transition-all shadow-sm">
                                                        <Folder size={13} /> Documents
                                                    </button>
                                                    <button onClick={() => { setShowCredentials(true); setShowDocuments(false); }} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-emerald-500 hover:text-white dark:bg-gray-800 dark:hover:bg-emerald-500 text-xs font-bold text-gray-600 dark:text-gray-300 rounded-xl transition-all shadow-sm">
                                                        <Key size={13} /> Credentials
                                                    </button>
                                                    <button onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log("Create Task clicked! showing modal...");
                                                        setPrefilledTask({
                                                            contactId: selectedApp.student.id,
                                                            title: `Task for ${selectedApp.app.universityName} - ${selectedApp.app.course}`,
                                                            description: `Regarding application ACK: ${selectedApp.app.ackNumber || 'N/A'}`
                                                        });
                                                        setShowTaskModal(true);
                                                        console.log("showTaskModal is set to true");
                                                    }} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-lyceum-blue hover:text-white dark:bg-gray-800 dark:hover:bg-lyceum-blue text-xs font-bold text-gray-600 dark:text-gray-300 rounded-xl transition-all shadow-sm">
                                                        <ClipboardList size={13} /> Create Task
                                                    </button>
                                                    {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'staff') && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteApplication(selectedApp.student, selectedApp.idx);
                                                            }}
                                                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-red-500 hover:text-white dark:bg-gray-800 dark:hover:bg-red-500 text-xs font-bold text-gray-600 dark:text-gray-300 rounded-xl transition-all shadow-sm"
                                                            title="Delete Application"
                                                        >
                                                            <Trash2 size={13} /> Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </h2>
                                            <p className={`font-bold text-lyceum-blue uppercase tracking-widest transition-all duration-500 ${modalScrollAmount > 50 ? 'text-[10px]' : 'text-sm'}`}>
                                                {selectedApp.app.course}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setSelectedApp(null); setIsSidebarExpanded(false); setShowDocuments(false); setShowCredentials(false); }} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all shrink-0">
                                        <X size={28} />
                                    </button>
                                </div>
                            </div>

                            {/* Scroll Area — sibling to header, no sticky needed */}
                            <div
                                ref={modalScrollRef}
                                onScroll={(e) => setModalScrollAmount(e.currentTarget.scrollTop)}
                                className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] dark:bg-[#0f172a]"
                            >
                                <div className="px-8 lg:px-12 py-10">

                                    {showDocuments ? (
                                        <div className="w-full max-w-7xl mx-auto">
                                            <ContactDocumentsView
                                                contact={selectedApp.student}
                                                onNavigateBack={() => setShowDocuments(false)}
                                                onAnalyze={async () => { /* Add analysis logic if needed */ }}
                                                user={user}
                                            />
                                        </div>
                                    ) : showCredentials ? (
                                        <div className="w-full max-w-7xl mx-auto">
                                            <ApplicationCredentialsView
                                                contact={selectedApp.student}
                                                onNavigateBack={() => setShowCredentials(false)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 max-w-7xl">
                                            {/* Timeline & Progress */}
                                            <div className="xl:col-span-8 space-y-8">
                                                <div className="bg-white dark:bg-[#1e2330]/50 rounded-[40px] p-10 border border-gray-100 dark:border-gray-800/60 shadow-lg">
                                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-lyceum-blue mb-10 flex items-center justify-between">
                                                        <span>Application Progress</span>
                                                        <div className="flex items-center gap-3">
                                                            {selectedApp.app.status === 'Application Deferred' && (
                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                                    <Clock size={12} className="text-red-500" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Application Deferred</span>
                                                                </div>
                                                            )}
                                                            {selectedApp.app.intake && (
                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                                    <Calendar size={12} className="text-amber-600 dark:text-amber-400" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">{selectedApp.app.intake}</span>
                                                                </div>
                                                            )}
                                                            {selectedApp.app.applicationSubmissionDate && (
                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                                    <Clock size={12} className="text-emerald-500" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                                                        {Math.floor((new Date().getTime() - new Date(selectedApp.app.applicationSubmissionDate).getTime()) / (1000 * 60 * 60 * 24))} Days
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </h4>

                                                    <div className="relative pt-6 pb-4">
                                                        <div className="absolute top-[38px] left-12 right-12 h-1.5 bg-gray-50 dark:bg-gray-900 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                                                style={{ width: ['Offer Received', 'Received Acceptance', 'Received I20'].includes(selectedApp.app.status === 'Application Deferred' ? selectedApp.app.previousStatus : selectedApp.app.status) ? '100%' : ['In Review', 'On Hold'].includes(selectedApp.app.status === 'Application Deferred' ? selectedApp.app.previousStatus : selectedApp.app.status) ? '66.6%' : (selectedApp.app.status === 'Application Deferred' ? selectedApp.app.previousStatus : selectedApp.app.status) === 'Applied' ? '33.3%' : '0%' }}
                                                            />
                                                        </div>

                                                        <div className="flex justify-between relative z-10 px-6">
                                                            {[
                                                                { status: 'Shortlisted', icon: <Bookmark size={14} /> },
                                                                { status: 'Applied', icon: <FileText size={14} /> },
                                                                {
                                                                    status: (selectedApp.app.status === 'Application Deferred' ? selectedApp.app.previousStatus : selectedApp.app.status) === 'On Hold' ? 'On Hold' : 'In Review',
                                                                    icon: (selectedApp.app.status === 'Application Deferred' ? selectedApp.app.previousStatus : selectedApp.app.status) === 'On Hold' ? <AlertCircle size={14} /> : <SearchIcon size={14} />
                                                                },
                                                                {
                                                                    status: (selectedApp.app.status === 'Application Deferred' ? selectedApp.app.previousStatus : selectedApp.app.status) === 'Received Acceptance' ? 'Acceptance Received' :
                                                                        (selectedApp.app.status === 'Application Deferred' ? selectedApp.app.previousStatus : selectedApp.app.status) === 'Received I20' ? 'I20 Received' : 'Offer Received',
                                                                    icon: <Award size={14} />
                                                                }
                                                            ].map((stage, i) => {
                                                                const displayStatus = selectedApp.app.status === 'Application Deferred' ? selectedApp.app.previousStatus : selectedApp.app.status;
                                                                const isPassed = (['Offer Received', 'Received Acceptance', 'Received I20'].includes(displayStatus)) || (['In Review', 'On Hold'].includes(displayStatus) && i <= 2) || (displayStatus === 'Applied' && i <= 1) || (displayStatus === 'Shortlisted' && i === 0);
                                                                const isCurrent = (i === 3 && ['Offer Received', 'Received Acceptance', 'Received I20'].includes(displayStatus)) ||
                                                                    (i === 2 && (displayStatus === 'In Review' || displayStatus === 'On Hold')) ||
                                                                    displayStatus === stage.status;

                                                                return (
                                                                    <div key={stage.status} className="w-12 flex flex-col items-center gap-4">
                                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 ${isPassed
                                                                            ? (isCurrent && selectedApp.app.status === 'On Hold' ? 'bg-amber-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600') + ' text-white shadow-xl shadow-blue-500/30'
                                                                            : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'
                                                                            } ${isCurrent ? 'scale-110 ring-4 ring-blue-500/10' : ''}`}>
                                                                            {isCurrent ? <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" /> : stage.icon}
                                                                        </div>
                                                                        <span className={`text-[10px] font-black tracking-widest uppercase transition-colors duration-300 ${isCurrent ? (displayStatus === 'On Hold' ? 'text-amber-600' : 'text-lyceum-blue') : 'text-gray-400'}`}>{stage.status}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white dark:bg-[#1e2330]/50 rounded-[40px] p-10 border border-gray-100 dark:border-gray-800/60 shadow-lg flex flex-col">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-[11px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                            <Sparkles size={14} className="text-lyceum-blue" />
                                                            Student Portal Remark
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => selectedApp && handleSelectApp(selectedApp)}
                                                                className={`p-1.5 text-gray-400 hover:text-lyceum-blue hover:bg-lyceum-blue/10 rounded-lg transition-all ${refreshing ? 'animate-spin text-lyceum-blue' : ''}`}
                                                                title="Refresh Status"
                                                            >
                                                                <Clock size={14} />
                                                            </button>
                                                            {user?.role?.toLowerCase() === 'admin' && (
                                                                <button
                                                                    onClick={() => setShowMessageManager(!showMessageManager)}
                                                                    className={`p-1.5 rounded-lg transition-all ${showMessageManager ? 'text-lyceum-blue bg-lyceum-blue/10' : 'text-gray-400 hover:text-lyceum-blue hover:bg-lyceum-blue/10'}`}
                                                                    title="Manage Suggestions"
                                                                >
                                                                    <Settings size={14} />
                                                                </button>
                                                            )}
                                                            {!editingRemarks ? (
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingRemarks(true);
                                                                        setStudentRemarkInput(selectedApp.app.studentRemark || '');
                                                                        setRequiresDocToggle(selectedApp.app.requiresDocument || false);
                                                                    }}
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-lyceum-blue/10 hover:bg-lyceum-blue/20 text-lyceum-blue rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                                >
                                                                    <Edit3 size={12} />
                                                                    Edit
                                                                </button>
                                                            ) : (
                                                                <div className="flex items-center gap-4">
                                                                    <button
                                                                        onClick={() => setEditingRemarks(false)}
                                                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-[10px] font-bold uppercase tracking-widest transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleSaveStudentRemark(studentRemarkInput, requiresDocToggle)}
                                                                        disabled={savingStudentRemark}
                                                                        className="text-lyceum-blue hover:text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors disabled:opacity-50"
                                                                    >
                                                                        {savingStudentRemark ? <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <Mail size={12} />}
                                                                        Message
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {showMessageManager && user?.role?.toLowerCase() === 'admin' && (
                                                        <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-lyceum-blue/20 animate-in fade-in slide-in-from-top-4 duration-300">
                                                            <div className="flex items-center justify-between mb-6">
                                                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-lyceum-blue flex items-center gap-2">
                                                                    <Settings size={14} />
                                                                    Manage Predefined Suggestions
                                                                </h5>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingMsgIdx(null);
                                                                        setMsgInput('');
                                                                        setMsgRequiresDoc(false);
                                                                        setShowMessageManager(false);
                                                                    }}
                                                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>

                                                            <div className="space-y-4 mb-8">
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    <textarea
                                                                        value={msgInput}
                                                                        onChange={(e) => setMsgInput(e.target.value)}
                                                                        className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 focus:border-lyceum-blue rounded-2xl text-sm outline-none transition-all placeholder:text-gray-400"
                                                                        placeholder="Type message text..."
                                                                        rows={2}
                                                                    />
                                                                    <div className="flex items-center justify-between">
                                                                        <label className="flex items-center gap-3 cursor-pointer group">
                                                                            <div
                                                                                onClick={() => setMsgRequiresDoc(!msgRequiresDoc)}
                                                                                className={`w-10 h-5 rounded-full relative transition-all ${msgRequiresDoc ? 'bg-amber-500' : 'bg-gray-300'}`}
                                                                            >
                                                                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${msgRequiresDoc ? 'left-5.5' : 'left-0.5'}`} />
                                                                            </div>
                                                                            <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                                                                Triggers Document Upload
                                                                            </span>
                                                                        </label>
                                                                        <button
                                                                            onClick={handleAddOrUpdateMessage}
                                                                            disabled={!msgInput.trim()}
                                                                            className="flex items-center gap-2 px-6 py-2 bg-lyceum-blue text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                                                        >
                                                                            {editingMsgIdx !== null ? <Save size={14} /> : <Plus size={14} />}
                                                                            {editingMsgIdx !== null ? 'Update' : 'Add Message'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                                {predefinedMessages.map((msg: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group hover:border-lyceum-blue/30 transition-all">
                                                                        <div className="flex-1 min-w-0 pr-4">
                                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{msg.text}</p>
                                                                            {msg.requiresDoc && <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Sets Doc Flag</span>}
                                                                        </div>
                                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingMsgIdx(idx);
                                                                                    setMsgInput(msg.text);
                                                                                    setMsgRequiresDoc(msg.requiresDoc);
                                                                                }}
                                                                                className="p-1.5 text-gray-400 hover:text-lyceum-blue hover:bg-lyceum-blue/10 rounded-lg transition-all"
                                                                            >
                                                                                <Edit3 size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteMessage(idx)}
                                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!editingRemarks ? (
                                                        <div className="space-y-4">
                                                            <div className="p-5 bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20 min-h-[100px] text-sm text-gray-600 dark:text-gray-300 font-medium whitespace-pre-wrap">
                                                                {selectedApp.app.studentRemark || "No student remarks provided yet."}
                                                            </div>
                                                            <div className="flex flex-wrap gap-3">
                                                                {selectedApp.app.requiresDocument && (
                                                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-bold">
                                                                        <FileText size={14} />
                                                                        Document Request Active
                                                                    </div>
                                                                )}
                                                                {selectedApp.app.requiresDocument && selectedApp.app.documentRequestDate && selectedApp.student.documents?.some(doc => {
                                                                    const uploadTime = new Date(doc.uploaded_at).getTime();
                                                                    const requestTime = new Date(selectedApp.app.documentRequestDate).getTime();
                                                                    return !isNaN(uploadTime) && !isNaN(requestTime) && uploadTime > requestTime;
                                                                }) && (
                                                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-pulse">
                                                                            <CheckCircle size={14} />
                                                                            Received requested document
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="relative">
                                                                <textarea
                                                                    value={studentRemarkInput}
                                                                    onChange={(e) => {
                                                                        setStudentRemarkInput(e.target.value);
                                                                        setShowSuggestions(true);
                                                                    }}
                                                                    onFocus={() => setShowSuggestions(true)}
                                                                    className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-lyceum-blue/30 focus:border-lyceum-blue rounded-2xl text-sm text-gray-900 dark:text-gray-100 min-h-[120px] outline-none transition-all custom-scrollbar resize-y"
                                                                    placeholder="Type public message for student portal here..."
                                                                    autoFocus
                                                                />
                                                                {showSuggestions && studentRemarkInput.length > 0 && (
                                                                    <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto p-2 custom-scrollbar">
                                                                        {predefinedMessages.filter((m: any) => m.text.toLowerCase().includes(studentRemarkInput.toLowerCase())).length > 0 ? (
                                                                            predefinedMessages.filter((m: any) => m.text.toLowerCase().includes(studentRemarkInput.toLowerCase())).map((msg: any, idx: number) => (
                                                                                <button
                                                                                    key={idx}
                                                                                    onClick={() => {
                                                                                        setStudentRemarkInput(msg.text);
                                                                                        setRequiresDocToggle(msg.requiresDoc);
                                                                                        setShowSuggestions(false);
                                                                                    }}
                                                                                    className="w-full text-left px-4 py-3 hover:bg-lyceum-blue/5 rounded-xl transition-colors flex items-center gap-3 group"
                                                                                >
                                                                                    <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 group-hover:text-lyceum-blue transition-colors">
                                                                                        <SearchIcon size={14} />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{msg.text}</p>
                                                                                        {msg.requiresDoc && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-0.5 block">Triggers Doc Upload</span>}
                                                                                    </div>
                                                                                </button>
                                                                            ))
                                                                        ) : (
                                                                            <div className="p-4 text-center text-xs text-gray-400 font-medium">No matching predefined messages</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-wrap gap-2 text-left">
                                                                <p className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quick Suggestions</p>
                                                                {[...predefinedMessages].reverse().slice(0, 20).map((msg: any, idx: number) => (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={() => {
                                                                            setStudentRemarkInput(msg.text);
                                                                            setRequiresDocToggle(msg.requiresDoc);
                                                                        }}
                                                                        className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-lyceum-blue/10 border border-gray-100 dark:border-gray-700 rounded-xl text-[11px] font-bold text-gray-500 dark:text-gray-400 transition-all text-left max-w-[200px] truncate"
                                                                    >
                                                                        {msg.text}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${requiresDocToggle ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-500'}`}>
                                                                        <Folder size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Requires Document Upload</p>
                                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Show upload button in student portal</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => setRequiresDocToggle(!requiresDocToggle)}
                                                                    className={`w-14 h-7 rounded-full relative transition-all duration-300 ${requiresDocToggle ? 'bg-lyceum-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                                                                >
                                                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${requiresDocToggle ? 'left-8' : 'left-1'}`} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {['admin', 'staff'].includes(user?.role?.toLowerCase()) && (
                                                    <div className="bg-white dark:bg-[#1e2330]/50 rounded-[40px] p-10 border border-amber-100 dark:border-amber-900/40 shadow-lg flex flex-col relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 -mr-10 -mt-10 rounded-full blur-2xl pointer-events-none" />

                                                        <div className="flex items-center justify-between mb-6">
                                                            <h4 className="text-[11px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                                                <FileText size={14} />
                                                                Internal Staff Notes
                                                            </h4>
                                                            <div className="flex items-center gap-2">
                                                                {!editingInternalNote ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingInternalNote(true);
                                                                            setInternalNoteInput(selectedApp.app.internalNote || '');
                                                                        }}
                                                                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                                    >
                                                                        <Edit3 size={12} />
                                                                        Edit
                                                                    </button>
                                                                ) : (
                                                                    <div className="flex items-center gap-4">
                                                                        <button
                                                                            onClick={() => setEditingInternalNote(false)}
                                                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-[10px] font-bold uppercase tracking-widest transition-colors"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSaveInternalNote(internalNoteInput)}
                                                                            disabled={savingInternalNote}
                                                                            className="text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors disabled:opacity-50"
                                                                        >
                                                                            {savingInternalNote ? <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <Save size={12} />}
                                                                            Save Note
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {!editingInternalNote ? (
                                                            <div className="p-5 bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl border border-amber-100/50 dark:border-amber-500/10 min-h-[80px] text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap">
                                                                {selectedApp.app.internalNote || (
                                                                    <span className="text-gray-400 italic">No internal staff notes documented yet.</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <textarea
                                                                value={internalNoteInput}
                                                                onChange={(e) => setInternalNoteInput(e.target.value)}
                                                                className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-amber-700/50 focus:border-amber-400 rounded-2xl text-sm text-gray-900 dark:text-gray-100 min-h-[120px] outline-none transition-all custom-scrollbar resize-y"
                                                                placeholder="Type private notes visible only to staff here..."
                                                                autoFocus
                                                            />
                                                        )}
                                                    </div>
                                                )}

                                                <div className="bg-white dark:bg-[#1e2330]/50 rounded-[40px] p-10 border border-gray-100 dark:border-gray-800/60 shadow-lg flex flex-col">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">System Logs</h4>
                                                    </div>
                                                    <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 max-h-[250px] overflow-y-auto text-[13px] text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-medium custom-scrollbar">
                                                        {selectedApp.app.remarks || "No operational logs yet."}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sidebar: Actions */}
                                            <div className="xl:col-span-4 space-y-8 text-center">
                                                <div className="bg-gray-900 dark:bg-black rounded-[40px] p-10 text-white shadow-2xl">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Update Pipeline</h4>
                                                    <div className="space-y-3">
                                                        <button
                                                            onClick={() => handleUpdateStatus(selectedApp.student, selectedApp.idx, 'Applied')}
                                                            disabled={updating || selectedApp.app.status === 'Applied' || selectedApp.app.status === 'Application Deferred'}
                                                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                        >
                                                            <FileText size={16} /> Mark as Applied
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(selectedApp.student, selectedApp.idx, 'In Review')}
                                                            disabled={updating || selectedApp.app.status === 'In Review' || selectedApp.app.status === 'Application Deferred'}
                                                            className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                        >
                                                            <SearchIcon size={16} /> Start Review
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(selectedApp.student, selectedApp.idx, 'On Hold')}
                                                            disabled={updating || selectedApp.app.status === 'On Hold' || selectedApp.app.status === 'Application Deferred'}
                                                            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                        >
                                                            <AlertCircle size={16} /> Mark On Hold
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(selectedApp.student, selectedApp.idx, 'Received Acceptance')}
                                                            disabled={updating || selectedApp.app.status === 'Received Acceptance' || selectedApp.app.status === 'Application Deferred'}
                                                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                        >
                                                            <Award size={16} /> Received Acceptance
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(selectedApp.student, selectedApp.idx, 'Received I20')}
                                                            disabled={updating || selectedApp.app.status === 'Received I20' || selectedApp.app.status === 'Application Deferred'}
                                                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                        >
                                                            <Award size={16} /> Received I20
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(selectedApp.student, selectedApp.idx, 'Rejected')}
                                                            disabled={updating || selectedApp.app.status === 'Rejected' || selectedApp.app.status === 'Application Deferred'}
                                                            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                        >
                                                            <X size={16} /> Reject App
                                                        </button>
                                                    </div>

                                                    {selectedApp.app.status !== 'Application Deferred' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeferApplication(selectedApp.student, selectedApp.idx);
                                                            }}
                                                            disabled={updating}
                                                            className="w-full mt-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-black rounded-2xl text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 group border border-slate-700 hover:border-slate-600 shadow-sm"
                                                        >
                                                            <Clock size={14} className="transition-transform group-hover:-rotate-90" /> Defer Application
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="bg-[#1e2330]/50 p-8 border border-gray-800/60 rounded-[40px] shadow-lg">
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-6">Financials</p>
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center px-2">
                                                            <span className="text-xs font-bold text-gray-500">App Fee</span>
                                                            <span className="text-sm font-black text-white">${selectedApp.app.applicationFee || '0'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center px-2">
                                                            <span className="text-xs font-bold text-gray-500">Deposit</span>
                                                            <span className="text-sm font-black text-emerald-500">${selectedApp.app.enrollmentDeposit || '0'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ManualApplicationModal
                isOpen={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                onSuccess={() => {
                    fetchStudents();
                }}
            />

            <TaskModal
                isOpen={showTaskModal}
                onClose={() => { setShowTaskModal(false); setPrefilledTask(null); }}
                onSave={handleSaveTask}
                editTask={prefilledTask}
                currentUserId={user.id}
                contacts={originalContacts}
            />
        </div >
    );
};

export default UniversityApplicationView;
