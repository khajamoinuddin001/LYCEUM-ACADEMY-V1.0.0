import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import * as api from '../utils/api';
import { Calendar, Clock, CheckCircle, AlertCircle, DollarSign, Download, Plus, Trash2 } from './icons';

interface AttendanceViewProps {
    user: User;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ user }) => {
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

    // Initial load
    useEffect(() => {
        fetchMyAttendance();
        if (user.role === 'Admin') {
            fetchHolidays();
            fetchStaff();
        }
    }, [user.role]);

    const fetchMyAttendance = async () => {
        try {
            const logs = await api.getAttendanceHistory() as any[];
            setMyLogs(logs);
            // Check today's status
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
            fetchMyAttendance();
        } catch (error: any) {
            alert(error.message || "Check-in failed");
        }
    };

    const handleCheckOut = async () => {
        try {
            await api.checkOut();
            fetchMyAttendance();
        } catch (error: any) {
            alert(error.message || "Check-out failed");
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

    // Render components
    const renderMyAttendance = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-6">Today's Attendance</h2>
                <div className="text-6xl font-mono mb-8 text-gray-700 dark:text-gray-200">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                {todayLog?.status === 'Late' && (
                    <div className="mb-4 inline-flex items-center text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-full">
                        <AlertCircle size={20} className="mr-2" />
                        <span>You were marked Late today</span>
                    </div>
                )}

                <div className="flex gap-4 justify-center">
                    {!todayLog ? (
                        <button onClick={handleCheckIn} className="px-8 py-4 bg-green-600 text-white text-xl font-bold rounded-lg hover:bg-green-700 shadow-lg active:scale-95 transition-all">
                            CHECK IN
                        </button>
                    ) : !todayLog.check_out ? (
                        <button onClick={handleCheckOut} className="px-8 py-4 bg-red-600 text-white text-xl font-bold rounded-lg hover:bg-red-700 shadow-lg active:scale-95 transition-all">
                            CHECK OUT
                        </button>
                    ) : (
                        <div className="text-xl font-bold text-gray-500">
                            Check-out recorded at {new Date(todayLog.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Start Time</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">End Time</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {myLogs.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No attendance history</td></tr>
                        ) : myLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="p-4">{new Date(log.date).toLocaleDateString()}</td>
                                <td className="p-4 text-green-600 font-medium">{log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                <td className="p-4 text-red-500 font-medium">{log.check_out ? new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${log.status === 'Late' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {log.status || 'Present'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderPayroll = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border flex items-end gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Month</label>
                    <select value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Year</label>
                    <select value={reportYear} onChange={e => setReportYear(Number(e.target.value))} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>
                </div>
                <button
                    onClick={generatePayroll}
                    className="px-4 py-2 bg-lyceum-blue text-white rounded-md hover:bg-blue-700"
                >
                    Generate Report
                </button>
            </div>

            {loading ? <div className="text-center py-8">Generating...</div> : payrollReport.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-3">Staff Name</th>
                                <th className="p-3">Base Salary</th>
                                <th className="p-3">Working Days</th>
                                <th className="p-3">Present</th>
                                <th className="p-3">Late (Ded.)</th>
                                <th className="p-3">Absent (Ded.)</th>
                                <th className="p-3 font-bold text-right">Final Salary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {payrollReport.map(row => (
                                <tr key={row.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-3 font-medium">{row.name}</td>
                                    <td className="p-3">{row.baseSalary.toLocaleString()}</td>
                                    <td className="p-3">{row.workingDays}</td>
                                    <td className="p-3 text-green-600">{row.presentDays}</td>
                                    <td className="p-3 text-yellow-600">{row.lateDays}</td>
                                    <td className="p-3 text-red-600">{row.absentDays}</td>
                                    <td className="p-3 text-right font-bold text-lg">{row.finalSalary.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Attendance & Payroll</h1>
                {user.role === 'Admin' && (
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('me')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'me' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>My Attendance</button>
                        <button onClick={() => setActiveTab('staff')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'staff' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Staff Mgmt</button>
                        <button onClick={() => setActiveTab('holidays')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'holidays' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Holidays</button>
                        <button onClick={() => setActiveTab('payroll')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'payroll' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Payroll Report</button>
                    </div>
                )}
            </div>

            {activeTab === 'me' && renderMyAttendance()}
            {activeTab === 'payroll' && renderPayroll()}
            {activeTab === 'staff' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center text-gray-500">
                    Staff management (Salary/Shift settings) available next update.
                </div>
            )}
            {activeTab === 'holidays' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center text-gray-500">
                    Holiday calendar management available next update.
                </div>
            )}
        </div>
    );
};

export default AttendanceView;
