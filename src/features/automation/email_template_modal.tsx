import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import * as api from '@/utils/api';

interface EmailTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: any;
    onSave: () => void;
}

const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({ isOpen, onClose, template, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: '',
        from_address: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDrafting, setIsDrafting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertText = (text: string) => {
        if (!textareaRef.current) return;

        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const currentBody = formData.body;

        const newBody = currentBody.substring(0, start) + text + currentBody.substring(end);

        setFormData({ ...formData, body: newBody });

        // Return focus and set cursor after the inserted text
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(start + text.length, start + text.length);
            }
        }, 0);
    };

    const insertFormatting = (openTag: string, closeTag: string) => {
        if (!textareaRef.current) return;

        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const currentBody = formData.body;
        const selectedText = currentBody.substring(start, end);

        const newText = openTag + selectedText + closeTag;
        const newBody = currentBody.substring(0, start) + newText + currentBody.substring(end);

        setFormData({ ...formData, body: newBody });

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                // If there was no selection, put cursor inside. If there was, put after.
                if (start === end) {
                    textareaRef.current.setSelectionRange(start + openTag.length, start + openTag.length);
                } else {
                    textareaRef.current.setSelectionRange(start + newText.length, start + newText.length);
                }
            }
        }, 0);
    };

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name,
                subject: template.subject,
                body: template.body,
                from_address: template.from_address || ''
            });
        }
    }, [template]);

    const handleAiDraft = async () => {
        const prompt = window.prompt("What should this email be about? (e.g. 'Welcome message for new student with fee details')");
        if (!prompt) return;

        setIsDrafting(true);
        try {
            const context = `Trigger: ${formData.name || 'CRM Automation'}`;
            const draft = await api.generateAutomationDraft(prompt, context);
            setFormData(prev => ({
                ...prev,
                subject: draft.subject,
                body: draft.body
            }));
        } catch (error: any) {
            alert(error.message || "Failed to generate AI draft");
        } finally {
            setIsDrafting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (template) {
                await api.updateEmailTemplate(template.id, formData);
            } else {
                await api.createEmailTemplate(formData);
            }

            onSave();
            onClose();
        } catch (error: any) {
            alert(error.message || 'Failed to save template');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {template ? 'Edit Email Template' : 'New Email Template'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
                        <input
                            required
                            type="text"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Lead Welcome Email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                        <input
                            required
                            type="text"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="e.g. Welcome {{contact_name}}!"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            From Address (Optional)
                        </label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={formData.from_address}
                            onChange={e => setFormData({ ...formData, from_address: e.target.value })}
                            placeholder="Leave blank to use system default"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Body (HTML & Formatting)</label>
                                <button
                                    type="button"
                                    onClick={handleAiDraft}
                                    disabled={isDrafting}
                                    className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold hover:bg-purple-200 transition-colors flex items-center gap-1"
                                >
                                    {isDrafting ? 'Drafting...' : '✨ AI Draft'}
                                </button>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => insertFormatting('<b>', '</b>')}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                                    title="Bold"
                                >
                                    <span className="font-bold">B</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertFormatting('<i>', '</i>')}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                                    title="Italic"
                                >
                                    <span className="italic">I</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertFormatting('<u>', '</u>')}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                                    title="Underline"
                                >
                                    <span className="underline">U</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => insertText('<br/>\n')}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 text-xs font-bold"
                                    title="New Line"
                                >
                                    ↵
                                </button>
                            </div>
                        </div>
                        <textarea
                            ref={textareaRef}
                            required
                            rows={8}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                            value={formData.body}
                            onChange={e => setFormData({ ...formData, body: e.target.value })}
                            placeholder="Type your email here..."
                        />

                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Click to insert fields:</p>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">👤 Contact & Lead</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['contact_name', 'first_name', 'contact_email', 'contact_phone', 'company_name', 'lead_source', 'lead_stage'].map(tag => (
                                            <button key={tag} type="button" onClick={() => insertText(`{{${tag}}}`)} className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded shadow-sm text-[10px] font-mono border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                                                {`{{${tag}}}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">🏢 Visitor Desk</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['visitor_name', 'visitor_phone', 'staff_name', 'visit_purpose', 'visit_action', 'visit_department', 'visit_number'].map(tag => (
                                            <button key={tag} type="button" onClick={() => insertText(`{{${tag}}}`)} className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded shadow-sm text-[10px] font-mono border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                                                {`{{${tag}}}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">🎟️ Tickets</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['ticket_id', 'subject', 'status', 'priority', 'client_name', 'client_email', 'created_at', 'solved_at'].map(tag => (
                                                <button key={tag} type="button" onClick={() => insertText(`{{${tag}}}`)} className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded shadow-sm text-[10px] font-mono border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                                                    {`{{${tag}}}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">🌍 Visa Ops</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['vop_number', 'visa_status', 'country'].map(tag => (
                                                <button key={tag} type="button" onClick={() => insertText(`{{${tag}}}`)} className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded shadow-sm text-[10px] font-mono border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                                                    {`{{${tag}}}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">🎓 University App</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['university_name', 'application_submission_date', 'ack_number', 'intake', 'program', 'student_portal_remark', 'application_status'].map(tag => (
                                                <button key={tag} type="button" onClick={() => insertText(`{{${tag}}}`)} className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded shadow-sm text-[10px] font-mono border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                                                    {`{{${tag}}}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">📚 LMS</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['course_name', 'course_price'].map(tag => (
                                                <button key={tag} type="button" onClick={() => insertText(`{{${tag}}}`)} className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded shadow-sm text-[10px] font-mono border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                                                    {`{{${tag}}}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">💰 Finance</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['transaction_id', 'amount', 'date', 'status'].map(tag => (
                                                <button key={tag} type="button" onClick={() => insertText(`{{${tag}}}`)} className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded shadow-sm text-[10px] font-mono border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                                                    {`{{${tag}}}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        {/* Empty column for layout balance */}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visual Preview:</h3>
                            <div
                                className="w-full p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50 min-h-[100px] text-sm dark:text-gray-200"
                                dangerouslySetInnerHTML={{
                                    __html: (formData.body || '').replace(/\n/g, '<br/>') || '<span class="text-gray-400 italic">Preview will appear here...</span>'
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-emerald-400"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmailTemplateModal;
