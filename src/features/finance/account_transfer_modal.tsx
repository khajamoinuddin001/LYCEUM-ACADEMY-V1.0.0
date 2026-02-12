import React, { useState } from 'react';
import { X, ArrowRightLeft, Calendar, DollarSign, FileText } from 'lucide-react';
import type { AccountingTransaction } from '@/types';

interface AccountTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<AccountingTransaction, 'id'>) => Promise<void>;
}

const AccountTransferModal: React.FC<AccountTransferModalProps> = ({ isOpen, onClose, onSave }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [fromAccount, setFromAccount] = useState<'Cash' | 'Online'>('Cash');
    const [toAccount, setToAccount] = useState<'Cash' | 'Online'>('Online');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (fromAccount === toAccount && fromAccount !== 'Cash') {
            alert('Source and destination accounts must be different');
            return;
        }

        // Special handling for Cash -> Cash: Treat as Owner Investment / Capital Injection
        const isCapitalInjection = fromAccount === 'Cash' && toAccount === 'Cash';
        const transactionType = isCapitalInjection ? 'Income' : 'Transfer';
        const descriptionText = description || (isCapitalInjection ? 'Owner Investment / Cash Injection' : `Funds transfer from ${fromAccount} to ${toAccount}`);

        setIsSaving(true);
        try {
            await onSave({
                customerName: isCapitalInjection ? 'Owner Investment' : `Transfer: ${fromAccount} to ${toAccount}`,
                date,
                description: descriptionText,
                type: transactionType,
                status: 'Paid',
                amount: parseFloat(amount),
                paymentMethod: fromAccount,
            });
            onClose();
        } catch (error) {
            console.error('Failed to save transfer:', error);
            alert('Failed to save transfer. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-lyceum-blue">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <ArrowRightLeft className="mr-2" size={24} />
                        Transfer Funds
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                From Account
                            </label>
                            <select
                                value={fromAccount}
                                onChange={(e) => setFromAccount(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lyceum-blue outline-none"
                            >
                                <option value="Cash">Cash in Hand</option>
                                <option value="Online">Bank Account</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                To Account
                            </label>
                            <select
                                value={toAccount}
                                onChange={(e) => setToAccount(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lyceum-blue outline-none"
                            >
                                <option value="Cash">Cash in Hand</option>
                                <option value="Online">Bank Account</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Amount (INR)
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lyceum-blue outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Transfer Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lyceum-blue outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description (Optional)
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Describe the reason for transfer..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lyceum-blue outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-4 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-colors disabled:opacity-50 font-bold"
                        >
                            {isSaving ? 'Processing...' : 'Transfer Funds'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountTransferModal;
