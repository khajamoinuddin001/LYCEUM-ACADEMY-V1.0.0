
import React, { useState, useMemo, useEffect } from 'react';
import KpiCard from './kpi_card';
import WelcomeHeader from './welcome_header';
import { ArrowLeft, Circle, Clock, CheckCircle2, FileText, IndianRupee, Users, TrendingUp, ClipboardList, UserCheck } from './icons';
import type { AccountingTransaction, User, TodoTask, TodoStatus, PaymentActivityLog, Contact, CrmLead, Visitor } from '../types';
import * as api from '../utils/api';

interface DashboardProps {
    onNavigateBack: () => void;
    transactions: AccountingTransaction[];
    user: User;
    tasks: TodoTask[];
    onAppSelect: (appName: string) => void;
    paymentActivityLog: PaymentActivityLog[];
    contacts: Contact[];
    leads: CrmLead[];
}

const statusConfig: { [key in TodoStatus]: { icon: React.ReactNode } } = {
    todo: {
        icon: <Circle size={16} className="text-gray-500" />,
    },
    inProgress: {
        icon: <Clock size={16} className="text-blue-600" />,
    },
    done: {
        icon: <CheckCircle2 size={16} className="text-green-600" />,
    },
};

const activityIconConfig: { [key in PaymentActivityLog['type']]: { icon: React.ReactNode; color: string } } = {
    invoice_created: {
        icon: <FileText size={16} />,
        color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
    },
    payment_received: {
        icon: <IndianRupee size={16} />,
        color: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300',
    },
};

const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
}


