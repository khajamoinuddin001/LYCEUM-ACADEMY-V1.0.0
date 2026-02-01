import React, { useState, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, DollarSign, PieChart, Wallet, Receipt, AlertCircle,
    ShoppingCart, CreditCard, FileText, Trash2, X, ArrowRightLeft, Edit, Printer
} from 'lucide-react';
import type { AccountingTransaction, Contact, User } from '../types';
import * as api from '../utils/api';
import AccountTransferModal from './account_transfer_modal';
import EditTransactionModal from './edit_transaction_modal';
import TransactionPrintView from './transaction_print_view';
import NewInvoiceModal from './new_invoice_modal';
import NewPurchaseModal from './new_purchase_modal';
import NewExpenseModal from './new_expense_modal';
import TransactionDetailsModal from './transaction_details_modal';

interface AccountingViewProps {
    transactions: AccountingTransaction[];
    contacts: Contact[];
    user: User;
    onNewInvoiceClick: () => void;
    onNewBillClick: () => void;
    onRecordPayment: (transactionId: string) => void;
    onEditTransaction: (transaction: AccountingTransaction) => void;
    onDeleteTransaction: (transactionId: string) => void;
    onPrintTransaction: (transaction: AccountingTransaction) => void;
    onSaveTransaction: (transaction: Omit<AccountingTransaction, 'id'> & { id?: string }) => Promise<void>;
    onAddContact: (contact: any) => Promise<Contact>;
}

