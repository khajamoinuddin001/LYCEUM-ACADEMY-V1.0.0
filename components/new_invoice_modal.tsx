import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, User } from 'lucide-react';
import * as api from '../utils/api';
import type { Contact } from '../types';
import QuickAddContactModal from './quick_add_contact_modal';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onSave: (invoice: any) => Promise<void>;
  onAddContact: (contact: any) => Promise<Contact>;
}

const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onSave,
  onAddContact
}) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [formData, setFormData] = useState({
    contactId: '',
    customerName: '',
    email: '', // Display only
    phone: '', // Display only
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentMethod: 'Cash' as 'Cash' | 'Online',
    status: 'Pending' as 'Paid' | 'Pending' | 'Overdue',
    notes: ''
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ]);

  const [products, setProducts] = useState<api.Product[]>([]);
  const [saving, setSaving] = useState(false);

  // Filter customers
  const customers = contacts.filter(c =>
    !c.type || c.type === 'Customer' || c.type === 'Both'
  );

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

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
  const total = subtotal;

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

    // Recalculate amount
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
      const invoice = {
        contactId: formData.contactId ? parseInt(formData.contactId) : null,
        customerName: formData.customerName,
        date: formData.date,
        dueDate: formData.dueDate || formData.date,
        type: 'Income',
        amount: total,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        description: lineItems
          .filter(item => item.description.trim())
          .map(item => `${item.description} (${item.quantity} × ₹${item.rate})`)
          .join(', ')
      };

      await onSave(invoice);
      onClose();

      // Reset form
      setFormData({
        contactId: '',
        customerName: '',
        email: '',
        phone: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        paymentMethod: 'Cash',
        status: 'Pending',
        notes: ''
      });
      setLineItems([{ description: '', quantity: 1, rate: 0, amount: 0 }]);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice. Please try again.');
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
              Create New Invoice
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
                  Customer <span className="text-red-500">*</span>
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
                  Invoice Date
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

              <datalist id="products-list-invoice">
                {products.map(p => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>

              <div className="space-y-2">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input
                      type="text"
                      list="products-list-invoice"
                      placeholder="Item Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
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
                      placeholder="Rate"
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
                {saving ? 'Creating...' : 'Create Invoice'}
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

export default NewInvoiceModal;