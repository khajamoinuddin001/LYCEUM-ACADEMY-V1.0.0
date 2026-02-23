import React, { useState, useEffect } from 'react';
import { Contact } from '@/types';
import * as api from '@/utils/api';
import {
    GraduationCap, Search, School, Globe2, Calendar,
    CheckCircle2, Clock, Filter, ChevronRight, X,
    Check, Bookmark, FileText, Search as SearchIcon,
    Award, Copy, ArrowRight, User as UserIcon, Mail,
    Phone, Briefcase, Trash2, Edit3, MoreVertical,
    AlertCircle, CheckCircle, BookOpen, Languages
} from 'lucide-react';

interface UniversityApplicationViewProps {
    user: any;
}

const UniversityApplicationView: React.FC<UniversityApplicationViewProps> = ({ user }) => {
    const [students, setStudents] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [expandedStudent, setExpandedStudent] = useState<Contact | null>(null);
    const [selectedApp, setSelectedApp] = useState<{ student: Contact; app: any; idx: number } | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getContacts();

            // Deduplicate contacts by userId or email to match student portal logic
            const uniqueContactsMap = new Map();
            data.forEach(c => {
                const identifier = c.userId || c.email || c.id;
                // Keep the first contact found for each user, matching .find() behavior in student portal
                if (!uniqueContactsMap.has(identifier)) {
                    uniqueContactsMap.set(identifier, c);
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
            setLoading(false);
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

    const allApps = students.flatMap(student =>
        (student.visaInformation?.universityApplication?.universities || [])
            .filter(u => u.universityName)
            .map((app, idx) => ({ student, app, idx }))
    );

    const filteredApps = allApps.filter(item => {
        const matchesSearch =
            item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.app.universityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.app.ackNumber && item.app.ackNumber.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = filterStatus === 'All' || item.app.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        const colors: any = {
            'Shortlisted': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
            'Applied': 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
            'In Review': 'bg-violet-100 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
            'Offer Received': 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
            'Rejected': 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
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
                </div>

                <div className="flex items-center gap-3">
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
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchStudents}
                        className="p-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 hover:text-lyceum-blue hover:border-lyceum-blue transition-all shadow-sm"
                    >
                        <Clock size={20} />
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
                                            onClick={() => setSelectedApp(item)}
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
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    {item.app.applicationSubmissionDate ? new Date(item.app.applicationSubmissionDate).toLocaleDateString() : 'N/A'}
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
                                                    onClick={(e) => { e.stopPropagation(); setSelectedApp(item); }}
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
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedApp(null)} />
                    <div className="relative w-full h-full bg-[#fcfcfd] dark:bg-[#0f172a] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">

                        {/* Left: Student Profile & Stats */}
                        <div className="w-full md:w-[400px] lg:w-[450px] bg-white dark:bg-[#151c2f] border-r border-gray-100 dark:border-gray-800/60 p-8 lg:p-12 shrink-0 overflow-y-auto hidden md:block">
                            <div className="text-center mb-8">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-4 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-blue-500/20 uppercase">
                                    {selectedApp.student.name.charAt(0)}
                                </div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{selectedApp.student.name}</h2>
                                <p className="text-sm text-gray-500 font-medium mt-1">{selectedApp.student.email}</p>
                            </div>

                            <div className="space-y-6">
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
                        </div>

                        {/* Right: Application Details & Management */}
                        <div className="flex-1 flex flex-col min-w-0 bg-[#fcfcfd] dark:bg-[#0f172a]">
                            {/* Modal Header */}
                            <div className="p-8 lg:p-12 pb-0 shrink-0 flex items-start justify-between">
                                <div className="flex items-center gap-6 md:gap-8">
                                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-[32px] bg-white shadow-2xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 dark:border-white/5 p-4">
                                        {selectedApp.app.logoUrl ? (
                                            <img src={`${api.API_BASE_URL}${selectedApp.app.logoUrl}`} alt="" className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-4xl font-black text-gray-400">{selectedApp.app.universityName.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2 text-[11px] font-black tracking-widest uppercase">
                                            <span className="text-lyceum-blue bg-blue-100 dark:bg-blue-500/20 px-3 py-1 rounded-xl">{selectedApp.app.ackNumber || 'NO-ACK'}</span>
                                            <span className="text-gray-400">SUBMITTED {new Date(selectedApp.app.applicationSubmissionDate).toLocaleDateString()}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-2 tracking-tight">{selectedApp.app.universityName}</h2>
                                        <p className="text-base font-bold text-lyceum-blue uppercase tracking-widest">{selectedApp.app.course}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedApp(null)} className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                                    <X size={28} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 max-w-7xl">
                                    {/* Timeline & Progress */}
                                    <div className="xl:col-span-8 space-y-8">
                                        <div className="bg-white dark:bg-[#1e2330]/50 rounded-[40px] p-10 border border-gray-100 dark:border-gray-800/60 shadow-lg">
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-8">Application Progress</h4>

                                            <div className="relative pt-4 pb-12">
                                                <div className="absolute top-[32px] left-6 right-6 h-1 bg-gray-50 dark:bg-gray-900 rounded-full" />
                                                <div className="absolute top-[32px] left-6 h-1 bg-lyceum-blue rounded-full transition-all duration-1000"
                                                    style={{ width: selectedApp.app.status === 'Offer Received' ? '100%' : selectedApp.app.status === 'In Review' ? '66%' : selectedApp.app.status === 'Applied' ? '33%' : '0%' }}
                                                />

                                                <div className="flex justify-between relative z-10">
                                                    {[
                                                        { status: 'Shortlisted', icon: <Bookmark size={14} /> },
                                                        { status: 'Applied', icon: <FileText size={14} /> },
                                                        { status: 'In Review', icon: <SearchIcon size={14} /> },
                                                        { status: 'Offer Received', icon: <Award size={14} /> }
                                                    ].map((stage, i) => {
                                                        const isPassed = (selectedApp.app.status === 'Offer Received') || (selectedApp.app.status === 'In Review' && i <= 2) || (selectedApp.app.status === 'Applied' && i <= 1) || (selectedApp.app.status === 'Shortlisted' && i === 0);
                                                        const isCurrent = selectedApp.app.status === stage.status;

                                                        return (
                                                            <div key={stage.status} className="flex flex-col items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-500 ${isPassed
                                                                    ? 'bg-lyceum-blue text-white shadow-lg shadow-blue-500/20'
                                                                    : 'bg-white dark:bg-gray-700 text-gray-300 border border-gray-100 dark:border-gray-600'
                                                                    } ${isCurrent ? 'scale-110 shadow-xl' : ''}`}>
                                                                    {isCurrent ? <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> : stage.icon}
                                                                </div>
                                                                <span className={`text-[10px] font-black tracking-widest uppercase ${isCurrent ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>{stage.status}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-[#1e2330]/50 rounded-[40px] p-10 border border-gray-100 dark:border-gray-800/60 shadow-lg">
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-6">Operations & Remarks</h4>
                                            <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 min-h-[100px] text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-medium">
                                                {selectedApp.app.remarks || "No operational logs or student remarks yet."}
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
                                                    disabled={updating || selectedApp.app.status === 'Applied'}
                                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                >
                                                    <FileText size={16} /> Mark as Applied
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedApp.student, selectedApp.idx, 'In Review')}
                                                    disabled={updating || selectedApp.app.status === 'In Review'}
                                                    className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                >
                                                    <SearchIcon size={16} /> Start Review
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedApp.student, selectedApp.idx, 'Offer Received')}
                                                    disabled={updating || selectedApp.app.status === 'Offer Received'}
                                                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                >
                                                    <Award size={16} /> Mark Accepted
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedApp.student, selectedApp.idx, 'Rejected')}
                                                    disabled={updating || selectedApp.app.status === 'Rejected'}
                                                    className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                                >
                                                    <X size={16} /> Reject App
                                                </button>
                                            </div>
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
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversityApplicationView;
