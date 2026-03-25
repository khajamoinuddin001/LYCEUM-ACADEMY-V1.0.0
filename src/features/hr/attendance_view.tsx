import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User } from '@/types';
import * as api from '@/utils/api';
import { Calendar, Clock, CheckCircle, AlertCircle, DollarSign, Download, Plus, Trash2, UserCircle, Users, UserCheck, LogIn, LogOut, Trophy, FileText, Navigation, ChevronLeft, ChevronRight, Sun, Moon, History, Pencil, X, Check, MapPin, Loader2, ShieldCheck } from 'lucide-react';
import SelfieCheckin from './components/selfie_checkin';
import ShiftCalendar from './components/shift_calendar';
import { downloadPayslip } from './components/pdf_payslip';

interface AttendanceViewProps {
    user: User;
    users?: User[];
    onUpdateUser?: (userId: number, updates: Partial<User>) => Promise<void>;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ user, users = [], onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<'me' | 'staff' | 'holidays' | 'leaves' | 'manageRequests' | 'geofencing' | 'payslips'>('me');
    const [myLogs, setMyLogs] = useState<any[]>([]);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [todayLog, setTodayLog] = useState<any | null>(null);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSelfie, setShowSelfie] = useState(false);
    const [selfiePrompted, setSelfiePrompted] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [leaveStats, setLeaveStats] = useState({ accrued: 0, used: 0, remaining: 0, quarter: 1 }); // Example quarterly state
    const [currentCalDate, setCurrentCalDate] = useState(new Date());

    // Staff attendance history (Admin view)
    const [viewingStaffHistory, setViewingStaffHistory] = useState<User | null>(null);
    const [staffLogs, setStaffLogs] = useState<any[]>([]);
    const [loadingStaffLogs, setLoadingStaffLogs] = useState(false);

    // Holiday Form state
    const [newHoliday, setNewHoliday] = useState({ date: '', endDate: '', description: '' });

    // Leave Management State
    const [leaveList, setLeaveList] = useState<any[]>([]);
    const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });

    // Office Location State (Phase 6: Multi-branch)
    const [officeLocation, setOfficeLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [branches, setBranches] = useState<any[]>([]);
    const [branchForm, setBranchForm] = useState<{ name: string; lat: number | ''; lng: number | ''; radius: number }>({ name: '', lat: '', lng: '', radius: 50 });

    // Geofencing UX state
    const [geoToast, setGeoToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [savingBranch, setSavingBranch] = useState(false);
    const [deletingBranchId, setDeletingBranchId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
    const [editRadius, setEditRadius] = useState<number>(50);
    const [savingEditRadius, setSavingEditRadius] = useState(false);
    const geoToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showGeoToast = (type: 'success' | 'error', msg: string) => {
        setGeoToast({ type, msg });
        if (geoToastTimer.current) clearTimeout(geoToastTimer.current);
        geoToastTimer.current = setTimeout(() => setGeoToast(null), 3500);
    };

    // Payslips state
    const [payslips, setPayslips] = useState<any[]>([]);
    const [payslipMonth, setPayslipMonth] = useState(new Date().getMonth()); // 0-indexed for display but we use +1 for API
    const [payslipYear, setPayslipYear] = useState(new Date().getFullYear());
    const [generatingPayroll, setGeneratingPayroll] = useState(false);
    const [payslipToast, setPayslipToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const payslipToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [payrollSchedule, setPayrollSchedule] = useState<{ dayOfMonth: number; hour: number; minute: number }>({ dayOfMonth: 1, hour: 0, minute: 0 });
    const [savingSchedule, setSavingSchedule] = useState(false);
    
    // Adjustments (Bonus/Overtime) state
    const [editingSlip, setEditingSlip] = useState<any | null>(null);
    const [adjustmentBonus, setAdjustmentBonus] = useState<string>('0');
    const [adjustmentOvertime, setAdjustmentOvertime] = useState<string>('0');
    const [savingAdjustments, setSavingAdjustments] = useState(false);

    const showPayslipToast = (type: 'success' | 'error', msg: string) => {
        setPayslipToast({ type, msg });
        if (payslipToastTimer.current) clearTimeout(payslipToastTimer.current);
        payslipToastTimer.current = setTimeout(() => setPayslipToast(null), 4000);
    };

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchPayslips = async () => {
        try {
            const data = await api.getPayslips();
            setPayslips(data);
        } catch (err) {
            console.error('Failed to fetch payslips:', err);
        }
    };

    const fetchPayrollSchedule = async () => {
        try {
            const data = await api.getPayrollSchedule();
            if (data) setPayrollSchedule(data);
        } catch (err) {
            console.error('Failed to fetch payroll schedule:', err);
        }
    };

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
        fetchPayslips();
        if (user.role === 'Admin') {
            fetchHolidays();
            fetchLeaves(); // Admin sees all
            fetchOfficeLocation();
            fetchBranches();
            fetchPayrollSchedule();
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

    const handleViewStaffHistory = async (staff: User) => {
        setViewingStaffHistory(staff);
        setLoadingStaffLogs(true);
        try {
            const logs = await api.getStaffAttendanceHistory(staff.id);
            setStaffLogs(logs);
        } catch (err) {
            console.error('Failed to fetch staff history:', err);
        } finally {
            setLoadingStaffLogs(false);
        }
    };

    const monthlyStats = useMemo(() => {
        const now = new Date();
        const thisMonthLogs = myLogs.filter(log => {
            const logDate = new Date(log.date);
            return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
        });

        const presentDays = thisMonthLogs.filter(l => l.status === 'Present' || l.status === 'Late').length;
        const lateDays = thisMonthLogs.filter(l => l.status === 'Late').length;
        const totalHours = thisMonthLogs.reduce((acc, log) => {
            if (log.check_in && log.check_out) {
                return acc + (new Date(log.check_out).getTime() - new Date(log.check_in).getTime()) / 3600000;
            }
            return acc;
        }, 0);

        return {
            presentDays,
            lateDays,
            totalHours: Math.round(totalHours * 10) / 10
        };
    }, [myLogs]);

    const nextHoliday = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return holidays
            .filter(h => new Date(h.date) >= now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    }, [holidays]);

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
        if (!branchForm.name || branchForm.lat === '' || branchForm.lng === '') {
            showGeoToast('error', 'Please fill in all required fields.');
            return;
        }
        setSavingBranch(true);
        try {
            await api.saveBranch({ name: branchForm.name, lat: Number(branchForm.lat), lng: Number(branchForm.lng), radius: branchForm.radius });
            showGeoToast('success', `Branch "${branchForm.name}" saved successfully!`);
            setBranchForm({ name: '', lat: '', lng: '', radius: 50 });
            fetchBranches();
        } catch (error: any) {
            showGeoToast('error', 'Failed to save branch: ' + error.message);
        } finally {
            setSavingBranch(false);
        }
    };

    const handleDeleteBranch = async (id: number) => {
        setDeletingBranchId(id);
        try {
            await api.deleteBranch(id);
            showGeoToast('success', 'Branch removed successfully.');
            fetchBranches();
        } catch (error: any) {
            showGeoToast('error', 'Failed to delete branch: ' + error.message);
        } finally {
            setDeletingBranchId(null);
            setConfirmDeleteId(null);
        }
    };

    const handleUseCurrentLocationForBranch = async () => {
        setGpsLoading(true);
        try {
            const loc = await getLocation();
            setBranchForm(prev => ({ ...prev, lat: loc.lat, lng: loc.lng }));
            showGeoToast('success', 'GPS coordinates fetched successfully!');
        } catch (error: any) {
            showGeoToast('error', 'Location access denied. Please enable GPS.');
        } finally {
            setGpsLoading(false);
        }
    };

    const handleSaveEditRadius = async (branch: any) => {
        setSavingEditRadius(true);
        try {
            await api.saveBranch({ name: branch.name, lat: branch.lat, lng: branch.lng, radius: editRadius });
            showGeoToast('success', `Radius for "${branch.name}" updated to ${editRadius}m.`);
            setEditingBranchId(null);
            fetchBranches();
        } catch (error: any) {
            showGeoToast('error', 'Failed to update radius: ' + error.message);
        } finally {
            setSavingEditRadius(false);
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
            setNewHoliday({ date: '', endDate: '', description: '' });
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

    const renderMonthlyCalendar = () => {
        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayStr = new Date().toISOString().split('T')[0];

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
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isToday = dateStr === todayStr;
                            const log = myLogs.find(l => l.date && l.date.split('T')[0] === dateStr);
                            const isHoliday = holidays.some(h => h.date && h.date.split('T')[0] === dateStr);

                            return (
                                <div key={idx} className={`aspect-square rounded-xl flex flex-col items-center justify-center relative group transition-all border ${isToday ? 'border-blue-500 bg-blue-50/50' : 'border-transparent'} ${log ? (log.status === 'Present' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700') :
                                    isHoliday ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-900/20'
                                    }`}>
                                    <span className={`text-xs font-bold ${isToday ? 'text-blue-600' : ''}`}>{day}</span>
                                    {log && <div className={`w-1 h-1 rounded-full mt-1 ${log.status === 'Present' ? 'bg-green-500' : 'bg-amber-500'}`}></div>}
                                    {isHoliday && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                                </div>
                            );
                        })}
                    </div>
                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t dark:border-gray-700 flex flex-wrap justify-center gap-x-4 gap-y-2">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Present</div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Late</div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Holiday</div>
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
                <div className="lg:col-span-2 bg-gradient-to-br from-white via-blue-50/30 to-gray-50 dark:from-gray-800 dark:via-blue-900/10 dark:to-gray-900 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden group">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-lyceum-blue/10 rounded-full blur-3xl group-hover:bg-lyceum-blue/20 transition-colors"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors"></div>
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

                                {/* My Schedule Card */}
                                <div className="mt-4 flex flex-wrap items-center gap-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center gap-3 pr-6 border-r border-gray-200 dark:border-gray-700">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Shift Timings</div>
                                            <div className="text-sm font-black text-gray-800 dark:text-gray-100 italic">
                                                {user.shift_start || '09:00'} - {user.shift_end || '18:00'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
                                            <Calendar size={16} />
                                        </div>
                                        <div>
                                            <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Working Days</div>
                                            <div className="flex gap-1.5 mt-1">
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                                    const workingDays = Array.isArray(user.working_days) ? user.working_days : (typeof user.working_days === 'string' ? JSON.parse(user.working_days || '[]') : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
                                                    const isWorking = workingDays.includes(day);
                                                    return (
                                                        <span key={day} className={`w-5 h-5 flex items-center justify-center rounded-md text-[9px] font-black ${isWorking ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-600/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'}`}>
                                                            {day[0]}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
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
                                            className="group relative flex items-center justify-center gap-3 px-10 py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-black rounded-2xl shadow-lg hover:shadow-green-500/40 transition-all active:scale-95 overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                            <LogIn size={24} className="relative z-10 group-hover:rotate-12 transition-transform" />
                                            <span className="relative z-10">START SHIFT</span>
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

                {/* Performance & Highlights Side */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Monthly Summary Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Trophy size={80} />
                        </div>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Sun className="w-4 h-4 text-amber-500" />
                            Monthly Summary
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-green-600 shadow-sm">
                                        <CheckCircle size={18} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Present Days</span>
                                </div>
                                <span className="text-xl font-black text-green-600">{monthlyStats.presentDays}</span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-amber-600 shadow-sm">
                                        <Clock size={18} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Late Arrivals</span>
                                </div>
                                <span className="text-xl font-black text-amber-600">{monthlyStats.lateDays}</span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-lyceum-blue/5 rounded-2xl border border-lyceum-blue/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-lyceum-blue shadow-sm">
                                        <History size={18} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Hours Worked</span>
                                </div>
                                <span className="text-xl font-black text-lyceum-blue">{monthlyStats.totalHours}h</span>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Holiday Card */}
                    {nextHoliday && (
                        <div className="bg-gradient-to-br from-indigo-600 to-lyceum-blue p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                                <Moon size={80} />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-80">
                                <Calendar className="w-3 h-3" />
                                Upcoming Holiday
                            </h3>
                            <div className="relative z-10">
                                <div className="text-2xl font-black mb-1">{nextHoliday.name}</div>
                                <div className="text-sm opacity-90 font-medium">
                                    {new Date(nextHoliday.date).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                                </div>
                            </div>
                            <div className="mt-6 flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/20">
                                <div className="text-xs font-bold italic">Enjoy your upcoming break! ✨</div>
                            </div>
                        </div>
                    )}
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
                                                <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase ${log.status === 'Late' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40' : 'bg-green-100 text-green-600 dark:bg-green-900/40'}`}>
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
                    </div >
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
                                        <button 
                                            onClick={() => handleViewStaffHistory(s)}
                                            className="p-2 text-lyceum-blue hover:bg-lyceum-blue/10 rounded-lg transition-colors"
                                        >
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
        </div>
    );

    const renderStaffAttendanceModal = () => {
        if (!viewingStaffHistory) return null;

        const grouped = staffLogs.reduce((acc: any, log) => {
            const date = new Date(log.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (!acc[monthKey]) acc[monthKey] = [];
            acc[monthKey].push(log);
            return acc;
        }, {});

        const sortedMonths = Object.keys(grouped).sort((a, b) => {
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            return (yearB * 12 + monthB) - (yearA * 12 + monthA);
        });

        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-800">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-3xl bg-lyceum-blue/10 flex items-center justify-center text-lyceum-blue shadow-inner">
                                <UserCircle size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{viewingStaffHistory.name}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs font-bold text-lyceum-blue uppercase tracking-widest bg-blue-50 dark:bg-blue-900/40 px-3 py-1 rounded-full">{viewingStaffHistory.role}</span>
                                    <span className="text-xs text-gray-400 font-medium">{viewingStaffHistory.email}</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setViewingStaffHistory(null)}
                            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all hover:rotate-90"
                        >
                            <X size={24} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-10 space-y-12">
                        {loadingStaffLogs ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 size={48} className="animate-spin text-lyceum-blue opacity-20" />
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Fetching records...</p>
                            </div>
                        ) : sortedMonths.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="inline-flex p-6 bg-gray-50 dark:bg-gray-900/50 rounded-full mb-4">
                                    <History size={48} className="text-gray-200" />
                                </div>
                                <p className="text-gray-400 font-medium italic">No attendance history found for this employee.</p>
                            </div>
                        ) : (
                            sortedMonths.map(monthKey => {
                                const [year, month] = monthKey.split('-').map(Number);
                                const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
                                const logs = grouped[monthKey];

                                return (
                                    <div key={monthKey} className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-lg font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">{monthName} {year}</h4>
                                            <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent dark:from-gray-700"></div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{logs.length} Days</span>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-gray-50/50 dark:bg-gray-900/30">
                                                    <tr>
                                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">In / Out</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                    {logs.map((log: any) => (
                                                        <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <div className="text-sm font-bold text-gray-700 dark:text-gray-200">{new Date(log.date).getDate()} {monthName.slice(0,3)}</div>
                                                                <div className="text-[10px] text-gray-400 font-medium">{new Date(log.date).toLocaleString('default', { weekday: 'long' })}</div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[9px] uppercase font-bold opacity-50">In</span>
                                                                        <span className="text-green-600 font-black">{log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                                    </div>
                                                                    <div className="w-px h-8 bg-gray-100 dark:bg-gray-700 mx-2"></div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[9px] uppercase font-bold opacity-50">Out</span>
                                                                        <span className="text-red-500 font-black">{log.check_out ? new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-center">
                                                                <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${log.status === 'Late' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40' : 'bg-green-100 text-green-600 dark:bg-green-900/40'}`}>
                                                                    {log.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderHolidays = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Add Holiday Form */}
            <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-6">Schedule Holiday</h3>
                    <form onSubmit={handleAddHoliday} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-lyceum-blue outline-none"
                                    value={newHoliday.date}
                                    onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date (Optional)</label>
                                <input
                                    type="date"
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-lyceum-blue outline-none"
                                    value={newHoliday.endDate}
                                    onChange={e => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
                                />
                            </div>
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
                                <th className="px-6 py-4">Leave Balance</th>
                                <th className="px-6 py-4 text-center">Last Leave</th>
                                <th className="px-6 py-4">Reason</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {leaveList.map(leave => (
                                <tr key={leave.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4"><div className="font-bold">{leave.user_name}</div><div className="text-xs text-gray-500">{leave.user_email}</div></td>
                                    <td className="px-6 py-4"><div className="font-medium">{new Date(leave.start_date).toLocaleDateString()}</div><div className="text-xs text-gray-500 text-[10px] italic">to {new Date(leave.end_date).toLocaleDateString()}</div></td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold ring-1 ring-indigo-500/10">
                                            {leave.unclaimedLeaves} Days Remaining
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {leave.lastLeaveDate ? (
                                            <div className="text-[11px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 py-1 px-2 rounded-lg inline-block">
                                                {new Date(leave.lastLeaveDate).toLocaleDateString()}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 italic">No prior leave</span>
                                        )}
                                    </td>
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
        <div className="space-y-6 animate-fade-in pb-10 relative">
            {/* Toast Notification */}
            {geoToast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border transition-all duration-300 ${
                    geoToast.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/90 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
                        : 'bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
                }`}>
                    {geoToast.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold text-sm">{geoToast.msg}</span>
                    <button onClick={() => setGeoToast(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteId !== null && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-sm w-full text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={28} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">Remove Branch?</h3>
                        <p className="text-sm text-gray-500 mb-8">This will delete the branch and its geofence. Staff assigned to it won't be able to check-in here.</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteBranch(confirmDeleteId)}
                                disabled={deletingBranchId === confirmDeleteId}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {deletingBranchId === confirmDeleteId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-lyceum-blue/10 rounded-xl text-lyceum-blue"><Navigation size={24} /></div>
                        Branch Geofencing
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 ml-12">Control which physical locations staff can check-in from.</p>
                </div>
                {branches.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-black text-green-700 dark:text-green-400">{branches.length} Active {branches.length === 1 ? 'Branch' : 'Branches'}</span>
                    </div>
                )}
            </div>

            {/* Add Branch Form */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-lyceum-blue/5 to-transparent flex items-center gap-3">
                    <Plus size={18} className="text-lyceum-blue" />
                    <h3 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider">Add a Branch</h3>
                </div>
                <form onSubmit={handleSaveBranch} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                        {/* Branch Name */}
                        <div className="space-y-2 lg:col-span-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Branch Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Main Campus"
                                value={branchForm.name}
                                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                                className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-lyceum-blue focus:ring-2 focus:ring-lyceum-blue/20 outline-none font-bold text-gray-700 dark:text-gray-200 transition-all"
                                required
                            />
                        </div>

                        {/* Coordinates */}
                        <div className="space-y-2 lg:col-span-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coordinates</label>
                                <button
                                    type="button"
                                    onClick={handleUseCurrentLocationForBranch}
                                    disabled={gpsLoading}
                                    className="flex items-center gap-1.5 text-xs font-black text-lyceum-blue hover:text-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {gpsLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                                    {gpsLoading ? 'Fetching...' : 'Use My Location'}
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Latitude"
                                    value={branchForm.lat}
                                    onChange={(e) => setBranchForm({ ...branchForm, lat: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                    className="flex-1 px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-lyceum-blue focus:ring-2 focus:ring-lyceum-blue/20 outline-none font-mono text-sm transition-all"
                                    required
                                />
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Longitude"
                                    value={branchForm.lng}
                                    onChange={(e) => setBranchForm({ ...branchForm, lng: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                    className="flex-1 px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-lyceum-blue focus:ring-2 focus:ring-lyceum-blue/20 outline-none font-mono text-sm transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Radius */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Radius (Meters)</label>
                            <input
                                type="number"
                                min="10"
                                max="5000"
                                placeholder="50"
                                value={branchForm.radius}
                                onChange={(e) => setBranchForm({ ...branchForm, radius: parseInt(e.target.value) })}
                                className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-lyceum-blue focus:ring-2 focus:ring-lyceum-blue/20 outline-none font-bold transition-all"
                                required
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex flex-col justify-end">
                            <button
                                type="submit"
                                disabled={savingBranch}
                                className="w-full px-6 py-3.5 bg-lyceum-blue hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
                            >
                                {savingBranch ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                {savingBranch ? 'Saving...' : 'Save Branch'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Branch List */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MapPin size={18} className="text-lyceum-blue" />
                        <h3 className="text-base font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider">Configured Branches</h3>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{branches.length} total</span>
                </div>

                {branches.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="flex flex-col items-center gap-5">
                            <div className="relative">
                                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center">
                                    <Navigation size={40} className="text-gray-300 dark:text-gray-600" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                    <Plus size={16} className="text-amber-500" />
                                </div>
                            </div>
                            <div>
                                <p className="font-black text-gray-800 dark:text-white uppercase text-sm tracking-widest">No Branches Yet</p>
                                <p className="text-sm text-gray-400 mt-2 max-w-xs">Add your first branch using the form above. Staff can only check-in from within configured geofences.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {branches.map((b, index) => (
                            <div key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-8 py-6 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors group">
                                {/* Left: Branch info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-2xl bg-lyceum-blue/10 flex items-center justify-center flex-shrink-0 text-lyceum-blue font-black text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-black text-gray-900 dark:text-gray-100 text-base truncate">{b.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-lg">
                                                {Number(b.lat).toFixed(6)}, {Number(b.lng).toFixed(6)}
                                            </span>
                                            <a
                                                href={`https://maps.google.com/?q=${b.lat},${b.lng}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs font-bold text-lyceum-blue hover:underline flex items-center gap-1"
                                            >
                                                <Navigation size={10} /> View
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Radius editor */}
                                <div className="flex items-center gap-3">
                                    {editingBranchId === b.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="10"
                                                max="5000"
                                                value={editRadius}
                                                onChange={e => setEditRadius(parseInt(e.target.value))}
                                                className="w-24 px-3 py-2 text-sm font-bold rounded-xl bg-white dark:bg-gray-900 border-2 border-lyceum-blue outline-none text-center font-mono"
                                                autoFocus
                                            />
                                            <span className="text-xs text-gray-500 font-bold">m</span>
                                            <button
                                                onClick={() => handleSaveEditRadius(b)}
                                                disabled={savingEditRadius}
                                                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                                title="Save radius"
                                            >
                                                {savingEditRadius ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                            </button>
                                            <button
                                                onClick={() => setEditingBranchId(null)}
                                                className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl transition-all"
                                                title="Cancel"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-lyceum-blue rounded-2xl text-xs font-black ring-1 ring-lyceum-blue/10">
                                                <div className="w-1.5 h-1.5 bg-lyceum-blue rounded-full" />
                                                {b.radius}m radius
                                            </div>
                                            <button
                                                onClick={() => { setEditingBranchId(b.id); setEditRadius(b.radius); }}
                                                className="p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-lyceum-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                title="Edit radius"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Delete */}
                                <button
                                    onClick={() => setConfirmDeleteId(b.id)}
                                    disabled={deletingBranchId === b.id}
                                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all disabled:opacity-50 flex-shrink-0"
                                    title="Remove branch"
                                >
                                    {deletingBranchId === b.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // ============================================================
    // PAYSLIPS RENDERER
    // ============================================================
    const renderPayslips = () => {
        const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const monthLabel = (m: number) => MONTHS[m - 1] ?? `Month ${m}`;

        const handleGeneratePayroll = async () => {
            setGeneratingPayroll(true);
            try {
                const res = await api.generateAndSavePayroll(payslipMonth + 1, payslipYear);
                if (res && res.success) {
                    showPayslipToast('success', `✅ Generated ${res.count} payslips for ${MONTHS[payslipMonth]} ${payslipYear}`);
                    await fetchPayslips();
                }
            } catch (err: any) {
                showPayslipToast('error', err.message || 'Failed to generate payroll');
            } finally {
                setGeneratingPayroll(false);
            }
        };

        const handleSaveSchedule = async () => {
            setSavingSchedule(true);
            try {
                await api.savePayrollSchedule(payrollSchedule);
                showPayslipToast('success', `✅ Auto-payroll schedule saved: ${payrollSchedule.dayOfMonth}th of every month at ${String(payrollSchedule.hour).padStart(2,'0')}:${String(payrollSchedule.minute).padStart(2,'0')}`);
            } catch (err: any) {
                showPayslipToast('error', err.message || 'Failed to save schedule');
            } finally {
                setSavingSchedule(false);
            }
        };

        const handleDownload = (slip: any) => {
            try {
                let slipData = slip.data;
                if (typeof slipData === 'string') {
                    slipData = JSON.parse(slipData);
                }
                
                // Ensure the PDF generator has month/year from parent record if missing in data blob
                const finalDataForPDF = {
                    ...slipData,
                    month: slipData.month || slip.month,
                    year: slipData.year || slip.year,
                    userName: slipData.userName || slipData.name || slip.user_name
                };

                downloadPayslip(finalDataForPDF);
            } catch (err) {
                console.error("PDF Generation Error Details:", err);
                showPayslipToast('error', 'Could not generate PDF');
            }
        };

        const handleSaveAdjustments = async () => {
            if (!editingSlip) return;
            setSavingAdjustments(true);
            try {
                const res = await api.updatePayslipAdjustments(editingSlip.id, {
                    bonus: Number(adjustmentBonus),
                    overtime_hours: Number(adjustmentOvertime)
                });
                if (res && res.success) {
                    setPayslips(prev => prev.map(p => p.id === editingSlip.id ? { ...p, data: res.data } : p));
                    showPayslipToast('success', '✅ Adjustments saved successfully');
                    setEditingSlip(null);
                }
            } catch (err: any) {
                showPayslipToast('error', err.message || 'Failed to save adjustments');
            } finally {
                setSavingAdjustments(false);
            }
        };

        if (user.role === 'Admin') {
            const groupedByMonth: Record<string, any[]> = {};
            payslips.forEach(slip => {
                const key = `${MONTHS[slip.month - 1]} ${slip.year}`;
                if (!groupedByMonth[key]) groupedByMonth[key] = [];
                groupedByMonth[key].push(slip);
            });

            return (
                <div className="animate-fade-in space-y-6">
                    {/* Toast */}
                    {payslipToast && (
                        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all duration-300 ${ payslipToast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
                            {payslipToast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            {payslipToast.msg}
                            <button onClick={() => setPayslipToast(null)} className="ml-2 opacity-80 hover:opacity-100"><X size={14}/></button>
                        </div>
                    )}

                    {/* Generate Payroll Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40"><DollarSign size={20} className="text-indigo-600 dark:text-indigo-400"/></div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Generate Payroll</h2>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Month/Year picker */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Select Period</label>
                                <div className="flex gap-3">
                                    <select
                                        value={payslipMonth}
                                        onChange={e => setPayslipMonth(Number(e.target.value))}
                                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                    </select>
                                    <select
                                        value={payslipYear}
                                        onChange={e => setPayslipYear(Number(e.target.value))}
                                        className="w-28 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y}>{y}</option>)}
                                    </select>
                                </div>
                                <button
                                    onClick={handleGeneratePayroll}
                                    disabled={generatingPayroll}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-60"
                                >
                                    {generatingPayroll ? <><Loader2 size={18} className="animate-spin"/> Generating...</> : <><DollarSign size={18}/> Generate & Save Payroll</>}
                                </button>
                            </div>

                            {/* Auto-Schedule Config */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Auto-Generation Schedule</label>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Day of Month</span>
                                        <input
                                            type="number" min={1} max={28}
                                            value={payrollSchedule.dayOfMonth}
                                            onChange={e => setPayrollSchedule(s => ({...s, dayOfMonth: Number(e.target.value)}))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Hour (24h)</span>
                                        <input
                                            type="number" min={0} max={23}
                                            value={payrollSchedule.hour}
                                            onChange={e => setPayrollSchedule(s => ({...s, hour: Number(e.target.value)}))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Minute</span>
                                        <input
                                            type="number" min={0} max={59}
                                            value={payrollSchedule.minute}
                                            onChange={e => setPayrollSchedule(s => ({...s, minute: Number(e.target.value)}))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none mt-1"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveSchedule}
                                    disabled={savingSchedule}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 border-2 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all disabled:opacity-60"
                                >
                                    {savingSchedule ? <><Loader2 size={16} className="animate-spin"/>Saving...</> : <><Check size={16}/> Save Auto-Schedule</>}
                                </button>
                                <p className="text-xs text-gray-400 dark:text-gray-500">💡 Auto-payroll generates for the previous month on the configured date at midnight.</p>
                            </div>
                        </div>
                    </div>

                    {/* Payslips History */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/40"><FileText size={20} className="text-emerald-600 dark:text-emerald-400"/></div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Payslips</h2>
                            </div>
                            <span className="text-sm text-gray-400">{payslips.length} record{payslips.length !== 1 ? 's' : ''}</span>
                        </div>
                        {payslips.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <FileText size={48} className="mb-4 opacity-30"/>
                                <p className="font-semibold">No payslips generated yet</p>
                                <p className="text-sm mt-1">Use the generator above to create the first payroll batch.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Employee</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Schedule</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Base Salary</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Deductions</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Net Pay</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {(() => {
                                            const grouped = payslips.reduce((acc, slip) => {
                                                const key = `${slip.year}-${String(slip.month).padStart(2, '0')}`;
                                                if (!acc[key]) acc[key] = [];
                                                acc[key].push(slip);
                                                return acc;
                                            }, {} as Record<string, typeof payslips>);
                                            
                                            const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
                                            
                                            return sortedKeys.map(key => {
                                                const [year, month] = key.split('-').map(Number);
                                                const monthSlips = grouped[key];
                                                return (
                                                    <React.Fragment key={key}>
                                                        <tr className="bg-gray-50/40 dark:bg-gray-800/60 sticky top-0 z-10">
                                                            <td colSpan={6} className="px-6 py-2.5 bg-gray-50 dark:bg-gray-700/50">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                                                                    <span className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
                                                                        {monthLabel(month)} {year}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 font-medium ml-1">({monthSlips.length} records)</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {monthSlips.map(slip => (
                                                            <tr key={slip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                                                                            {slip.user_name?.[0]?.toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-semibold text-gray-900 dark:text-white">{slip.user_name}</div>
                                                                            <div className="text-xs text-gray-400">{slip.user_email}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg inline-block border border-gray-100 dark:border-gray-600">
                                                                        {Array.isArray(slip.data?.working_days) ? slip.data.working_days.join(', ') : 'Mon-Fri'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">₹{(slip.data?.baseSalary || 0).toLocaleString()}</td>
                                                                <td className="px-6 py-4 text-right font-mono text-red-500">-₹{((slip.data?.absentDeduction || 0) + (slip.data?.lateDeduction || 0)).toFixed(0)}</td>
                                                                <td className="px-6 py-4 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">₹{(slip.data?.finalSalary || 0).toLocaleString()}</td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => handleDownload(slip)}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                                                                            title="Download PDF"
                                                                        >
                                                                            <Download size={13}/> PDF
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingSlip(slip);
                                                                                setAdjustmentBonus(String(slip.data?.bonus || 0));
                                                                                setAdjustmentOvertime(String(slip.data?.overtime_hours || 0));
                                                                            }}
                                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                                            title="Edit Adjustments (Bonus/OT)"
                                                                        >
                                                                            <Pencil size={15}/>
                                                                        </button>
                                                                        <button
                                                                            onClick={async () => {
                                                                                if (window.confirm("Are you sure you want to delete this payslip?")) {
                                                                                    try {
                                                                                        await api.deletePayslip(slip.id);
                                                                                        setPayslips(prev => prev.filter(p => p.id !== slip.id));
                                                                                        setPayslipToast({ type: 'success', msg: 'Payslip deleted successfully' });
                                                                                    } catch (err) {
                                                                                        setPayslipToast({ type: 'error', msg: 'Failed to delete payslip' });
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                                            title="Delete Payslip"
                                                                        >
                                                                            <Trash2 size={15}/>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Adjustment Modal */}
                    {editingSlip && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40"><Pencil size={18} className="text-indigo-600 dark:text-indigo-400"/></div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">Adjust Payslip</h3>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{editingSlip.user_name} • {monthLabel(editingSlip.month)} {editingSlip.year}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setEditingSlip(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={18}/></button>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Additional Bonus (₹)</label>
                                        <input
                                            type="number"
                                            value={adjustmentBonus}
                                            onChange={e => setAdjustmentBonus(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Overtime Hours</label>
                                        <input
                                            type="number"
                                            value={adjustmentOvertime}
                                            onChange={e => setAdjustmentOvertime(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="0"
                                        />
                                        <p className="text-[10px] text-gray-400 italic">OT pay is calculated as: (Daily Rate / {editingSlip.data?.shiftHours || 8}) per hour.</p>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            onClick={() => setEditingSlip(null)}
                                            className="flex-1 px-6 py-3 border-2 border-gray-100 dark:border-gray-700 text-gray-500 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveAdjustments}
                                            disabled={savingAdjustments}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
                                        >
                                            {savingAdjustments ? <Loader2 size={18} className="animate-spin inline mr-2"/> : <Check size={18} className="inline mr-2"/>}
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Staff view - own payslips only
        return (
            <div className="animate-fade-in space-y-6">
                {payslipToast && (
                    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold text-white ${ payslipToast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
                        {payslipToast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {payslipToast.msg}
                    </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40"><FileText size={22} className="text-indigo-600 dark:text-indigo-400"/></div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Payslips</h2>
                        <p className="text-sm text-gray-400">Your salary statements auto-generated each month</p>
                    </div>
                </div>
                {payslips.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-gray-400">
                        <FileText size={52} className="mb-4 opacity-25"/>
                        <p className="font-semibold text-lg">No payslips available yet</p>
                        <p className="text-sm mt-1">Payslips are generated automatically each month by your admin.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {payslips.map(slip => (
                            <div key={slip.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-bold text-lg">{MONTHS[slip.month - 1]} {slip.year}</div>
                                        <div className="text-indigo-200 text-sm">{slip.user_name}</div>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(slip)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-all"
                                    >
                                        <Download size={15}/> PDF
                                    </button>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Shift</div>
                                        <div className="font-semibold text-gray-700 dark:text-gray-200">{slip.data?.shiftStart ?? '--'} – {slip.data?.shiftEnd ?? '--'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Working Days</div>
                                        <div className="font-semibold text-gray-700 dark:text-gray-200">{slip.data?.workingDays ?? '--'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Present</div>
                                        <div className="font-semibold text-emerald-600">{slip.data?.presentDays ?? '--'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Absent</div>
                                        <div className="font-semibold text-red-500">{slip.data?.absentDays ?? '--'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Late Deduction</div>
                                        <div className="font-semibold text-orange-500">-₹{(slip.data?.lateDeduction ?? 0).toFixed(0)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Absent Deduction</div>
                                        <div className="font-semibold text-red-500">-₹{(slip.data?.absentDeduction ?? 0).toFixed(0)}</div>
                                    </div>
                                    <div className="col-span-2 border-t border-gray-100 dark:border-gray-700 pt-4 flex justify-between items-center">
                                        <div className="text-sm text-gray-400">Base Salary</div>
                                        <div className="font-mono text-gray-700 dark:text-gray-200">₹{(slip.data?.baseSalary ?? 0).toLocaleString()}</div>
                                    </div>
                                    <div className="col-span-2 flex justify-between items-center">
                                        <div className="text-base font-bold text-gray-800 dark:text-white">Net Pay</div>
                                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{(slip.data?.finalSalary ?? 0).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

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
                                    <CheckCircle size={16} /> Leave Requests
                                </button>
                                <button onClick={() => setActiveTab('holidays')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'holidays' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                                    <Calendar size={16} /> Holidays
                                </button>
                                <button onClick={() => setActiveTab('geofencing')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'geofencing' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                                    <Navigation size={16} /> Geofencing
                                </button>
                                <button onClick={() => setActiveTab('payslips')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'payslips' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                                    <DollarSign size={16} /> Payslips
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
                        <button onClick={() => setActiveTab('payslips')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'payslips' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <DollarSign size={18} /> Payslips
                        </button>
                    </div>
                )}
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-300">
                {activeTab === 'me' && renderMyAttendance()}
                {activeTab === 'staff' && renderStaffMgmt()}
                {activeTab === 'holidays' && renderHolidays()}
                {activeTab === 'leaves' && renderMyLeaves()}
                {activeTab === 'manageRequests' && renderManageLeaves()}
                {activeTab === 'geofencing' && user.role === 'Admin' && renderGeofencing()}
                {activeTab === 'payslips' && renderPayslips()}
            </div>

            {renderStaffAttendanceModal()}

            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default AttendanceView;
