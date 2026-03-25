import React, { useState, useEffect, useCallback } from 'react';
import { getToken, getApiKeys, toggleApiKey, deleteApiKey, setRateLimit, toggleGlobalPanic, getApiKeyLogs } from '@/utils/api';
import type { ApiKey } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

interface ActiveSession {
    id: number;
    user_id: number;
    username: string;
    role: string;
    ip_address: string;
    device_info: string;
    last_page: string;
    login_time: string;
    last_activity: string;
}

interface SessionHistory extends ActiveSession {
    end_time: string;
    reason: string;
}

function getDeviceIcon(ua: string) {
    const info = ua.toLowerCase();
    if (info.includes('iphone') || info.includes('android')) {
        return <span className="text-gray-400" title={ua}>📱</span>;
    }
    if (info.includes('ipad') || info.includes('tablet')) {
        return <span className="text-gray-400" title={ua}> tablet</span>;
    }
    return <span className="text-gray-400" title={ua}>💻</span>;
}

function getBrowserName(ua: string) {
    const info = ua.toLowerCase();
    if (info.includes('chrome')) return 'Chrome';
    if (info.includes('safari') && !info.includes('chrome')) return 'Safari';
    if (info.includes('firefox')) return 'Firefox';
    if (info.includes('edg')) return 'Edge';
    return 'Browser';
}

function getUAInfo(ua: string) {
    const info = ua.toLowerCase();
    if (info.includes('postman')) return { icon: '🚀', label: 'Postman' };
    if (info.includes('insomnia')) return { icon: '🏮', label: 'Insomnia' };
    if (info.includes('python')) return { icon: '🐍', label: 'Python' };
    if (info.includes('curl')) return { icon: '💻', label: 'cURL' };
    if (info.includes('axios') || info.includes('node')) return { icon: '📦', label: 'Node.js' };
    if (info.includes('mozilla') || info.includes('chrome') || info.includes('safari')) return { icon: '🌐', label: 'Browser' };
    return { icon: '🔌', label: 'Other/Tool' };
}

