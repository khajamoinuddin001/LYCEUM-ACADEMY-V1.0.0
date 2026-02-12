import React, { useState } from 'react';
import { FileText, Calendar, IndianRupee, Eye, Download, Check, AlertCircle } from 'lucide-react';
import type { Contact, Quotation } from '@/types';
import * as api from '@/utils/api';
import QuotationDetailsModal from '@/features/finance/quotation_details_modal';

interface StudentQuotationsViewProps {
    student: Contact;
    quotations?: Quotation[];
}

const StudentQuotationsView: React.FC<StudentQuotationsViewProps> = ({ student, quotations }) => {
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);

    // Use passed quotations if available, otherwise fall back to student.quotations
    const sourceQuotations = quotations || student.quotations || [];

    // Show all quotations except Rejected
    const visibleQuotations = sourceQuotations.filter(
        q => q.status !== 'Rejected'
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
            await api.acceptQuotation(Number(quotation.id));

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
        // Re-use the modal's internal logic or instantiate it temporarily?
        // Ideally we should move the generatePDFHTML to a util or just open the modal.
        // For now, let's just open the modal and let user download from there, or duplicate logic.
        // Simplest: Set selectedQuotation and let user click download inside (or auto click inside modal?)
        // Better: Since we extracted logic to Modal, let's just show the modal for now when clicking download?
        // Or duplicate the helper function? Let's assume user clicks View Details then Download.
        // But the button is on the card...
        // Let's just open the details modal for now as a quick fix or implement generatePDF in a util.
        setSelectedQuotation(quotation);
        // Note: The previous implementation had PDF generation logic inline.
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
                                        onClick={() => setSelectedQuotation(quotation)}
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
                    <QuotationDetailsModal
                        quotation={selectedQuotation}
                        student={student}
                        onClose={() => setSelectedQuotation(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default StudentQuotationsView;
