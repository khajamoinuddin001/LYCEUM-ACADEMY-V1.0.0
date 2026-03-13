import React from 'react';
import { X, Calendar, DollarSign, User, FileText, CreditCard, CheckCircle } from 'lucide-react';
import type { AccountingTransaction } from '@/types';

interface TransactionDetailsModalProps {
    transaction: AccountingTransaction;
    onClose: () => void;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ transaction, onClose }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Income': return 'text-green-600 dark:text-green-400';
            case 'Purchase': return 'text-orange-600 dark:text-orange-400';
            case 'Expense': return 'text-red-600 dark:text-red-400';
            case 'Transfer': return 'text-blue-600 dark:text-blue-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            'Paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            'Overdue': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Transaction Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Transaction ID and Type */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                                {transaction.invoiceNumber || transaction.id}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                            <p className={`text-lg font-semibold ${getTypeColor(transaction.type)}`}>
                                {transaction.type}
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Status</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(transaction.status)}`}>
                            {transaction.status}
                        </span>
                    </div>

                    {/* Customer/Vendor */}
                    <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {transaction.type === 'Income' ? 'Customer' : 'Vendor/Payee'}
                            </p>
                            <p className="text-base font-medium text-gray-900 dark:text-white">
                                {transaction.customerName}
                            </p>
                            {transaction.contact && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.contact}</p>
                            )}
                        </div>
                    </div>

                    {/* Amount Details */}
                    <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1 space-y-1">
                            {transaction.additionalDiscount ? (
                                <>
                                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency((transaction.amount || 0) + (transaction.additionalDiscount || 0))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-500 dark:text-red-400">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(transaction.additionalDiscount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span className="font-medium text-gray-900 dark:text-white">Total</span>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(transaction.amount)}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(transaction.amount)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Transaction Date</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">
                                    {formatDate(transaction.date)}
                                </p>
                            </div>
                        </div>

                        {transaction.dueDate && (
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                                    <p className="text-base font-medium text-gray-900 dark:text-white">
                                        {formatDate(transaction.dueDate)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    {transaction.paymentMethod && (
                        <div className="flex items-start gap-3">
                            <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">
                                    {transaction.paymentMethod}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {transaction.description && !transaction.lineItems?.length && (
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</p>
                                <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                                    {transaction.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Line Items Breakdown */}
                    {transaction.lineItems && transaction.lineItems.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                <FileText className="w-4 h-4" />
                                <span>Items Breakdown</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-2 font-semibold">Item</th>
                                            <th className="px-4 py-2 font-semibold text-center">Qty</th>
                                            <th className="px-4 py-2 font-semibold text-right">Price</th>
                                            <th className="px-4 py-2 font-semibold text-right text-blue-600 dark:text-blue-400">Disc</th>
                                            <th className="px-4 py-2 font-semibold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {transaction.lineItems.map((item: any, idx) => (
                                            <tr key={idx} className="text-gray-700 dark:text-gray-300">
                                                <td className="px-4 py-2 font-medium">{item.description}</td>
                                                <td className="px-4 py-2 text-center">{item.quantity}</td>
                                                <td className="px-4 py-2 text-right">₹{item.rate || item.price || 0}</td>
                                                <td className="px-4 py-2 text-right text-blue-600 dark:text-blue-400">₹{item.discount || 0}</td>
                                                <td className="px-4 py-2 text-right font-semibold">₹{item.amount || (((item.quantity || 1) * (item.rate || item.price || 0)) - (item.discount || 0))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {transaction.description && transaction.lineItems?.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase mb-1">Notes</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                {transaction.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailsModal;
