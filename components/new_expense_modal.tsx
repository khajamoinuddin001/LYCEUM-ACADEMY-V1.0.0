import React, { useState, useEffect } from 'react';
import { X, UserPlus, Wallet } from 'lucide-react';
import * as api from '../utils/api';
import AddPayeeModal from './add_payee_modal';

interface NewExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: any) => Promise<void>;
}

const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
    isOpen,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState({
        payeeName: '',
        payeeId: undefined as number | undefined,
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        paymentMethod: 'Cash' as 'Cash' | 'Online',
        status: 'Paid' as 'Paid' | 'Pending' | 'Overdue',
        description: '',
        additionalDiscount: ''
    });

    const [payees, setPayees] = useState<api.ExpensePayee[]>([]);
    const [showAddPayee, setShowAddPayee] = useState(false);
    const [saving, setSaving] = useState(false);

    // Common categories for suggestion (can be expanded dynamically later)
    const categorySuggestions = [
        'Rent', 'Utilities', 'Salaries', 'Office Supplies',
        'Marketing', 'Travel', 'Maintenance', 'Insurance', 'Meals', 'Internet', 'General'
    ];

    useEffect(() => {
        if (isOpen) {
            loadPayees();
        }
    }, [isOpen]);

    const loadPayees = async () => {
        try {
            const data = await api.getExpensePayees();
            setPayees(data);
        } catch (error) {
            console.error('Failed to load payees:', error);
        }
    };

    const handlePayeeSelect = (name: string) => {
        const found = payees.find(p => p.name === name);
        if (found) {
            setFormData(prev => ({
                ...prev,
                payeeName: name,
                payeeId: found.id,
                // Auto-fill category if available
                category: found.default_category || prev.category
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                payeeName: name,
                payeeId: undefined
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.payeeName) {
            alert('Please select or enter a payee name');
            return;
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        setSaving(true);
        try {
            const finalAmount = Math.max(0, parseFloat(formData.amount) - (parseFloat(formData.additionalDiscount) || 0));

            const expense = {
                customerName: formData.payeeName, // Payee Name stored as customerName
                contactId: null, // Expenses don't link to contacts
                date: formData.date,
                type: 'Expense',
                amount: finalAmount,
                paymentMethod: formData.paymentMethod,
                status: formData.status,
                additionalDiscount: parseFloat(formData.additionalDiscount) || 0,
                // Combine category and description for the main description field
                description: formData.category
                    ? `${formData.category}: ${formData.description}`
                    : formData.description
            };

            await onSave(expense);
            onClose();

            // Reset form
            setFormData({
                payeeName: '',
                payeeId: undefined,
                date: new Date().toISOString().split('T')[0],
                category: '',
                amount: '',
                paymentMethod: 'Cash',
                status: 'Paid',
                description: ''
            });
        } catch (error) {
            console.error('Failed to create expense:', error);
            alert('Failed to create expense. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
                    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Wallet className="text-red-500" />
                            Record New Expense
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Vendor/Payee Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Payee / Vendor <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            list="payees-list"
                                            value={formData.payeeName}
                                            onChange={(e) => handlePayeeSelect(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="Select or type payee..."
                                            autoComplete="off"
                                            required
                                        />
                                        <datalist id="payees-list">
                                            {payees.map(p => (
                                                <option key={p.id} value={p.name} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddPayee(true)}
                                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                                        title="Add New Payee"
                                    >
                                        <UserPlus size={20} />
                                    </button>
                                </div>
                            </div>

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
                        </div>

                        {/* Category and Amount */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    list="category-list"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="e.g. Utilities"
                                />
                                <datalist id="category-list">
                                    {categorySuggestions.map(cat => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Amount (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-bold"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        {/* Payment Method & Discount */}
                        <div className="grid grid-cols-2 gap-4">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Additional Discount
                                </label>
                                <div className="flex gap-2 items-center">
                                    <span className="text-gray-500 text-sm">-₹</span>
                                    <input
                                        type="number"
                                        value={formData.additionalDiscount}
                                        onChange={(e) => setFormData({ ...formData, additionalDiscount: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>



                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
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
                                Description/Notes
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                                rows={3}
                                placeholder="Enter details..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold shadow-lg shadow-red-500/30"
                            >
                                {saving ? 'Recording...' : 'Record Expense'}
                            </button>
                        </div>
                    </form >
                </div >
            </div >

            <AddPayeeModal
                isOpen={showAddPayee}
                onClose={() => setShowAddPayee(false)}
                onSave={(newPayee) => {
                    setPayees([...payees, newPayee]);
                    setFormData(prev => ({
                        ...prev,
                        payeeName: newPayee.name,
                        payeeId: newPayee.id,
                        category: newPayee.default_category || prev.category
                    }));
                }}
            />
        </>
    );
};

export default NewExpenseModal;
