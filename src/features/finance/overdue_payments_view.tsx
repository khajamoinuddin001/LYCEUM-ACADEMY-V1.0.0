import React, { useState, useMemo } from 'react';
import { Search, X, AlertCircle, Calendar, User, FileText } from 'lucide-react';
import { AccountingTransaction } from '../../types';

interface OverduePaymentsViewProps {
    transactions: AccountingTransaction[];
    onBack?: () => void;
}

const OverduePaymentsView: React.FC<OverduePaymentsViewProps> = ({ transactions, onBack }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter transactions to get overdue ones
    const overdueTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (t.dueDate) {
                const dueDate = new Date(t.dueDate);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate < today && (t.status === 'Pending' || t.status === 'Overdue');
            }
            return t.status === 'Overdue';
        });
    }, [transactions]);

    // Apply search filter
    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return overdueTransactions;

        const query = searchQuery.toLowerCase();
        return overdueTransactions.filter(t =>
            t.customerName?.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query) ||
            t.id.toLowerCase().includes(query)
        );
    }, [overdueTransactions, searchQuery]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <AlertCircle className="text-red-500" size={32} />
                            Overdue Payments
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            View and manage transactions that have passed their due date
                        </p>
                    </div>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    )}
                </div>

                {/* Summary Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Overdue Amount</p>
                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(overdueTransactions.reduce((sum, t) => sum + t.amount, 0))}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Overdue Items</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {overdueTransactions.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by customer name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lyceum-blue text-gray-900 dark:text-gray-100"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Overdue Table */}
                {filteredTransactions.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                        <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No overdue payments found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {searchQuery ? 'Try adjusting your search query' : 'Great news! You have no overdue payments.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredTransactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                        <User size={16} className="text-gray-600 dark:text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{t.customerName || 'N/A'}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{t.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={14} className="text-gray-400" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">{t.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(t.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                                                    <Calendar size={14} />
                                                    <span className="text-sm">{t.dueDate ? formatDate(t.dueDate) : 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OverduePaymentsView;
