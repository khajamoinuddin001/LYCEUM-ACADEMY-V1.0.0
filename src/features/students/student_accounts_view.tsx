import React, { useState, useEffect } from 'react';
import { Receipt, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react';
import type { Contact, AccountingTransaction, Quotation } from '@/types';
import * as api from '@/utils/api';
import TransactionPrintView from '@/features/finance/transaction_print_view';
import QuotationDetailsModal from '@/features/finance/quotation_details_modal';

interface StudentAccountsViewProps {
    student: Contact;
    quotations?: Quotation[];
}

const StudentAccountsView: React.FC<StudentAccountsViewProps> = ({ student, quotations = [] }) => {
    const [transactions, setTransactions] = useState<AccountingTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingTransaction, setViewingTransaction] = useState<AccountingTransaction | null>(null);
    const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);

    useEffect(() => {
        loadTransactions();
    }, [student.id]);

    const loadTransactions = async () => {
        try {
            setIsLoading(true);
            const allTransactions = await api.getTransactions();

            // 1. Get real transactions (Invoices/Income) - Match by ID or Name
            const realTransactions = allTransactions.filter(
                (t) => (t.contactId === student.id || (t.customerName && student.name && t.customerName.toLowerCase().trim() === student.name.toLowerCase().trim())) && (t.type === 'Income' || t.type === 'Invoice')
            );

            // 2. Synthesize AR entries from metadata
            const arEntries = (student as any).metadata?.accountsReceivable || [];
            const arTransactions: AccountingTransaction[] = arEntries.map((ar: any) => {
                let status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled' = 'Pending';
                if (ar.status === 'Paid') status = 'Paid';
                else if (ar.status === 'Overdue') status = 'Overdue';

                return {
                    id: `AR-${ar.id}`,
                    contactId: student.id,
                    customerName: student.name,
                    date: ar.createdAt,
                    description: `Quotation #${ar.quotationRef} (Due)`,
                    type: 'Due', // Distinct type for AR
                    status: status,
                    amount: ar.remainingAmount, // Show remaining due
                    paymentMethod: 'Online',
                    invoiceNumber: ar.quotationRef, // Store ref for lookup
                    createdAt: ar.createdAt,
                    updatedAt: ar.updatedAt
                } as AccountingTransaction;
            }).filter((t: AccountingTransaction) => t.status !== 'Paid' && t.amount > 0); // Only show unpaid AR as "Due"

            // Combine and sort by date desc
            const combined = [...arTransactions, ...realTransactions].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setTransactions(combined);
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
        if (type === 'Due') return 'text-orange-600 dark:text-orange-400';
        return type === 'Income' || type === 'Invoice'
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleIDClick = (transaction: AccountingTransaction) => {
        if (transaction.type === 'Due') {
            // It's a Quotation AR entry. Find the quotation.
            // The 'invoiceNumber' field in our synthetic transaction holds the quotationRef (e.g., Q-1001 or just the ID)
            const ref = transaction.invoiceNumber;
            // The Quotations list has 'quotationNumber' (e.g. Q-1001) and 'id' (numeric)

            let quotation = quotations.find(q => q.quotationNumber === ref);
            if (!quotation && ref) {
                // Try parsing ID if ref is just a number string? Or if ref matches ID
                quotation = quotations.find(q => q.id.toString() === ref || q.quotationNumber === `Q-${ref}`);
            }

            if (quotation) {
                setViewingQuotation(quotation);
            } else {
                console.warn('Quotation not found for ref:', ref);
                alert('Detailed quotation not found.');
            }
        } else {
            // It's a standard Invoice/Receipt
            setViewingTransaction(transaction);
        }
    };

    // Calculate Totals specifically based on User Requirements
    // 1. Total Amount = Total Agreed Amount (Sum of all AR entries' original totals)
    const arEntries = (student as any).metadata?.accountsReceivable || [];
    const totalAgreedAmount = arEntries.reduce((sum: number, entry: any) => {
        const remaining = parseFloat(entry.remainingAmount) || 0;
        const paid = parseFloat(entry.paidAmount) || 0;
        return sum + remaining + paid;
    }, 0);

    // 2. Paid Amount = Sum of Paid Invoices/Income
    const paidAmount = transactions
        .filter((t) => (t.type === 'Income' || t.type === 'Invoice') && t.status === 'Paid')
        .reduce((sum, t) => sum + t.amount, 0);

    // 3. Pending = Total Agreed - Total Invoiced (regardless of payment status)
    const totalInvoiced = transactions
        .filter((t) => (t.type === 'Income' || t.type === 'Invoice'))
        .reduce((sum, t) => sum + t.amount, 0);

    const calculatedPending = Math.max(0, totalAgreedAmount - totalInvoiced);
    const totalPending = arEntries.length > 0 ? calculatedPending : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading payment records...</div>
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Accounts & Billing
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your payments, invoices, and quotations
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(totalAgreedAmount)}
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
                                    {formatCurrency(totalPending)}
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
                                                <button
                                                    onClick={() => handleIDClick(transaction)}
                                                    className="flex items-center group text-lyceum-blue hover:text-lyceum-blue-dark transition-colors"
                                                >
                                                    <FileText size={16} className="mr-2 opacity-70 group-hover:opacity-100" />
                                                    <span className="text-sm font-medium underline decoration-dotted underline-offset-2">
                                                        {transaction.id.toString().startsWith('AR-') ? transaction.id : `INV-${transaction.id.toString().padStart(4, '0')}`}
                                                    </span>
                                                </button>
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

                {/* Modals */}
                {viewingTransaction && (
                    <TransactionPrintView
                        transaction={viewingTransaction}
                        contact={student}
                        onClose={() => setViewingTransaction(null)}
                    />
                )}

                {viewingQuotation && (
                    <QuotationDetailsModal
                        quotation={viewingQuotation}
                        student={student}
                        onClose={() => setViewingQuotation(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default StudentAccountsView;
