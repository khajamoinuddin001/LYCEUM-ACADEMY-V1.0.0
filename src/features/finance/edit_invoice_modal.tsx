import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, User } from 'lucide-react';
import * as api from '@/utils/api';
import type { Contact, AccountingTransaction } from '@/types';
import QuickAddContactModal from './quick_add_contact_modal';

interface LineItem {
    id?: string;
    description: string;
    longDescription?: string;
    quantity: number;
    rate: number;
    discount?: number;
    amount: number;
    received: number;
    pending: number;
    paidSoFar?: number;
    linkedQuotationLineItemId?: string;
    pendingBalance?: number;
    originalPending?: number;
}

interface EditInvoiceModalProps {
    transaction: AccountingTransaction;
    onClose: () => void;
    contacts: Contact[];
    onSave: (id: string, updates: Partial<AccountingTransaction>) => Promise<void>;
    onAddContact: (contact: any) => Promise<Contact>;
}

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
    transaction,
    onClose,
    contacts,
    onSave,
    onAddContact
}) => {
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [formData, setFormData] = useState({
        contactId: transaction.contactId?.toString() || '',
        customerName: transaction.customerName || '',
        email: '', // Display only
        phone: '', // Display only
        date: transaction.date || new Date().toISOString().split('T')[0],
        dueDate: transaction.dueDate || '',
        paymentMethod: transaction.paymentMethod || 'Cash',
        status: transaction.status || 'Paid',
        notes: '',
        additionalDiscount: transaction.additionalDiscount?.toString() || ''
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    const [products, setProducts] = useState<api.Product[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
    const [addingProduct, setAddingProduct] = useState(false);
    const [availableAREntries, setAvailableAREntries] = useState<any[]>([]);
    const [selectedAREntryId, setSelectedAREntryId] = useState<number | null>((transaction as any).linkedArId || null);

    // Filter customers
    const customers = contacts.filter(c =>
        !c.type || c.type === 'Customer' || c.type === 'Both'
    );

    useEffect(() => {
        loadProducts();
        initializeForm();
        setSelectedAREntryId((transaction as any).linkedArId || null);
        if (transaction.contactId) {
            const contact = contacts.find(c => c.id === transaction.contactId);
            if (contact) {
                const arList = (contact as any).metadata?.accountsReceivable || [];
                setAvailableAREntries(arList.filter((ar: any) => ar.status !== 'Paid' || ar.id === (transaction as any).linkedArId));
            }
        }
    }, [transaction]);

    const initializeForm = () => {
        // Find contact details to populate email/phone
        if (transaction.contactId) {
            const contact = contacts.find(c => c.id === transaction.contactId);
            if (contact) {
                setFormData(prev => ({
                    ...prev,
                    email: contact.email || '',
                    phone: contact.phone || ''
                }));
            }
        }

        // Initialize line items
        if (transaction.lineItems && transaction.lineItems.length > 0) {
            setLineItems(transaction.lineItems.map(item => ({
                ...item,
                paidSoFar: (item as any).paidSoFar || 0,
                received: (item as any).received || 0,
                pending: (item as any).pending || (item.amount - ((item as any).received || 0))
            })));
        } else {
            // Fallback for old transactions: Create single line item from description/amount
            setLineItems([{
                description: transaction.description || 'Invoice Item',
                longDescription: '',
                quantity: 1,
                rate: transaction.amount || 0,
                amount: transaction.amount || 0,
                received: transaction.status === 'Paid' ? transaction.amount : 0,
                pending: transaction.status === 'Paid' ? 0 : transaction.amount
            }]);
        }
    };

    const loadProducts = async () => {
        try {
            const data = await api.getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const totalReceived = lineItems.reduce((sum, item) => sum + (item.received || 0), 0);
    const total = Math.max(0, subtotal - (parseFloat(formData.additionalDiscount.toString()) || 0));
    const totalPending = Math.max(0, total - totalReceived);

    const handleCustomerNameChange = (name: string) => {
        // 1. Update name immediately
        const newState = { ...formData, customerName: name };

        // 2. Try to find existing contact
        const found = customers.find(c => c.name.toLowerCase() === name.toLowerCase());

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

        // Filter AR entries for this contact
        if (found) {
            const arList = (found as any).metadata?.accountsReceivable || [];
            setAvailableAREntries(arList.filter((ar: any) => ar.status !== 'Paid' || ar.id === (transaction as any).linkedArId));
        } else {
            setAvailableAREntries([]);
        }
    };

    const handleQuickAddContact = async (contactData: any) => {
        try {
            const newContact = await onAddContact(contactData);
            setFormData({
                ...formData,
                contactId: newContact.id.toString(),
                customerName: newContact.name,
                email: newContact.email || '',
                phone: newContact.phone || ''
            });
            setShowQuickAdd(false);
        } catch (error) {
            throw error;
        }
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };

        // Recalculate amount, received, pending
        if (field === 'quantity' || field === 'rate' || field === 'discount' || field === 'received') {
            const qty = updated[index].quantity || 0;
            const rate = updated[index].rate || 0;
            const disc = updated[index].discount || 0;
            const paid = updated[index].paidSoFar || 0;
            const recv = updated[index].received || 0;

            const itemTotal = (qty * rate) - disc;
            // The 'Line Total' in this invoice should represent the remaining balance being billed
            const remainingBalance = Math.max(0, itemTotal - paid);

            updated[index].amount = remainingBalance;
            updated[index].pending = Math.max(0, remainingBalance - recv);

            // Dynamically recalculate pending balance if linked to an AR item
            if (updated[index].originalPending !== undefined) {
                updated[index].pendingBalance = Math.max(0, updated[index].originalPending! - recv);
            }
        }

        setLineItems(updated);
    };

    const handleProductSelect = (index: number, product: api.Product) => {
        const updated = [...lineItems];
        updated[index] = {
            ...updated[index],
            description: product.name,
            rate: product.price,
            quantity: 1,
            amount: product.price
        };
        setLineItems(updated);
        setActiveDropdownIndex(null);
    };

    const handleAddProductToInventory = async (index: number, name: string, price: number) => {
        if (!name.trim()) return;
        setAddingProduct(true);
        try {
            const newProduct = await api.saveProduct({
                name: name,
                price: price || 0,
                type: 'Service'
            });
            // Add to local state so it shows up in products immediately
            setProducts(prev => [...prev, newProduct]);

            // Select the newly added product
            handleProductSelect(index, newProduct);
        } catch (error) {
            console.error('Failed to add product to inventory:', error);
            alert('Failed to add item to inventory.');
        } finally {
            setAddingProduct(false);
        }
    };

    const handleDeleteProductFromInventory = async (e: React.MouseEvent, productId: number) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this item from inventory?')) return;

        try {
            await api.deleteProduct(productId);
            // Remove from local state
            setProducts(prev => prev.filter(p => p.id !== productId));
        } catch (error) {
            console.error('Failed to delete product from inventory:', error);
            alert('Failed to delete item from inventory.');
        }
    };

    const addLineItem = () => {
        setLineItems([...lineItems, { description: '', longDescription: '', quantity: 1, rate: 0, amount: 0, received: 0, pending: 0, paidSoFar: 0, linkedQuotationLineItemId: '', pendingBalance: 0, originalPending: 0 }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerName) {
            alert('Please enter a customer name');
            return;
        }

        if (lineItems.every(item => !item.description.trim())) {
            alert('Please add at least one line item');
            return;
        }

        setSaving(true);
        try {
            const updates = {
                contactId: formData.contactId ? parseInt(formData.contactId) : null,
                customerName: formData.customerName,
                date: formData.date,
                dueDate: formData.dueDate || formData.date,
                type: transaction.type, // Maintain original type
                amount: totalReceived,
                paymentMethod: formData.paymentMethod as any,
                status: formData.status as any,
                additionalDiscount: parseFloat(formData.additionalDiscount?.toString() || '0'),
                lineItems: lineItems, // Save structured data
                description: lineItems
                    .filter(item => item.description.trim())
                    .map(item => {
                        let desc = `${item.description} (${item.quantity} × ₹${item.rate}${item.discount ? ` - ₹${item.discount} disc` : ''}${item.received ? `, Recv: ₹${item.received}` : ''})`;
                        if (item.longDescription?.trim()) {
                            desc += ` - ${item.longDescription.trim()}`;
                        }
                        return desc;
                    })
                    .join(', '),
                linkedArId: selectedAREntryId
            };

            await onSave(transaction.id, updates);
            onClose();
        } catch (error) {
            console.error('Failed to update invoice:', error);
            alert('Failed to update invoice. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
                    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Edit {transaction.type}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Customer Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Customer Name <span className="text-red-500">*</span>
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
                                        {customers.map(c => (
                                            <option key={c.id} value={c.name} />
                                        ))}
                                    </datalist>
                                </div>
                                {/* Auto-filled details display */}
                                {(formData.email || formData.phone) && (
                                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-600">
                                        {formData.email && <div>✉️ {formData.email}</div>}
                                        {formData.phone && <div>📞 {formData.phone}</div>}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Client (Entity)
                                </label>
                                <input
                                    type="text"
                                    value={transaction.contact || ''} // We don't edit this here currently as it's derived usually, but keep as display or simple input if needed? Original code had it.
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500"
                                    placeholder="Company or Entity Name"
                                />
                                <p className="text-xs text-gray-500 mt-1">Entity is derived from contact details.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={total}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Calculated from line items</p>
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
                        </div>

                        {/* Link to Quotation/AR */}
                        {availableAREntries.length > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                                    Link to Quotation / Outstanding Fee
                                </label>
                                <select
                                    value={selectedAREntryId || ''}
                                    onChange={(e) => {
                                        const arId = e.target.value ? parseInt(e.target.value) : null;
                                        setSelectedAREntryId(arId);
                                        if (arId) {
                                            const selectedAR = availableAREntries.find(ar => ar.id === arId);
                                            // Optional: Auto-populate items logic here if needed, but since it's Edit mode, we probably want to leave existing items intact unless user explicitly overrides.
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">-- No Link (General Income) --</option>
                                    {availableAREntries.map(ar => (
                                        <option key={ar.id} value={ar.id}>
                                            {ar.quotationRef} - {ar.description || 'Quotation'} (Due: ₹{ar.remainingAmount})
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400">
                                    Linking will update the student's payment status and unlock document sections.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
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

                            {/* Column Headers */}
                            <div className="hidden sm:flex items-center gap-2 mb-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <div className="flex-1">Item Details</div>
                                <div className="w-12 text-center">Qty</div>
                                <div className="w-24 text-right">Price</div>
                                <div className="w-20 text-right text-red-500">Disc</div>
                                <div className="w-20 text-right text-green-600">Paid</div>
                                <div className="w-24 text-right text-blue-600">Receive</div>
                                <div className="w-32 text-right">Pending in Future</div>
                                <div className="w-32 text-right">Pending Amount</div>
                                <div className="w-8"></div>
                            </div>

                            <div className="space-y-3">
                                {lineItems.map((item, index) => (
                                    <div key={index} className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                                        {/* Header with numbering and delete button for mobile */}
                                        <div className="flex sm:hidden justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Item #{index + 1}</span>
                                            {lineItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeLineItem(index)}
                                                    className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 items-start">
                                            {/* Item Details Column */}
                                            <div className="w-full sm:flex-1 space-y-2 relative">
                                                <label className="sm:hidden block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Item Details</label>
                                                <input
                                                    type="text"
                                                    placeholder="Item Description"
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                                    onFocus={() => setActiveDropdownIndex(index)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                                    autoComplete="off"
                                                />
                                                {activeDropdownIndex === index && (
                                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[60] max-h-60 overflow-y-auto">
                                                        {products
                                                            .filter(p => p.name.toLowerCase().includes(item.description.toLowerCase()))
                                                            .map(product => (
                                                                <div
                                                                    key={product.id}
                                                                    onClick={() => handleProductSelect(index, product)}
                                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center group cursor-pointer"
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                                                                        <div className="text-xs text-gray-500">Inventory Item</div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="text-sm font-semibold text-lyceum-blue">₹{product.price}</div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => handleDeleteProductFromInventory(e, product.id)}
                                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                                <input
                                                    type="text"
                                                    placeholder="Add extra details..."
                                                    value={item.longDescription || ''}
                                                    onChange={(e) => updateLineItem(index, 'longDescription', e.target.value)}
                                                    className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800/50 focus:ring-1 focus:ring-blue-500 text-gray-600 dark:text-gray-400"
                                                />
                                            </div>

                                            {/* Numeric Inputs Grid */}
                                            <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-2">
                                                <div className="space-y-1">
                                                    <label className="sm:hidden block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Qty</label>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-full sm:w-12 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-sm"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="sm:hidden block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Price</label>
                                                    <input
                                                        type="number"
                                                        value={item.rate}
                                                        onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                        className="w-full sm:w-24 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-right text-sm"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="sm:hidden block text-[10px] font-bold text-red-500 uppercase tracking-wider">Disc</label>
                                                    <input
                                                        type="number"
                                                        value={item.discount || 0}
                                                        onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                                        className="w-full sm:w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 text-red-600 font-medium text-right text-sm"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="sm:hidden block text-[10px] font-bold text-green-600 uppercase tracking-wider">Paid</label>
                                                    <div className="w-full sm:w-20 px-2 py-2 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-right font-bold text-sm">
                                                        ₹{(item.paidSoFar || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="sm:hidden block text-[10px] font-bold text-blue-600 uppercase tracking-wider">Receive</label>
                                                    <input
                                                        type="number"
                                                        value={item.received || 0}
                                                        onChange={(e) => updateLineItem(index, 'received', parseFloat(e.target.value) || 0)}
                                                        className="w-full sm:w-24 px-2 py-2 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-blue-600 font-bold text-right text-sm"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="sm:hidden block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Future</label>
                                                    <div className="w-full sm:w-32 px-2 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-right font-bold text-sm">
                                                        ₹{(item.pending || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                                <div className="space-y-1 col-span-2 sm:col-auto">
                                                    <label className="sm:hidden block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pending Amount</label>
                                                    <div className="w-full sm:w-32 px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-right font-bold text-sm">
                                                        ₹{item.amount.toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Desktop Delete Button */}
                                            <div className="hidden sm:flex w-8 justify-center items-center self-center pt-2">
                                                {lineItems.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLineItem(index)}
                                                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
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
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-t border-gray-100 dark:border-gray-700 pt-2">
                                        <span className="text-blue-600 dark:text-blue-400 font-medium">Total Received:</span>
                                        <span className="font-bold text-blue-700 dark:text-blue-300">₹{totalReceived.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">Total Pending:</span>
                                        <span className="font-bold text-red-600 dark:text-red-400">₹{totalPending.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                                        <span className="text-gray-900 dark:text-white">Invoice Total:</span>
                                        <span className="text-lyceum-blue">₹{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
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

            {/* Quick Add Contact Modal */}
            {showQuickAdd && (
                <QuickAddContactModal
                    onClose={() => setShowQuickAdd(false)}
                    onSave={handleQuickAddContact}
                    defaultType="Customer"
                />
            )}
        </>
    );
};

export default EditInvoiceModal;
