import React from 'react';
import type { AccountingTransaction, Contact } from '../types';

interface TransactionPrintViewProps {
    transaction: AccountingTransaction;
    contact?: Contact;
    onClose: () => void;
}

const TransactionPrintView: React.FC<TransactionPrintViewProps> = ({ transaction, contact, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

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
            case 'Income': return 'text-green-600';
            case 'Purchase': return 'text-orange-600';
            case 'Expense': return 'text-red-600';
            case 'Transfer': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            'Paid': 'bg-green-100 text-green-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Overdue': 'bg-red-100 text-red-800'
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-content, #print-content * {
                        visibility: visible;
                    }
                    #print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-break {
                        page-break-after: always;
                    }
                }
            `}</style>

            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header - No Print */}
                    <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Transaction Receipt
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Print
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    {/* Print Content */}
                    <div id="print-content" className="p-8">
                        {/* Company Header */}
                        <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lyceum Academy</h1>
                            <p className="text-gray-600">Professional Education & Training Services</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Email: omar@lyceumacademy.com | Phone: +91 7893078791
                            </p>
                        </div>

                        {/* Transaction Header */}
                        <div className="mb-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className={`text-2xl font-bold ${getTypeColor(transaction.type)} mb-1`}>
                                        {transaction.type} Receipt
                                    </h2>
                                    <p className="text-gray-600">Transaction ID: <span className="font-mono font-semibold">{transaction.id}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Date</p>
                                    <p className="text-lg font-semibold">{formatDate(transaction.date)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer/Vendor Information */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                {transaction.type === 'Income' ? 'Customer' : 'Vendor'} Information
                            </h3>
                            <p className="text-gray-700 font-medium text-lg">{transaction.customerName}</p>
                            {contact && (
                                <div className="mt-3 space-y-1 text-sm text-gray-600">
                                    {contact.email && (
                                        <p><span className="font-medium">Email:</span> {contact.email}</p>
                                    )}
                                    {contact.phone && (
                                        <p><span className="font-medium">Phone:</span> {contact.phone}</p>
                                    )}
                                    {(contact.street1 || contact.city || contact.state) && (
                                        <div className="mt-2">
                                            <p className="font-medium">Address:</p>
                                            {contact.street1 && <p>{contact.street1}</p>}
                                            {contact.street2 && <p>{contact.street2}</p>}
                                            {(contact.city || contact.state || contact.zip) && (
                                                <p>
                                                    {contact.city}{contact.city && contact.state && ', '}{contact.state} {contact.zip}
                                                </p>
                                            )}
                                            {contact.country && <p>{contact.country}</p>}
                                        </div>
                                    )}
                                    {contact.gstin && (
                                        <p><span className="font-medium">GSTIN:</span> {contact.gstin}</p>
                                    )}
                                    {contact.pan && (
                                        <p><span className="font-medium">PAN:</span> {contact.pan}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Transaction Details */}
                        <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t border-gray-200">
                                        <td className="px-4 py-4 text-gray-700">
                                            {transaction.description || `${transaction.type} transaction`}
                                        </td>
                                        <td className="px-4 py-4 text-right font-semibold text-gray-900">
                                            {formatCurrency(transaction.amount)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Payment Details */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Payment Method:</span>
                                        <span className="font-medium text-gray-900">
                                            {transaction.paymentMethod || 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(transaction.status)}`}>
                                            {transaction.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Amount Summary</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(transaction.amount)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-300">
                                        <span className="font-semibold text-gray-900">Total Amount:</span>
                                        <span className="font-bold text-lg text-gray-900">{formatCurrency(transaction.amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Notes */}
                        {transaction.description && (
                            <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                                <p className="text-gray-700 text-sm">{transaction.description}</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mt-12 pt-6 border-t border-gray-300">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-gray-500">
                                        This is a computer-generated receipt and does not require a signature.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Generated on: {new Date().toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="border-t-2 border-gray-800 pt-2 mt-8">
                                        <p className="text-sm font-semibold text-gray-900">Authorized Signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Thank You Note */}
                        <div className="text-center mt-8 text-gray-600">
                            <p className="font-semibold">Thank you for your business!</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TransactionPrintView;
