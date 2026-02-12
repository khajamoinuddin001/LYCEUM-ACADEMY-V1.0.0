import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, Search, User } from 'lucide-react';
import type { Contact, LmsCourse } from '@/types';

interface ManualEnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEnroll: (data: {
        contactId: string;
        generateInvoice: boolean;
        markAsPaid: boolean;
        paymentMethod: string;
        price: number;
    }) => Promise<void>;
    contacts: Contact[];
    course: LmsCourse;
}

const ManualEnrollmentModal: React.FC<ManualEnrollmentModalProps> = ({
    isOpen,
    onClose,
    onEnroll,
    contacts,
    course
}) => {
    const [selectedContactId, setSelectedContactId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [generateInvoice, setGenerateInvoice] = useState(true);
    const [markAsPaid, setMarkAsPaid] = useState(false);
    const [overridePrice, setOverridePrice] = useState(course.price?.toString() || '0');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const filteredContacts = useMemo(() => {
        return contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.phone?.includes(searchTerm)
        ).slice(0, 50); // Limit results for performance
    }, [contacts, searchTerm]);

    const handleEnroll = async () => {
        if (!selectedContactId) {
            setError('Please select a student.');
            return;
        }

        const price = parseFloat(overridePrice);
        if (isNaN(price) || price < 0) {
            setError('Please enter a valid price.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onEnroll({
                contactId: selectedContactId,
                generateInvoice,
                markAsPaid: generateInvoice ? markAsPaid : false,
                paymentMethod: generateInvoice && markAsPaid ? paymentMethod : '',
                price
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to enroll student.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Enroll Student</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Student Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Select Student
                        </label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lyceum-blue"
                                placeholder="Search student by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {searchTerm && (
                            <ul className="mt-1 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 absolute w-full z-10 shadow-lg left-0">
                                {filteredContacts.map(contact => (
                                    <li
                                        key={contact.id}
                                        onClick={() => {
                                            setSelectedContactId(contact.id);
                                            setSearchTerm(contact.name);
                                        }}
                                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${selectedContactId === contact.id ? 'bg-lyceum-blue/10' : ''}`}
                                    >
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-2">
                                                <User size={14} className="text-gray-500 dark:text-gray-300" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{contact.email}</p>
                                            </div>
                                        </div>
                                        {selectedContactId === contact.id && (
                                            <CheckCircle2 size={16} className="text-lyceum-blue" />
                                        )}
                                    </li>
                                ))}
                                {filteredContacts.length === 0 && (
                                    <li className="px-3 py-2 text-sm text-gray-500 text-center">No students found</li>
                                )}
                            </ul>
                        )}
                    </div>

                    {/* Price Override */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Course Price
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input
                                type="number"
                                value={overridePrice}
                                onChange={(e) => setOverridePrice(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-lyceum-blue"
                            />
                        </div>
                    </div>

                    {/* Billing Options */}
                    <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <input
                                id="generate-invoice"
                                type="checkbox"
                                checked={generateInvoice}
                                onChange={(e) => setGenerateInvoice(e.target.checked)}
                                className="h-4 w-4 text-lyceum-blue focus:ring-lyceum-blue border-gray-300 rounded"
                            />
                            <label htmlFor="generate-invoice" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                                Generate Invoice
                            </label>
                        </div>

                        {generateInvoice && (
                            <div className="pl-6 space-y-3">
                                <div className="flex items-center">
                                    <input
                                        id="mark-paid"
                                        type="checkbox"
                                        checked={markAsPaid}
                                        onChange={(e) => setMarkAsPaid(e.target.checked)}
                                        className="h-4 w-4 text-lyceum-blue focus:ring-lyceum-blue border-gray-300 rounded"
                                    />
                                    <label htmlFor="mark-paid" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                                        Mark as Paid
                                    </label>
                                </div>

                                {markAsPaid && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Payment Method
                                        </label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-lyceum-blue"
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Online">Online</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="UPI">UPI</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900/10 rounded">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleEnroll}
                        className="px-4 py-2 text-sm font-medium text-white bg-lyceum-blue rounded-md hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lyceum-blue disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Enrolling...' : 'Enroll Student'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualEnrollmentModal;
