import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, AlertCircle, Ticket as TicketIcon, Upload, Trash2, Paperclip, FileText } from 'lucide-react';
import type { Ticket, Contact, User } from '@/types';
import * as api from '@/utils/api';
import { API_BASE_URL } from '@/utils/api';
import { CheckCircle2, Clock } from '@/components/common/icons';

interface StudentTicketsViewProps {
    student: Contact;
    tickets: Ticket[];
    onNavigateToTask?: (taskId: number) => void;
}

const StudentTicketsView: React.FC<StudentTicketsViewProps> = ({ student, tickets: allTickets, onNavigateToTask }) => {
    // Filter tickets for this student
    const tickets = useMemo(() => allTickets.filter(t => t.contactId === student.id), [allTickets, student.id]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

    // Derived selected ticket to ensure it's always the latest version from props
    const selectedTicket = useMemo(() =>
        selectedTicketId ? tickets.find(t => t.id === selectedTicketId) || null : null
        , [selectedTicketId, tickets]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            case 'In Progress': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
            case 'Resolved': return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
            case 'Closed': return 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Low': return 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
            case 'Medium': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            case 'High': return 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
            case 'Urgent': return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Support Tickets</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Raise a ticket for any queries or issues
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Raise Ticket
                </button>
            </div>

            {/* Tickets List */}
            {tickets.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <TicketIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tickets yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Create your first support ticket to get help from your counselor
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        Raise Your First Ticket
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {ticket.ticketId}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{ticket.subject}</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                            {ticket.category || 'General Enquiry'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.description}</p>
                                    {ticket.attachments && (ticket.attachments as any).length > 0 && (
                                        <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 w-fit px-2 py-0.5 rounded-full">
                                            <Paperclip size={10} />
                                            {(ticket.attachments as any).length} {(ticket.attachments as any).length === 1 ? 'ATTACHMENT' : 'ATTACHMENTS'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-4">
                                    {(ticket.assignedToName || student.counselorAssigned || student.counselorAssigned2) && (
                                        <span>Assigned to: <span className="font-medium text-gray-700 dark:text-gray-300">{ticket.assignedToName || student.counselorAssigned || student.counselorAssigned2}</span></span>
                                    )}
                                    {!(ticket.assignedToName || student.counselorAssigned || student.counselorAssigned2) && (
                                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">Awaiting assignment</span>
                                    )}
                                </div>
                                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>

                            {ticket.resolutionNotes && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                    <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">Resolution:</p>
                                    <p className="text-sm text-green-700 dark:text-green-300">{ticket.resolutionNotes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Ticket Modal */}
            {isCreateModalOpen && (
                <CreateTicketModal
                    student={student}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                    }}
                />
            )}

            {/* View Ticket Modal */}
            {selectedTicket && (
                <ViewTicketModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicketId(null)}
                    onNavigateToTask={onNavigateToTask}
                    student={student}
                />
            )}
        </div>
    );
};

// Create Ticket Modal Component
interface CreateTicketModalProps {
    student: Contact;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ student, onClose, onSuccess }) => {
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('General Enquiry');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (attachments.length + newFiles.length > 5) {
                setError('Maximum 5 files allowed');
                return;
            }
            const oversizedFiles = newFiles.filter((file: File) => file.size > 10 * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                setError('Each file must be less than 10MB');
                return;
            }
            setAttachments([...attachments, ...newFiles]);
            setError('');
        }
    };

    const removeFile = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleSubmit = async () => {
        if (!subject.trim() || !description.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await api.createTicket({
                contactId: student.id!,
                subject: subject.trim(),
                description: description.trim(),
                category: category,
                priority: 'Medium',
            }, attachments.length > 0 ? attachments : undefined);
            onSuccess();
        } catch (err: any) {
            console.error('Error creating ticket:', err);
            setError(err.message || 'Failed to create ticket. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Raise a Support Ticket</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Subject *
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief description of your issue"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category *
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="University related">University related</option>
                            <option value="Embassy related">Embassy related</option>
                            <option value="Staff related">Staff related</option>
                            <option value="General enquiry">General enquiry</option>
                            <option value="Finance">Finance</option>
                            <option value="Sales">Sales</option>
                            <option value="Others">Others</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            placeholder="Provide detailed information about your query or issue..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Attachments (Optional)
                        </label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            PDF, PNG, JPG, DOC (Max 10MB per file, up to 5 files)
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>

                            {attachments.length > 0 && (
                                <div className="space-y-2">
                                    {attachments.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <FileText size={16} className="text-blue-500 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatFileSize(file.size)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {(student.counselorAssigned || student.counselorAssigned2) && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <span className="font-semibold">Note:</span> This ticket will be handled by your counselor: <span className="font-semibold">{student.counselorAssigned || student.counselorAssigned2}</span>
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// View Ticket Modal Component
interface ViewTicketModalProps {
    ticket: Ticket;
    onClose: () => void;
    onNavigateToTask?: (taskId: number) => void;
    student: Contact;
}

const ViewTicketModal: React.FC<ViewTicketModalProps> = ({ ticket, onClose, onNavigateToTask, student }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messages, setMessages] = useState<any[]>(ticket.messages || []);

    const fetchMessages = async () => {
        try {
            const freshMessages = await api.getTicketMessages(ticket.id);
            setMessages(freshMessages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    // Initial fetch and polling
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000); // Poll every 2 seconds
        return () => clearInterval(interval);
    }, [ticket.id]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        setIsSendingMessage(true);
        try {
            const result = await api.sendTicketMessage(ticket.id, newMessage.trim());
            setMessages(prev => [...prev, result]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
        } finally {
            setIsSendingMessage(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            case 'In Progress': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
            case 'Resolved': return 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
            case 'Closed': return 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Low': return 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
            case 'Medium': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            case 'High': return 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
            case 'Urgent': return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(ticket.status)}`}>
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-gray-500">{ticket.ticketId}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded ml-2">
                                    {ticket.category || 'General Enquiry'}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{ticket.subject}</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-[Inter]">Original Request</label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed shadow-sm">
                            {ticket.description}
                        </div>
                    </div>

                    {ticket.attachments && (ticket.attachments as any).length > 0 && (
                        <div className="animate-in slide-in-from-left-4 duration-500">
                            <div className="flex items-center gap-2 mb-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attachments</label>
                                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded text-[10px] font-bold">{(ticket.attachments as any).length}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {((ticket.attachments as any) || []).map((attachment: any, index: number) => {
                                    const fileExtension = attachment.name.split('.').pop()?.toLowerCase();
                                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                                    const isPDF = fileExtension === 'pdf';
                                    const canPreview = isImage || isPDF;

                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all group shadow-sm"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                                        {attachment.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {(attachment.size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100">
                                                {canPreview && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const token = localStorage.getItem('authToken');
                                                                let authToken = '';
                                                                if (token) {
                                                                    try {
                                                                        const parsed = JSON.parse(token);
                                                                        authToken = parsed.token;
                                                                    } catch (e) {
                                                                        authToken = token;
                                                                    }
                                                                }
                                                                const response = await fetch(`${API_BASE_URL}/tickets/attachments/${attachment.id}`, {
                                                                    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
                                                                });
                                                                const blob = await response.blob();
                                                                const url = window.URL.createObjectURL(blob);
                                                                window.open(url, '_blank');
                                                            } catch (error) {
                                                                console.error('Preview failed:', error);
                                                                alert('Failed to preview file');
                                                            }
                                                        }}
                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const token = localStorage.getItem('authToken');
                                                            let authToken = '';
                                                            if (token) {
                                                                try {
                                                                    const parsed = JSON.parse(token);
                                                                    authToken = parsed.token;
                                                                } catch (e) {
                                                                    authToken = token;
                                                                }
                                                            }
                                                            const response = await fetch(`${API_BASE_URL}/tickets/attachments/${attachment.id}`, {
                                                                headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
                                                            });
                                                            const blob = await response.blob();
                                                            const url = window.URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = attachment.name;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            window.URL.revokeObjectURL(url);
                                                            document.body.removeChild(a);
                                                        } catch (error) {
                                                            console.error('Download failed:', error);
                                                            alert('Failed to download file');
                                                        }
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-green-500 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="7 10 12 15 17 10" />
                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-[Inter]">Handling Specialist</label>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${(ticket.assignedToName || student.counselorAssigned || student.counselorAssigned2) ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                            {ticket.assignedToName || student.counselorAssigned || student.counselorAssigned2 || 'Awaiting Counselor Assignment'}
                        </p>
                    </div>

                    {ticket.linkedTasks && ticket.linkedTasks.filter(t => t.isVisibleToStudent).length > 0 && (
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 font-[Inter]">Related Actions</h3>
                            <div className="space-y-2">
                                {ticket.linkedTasks.filter(t => t.isVisibleToStudent).map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => onNavigateToTask?.(task.id)}
                                        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-blue-200 transition-all group cursor-pointer"
                                    >
                                        <div className={`p-2 rounded-lg ${task.status === 'Done' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {task.status === 'Done' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono font-bold text-blue-600">{task.taskId}</span>
                                                <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{task.title}</h4>
                                            </div>
                                            <span className={`inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] font-bold ${task.status === 'Done' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <div className="p-1 px-2 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            VIEW TASK
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 font-[Inter]">Conversation</label>
                        <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                            {messages.length > 0 ? messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.senderId === student.userId ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-[10px] font-bold text-gray-500">{msg.senderName}</span>
                                        <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${msg.senderId === student.userId
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                        }`}>
                                        {msg.message}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-400 italic text-xs bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                    No messages yet. Send a message to your counselor below.
                                </div>
                            )}
                        </div>
                        {['Resolved', 'Closed'].includes(ticket.status) ? (
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-center text-sm text-gray-500 italic border border-gray-200 dark:border-gray-700">
                                This ticket is {ticket.status.toLowerCase()}. No further messages can be sent.
                            </div>
                        ) : (
                            <div className="flex gap-2 p-1 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <input
                                    type="text"
                                    placeholder="Type a message to counselor..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 px-4 py-2.5 bg-transparent text-sm outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isSendingMessage || !newMessage.trim()}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20"
                                >
                                    Send
                                </button>
                            </div>
                        )}
                    </div>

                    {ticket.resolutionNotes && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <label className="block text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest mb-1.5 font-[Inter]">Final Resolution</label>
                            <p className="text-sm text-green-800 dark:text-green-200 font-medium">{ticket.resolutionNotes}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-xl text-xs font-bold hover:bg-black dark:hover:bg-gray-600 transition-all active:scale-95 shadow-lg shadow-gray-900/10"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentTicketsView;
