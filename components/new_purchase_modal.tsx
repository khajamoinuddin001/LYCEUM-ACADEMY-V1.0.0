import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, Package, UserPlus } from 'lucide-react';
import * as api from '../utils/api';
import AddVendorModal from './add_vendor_modal';

interface LineItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}

interface NewPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (purchase: any) => Promise<void>;
    contacts?: any[]; // Added contacts prop
}

const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
    isOpen,
    onClose,
    onSave,
    contacts = [] // Default to empty array if not provided
}) => {
    const [relatedContactId, setRelatedContactId] = useState<number | undefined>(undefined);
    const [relatedContactName, setRelatedContactName] = useState('');
    const [formData, setFormData] = useState({
        vendorName: '',
        vendorId: undefined as number | undefined,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash' as 'Cash' | 'Online',
        status: 'paid' as 'Paid' | 'Pending' | 'Overdue',
        notes: ''
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    // Inventory & Vendor State
    const [vendors, setVendors] = useState<api.Vendor[]>([]);
    const [products, setProducts] = useState<api.Product[]>([]);
    const [showAddVendor, setShowAddVendor] = useState(false);

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            const [vData, pData] = await Promise.all([
                api.getVendors(),
                api.getProducts()
            ]);
            setVendors(vData);
            setProducts(pData);
        } catch (error) {
            console.error('Failed to load vendors/products:', error);
        }
    };

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal;

    const handleVendorSelect = (name: string) => {
        const found = vendors.find(v => v.name === name);
        setFormData({
            ...formData,
            vendorName: name,
            vendorId: found?.id
        });
    };

    const handleProductSelect = (index: number, productName: string) => {
        const product = products.find(p => p.name === productName);
        const updated = [...lineItems];
        updated[index] = {
            ...updated[index],
            description: productName,
            rate: product ? product.price : updated[index].rate,
            amount: updated[index].quantity * (product ? product.price : updated[index].rate)
        };
        setLineItems(updated);
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };

        if (field === 'quantity' || field === 'rate') {
            updated[index].amount = updated[index].quantity * updated[index].rate;
        }

        setLineItems(updated);
    };

    const addLineItem = () => {
        setLineItems([...lineItems, { description: '', quantity: 1, rate: 0, amount: 0 }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.vendorName) {
            alert('Please select or enter a vendor name');
            return;
        }

        if (lineItems.every(item => !item.description.trim())) {
            alert('Please add at least one line item');
            return;
        }

        setSaving(true);
        try {
            // Auto-save new products if they don't exist
            for (const item of lineItems) {
                if (item.description && !products.find(p => p.name === item.description)) {
                    // Optimistically save new product to inventory
                    await api.saveProduct({
                        name: item.description,
                        price: item.rate,
                        type: 'Goods'
                    });
                }
            }

            // Note: We use customerName to store Vendor Name for the Transaction record
            // We can optionally store vendorId in metadata if needed, but the transaction model relies on customerName
            const purchase = {
                customerName: formData.vendorName,
                // If the vendor exists in our specialized table, we could perhaps link it, 
                // but standard transactions link to contacts. 
                // Since user wanted separate logic, we rely on the Name string.
                contactId: relatedContactId || null,
                date: formData.date,
                type: 'Purchase',
                amount: total,
                paymentMethod: formData.paymentMethod,
                status: formData.status,
                description: lineItems
                    .filter(item => item.description.trim())
                    .map(item => `${item.description} (${item.quantity} × ₹${item.rate})`)
                    .join(', ')
            };

            await onSave(purchase);
            onClose();

            // Reset form
            setFormData({
                vendorName: '',
                vendorId: undefined,
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'Cash',
                status: 'Pending',
                notes: ''
            });
            setRelatedContactId(undefined);
            setRelatedContactName('');
            setLineItems([{ description: '', quantity: 1, rate: 0, amount: 0 }]);
        } catch (error) {
            console.error('Failed to create purchase:', error);
            alert('Failed to create purchase. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
                    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Package className="text-lyceum-blue" />
                            Record New Purchase
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Vendor Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Vendor/Supplier <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            list="vendors-list-purchase"
                                            value={formData.vendorName}
                                            onChange={(e) => handleVendorSelect(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="Select or type vendor..."
                                            autoComplete="off"
                                            required
                                        />
                                        <datalist id="vendors-list-purchase">
                                            {vendors.map(v => (
                                                <option key={v.id} value={v.name} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddVendor(true)}
                                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                                        title="Add New Vendor"
                                    >
                                        <UserPlus size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Purchase Date
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

                        {/* Related Contact Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Related Contact / Student (Optional)
                            </label>
                            <input
                                type="text"
                                list="contacts-list-purchase"
                                value={relatedContactName}
                                onChange={(e) => {
                                    setRelatedContactName(e.target.value);
                                    const found = contacts.find(c => c.name === e.target.value);
                                    setRelatedContactId(found ? found.id : undefined);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Search student or client name..."
                            />
                            <datalist id="contacts-list-purchase">
                                {contacts.map(c => (
                                    <option key={c.id} value={c.name} />
                                ))}
                            </datalist>
                            <p className="text-xs text-gray-500 mt-1">
                                Link this purchase to a student file (Internal record only).
                            </p>
                        </div>

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

                        {/* Line Items */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Items Purchased (Inventory)
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
                                <datalist id="products-list">
                                    {products.map(p => (
                                        <option key={p.id} value={p.name} />
                                    ))}
                                </datalist>
                                {lineItems.map((item, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        <input
                                            type="text"
                                            list="products-list"
                                            placeholder="Item Name (Auto-saves to Inventory)"
                                            value={item.description}
                                            onChange={(e) => handleProductSelect(index, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
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
                                            placeholder="Price"
                                            value={item.rate}
                                            onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                            className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-right"
                                            min="0"
                                            step="0.01"
                                        />
                                        <div className="w-28 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-right font-medium">
                                            ₹{item.amount.toFixed(2)}
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
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
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
                                {saving ? 'Recording...' : 'Record Purchase'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <AddVendorModal
                isOpen={showAddVendor}
                onClose={() => setShowAddVendor(false)}
                onSave={(newVendor) => {
                    setVendors([...vendors, newVendor]);
                    setFormData({
                        ...formData,
                        vendorName: newVendor.name,
                        vendorId: newVendor.id
                    });
                }}
            />
        </>
    );
};

export default NewPurchaseModal;
