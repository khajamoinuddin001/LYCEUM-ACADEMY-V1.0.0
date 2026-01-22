import React, { useState, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, DollarSign, PieChart, Wallet, Receipt, AlertCircle,
    Plus, ShoppingCart, CreditCard, FileText, Calendar, IndianRupee
} from 'lucide-react';
import type { AccountingTransaction, Contact, User } from '../types';

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
}

const AccountingView: React.FC<AccountingViewProps> = ({
    transactions,
    contacts,
    user,
    onNewInvoiceClick,
    onNewBillClick,
}) => {
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showExpensesModal, setShowExpensesModal] = useState(false);

    // Calculate summary statistics
    const summary = useMemo(() => {
        const revenue = transactions
            .filter(t => t.type === 'Income' && t.status === 'Paid')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = transactions
            .filter(t => t.type === 'Expense' && t.status === 'Paid')
            .reduce((sum, t) => sum + t.amount, 0);

        const grossProfit = revenue - (expenses * 0.3); // Assuming 30% direct costs
        const netProfit = revenue - expenses;

        // Cash flow - simplified for now
        const cashInHand = 50000; // This should come from actual cash records
        const accountBalance = revenue - expenses;

        // Accounts Receivable
        const accountsReceivable = contacts.reduce((sum, contact) => {
            const arEntries = (contact as any).metadata?.accountsReceivable || [];
            return sum + arEntries.reduce((arSum: number, ar: any) => arSum + ar.remainingAmount, 0);
        }, 0);

        // Overdue amount
        const overdue = transactions
            .filter(t => t.status === 'Overdue')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            revenue,
            expenses,
            grossProfit,
            netProfit,
            cashInHand,
            accountBalance,
            accountsReceivable,
            overdue
        };
    }, [transactions, contacts]);

    // Recent transactions (last 20)
    const recentTransactions = useMemo(() => {
        return [...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 20);
    }, [transactions]);

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
            default:
                return 'text-blue-600 dark:text-blue-400';
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
                            onClick={() => setShowPurchaseModal(true)}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <ShoppingCart size={18} className="mr-2" />
                            Purchase
                        </button>
                        <button
                            onClick={() => setShowExpensesModal(true)}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <CreditCard size={18} className="mr-2" />
                            Expenses
                        </button>
                        <button
                            onClick={onNewInvoiceClick}
                            className="flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-colors"
                        >
                            <FileText size={18} className="mr-2" />
                            Invoices
                        </button>
                    </div>
                </div>

                {/* Summary Boxes - 7 boxes in grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* 1. Total Revenue */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
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

                    {/* 2. Total Expenses */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
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

                    {/* 3. Gross Profit */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
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

                    {/* 4. Net Profit (Income) */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
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
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Recent Transactions
                        </h2>
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
                                        Name of Client (Entity)
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {recentTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No transactions found
                                        </td>
                                    </tr>
                                ) : (
                                    recentTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-lyceum-blue">
                                                    {transaction.invoiceNumber || transaction.id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                                    {formatDate(transaction.date)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {transaction.contact}
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
                                                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                                        {formatCurrency(transaction.amount)}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountingView;
