import React, { useState, useEffect } from 'react';
import { Settings, Plus, Play, Pause, Trash2, Edit, Mail, Zap } from 'lucide-react';
import * as api from '@/utils/api';
import RuleBuilderModal from './rule_builder_modal.tsx';
import EmailTemplateModal from './email_template_modal.tsx';

const AutomationView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'logs'>('rules');
    const [rules, setRules] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);

    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<any | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'rules') {
                const data = await api.getAutomationRules();
                setRules(data);
            } else if (activeTab === 'templates') {
                const data = await api.getEmailTemplates();
                setTemplates(data);
            } else {
                const data = await api.getAutomationLogs();
                setLogs(data);
            }
        } catch (error) {
            console.error('Failed to load automation data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleRule = async (rule: any) => {
        try {
            await api.updateAutomationRule(rule.id, { ...rule, is_active: !rule.is_active });
            loadData();
        } catch (e) {
            alert('Failed to update rule status');
        }
    };

    const handleDeleteRule = async (id: number) => {
        if (confirm('Are you sure you want to delete this rule?')) {
            await api.deleteAutomationRule(id);
            loadData();
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                await api.deleteEmailTemplate(id);
                loadData();
            } catch (e: any) {
                alert(e.message || 'Error deleting template');
            }
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-6 h-6 text-emerald-500 fill-emerald-500/10" />
                    Automation Engine
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setEditingTemplate(null); setIsTemplateModalOpen(true); }}
                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2"
                    >
                        <Mail className="w-4 h-4" /> New Template
                    </button>
                    <button
                        onClick={() => { setEditingRule(null); setIsRuleModalOpen(true); }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> New Rule
                    </button>
                </div>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'rules'
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Automation Rules
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'templates'
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Email Templates
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'logs'
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Send email logs
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            ) : activeTab === 'rules' ? (
                <div className="grid gap-4">
                    {rules.length === 0 ? (
                        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">No automation rules configured yet.</p>
                        </div>
                    ) : (
                        rules.map((rule) => (
                            <div key={rule.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${rule.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {rule.is_active ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Trigger: <span className="font-medium text-indigo-600 dark:text-indigo-400">{rule.trigger_event}</span>
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            {rule.action_send_email && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                                                    <Mail className="w-3 h-3" /> Email
                                                </span>
                                            )}
                                            {rule.action_create_task && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded">
                                                    <CheckCircle className="w-3 h-3" /> Task
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleToggleRule(rule)} className={`px-3 py-1 rounded text-sm font-medium ${rule.is_active ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                                        {rule.is_active ? 'Disable' : 'Enable'}
                                    </button>
                                    <button onClick={() => { setEditingRule(rule); setIsRuleModalOpen(true); }} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteRule(rule.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : activeTab === 'templates' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.length === 0 ? (
                        <div className="col-span-full text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">No email templates created yet.</p>
                        </div>
                    ) : (
                        templates.map((template) => (
                            <div key={template.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col hover:shadow-md transition-shadow">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 truncate line-clamp-2" title={template.subject}>
                                    <span className="font-medium">Subject:</span> {template.subject}
                                </p>
                                <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button onClick={() => { setEditingTemplate(template); setIsTemplateModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteTemplate(template.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 font-medium">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Event</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">Recipient</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No logs found.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-3 text-gray-500 tabular-nums">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-gray-900 dark:text-white">{log.trigger_event}</span>
                                            <div className="text-xs text-gray-500">{log.rule_name || 'Deleted Rule'}</div>
                                        </td>
                                        <td className="px-4 py-3 capitalize">{log.action_type}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{log.recipient}</td>
                                        <td className="px-4 py-3">
                                            {log.status === 'success' ? (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Success</span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium w-fit">Failed</span>
                                                    {log.error_message && <span className="text-[10px] text-red-500 mt-1 line-clamp-1" title={log.error_message}>{log.error_message}</span>}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isRuleModalOpen && (
                <RuleBuilderModal
                    isOpen={isRuleModalOpen}
                    onClose={() => setIsRuleModalOpen(false)}
                    rule={editingRule}
                    templates={templates}
                    onSave={loadData}
                />
            )}

            {isTemplateModalOpen && (
                <EmailTemplateModal
                    isOpen={isTemplateModalOpen}
                    onClose={() => setIsTemplateModalOpen(false)}
                    template={editingTemplate}
                    onSave={loadData}
                />
            )}
        </div>
    );
};

// Extracted simply for the inline icon logic
const CheckCircle = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

export default AutomationView;
