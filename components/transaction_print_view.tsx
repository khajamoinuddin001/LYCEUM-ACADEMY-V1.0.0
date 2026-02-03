import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Printer, X, Receipt, FileText } from 'lucide-react';
import type { AccountingTransaction, Contact } from '../types';

interface TransactionPrintViewProps {
    transaction: AccountingTransaction;
    contact?: Contact;
    onClose: () => void;
}

type PrintFormat = 'a4' | 'thermal';

// Helper to portal print content to body
const PrintPortal = ({ children }: { children: React.ReactNode }) => {
    const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

    useEffect(() => {
        // Create print container
        const div = document.createElement('div');
        div.id = 'print-root';
        div.className = 'print-portal-container';
        div.style.position = 'absolute';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = '100%';
        div.style.zIndex = '99999';
        document.body.appendChild(div);
        setMountNode(div);

        return () => {
            document.body.removeChild(div);
        };
    }, []);

    if (!mountNode) return null;

    return ReactDOM.createPortal(children, mountNode);
};

const ReceiptContent: React.FC<{
    transaction: AccountingTransaction;
    contact?: Contact;
    format: PrintFormat;
    formatCurrency: (amount: number) => string;
    formatDate: (date: string) => string;
}> = ({ transaction, contact, format, formatCurrency, formatDate }) => {
    return (
        <div id="print-content" className={`bg-white relative text-gray-900 font-sans ${format === 'thermal' ? 'p-4 max-w-[80mm] mx-auto' : 'p-8 max-w-4xl mx-auto'}`}>
            {format === 'a4' ? (
                <>
                    {/* decorative top bar */}
                    <div className="h-1.5 w-full bg-lyceum-blue mb-6"></div>

                    {/* Top Header Section */}
                    <div className="flex justify-between items-start mb-8">
                        {/* Company Logo & Name */}
                        <div className="flex flex-col">
                            <img src="/logo.png" alt="Lyceum Academy" className="h-14 w-auto object-contain mb-3 select-none" />
                            <h1 className="text-xl font-bold text-lyceum-blue tracking-tight">LYCEUM ACADEMY</h1>
                            <p className="text-xs text-gray-600 font-medium">Creative Learning</p>
                        </div>

                        {/* Invoice Meta */}
                        <div className="text-right">
                            <h2 className="text-3xl font-light text-gray-800 uppercase tracking-widest mb-3">
                                {transaction.type === 'Income' ? 'INVOICE' : 'RECEIPT'}
                            </h2>
                            <div className="space-y-0.5">
                                <p className="text-xs text-gray-500 font-medium">Reference No.</p>
                                <p className="text-base font-bold text-gray-900 mb-1">{transaction.id}</p>
                                <p className="text-xs text-gray-500 font-medium">Date</p>
                                <p className="text-base font-bold text-gray-900">{formatDate(transaction.date)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-b border-gray-200 mb-8 opacity-50"></div>

                    {/* Addresses Grid */}
                    <div className="grid grid-cols-2 gap-12 mb-8">
                        {/* From */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">From</h3>
                            <div className="text-gray-800 font-medium leading-relaxed">
                                <p className="text-lg font-bold text-lyceum-blue mb-1">Lyceum Academy</p>
                                <p>Opp. HP petrol pump, Falaknuma,</p>
                                <p>Hyderabad 500053</p>
                                <p className="mt-2 text-sm text-gray-600">
                                    <span className="font-semibold">Email:</span> omar@lyceumacad.com<br />
                                    <span className="font-semibold">Phone:</span> +91 7893078791
                                </p>
                            </div>
                        </div>

                        {/* To */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                {transaction.type === 'Income' ? 'Bill To' : 'Vendor'}
                            </h3>
                            <div className="text-gray-800 font-medium leading-relaxed">
                                <p className="text-lg font-bold text-gray-900 mb-1">{transaction.customerName}</p>
                                {contact ? (
                                    <>
                                        {contact.organization && <p>{contact.organization}</p>}
                                        {contact.street1 && <p>{contact.street1}</p>}
                                        {(contact.city || contact.state) && (
                                            <p>{contact.city}{contact.city && contact.state && ', '}{contact.state} {contact.zip}</p>
                                        )}
                                        {contact.email && <div className="mt-2 text-sm text-gray-600"><span className="font-semibold">Email:</span> {contact.email}</div>}
                                        {contact.phone && <div className="text-sm text-gray-600"><span className="font-semibold">Phone:</span> {contact.phone}</div>}
                                    </>
                                ) : (
                                    <p className="text-gray-500 italic">No additional contact details available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="mb-8">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-y border-gray-200">
                                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="py-3 px-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-800">
                                <tr className="border-b border-gray-100">
                                    <td className="py-4 px-4 align-top">
                                        <p className="font-medium text-base mb-1">
                                            {transaction.description || `${transaction.type} Transaction`}
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            Payment Method: {transaction.paymentMethod || 'N/A'}
                                        </p>
                                    </td>
                                    <td className="py-4 px-4 text-right align-top font-medium text-base">
                                        {formatCurrency(transaction.amount)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="flex justify-end mb-10">
                        <div className="w-64 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex justify-between mb-3 text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(Number(transaction.amount || 0) + Number(transaction.additionalDiscount || 0))}</span>
                            </div>
                            {transaction.additionalDiscount ? (
                                <div className="flex justify-between mb-3 text-sm text-red-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(transaction.additionalDiscount)}</span>
                                </div>
                            ) : null}
                            <div className="flex justify-between mb-4 text-sm text-gray-600">
                                <span>Tax (0%)</span>
                                <span>₹0.00</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total</span>
                                <span className="font-bold text-2xl text-lyceum-blue">
                                    {formatCurrency(transaction.amount)}
                                </span>
                            </div>
                            {/* Status Stamp */}
                            <div className="mt-4 text-right">
                                <span className={`
                                    inline-block px-3 py-1 text-xs font-bold uppercase rounded-full border
                                    ${transaction.status === 'Paid' ? 'bg-green-50 text-green-600 border-green-200' : ''}
                                    ${transaction.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : ''}
                                    ${transaction.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-200' : ''}
                                `}>
                                    {transaction.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Signature Section */}
                    {transaction.status === 'Paid' && (
                        <div className="flex justify-between items-end mt-4 mb-4">
                            <div className="text-xs text-gray-400 max-w-sm">
                                <div className="border border-red-500 text-red-500 bg-red-50 px-4 py-2 rounded mb-3 text-[10px] font-medium leading-relaxed">
                                    <p className="font-bold mb-1">TERMS & CONDITIONS:</p>
                                    <p className="mb-1">1. All the payments made to Lyceum Academy are non-refundable under any circumstances.</p>
                                    <p className="mb-1">2. By purchasing services, you agree to be bound by the current terms and conditions available at lyceumacad.com/terms-conditions.</p>
                                    <p>3. Lyceum Academy may cancel services if payments are delayed or terms are violated.</p>
                                </div>
                                <p>This is a computer-generated document. No signature is required.</p>
                            </div>
                            <div className="text-center w-48">
                                <div className="h-12 mb-2 font-handwriting text-2xl text-lyceum-blue opacity-80">
                                    Lyceum Academy
                                </div>
                                <div className="border-t border-gray-300 pt-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Authorized Signature</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center font-mono text-sm">
                    {/* Thermal Layout */}
                    <div className="flex flex-col items-center mb-4">
                        <img src="/logo.png" alt="Logo" className="h-12 w-auto mb-2 grayscale" />
                        <h2 className="font-bold text-base uppercase">Lyceum Academy</h2>
                        <p className="text-[10px] text-gray-600">Opp. HP petrol pump, Falaknuma, Hyderabad 500053</p>
                        <p className="text-[10px] text-gray-600">Ph: +91 7893078791</p>
                    </div>

                    <div className="border-b border-black border-dashed my-2"></div>

                    {/* Transaction Info */}
                    <div className="text-left mb-2">
                        <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="font-bold uppercase">{transaction.type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Ref:</span>
                            <span>{transaction.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Date:</span>
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="border-b border-black border-dashed my-2"></div>

                    {/* Bill To */}
                    <div className="text-left mb-2">
                        <p className="text-[10px] uppercase text-gray-500">Bill To:</p>
                        <p className="font-bold text-sm truncate">{transaction.customerName}</p>
                        {contact?.phone && <p className="text-[10px]">Ph: {contact.phone}</p>}
                    </div>

                    <div className="border-b border-black border-dashed my-2"></div>

                    {/* Items */}
                    <div className="text-left mb-4">
                        <div className="mb-2">
                            <p className="font-semibold">{transaction.description || 'Service/Product'}</p>
                            <div className="flex justify-between text-xs mt-1">
                                <span>1 x {formatCurrency(transaction.amount)}</span>
                                <span className="font-bold">{formatCurrency(transaction.amount)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-black border-dashed my-2"></div>

                    {/* Totals */}
                    <div className="text-right">
                        {transaction.additionalDiscount ? (
                            <>
                                <div className="flex justify-between text-xs">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(Number(transaction.amount || 0) + Number(transaction.additionalDiscount || 0))}</span>
                                </div>
                                <div className="flex justify-between text-xs text-red-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(transaction.additionalDiscount)}</span>
                                </div>
                                <div className="border-t border-black border-dashed my-1"></div>
                            </>
                        ) : null}
                        <div className="flex justify-between font-bold text-base">
                            <span>TOTAL</span>
                            <span>{formatCurrency(transaction.amount)}</span>
                        </div>
                        <p className="text-[10px] mt-1 text-gray-600">Paid via {transaction.paymentMethod || 'Cash'}</p>
                    </div>

                    <div className="border-b border-black border-dashed my-4"></div>

                    {/* Footer */}
                    <div className="text-center text-[10px]">
                        <p>Thank you!</p>
                        <p className="mt-1">Computer Generated Receipt</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const TransactionPrintView: React.FC<TransactionPrintViewProps> = ({ transaction, contact, onClose }) => {
    const [format, setFormat] = useState<PrintFormat>('a4');

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

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; size: auto; }
                    html, body { 
                        height: auto !important; 
                        overflow: visible !important; 
                        margin: 0 !important; 
                        background: white !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                    body > *:not(.print-portal-container) { 
                        visibility: hidden !important;
                        display: none !important;
                    }
                    .print-portal-container, .print-portal-container * { 
                        visibility: visible !important; 
                    }
                    .print-portal-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                        background: white !important;
                        z-index: 99999 !important;
                        transform: scale(0.98) !important;
                        transform-origin: top center !important;
                    }
                    .no-print { 
                        display: none !important; 
                    }
                }
            `}} />

            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity no-print">
                <div className={`bg-white rounded-lg shadow-2xl w-full max-h-[90vh] overflow-y-auto ${format === 'thermal' ? 'max-w-md' : 'max-w-4xl'}`}>
                    {/* Toolbar - No Print */}
                    <div className="no-print sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between z-10 gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold text-gray-900">Print Preview</h2>

                            {/* Format Toggle */}
                            <div className="bg-gray-200 p-1 rounded-lg flex items-center">
                                <button
                                    onClick={() => setFormat('a4')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${format === 'a4'
                                        ? 'bg-white text-lyceum-blue shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <FileText size={16} />
                                    Standard (A4)
                                </button>
                                <button
                                    onClick={() => setFormat('thermal')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${format === 'thermal'
                                        ? 'bg-white text-lyceum-blue shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Receipt size={16} />
                                    Thermal
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm flex items-center gap-2"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-5 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark font-medium transition-colors shadow-md flex items-center gap-2"
                            >
                                <Printer size={16} />
                                Print
                            </button>
                        </div>
                    </div>

                    {/* Preview Content */}
                    <ReceiptContent
                        transaction={transaction}
                        contact={contact}
                        format={format}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                    />
                </div>
            </div>

            {/* Print Portal - Content only for printing */}
            <PrintPortal>
                <div className="print-portal-content">
                    <ReceiptContent
                        transaction={transaction}
                        contact={contact}
                        format={format}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                    />
                </div>
            </PrintPortal>
        </>
    );
};

export default TransactionPrintView;
