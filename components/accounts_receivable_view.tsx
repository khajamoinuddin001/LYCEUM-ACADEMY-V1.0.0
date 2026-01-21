import React, { useState, useMemo } from 'react';
import { Receipt, Search, X, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

interface AccountsReceivableViewProps {
    contacts: any[];
}

interface AREntry {
    id: number;
    contactId: number;
    contactName: string;
    quotationId: number;
    quotationRef: string;
    leadId: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: 'Outstanding' | 'Partial' | 'Paid';
    createdAt: string;
    agreedAt: string;
}

const AccountsReceivableView: React.FC<AccountsReceivableViewProps> = ({ contacts }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Outstanding' | 'Partial' | 'Paid'>('All');

    // Extract AR entries from all contacts
    const allAREntries = useMemo(() => {
        const entries: AREntry[] = [];

        contacts.forEach(contact => {
            const arData = (contact as any).metadata?.accountsReceivable || [];
            arData.forEach((ar: any) => {
                entries.push({
                    ...ar,
                    contactId: contact.id,
                    contactName: contact.name
                });
            });
        });

        return entries;
    }, [contacts]);

    // Filter AR entries
    const filteredEntries = useMemo(() => {
        let result = allAREntries;

        // Filter by status
        if (statusFilter !== 'All') {
            result = result.filter(ar => ar.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(ar =>
                ar.contactName.toLowerCase().includes(query) ||
                ar.quotationRef.toLowerCase().includes(query)
            );
        }

        return result;
    }, [allAREntries, statusFilter, searchQuery]);

    // Calculate summary statistics
    const summary = useMemo(() => {
        const total = allAREntries.reduce((sum, ar) => sum + ar.totalAmount, 0);
        const outstanding = allAREntries
            .filter(ar => ar.status === 'Outstanding')
            .reduce((sum, ar) => sum + ar.remainingAmount, 0);
        const partial = allAREntries
            .filter(ar => ar.status === 'Partial')
            .reduce((sum, ar) => sum + ar.remainingAmount, 0);
        const collected = allAREntries.reduce((sum, ar) => sum + ar.paidAmount, 0);

        return { total, outstanding: outstanding + partial, collected };
    }, [allAREntries]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Outstanding':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'Partial':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Paid':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Accounts Receivable
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Track quotations that have been agreed and payment obligations
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total AR</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(summary.total)}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <Receipt className="text-blue-600 dark:text-blue-400" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Outstanding</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(summary.outstanding)}
                                </p>
                            </div>
                            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Collected</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(summary.collected)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by contact or quotation reference..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lyceum-blue text-gray-900 dark:text-gray-100"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lyceum-blue text-gray-900 dark:text-gray-100"
                        >
                            <option value="All">All Status</option>
                            <option value="Outstanding">Outstanding</option>
                            <option value="Partial">Partial</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>
                </div>

                {/* AR Entries Table */}
                {filteredEntries.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                        <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No accounts receivable found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {searchQuery || statusFilter !== 'All'
                                ? 'Try adjusting your filters'
                                : 'AR entries will appear here when quotations are agreed'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Quotation Ref
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Total Amount
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Paid
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Remaining
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Agreed Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredEntries.map((ar) => (
                                        <tr key={ar.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {ar.contactName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-lyceum-blue font-medium">
                                                    {ar.quotationRef}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(ar.totalAmount)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm text-green-600 dark:text-green-400">
                                                    {formatCurrency(ar.paidAmount)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-medium text-red-600 dark:text-red-400">
                                                    {formatCurrency(ar.remainingAmount)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ar.status)}`}>
                                                    {ar.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(ar.agreedAt)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Results Count */}
                {filteredEntries.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredEntries.length} of {allAREntries.length} AR entries
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountsReceivableView;
