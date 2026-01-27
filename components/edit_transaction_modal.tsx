import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AccountingTransaction, Contact } from '../types';

interface EditTransactionModalProps {
    transaction: AccountingTransaction;
    contacts: Contact[];
    onClose: () => void;
    onSave: (id: string, updates: Partial<AccountingTransaction>) => Promise<void>;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    transaction,
    contacts,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState({
        contactId: transaction.contactId || 0,
        customerName: transaction.customerName || '',
        contact: transaction.contact || '', // This maps to "Client (Entity)"
        date: transaction.date || new Date().toISOString().split('T')[0],
        amount: transaction.amount || 0,
        description: transaction.description || '',
        status: transaction.status || 'Pending',
        paymentMethod: transaction.paymentMethod || 'Cash',
        dueDate: transaction.dueDate || ''
    });
    const [saving, setSaving] = useState(false);

    // Initial load ensures contactId is set even if not passed directly if we can match customerName
    useEffect(() => {
        if (!formData.contactId && transaction.customerName) {
            const matchedContact = contacts.find(c => c.name === transaction.customerName);
            if (matchedContact) {
                setFormData(prev => ({
                    ...prev,
                    contactId: matchedContact.id
                }));
            }
        }
    }, [transaction.customerName, contacts, formData.contactId]);

    // Filter contacts based on transaction type
    const filteredContacts = contacts.filter(c => {
        if (transaction.type === 'Income') {
            return !c.contactType || c.contactType === 'Customer' || c.contactType === 'Both';
        } else {
            return !c.contactType || c.contactType === 'Vendor' || c.contactType === 'Both';
        }
    });

    const handleContactChange = (contactIdStr: string) => {
        const newContactId = parseInt(contactIdStr);
        const contact = contacts.find(c => c.id === newContactId);

        if (contact) {
            setFormData({
                ...formData,
                contactId: newContactId,
                customerName: contact.name,
                contact: contact.companyName || contact.department || '' // Auto-fill Client Entity if available
            });
        } else {
            setFormData({
                ...formData,
                contactId: 0,
                customerName: ''
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(transaction.id, {
                ...formData,
                type: transaction.type
            });
            onClose();
        } catch (error) {
            console.error('Failed to update transaction:', error);
            alert('Failed to update transaction. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Edit {transaction.type}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Customer Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {transaction.type === 'Income' ? 'Customer' : 'Vendor'} Name <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.contactId}
                            onChange={(e) => handleContactChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        >
                            <option value={0}>Select {transaction.type === 'Income' ? 'Customer' : 'Vendor'}...</option>
                            {filteredContacts.map(contact => (
                                <option key={contact.id} value={contact.id}>
                                    {contact.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Client (Entity) Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Client (Entity)
                        </label>
                        <input
                            type="text"
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Company or Entity Name"
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Amount (₹)
                        </label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    {/* Payment Method (for non-Transfer types) */}
                    {transaction.type !== 'Transfer' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Payment Method
                            </label>
                            <select
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'Cash' | 'Online' })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Online">Online/Bank</option>
                            </select>
                        </div>
                    )}

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Paid' | 'Pending' | 'Overdue' })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            rows={3}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTransactionModal;
