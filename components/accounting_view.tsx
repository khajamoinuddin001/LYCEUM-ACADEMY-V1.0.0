

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { AccountingTransaction, TransactionStatus, TransactionType, User } from '../types';
import { IndianRupee, Filter, ArrowUp, ArrowDown, MoreHorizontal } from './icons';

interface AccountingViewProps {
    transactions: AccountingTransaction[];
    onNewInvoiceClick: () => void;
    user: User;
    onRecordPayment: (transactionId: string) => void;
}

const KpiCard: React.FC<{ title: string; value: string; colorClass?: string; }> = ({ title, value, colorClass = 'text-gray-800 dark:text-gray-100' }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${colorClass}`}>{value}</p>
    </div>
);


const statusClasses: { [key in TransactionStatus]: string } = {
  Paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  Overdue: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const TransactionRow: React.FC<{ transaction: AccountingTransaction; onRecordPayment: (id: string) => void; canUpdate: boolean; }> = ({ transaction, onRecordPayment, canUpdate }) => {
    const [actionsOpen, setActionsOpen] = useState(false);
    const actionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
                setActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{transaction.id}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{transaction.date}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{transaction.customerName}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{transaction.description}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{transaction.type}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[transaction.status]}`}>
                    {transaction.status}
                </span>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {transaction.amount > 0 ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {(transaction.status === 'Pending' || transaction.status === 'Overdue') && transaction.type === 'Invoice' && canUpdate && (
                     <div className="relative inline-block text-left" ref={actionsRef}>
                        <button onClick={() => setActionsOpen(!actionsOpen)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600">
                            <MoreHorizontal size={18} />
                        </button>
                        {actionsOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    <button
                                        onClick={() => {
                                            onRecordPayment(transaction.id);
                                            setActionsOpen(false);
                                        }}
                                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        role="menuitem"
                                    >
                                        Record Payment
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </td>
        </tr>
    );
}

const AccountingView: React.FC<AccountingViewProps> = ({ transactions, onNewInvoiceClick, user, onRecordPayment }) => {
    
    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | TransactionType>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | TransactionStatus>('All');
    
    // Sorting
    type SortKey = 'id' | 'date' | 'amount';
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    
    const canCreate = user.permissions?.['Accounting']?.create;
    const canUpdate = user.permissions?.['Accounting']?.update;
    
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (dateFrom && t.date < dateFrom) return false;
            if (dateTo && t.date > dateTo) return false;
            if (typeFilter !== 'All' && t.type !== typeFilter) return false;
            if (statusFilter !== 'All' && t.status !== statusFilter) return false;
            return true;
        });
    }, [transactions, dateFrom, dateTo, typeFilter, statusFilter]);
    
    const sortedTransactions = useMemo(() => {
        let sortableItems = [...filteredTransactions];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredTransactions, sortConfig]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortableHeader: React.FC<{ sortKey: SortKey, label: string, className?: string }> = ({ sortKey, label, className }) => (
        <th scope="col" className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${className}`}>
            <button className="flex items-center" onClick={() => handleSort(sortKey)}>
                {label}
                {sortConfig?.key === sortKey && (
                    sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                )}
            </button>
        </th>
    );

    const { kpis, chartData } = useMemo(() => {
        const totalRevenue = filteredTransactions.filter(t => t.type === 'Invoice' && t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = filteredTransactions.filter(t => (t.type === 'Bill' || t.type === 'Payment') && t.status === 'Paid').reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const netProfit = totalRevenue - totalExpenses;
        const accountsReceivable = filteredTransactions.filter(t => t.type === 'Invoice' && (t.status === 'Pending' || t.status === 'Overdue')).reduce((sum, t) => sum + t.amount, 0);
        const overdueAmount = filteredTransactions.filter(t => t.type === 'Invoice' && t.status === 'Overdue').reduce((sum, t) => sum + t.amount, 0);

        const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
        
        let chartData = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(new Date().getFullYear(), new Date().getMonth() - 5 + i, 1);
            return {
                month: d.toLocaleString('default', { month: 'short' }),
                year: d.getFullYear(),
                income: 0,
                expense: 0,
            };
        });

        filteredTransactions.forEach(t => {
            const transactionDate = new Date(t.date);
            const monthIndex = chartData.findIndex(m => m.year === transactionDate.getFullYear() && m.month === transactionDate.toLocaleString('default', { month: 'short' }));
            
            if (monthIndex !== -1) {
                if (t.type === 'Invoice' && t.status === 'Paid') chartData[monthIndex].income += t.amount;
                else if ((t.type === 'Bill' || t.type === 'Payment') && t.status === 'Paid') chartData[monthIndex].expense += Math.abs(t.amount);
            }
        });

        return {
            kpis: [
                { title: 'Total Revenue', value: formatCurrency(totalRevenue), colorClass: 'text-green-600' },
                { title: 'Net Profit', value: formatCurrency(netProfit), colorClass: netProfit >= 0 ? 'text-gray-800 dark:text-gray-100' : 'text-red-500' },
                { title: 'Total Expenses', value: formatCurrency(totalExpenses), colorClass: 'text-red-500' },
                { title: 'Accounts Receivable', value: formatCurrency(accountsReceivable), colorClass: 'text-yellow-600' },
                { title: 'Overdue Amount', value: formatCurrency(overdueAmount), colorClass: overdueAmount > 0 ? 'text-red-500' : 'text-gray-800 dark:text-gray-100' },
            ],
            chartData,
        };
    }, [filteredTransactions]);

    const maxChartValue = Math.max(1, ...chartData.flatMap(d => [d.income, d.expense]));

    const inputClasses = "px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Accounting Dashboard</h1>
                 {canCreate && (
                    <div className="space-x-2">
                        <button onClick={onNewInvoiceClick} className="px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark">New Invoice</button>
                        <button className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">New Bill</button>
                    </div>
                 )}
            </div>

            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="flex items-center gap-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputClasses} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputClasses} />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className={inputClasses + ' w-full'}>
                            <option value="All">All Types</option><option value="Invoice">Invoice</option><option value="Bill">Bill</option><option value="Payment">Payment</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={inputClasses + ' w-full'}>
                            <option value="All">All Statuses</option><option value="Paid">Paid</option><option value="Pending">Pending</option><option value="Overdue">Overdue</option>
                        </select>
                    </div>
                    <button onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter('All'); setStatusFilter('All'); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600">Clear Filters</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Income vs. Expenses (Last 6 Months)</h2>
                 <div className="flex justify-around items-end h-64 border-l border-b border-gray-200 dark:border-gray-700 pl-4 pb-4">
                    {chartData.map(data => (
                        <div key={data.month} className="flex flex-col items-center w-full">
                            <div className="flex items-end h-full w-1/2">
                                <div className="bg-green-400 w-1/2 rounded-t-sm hover:bg-green-500 min-h-[2px]" style={{ height: `${(data.income / maxChartValue) * 100}%` }} title={`Income: ₹${data.income.toLocaleString('en-IN')}`}></div>
                                <div className="bg-red-400 w-1/2 rounded-t-sm hover:bg-red-500 min-h-[2px]" style={{ height: `${(data.expense / maxChartValue) * 100}%` }} title={`Expense: ₹${data.expense.toLocaleString('en-IN')}`}></div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{data.month}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 p-6">Transactions</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <SortableHeader sortKey="id" label="ID" />
                                <SortableHeader sortKey="date" label="Date" />
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <SortableHeader sortKey="amount" label="Amount" className="text-right" />
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedTransactions.map(tx => <TransactionRow key={tx.id} transaction={tx} onRecordPayment={onRecordPayment} canUpdate={!!canUpdate} />)}
                        </tbody>
                    </table>
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

export default AccountingView;
