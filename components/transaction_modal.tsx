
import React, { useState, useEffect } from 'react';
import { X, Search } from './icons';
import type { AccountingTransaction, TransactionStatus, TransactionType, Contact, User } from '../types';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<AccountingTransaction, 'id'> & { id?: string }) => void;
    contacts: Contact[];
    user: User;
    editTransaction?: AccountingTransaction | null;
    initialType?: TransactionType;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
    isOpen,
    onClose,
    onSave,
    contacts,
    user,
    editTransaction,
    initialType = 'Invoice'
}) => {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [type, setType] = useState<TransactionType>(initialType);
    const [contactId, setContactId] = useState<number | undefined>(undefined);
    const [customerName, setCustomerName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<TransactionStatus>('Pending');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editTransaction) {
                setType(editTransaction.type);
                setContactId(editTransaction.contactId);
                setCustomerName(editTransaction.customerName);
                setDescription(editTransaction.description);
                setAmount(String(Math.abs(editTransaction.amount)));
                setStatus(editTransaction.status);
                setDate(editTransaction.date);
            } else {
                setType(initialType);
                setContactId(undefined);
                setCustomerName('');
                setDescription('');
                setAmount('');
                setStatus('Pending');
                setDate(new Date().toISOString().split('T')[0]);
            }
            setError('');
            setSearchTerm('');
        }
    }, [isOpen, editTransaction, initialType]);

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsAnimatingOut(false);
            onClose();
        }, 200);
    };

    const handleSave = () => {
        if (!customerName.trim() || !description.trim() || !amount) {
            setError('Contact, description, and amount are required.');
            return;
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Please enter a valid positive amount.');
            return;
        }

        // Bills are negative amounts in our system (usually)
        const finalAmount = type === 'Bill' ? -parsedAmount : parsedAmount;

        onSave({
            id: editTransaction?.id,
            contactId,
            customerName,
            date,
            description,
            type,
            status,
            amount: finalAmount,
        });
    };

    if (!isOpen) return null;

    const filteredContacts = contacts.filter(c =>
        (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.contactId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const animationClass = isAnimatingOut ? 'animate-fade-out-fast' : 'animate-fade-in-fast';
    const modalAnimationClass = isAnimatingOut ? 'animate-scale-out' : 'animate-scale-in';

    const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    const canUpdate = user.role === 'Admin' || !!user.permissions?.['Accounting']?.update;

    return (
        <div
            className={`fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 ${animationClass}`}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {editTransaction ? `Edit ${type}` : `New ${type}`}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {!editTransaction && (
                            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                <button
                                    onClick={() => setType('Invoice')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'Invoice' ? 'bg-white dark:bg-gray-600 shadow-sm text-lyceum-blue' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                >
                                    Invoice
                                </button>
                                <button
                                    onClick={() => setType('Bill')}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'Bill' ? 'bg-white dark:bg-gray-600 shadow-sm text-red-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                >
                                    Bill
                                </button>
                            </div>
                        )}

                        <div>
                            <label className={labelClasses}>{type === 'Invoice' ? 'Customer' : 'Vendor / Supplier'}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={16} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className={`${inputClasses} pl-10`}
                                    placeholder="Search contact..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                        {filteredContacts.length > 0 ? filteredContacts.map(contact => (
                                            <button
                                                key={contact.id}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200"
                                                onClick={() => {
                                                    setContactId(contact.id);
                                                    setCustomerName(contact.name);
                                                    setSearchTerm(contact.name);
                                                }}
                                            >
                                                <div className="font-medium">{contact.name}</div>
                                                <div className="text-xs text-gray-500">{contact.department} • {contact.contactId}</div>
                                            </button>
                                        )) : (
                                            <div className="px-4 py-2 text-sm text-gray-500">No contacts found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {!searchTerm && customerName && (
                                <div className="mt-1 flex items-center justify-between bg-lyceum-blue/10 dark:bg-lyceum-blue/20 px-3 py-1 rounded text-sm text-lyceum-blue">
                                    <span>{customerName}</span>
                                    <button onClick={() => { setContactId(undefined); setCustomerName(''); }} className="hover:text-lyceum-blue-dark">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={labelClasses}>Description</label>
                            <input type="text" className={inputClasses} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={`e.g., ${type === 'Invoice' ? 'Semester Tuition Fee' : 'Office Electricity Bill'}`} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Amount (₹)</label>
                                <input type="number" className={inputClasses} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <label className={labelClasses}>Status</label>
                                <select value={status} onChange={(e) => setStatus(e.target.value as TransactionStatus)} className={inputClasses}>
                                    <option value="Pending">Pending</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Overdue">Overdue</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Date</label>
                            <input type="date" className={inputClasses} value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>

                        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                    </div>
                </div>
                <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!canUpdate && !!editTransaction}
                        className="ml-3 px-6 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue disabled:bg-gray-400"
                    >
                        {editTransaction ? 'Update' : 'Create'}
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

export default TransactionModal;
