

import React, { useState, useMemo } from 'react';
import { Plus, Search, Users, LogIn, CalendarClock, Edit } from './icons';
import type { Visitor, User } from '../types';

interface ReceptionViewProps {
    visitors: Visitor[];
    onNewVisitorClick: () => void;
    onScheduleVisitorClick: () => void;
    onCheckOut: (visitorId: number) => void;
    onCheckInScheduled: (visitorId: number) => void;
    onEditVisitor: (visitor: Visitor) => void;
    user: User;
}

const statusClasses: { [key in Visitor['status']]: string } = {
    'Scheduled': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'Checked-in': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Checked-out': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'short',
        timeStyle: 'short'
    });
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center">
        <div className="p-3 rounded-full bg-lyceum-blue/10 dark:bg-lyceum-blue/20 text-lyceum-blue mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const ReceptionView: React.FC<ReceptionViewProps> = ({ visitors, onNewVisitorClick, onScheduleVisitorClick, onCheckOut, onCheckInScheduled, onEditVisitor, user }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Checked-in' | 'Checked-out'>('All');
    const [activeTab, setActiveTab] = useState<'log' | 'appointments'>('log');

    const canCreate = user.role === 'Admin' || user.permissions?.['Reception']?.create;
    const canUpdate = user.role === 'Admin' || user.permissions?.['Reception']?.update;

    const { visitorsToday, currentlyCheckedIn, pendingAppointments, filteredVisitors, scheduledVisitors } = useMemo(() => {
        const todayStr = new Date().toDateString();

        const visitorsToday = visitors.filter(v => v.checkIn && new Date(v.checkIn).toDateString() === todayStr).length;
        const currentlyCheckedIn = visitors.filter(v => v.status === 'Checked-in').length;
        const pendingAppointments = visitors.filter(v => v.status === 'Scheduled' && new Date(v.scheduledCheckIn).toDateString() === todayStr).length;

        let logVisitors = visitors.filter(v => v.status === 'Checked-in' || v.status === 'Checked-out');
        if (statusFilter !== 'All') {
            logVisitors = logVisitors.filter(v => v.status === statusFilter);
        }

        let scheduled = visitors.filter(v => v.status === 'Scheduled');

        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            const filterFn = (v: Visitor) =>
                v.name.toLowerCase().includes(lowerQuery) ||
                v.company.toLowerCase().includes(lowerQuery) ||
                v.host.toLowerCase().includes(lowerQuery);

            logVisitors = logVisitors.filter(filterFn);
            scheduled = scheduled.filter(filterFn);
        }

        return {
            visitorsToday,
            currentlyCheckedIn,
            pendingAppointments,
            filteredVisitors: logVisitors.sort((a, b) => new Date(b.checkIn || b.scheduledCheckIn).getTime() - new Date(a.checkIn || a.scheduledCheckIn).getTime()),
            scheduledVisitors: scheduled.sort((a, b) => new Date(a.scheduledCheckIn).getTime() - new Date(b.scheduledCheckIn).getTime()),
        }
    }, [visitors, searchQuery, statusFilter]);

    const FilterButton: React.FC<{ label: 'All' | 'Checked-in' | 'Checked-out' }> = ({ label }) => (
        <button
            onClick={() => setStatusFilter(label)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${statusFilter === label
                ? 'bg-lyceum-blue text-white font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
        >
            {label}
        </button>
    );

    const TabButton: React.FC<{ label: string; value: 'log' | 'appointments'; count: number; }> = ({ label, value, count }) => (
        <button onClick={() => setActiveTab(value)} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 ${activeTab === value ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === value ? 'bg-lyceum-blue text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {count}
            </span>
        </button>
    );

    return (
        <div className="animate-fade-in space-y-4 md:space-y-6 p-4 md:p-0">
            {/* Header - Stack on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Reception Desk</h1>
                {canCreate && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                            onClick={onScheduleVisitorClick}
                            className="inline-flex items-center justify-center px-4 py-3 md:py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue transition-colors text-sm md:text-base"
                        >
                            <CalendarClock size={18} className="mr-2" />
                            <span className="whitespace-nowrap">Schedule Visitor</span>
                        </button>
                        <button
                            onClick={onNewVisitorClick}
                            className="inline-flex items-center justify-center px-4 py-3 md:py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue transition-colors text-sm md:text-base font-medium"
                        >
                            <Plus size={18} className="mr-2" />
                            <span className="whitespace-nowrap">Walk-in Check-in</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Cards - Stack on mobile */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <StatCard title="Visitors Today" value={visitorsToday} icon={<Users size={20} />} />
                <StatCard title="Currently Checked-in" value={currentlyCheckedIn} icon={<LogIn size={20} />} />
                <StatCard title="Pending Appointments" value={pendingAppointments} icon={<CalendarClock size={20} />} />
            </div>

            {/* Visitor Table - Responsive */}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Search and Filters - Stack on mobile */}
                <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col gap-3 md:gap-4">
                        <div className="relative w-full">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, company, or host..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-lyceum-blue focus:border-transparent dark:bg-gray-700 dark:text-white text-sm md:text-base"
                            />
                        </div>
                        {activeTab === 'log' && (
                            <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900/50 rounded-lg p-1 text-sm w-full sm:w-auto">
                                <FilterButton label="All" />
                                <FilterButton label="Checked-in" />
                                <FilterButton label="Checked-out" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs - Scrollable on mobile */}
                <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <nav className="-mb-px flex space-x-2 md:space-x-4 px-3 md:px-4 min-w-max">
                        <TabButton label="Visitor Log" value="log" count={filteredVisitors.length} />
                        <TabButton label="Appointments" value="appointments" count={scheduledVisitors.length} />
                    </nav>
                </div>

                {/* Table - Horizontal scroll on mobile */}
                <div className="overflow-x-auto -mx-4 md:mx-0">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Visitor</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{activeTab === 'log' ? 'Check-in' : 'Scheduled For'}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{activeTab === 'log' ? 'Check-out' : 'Host'}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{activeTab === 'log' ? 'Host' : 'Status'}</th>
                                    {activeTab === 'log' && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Card Number</th>}
                                    {activeTab === 'log' && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>}
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {activeTab === 'log' && filteredVisitors.length > 0 ? (
                                    filteredVisitors.map(visitor => (
                                        <tr key={visitor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{visitor.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{visitor.company}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDateTime(visitor.checkIn)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDateTime(visitor.checkOut)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{visitor.host}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{visitor.cardNumber || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[visitor.status]}`}>{visitor.status}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2 md:gap-4">
                                                    {canUpdate && <button onClick={() => onEditVisitor(visitor)} className="p-2 text-gray-400 hover:text-lyceum-blue touch-manipulation" title="Edit"><Edit size={18} /></button>}
                                                    {visitor.status === 'Checked-in' && canUpdate && (<button onClick={() => onCheckOut(visitor.id)} className="px-3 py-1.5 text-sm text-lyceum-blue hover:text-lyceum-blue-dark hover:bg-lyceum-blue/10 rounded touch-manipulation">Check-out</button>)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : activeTab === 'appointments' && scheduledVisitors.length > 0 ? (
                                    scheduledVisitors.map(visitor => (
                                        <tr key={visitor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{visitor.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{visitor.company}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDateTime(visitor.scheduledCheckIn)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{visitor.host}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[visitor.status]}`}>{visitor.status}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2 md:gap-4">
                                                    {canUpdate && <button onClick={() => onEditVisitor(visitor)} className="p-2 text-gray-400 hover:text-lyceum-blue touch-manipulation" title="Edit"><Edit size={18} /></button>}
                                                    {visitor.status === 'Scheduled' && canUpdate && (<button onClick={() => onCheckInScheduled(visitor.id)} className="px-3 py-1.5 text-sm text-lyceum-blue hover:text-lyceum-blue-dark hover:bg-lyceum-blue/10 rounded touch-manipulation">Check-in</button>)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                            {activeTab === 'log' ? 'No visitors match the current filters.' : 'There are no upcoming appointments.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
        </div >
    );
};

export default ReceptionView;
