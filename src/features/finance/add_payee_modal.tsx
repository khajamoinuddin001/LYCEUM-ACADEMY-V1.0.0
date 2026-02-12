import React, { useState } from 'react';
import { X } from 'lucide-react';
import * as api from '@/utils/api';

interface AddPayeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payee: api.ExpensePayee) => void;
}

const AddPayeeModal: React.FC<AddPayeeModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);

    // Common categories for suggestion
    const suggestions = [
        'Rent', 'Utilities', 'Salaries', 'Office Supplies',
        'Marketing', 'Travel', 'Maintenance', 'Insurance', 'Meals', 'Internet'
    ];

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const newPayee = await api.saveExpensePayee({
                name,
                defaultCategory: category || undefined
            });
            onSave(newPayee);
            onClose();
        } catch (error) {
            console.error('Failed to save payee:', error);
            alert('Failed to save payee');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-lyceum-blue">
                    <h2 className="text-xl font-bold text-white">
                        Add New Payee
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Payee Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lyceum-blue outline-none"
                            placeholder="e.g. Electric Company"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Default Category (Optional)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                list="category-suggestions"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lyceum-blue outline-none"
                                placeholder="e.g. Utilities"
                            />
                            <datalist id="category-suggestions">
                                {suggestions.map(s => (
                                    <option key={s} value={s} />
                                ))}
                            </datalist>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Auto-fills category when this payee is selected.
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-lyceum-blue hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lyceum-blue disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Saving...' : 'Add Payee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPayeeModal;
