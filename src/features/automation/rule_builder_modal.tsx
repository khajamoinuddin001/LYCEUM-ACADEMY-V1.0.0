import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit3, Search, Database, ArrowRight } from 'lucide-react';
import * as api from '@/utils/api';

const TRIGGER_GROUPS = [
    {
        group: '🎯 CRM (Leads App)',
        triggers: [
            'Lead Created',
            'Status Changed',
            'Stage Changed to New',
            'Stage Changed to Qualified',
            'Stage Changed to Proposal',
            'Stage Changed to Won'
        ]
    },
    {
        group: '👤 Contacts App',
        triggers: [
            'Contact Created',
            'User Created'
        ]
    },
    {
        group: '🎫 Tickets App',
        triggers: [
            'Ticket Created',
            'Ticket Updated',
            'Ticket Resolved',
            'Ticket Closed'
        ]
    },
    {
        group: '🎓 University App',
        triggers: [
            'Application Marked Applied',
            'Application Review Started',
            'Application Marked On Hold',
            'Application Acceptance Received',
            'Application I20 Received',
            'Application Rejected',
            'Application Deferred'
        ]
    },
    {
        group: '🛂 Visa Operations App',
        triggers: [
            'Visa Operation Created',
            'Visa Status Changed',
            'Visa Approved',
            'Visa Rejected',
            'Visa 221g (Administrative Processing)',
            'Visa Confirmation Document Uploaded',
            'Slot Booked',
            'DS-160 Submitted',
            'DS-160 Waiting for Student Approval',
            'DS-160 Waiting for Admin Approval',
            'DS-160 Student Approved',
            'DS-160 Admin Approved'
        ]
    },
    {
        group: '💰 Finance App',
        triggers: [
            'Transaction Created',
            'Payment Received'
        ]
    },
    {
        group: '📁 Documents Manager',
        triggers: [
            'Document Uploaded',
            'Document Approved',
            'Document Rejected',
            'Task Completed'
        ]
    },
    {
        group: '🏢 Visitor Desk App',
        triggers: [
            'Visit Created',
            'Visit Updated',
            'Visit Checkout'
        ]
    },
    {
        group: '📚 LMS App',
        triggers: [
            'LMS Course Created'
        ]
    },
    {
        group: '🎤 Mock Interview App',
        triggers: [
            'Mock Interview Approved (>=3.5)',
            'Mock Interview Rejected (<2.5)',
            'Mock Interview Review Required'
        ]
    },
    {
        group: '📋 Forms Application',
        triggers: [
            'Form Assigned'
        ]
    }
];

const TRIGGERS = TRIGGER_GROUPS.flatMap(g => g.triggers);

