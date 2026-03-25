import React, { useState, useEffect } from 'react';
import { KeyRound, Plus, Trash2, Copy, CheckCircle2, Clock, Shield, AlertCircle, Zap, ZapOff } from '@/components/common/icons';
import * as api from '@/utils/api';
import type { ApiKey } from '@/types';

const ApiKeysTab: React.FC = () => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyAccess, setNewKeyAccess] = useState<'read-only' | 'read-write'>('read-only');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            setIsLoading(true);
            const data = await api.getApiKeys();
            setKeys(data.keys);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch API keys');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName.trim()) return;

        try {
            setIsCreating(true);
            setError(null);
            const key = await api.createApiKey(newKeyName.trim(), newKeyAccess);
            setKeys([key, ...keys]);
            setGeneratedKey(key.key || null);
            setNewKeyName('');
            setIsCreating(false);
        } catch (err: any) {
            setError(err.message || 'Failed to create API key');
            setIsCreating(false);
        }
    };

    const handleDeleteKey = async (id: number) => {
        if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;

        try {
            setError(null);
            await api.deleteApiKey(id);
            setKeys(keys.filter(k => k.id !== id));
        } catch (err: any) {
            setError(err.message || 'Failed to delete API key');
        }
    };

    const handleToggleKey = async (id: number) => {
        try {
            setError(null);
            const { status } = await api.toggleApiKey(id);
            setKeys(keys.map(k => k.id === id ? { ...k, status } : k));
        } catch (err: any) {
            setError(err.message || 'Failed to toggle API key');
        }
    };

    const copyToClipboard = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    };

    if (isLoading && keys.length === 0) {
        return <div className="p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lyceum-blue"></div></div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                    <KeyRound className="mr-2 text-lyceum-blue" size={20} />
                    API Keys
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage API keys for external access to your data.
                </p>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-auto">
                {/* Create Key Form */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Generate New API Key</h4>
                    <form onSubmit={handleCreateKey} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Key Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. External Reporter"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-lyceum-blue focus:border-lyceum-blue dark:bg-gray-700 dark:text-white"
                                    value={newKeyName}
                                    onChange={e => setNewKeyName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Access Level</label>
                                <select
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-lyceum-blue focus:border-lyceum-blue dark:bg-gray-700 dark:text-white"
                                    value={newKeyAccess}
                                    onChange={e => setNewKeyAccess(e.target.value as any)}
                                >
                                    <option value="read-only">Read Only</option>
                                    <option value="read-write">Read & Write</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="inline-flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-md text-sm font-medium hover:bg-lyceum-blue-dark disabled:opacity-50 transition-colors"
                        >
                            {isCreating ? 'Generating...' : <><Plus size={16} className="mr-2" /> Generate Key</>}
                        </button>
                    </form>
                </div>

                {/* Newly Generated Key Alert */}
                {generatedKey && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg animate-fade-in">
                        <div className="flex items-start">
                            <AlertCircle className="text-amber-500 mr-3 flex-shrink-0" size={20} />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Copy your API Key</h4>
                                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 mb-3">
                                    For security reasons, this key will only be shown once. Please save it in a safe place.
                                </p>
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-700 p-2 rounded-md font-mono text-sm break-all">
                                    <span className="flex-1">{generatedKey}</span>
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-1.5 text-gray-500 hover:text-lyceum-blue dark:hover:text-lyceum-blue rounded transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <CheckCircle2 className="text-green-500" size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => setGeneratedKey(null)}
                                    className="mt-3 text-xs font-semibold text-amber-800 dark:text-amber-400 hover:underline"
                                >
                                    I've saved it
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md flex items-center text-red-700 dark:text-red-400 text-sm">
                        <AlertCircle size={16} className="mr-2" />
                        {error}
                    </div>
                )}

                {/* Keys List */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Existing Keys ({keys.length})</h4>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Access</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Used</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {keys.length > 0 ? keys.map(key => (
                                    <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-100">
                                            <span>{key.name}</span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                key.accessLevel === 'read-write'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                                <Shield size={12} className="mr-1" />
                                                {key.accessLevel === 'read-write' ? 'Read & Write' : 'Read Only'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                            <Clock size={12} className="mr-1" />
                                            {formatDate(key.lastUsedAt)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">{new Date(key.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleDeleteKey(key.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    title="Revoke Permanently"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No API keys found. Generate one above to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ApiKeysTab;