const AccountingView: React.FC<AccountingViewProps> = ({
    transactions,
    contacts,
    user,
    onNewInvoiceClick,
    onDeleteTransaction,
    onSaveTransaction,
    onAddContact,
}) => {
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showExpensesModal, setShowExpensesModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<AccountingTransaction | null>(null);
    const [printingTransaction, setPrintingTransaction] = useState<AccountingTransaction | null>(null);
    const [viewingTransaction, setViewingTransaction] = useState<AccountingTransaction | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Purchase' | 'Expense' | 'Transfer'>('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Calculate summary statistics for last 30 days
    const summary = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Filter transactions from last 30 days for revenue/expenses
        const recentTransactions = transactions.filter(t =>
            new Date(t.date) >= thirtyDaysAgo
        );

        // 1. Total Revenue = Sales (Income)
        const revenue = recentTransactions
            .filter(t => (t.type === 'Income' || t.type === 'Invoice') && t.status === 'Paid')
            .reduce((sum, t) => sum + t.amount, 0);

        // 2. Purchases
        const purchases = recentTransactions
            .filter(t => t.type === 'Purchase' && t.status === 'Paid')
            .reduce((sum, t) => sum + t.amount, 0);

        // 3. Expenses (operating expenses)
        const operatingExpenses = recentTransactions
            .filter(t => t.type === 'Expense' && t.status === 'Paid')
            .reduce((sum, t) => sum + t.amount, 0);

        // 4. Total Expenses = Purchases + Expenses
        const totalExpenses = purchases + operatingExpenses;

        // 5. Gross Profit = Sales - Purchases
        const grossProfit = revenue - purchases;

        // 6. Net Profit = Gross Profit - Expenses
        const netProfit = grossProfit - operatingExpenses;

        const cashInHand = Math.round(transactions.filter(t => t.status === 'Paid').reduce((sum, t) => {
            if (t.type === 'Transfer') {
                if (t.paymentMethod === 'Cash') return sum - t.amount; // From Cash
                return sum + t.amount; // To Cash (assuming only Bank/Cash exist)
            }
            if (t.paymentMethod !== 'Cash') return sum;
            return sum + ((t.type === 'Income' || t.type === 'Invoice') ? t.amount : -t.amount);
        }, 0));

        const accountBalance = Math.round(transactions.filter(t => t.status === 'Paid').reduce((sum, t) => {
            if (t.type === 'Transfer') {
                if (t.paymentMethod === 'Online') return sum - t.amount; // From Bank
                return sum + t.amount; // To Bank
            }
            if (t.paymentMethod !== 'Online') return sum;
            return sum + ((t.type === 'Income' || t.type === 'Invoice') ? t.amount : -t.amount);
        }, 0));

        // Accounts Receivable - sum of all expected incoming payments
        // 1. Pending income transactions (invoices not yet paid)
        const pendingIncome = transactions
            .filter(t => t.type === 'Income' && t.status === 'Pending')
            .reduce((sum, t) => sum + t.amount, 0);

        // 2. AR from agreed quotations
        const quotationAR = contacts.reduce((sum, contact) => {
            const arEntries = (contact as any).metadata?.accountsReceivable || [];
            return sum + arEntries.reduce((arSum: number, ar: any) => arSum + ar.remainingAmount, 0);
        }, 0);

        const accountsReceivable = pendingIncome + quotationAR;

        // Overdue amount - check if due date has passed
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdue = transactions
            .filter(t => {
                if (t.dueDate) {
                    const dueDate = new Date(t.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate < today && (t.status === 'Pending' || t.status === 'Overdue');
                }
                return t.status === 'Overdue';
            })
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            revenue,
            expenses: totalExpenses,
            grossProfit,
            netProfit,
            cashInHand,
            accountBalance,
            accountsReceivable,
            overdue
        };
    }, [transactions, contacts]);

    // Recent transactions (last 20) with search and filter
    const recentTransactions = useMemo(() => {
        // 1. Start with regular transactions
        let combined: AccountingTransaction[] = [...transactions];

        // 2. Convert AR Entries from Contacts into pseudo-transactions for display
        contacts.forEach(contact => {
            const arEntries = (contact as any).metadata?.accountsReceivable || [];
            arEntries.forEach((ar: any) => {
                // Only show outstanding or partially paid AR entries as 'Income' (Pending)
                const isPaid = ar.status === 'Paid';
                // Define status mapping
                let status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled' = 'Pending';
                if (ar.status === 'Paid') status = 'Paid';
                else if (ar.status === 'Overdue') status = 'Overdue';

                const arTransaction: AccountingTransaction = {
                    id: `AR-${ar.id}`, // Unique ID prefix
                    date: ar.createdAt,
                    amount: ar.remainingAmount, // Show remaining pending amount
                    type: 'Due',
                    // category: 'Sales', // Removed as it is not part of AccountingTransaction type
                    description: `Quotation #${ar.quotationRef} (Due)`,
                    status: status,
                    paymentMethod: 'Online',
                    contactId: contact.id,
                    contact: contact.name,
                    customerName: contact.name, // Added mapping for customerName
                    invoiceNumber: ar.quotationRef
                };
                combined.push(arTransaction);
            });
        });


        // 3. Apply Filters
        let filtered = combined;

        // Apply type filter
        if (typeFilter !== 'All') {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        // Apply date filter
        if (startDate) {
            filtered = filtered.filter(t => new Date(t.date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(t => new Date(t.date) <= new Date(endDate));
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                (t.invoiceNumber?.toLowerCase().includes(query)) ||
                (t.id?.toString().toLowerCase().includes(query)) ||
                (t.contact?.toLowerCase().includes(query)) ||
                (t.customerName?.toLowerCase().includes(query)) ||
                (t.description?.toLowerCase().includes(query))
            );
        }

        return filtered
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 50); // Increased slice to show more context
    }, [transactions, contacts, searchQuery, typeFilter, startDate, endDate]);

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

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Income':
                return 'text-green-600 dark:text-green-400';
            case 'Expense':
                return 'text-red-600 dark:text-red-400';
            case 'Transfer':
                return 'text-purple-600 dark:text-purple-400';
            default:
                return 'text-blue-600 dark:text-blue-400';
        }
    };

    const handleDeleteInvoice = (transactionId: string) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            onDeleteTransaction(transactionId);
        }
    };

    const handleUpdateTransaction = async (id: string, updates: Partial<AccountingTransaction>) => {
        try {
            await onSaveTransaction({ ...updates, id });
            setEditingTransaction(null);
        } catch (error) {
            console.error('Error updating transaction:', error);
            alert('Failed to update transaction. Please try again.');
        }
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header with Action Buttons */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Accounting Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Complete financial overview and transactions
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowTransferModal(true)}
                            className="flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-colors shadow-md"
                        >
                            <ArrowRightLeft size={18} className="mr-2" />
                            Transfer
                        </button>
                        <button
                            onClick={() => setShowPurchaseModal(true)}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                        >
                            <ShoppingCart size={18} className="mr-2" />
                            Purchase
                        </button>
                        <button
                            onClick={() => setShowExpensesModal(true)}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                        >
                            <CreditCard size={18} className="mr-2" />
                            Expenses
                        </button>
                        <button
                            onClick={() => setShowInvoiceModal(true)}
                            className="flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-colors shadow-md"
                        >
                            <FileText size={18} className="mr-2" />
                            Invoices
                        </button>
                    </div>
                </div>

                {/* Summary Boxes - 7 boxes in grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* 1. Total Revenue (Last 30 days) */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last 30 Days</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(summary.revenue)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* 2. Total Expenses (Last 30 days) */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last 30 Days</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(summary.expenses)}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                <TrendingDown className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* 3. Gross Profit (Last 30 days) */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last 30 Days</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gross Profit</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(summary.grossProfit)}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* 4. Net Profit (Last 30 days) */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last 30 Days</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Profit (Income)</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {formatCurrency(summary.netProfit)}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                <PieChart className="text-purple-600 dark:text-purple-400" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* 5. Cash Flow - Two values */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-teal-500">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Cash Flow</p>
                            <div className="p-3 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                                <Wallet className="text-teal-600 dark:text-teal-400" size={24} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Cash in Hand</p>
                                <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                                    {formatCurrency(summary.cashInHand)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Account Balance</p>
                                <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                                    {formatCurrency(summary.accountBalance)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 6. Accounts Receivable */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Accounts Receivable</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    {formatCurrency(summary.accountsReceivable)}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                <Receipt className="text-orange-600 dark:text-orange-400" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* 7. Overdue Amount */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-red-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overdue Amount</p>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-500">
                                    {formatCurrency(summary.overdue)}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                <AlertCircle className="text-red-700 dark:text-red-500" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Recent Transactions
                            </h2>
                        </div>

                        {/* Search and Filter */}
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Search by invoice, client, or description..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lyceum-blue text-gray-900 dark:text-gray-100"
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
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lyceum-blue text-gray-900 dark:text-gray-100"
                                    placeholder="Start Date"
                                />
                                <span className="text-gray-500 dark:text-gray-400">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lyceum-blue text-gray-900 dark:text-gray-100"
                                    placeholder="End Date"
                                />
                            </div>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lyceum-blue text-gray-900 dark:text-gray-100"
                            >
                                <option value="All">All Types</option>
                                <option value="Income">Income</option>
                                <option value="Purchase">Purchase</option>
                                <option value="Expense">Expense</option>
                                <option value="Transfer">Transfer</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Inv Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Customer Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Due Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Due Amount
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {recentTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No transactions found
                                        </td>
                                    </tr>
                                ) : (
                                    recentTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => setViewingTransaction(transaction)}
                                                    className="text-sm font-medium text-lyceum-blue hover:text-lyceum-blue-dark dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer"
                                                >
                                                    {transaction.invoiceNumber || transaction.id}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                                    {formatDate(transaction.date)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {transaction.contact || transaction.customerName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {transaction.description || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-medium ${getTypeColor(transaction.type)}`}>
                                                    {transaction.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {transaction.dueDate ? formatDate(transaction.dueDate) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {transaction.status === 'Pending' || transaction.status === 'Overdue' ? (
                                                    (() => {
                                                        const isOverdue = transaction.dueDate && new Date(transaction.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
                                                        return (
                                                            <span className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                {formatCurrency(transaction.amount)}
                                                            </span>
                                                        );
                                                    })()
                                                ) : (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setEditingTransaction(transaction)}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                        title="Edit transaction"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setPrintingTransaction(transaction)}
                                                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                                        title="Print transaction"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteInvoice(transaction.id)}
                                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                        title="Delete transaction"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* New Invoice Modal */}
                <NewInvoiceModal
                    isOpen={showInvoiceModal}
                    onClose={() => setShowInvoiceModal(false)}
                    contacts={contacts}
                    onSave={onSaveTransaction}
                    onAddContact={onAddContact}
                />

                {/* New Purchase Modal */}
                <NewPurchaseModal
                    isOpen={showPurchaseModal}
                    onClose={() => setShowPurchaseModal(false)}
                    contacts={contacts}
                    onSave={onSaveTransaction}
                    onAddContact={onAddContact}
                />

                {/* New Expense Modal */}
                <NewExpenseModal
                    isOpen={showExpensesModal}
                    onClose={() => setShowExpensesModal(false)}
                    contacts={contacts}
                    onSave={onSaveTransaction}
                    onAddContact={onAddContact}
                />

                <AccountTransferModal
                    isOpen={showTransferModal}
                    onClose={() => setShowTransferModal(false)}
                    onSave={onSaveTransaction}
                />

                {/* Edit Transaction Modal */}
                {editingTransaction && (
                    <EditTransactionModal
                        transaction={editingTransaction}
                        contacts={contacts}
                        onClose={() => setEditingTransaction(null)}
                        onSave={handleUpdateTransaction}
                    />
                )}

                {/* Print Transaction View */}
                {printingTransaction && (
                    <TransactionPrintView
                        transaction={printingTransaction}
                        contact={contacts.find(c => c.id === printingTransaction.contactId)}
                        onClose={() => setPrintingTransaction(null)}
                    />
                )}

                {/* Transaction Details Modal */}
                {viewingTransaction && (
                    <TransactionDetailsModal
                        transaction={viewingTransaction}
                        onClose={() => setViewingTransaction(null)}
                    />
                )}
            </div>
        </div>
    );
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'Income': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full text-xs';
        case 'Invoice': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full text-xs';
        case 'Due': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full text-xs';
        case 'Purchase': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20 px-2 py-1 rounded-full text-xs';
        case 'Expense': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded-full text-xs';
        case 'Transfer': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs';
        default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs';
    }
};

export default AccountingView;
