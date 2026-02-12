
import React from 'react';
import type { AccountingTransaction, Contact } from '@/types';
import { IndianRupee } from '@/components/common/icons';

interface PrintTransactionProps {
    transaction: AccountingTransaction;
    contact?: Contact;
    onClose: () => void;
}

const PrintTransaction: React.FC<PrintTransactionProps> = ({ transaction, contact, onClose }) => {
    const isInvoice = transaction.type === 'Invoice';

    return (
        <div className="fixed inset-0 bg-white z-[100] overflow-y-auto p-8 print:p-0">
            <div className="max-w-4xl mx-auto border border-gray-100 p-8 shadow-sm print:shadow-none print:border-none">

                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-lyceum-blue mb-2">LYCEUM ACADEMY</h1>
                        <p className="text-gray-500 text-sm">Empowering Your Future</p>
                        <div className="mt-4 text-xs text-gray-500 leading-relaxed">
                            123 Academy Road, Suite 500<br />
                            Hyderabad, Telangana, 500001<br />
                            Email: accounts@lyceum.edu<br />
                            Phone: +91 98765 43210
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-light text-gray-400 uppercase tracking-widest mb-4">
                            {transaction.type}
                        </h2>
                        <div className="space-y-1 text-sm">
                            <p><span className="font-semibold text-gray-600">Number:</span> {transaction.id}</p>
                            <p><span className="font-semibold text-gray-600">Date:</span> {transaction.date}</p>
                            <p><span className="font-semibold text-gray-600">Status:</span> {transaction.status}</p>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100 mb-8" />

                {/* Addresses */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            {isInvoice ? 'Bill To' : 'Pay To'}
                        </h3>
                        <div className="text-gray-800 font-semibold text-lg mb-1">{transaction.customerName}</div>
                        {contact && (
                            <div className="text-gray-500 text-sm leading-relaxed">
                                {contact.email}<br />
                                {contact.phone}<br />
                                {contact.street1 && <>{contact.street1}<br /></>}
                                {contact.city && <>{contact.city}, {contact.state} {contact.zip}</>}
                            </div>
                        )}
                        {!contact && <div className="text-gray-400 text-xs italic">No contact details provided</div>}
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Amount Due</h3>
                        <div className="text-4xl font-bold text-gray-900 flex items-center justify-end">
                            <IndianRupee size={28} />
                            {Math.abs(transaction.amount).toLocaleString('en-IN')}
                        </div>
                        {transaction.status === 'Paid' && (
                            <div className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">
                                Fully Paid
                            </div>
                        )}
                    </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full mb-12 border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="px-4 py-4 text-sm text-gray-800 font-medium">{transaction.description}</td>
                            <td className="px-4 py-4 text-right text-sm text-gray-600">1</td>
                            <td className="px-4 py-4 text-right text-sm text-gray-600">₹{Math.abs(transaction.amount).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-4 text-right text-sm font-bold text-gray-900">₹{Math.abs(transaction.amount).toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-gray-200">
                            <td colSpan={2}></td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-600 uppercase">Subtotal</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">₹{Math.abs(transaction.amount).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td colSpan={2}></td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-600 uppercase">Tax (0%)</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">₹0</td>
                        </tr>
                        <tr className="bg-lyceum-blue/5">
                            <td colSpan={2}></td>
                            <td className="px-4 py-4 text-right text-lg font-bold text-lyceum-blue uppercase">Total</td>
                            <td className="px-4 py-4 text-right text-lg font-bold text-lyceum-blue">₹{Math.abs(transaction.amount).toLocaleString('en-IN')}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Footer Note */}
                <div className="text-center pt-8 border-t border-gray-100 text-gray-400 text-xs italic">
                    <p>Thank you for choosing Lyceum Academy. Please contact accounts@lyceum.edu for any queries.</p>
                    <p className="mt-1">Generated electronically on {new Date().toLocaleString()}</p>
                </div>
            </div>

            {/* Control buttons (hidden in print) */}
            <div className="max-w-4xl mx-auto mt-8 flex justify-center space-x-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="px-8 py-3 bg-lyceum-blue text-white rounded-lg shadow-lg hover:bg-lyceum-blue-dark transition-all transform hover:scale-105"
                >
                    Print Now
                </button>
                <button
                    onClick={onClose}
                    className="px-8 py-3 bg-gray-100 text-gray-600 rounded-lg shadow hover:bg-gray-200 transition-all"
                >
                    Close Preview
                </button>
            </div>
        </div>
    );
};

export default PrintTransaction;
