import React, { useState, useEffect } from 'react';
import type { User } from '@/types';
import * as api from '@/utils/api';
import { Calendar, Clock, CheckCircle, AlertCircle, DollarSign, Download, Plus, Trash2, UserCircle, Users, UserCheck, LogIn, LogOut, Trophy, FileText, Navigation, ChevronLeft, ChevronRight, Sun, Moon, History } from 'lucide-react'; // Using lucide-react directly for specific missing ones
import SelfieCheckin from './components/selfie_checkin';
import ShiftCalendar from './components/shift_calendar';
import { downloadPayslip } from './components/pdf_payslip';

interface AttendanceViewProps {
    user: User;
    users?: User[];
    onUpdateUser?: (userId: number, updates: Partial<User>) => Promise<void>;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ user, users = [], onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<'me' | 'staff' | 'holidays' | 'payroll' | 'leaves' | 'manageRequests' | 'geofencing'>('me');
    const [myLogs, setMyLogs] = useState<any[]>([]);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [todayLog, setTodayLog] = useState<any | null>(null);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [payrollReport, setPayrollReport] = useState<any[]>([]);
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [staffList, setStaffList] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSelfie, setShowSelfie] = useState(false);
    const [selfiePrompted, setSelfiePrompted] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [leaveStats, setLeaveStats] = useState({ accrued: 0, used: 0, remaining: 0, quarter: 1 }); // Example quarterly state
    const [currentCalDate, setCurrentCalDate] = useState(new Date());

    // Holiday Form state
    const [newHoliday, setNewHoliday] = useState({ date: '', description: '' });

    // Leave Management State
    const [leaveList, setLeaveList] = useState<any[]>([]);
    const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });

    // Office Location State (Phase 6: Multi-branch)
    const [officeLocation, setOfficeLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [branches, setBranches] = useState<any[]>([]);
    const [branchForm, setBranchForm] = useState({ name: '', lat: 0, lng: 0, radius: 50 });

    // Current Time for Clock
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchLeaveBalance = async () => {
        try {
            const stats = await api.getLeaveBalance();
            setLeaveStats(stats);
        } catch (error) {
            console.error("Failed to fetch leave balance:", error);
        }
    };

    useEffect(() => {
        fetchMyAttendance();
        fetchHolidays();
        fetchLeaveBalance();
        if (user.role === 'Admin') {
            fetchHolidays();
            fetchLeaves(); // Admin sees all
            fetchOfficeLocation();
            fetchBranches();
            if (users && users.length > 0) {
                setStaffList(users.filter(u => u.role !== 'Student'));
            } else {
                fetchStaff();
            }
        } else {
            fetchLeaves(); // Staff sees their own
            fetchBranches();
        }
    }, [user.role, users]);

    const fetchMyAttendance = async () => {
        try {
            const logs = await api.getAttendanceHistory() as any[];
            setMyLogs(logs);
            const todayStr = new Date().toISOString().split('T')[0];
            const today = logs.find((l: any) => l.date.split('T')[0] === todayStr);
            setTodayLog(today);
            setIsCheckedIn(!!today && !today.check_out);
        } catch (error) {
            console.error("Failed to fetch attendance:", error);
        }
    };

    const fetchHolidays = async () => {
        try {
            const data = await api.getHolidays();
            setHolidays(data);
        } catch (error) {
            console.error("Failed to fetch holidays:", error);
        }
    };

    const fetchStaff = async () => {
        try {
            const data = await api.getUsers();
            setStaffList(data.filter(u => u.role !== 'Student'));
        } catch (error) {
            console.error("Failed to fetch staff:", error);
        }
    };

    const fetchLeaves = async () => {
        try {
            const data = await api.getLeaves();
            setLeaveList(data);
        } catch (error) {
            console.error("Failed to fetch leaves:", error);
        }
    };

    const fetchOfficeLocation = async () => {
        try {
            const loc = await api.getOfficeLocation();
            setOfficeLocation(loc);
        } catch (error) {
            console.error("Failed to fetch location:", error);
        }
    };

    const fetchBranches = async () => {
        try {
            const data = await api.getBranches();
            setBranches(data);
        } catch (error) {
            console.error("Failed to fetch branches:", error);
        }
    };

    const handleSaveBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.saveBranch(branchForm);
            alert('Branch saved successfully!');
            setBranchForm({ name: '', lat: 0, lng: 0, radius: 50 });
            fetchBranches();
        } catch (error: any) {
            alert('Failed to save branch: ' + error.message);
        }
    };

    const handleDeleteBranch = async (id: number) => {
        if (!confirm('Are you sure you want to delete this branch?')) return;
        try {
            await api.deleteBranch(id);
            fetchBranches();
        } catch (error: any) {
            alert('Failed to delete: ' + error.message);
        }
    };

    const handleUseCurrentLocationForBranch = async () => {
        try {
            const loc = await getLocation();
            setBranchForm(prev => ({ ...prev, lat: loc.lat, lng: loc.lng }));
        } catch (error: any) {
            alert("Failed to get location: " + error.message);
        }
    };

    const handleApplyLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.applyLeave(leaveForm);
            alert('Leave request submitted!');
            await fetchMyAttendance();
            await fetchLeaveBalance();
            setLeaveForm({ startDate: '', endDate: '', reason: '' });
            fetchLeaves();
        } catch (error: any) {
            alert('Failed to apply: ' + error.message);
        }
    };

    const handleUpdateLeaveStatus = async (id: number, status: 'Approved' | 'Rejected') => {
        if (!confirm(`Are you sure you want to mark this request as ${status}?`)) return;
        try {
            await api.updateLeaveStatus(id, status);
            fetchLeaves();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const getLocation = (): Promise<{ lat: number, lng: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => reject(new Error("Location permission denied. Please allow location access to mark attendance."))
            );
        });
    };

    const handleCheckIn = async (selfieData?: string) => {
        // Randomly prompt for selfie if not already prompted (approx 20% chance)
        if (!selfieData && !selfiePrompted && Math.random() < 0.2) {
            setSelfiePrompted(true);
            setShowSelfie(true);
            return;
        }

        try {
            let loc;
            try {
                loc = await getLocation();
            } catch (e: any) {
                console.log("Location skipped:", e.message);
                if (!confirm("Location access failed/denied. Try checking in without location? (If Geofencing is on, this will fail)")) {
                    return;
                }
            }

            await api.checkIn({
                ...loc,
                selfie: selfieData,
                branch: selectedBranch || user.branch_name
            });
            setShowSelfie(false);
            await fetchMyAttendance();
        } catch (error: any) {
            alert(error.message || "Check-in failed");
        }
    };

    const handleCheckOut = async () => {
        try {
            let loc;
            try { loc = await getLocation(); } catch (e) { }
            await api.checkOut(loc);
            await fetchMyAttendance();
        } catch (error: any) {
            alert(error.message || "Check-out failed");
        }
    };

    const handleSetOfficeLocation = async () => {
        if (!confirm("This will set the OFFICE LOCATION to your current GPS coordinates. Ensure you are at the office.")) return;
        try {
            const loc = await getLocation();
            await api.saveOfficeLocation(loc);
            setOfficeLocation(loc);
            alert("✅ Office location updated successfully!");
        } catch (error: any) {
            alert("Failed to set location: " + error.message);
        }
    };

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHoliday.date || !newHoliday.description) return;
        try {
            await api.saveHoliday(newHoliday);
            setNewHoliday({ date: '', description: '' });
            fetchHolidays();
        } catch (error) {
            alert("Failed to add holiday");
        }
    };

    const handleDeleteHoliday = async (id: number) => {
        if (!confirm("Are you sure you want to delete this holiday?")) return;
        try {
            await api.deleteHoliday(id);
            fetchHolidays();
        } catch (error) {
            alert("Failed to delete holiday");
        }
    };

    const handleUpdateStaff = async (staffId: number, updates: Partial<User>) => {
        try {
            if (onUpdateUser) {
                await onUpdateUser(staffId, updates);
            } else {
                await api.updateUser(staffId, updates);
                // Update local state fallback
                setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, ...updates } : s));
            }
        } catch (error) {
            alert("Failed to update staff settings");
        }
    };

    const handleSaveRoster = async (roster: any) => {
        try {
            await api.saveShiftRoster(roster);
            alert("✅ Shift roster saved successfully!");
        } catch (error) {
            alert("Failed to save roster");
        }
    };

    const generatePayroll = async () => {
        setLoading(true);
        try {
            const report = await api.getPayrollReport(reportMonth, reportYear);
            setPayrollReport(report);
        } catch (error) {
            console.error("Failed to generate payroll:", error);
        } finally {
            setLoading(false);
        }
    };

    const exportPayrollToCSV = () => {
        if (!payrollReport.length) return;
        const headers = ["Employee Name", "Base Salary", "Working Days", "Present", "Leaves", "Late Min", "Deduction", "Final Pay"];
        const rows = payrollReport.map(r => [
            r.name,
            r.baseSalary,
            r.workingDays,
            r.presentDays,
            r.paidLeaveDays,
            r.lateMinutes,
            Math.max(0, r.baseSalary - r.finalSalary),
            r.finalSalary
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Payroll_Report_${reportMonth}_${reportYear}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const renderLeaderboard = () => (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-yellow-100 rounded-2xl text-yellow-600">
                    <Trophy size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Top Punctual Staff</h3>
                    <p className="text-xs text-gray-500">Based on minimum late arrivals this month</p>
                </div>
            </div>
            <div className="space-y-4">
                {payrollReport.sort((a, b) => a.lateMinutes - b.lateMinutes).slice(0, 5).map((staff, idx) => (
                    <div key={staff.userId} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-3">
                            <span className={`w - 6 h - 6 flex items - center justify - center rounded - full text - xs font - bold ${idx === 0 ? 'bg-yellow-400 text-white' :
                                idx === 1 ? 'bg-gray-300 text-white' :
                                    idx === 2 ? 'bg-orange-400 text-white' : 'text-gray-400'
                                } `}>
                                {idx + 1}
                            </span>
                            <span className="font-semibold text-gray-700 dark:text-gray-200">{staff.name}</span>
                        </div>
                        <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                            {staff.lateMinutes}m Late
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMonthlyCalendar = () => {
        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        const monthName = currentCalDate.toLocaleString('default', { month: 'long' });

        return (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between border-b dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-600" />
                        {monthName} {year}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentCalDate(new Date(year, month - 1))} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><ChevronLeft size={16} /></button>
                        <button onClick={() => setCurrentCalDate(new Date(year, month + 1))} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><ChevronRight size={16} /></button>
                    </div>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-7 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-2">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => {
                            if (!day) return <div key={idx} className="aspect-square"></div>;
                            const dateStr = `${year} -${String(month + 1).padStart(2, '0')} -${String(day).padStart(2, '0')} `;
                            const log = myLogs.find(l => l.date.split('T')[0] === dateStr);
                            const isHoliday = holidays.some(h => h.date.split('T')[0] === dateStr);

                            return (
                                <div key={idx} className={`aspect - square rounded - xl flex flex - col items - center justify - center relative group transition - all ${log ? (log.status === 'Present' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700') :
                                    isHoliday ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-900/20'
                                    } `}>
                                    <span className="text-sm font-bold">{day}</span>
                                    {log && <div className={`w - 1 h - 1 rounded - full mt - 1 ${log.status === 'Present' ? 'bg-green-500' : 'bg-amber-500'} `}></div>}
                                    {isHoliday && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderMyAttendance = () => (
        <div className="space-y-8 animate-fade-in">
            {showSelfie && (
                <SelfieCheckin
                    onCapture={(data) => handleCheckIn(data)}
                    onClose={() => setShowSelfie(false)}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status & Clock Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Clock size={120} />
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="text-center md:text-left flex-1">
                            <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest text-[10px]">Real-time Status</h2>
                            <div className="text-5xl font-black mb-4 text-lyceum-blue dark:text-lyceum-blue-light tracking-tighter">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>

                            <div className="flex flex-col gap-4 mt-8">
                                <div className="flex items-center gap-3">
                                    <Navigation className="w-5 h-5 text-gray-400" />
                                    <select
                                        value={selectedBranch || user.branch_name || ''}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                        className="bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-lyceum-blue outline-none py-1 text-sm font-bold text-gray-700 dark:text-gray-200"
                                    >
                                        <option value="">Select Branch...</option>
                                        {branches.map((b: any) => (
                                            <option key={b.id} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mt-4">
                                    {leaveList.filter(l => l.status === 'Pending').length > 0 && (
                                        <div className="p-4 mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-800 dark:text-gray-100">Pending Leave Approvals</div>
                                                    <div className="text-[10px] text-gray-500">{leaveList.filter(l => l.status === 'Pending').length} requests waiting</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('manageRequests')}
                                                className="px-4 py-1.5 bg-white dark:bg-gray-800 text-orange-600 text-xs font-bold rounded-xl border border-orange-200 hover:bg-orange-50 transition-colors shadow-sm"
                                            >
                                                Review
                                            </button>
                                        </div>
                                    )}

                                    {!todayLog ? (
                                        <button
                                            onClick={() => handleCheckIn()}
                                            className="group relative flex items-center justify-center gap-3 px-10 py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-green-500/30 transition-all active:scale-95"
                                        >
                                            <LogIn size={24} />
                                            <span>START SHIFT</span>
                                        </button>
                                    ) : !todayLog.check_out ? (
                                        <div className="space-y-4">
                                            <div className="py-3 px-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 font-bold flex items-center gap-2">
                                                <CheckCircle size={20} />
                                                Logged in at {new Date(todayLog.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <button
                                                onClick={handleCheckOut}
                                                className="group relative flex items-center justify-center gap-3 px-10 py-4 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-red-500/30 transition-all active:scale-95 w-full"
                                            >
                                                <LogOut size={24} />
                                                <span>END SHIFT</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                <CheckCircle size={24} />
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">Workday Ended</div>
                                                <div className="text-sm text-gray-500">Left at {new Date(todayLog.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="relative w-24 h-24 mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-700" />
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * leaveStats.remaining) / Math.max(1, leaveStats.accrued)} className="text-lyceum-blue" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-gray-900 dark:text-gray-100">{leaveStats.remaining}</span>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Days Left</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Accrued: {leaveStats.accrued} / Used: {leaveStats.used}</div>
                                <div className="text-[10px] text-lyceum-blue font-bold">Q{leaveStats.quarter} Leave Cycle</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance/Leaderboard Side */}
                <div className="lg:col-span-1">
                    {renderLeaderboard()}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Monthly Calendar View */}
                <div className="lg:col-span-1">
                    {renderMonthlyCalendar()}
                </div>

                {/* History Table (Redesigned) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <History size={18} className="text-gray-400" />
                            Attendance History
                        </h3>
                        <div className="text-xs text-lyceum-blue font-bold px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">30 Days</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">In / Out</th>
                                    <th className="px-6 py-4">Total Time</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {myLogs.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No records for this month.</td></tr>
                                ) : myLogs.map(log => {
                                    const duration = log.check_in && log.check_out ?
                                        Math.round((new Date(log.check_out).getTime() - new Date(log.check_in).getTime()) / 3600000 * 10) / 10 + 'h'
                                        : '-';
                                    return (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-700 dark:text-gray-200">{new Date(log.date).getDate()} {new Date(log.date).toLocaleString('default', { month: 'short' })}</div>
                                                <div className="text-[10px] text-gray-400">{new Date(log.date).toLocaleString('default', { weekday: 'long' })}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-green-600 font-bold">{log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                    <span className="text-gray-300">→</span>
                                                    <span className="text-red-500 font-bold">{log.check_out ? new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{duration}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline - flex items - center px - 3 py - 1 rounded - xl text - [10px] font - black uppercase ${log.status === 'Late' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40' : 'bg-green-100 text-green-600 dark:bg-green-900/40'} `}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStaffMgmt = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold">Staff Salary & Shift Settings</h3>
                        <p className="text-sm text-gray-500">Configure base salaries and working hours for each staff member.</p>
                        {officeLocation ? (
                            <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                                <CheckCircle size={12} />
                                <span>Geofence Active: {officeLocation.lat.toFixed(4)}, {officeLocation.lng.toFixed(4)}</span>
                                <a href={`https://maps.google.com/?q=${officeLocation.lat},${officeLocation.lng}`} target="_blank" rel="noreferrer" className="underline ml-1">View Map</a>
                            </div >
                        ) : (
                            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit">
                                <AlertCircle size={12} />
                                <span>Geofence Inactive (Set location to enable)</span>
                            </div>
                        )}
                    </div >
                    <div>
                        <button
                            onClick={handleSetOfficeLocation}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold transition-colors"
                        >
                            <span className="text-lg">📍</span> Set Office Location
                        </button>
                    </div>
                </div >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Staff Member</th>
                                <th className="px-6 py-4">Joining Date</th>
                                <th className="px-6 py-4">Base Salary</th>
                                <th className="px-6 py-4">Shift Start</th>
                                <th className="px-6 py-4">Shift End</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {staffList.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 dark:text-gray-100">{s.name}</div>
                                        <div className="text-xs text-gray-500">{s.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="date"
                                            className="p-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                            defaultValue={s.joining_date ? s.joining_date.toString().split('T')[0] : ''}
                                            onBlur={(e) => handleUpdateStaff(s.id, { joining_date: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                            <input
                                                type="number"
                                                className="w-32 pl-7 pr-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-lyceum-blue"
                                                defaultValue={s.base_salary || 0}
                                                onBlur={(e) => handleUpdateStaff(s.id, { base_salary: Number(e.target.value) })}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="time"
                                            className="p-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                            defaultValue={s.shift_start || '09:00'}
                                            onBlur={(e) => handleUpdateStaff(s.id, { shift_start: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="time"
                                            className="p-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                                            defaultValue={s.shift_end || '18:00'}
                                            onBlur={(e) => handleUpdateStaff(s.id, { shift_end: e.target.value })}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-wrap gap-1 max-w-[150px] justify-end">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                                const days = s.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                                                const isActive = days.includes(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        onClick={() => {
                                                            const newDays = isActive
                                                                ? days.filter(d => d !== day)
                                                                : [...days, day];
                                                            handleUpdateStaff(s.id, { working_days: newDays });
                                                        }}
                                                        className={`text-[10px] px-1.5 py-0.5 rounded border ${isActive
                                                            ? 'bg-lyceum-blue text-white border-lyceum-blue'
                                                            : 'bg-white text-gray-500 border-gray-200 hover:border-lyceum-blue'
                                                            }`}
                                                    >
                                                        {day.slice(0, 1)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-lyceum-blue hover:bg-lyceum-blue/10 rounded-lg transition-colors">
                                            <UserCircle size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div >

            <div className="mt-12">
                <ShiftCalendar
                    staff={staffList}
                    onSaveRoster={handleSaveRoster}
                />
            </div>
        </div >
    );

    const renderHolidays = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Add Holiday Form */}
            <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-6">Schedule Holiday</h3>
                    <form onSubmit={handleAddHoliday} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                            <input
                                type="date"
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-lyceum-blue outline-none"
                                value={newHoliday.date}
                                onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-lyceum-blue outline-none"
                                rows={3}
                                placeholder="e.g. Independence Day"
                                value={newHoliday.description}
                                onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="w-full py-3 bg-lyceum-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                            <Plus size={20} />
                            Add to Calendar
                        </button>
                    </form>
                </div>
            </div>

            {/* Holiday List */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                        <Calendar size={20} className="text-lyceum-blue" />
                        <h3 className="text-lg font-bold">Upcoming Holidays</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {holidays.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">No holidays scheduled yet.</div>
                        ) : holidays.map(h => (
                            <div key={h.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-lyceum-blue/10 rounded-xl flex flex-col items-center justify-center text-lyceum-blue">
                                        <span className="text-xs uppercase font-bold">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-xl font-black">{new Date(h.date).getDate()}</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-gray-100">{h.description}</div>
                                        <div className="text-sm text-gray-500">{new Date(h.date).getFullYear()}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteHoliday(h.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPayroll = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-wrap items-end gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Payroll Month</label>
                    <select
                        value={reportMonth}
                        onChange={e => setReportMonth(Number(e.target.value))}
                        className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-lyceum-blue outline-none min-w-[200px]"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Year</label>
                    <select
                        value={reportYear}
                        onChange={e => setReportYear(Number(e.target.value))}
                        className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-lyceum-blue outline-none min-w-[120px]"
                    >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={generatePayroll}
                        disabled={loading}
                        className="px-8 py-3 bg-lyceum-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <DollarSign size={20} />}
                        {loading ? 'Processing...' : 'Generate Payroll Report'}
                    </button>
                    {payrollReport.length > 0 && (
                        <button
                            onClick={exportPayrollToCSV}
                            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
                        >
                            <Download size={20} />
                            Export CSV
                        </button>
                    )}
                </div>
            </div>

            {payrollReport.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-5 font-bold">Staff Details</th>
                                    <th className="px-6 py-5 font-bold">Base Salary</th>
                                    <th className="px-6 py-5 font-bold">Period</th>
                                    <th className="px-6 py-5 font-bold">Present / Leaves / Late</th>
                                    <th className="px-6 py-5 font-bold">Deductions</th>
                                    <th className="px-6 py-5 font-bold text-right">Final Pay</th>
                                    <th className="px-6 py-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {payrollReport.map(row => (
                                    <tr key={row.userId} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-gray-900 dark:text-gray-100">{row.name}</div>
                                            <div className="text-xs text-gray-500">Employee ID: #{row.userId}</div>
                                        </td>
                                        <td className="px-6 py-5 font-mono">₹{row.baseSalary.toLocaleString()}</td>
                                        <td className="px-6 py-5">{row.workingDays} days</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-600 font-bold" title="Present">{row.presentDays}P</span>
                                                <span className="text-blue-600 font-bold" title="Paid Leaves">{row.paidLeaveDays || 0}L</span>
                                                <span className="text-amber-600 font-bold" title="Late">{row.lateDays}L</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-red-600 font-bold">
                                            {/* Deductions: Only show late fines and absent deduction */}
                                            {/* Absent days logic is implicit in Final Pay vs Base. 
                                                If we want to show 'Deduction Amount', we can calc: Base - Final.
                                                But Base might be Pro-rated Max?
                                                Let's calculate Deduction = Base - Final.
                                            */}
                                            -₹{Math.max(0, row.baseSalary - row.finalSalary).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-lg text-lyceum-blue">₹{row.finalSalary.toLocaleString()}</td>
                                        <td className="px-6 py-5 text-center">
                                            <button
                                                onClick={() => downloadPayslip({
                                                    userName: row.name,
                                                    month: new Date(0, reportMonth - 1).toLocaleString('default', { month: 'long' }),
                                                    year: reportYear,
                                                    baseSalary: row.baseSalary,
                                                    workingDays: row.workingDays,
                                                    presentDays: row.presentDays,
                                                    paidLeaveDays: row.paidLeaveDays,
                                                    unpaidLeaveDays: row.unpaidLeaveDays,
                                                    lateMinutes: row.lateMinutes,
                                                    lateDeduction: row.lateDeduction,
                                                    absentDeduction: row.absentDeduction,
                                                    finalSalary: row.finalSalary
                                                })}
                                                className="p-2 text-lyceum-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Download PDF Payslip"
                                            >
                                                <FileText size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    const renderMyLeaves = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-6">Request Leave</h3>
                    <form onSubmit={handleApplyLeave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                <input type="date" className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                <input type="date" className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                            <textarea className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none" rows={3} value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} required placeholder="Why are you taking leave?" />
                        </div>
                        <button type="submit" className="w-full py-2.5 bg-lyceum-blue text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all">Submit Request</button>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold">My Leave History</h3></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4">Dates</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {leaveList.filter(l => l.user_id === user.id).map(leave => (
                                    <tr key={leave.id}><td className="px-6 py-4"><div className="font-bold">{new Date(leave.start_date).toLocaleDateString()}</div><div className="text-xs text-gray-500">to {new Date(leave.end_date).toLocaleDateString()}</div></td><td className="px-6 py-4 text-sm">{leave.reason}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${leave.status === 'Approved' ? 'bg-green-100 text-green-700' : leave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{leave.status}</span></td></tr>
                                ))}
                                {leaveList.filter(l => l.user_id === user.id).length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No leave requests found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderManageLeaves = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold">Pending Leave Requests</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Staff</th>
                                <th className="px-6 py-4">Dates</th>
                                <th className="px-6 py-4">Reason</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {leaveList.map(leave => (
                                <tr key={leave.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4"><div className="font-bold">{leave.user_name}</div><div className="text-xs text-gray-500">{leave.user_email}</div></td>
                                    <td className="px-6 py-4"><div className="font-medium">{new Date(leave.start_date).toLocaleDateString()}</div><div className="text-xs text-gray-500">to {new Date(leave.end_date).toLocaleDateString()}</div></td>
                                    <td className="px-6 py-4 text-sm max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${leave.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                                                leave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {leave.status}
                                            </span>

                                            {leave.status !== 'Approved' && (
                                                <button onClick={() => handleUpdateLeaveStatus(leave.id, 'Approved')} className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 shadow-sm">
                                                    Accept
                                                </button>
                                            )}
                                            {leave.status !== 'Rejected' && (
                                                <button onClick={() => handleUpdateLeaveStatus(leave.id, 'Rejected')} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 shadow-sm">
                                                    Refuse
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {leaveList.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No leave requests found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderGeofencing = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-lyceum-blue/10 rounded-2xl text-lyceum-blue">
                        <Navigation size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Branch Geofencing</h2>
                        <p className="text-sm text-gray-500">Manage office locations and allowed check-in radii</p>
                    </div>
                </div>

                <form onSubmit={handleSaveBranch} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Branch Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Main Campus"
                            value={branchForm.name}
                            onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-lyceum-blue outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Latitude</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="any"
                                placeholder="0.000000"
                                value={branchForm.lat || ''}
                                onChange={(e) => setBranchForm({ ...branchForm, lat: parseFloat(e.target.value) })}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-lyceum-blue outline-none"
                                required
                            />
                            <button
                                type="button"
                                onClick={handleUseCurrentLocationForBranch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-lyceum-blue/10 text-lyceum-blue hover:bg-lyceum-blue hover:text-white rounded-lg transition-all"
                                title="Use Current GPS"
                            >
                                <Navigation size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Longitude</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="0.000000"
                            value={branchForm.lng || ''}
                            onChange={(e) => setBranchForm({ ...branchForm, lng: parseFloat(e.target.value) })}
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-lyceum-blue outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Radius (Meters)</label>
                        <input
                            type="number"
                            placeholder="50"
                            value={branchForm.radius}
                            onChange={(e) => setBranchForm({ ...branchForm, radius: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-lyceum-blue outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-2 flex flex-col justify-end">
                        <button
                            type="submit"
                            className="px-6 py-3 bg-lyceum-blue hover:bg-lyceum-blue-dark text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-lyceum-blue/20 flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> Add Branch
                        </button>
                    </div>
                </form>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                                <th className="pb-4 font-bold text-gray-400 uppercase text-[10px] tracking-wider px-4">Branch Name</th>
                                <th className="pb-4 font-bold text-gray-400 uppercase text-[10px] tracking-wider px-4">Coordinates</th>
                                <th className="pb-4 font-bold text-gray-400 uppercase text-[10px] tracking-wider px-4 text-center">Radius</th>
                                <th className="pb-4 font-bold text-gray-400 uppercase text-[10px] tracking-wider px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {branches.map((b) => (
                                <tr key={b.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="font-bold text-gray-800 dark:text-gray-100">{b.name}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-xs font-mono text-gray-500">{b.lat.toFixed(6)}, {b.lng.toFixed(6)}</div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className="px-3 py-1 bg-lyceum-blue/10 text-lyceum-blue rounded-full text-xs font-bold">
                                            {b.radius}m
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <button
                                            onClick={() => handleDeleteBranch(b.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {branches.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-500">
                                        No branches configured. Check-ins will use the default office location.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Attendance & Payroll</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage shift recordings, holiday schedules, and automated payroll reports.</p>
                </div>

                {user.role === 'Admin' ? (
                    <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl shadow-inner w-full md:w-auto overflow-x-auto whitespace-nowrap">
                        <button onClick={() => setActiveTab('me')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'me' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <Clock size={16} /> My Dashboard
                        </button>
                        <button onClick={() => setActiveTab('leaves')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'leaves' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <Calendar size={16} /> My Leaves
                        </button>
                        {user.role === 'Admin' && (
                            <>
                                <button onClick={() => setActiveTab('staff')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                                    <Users size={16} /> Staff
                                </button>
                                <button onClick={() => setActiveTab('manageRequests')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'manageRequests' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                                    <CheckCircle size={16} /> Requests
                                </button>
                                <button onClick={() => setActiveTab('holidays')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'holidays' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                                    <Calendar size={16} /> Holidays
                                </button>
                                <button onClick={() => setActiveTab('payroll')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'payroll' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                                    <DollarSign size={16} /> Payroll
                                </button>
                                <button onClick={() => setActiveTab('geofencing')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'geofencing' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                                    <Navigation size={16} /> Geofencing
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    // Staff Navigation (if not Admin)
                    <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl shadow-inner w-full md:w-auto overflow-x-auto whitespace-nowrap">
                        <button onClick={() => setActiveTab('me')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'me' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <Clock size={18} /> My Dashboard
                        </button>
                        <button onClick={() => setActiveTab('leaves')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'leaves' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <Calendar size={18} /> Leaves
                        </button>
                    </div>
                )}
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-300">
                {activeTab === 'me' && renderMyAttendance()}
                {activeTab === 'staff' && renderStaffMgmt()}
                {activeTab === 'holidays' && renderHolidays()}
                {activeTab === 'payroll' && renderPayroll()}
                {activeTab === 'leaves' && renderMyLeaves()}
                {activeTab === 'manageRequests' && renderManageLeaves()}
                {activeTab === 'geofencing' && user.role === 'Admin' && renderGeofencing()}
            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default AttendanceView;
