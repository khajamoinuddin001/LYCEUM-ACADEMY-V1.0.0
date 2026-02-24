import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User } from 'lucide-react';
import type { AccountingTransaction, Contact } from '@/types';

interface EditTransactionModalProps {
    transaction: AccountingTransaction;
    contacts: Contact[];
    onClose: () => void;
    onSave: (id: string, updates: Partial<AccountingTransaction>) => Promise<void>;
}

interface LineItem {
    description: string;
    longDescription?: string;
    quantity: number;
    rate: number;
    amount: number;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    transaction,
    contacts,
    onClose,
    onSave
}) => {
    const initialLineItems: LineItem[] = transaction.lineItems?.length
        ? transaction.lineItems.map((item: any) => ({
            description: item.description || '',
            longDescription: item.longDescription || '',
            quantity: item.quantity || 1,
            rate: item.rate !== undefined ? item.rate : (item.price || 0),
            amount: item.amount !== undefined ? item.amount : ((item.quantity || 1) * (item.rate !== undefined ? item.rate : (item.price || 0)))
        }))
        : [{
            description: transaction.description || '',
            longDescription: '',
            quantity: 1,
            rate: transaction.amount || 0,
            amount: transaction.amount || 0
        }];

    const [formData, setFormData] = useState({
        contactId: transaction.contactId?.toString() || '',
        customerName: transaction.customerName || '',
        email: '',
        phone: '',
        date: transaction.date || new Date().toISOString().split('T')[0],
        dueDate: transaction.dueDate || '',
        paymentMethod: transaction.paymentMethod || 'Cash',
        status: transaction.status || 'Pending',
        additionalDiscount: transaction.additionalDiscount || 0
    });

    const [lineItems, setLineItems] = useState<LineItem[]>(initialLineItems);
    const [saving, setSaving] = useState(false);

    // Initial load ensures contactId/details are set properly
    useEffect(() => {
        let matchedContact;
        if (transaction.contactId) {
            matchedContact = contacts.find(c => c.id === transaction.contactId);
        } else if (transaction.customerName) {
            matchedContact = contacts.find(c => c.name === transaction.customerName);
        }

        if (matchedContact) {
            setFormData(prev => ({
                ...prev,
                contactId: matchedContact.id.toString(),
                customerName: matchedContact.name,
                email: matchedContact.email || '',
                phone: matchedContact.phone || ''
            }));
        }
    }, [transaction, contacts]);

    // Filter contacts based on transaction type
    const filteredContacts = contacts.filter(c => {
        if (c.id === transaction.contactId) return true;
        if (['Income', 'Invoice', 'Due'].includes(transaction.type)) {
            return !c.contactType || c.contactType === 'Customer' || c.contactType === 'Both';
        } else {
            return !c.contactType || c.contactType === 'Vendor' || c.contactType === 'Both';
        }
    });

    const handleCustomerNameChange = (name: string) => {
        const newState = { ...formData, customerName: name };
        const found = filteredContacts.find(c => c.name.toLowerCase() === name.toLowerCase());

        if (found) {
            newState.contactId = found.id.toString();
            newState.email = found.email || '';
            newState.phone = found.phone || '';
        } else {
            newState.contactId = '';
            newState.email = '';
            newState.phone = '';
        }
        setFormData(newState);
    };

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const total = Math.max(0, subtotal - (parseFloat(formData.additionalDiscount.toString()) || 0));

    const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };

        if (field === 'quantity' || field === 'rate') {
            updated[index].amount = (updated[index].quantity || 0) * (updated[index].rate || 0);
        }
        setLineItems(updated);
    };

    const addLineItem = () => {
        setLineItems([...lineItems, { description: '', longDescription: '', quantity: 1, rate: 0, amount: 0 }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerName) {
            alert('Please enter a customer/vendor name');
            return;
        }

        if (lineItems.every(item => !item.description.trim())) {
            alert('Please add at least one line item');
            return;
        }

        setSaving(true);
        try {
            const updatedDescription = lineItems
                .filter(item => item.description.trim())
                .map(item => {
                    let desc = `${item.description} (${item.quantity} × ₹${item.rate})`;
                    if (item.longDescription?.trim()) {
                        desc += ` - ${item.longDescription.trim()}`;
                    }
                    return desc;
                })
                .join(', ');

            await onSave(transaction.id, {
                contactId: formData.contactId ? parseInt(formData.contactId) : undefined,
                customerName: formData.customerName,
                date: formData.date,
                dueDate: formData.dueDate || formData.date,
                amount: total,
                paymentMethod: formData.paymentMethod as any,
                status: formData.status as any,
                additionalDiscount: parseFloat(formData.additionalDiscount?.toString() || '0'),
                description: updatedDescription,
                lineItems: lineItems
            });
            onClose();
        } catch (error) {
            console.error('Failed to update transaction:', error);
            alert('Failed to update transaction. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const isClientRole = ['Income', 'Invoice', 'Due'].includes(transaction.type);
    const clientRoleText = isClientRole ? 'Customer' : 'Vendor';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Edit {transaction.type === 'Due' ? 'Due' : transaction.type}
                        </h2>
                        {transaction.type === 'Due' && transaction.invoiceNumber && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Reference: Quotation #{transaction.invoiceNumber}
                            </p>
                        )}
                        {!transaction.invoiceNumber && transaction.description && transaction.type === 'Due' && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Reference: {transaction.description}
                            </p>
                        )}
                    </div>

                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Customer/Vendor Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {clientRoleText} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    list="customer-list"
                                    value={formData.customerName}
                                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pl-10"
                                    placeholder="Search or type name..."
                                    autoComplete="off"
                                    required
                                />
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <datalist id="customer-list">
                                    {filteredContacts.map(c => (
                                        <option key={c.id} value={c.name} />
                                    ))}
                                </datalist>
                            </div>
                            {(formData.email || formData.phone) && (
                                <div className="mt-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-600">
                                    {formData.email && <div>✉️ {formData.email}</div>}
                                    {formData.phone && <div>📞 {formData.phone}</div>}
                                </div>
                            )}
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

                    <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Line Items
                            </label>
                            <button
                                type="button"
                                onClick={addLineItem}
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-2">
                            {lineItems.map((item, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Item Description"
                                            value={item.description}
                                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Add extra details..."
                                            value={item.longDescription || ''}
                                            onChange={(e) => updateLineItem(index, 'longDescription', e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800/50 focus:ring-1 focus:ring-blue-500 text-gray-600 dark:text-gray-400"
                                        />
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center"
                                        min="0"
                                        step="0.01"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Rate"
                                        value={item.rate}
                                        onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                        className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-right"
                                        min="0"
                                        step="0.01"
                                    />
                                    <div className="w-28 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-right font-medium">
                                        ₹{((item.amount !== undefined ? item.amount : (item.quantity * item.rate)) || 0).toFixed(2)}
                                    </div>
                                    {lineItems.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeLineItem(index)}
                                            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex justify-end space-y-2">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Additional Discount:</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500">-₹</span>
                                        <input
                                            type="number"
                                            value={formData.additionalDiscount}
                                            onChange={(e) => setFormData({ ...formData, additionalDiscount: e.target.value })}
                                            className="w-24 px-2 py-1 text-right text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                                    <span className="text-gray-900 dark:text-white">Total:</span>
                                    <span className="text-lyceum-blue">₹{total.toFixed(2)}</span>
                                </div>
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
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
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
                            className="flex-1 px-4 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold shadow-lg shadow-blue-500/30"
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
