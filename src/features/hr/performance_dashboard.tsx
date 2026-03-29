import React, { useState, useEffect } from 'react';
import {
    Trophy, Users, Calendar, CheckCircle2, AlertCircle, TrendingUp,
    Star, Clock, ChevronRight, Filter, Download, Info,
    ArrowUpRight, ArrowDownRight, UserCheck
} from '@/components/common/icons';
import * as api from '@/utils/api';

interface PerformanceStat {
    userId: number;
    userName: string;
    month: number;
    year: number;
    attendanceScore: number;
    taskScore: number;
    clientScore: number;
    ticketScore: number;
    totalScore: number;
    isPip: boolean;
    pipNotes: string;
    pipCount: number;
    history?: { month: number; year: number; score: number }[];
    metrics: {
        targetWorkingDays: number;
        actualPresence: number;
        totalTasks: number;
        lateTasks: number;
        reviewCount: number;
        avgRating: number;
        totalTickets: number;
        resolvedTickets: number;
        recentReviews?: { rating: number; comment: string; date: string }[];
    }
}

const PerformanceDashboard: React.FC<{ userRole: string; currentUser: any }> = ({ userRole, currentUser }) => {
    const [stats, setStats] = useState<PerformanceStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showPipOnly, setShowPipOnly] = useState(false);
    const [viewingUserId, setViewingUserId] = useState<number | null>(null);
    const [guidanceDraft, setGuidanceDraft] = useState("");

    const isAdmin = userRole === 'Admin';

    useEffect(() => {
        fetchStats();
    }, [selectedMonth, selectedYear, viewingUserId]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const targetId = isAdmin ? (viewingUserId || undefined) : currentUser?.id;
            const data = await api.getPerformanceStats(selectedMonth, selectedYear, targetId);

            const results = Array.isArray(data) ? data : [data];
            setStats(results);

            if (results.length === 1) {
                setGuidanceDraft(results[0].pipNotes || "");
            }
        } catch (error) {
            console.error('Failed to fetch performance stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGuidance = async () => {
        if (!myStats) return;
        try {
            setLoading(true);
            await api.updatePipStatus(myStats.userId, selectedMonth, selectedYear, true, guidanceDraft);
            await fetchStats();
            alert("Guidance updated and sent to staff portal.");
        } catch (error) {
            alert("Failed to update guidance");
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    };

    if (loading && stats.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lyceum-blue"></div>
            </div>
        );
    }

    const myStats = isAdmin && viewingUserId
        ? stats.find(s => Number(s.userId) === Number(viewingUserId))
        : (stats.find(s => Number(s.userId) === Number(currentUser?.id)) || stats[0] || null);

    const isViewingDetail = !isAdmin || (isAdmin && viewingUserId);

    return (
        <div className="space-y-6 animate-fade-in p-2 min-h-screen font-sans">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {isAdmin && viewingUserId && (
                        <button
                            onClick={() => setViewingUserId(null)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-lyceum-blue"
                            title="Back to Leaderboard"
                        >
                            <ArrowDownRight className="transform rotate-180" size={24} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <Trophy className="text-yellow-500" />
                            {isAdmin && !viewingUserId ? 'Staff Leaderboard' : 'Employee Performance'}
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">
                            {isAdmin && !viewingUserId ? 'Compare and manage team performance metrics.' : `Detailed analysis for ${myStats?.userName || 'Staff member'}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none font-bold"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none font-bold"
                    >
                        {Array.from({ length: new Date().getFullYear() - 2023 + 1 }, (_, i) => 2023 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Individual Detail View */}
            {isViewingDetail && myStats ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Score Gauge */}
                        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                            <div className="relative w-48 h-48">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="96" cy="96" r="84"
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="14"
                                        className="text-gray-100 dark:text-gray-700"
                                    />
                                    <circle
                                        cx="96" cy="96" r="84"
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="14"
                                        strokeDasharray={528}
                                        strokeDashoffset={528 - (528 * (myStats?.totalScore || 0)) / 100}
                                        strokeLinecap="round"
                                        className="text-lyceum-blue"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-gray-800 dark:text-white">{myStats?.totalScore || 0}%</span>
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Monthly Index</span>
                                </div>
                            </div>
                            <div className="mt-8 flex flex-col items-center">
                                <h3 className="text-xl font-black text-gray-800 dark:text-gray-100">
                                    {isAdmin ? myStats?.userName : 'My Score Overview'}
                                </h3>
                                {myStats?.isPip && (
                                    <div className="mt-3 px-4 py-1.5 bg-red-100 text-red-600 text-[10px] font-black rounded-full animate-pulse flex items-center gap-1.5 border border-red-200 shadow-sm">
                                        <AlertCircle size={14} /> PIP STATUS ACTIVE
                                        {myStats.pipCount > 0 && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white rounded-md text-[9px]">X {myStats.pipCount}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Metrics Breakdown */}
                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { label: 'Attendance & Payroll', score: myStats?.attendanceScore, icon: <Calendar />, details: `${myStats?.metrics?.actualPresence || 0}/${myStats?.metrics?.targetWorkingDays || 0} days`, active: myStats?.settings?.attendance !== false },
                                { label: 'Tasks', score: myStats?.taskScore, icon: <Clock />, details: `${myStats?.metrics?.lateTasks || 0} late out of ${myStats?.metrics?.totalTasks || 0}`, active: myStats?.settings?.tasks !== false },
                                { label: 'Satisfaction', score: myStats?.clientScore, icon: <Star />, details: `${myStats?.metrics?.avgRating || 0}/10 (${myStats?.metrics?.reviewCount || 0} reviews)`, active: myStats?.settings?.reviews !== false },
                                { label: 'Tickets', score: myStats?.ticketScore, icon: <CheckCircle2 />, details: `${myStats?.metrics?.resolvedTickets || 0}/${myStats?.metrics?.totalTickets || 0} resolved`, active: myStats?.settings?.tickets !== false },
                            ].filter(m => m.active).map((m, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-5 hover:border-lyceum-blue/30 transition-colors group">
                                    <div className="p-4 bg-lyceum-blue/10 text-lyceum-blue rounded-xl group-hover:bg-lyceum-blue group-hover:text-white transition-colors">
                                        {m.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{m.label}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-2xl font-black text-gray-800 dark:text-white">{m.score}%</span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded font-black ${getScoreColor(m.score || 0)}`}>
                                                {(m.score || 0) >= 80 ? 'EXCELLENT' : (m.score || 0) >= 60 ? 'STABLE' : 'ACTION NEEDED'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1 font-bold">{m.details}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Performance History Chart */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                                <TrendingUp className="text-lyceum-blue" size={16} />
                                6-Month Performance Trend
                            </h3>
                            <div className="h-44 w-full flex items-end gap-3 px-4">
                                {myStats.history?.map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                                        <div
                                            className="w-full bg-lyceum-blue/20 group-hover:bg-lyceum-blue/50 rounded-t-xl transition-all duration-500 relative"
                                            style={{ height: `${h.score}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg font-black whitespace-nowrap shadow-xl">
                                                {h.score}%
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                            {new Date(0, h.month - 1).toLocaleString('default', { month: 'short' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Growth Feedback (Anonymous) */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                                <Star className="text-yellow-500" size={16} />
                                Recent Client Remarks
                            </h3>
                            <div className="space-y-4 max-h-[176px] overflow-y-auto pr-3 custom-scrollbar">
                                {myStats.metrics.recentReviews && myStats.metrics.recentReviews.length > 0 ? (
                                    myStats.metrics.recentReviews.map((r, i) => (
                                        <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-900 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, starIdx) => (
                                                            <Star
                                                                key={starIdx}
                                                                className={starIdx < Math.round(r.rating / 2) ? "text-yellow-500 fill-yellow-500" : "text-gray-300 dark:text-gray-700"}
                                                                size={10}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 ml-1">{r.rating}/10</span>
                                                </div>
                                                <span className="text-[9px] font-black text-gray-400 uppercase">{new Date(r.date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 italic font-medium leading-relaxed">"{r.comment || 'No feedback provided.'}"</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-gray-400">
                                        <Info className="mx-auto mb-3 opacity-20" size={40} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No recent feedback records</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PIP / Guidance Editor (Admin) or Display (Staff) */}
                        <div className="lg:col-span-2">
                            {isAdmin ? (
                                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border-2 border-lyceum-blue/20 bg-lyceum-blue/[0.02]">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                            <Info className="text-lyceum-blue" size={18} />
                                            Admin Performance Guidance
                                        </h3>
                                        <div className="px-3 py-1 bg-lyceum-blue/10 text-lyceum-blue text-[10px] font-black rounded-full uppercase">
                                            Visible to Staff
                                        </div>
                                    </div>
                                    <textarea
                                        value={guidanceDraft}
                                        onChange={(e) => setGuidanceDraft(e.target.value)}
                                        placeholder="Add specific instructions for this employee... e.g., 'You need to improve ticket response time. Aim for < 4 hours.'"
                                        className="w-full h-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 text-sm outline-none focus:border-lyceum-blue focus:ring-4 focus:ring-lyceum-blue/5 transition-all font-medium leading-relaxed"
                                    />
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={handleUpdateGuidance}
                                            className="px-8 py-3 bg-lyceum-blue text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl shadow-lyceum-blue/30 flex items-center gap-2 hover:translate-y-[-2px] active:translate-y-0"
                                        >
                                            <CheckCircle2 size={16} />
                                            Sync with Staff Portal
                                        </button>
                                    </div>
                                </div>
                            ) : myStats.isPip && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-red-500/5 border border-red-100 dark:border-red-900/30 overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
                                    <div className="p-8">
                                        <div className="flex items-start gap-6">
                                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl shadow-inner">
                                                <AlertCircle size={32} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                                        Performance Guidance
                                                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 text-[10px] rounded-full">ACTION REQUIRED</span>
                                                    </h4>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority Status</span>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 italic text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                                                    {myStats.pipNotes || "Standard improvement protocols in place. Please review your metrics and aim for a minimum index of 60% next month."}
                                                </div>
                                                <div className="mt-6 flex items-center justify-between border-t border-gray-50 dark:border-gray-700/50 pt-4">
                                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2">
                                                        <Info size={14} className="text-gray-400" />
                                                        Next Review: Next Assessment Period
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : isAdmin && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                        <div>
                            <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-3">
                                <Users className="text-lyceum-blue" />
                                Team Ranking & Status
                            </h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Real-time performance analytics</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPipOnly(!showPipOnly)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showPipOnly ? 'bg-red-600 text-white shadow-xl shadow-red-500/30 border border-red-500' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-lyceum-blue/50'}`}
                            >
                                {showPipOnly ? 'Displaying Critical (PIP)' : 'Filter Critical Only'}
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-8 py-5 font-black">Employee Profile</th>
                                    <th className="px-6 py-5 font-black text-center">Presence</th>
                                    <th className="px-6 py-5 font-black text-center">Task Load</th>
                                    <th className="px-6 py-5 font-black text-center">Support</th>
                                    <th className="px-6 py-5 font-black text-center">Satisfaction</th>
                                    <th className="px-6 py-5 font-black text-center">Performance Index</th>
                                    <th className="px-6 py-5 font-black text-center">Status</th>
                                    <th className="px-8 py-5 font-black text-right">View Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {stats
                                    .filter(s => !showPipOnly || s.isPip)
                                    .sort((a, b) => b.totalScore - a.totalScore)
                                    .map((s, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-lyceum-blue/[0.02] dark:hover:bg-lyceum-blue/[0.05] transition-all cursor-pointer group"
                                            onClick={() => setViewingUserId(Number(s.userId))}
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lyceum-blue to-blue-600 text-white flex items-center justify-center font-black text-xs uppercase shadow-lg shadow-lyceum-blue/20 group-hover:scale-110 transition-transform">
                                                        {s.userName.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-gray-800 dark:text-gray-200 text-sm">{s.userName}</span>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Employee Profile</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {s.settings?.attendance !== false ? (
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${getScoreColor(s.attendanceScore)}`}>
                                                        {s.attendanceScore}%
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {s.settings?.tasks !== false ? (
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${getScoreColor(s.taskScore)}`}>
                                                        {s.taskScore}%
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {s.settings?.tickets !== false ? (
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${getScoreColor(s.ticketScore)}`}>
                                                        {s.ticketScore}%
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {s.settings?.reviews !== false ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${getScoreColor(s.clientScore)}`}>
                                                            {s.metrics.reviewCount > 0 ? `${s.metrics.avgRating}/10` : '100%'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 mt-1.5 font-black uppercase tracking-widest">{s.metrics.reviewCount > 0 ? `${s.metrics.reviewCount} reviews` : 'Zero feedback'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex justify-center w-fit mx-auto">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-base font-black text-gray-900 dark:text-white">{s.totalScore}%</span>
                                                    <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-2 overflow-hidden shadow-inner">
                                                        <div className="h-full bg-lyceum-blue" style={{ width: `${s.totalScore}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {s.isPip ? (
                                                        <>
                                                            <span className="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg shadow-red-500/30 uppercase tracking-widest">
                                                                Critical (PIP)
                                                            </span>
                                                            {s.pipCount > 0 && (
                                                                <span className="text-[11px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md border border-red-100 dark:border-red-900/30 shadow-sm">
                                                                    X {s.pipCount}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg shadow-green-500/30 uppercase tracking-widest">
                                                            Stable
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="inline-flex p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:bg-lyceum-blue group-hover:text-white rounded-xl transition-all group-hover:scale-110 shadow-sm">
                                                    <ChevronRight size={18} />
                                                </div>
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
};

export default PerformanceDashboard;