const OPERATORS = [
    { value: '==', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: '>', label: 'Greater Than' },
    { value: '<', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
];

const TRIGGER_PAYLOAD_FIELDS: Record<string, { value: string; label: string }[]> = {
    '🎯 CRM (Leads App)': [
        { value: '{{contact_name}}', label: 'Contact Name' },
        { value: '{{contact_email}}', label: 'Contact Email' },
        { value: '{{contact_phone}}', label: 'Contact Phone' },
        { value: '{{lead_stage}}', label: 'Lead Stage' },
        { value: '{{value}}', label: 'Lead Value' }
    ],
    '👤 Contacts App': [
        { value: '{{name}}', label: 'Name' },
        { value: '{{email}}', label: 'Email' },
        { value: '{{phone}}', label: 'Phone' },
        { value: '{{department}}', label: 'Department' },
        { value: '{{major}}', label: 'Major' }
    ],
    '🎫 Tickets App': [
        { value: '{{contact_name}}', label: 'Contact Name' },
        { value: '{{contact_email}}', label: 'Contact Email' },
        { value: '{{subject}}', label: 'Subject' },
        { value: '{{status}}', label: 'Status' }
    ],
    '🎓 University App': [
        { value: '{{contact_name}}', label: 'Contact Name' },
        { value: '{{university_name}}', label: 'University Name' },
        { value: '{{program}}', label: 'Program' },
        { value: '{{application_status}}', label: 'Status' }
    ],
    '🛂 Visa Operations App': [
        { value: '{{name}}', label: 'Name' },
        { value: '{{email}}', label: 'Email' },
        { value: '{{status}}', label: 'Status' },
        { value: '{{visa_type}}', label: 'Visa Type' }
    ],
    '💰 Finance App': [
        { value: '{{contact_name}}', label: 'Contact Name' },
        { value: '{{contact_email}}', label: 'Contact Email' },
        { value: '{{amount}}', label: 'Amount' },
        { value: '{{type}}', label: 'Type' }
    ],
    '📁 Documents Manager': [
        { value: '{{contact_id}}', label: 'Contact ID' },
        { value: '{{document_name}}', label: 'Document Name' },
        { value: '{{category}}', label: 'Category' },
        { value: '{{document_uploader_name}}', label: 'Uploader' }
    ],
    '🏢 Visitor Desk App': [
        { value: '{{visitor_name}}', label: 'Visitor Name' },
        { value: '{{staff_name}}', label: 'Staff Name' },
        { value: '{{visit_purpose}}', label: 'Visit Purpose' }
    ],
    '📚 LMS App': [
        { value: '{{course_name}}', label: 'Course Name' },
        { value: '{{category}}', label: 'Category' }
    ],
    '🎤 Mock Interview App': [
        { value: '{{contact_name}}', label: 'Contact Name' },
        { value: '{{mock_interview_outcome}}', label: 'Outcome' },
        { value: '{{mock_interview_average_score}}', label: 'Avg Score' }
    ],
    '📋 Forms Application': [
        { value: '{{contact_name}}', label: 'Contact Name' },
        { value: '{{contact_email}}', label: 'Contact Email' },
        { value: '{{form_title}}', label: 'Form Title' },
        { value: '{{deadline}}', label: 'Deadline' }
    ]
};

const APP_FIELDS: Record<string, { value: string; label: string }[]> = {
    'Contacts': [
        { value: 'name', label: 'Name' },
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
        { value: 'department', label: 'Department' },
        { value: 'major', label: 'Program/Major' },
        { value: 'visa_type', label: 'Visa Type' },
        { value: 'degree', label: 'Degree' },
        { value: 'source', label: 'Source' },
        { value: 'file_status', label: 'File Status' },
        { value: 'notes', label: 'Notes' }
    ],
    'Visa Operations App': [
        { value: 'status', label: 'Status' },
        { value: 'country', label: 'Country' },
        { value: 'name', label: 'Name' },
        { value: 'phone', label: 'Phone' },
        { value: 'appointment_state', label: 'Appointment State' },
        { value: 'ds160_number', label: 'DS-160 Number' },
        { value: 'ds160_start_date', label: 'DS-160 Start Date' },
        { value: 'ds160_expiry_date', label: 'DS-160 Expiry Date' },
        { value: 'ds160_status', label: 'DS-160 Status' }
    ],
    'University Application': [
        { value: 'university_name', label: 'University Name' },
        { value: 'course_name', label: 'Course/Program' },
        { value: 'status', label: 'Application Status' },
        { value: 'intake', label: 'Intake' }
    ],
    'Documents Manager': [
        { value: 'document_name', label: 'Document Name' },
        { value: 'document_category', label: 'Document Category' },
        { value: 'document_date&time', label: 'Upload Date/Time' },
        { value: 'document_uploader_name', label: 'Uploader Name' },
        { value: 'document_uploader_email', label: 'Uploader Email' }
    ],
    'Mock Interview': [
        { value: 'mock_interview_outcome', label: 'Approved / Rejected / Review Required' },
        { value: 'mock_interview_date', label: 'Date Conducted' },
        { value: 'mock_interview_questions_count', label: 'Number of Questions' },
        { value: 'mock_interview_average_score', label: 'Average Score (0-5)' },
        { value: 'mock_interview_context_score', label: 'Context Score (1-5)' },
        { value: 'mock_interview_body_language_score', label: 'Body Language Score (1-5)' },
        { value: 'mock_interview_fluency_score', label: 'Fluency Score (1-5)' },
        { value: 'mock_interview_grammar_score', label: 'Grammar Score (1-5)' },
        { value: 'mock_interview_feedback', label: 'Feedback / Comments' }
    ]
};

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
        action_update_field: false,
        update_field_config: {
            target_app: 'Contacts',
            lookup_by: 'email',
            lookup_value: '',
            field: '',
            value: ''
        },
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
                action_update_field: rule.action_update_field || false,
                update_field_config: typeof rule.update_field_config === 'string' ? JSON.parse(rule.update_field_config) : (rule.update_field_config || { target_app: 'Contacts', lookup_by: 'email', lookup_value: '', field: '', value: '' }),
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
                                required
                                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                                value={formData.trigger_event}
                                onChange={e => setFormData({ ...formData, trigger_event: e.target.value })}
                            >
                                <option value="">Select a trigger event...</option>
                                {TRIGGER_GROUPS.map(group => (
                                    <optgroup key={group.group} label={group.group}>
                                        {group.triggers.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </optgroup>
                                ))}
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

                            {/* Update Field Action */}
                            <div className="p-4 border rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <label className="flex items-center gap-3 font-semibold text-gray-900 dark:text-white mb-4 cursor-pointer w-max group">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.action_update_field ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                        <Edit3 size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.action_update_field}
                                                onChange={e => setFormData({ ...formData, action_update_field: e.target.checked })}
                                                className="w-4 h-4 text-emerald-600 rounded"
                                            />
                                            <span className="text-base">Update a field</span>
                                        </div>
                                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400">Sync data across different applications automatically</span>
                                    </div>
                                </label>

                                {formData.action_update_field && (
                                    <div className="space-y-4 ml-2">
                                        {/* Step 1: Lookup */}
                                        <div className="p-4 bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                                                <Search size={16} />
                                                <h4 className="text-xs font-bold uppercase tracking-wider">Step 1: Find the Record</h4>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1">In Application</label>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full pl-3 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                                            value={formData.update_field_config.target_app}
                                                            onChange={e => setFormData({
                                                                ...formData,
                                                                update_field_config: {
                                                                    ...formData.update_field_config,
                                                                    target_app: e.target.value,
                                                                    field: ''
                                                                }
                                                            })}
                                                        >
                                                            {Object.keys(APP_FIELDS).map(app => <option key={app} value={app}>{app}</option>)}
                                                        </select>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                            <Database size={14} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1">Match Record By</label>
                                                    <select
                                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                                        value={formData.update_field_config.lookup_by}
                                                        onChange={e => setFormData({ ...formData, update_field_config: { ...formData.update_field_config, lookup_by: e.target.value } })}
                                                    >
                                                        <option value="email">📧 Email Address</option>
                                                        <option value="phone">📞 Phone Number</option>
                                                        <option value="name">👤 Full Name</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1">Search Value</label>
                                                <div className="relative">
                                                    {(() => {
                                                        const group = TRIGGER_GROUPS.find(g => g.triggers.includes(formData.trigger_event))?.group;
                                                        const tags = group ? TRIGGER_PAYLOAD_FIELDS[group] : [];
                                                        
                                                        if (tags && tags.length > 0) {
                                                            return (
                                                                <select
                                                                    required
                                                                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer appearance-none"
                                                                    value={formData.update_field_config.lookup_value}
                                                                    onChange={e => setFormData({ ...formData, update_field_config: { ...formData.update_field_config, lookup_value: e.target.value } })}
                                                                >
                                                                    <option value="">Select a tag...</option>
                                                                    {tags.map(tag => (
                                                                        <option key={tag.value} value={tag.value}>{tag.label} ({tag.value})</option>
                                                                    ))}
                                                                </select>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <input
                                                                required
                                                                type="text"
                                                                className="w-full pl-3 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-400"
                                                                placeholder="e.g. {{contact_email}}"
                                                                value={formData.update_field_config.lookup_value}
                                                                onChange={e => setFormData({ ...formData, update_field_config: { ...formData.update_field_config, lookup_value: e.target.value } })}
                                                            />
                                                        );
                                                    })()}
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 rounded pointer-events-none">
                                                        TAGS
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-center -my-2 relative z-10">
                                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-1.5 rounded-full shadow-sm text-gray-400">
                                                <ArrowRight size={14} className="rotate-90" />
                                            </div>
                                        </div>

                                        {/* Step 2: Update */}
                                        <div className="p-4 bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                            <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400">
                                                <Edit3 size={16} />
                                                <h4 className="text-xs font-bold uppercase tracking-wider">Step 2: Update Data</h4>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1">Field to Update</label>
                                                    <select
                                                        required
                                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                                                        value={formData.update_field_config.field}
                                                        onChange={e => setFormData({ ...formData, update_field_config: { ...formData.update_field_config, field: e.target.value, value: '' } })}
                                                    >
                                                        <option value="">Select field...</option>
                                                        {APP_FIELDS[formData.update_field_config.target_app as keyof typeof APP_FIELDS]?.map(f => (
                                                            <option key={f.value} value={f.value}>{f.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1">New Value</label>
                                                    <div className="relative">
                                                        {(() => {
                                                            const field = formData.update_field_config.field;
                                                            
                                                            // Specific dropdowns for certain fields
                                                            if (field === 'file_status') {
                                                                return (
                                                                    <select
                                                                        required
                                                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer appearance-none"
                                                                        value={formData.update_field_config.value}
                                                                        onChange={e => setFormData({ ...formData, update_field_config: { ...formData.update_field_config, value: e.target.value } })}
                                                                    >
                                                                        <option value="">Select status...</option>
                                                                        <option value="In progress">In progress</option>
                                                                        <option value="Closed">Closed</option>
                                                                        <option value="On hold">On hold</option>
                                                                        <option value="Not Set">Not Set</option>
                                                                    </select>
                                                                );
                                                            }
                                                            
                                                            if (field === 'visa_type') {
                                                                return (
                                                                    <select
                                                                        required
                                                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer appearance-none"
                                                                        value={formData.update_field_config.value}
                                                                        onChange={e => setFormData({ ...formData, update_field_config: { ...formData.update_field_config, value: e.target.value } })}
                                                                    >
                                                                        <option value="">Select visa type...</option>
                                                                        <option value="F1">F1 (Student)</option>
                                                                        <option value="J1">J1 (Exchange)</option>
                                                                        <option value="H1B">H1B (Work)</option>
                                                                        <option value="B1/B2">B1/B2 (Visitor)</option>
                                                                    </select>
                                                                );
                                                            }

                                                            if (field === 'status' || field === 'ds160_status') {
                                                                const statuses = formData.update_field_config.target_app === 'Visa Operations App' 
                                                                    ? ['Pending', 'Approved', 'Rejected', '221g', 'Slot Booked', 'DS-160 Submitted']
                                                                    : ['Applied', 'Review Started', 'On Hold', 'Acceptance Received', 'I20 Received', 'Rejected', 'Deferred'];
                                                                
                                                                return (
                                                                    <select
                                                                        required
                                                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer appearance-none"
                                                                        value={formData.update_field_config.value}
                                                                        onChange={e => setFormData({ ...formData, update_field_config: { ...formData.update_field_config, value: e.target.value } })}
                                                                    >
                                                                        <option value="">Select status...</option>
                                                                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                                    </select>
                                                                );
                                                            }

                                                            // Default text input with Tag support
                                                            const group = TRIGGER_GROUPS.find(g => g.triggers.includes(formData.trigger_event))?.group;
                                                            const tags = group ? TRIGGER_PAYLOAD_FIELDS[group] : [];

                                                            return (
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        required
                                                                        type="text"
                                                                        className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-gray-400"
                                                                        placeholder="e.g. {{new_status}} or Won"
                                                                        value={formData.update_field_config.value}
                                                                        onChange={e => setFormData({ ...formData, update_field_config: { ...formData.update_field_config, value: e.target.value } })}
                                                                    />
                                                                    {tags.length > 0 && (
                                                                        <select
                                                                            className="w-10 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-[10px] text-gray-500 cursor-pointer outline-none"
                                                                            value=""
                                                                            onChange={e => {
                                                                                if (e.target.value) {
                                                                                    setFormData({ 
                                                                                        ...formData, 
                                                                                        update_field_config: { 
                                                                                            ...formData.update_field_config, 
                                                                                            value: formData.update_field_config.value + e.target.value 
                                                                                        } 
                                                                                    });
                                                                                }
                                                                            }}
                                                                        >
                                                                            <option value="">{'{ }'}</option>
                                                                            {tags.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                                        </select>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
                            disabled={isSubmitting || (!formData.action_send_email && !formData.action_create_task && !formData.action_send_whatsapp && !formData.action_update_field)}
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
