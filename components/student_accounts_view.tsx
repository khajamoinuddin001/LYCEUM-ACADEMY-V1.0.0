import React, { useState, useEffect } from 'react';
import { Receipt, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react';
import type { Contact, AccountingTransaction } from '../types';
import * as api from '../utils/api';

interface StudentAccountsViewProps {
    student: Contact;
}

const StudentAccountsView: React.FC<StudentAccountsViewProps> = ({ student }) => {
    const [transactions, setTransactions] = useState<AccountingTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTransactions();
    }, [student.id]);

    const loadTransactions = async () => {
        try {
            setIsLoading(true);
            const allTransactions = await api.getTransactions();
            // Filter to show only this student's transactions
            const studentTransactions = allTransactions.filter(
                (t) => t.contactId === student.id
            );
            setTransactions(studentTransactions);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'overdue':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'cancelled':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        }
    };

    const getTypeColor = (type: string) => {
        return type === 'Income'
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const paidAmount = transactions
        .filter((t) => t.status?.toLowerCase() === 'paid')
        .reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = transactions
        .filter((t) => t.status?.toLowerCase() === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading invoices...</div>
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        My Invoices
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        View all your payment records and invoices
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(totalAmount)}
                                </p>
                            </div>
                            <DollarSign className="text-blue-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(paidAmount)}
                                </p>
                            </div>
                            <Receipt className="text-green-500" size={32} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {formatCurrency(pendingAmount)}
                                </p>
                            </div>
                            <AlertCircle className="text-yellow-500" size={32} />
                        </div>
                    </div>
                </div>

                {/* Invoices List */}
                {transactions.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No invoices yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Your invoices will appear here once they are created
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Invoice ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {transactions.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <FileText size={16} className="text-gray-400 mr-2" />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        INV-{transaction.id.toString().padStart(4, '0')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                    <Calendar size={14} className="mr-1" />
                                                    {formatDate(transaction.date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {transaction.description || 'No description'}
                                                </div>
                                                {transaction.notes && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {transaction.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-medium ${getTypeColor(transaction.type)}`}>
                                                    {transaction.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {formatCurrency(transaction.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                                        transaction.status
                                                    )}`}
                                                >
                                                    {transaction.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Help Section */}
                {transactions.length > 0 && (
                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start">
                            <AlertCircle className="text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" size={20} />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-semibold mb-1">Need help with an invoice?</p>
                                <p>
                                    If you have questions about any invoice or payment, please raise a support ticket
                                    from the Tickets app or contact your counselor.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAccountsView;
