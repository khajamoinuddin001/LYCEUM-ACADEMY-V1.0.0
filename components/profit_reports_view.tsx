import React, { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import type { AccountingTransaction } from '../types';

interface ProfitReportsViewProps {
    transactions: AccountingTransaction[];
    onBack: () => void;
}

const ProfitReportsView: React.FC<ProfitReportsViewProps> = ({ transactions, onBack }) => {
    const [reportView, setReportView] = useState<'weekly' | 'monthly'>('monthly');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Helper function to get Monday of a given date
    const getMonday = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    };

    // Helper function to get Sunday of a given date
    const getSunday = (d: Date) => {
        const monday = getMonday(d);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return sunday;
    };

    // Calculate Weekly Profits (Monday to Sunday)
    const weeklyProfits = useMemo(() => {
        const weeks = [];
        const today = new Date();

        for (let i = 0; i < 8; i++) {
            const referenceDate = new Date(today);
            referenceDate.setDate(today.getDate() - (i * 7));

            const weekStart = getMonday(referenceDate);
            const weekEnd = getSunday(referenceDate);

            weekStart.setHours(0, 0, 0, 0);
            weekEnd.setHours(23, 59, 59, 999);

            const weekTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= weekStart && tDate <= weekEnd && t.status === 'Paid';
            });

            const revenue = weekTransactions
                .filter(t => t.type === 'Income' || t.type === 'Invoice')
                .reduce((sum, t) => sum + t.amount, 0);

            const purchases = weekTransactions
                .filter(t => t.type === 'Purchase')
                .reduce((sum, t) => sum + t.amount, 0);

            const expenses = weekTransactions
                .filter(t => t.type === 'Expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const grossProfit = revenue - purchases;
            const netProfit = grossProfit - expenses;
            const totalExpenses = purchases + expenses;

            weeks.push({
                period: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
                revenue,
                expenses: totalExpenses,
                grossProfit,
                netProfit,
                profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0'
            });
        }

        return weeks.reverse();
    }, [transactions]);

    // Calculate Monthly Profits (Calendar Months)
    const monthlyProfits = useMemo(() => {
        const months = [];
        const today = new Date();

        for (let i = 0; i < 12; i++) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

            const monthTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= monthStart && tDate <= monthEnd && t.status === 'Paid';
            });

            const revenue = monthTransactions
                .filter(t => t.type === 'Income' || t.type === 'Invoice')
                .reduce((sum, t) => sum + t.amount, 0);

            const purchases = monthTransactions
                .filter(t => t.type === 'Purchase')
                .reduce((sum, t) => sum + t.amount, 0);

            const expenses = monthTransactions
                .filter(t => t.type === 'Expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const grossProfit = revenue - purchases;
            const netProfit = grossProfit - expenses;
            const totalExpenses = purchases + expenses;

            months.push({
                period: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                revenue,
                expenses: totalExpenses,
                grossProfit,
                netProfit,
                profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0'
            });
        }

        return months.reverse();
    }, [transactions]);

    const currentReports = reportView === 'weekly' ? weeklyProfits : monthlyProfits;

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Dashboard
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Profit Reports
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {reportView === 'weekly' ? 'Weekly' : 'Monthly'} profit analysis
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setReportView('weekly')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportView === 'weekly'
                                    ? 'bg-lyceum-blue text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Weekly
                        </button>
                        <button
                            onClick={() => setReportView('monthly')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportView === 'monthly'
                                    ? 'bg-lyceum-blue text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Monthly
                        </button>
                    </div>
                </div>

                {/* Reports Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Period
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Revenue
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Expenses
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Gross Profit
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Net Profit
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Margin %
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {currentReports.map((report, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {report.period}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600 dark:text-green-400">
                                            {formatCurrency(report.revenue)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600 dark:text-red-400">
                                            {formatCurrency(report.expenses)}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${report.grossProfit >= 0
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {formatCurrency(report.grossProfit)}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${report.netProfit >= 0
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {formatCurrency(report.netProfit)}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${parseFloat(report.profitMargin) >= 0
                                                ? 'text-purple-600 dark:text-purple-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {report.profitMargin}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitReportsView;
