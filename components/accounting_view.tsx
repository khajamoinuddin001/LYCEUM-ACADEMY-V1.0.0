
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { IndianRupee, Filter, ArrowUp, ArrowDown, MoreHorizontal, Edit, Trash2, Printer, MessageCircle } from './icons';
import type { AccountingTransaction, TransactionStatus, TransactionType, User, Contact } from '../types';

interface AccountingViewProps {
    transactions: AccountingTransaction[];
    onNewInvoiceClick: () => void;
    onNewBillClick: () => void;
    user: User;
    onRecordPayment: (transactionId: string) => void;
    onEditTransaction: (transaction: AccountingTransaction) => void;
    onDeleteTransaction: (transactionId: string) => void;
    onPrintTransaction: (transaction: AccountingTransaction) => void;
    contacts: Contact[];
}

const KpiCard: React.FC<{ title: string; value: string; colorClass?: string; }> = ({ title, value, colorClass = 'text-gray-800 dark:text-gray-100' }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
    </div>
);

const statusClasses: { [key in TransactionStatus]: string } = {
    Paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    Overdue: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const TransactionRow: React.FC<{
    transaction: AccountingTransaction;
    onRecordPayment: (id: string) => void;
    onEdit: (t: AccountingTransaction) => void;
    onDelete: (id: string) => void;
    onPrint: (t: AccountingTransaction) => void;
    onWhatsApp: (t: AccountingTransaction) => void;
    canUpdate: boolean;
    canDelete: boolean;
}> = ({ transaction, onRecordPayment, onEdit, onDelete, onPrint, onWhatsApp, canUpdate, canDelete }) => {
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
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-medium">
                {transaction.customerName}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">{transaction.description}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${transaction.type === 'Invoice' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30' : 'bg-orange-50 text-orange-700 dark:bg-orange-900/30'}`}>
                    {transaction.type}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[transaction.status]}`}>
                    {transaction.status}
                </span>
            </td>
            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {transaction.amount > 0 ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="relative inline-block text-left" ref={actionsRef}>
                    <button onClick={() => setActionsOpen(!actionsOpen)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600">
                        <MoreHorizontal size={18} />
                    </button>
                    {actionsOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1">
                                {(transaction.status === 'Pending' || transaction.status === 'Overdue') && canUpdate && (
                                    <button
                                        onClick={() => { onRecordPayment(transaction.id); setActionsOpen(false); }}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                    >
                                        <IndianRupee size={14} className="mr-2" /> Record Payment
                                    </button>
                                )}
                                {canUpdate && (
                                    <button
                                        onClick={() => { onEdit(transaction); setActionsOpen(false); }}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <Edit size={14} className="mr-2" /> Edit Details
                                    </button>
                                )}
                                <button
                                    onClick={() => { onPrint(transaction); setActionsOpen(false); }}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <Printer size={14} className="mr-2" /> Print {transaction.type}
                                </button>
                                {transaction.type === 'Invoice' && (transaction.status === 'Pending' || transaction.status === 'Overdue') && (
                                    <button
                                        onClick={() => { onWhatsApp(transaction); setActionsOpen(false); }}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    >
                                        <MessageCircle size={14} className="mr-2" /> WhatsApp Alert
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={() => { if (confirm('Delete this transaction?')) onDelete(transaction.id); setActionsOpen(false); }}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 size={14} className="mr-2" /> Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}

const AccountingView: React.FC<AccountingViewProps> = ({
    transactions,
    onNewInvoiceClick,
    onNewBillClick,
    user,
    onRecordPayment,
    onEditTransaction,
    onDeleteTransaction,
    onPrintTransaction,
    contacts
}) => {

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | TransactionType>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | TransactionStatus>('All');

    type SortKey = 'id' | 'date' | 'amount';
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

    const canCreate = user.role === 'Admin' || !!user.permissions?.['Accounting']?.create;
    const canUpdate = user.role === 'Admin' || !!user.permissions?.['Accounting']?.update;
    const canDelete = user.role === 'Admin' || !!user.permissions?.['Accounting']?.delete;

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
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredTransactions, sortConfig]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const { kpis, chartData, overdueInvoices } = useMemo(() => {
        const totalRevenue = filteredTransactions.filter(t => t.type === 'Invoice' && t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = filteredTransactions.filter(t => (t.type === 'Bill' || t.type === 'Payment') && t.status === 'Paid').reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const netProfit = totalRevenue - totalExpenses;
        const accountsReceivable = filteredTransactions.filter(t => t.type === 'Invoice' && (t.status === 'Pending' || t.status === 'Overdue')).reduce((sum, t) => sum + t.amount, 0);
        const overdueAmount = filteredTransactions.filter(t => t.type === 'Invoice' && t.status === 'Overdue').reduce((sum, t) => sum + t.amount, 0);

        const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

        let chartData = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - 5 + i);
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
                { title: 'Total Expenses', value: formatCurrency(totalExpenses), colorClass: 'text-red-500' },
                { title: 'Net Profit', value: formatCurrency(netProfit), colorClass: netProfit >= 0 ? 'text-gray-800 dark:text-gray-100' : 'text-red-500' },
                { title: 'Accounts Receivable', value: formatCurrency(accountsReceivable), colorClass: 'text-yellow-600' },
                { title: 'Overdue Amount', value: formatCurrency(overdueAmount), colorClass: overdueAmount > 0 ? 'text-red-500' : 'text-gray-400' },
            ],
            chartData,
            overdueInvoices: filteredTransactions.filter(t => t.type === 'Invoice' && t.status === 'Overdue')
        };
    }, [filteredTransactions]);

    const handleWhatsAppAlert = (tx: AccountingTransaction) => {
        const contact = contacts.find(c => c.id === tx.contactId);
        if (!contact || !contact.phone) {
            alert(`No phone number found for ${tx.customerName}`);
            return;
        }

        const message = `Hello ${tx.customerName}, this is a reminder regarding your overdue ${tx.type} ${tx.id} for ₹${Math.abs(tx.amount).toLocaleString('en-IN')}. Please settle it at your earliest convenience. Thank you!`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleNotifyAllOverdue = () => {
        const overdue = overdueInvoices;
        if (overdue.length === 0) {
            alert('No overdue invoices to notify.');
            return;
        }

        if (confirm(`Send WhatsApp reminders for ${overdue.length} overdue invoices?`)) {
            overdue.forEach(tx => {
                const contact = contacts.find(c => c.id === tx.contactId);
                if (contact && contact.phone) {
                    const message = `Reminder: Your ${tx.type} ${tx.id} for ₹${Math.abs(tx.amount).toLocaleString('en-IN')} is overdue. Please settle it soon.`;
                    const encodedMessage = encodeURIComponent(message);
                    const whatsappUrl = `https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
                    window.open(whatsappUrl, '_blank');
                }
            });
        }
    };

    const maxChartValue = Math.max(1000, ...chartData.flatMap(d => [d.income, d.expense]));

    const inputClasses = "px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Accounting</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage invoices, bills, and track your financial performance.</p>
                </div>
                {canCreate && (
                    <div className="flex gap-3">
                        <button
                            onClick={onNewBillClick}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            + New Bill
                        </button>
                        <button
                            onClick={onNewInvoiceClick}
                            className="px-4 py-2 bg-lyceum-blue text-white rounded-lg shadow-sm hover:bg-lyceum-blue-dark transition-all transform hover:scale-105"
                        >
                            + New Invoice
                        </button>
                    </div>
                )}
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputClasses + ' w-full'} />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputClasses + ' w-full'} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Transaction Type</label>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className={inputClasses + ' w-full'}>
                            <option value="All">All Types</option>
                            <option value="Invoice">Invoice</option>
                            <option value="Bill">Bill</option>
                            <option value="Payment">Payment</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Status</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={inputClasses + ' w-full'}>
                            <option value="All">All Statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>
                    <button
                        onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter('All'); setStatusFilter('All'); }}
                        className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">Income vs. Expenses</h2>
                    <div className="flex justify-around items-end h-64 border-l border-b border-gray-100 dark:border-gray-700 pl-4 pb-2">
                        {chartData.map(data => (
                            <div key={data.month} className="flex flex-col items-center w-full group relative">
                                <div className="flex items-end gap-1 h-full w-full justify-center">
                                    <div
                                        className="bg-green-500/80 w-4 rounded-t-sm hover:bg-green-600 transition-all duration-500"
                                        style={{ height: `${(data.income / maxChartValue) * 100}%` }}
                                    ></div>
                                    <div
                                        className="bg-red-500/80 w-4 rounded-t-sm hover:bg-red-600 transition-all duration-500"
                                        style={{ height: `${(data.expense / maxChartValue) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 mt-2">{data.month}</p>

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] p-2 rounded shadow-xl z-10 whitespace-nowrap">
                                    <p className="text-green-400">Income: ₹{data.income.toLocaleString()}</p>
                                    <p className="text-red-400">Expense: ₹{data.expense.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-lyceum-blue to-blue-700 p-6 rounded-xl shadow-lg text-white flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold opacity-90">Quick WhatsApp Alert</h3>
                        <p className="text-sm opacity-75 mt-2">Instantly notify students or vendors about overdue payments via WhatsApp.</p>
                    </div>
                    <div className="mt-8 space-y-4">
                        <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                            <div className="text-xs uppercase font-bold opacity-60">Currently Overdue</div>
                            <div className="text-2xl font-bold">₹{kpis.find(k => k.title === 'Overdue Amount')?.value.replace('₹', '') || '0'}</div>
                        </div>
                        <button
                            className="w-full py-3 bg-white text-lyceum-blue font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-inner"
                            onClick={handleNotifyAllOverdue}
                        >
                            Notify All Overdue
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Transactions</h2>
                    <span className="text-xs text-gray-500">{filteredTransactions.length} records found</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('id')}>
                                    ID {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                                    Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Entity</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('amount')}>
                                    Amount {sortConfig?.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedTransactions.length > 0 ? (
                                sortedTransactions.map(tx => (
                                    <TransactionRow
                                        key={tx.id}
                                        transaction={tx}
                                        onRecordPayment={onRecordPayment}
                                        onEdit={onEditTransaction}
                                        onDelete={onDeleteTransaction}
                                        onPrint={onPrintTransaction}
                                        onWhatsApp={handleWhatsAppAlert}
                                        canUpdate={canUpdate}
                                        canDelete={canDelete}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No transactions match your filters.</td>
                                </tr>
                            )}
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
