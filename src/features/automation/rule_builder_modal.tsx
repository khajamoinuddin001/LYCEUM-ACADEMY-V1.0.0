import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import * as api from '@/utils/api';

const TRIGGERS = [
    'Lead Created',
    'Status Changed',
    'Payment Received',
    'Document Uploaded',
    'Task Completed',
    'Visit Created',
    'Visit Updated',
    'Visit Checkout',
    'Contact Created',
    'Ticket Created',
    'Ticket Updated',
    'Visa Operation Created',
    'Visa Status Changed',
    'User Created',
    'Transaction Created',
    'LMS Course Created',
    'Application Marked Applied',
    'Application Review Started',
    'Application Marked On Hold',
    'Application Acceptance Received',
    'Application I20 Received',
    'Application Rejected',
    'Application Deferred',
    'Document Approved',
    'Document Rejected'
];

const OPERATORS = [
    { value: '==', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: '>', label: 'Greater Than' },
    { value: '<', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
];

interface RuleBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    rule: any;
    templates: any[];
    onSave: () => void;
}

const RuleBuilderModal: React.FC<RuleBuilderModalProps> = ({ isOpen, onClose, rule, templates, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        trigger_event: 'Lead Created',
        conditions: [] as any[],
        action_send_email: false,
        email_template_id: '',
        email_recipient: 'client',
        action_create_task: false,
        task_template: {
            title: '',
            description: '',
            assigned_to_role: 'Staff',
            due_days: 0,
            priority: 'Medium'
        },
        action_send_whatsapp: false,
        whatsapp_template: '',
        is_active: true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (rule) {
            setFormData({
                name: rule.name,
                trigger_event: rule.trigger_event,
                conditions: typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : (rule.conditions || []),
                action_send_email: rule.action_send_email,
                email_template_id: rule.email_template_id?.toString() || '',
                email_recipient: (() => {
                    const r = rule.email_recipient || 'student';
                    if (r === 'client') return 'student';
                    if (r === 'both') return 'student,staff';
                    return r;
                })(),
                action_create_task: rule.action_create_task,
                task_template: typeof rule.task_template === 'string' ? JSON.parse(rule.task_template) : (rule.task_template || { title: '', description: '', assigned_to_role: 'Staff', due_days: 0, priority: 'Medium' }),
                action_send_whatsapp: rule.action_send_whatsapp || false,
                whatsapp_template: rule.whatsapp_template || '',
                is_active: rule.is_active
            });
        }
    }, [rule]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                email_template_id: formData.email_template_id ? parseInt(formData.email_template_id, 10) : null,
            };

            if (rule) {
                await api.updateAutomationRule(rule.id, payload);
            } else {
                await api.createAutomationRule(payload);
            }

            onSave();
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to save rule');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addCondition = () => {
        setFormData(prev => ({
            ...prev,
            conditions: [...prev.conditions, { field: '', operator: '==', value: '' }]
        }));
    };

    const updateCondition = (index: number, key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.map((c, i) => i === index ? { ...c, [key]: value } : c)
        }));
    };

    const removeCondition = (index: number) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.filter((_, i) => i !== index)
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {rule ? 'Edit Automation Rule' : 'New Automation Rule'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Basics */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">1. Basics</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Send Welcome Email on New Lead"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">When (Trigger Event)</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData.trigger_event}
                                onChange={e => setFormData({ ...formData, trigger_event: e.target.value })}
                            >
                                {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Conditions */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">2. Conditions (Optional)</h3>
                            <button type="button" onClick={addCondition} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                                <Plus size={16} /> Add Condition
                            </button>
                        </div>

                        {formData.conditions.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">This rule will run every time the trigger occurs, regardless of payload data.</p>
                        ) : (
                            <div className="space-y-3">
                                {formData.conditions.map((cond, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <input
                                            required
                                            type="text"
                                            className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Payload field (e.g. status)"
                                            value={cond.field}
                                            onChange={e => updateCondition(i, 'field', e.target.value)}
                                        />
                                        <select
                                            className="w-32 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={cond.operator}
                                            onChange={e => updateCondition(i, 'operator', e.target.value)}
                                        >
                                            {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                        <input
                                            required
                                            type="text"
                                            className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Value"
                                            value={cond.value}
                                            onChange={e => updateCondition(i, 'value', e.target.value)}
                                        />
                                        <button type="button" onClick={() => removeCondition(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">3. Actions</h3>

                        <div className="space-y-4">
                            {/* Send Email Action */}
                            <div className="p-4 border rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <label className="flex items-center gap-2 font-medium text-gray-900 dark:text-white mb-3 cursor-pointer w-max">
                                    <input
                                        type="checkbox"
                                        checked={formData.action_send_email}
                                        onChange={e => setFormData({ ...formData, action_send_email: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded"
                                    />
                                    Send an Email
                                </label>

                                {formData.action_send_email && (
                                    <div className="grid grid-cols-2 gap-4 ml-6">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Template</label>
                                            <select
                                                required
                                                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                value={formData.email_template_id}
                                                onChange={e => setFormData({ ...formData, email_template_id: e.target.value })}
                                            >
                                                <option value="">Select a template...</option>
                                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Recipients</label>
                                            <div className="flex flex-wrap gap-4">
                                                {[
                                                    { id: 'admin', label: 'Admin' },
                                                    { id: 'student', label: 'Student' },
                                                    { id: 'staff', label: 'Assigned Staff' }
                                                ].map(role => (
                                                    <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-emerald-600 rounded"
                                                            checked={formData.email_recipient.split(',').includes(role.id)}
                                                            onChange={() => {
                                                                const current = formData.email_recipient ? formData.email_recipient.split(',') : [];
                                                                const updated = current.includes(role.id)
                                                                    ? current.filter(r => r !== role.id)
                                                                    : [...current, role.id];
                                                                setFormData({ ...formData, email_recipient: updated.join(',') });
                                                            }}
                                                        />
                                                        {role.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Create Task Action */}
                            <div className="p-4 border rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <label className="flex items-center gap-2 font-medium text-gray-900 dark:text-white mb-3 cursor-pointer w-max">
                                    <input
                                        type="checkbox"
                                        checked={formData.action_create_task}
                                        onChange={e => setFormData({ ...formData, action_create_task: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded"
                                    />
                                    Create a Task
                                </label>

                                {formData.action_create_task && (
                                    <div className="space-y-3 ml-6">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 mb-2">
                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Dynamic Task Fields</p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                                                Use tags like <span className="font-mono bg-white dark:bg-gray-800 border dark:border-gray-700 px-1.5 py-0.5 rounded shadow-sm">{'{{visitor_name}}'}</span>, <span className="font-mono bg-white dark:bg-gray-800 border dark:border-gray-700 px-1.5 py-0.5 rounded shadow-sm">{'{{staff_name}}'}</span>, or <span className="font-mono bg-white dark:bg-gray-800 border dark:border-gray-700 px-1.5 py-0.5 rounded shadow-sm">{'{{visit_purpose}}'}</span> to automatically include details.
                                            </p>
                                        </div>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Task Title (e.g. Call Follow-up: {{contact}})"
                                            value={formData.task_template.title}
                                            onChange={e => setFormData({ ...formData, task_template: { ...formData.task_template, title: e.target.value } })}
                                        />
                                        <textarea
                                            rows={2}
                                            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Task Description"
                                            value={formData.task_template.description}
                                            onChange={e => setFormData({ ...formData, task_template: { ...formData.task_template, description: e.target.value } })}
                                        />
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assign To Role</label>
                                                <select
                                                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    value={formData.task_template.assigned_to_role}
                                                    onChange={e => setFormData({ ...formData, task_template: { ...formData.task_template, assigned_to_role: e.target.value } })}
                                                >
                                                    <option value="Staff">Staff</option>
                                                    <option value="Admin">Admin</option>
                                                    <option value="Branch Manager">Branch Manager</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                                                <select
                                                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    value={formData.task_template.priority}
                                                    onChange={e => setFormData({ ...formData, task_template: { ...formData.task_template, priority: e.target.value } })}
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due In (Days)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    value={formData.task_template.due_days}
                                                    onChange={e => setFormData({ ...formData, task_template: { ...formData.task_template, due_days: parseInt(e.target.value) || 0 } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Send WhatsApp Action */}
                            <div className="p-4 border rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <label className="flex items-center gap-2 font-medium text-gray-900 dark:text-white mb-3 cursor-pointer w-max">
                                    <input
                                        type="checkbox"
                                        checked={formData.action_send_whatsapp}
                                        onChange={e => setFormData({ ...formData, action_send_whatsapp: e.target.checked })}
                                        className="w-4 h-4 text-emerald-600 rounded"
                                    />
                                    Send a WhatsApp Message
                                </label>

                                {formData.action_send_whatsapp && (
                                    <div className="space-y-3 ml-6">
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 mb-2">
                                            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1">WhatsApp Business Template</p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
                                                Keep messages professional. Use tags like <span className="font-mono bg-white dark:bg-gray-800 border dark:border-gray-700 px-1.5 py-0.5 rounded shadow-sm">{'{{contact_name}}'}</span> or <span className="font-mono bg-white dark:bg-gray-800 border dark:border-gray-700 px-1.5 py-0.5 rounded shadow-sm">{'{{status}}'}</span>.
                                            </p>
                                        </div>
                                        <textarea
                                            required
                                            rows={4}
                                            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Message content (e.g. Hello {{contact_name}}, your visa status is now {{visa_status}}.)"
                                            value={formData.whatsapp_template}
                                            onChange={e => setFormData({ ...formData, whatsapp_template: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <label htmlFor="is_active" className="font-medium text-gray-900 dark:text-white cursor-pointer">Rule is Active</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (!formData.action_send_email && !formData.action_create_task && !formData.action_send_whatsapp)}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-emerald-400"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Rule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RuleBuilderModal;
