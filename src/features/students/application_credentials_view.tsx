import React, { useState } from 'react';
import { Contact } from '@/types';
import { ArrowLeft, Copy, Check, Mail, Key } from 'lucide-react';

interface ApplicationCredentialsViewProps {
    contact: Contact;
    onNavigateBack: () => void;
}

const ApplicationCredentialsView: React.FC<ApplicationCredentialsViewProps> = ({ contact, onNavigateBack }) => {
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    const handleCopy = (text: string, type: 'email' | 'password') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        if (type === 'email') {
            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 2000);
        } else {
            setCopiedPassword(true);
            setTimeout(() => setCopiedPassword(false), 2000);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm w-full max-w-2xl mx-auto animate-fade-in border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-700 gap-4">
                <div>
                    <button
                        onClick={onNavigateBack}
                        className="flex items-center text-sm font-bold text-gray-500 hover:text-lyceum-blue mb-3 transition-colors uppercase tracking-widest"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Details
                    </button>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-lyceum-blue/10 text-lyceum-blue flex items-center justify-center">
                            <Key size={20} />
                        </div>
                        Application Credentials
                    </h1>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Internal portal access credentials for {contact.name}</p>
                </div>
            </div>

            <div className="space-y-6 mt-6">
                {/* Email Field */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-lyceum-blue/30 dark:hover:border-lyceum-blue/30 transition-all group">
                    <div className="flex items-center gap-2 mb-3">
                        <Mail size={16} className="text-gray-400" />
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Application Email</h3>
                    </div>
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 pl-4">
                        <span className="font-mono text-gray-900 dark:text-gray-100 truncate pr-4 select-all">
                            {contact.applicationEmail || 'Not Provided'}
                        </span>
                        <button
                            onClick={() => handleCopy(contact.applicationEmail || '', 'email')}
                            disabled={!contact.applicationEmail}
                            className={`p-3 rounded-lg flex items-center justify-center transition-all ${copiedEmail
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'text-gray-400 hover:bg-gray-100 hover:text-lyceum-blue dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            title="Copy Email"
                        >
                            {copiedEmail ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>

                {/* Password Field */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-lyceum-blue/30 dark:hover:border-lyceum-blue/30 transition-all group">
                    <div className="flex items-center gap-2 mb-3">
                        <Key size={16} className="text-gray-400" />
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Application Password</h3>
                    </div>
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 pl-4">
                        <span className="font-mono text-gray-900 dark:text-gray-100 truncate pr-4 select-all">
                            {contact.applicationPassword || 'Not Provided'}
                        </span>
                        <button
                            onClick={() => handleCopy(contact.applicationPassword || '', 'password')}
                            disabled={!contact.applicationPassword}
                            className={`p-3 rounded-lg flex items-center justify-center transition-all ${copiedPassword
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'text-gray-400 hover:bg-gray-100 hover:text-lyceum-blue dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            title="Copy Password"
                        >
                            {copiedPassword ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ApplicationCredentialsView;