const Dashboard: React.FC<DashboardProps> = ({ onNavigateBack, transactions, user, tasks, onAppSelect, paymentActivityLog, contacts, leads }) => {
    const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');
    const [myVisitors, setMyVisitors] = useState<Visitor[]>([]);
    const [loadingVisitors, setLoadingVisitors] = useState(false);

    // Fetch visitors for staff members
    useEffect(() => {
        if (user.role === 'Staff') {
            setLoadingVisitors(true);
            api.getMyVisitors('Checked-in')
                .then(setMyVisitors)
                .catch(err => console.error('Failed to load my visitors:', err))
                .finally(() => setLoadingVisitors(false));
        }
    }, [user]);

    const dynamicKpis = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const newStudents = contacts.filter(c => c.createdAt && new Date(c.createdAt) > sevenDaysAgo).length;
        const leadsGenerated = leads.filter(l => l.createdAt && new Date(l.createdAt) > sevenDaysAgo).length;
        const tasksCompleted = tasks.filter(t => t.status === 'done').length;
        const newInvoices = transactions.filter(t => t.type === 'Invoice' && new Date(t.date) > sevenDaysAgo).length;

        const totalIncomeValue = transactions
            .filter(t => t.type === 'Invoice' && t.status === 'Paid')
            .reduce((sum, t) => sum + t.amount, 0);

        return [
            {
                title: 'New Students (Last 7d)',
                value: String(newStudents),
                icon: <Users size={24} />,
                iconBgColor: 'bg-blue-100 dark:bg-blue-900/50',
                iconColor: 'text-blue-600 dark:text-blue-300',
            },
            {
                title: 'Total Income Received',
                value: `₹${totalIncomeValue.toLocaleString('en-IN')}`,
                icon: <IndianRupee size={24} />,
                iconBgColor: 'bg-purple-100 dark:bg-purple-900/50',
                iconColor: 'text-purple-600 dark:text-purple-300',
            },
            {
                title: 'Leads Generated (Last 7d)',
                value: String(leadsGenerated),
                icon: <TrendingUp size={24} />,
                iconBgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
                iconColor: 'text-yellow-600 dark:text-yellow-300',
            },
            {
                title: 'Tasks Completed',
                value: String(tasksCompleted),
                icon: <ClipboardList size={24} />,
                iconBgColor: 'bg-green-100 dark:bg-green-900/50',
                iconColor: 'text-green-600 dark:text-green-300',
            },
            {
                title: 'New Invoices (Last 7d)',
                value: String(newInvoices),
                icon: <FileText size={24} />,
                iconBgColor: 'bg-teal-100 dark:bg-teal-900/50',
                iconColor: 'text-teal-600 dark:text-teal-300',
            },
        ];
    }, [contacts, leads, tasks, transactions]);

    const chartData = useMemo(() => {
        const paidInvoices = transactions.filter(
            t => t.type === 'Invoice' && t.status === 'Paid'
        );

        if (chartView === 'weekly') {
            const today = new Date();
            const labels: string[] = [];
            const data: number[] = Array(7).fill(0);

            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));

                paidInvoices.forEach(invoice => {
                    if (new Date(invoice.date).toDateString() === d.toDateString()) {
                        data[6 - i] += invoice.amount;
                    }
                });
            }
            return { labels, data };
        } else { // monthly
            const today = new Date();
            const labels: string[] = ['3 weeks ago', '2 weeks ago', 'Last week', 'This week'];
            const data: number[] = Array(4).fill(0);
            const weekInMs = 7 * 24 * 60 * 60 * 1000;

            paidInvoices.forEach(invoice => {
                const invoiceDate = new Date(invoice.date);
                const diffMs = today.getTime() - invoiceDate.getTime();

                if (diffMs >= 0) {
                    const diffWeeks = Math.floor(diffMs / weekInMs);
                    if (diffWeeks < 4) {
                        data[3 - diffWeeks] += invoice.amount;
                    }
                }
            });

            return { labels, data };
        }
    }, [transactions, chartView]);

    const maxChartValue = useMemo(() => {
        const max = Math.max(...chartData.data);
        return max > 0 ? max : 1;
    }, [chartData.data]);

    const pendingTasks = useMemo(() => {
        return tasks
            .filter(task => task.status !== 'done')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);
    }, [tasks]);

    const recentActivities = useMemo(() => {
        return paymentActivityLog.slice(0, 5);
    }, [paymentActivityLog]);

    return (
        <div className="animate-fade-in space-y-6">
            <button
                onClick={onNavigateBack}
                className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue dark:hover:text-lyceum-blue/80 mb-2 transition-colors"
                aria-label="Back to apps"
            >
                <ArrowLeft size={16} className="mr-2" />
                Back to Apps
            </button>

            <WelcomeHeader user={user} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                {dynamicKpis.map((kpi, index) => {
                    const spanClass = index < 2 ? 'lg:col-span-3' : 'lg:col-span-2';
                    return (
                        <div key={kpi.title} className={spanClass}>
                            <KpiCard {...kpi} />
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 sm:mb-0">
                        Income Overview
                    </h2>
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 text-sm">
                        <button
                            onClick={() => setChartView('weekly')}
                            className={`px-3 py-1 rounded-md transition-colors ${chartView === 'weekly' ? 'bg-white dark:bg-gray-800 shadow-sm text-lyceum-blue font-semibold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                            Weekly
                        </button>
                        <button
                            onClick={() => setChartView('monthly')}
                            className={`px-3 py-1 rounded-md transition-colors ${chartView === 'monthly' ? 'bg-white dark:bg-gray-800 shadow-sm text-lyceum-blue font-semibold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                            Monthly
                        </button>
                    </div>
                </div>
                <div className="flex justify-around items-end h-64 border-l border-b border-gray-200 dark:border-gray-700 pl-4 pb-4">
                    {chartData.data.map((value, index) => (
                        <div key={index} className="flex flex-col items-center w-full group px-1">
                            <div className="relative flex items-end h-full w-full">
                                <div
                                    className="bg-lyceum-blue/60 w-1/2 mx-auto rounded-t-md hover:bg-lyceum-blue transition-colors min-h-[2px]"
                                    style={{ height: `${(value / maxChartValue) * 100}%` }}
                                >
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-800 dark:bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-md pointer-events-none whitespace-nowrap">
                                        ₹{value.toLocaleString('en-IN')}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800 dark:border-t-gray-900"></div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">{chartData.labels[index]}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`grid grid-cols-1 ${user.role === 'Staff' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Your Tasks
                        </h2>
                        <button
                            onClick={() => onAppSelect('Tasks')}
                            className="text-sm font-medium text-lyceum-blue hover:underline"
                        >
                            View All
                        </button>
                    </div>
                    <div>
                        {pendingTasks.length > 0 ? (
                            <ul className="space-y-3">
                                {pendingTasks.map(task => (
                                    <li key={task.id} className="flex items-center p-3 -mx-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="mr-3 flex-shrink-0">
                                            {statusConfig[task.status].icon}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{task.title}</p>
                                            <p className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                                                Due: {new Date(task.dueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">You have no pending tasks. Great job!</p>
                            </div>
                        )}
                    </div>
                </div>

                {user.role === 'Staff' && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                My Waiting Visitors
                            </h2>
                            <button
                                onClick={() => onAppSelect('Reception')}
                                className="text-sm font-medium text-lyceum-blue hover:underline"
                            >
                                View All
                            </button>
                        </div>
                        <div>
                            {loadingVisitors ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">Loading visitors...</p>
                                </div>
                            ) : myVisitors.length > 0 ? (
                                <ul className="space-y-3">
                                    {myVisitors.slice(0, 5).map(visitor => (
                                        <li key={visitor.id} className="flex items-center p-3 -mx-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => onAppSelect('Reception')}>
                                            <div className="mr-3 flex-shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-lyceum-blue/10 dark:bg-lyceum-blue/20 flex items-center justify-center">
                                                    <UserCheck size={16} className="text-lyceum-blue" />
                                                </div>
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{visitor.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {visitor.company} • Checked in {new Date(visitor.checkIn || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300">
                                                Waiting
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">No visitors waiting for you.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Recent Payment Activity
                        </h2>
                        <button
                            onClick={() => onAppSelect('Accounting')}
                            className="text-sm font-medium text-lyceum-blue hover:underline"
                        >
                            View All
                        </button>
                    </div>
                    <div>
                        {recentActivities.length > 0 ? (
                            <ul className="space-y-4">
                                {recentActivities.map(activity => {
                                    const config = activityIconConfig[activity.type];
                                    return (
                                        <li key={activity.id} className="flex items-start">
                                            <div className={`mr-3 mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.color}`}>
                                                {config.icon}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{activity.text}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatTimeAgo(activity.timestamp)}
                                                </p>
                                            </div>
                                            <p className={`text-sm font-semibold whitespace-nowrap ml-2 ${activity.type === 'payment_received' ? 'text-green-600' : 'text-gray-700 dark:text-gray-200'}`}>
                                                ₹{activity.amount.toLocaleString('en-IN')}
                                            </p>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">No recent payment activity.</p>
                            </div>
                        )}
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
        </div>
    );
};

export default Dashboard;
