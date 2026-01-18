import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import * as api from '../utils/api';
import { Calendar, Clock, CheckCircle, AlertCircle, DollarSign, Download, Plus, Trash2, UserCircle, Users, UserCheck, LogIn, LogOut } from './icons';

interface AttendanceViewProps {
    user: User;
    users?: User[];
    onUpdateUser?: (userId: number, updates: Partial<User>) => Promise<void>;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ user, users = [], onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<'me' | 'staff' | 'holidays' | 'payroll'>('me');
    const [myLogs, setMyLogs] = useState<any[]>([]);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [todayLog, setTodayLog] = useState<any | null>(null);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [payrollReport, setPayrollReport] = useState<any[]>([]);
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [staffList, setStaffList] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Holiday Form state
    const [newHoliday, setNewHoliday] = useState({ date: '', description: '' });

    // Current Time for Clock
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchMyAttendance();
        if (user.role === 'Admin') {
            fetchHolidays();
            if (users && users.length > 0) {
                setStaffList(users.filter(u => u.role !== 'Student'));
            } else {
                fetchStaff();
            }
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

    const handleCheckIn = async () => {
        try {
            await api.checkIn();
            await fetchMyAttendance();
        } catch (error: any) {
            alert(error.message || "Check-in failed");
        }
    };

    const handleCheckOut = async () => {
        try {
            await api.checkOut();
            await fetchMyAttendance();
        } catch (error: any) {
            alert(error.message || "Check-out failed");
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

    const renderMyAttendance = () => (
        <div className="space-y-8 animate-fade-in">
            {/* Status Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Clock size={120} />
                </div>

                <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">Real-time Clock</h2>
                <div className="text-6xl font-bold mb-8 text-lyceum-blue dark:text-lyceum-blue-light tracking-tight">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>

                <div className="flex flex-col items-center gap-6">
                    {!todayLog ? (
                        <button
                            onClick={handleCheckIn}
                            className="group relative flex items-center justify-center gap-3 px-12 py-5 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-2xl shadow-lg hover:shadow-green-500/30 transition-all active:scale-95"
                        >
                            <LogIn size={28} />
                            <span>CHECK IN</span>
                        </button>
                    ) : !todayLog.check_out ? (
                        <div className="w-full">
                            <div className="mb-6 py-3 px-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 font-medium flex items-center justify-center gap-2">
                                <CheckCircle size={20} />
                                Checked in at {new Date(todayLog.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <button
                                onClick={handleCheckOut}
                                className="group relative flex items-center justify-center gap-3 px-12 py-5 bg-red-600 hover:bg-red-700 text-white text-2xl font-bold rounded-2xl shadow-lg hover:shadow-red-500/30 transition-all active:scale-95 w-full max-w-sm mx-auto"
                            >
                                <LogOut size={28} />
                                <span>CHECK OUT</span>
                            </button>
                        </div>
                    ) : (
                        <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Shift Completed</div>
                            <div className="text-gray-500 dark:text-gray-400">
                                Check-out recorded at {new Date(todayLog.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    )}
                </div>

                {todayLog?.status === 'Late' && (
                    <div className="mt-8 inline-flex items-center gap-2 text-amber-700 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-full text-sm font-semibold">
                        <AlertCircle size={18} />
                        <span>Late Arrival Reported</span>
                    </div>
                )}
            </div>

            {/* History Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Recent Attendance</h3>
                    <button className="text-sm text-lyceum-blue hover:underline">View Full History</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Shift Start</th>
                                <th className="px-6 py-4 font-semibold">Shift End</th>
                                <th className="px-6 py-4 font-semibold">Duration</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {myLogs.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No attendance records found.</td></tr>
                            ) : myLogs.map(log => {
                                const duration = log.check_in && log.check_out ?
                                    Math.round((new Date(log.check_out).getTime() - new Date(log.check_in).getTime()) / 3600000 * 10) / 10 + ' hrs'
                                    : '-';
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-green-600 dark:text-green-400 font-mono text-sm bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                                {log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-red-600 dark:text-red-400 font-mono text-sm bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                                {log.check_out ? new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{duration}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${log.status === 'Late' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                                }`}>
                                                {log.status === 'Late' ? 'LATE' : 'PRESENT'}
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
    );

    const renderStaffMgmt = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold">Staff Salary & Shift Settings</h3>
                    <p className="text-sm text-gray-500">Configure base salaries and working hours for each staff member.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Staff Member</th>
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
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
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
            </div>
        </div>
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
                <button
                    onClick={generatePayroll}
                    disabled={loading}
                    className="px-8 py-3 bg-lyceum-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <DollarSign size={20} />}
                    {loading ? 'Processing...' : 'Generate Payroll Report'}
                </button>
            </div>

            {payrollReport.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-5 font-bold">Staff Details</th>
                                    <th className="px-6 py-5 font-bold">Base Salary</th>
                                    <th className="px-6 py-5 font-bold">Working Days</th>
                                    <th className="px-6 py-5 font-bold">Present / Late</th>
                                    <th className="px-6 py-5 font-bold">Deductions</th>
                                    <th className="px-6 py-5 font-bold text-right">Final Pay</th>
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
                                                <span className="text-green-600 font-bold">{row.presentDays}P</span>
                                                <span className="text-amber-600 font-bold">{row.lateDays}L</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-red-600 font-bold">
                                            -₹{((row.baseSalary / row.workingDays) * (row.workingDays - row.presentDays) + (row.lateDays * 50)).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-lg text-lyceum-blue">₹{row.finalSalary.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
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

                {user.role === 'Admin' && (
                    <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl shadow-inner w-full md:w-auto overflow-x-auto whitespace-nowrap">
                        <button onClick={() => setActiveTab('me')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'me' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <Clock size={18} /> My Dashboard
                        </button>
                        <button onClick={() => setActiveTab('staff')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <Users size={18} /> Staff Settings
                        </button>
                        <button onClick={() => setActiveTab('holidays')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'holidays' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <Calendar size={18} /> Holidays
                        </button>
                        <button onClick={() => setActiveTab('payroll')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'payroll' ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <DollarSign size={18} /> Payroll Report
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
            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default AttendanceView;
