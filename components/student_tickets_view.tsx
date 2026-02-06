import React, { useState, useEffect } from 'react';
import { Plus, X, AlertCircle, Ticket as TicketIcon, Upload, File, Trash2 } from 'lucide-react';
import type { Ticket, Contact } from '../types';
import * as api from '../utils/api';

interface StudentTicketsViewProps {
    student: Contact;
}

const StudentTicketsView: React.FC<StudentTicketsViewProps> = ({ student }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setIsLoading(true);
            const data = await api.getTickets();
            setTickets(data);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading tickets...</div>
            </div>
        );
    }

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
                            onClick={() => setSelectedTicket(ticket)}
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
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-4">
                                    {ticket.assignedToName && (
                                        <span>Assigned to: <span className="font-medium text-gray-700 dark:text-gray-300">{ticket.assignedToName}</span></span>
                                    )}
                                    {!ticket.assignedToName && (
                                        <span className="text-yellow-600 dark:text-yellow-400">Awaiting assignment</span>
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
                        loadTickets();
                    }}
                />
            )}

            {/* View Ticket Modal */}
            {selectedTicket && (
                <ViewTicketModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                />
            )}
        </div>
    );
};

// Create Ticket Modal
interface CreateTicketModalProps {
    student: Contact;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ student, onClose, onSuccess }) => {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            // Limit to 5 files total
            if (attachments.length + newFiles.length > 5) {
                setError('Maximum 5 files allowed');
                return;
            }
            // Check file size (max 10MB per file)
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
                priority: 'Medium', // Default priority set by system
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
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Raise a Support Ticket</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
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

                    {/* File Upload Section */}
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

                            {/* File List */}
                            {attachments.length > 0 && (
                                <div className="space-y-2">
                                    {attachments.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <File size={16} className="text-blue-500 flex-shrink-0" />
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

                    {student.counselorAssigned && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <span className="font-semibold">Note:</span> This ticket will be automatically assigned to your counselor: <span className="font-semibold">{student.counselorAssigned}</span>
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
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

// View Ticket Modal (Student View - Read Only)
interface ViewTicketModalProps {
    ticket: Ticket;
    onClose: () => void;
}

const ViewTicketModal: React.FC<ViewTicketModalProps> = ({ ticket, onClose }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-100 text-blue-800';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800';
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'Closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ticket.ticketId}</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">Created {new Date(ticket.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                        <p className="text-gray-900 dark:text-white font-semibold text-lg">{ticket.subject}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded">
                            {ticket.description}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                        <p className="text-gray-900 dark:text-white">{ticket.assignedToName || 'Not assigned yet'}</p>
                    </div>

                    {/* Attachments */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</label>
                            <div className="space-y-2">
                                {ticket.attachments.map((attachment, index) => {
                                    const fileExtension = attachment.name.split('.').pop()?.toLowerCase();
                                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                                    const isPDF = fileExtension === 'pdf';
                                    const canPreview = isImage || isPDF;

                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <File size={20} className="text-blue-500 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                                        {attachment.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {(attachment.size / 1024).toFixed(2)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-3">
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
                                                                const response = await fetch(`http://localhost:5002/api/tickets/attachments/${attachment.id}`, {
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
                                                        className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors flex items-center gap-1"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                        Preview
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
                                                            const response = await fetch(`http://localhost:5002/api/tickets/attachments/${attachment.id}`, {
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
                                                    className="px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors flex items-center gap-1"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="7 10 12 15 17 10" />
                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                    </svg>
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {ticket.resolutionNotes && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                            <label className="block text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                                Resolution Notes
                            </label>
                            <p className="text-green-700 dark:text-green-300 whitespace-pre-wrap">{ticket.resolutionNotes}</p>
                        </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                        Last updated: {new Date(ticket.updatedAt).toLocaleString()}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentTicketsView;
