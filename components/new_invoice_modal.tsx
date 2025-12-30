
import React, { useState, useEffect } from 'react';
import { X } from './icons';
import type { AccountingTransaction, TransactionStatus, Contact, User } from '../types';

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Omit<AccountingTransaction, 'id'>) => void;
  contacts: Contact[];
  user: User;
}

const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({ isOpen, onClose, onSave, contacts, user }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('Pending');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
        setCustomerName('');
        setDescription('');
        setAmount('');
        setStatus('Pending');
        setDate(new Date().toISOString().split('T')[0]);
        setError('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  };
  
  const handleSave = () => {
    if (!customerName.trim() || !description.trim() || !amount) {
        setError('Customer name, description, and amount are required.');
        return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Please enter a valid positive amount.');
        return;
    }

    onSave({
        customerName,
        date,
        description,
        type: 'Invoice',
        status,
        amount: parsedAmount,
    });
  };

  if (!isOpen) return null;

  const animationClass = isAnimatingOut ? 'animate-fade-out-fast' : 'animate-fade-in-fast';
  const modalAnimationClass = isAnimatingOut ? 'animate-scale-out' : 'animate-scale-in';

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const canCreate = user.permissions['Accounting']?.create;

  return (
    <div
      className={`fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 ${animationClass}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-invoice-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="new-invoice-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Create New Invoice
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="inv-customer" className={labelClasses}>Customer Name</label>
              <select 
                id="inv-customer" 
                className={inputClasses} 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={!canCreate}
              >
                  <option value="" disabled>Select a customer</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.name}>{contact.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="inv-description" className={labelClasses}>Description</label>
              <input type="text" id="inv-description" className={inputClasses} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Semester Tuition Fee" disabled={!canCreate} />
            </div>
            <div>
              <label htmlFor="inv-amount" className={labelClasses}>Amount (₹)</label>
              <input type="number" id="inv-amount" className={inputClasses} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 50000" disabled={!canCreate} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="inv-date" className={labelClasses}>Date</label>
                    <input type="date" id="inv-date" className={inputClasses} value={date} onChange={(e) => setDate(e.target.value)} disabled={!canCreate} />
                </div>
                 <div>
                    <label htmlFor="inv-status" className={labelClasses}>Status</label>
                    <select id="inv-status" value={status} onChange={(e) => setStatus(e.target.value as TransactionStatus)} className={inputClasses} disabled={!canCreate}>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                    </select>
                </div>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <button 
            type="button" 
            onClick={handleClose}
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={!canCreate}
            className="ml-3 px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue disabled:bg-gray-400 dark:disabled:bg-gray-600"
          >
            Create
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-out-fast { from { opacity: 1; } to { opacity: 0; } }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
        .animate-fade-out-fast { animation: fade-out-fast 0.2s ease-in forwards; }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes scale-out { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
        .animate-scale-out { animation: scale-out 0.2s ease-in forwards; }
      `}</style>
    </div>
  );
};

export default NewInvoiceModal;