function getRoleBadge(role: string) {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold';
    switch (role) {
        case 'Admin':
            return `${base} bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300`;
        case 'Staff':
            return `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300`;
        case 'Student':
            return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300`;
        default:
            return `${base} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`;
    }
}

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

function calculateDuration(loginTime: string): string {
    const diff = Math.floor((Date.now() - new Date(loginTime).getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

interface Props {
    currentUser: { id: number; role: string };
}

const ActiveSessionsView: React.FC<Props> = ({ currentUser }) => {
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [history, setHistory] = useState<SessionHistory[]>([]);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [view, setView] = useState<'active' | 'history' | 'api-keys'>('active');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [terminating, setTerminating] = useState<number | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('All');
    const [panicking, setPanicking] = useState(false);
    const [editingLimitId, setEditingLimitId] = useState<number | null>(null);
    const [newLimitValue, setNewLimitValue] = useState<number>(60);
    const [globalPanic, setGlobalPanic] = useState(false);
    const [selectedKeyForLogs, setSelectedKeyForLogs] = useState<number | null>(null);
    const [keyLogs, setKeyLogs] = useState<any[]>([]);
    const [isLogsLoading, setIsLogsLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/admin/session-history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setHistory(await res.json());
        } catch (e) {
            console.error('Failed to fetch history:', e);
        }
    }, []);

    const fetchSessions = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                setError('No authentication token found. Please login again.');
                setLoading(false);
                return;
            }

            const res = await fetch(`${API_BASE}/admin/active-sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setSessions(data);
            setLastRefresh(new Date());
            setError(null);
        } catch (e: any) {
            setError('Failed to load sessions. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchApiKeys = useCallback(async () => {
        try {
            const data = await getApiKeys();
            setApiKeys(data.keys);
            setGlobalPanic(data.globalPanic);
        } catch (e) {
            console.error('Failed to fetch API keys:', e);
        }
    }, []);

    const handleUpdateLimit = async (id: number) => {
        try {
            await setRateLimit(id, newLimitValue);
            setApiKeys(apiKeys.map(k => k.id === id ? { 
                ...k, 
                rateLimit: newLimitValue, 
                usage: k.usage ? { ...k.usage, limit: newLimitValue, remaining: Math.max(0, newLimitValue - k.usage.count) } : undefined 
            } : k));
            setEditingLimitId(null);
        } catch (e) {
            console.error('Failed to update rate limit:', e);
        }
    };

    useEffect(() => {
        if (view === 'active') {
            fetchSessions();
            const interval = setInterval(fetchSessions, 30000);
            return () => clearInterval(interval);
        } else if (view === 'history') {
            fetchHistory();
        } else {
            fetchApiKeys();
        }
    }, [fetchSessions, fetchHistory, fetchApiKeys, view]);

    const handleToggleKey = async (id: number) => {
        try {
            const { status } = await toggleApiKey(id);
            setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status } : k));
        } catch (e) {
            alert('Failed to toggle API key');
        }
    };

    const handleTogglePanic = async () => {
        const msg = globalPanic 
            ? "This will enable the API system again. Are you sure?" 
            : "🚨 GLOBAL PANIC SWITCH\n\nThis will instantly disable ALL API keys system-wide. No external application will be able to fetch data. ARE YOU SURE?";
        if (!confirm(msg)) return;
        
        try {
            const newState = await toggleGlobalPanic(!globalPanic);
            setGlobalPanic(newState);
            fetchApiKeys(); // Refresh to ensure UI is in sync
        } catch (e) {
            alert('Failed to toggle global panic');
        }
    };

    const handleViewLogs = async (id: number) => {
        setSelectedKeyForLogs(id);
        setIsLogsLoading(true);
        try {
            const logs = await getApiKeyLogs(id);
            setKeyLogs(logs);
        } catch (e) {
            console.error('Failed to fetch logs:', e);
        } finally {
            setIsLogsLoading(false);
        }
    };

    const handleDeleteKey = async (id: number) => {
        if (!confirm('Permanently revoke this API key?')) return;
        try {
            await deleteApiKey(id);
            setApiKeys(prev => prev.filter(k => k.id !== id));
        } catch (e) {
            alert('Failed to delete API key');
        }
    };

    const handleTerminate = async (userId: number, username: string) => {
        if (!confirm(`Terminate session for ${username}?`)) return;
        setTerminating(userId);
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/admin/sessions/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to terminate session');
                return;
            }
            setSessions(prev => prev.filter(s => s.user_id !== userId));
        } catch {
            alert('Network error. Please try again.');
        } finally {
            setTerminating(null);
        }
    };

    const handleForceLogoutAll = async () => {
        const othersCount = sessions.length - 1;
        if (othersCount <= 0) {
            alert("No other active sessions to terminate.");
            return;
        }

        const msg = `🚨 PANIC BUTTON\n\nThis will instantly terminate ALL ${othersCount} other active sessions.\n\nEveryone except you will be kicked out. ARE YOU SURE?`;
        if (!confirm(msg)) return;

        setPanicking(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/admin/sessions`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            alert(`Successfully terminated ${data.count || othersCount} sessions.`);
            setSessions(prev => prev.filter(s => s.user_id === currentUser.id));
        } catch (e: any) {
            alert('Failed to execute panic logout: ' + e.message);
        } finally {
            setPanicking(false);
        }
    };

    const filtered = sessions.filter(s => {
        const matchSearch = s.username.toLowerCase().includes(search.toLowerCase()) ||
            s.role.toLowerCase().includes(search.toLowerCase()) ||
            (s.ip_address || '').includes(search);
        const matchRole = roleFilter === 'All' || s.role === roleFilter;
        return matchSearch && matchRole;
    });

    const counts = {
        total: sessions.length,
        Admin: sessions.filter(s => s.role === 'Admin').length,
        Staff: sessions.filter(s => s.role === 'Staff').length,
        Student: sessions.filter(s => s.role === 'Student').length,
    };

    if (currentUser.role !== 'Admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center px-8 py-16">
                    <div className="text-5xl mb-4">🔒</div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Access Restricted</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Only Admins can view live sessions.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 p-6 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Live Session Monitor
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Auto-refreshes every 30s · Last updated: {lastRefresh.toLocaleTimeString()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchSessions}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    {view === 'api-keys' && (
                        <button
                            onClick={handleTogglePanic}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 ${globalPanic
                                ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            {globalPanic ? 'Disable Panic (Allow APIs)' : '🚨 Global API Panic Switch'}
                        </button>
                    )}
                    {view === 'active' && (
                        <button
                            onClick={handleForceLogoutAll}
                            disabled={panicking}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 ${panicking
                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white animate-pulse-subtle'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {panicking ? 'Terminating All...' : 'Force Logout All (Panic)'}
                        </button>
                    )}
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Online', value: counts.total, color: 'from-blue-500 to-indigo-600', icon: '👥' },
                    { label: 'Admins', value: counts.Admin, color: 'from-purple-500 to-purple-700', icon: '🛡️' },
                    { label: 'Staff', value: counts.Staff, color: 'from-blue-400 to-cyan-600', icon: '💼' },
                    { label: 'Students', value: counts.Student, color: 'from-emerald-400 to-teal-600', icon: '🎓' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl shadow-md`}>
                            {stat.icon}
                        </div>
                        <div>
                            <div className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name, role, or IP..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                </div>
                <div className="flex gap-2">
                    {[
                        { id: 'active', label: '🟢 Live Sessions' },
                        { id: 'history', label: '📋 Audit Log' },
                        { id: 'api-keys', label: '🔑 API Keys' }
                    ].map(v => (
                        <button
                            key={v.id}
                            onClick={() => setView(v.id as any)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${view === v.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                }`}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block self-center" />
                <div className="flex gap-2">
                    {['All', 'Admin', 'Staff', 'Student'].map(role => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${roleFilter === role
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Loading sessions...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <div className="text-4xl mb-3">⚠️</div>
                            <p className="text-gray-600 dark:text-gray-400">{error}</p>
                            <button onClick={fetchSessions} className="mt-4 text-blue-500 text-sm underline">Try again</button>
                        </div>
                    </div>
                ) : view === 'api-keys' ? (
                    <div className="flex-1 overflow-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 shadow-sm">
                                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50">
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Key Name / IP</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Access</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Status</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Limit & Usage</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Last Activity</th>
                                    <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {apiKeys.map(key => (
                                    <tr key={key.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                                    {key.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{key.name}</span>
                                                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">IP: {key.lastIp || 'None'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                                key.accessLevel === 'read-write' 
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' 
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                            }`}>
                                                {key.accessLevel === 'read-write' ? 'R/W' : 'RO'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`relative flex h-2 w-2`}>
                                                    {key.status === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${(key.status || 'active') === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                </span>
                                                <span className={`text-xs font-bold uppercase ${(key.status || 'active') === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {key.status || 'active'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingLimitId === key.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                                                        value={newLimitValue}
                                                        onChange={e => setNewLimitValue(parseInt(e.target.value) || 0)}
                                                        autoFocus
                                                    />
                                                    <button 
                                                        onClick={() => handleUpdateLimit(key.id)}
                                                        className="text-blue-500 hover:text-blue-600 font-bold text-xs"
                                                    >
                                                        Save
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingLimitId(null)}
                                                        className="text-gray-400 hover:text-gray-500 text-xs"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                            {key.usage?.remaining ?? key.rateLimit ?? 60} / {key.rateLimit ?? 60} 
                                                            <span className="ml-1 font-normal text-gray-400 uppercase text-[10px]">Rem</span>
                                                        </span>
                                                        <button 
                                                            onClick={() => {
                                                                setEditingLimitId(key.id);
                                                                setNewLimitValue(key.rateLimit ?? 100);
                                                            }}
                                                            className="text-[10px] text-blue-500 hover:underline"
                                                        >
                                                            Edit Limit
                                                        </button>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-500 ${
                                                                (key.usage?.remaining ?? 1) / (key.rateLimit ?? 1) < 0.2 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                                                            }`}
                                                            style={{ width: `${Math.min(100, ((key.usage?.remaining ?? 60) / (key.rateLimit ?? 60)) * 100)}%` }}
                                                        />
                                                    </div>
                                                    {(key.usage?.remaining ?? 60) / (key.rateLimit ?? 60) < 0.2 && (
                                                        <span className="text-[10px] text-red-500 font-bold animate-pulse">⚠️ HIGH USAGE</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-500">
                                                {key.lastUsedAt ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-900 dark:text-white font-medium">{timeAgo(key.lastUsedAt)}</span>
                                                        <span>{formatDateTime(key.lastUsedAt)}</span>
                                                    </div>
                                                ) : 'Never used'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleViewLogs(key.id)}
                                                    className="p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500"
                                                    title="View Activity Logs"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleToggleKey(key.id)}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                                        (key.status || 'active') === 'active'
                                                            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                                            : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                    }`}
                                                >
                                                    {(key.status || 'active') === 'active' ? 'Choke' : 'Live'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteKey(key.id)}
                                                    className="p-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (view === 'active' ? filtered : history).length === 0 ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <div className="text-5xl mb-3">💤</div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">
                                {view === 'active' ? 'No active sessions match your filter.' : 'No session history found.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto">
                        <table className="w-full border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 shadow-sm">
                                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50">
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">User</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Current Page</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Device / IP</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">{view === 'active' ? 'Online For' : 'Session Span'}</th>
                                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4 text-center">{view === 'active' ? 'Status / Last Seen' : 'End Reason'}</th>
                                    <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {(view === 'active' ? filtered : history).map(session => {
                                    const isMe = session.user_id === currentUser.id;
                                    const h = session as SessionHistory;
                                    return (
                                        <tr
                                            key={session.id}
                                            className={`transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/40 ${isMe && view === 'active' ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                                        {session.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                                            {session.username}
                                                            {isMe && view === 'active' && <span className="ml-2 text-xs text-blue-500 font-normal">(you)</span>}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className={getRoleBadge(session.role)}>{session.role}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                    {session.last_page || (view === 'active' ? 'Apps' : 'Ended')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        {getDeviceIcon(session.device_info || '')}
                                                        <span>{getBrowserName(session.device_info || '')}</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-gray-400 uppercase">
                                                        {session.ip_address || '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {view === 'active' ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {calculateDuration(session.login_time)}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400">Since {new Date(session.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div>{formatDateTime(session.login_time)}</div>
                                                            {h.end_time && (
                                                                <div className="text-gray-400 mt-1">
                                                                    to {formatDateTime(h.end_time)}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {view === 'active' ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                        </span>
                                                        <span className="text-xs text-gray-500">{timeAgo(session.last_activity)}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${h.reason === 'Logout' ? 'bg-gray-100 text-gray-600' :
                                                            h.reason === 'Terminated by Admin' ? 'bg-red-100 text-red-600' :
                                                                'bg-amber-100 text-amber-600'
                                                            }`}>
                                                            {h.reason || 'Closed'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {view === 'active' ? (
                                                    isMe ? (
                                                        <span className="text-xs text-gray-400 italic">Your session</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleTerminate(session.user_id, session.username)}
                                                            disabled={terminating === session.user_id}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                                        >
                                                            {terminating === session.user_id ? (
                                                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                </svg>
                                                            ) : 'Exit Session'}
                                                        </button>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
                Sessions inactive for more than 2 hours are automatically removed · {filtered.length} of {sessions.length} sessions shown
            </p>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(1.02); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}} />
            {/* Activity Logs Modal */}
            {selectedKeyForLogs && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </span>
                                    Activity Logs
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Showing last 1000 requests for key ID: {selectedKeyForLogs}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedKeyForLogs(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-auto p-6">
                            {isLogsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-gray-500 font-medium">Fetching secure logs...</p>
                                </div>
                            ) : keyLogs.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="text-5xl mb-4 opacity-50">📑</div>
                                    <p className="text-gray-500 font-bold text-lg">No activity recorded yet.</p>
                                    <p className="text-gray-400 text-sm mt-1">Logs will appear here once the key is used.</p>
                                </div>
                            ) : (() => {
                                // Calculate Stats
                                const total = keyLogs.length;
                                const success = keyLogs.filter(l => l.status_code < 400).length;
                                const successRate = Math.round((success / total) * 100);
                                
                                const endpoints = keyLogs.reduce((acc: any, curr) => {
                                    acc[curr.endpoint] = (acc[curr.endpoint] || 0) + 1;
                                    return acc;
                                }, {});
                                const topEndpoint = Object.entries(endpoints).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '—';

                                const tools = keyLogs.reduce((acc: any, curr) => {
                                    const tool = getUAInfo(curr.user_agent || '').label;
                                    acc[tool] = (acc[tool] || 0) + 1;
                                    return acc;
                                }, {});
                                const topTool = Object.entries(tools).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '—';

                                return (
                                    <>
                                        {/* Stats Summary */}
                                        <div className="grid grid-cols-4 gap-4 mb-8">
                                            {[
                                                { label: 'Total Volume', value: total, icon: '📊', sub: 'Last 1000 requests' },
                                                { label: 'Success Rate', value: `${successRate}%`, icon: '✅', sub: `${success} successful`, color: successRate > 90 ? 'text-green-500' : 'text-amber-500' },
                                                { label: 'Top Endpoint', value: topEndpoint.split('/').pop() || '/', icon: '📍', sub: topEndpoint, truncate: true },
                                                { label: 'Primary Tool', value: topTool, icon: '🛠️', sub: 'Most active client' },
                                            ].map((stat, i) => (
                                                <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50">
                                                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">
                                                        <span>{stat.icon}</span> {stat.label}
                                                    </div>
                                                    <div className={`text-xl font-black truncate ${stat.color || 'text-gray-900 dark:text-white'}`}>
                                                        {stat.value}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-1 truncate" title={stat.sub as string}>
                                                        {stat.sub}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Activity Stream</h4>
                                            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800 mx-4" />
                                        </div>

                                        <div className="grid gap-3">
                                            {keyLogs.map((log) => {
                                                const uaInfo = getUAInfo(log.user_agent || '');
                                                return (
                                                    <div key={log.id} className="group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-4 flex items-center justify-between hover:border-blue-200 dark:hover:border-blue-900/30 transition-all hover:shadow-md">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                                                                log.method === 'GET' ? 'bg-blue-100 text-blue-600' :
                                                                log.method === 'POST' ? 'bg-green-100 text-green-600' :
                                                                log.method === 'DELETE' ? 'bg-red-100 text-red-600' :
                                                                'bg-amber-100 text-amber-600'
                                                            }`}>
                                                                {log.method}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900 dark:text-white font-mono">{log.endpoint}</div>
                                                                <div className="flex items-center gap-3 mt-1 underline-offset-4">
                                                                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        </svg>
                                                                        {log.ip_address}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded" title={log.user_agent}>
                                                                        {uaInfo.icon} {uaInfo.label}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        {formatDateTime(log.created_at)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                                                                log.status_code >= 400 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                                                            }`}>
                                                                {log.status_code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActiveSessionsView;
