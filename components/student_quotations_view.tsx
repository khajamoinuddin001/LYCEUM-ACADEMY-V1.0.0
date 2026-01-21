import React, { useState } from 'react';
import { FileText, Calendar, IndianRupee, Eye, X, Download, Check, AlertCircle } from 'lucide-react';
import type { Contact, Quotation } from '../types';
import * as api from '../utils/api';

interface StudentQuotationsViewProps {
    student: Contact;
}

const StudentQuotationsView: React.FC<StudentQuotationsViewProps> = ({ student }) => {
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);

    // Filter out Draft quotations - students only see In Review and Agreed
    const visibleQuotations = (student.quotations || []).filter(
        q => q.status !== 'Draft' && q.status !== 'Rejected'
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Review':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Accepted by Student':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Agreed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

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

    const handleAcceptQuotation = async (quotation: Quotation) => {
        if (!window.confirm('Are you sure you want to accept this quotation?')) {
            return;
        }

        setIsAccepting(true);
        try {
            // Call API to accept quotation
            await api.acceptQuotation(quotation.id);

            // Refresh page or update state
            window.location.reload();
        } catch (error) {
            console.error('Error accepting quotation:', error);
            alert('Failed to accept quotation. Please try again.');
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDownloadPDF = (quotation: Quotation) => {
        // Trigger print which can be saved as PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(generatePDFHTML(quotation));
            printWindow.document.close();
            printWindow.print();
        }
    };

    const generatePDFHTML = (quotation: Quotation) => {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation ${quotation.quotationNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { border-bottom: 3px solid #1C355E; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { color: #1C355E; font-size: 24px; font-weight: bold; }
          .quotation-number { font-size: 28px; font-weight: bold; color: #1C355E; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #1C355E; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total { background: #1C355E; color: white; padding: 15px; font-size: 20px; font-weight: bold; text-align: right; }
          .terms { margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Maverick Overseas | Lyceum Academy</div>
          <div style="font-size: 12px; color: #666;">#Shaping Future</div>
          <div class="quotation-number">Quotation # ${quotation.quotationNumber || 'DRAFT'}</div>
        </div>
        
        <div style="margin: 30px 0;">
          <p><strong>Prepared For:</strong> ${student.name}</p>
          <p><strong>Date:</strong> ${formatDate(quotation.date)}</p>
        </div>

        <h3>${quotation.title}</h3>
        <p>${quotation.description || ''}</p>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.lineItems.map(item => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align: right;">${formatCurrency(item.price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          Total: ${formatCurrency(quotation.total)}
        </div>

        <div class="terms">
          <h4>Terms & Conditions</h4>
          <p>1. This quotation is valid for 30 days from the date of issue.</p>
          <p>2. Payment terms as per agreement.</p>
          <p>3. All services subject to our standard terms and conditions.</p>
          <p>4. For full terms, visit: https://www.maverickoverseas.in/terms-conditions</p>
          
          <h4 style="margin-top: 20px;">Privacy Policy</h4>
          <p>Your privacy is important to us. We handle your data as per our privacy policy.</p>
          <p>For details, visit: https://www.maverickoverseas.in/privacy-policy</p>
          
          <div style="margin-top: 30px; text-align: center;">
            <p>omar@lyceumacad.com | support@lyceumacad.com</p>
            <p>www.maverickoverseas.in | www.lyceumacad.com | 78930 78791</p>
          </div>
        </div>
      </body>
      </html>
    `;
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        My Quotations
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        View and accept quotations created for you
                    </p>
                </div>

                {/* Quotations List */}
                {visibleQuotations.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No quotations yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Your quotations will appear here once they are shared with you
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleQuotations.map((quotation) => (
                            <div
                                key={quotation.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                            >
                                {/* Reference Number */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <FileText className="text-lyceum-blue mr-2" size={20} />
                                        <span className="font-bold text-lyceum-blue">
                                            {quotation.quotationNumber || `#${quotation.id}`}
                                        </span>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                                        {quotation.status}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {quotation.title}
                                </h3>

                                {/* Description */}
                                {quotation.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                        {quotation.description}
                                    </p>
                                )}

                                {/* Date */}
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    <Calendar size={14} className="mr-1" />
                                    {formatDate(quotation.date)}
                                </div>

                                {/* Total */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mb-4">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                                    <span className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center">
                                        <IndianRupee size={18} className="mr-1" />
                                        {quotation.total.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                {/* Waiting Badge */}
                                {quotation.status === 'Accepted by Student' && (
                                    <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center text-xs text-yellow-800 dark:text-yellow-200">
                                        <AlertCircle size={14} className="mr-2" />
                                        Awaiting approval from staff
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedQuotation(quotation)}
                                        className="w-full flex items-center justify-center px-4 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-colors"
                                    >
                                        <Eye size={16} className="mr-2" />
                                        View Details
                                    </button>

                                    <button
                                        onClick={() => handleDownloadPDF(quotation)}
                                        className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <Download size={16} className="mr-2" />
                                        Download PDF
                                    </button>

                                    {quotation.status === 'In Review' && (
                                        <button
                                            onClick={() => handleAcceptQuotation(quotation)}
                                            disabled={isAccepting}
                                            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Check size={16} className="mr-2" />
                                            {isAccepting ? 'Accepting...' : 'Accept Quotation'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                {selectedQuotation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedQuotation.quotationNumber || `Quotation #${selectedQuotation.id}`}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {selectedQuotation.title}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedQuotation(null)}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                {/* Status and Date */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                        <Calendar size={16} className="mr-2 text-gray-500" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatDate(selectedQuotation.date)}
                                        </span>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedQuotation.status)}`}>
                                        {selectedQuotation.status}
                                    </span>
                                </div>

                                {/* Description */}
                                {selectedQuotation.description && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Description
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {selectedQuotation.description}
                                        </p>
                                    </div>
                                )}

                                {/* Line Items */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Items
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-100 dark:bg-gray-800">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                        Description
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                        Price
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {selectedQuotation.lineItems.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                            {item.description}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                            {formatCurrency(item.price)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="bg-lyceum-blue text-white rounded-lg p-4 flex items-center justify-between">
                                    <span className="text-lg font-semibold">Total Amount</span>
                                    <span className="text-2xl font-bold flex items-center">
                                        <IndianRupee size={24} className="mr-1" />
                                        {selectedQuotation.total.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                {/* Terms & Conditions */}
                                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                                    <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>This quotation is valid for 30 days from the date of issue</li>
                                        <li>Payment terms as per agreement</li>
                                        <li>All services subject to our standard terms and conditions</li>
                                        <li>For full terms, visit: <a href="https://www.maverickoverseas.in/terms-conditions" className="text-lyceum-blue">Terms & Conditions</a></li>
                                    </ul>
                                    <h4 className="font-semibold mt-3 mb-2">Privacy Policy</h4>
                                    <p>Your privacy is important to us. For details, visit: <a href="https://www.maverickoverseas.in/privacy-policy" className="text-lyceum-blue">Privacy Policy</a></p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between">
                                <button
                                    onClick={() => handleDownloadPDF(selectedQuotation)}
                                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
                                >
                                    <Download size={16} className="mr-2" />
                                    Download PDF
                                </button>
                                <div className="flex space-x-2">
                                    {selectedQuotation.status === 'In Review' && (
                                        <button
                                            onClick={() => handleAcceptQuotation(selectedQuotation)}
                                            disabled={isAccepting}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                                        >
                                            <Check size={16} className="mr-2" />
                                            {isAccepting ? 'Accepting...' : 'Accept'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedQuotation(null)}
                                        className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentQuotationsView;
