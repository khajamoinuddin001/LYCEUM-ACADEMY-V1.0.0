import React, { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    Globe,
    MousePointer2,
    ArrowUpRight,
    Search,
    Filter,
    Calendar,
    LayoutGrid as Layout,
    Monitor,
    Smartphone,
    Chrome,
    Compass,
    Navigation,
    Link as LinkIcon,
    History,
    Target,
    Download,
    ArrowDownRight,
    ChevronDown,
    Search as SearchIcon
} from '@/components/common/icons';
import * as api from '@/utils/api';

// Simple format helper
const format = (date: Date, formatStr: string) => {
    if (formatStr === 'MMM dd') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`;
    }
    if (formatStr === 'HH:mm:ss') {
        return date.toTimeString().split(' ')[0];
    }
    return date.toLocaleString();
};

interface MarketingStats {
    summary: {
        totalVisits: number;
        uniqueVisitors: number;
        newVisitors: number;
        returningVisitors: number;
        totalLeads: number;
        avgDepth: number;
        growth: {
            visits: number;
            unique: number;
            leads: number;
        };
    };
    referrerCategories: Record<string, number>;
    socialBreakdown: Record<string, number>;
    trends: Array<{
        date: string;
        visits: number;
        unique_visitors: number;
    }>;
    topPages: Array<{ path: string; count: number }>;
    topReferrers: Array<{ referrer: string; count: number }>;
    peakHours: Array<{ hour: number; count: number }>;
    browsers: Record<string, number>;
    platforms: Record<string, number>;
    recent: Array<{
        id: number;
        visitor_id: string;
        path: string;
        referrer: string;
        browser: string;
        platform: string;
        is_new_visitor: boolean;
        timestamp: string;
    }>;
}

const MarketingView: React.FC = () => {
    const [stats, setStats] = useState<MarketingStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'insights' | 'demographics' | 'pages' | 'activity'>('insights');
    const [selectedRange, setSelectedRange] = useState(7);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const data = await api.apiRequest<MarketingStats>(`/marketing/visitor-stats?range=${selectedRange}`);
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [selectedRange]);

    const downloadCSV = () => {
        if (!stats?.recent) return;

        const headers = ['Visitor ID', 'Path', 'Referrer', 'Browser', 'Platform', 'Type', 'Timestamp'];
        const rows = stats.recent.map(v => [
            v.visitor_id,
            v.path,
            v.referrer || 'Direct',
            v.browser,
            v.platform,
            v.is_new_visitor ? 'New' : 'Returning',
            new Date(v.timestamp).toLocaleString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `visitor_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const StatCard = ({ title, value, subValue, icon, color, growth }: any) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
                    {icon}
                </div>
                {growth !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full ${growth >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(growth)}%
                    </div>
                )}
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</h3>
            <div className="text-3xl font-black text-gray-900 dark:text-white mb-2">{value.toLocaleString()}</div>
            <p className="text-xs text-gray-400 font-medium">{subValue}</p>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lyceum-blue"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-lyceum-blue" size={32} />
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Deep dive into your visitor behavior and demographics.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <select
                            value={selectedRange}
                            onChange={(e) => setSelectedRange(parseInt(e.target.value))}
                            className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 pr-10 text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-lyceum-blue/20 transition-all cursor-pointer shadow-sm hover:border-gray-300 dark:hover:border-gray-600"
                        >
                            <option value={1}>Today</option>
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                            <option value={90}>Last 90 Days</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    <div className="flex overflow-x-auto gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 scrollbar-hide">
                        {[
                            { id: 'insights', label: 'Insights', icon: <TrendingUp size={16} /> },
                            { id: 'demographics', label: 'Demographics', icon: <Users size={16} /> },
                            { id: 'pages', label: 'Content', icon: <Layout size={16} /> },
                            { id: 'activity', label: 'Live', icon: <History size={16} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 shadow-md text-lyceum-blue' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    {activeTab === 'activity' && (
                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Conversion Rate"
                    value={stats ? Math.round((stats.summary.totalLeads / (stats.summary.uniqueVisitors || 1)) * 100) : 0}
                    subValue={`${stats?.summary.totalLeads || 0} form submissions`}
                    icon={<Target size={24} />}
                    color="bg-rose-500 text-rose-500"
                    growth={stats?.summary.growth.leads}
                />
                <StatCard
                    title="Unique Visitors"
                    value={stats?.summary.uniqueVisitors || 0}
                    subValue="Total distinct people"
                    icon={<Users size={24} />}
                    color="bg-purple-500 text-purple-500"
                    growth={stats?.summary.growth.unique}
                />
                <StatCard
                    title="Total Visits"
                    value={stats?.summary.totalVisits || 0}
                    subValue="Total page views"
                    icon={<MousePointer2 size={24} />}
                    color="bg-emerald-500 text-emerald-500"
                    growth={stats?.summary.growth.visits}
                />
                <StatCard
                    title="Session Depth"
                    value={stats?.summary.avgDepth || 0}
                    subValue="Avg. pages per visit"
                    icon={<Navigation size={24} />}
                    color="bg-orange-500 text-orange-500"
                />
            </div>

            {activeTab === 'insights' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-6">Traffic Trends (Last 7 Days)</h2>
                            <div className="h-[300px] flex items-end justify-between gap-4 px-4">
                                {stats?.trends.map((trend, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-lg relative group-hover:bg-blue-400 dark:group-hover:bg-blue-600 transition-all duration-300"
                                            style={{ height: `${stats.trends.length > 0 ? (trend.visits / Math.max(...stats.trends.map(t => t.visits), 1)) * 80 : 0}%` }}>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                {trend.visits} visits
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 transform -rotate-45 mt-4">{format(new Date(trend.date), 'MMM dd')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Globe size={20} className="text-gray-400" />
                                Traffic Sources
                            </h2>
                            <div className="space-y-4">
                                {Object.entries(stats?.referrerCategories || {}).map(([cat, count]) => (
                                    <div key={cat} className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-gray-600 dark:text-gray-300">{cat}</span>
                                            <span className="font-black text-lyceum-blue">
                                                {((Number(count) / (Number(stats?.summary?.totalVisits || 1))) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${cat === 'Direct' ? 'bg-blue-500' :
                                                    cat === 'Search' ? 'bg-emerald-500' :
                                                        cat === 'Social' ? 'bg-purple-500' : 'bg-gray-400'
                                                    }`}
                                                style={{ width: `${(Number(count) / (Number(stats?.summary?.totalVisits || 1))) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Monitor size={20} className="text-gray-400" />
                                Browser Distribution
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                {Object.entries(stats?.browsers || {}).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 5).map(([name, count]) => (
                                    <div key={name} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                            {name.includes('Chrome') ? <Chrome size={16} /> : <Globe size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-bold truncate">{name}</span>
                                                <span className="text-xs text-gray-400">{Math.round((Number(count) / (Number(stats?.summary?.totalVisits || 1))) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-lyceum-blue h-full" style={{ width: `${(Number(count) / (Number(stats?.summary?.totalVisits || 1))) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                {Object.entries(stats?.platforms || {}).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 5).map(([name, count]) => (
                                    <div key={name} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                            {name === 'Windows' || name === 'Mac' ? <Monitor size={16} /> : <Smartphone size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-bold truncate">{name}</span>
                                                <span className="text-xs text-gray-400">{Math.round((Number(count) / (Number(stats?.summary?.totalVisits || 1))) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full" style={{ width: `${(Number(count) / (Number(stats?.summary?.totalVisits || 1))) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Peak Hours Heatmap */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                        <h2 className="text-xl font-bold mb-6">Peak Activity Hours (Last 30 Days)</h2>
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 24 }).map((_, h) => {
                                const data = stats?.peakHours?.find(p => p.hour === h);
                                const count = data ? Number(data.count) : 0;
                                const max = stats?.peakHours?.length ? Math.max(...stats.peakHours.map(p => Number(p.count))) : 1;
                                const opacity = Number(count) / Number(max);

                                return (
                                    <div key={h} className="flex-1 min-w-[40px] h-20 rounded-lg flex flex-col items-center justify-center gap-1 group relative transition-all"
                                        style={{ backgroundColor: `rgba(0, 102, 255, ${0.05 + (Number(opacity) * 0.9)})` }}>
                                        <span className={`text-[10px] font-black ${opacity > 0.5 ? 'text-white' : 'text-gray-500'}`}>{h}h</span>
                                        {count > 0 && <span className={`text-[9px] font-bold ${opacity > 0.5 ? 'text-white/80' : 'text-gray-400'}`}>{count}</span>}

                                        <div className="absolute -top-10 bg-gray-900 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                            {count} visits at {h}:00
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span>00:00 (Midnight)</span>
                            <span>12:00 (Noon)</span>
                            <span>23:00 (Night)</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'demographics' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 transition-all hover:shadow-lg">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                                    <Chrome size={24} />
                                </div>
                                <h2 className="text-xl font-black tracking-tight">Browser Market Share</h2>
                            </div>
                            <div className="space-y-8">
                                {Object.entries(stats?.browsers || {}).sort((a, b) => Number(b[1]) - Number(a[1])).map(([name, count]) => (
                                    <div key={name} className="group cursor-default">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">{name}</span>
                                                <span className="text-[10px] font-bold text-gray-400">{count} TOTAL_VISITS</span>
                                            </div>
                                            <span className="text-lg font-black text-lyceum-blue">{((Number(count) / (Number(stats?.summary?.totalVisits || 1))) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-4 rounded-full overflow-hidden p-1 border border-gray-200 dark:border-gray-700 shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/20"
                                                style={{ width: `${(Number(count) / (Number(stats?.summary?.totalVisits || 1))) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 transition-all hover:shadow-lg">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                                    <Monitor size={24} />
                                </div>
                                <h2 className="text-xl font-black tracking-tight">Platform Distribution</h2>
                            </div>
                            <div className="space-y-8">
                                {Object.entries(stats?.platforms || {}).sort((a, b) => Number(b[1]) - Number(a[1])).map(([name, count]) => (
                                    <div key={name} className="group cursor-default">
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">{name}</span>
                                                <span className="text-[10px] font-bold text-gray-400">{count} TOTAL_USERS</span>
                                            </div>
                                            <span className="text-lg font-black text-emerald-600">{((Number(count) / (Number(stats?.summary?.totalVisits || 1))) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-4 rounded-full overflow-hidden p-1 border border-gray-200 dark:border-gray-700 shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-emerald-500/20"
                                                style={{ width: `${(Number(count) / (Number(stats?.summary?.totalVisits || 1))) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Social Breakdown Drill-down */}
                            {Number(stats?.referrerCategories?.Social) > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Social Source Breakdown</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(stats?.socialBreakdown || {}).filter(([_, count]) => Number(count) > 0).map(([platform, count]) => (
                                            <div key={platform} className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center text-[10px] font-bold">
                                                    <span>{platform}</span>
                                                    <span className="text-lyceum-blue">{count}</span>
                                                </div>
                                                <div className="w-full bg-gray-50 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                                                    <div className="bg-purple-500 h-full" style={{ width: `${(Number(count) / (Number(stats?.referrerCategories?.Social) || 1)) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'pages' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-6">Most Visited Content</h2>
                    <div className="space-y-4">
                        {stats?.topPages.map((page, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-lyceum-blue bg-opacity-10 text-lyceum-blue flex items-center justify-center font-bold text-xs">
                                        {i + 1}
                                    </div>
                                    <span className="font-mono text-sm">{page.path}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-gray-400">{Number(page.count)} unique views</span>
                                    <div className="w-32 bg-gray-200 dark:bg-gray-600 h-1.5 rounded-full">
                                        <div className="bg-lyceum-blue h-full" style={{ width: `${(Number(page.count) / (stats.summary.totalVisits || 1)) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.topPages || stats.topPages.length === 0) && (
                            <div className="text-center py-12 text-gray-400 font-medium">No page views recorded yet.</div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <h2 className="text-xl font-bold font-mono">VISITOR_FLOW_MONITOR</h2>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black animate-pulse">
                            ACTIVE_SESSIONS
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Visitor</th>
                                    <th className="px-6 py-4">Device/Browser</th>
                                    <th className="px-6 py-4">Destination</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {stats?.recent.map((visit) => (
                                    <tr key={visit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-[10px] text-gray-400">{visit.visitor_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold">{visit.platform}</span>
                                                <span className="text-[10px] text-gray-400">{visit.browser}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-sm text-lyceum-blue">{visit.path}</td>
                                        <td className="px-6 py-4">
                                            {visit.is_new_visitor ? (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[9px] font-black">NEW</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px] font-black">RETURN</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-gray-400">{format(new Date(visit.timestamp), 'HH:mm:ss')}</td>
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

export default MarketingView;
