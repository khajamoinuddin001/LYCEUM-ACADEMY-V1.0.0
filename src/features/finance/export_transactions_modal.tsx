import React, { useState } from 'react';
import { X, Calendar, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { AccountingTransaction } from '@/types';

interface ExportTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: AccountingTransaction[];
}

const ExportTransactionsModal: React.FC<ExportTransactionsModalProps> = ({ isOpen, onClose, transactions }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen) return null;

    const handleExport = () => {
        setIsExporting(true);
        try {
            // Filter transactions by date range
            let filtered = transactions;
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                filtered = filtered.filter(t => {
                    const d = new Date(t.date);
                    return d >= start;
                });
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filtered = filtered.filter(t => {
                    const d = new Date(t.date);
                    return d <= end;
                });
            }

            if (filtered.length === 0) {
                alert('No transactions found for the selected date range.');
                setIsExporting(false);
                return;
            }

            // Prepare data for Excel
            const exportData = filtered.map(t => {
                const d = new Date(t.date);
                const dateStr = isNaN(d.getTime()) ? (t.date || '-') : d.toLocaleDateString();
                
                const dueDate = t.dueDate ? new Date(t.dueDate) : null;
                const dueDateStr = (dueDate && !isNaN(dueDate.getTime())) ? dueDate.toLocaleDateString() : '-';

                // Calculate discounts
                const itemDiscount = (t.lineItems || []).reduce((acc: number, item: any) => acc + (Number(item.discount) || 0), 0);
                const addtlDiscount = Number(t.additionalDiscount) || 0;
                const totalDiscount = itemDiscount + addtlDiscount;
                
                // For AR entries (Due type), t.amount is usually the balance
                // For Invoices/Income, t.amount is the received amount
                const amount = Number(t.amount) || 0;
                const totalAmount = Number(t.totalAmount) || amount; 
                const paidAmount = t.type === 'Due' ? (totalAmount - amount) : (t.status === 'Paid' ? amount : 0);

                return {
                    'Invoice/Ref': t.invoiceNumber || t.id || '-',
                    'Date': dateStr,
                    'Customer/Client': t.customerName || t.contact || '-',
                    'Description': t.description || '-',
                    'Type': t.type || '-',
                    'Status': t.status || '-',
                    'Payment Method': t.paymentMethod || '-',
                    'Subtotal': totalAmount + totalDiscount,
                    'Line Item Discount': itemDiscount,
                    'Additional Discount': addtlDiscount,
                    'Total Discount': totalDiscount,
                    'Net Amount': totalAmount,
                    'Paid Amount': paidAmount,
                    'Remaining Balance': t.type === 'Due' ? amount : (t.status === 'Paid' ? 0 : amount),
                    'Due Date': dueDateStr
                };
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);
            
            // Set column widths
            const wscols = [
                { wch: 20 }, // Invoice/Ref
                { wch: 15 }, // Date
                { wch: 25 }, // Customer/Client
                { wch: 35 }, // Description
                { wch: 12 }, // Type
                { wch: 12 }, // Status
                { wch: 15 }, // Payment Method
                { wch: 15 }, // Subtotal
                { wch: 15 }, // Line Item Discount
                { wch: 15 }, // Additional Discount
                { wch: 15 }, // Total Discount
                { wch: 15 }, // Net Amount
                { wch: 15 }, // Paid Amount
                { wch: 15 }, // Remaining Balance
                { wch: 15 }, // Due Date
            ];
            ws['!cols'] = wscols;

            // Create workbook and append worksheet
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Transactions");

            // Generate filename
            const dateRange = startDate && endDate ? `${startDate}_to_${endDate}` : 'all_time';
            const filename = `Transactions_${dateRange}.xlsx`;

            // Export file
            XLSX.writeFile(wb, filename);
            onClose();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export transactions. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                            <FileSpreadsheet className="text-white" size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Export to Excel</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Select a date range to export your transactions. Leaving dates empty will export all transactions.
                    </p>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Calendar size={14} className="text-blue-500" />
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Calendar size={14} className="text-blue-500" />
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    <span>Export Excel</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportTransactionsModal;
