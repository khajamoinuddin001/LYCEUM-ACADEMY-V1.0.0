import React, { useState } from 'react';
import { Search, X, AlertCircle, Trash2, Paperclip, FileText } from 'lucide-react';
import type { Ticket, User, Contact } from '@/types';
import * as api from '@/utils/api';
import { API_BASE_URL } from '@/utils/api';
import TaskModal from '@/features/tasks/task_modal';
import { UserPlus, Link as LinkIcon, CheckCircle2, Clock, AlertCircle as AlertIcon } from '@/components/common/icons';

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

interface TicketsViewProps {
    tickets: Ticket[];
    onUpdate: () => void;
    user: User;
    users: User[];
    contacts: Contact[];
    onNavigateToTask?: (taskId: number) => void;
    preSelectedTicketId?: number | null;
    onClearPreSelectedTicket?: () => void;
}

const TicketsView: React.FC<TicketsViewProps> = ({ tickets, onUpdate, user, users, contacts, onNavigateToTask, preSelectedTicketId, onClearPreSelectedTicket }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [prefilledTask, setPrefilledTask] = useState<any>(null);

    // Expose task creation trigger for the detail modal
    React.useEffect(() => {
        (window as any).dispatchCreateTaskFromTicket = (data: any) => {
            setPrefilledTask(data);
            setIsTaskModalOpen(true);
        };
        return () => {
            delete (window as any).dispatchCreateTaskFromTicket;
        };
    }, []);

    // Handle pre-selected ticket from dashboard
    React.useEffect(() => {
        if (preSelectedTicketId && tickets.length > 0) {
            const ticketToOpen = tickets.find(t => t.id === preSelectedTicketId);
            if (ticketToOpen) {
                setSelectedTicket(ticketToOpen);
                setIsModalOpen(true);
            }
        }
    }, [preSelectedTicketId, tickets]);

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.contactName?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-blue-100 text-blue-800';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800';
            case 'Resolved': return 'bg-green-100 text-green-800';
            case 'Closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Urgent': return 'bg-red-100 text-red-800';
            case 'High': return 'bg-orange-100 text-orange-800';
            case 'Medium': return 'bg-yellow-100 text-yellow-800';
            case 'Low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleViewTicket = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
    };

    const handleUpdateTicket = async (updates: Partial<Ticket>) => {
        if (!selectedTicket) return;

        try {
            await api.updateTicket(selectedTicket.id, updates);
            onUpdate();
            setIsModalOpen(false);
            setSelectedTicket(null);
        } catch (error) {
            console.error('Error updating ticket:', error);
            alert('Failed to update ticket');
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets</h1>
                    <div className="text-sm text-gray-500">
                        {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="all">All Status</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>

                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="all">All Priority</option>
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
            </div>

            {/* Tickets List */}
            <div className="flex-1 overflow-auto p-4">
                {filteredTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <AlertCircle size={48} className="mb-4" />
                        <p>No tickets found</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                onClick={() => handleViewTicket(ticket)}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                {ticket.ticketId}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded ml-1">
                                                {ticket.category || 'General Enquiry'}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{ticket.subject}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.description}</p>
                                        {ticket.attachments && (ticket.attachments as any).length > 0 && (
                                            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 w-fit px-2 py-0.5 rounded-full">
                                                <Paperclip size={10} />
                                                {(ticket.attachments as any).length} {(ticket.attachments as any).length === 1 ? 'ATTACHMENT' : 'ATTACHMENTS'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-4">
                                        <span>Contact: <span className="font-medium">{ticket.contactName || 'Unknown'}</span></span>
                                        {ticket.assignedToName && (
                                            <span>Assigned to: <span className="font-medium">{ticket.assignedToName}</span></span>
                                        )}
                                    </div>
                                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Ticket Detail Modal */}
            {isModalOpen && selectedTicket && (
                <TicketDetailModal
                    ticket={selectedTicket}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedTicket(null);
                        onClearPreSelectedTicket?.();
                    }}
                    onUpdateTicket={handleUpdateTicket}
                    onRefresh={onUpdate}
                    user={user}
                    users={users}
                    contacts={contacts}
                    onNavigateToTask={onNavigateToTask}
                />
            )}

            {isTaskModalOpen && (
                <TaskModal
                    isOpen={isTaskModalOpen}
                    onClose={() => {
                        setIsTaskModalOpen(false);
                        setPrefilledTask(null);
                    }}
                    onSave={async (taskData) => {
                        try {
                            await api.saveTask(taskData);
                            setIsTaskModalOpen(false);
                            setPrefilledTask(null);
                            onUpdate(); // Refresh tickets to show linked task
                        } catch (error) {
                            console.error('Failed to save task:', error);
                            alert('Failed to create task');
                        }
                    }}
                    editTask={prefilledTask as any}
                    currentUserId={user.id}
                    contacts={contacts}
                />
            )}
        </div>
    );
};

// Ticket Detail Modal Component
interface TicketDetailModalProps {
    ticket: Ticket;
    onClose: () => void;
    onUpdateTicket: (updates: Partial<Ticket>) => void;
    onRefresh: () => void;
    user: User;
    users: User[];
    contacts: Contact[];
    onNavigateToTask?: (taskId: number) => void;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose, onUpdateTicket, onRefresh, user, users, onNavigateToTask }) => {
    const [status, setStatus] = useState(ticket.status);
    const [priority, setPriority] = useState(ticket.priority);
    const [category, setCategory] = useState(ticket.category || 'General Enquiry');
    const [assignedTo, setAssignedTo] = useState<number | undefined>(ticket.assignedTo);
    const [resolutionNotes, setResolutionNotes] = useState(ticket.resolutionNotes || '');
    const [isLinkingTask, setIsLinkingTask] = useState(false);
    const [linkTaskId, setLinkTaskId] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messages, setMessages] = useState(ticket.messages || []);

    const fetchMessages = async () => {
        try {
            const freshMessages = await api.getTicketMessages(ticket.id);
            setMessages(freshMessages);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    // Initial fetch and polling every 2 seconds
    React.useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
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

    const handleDeleteTicket = async () => {
        if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
        try {
            await api.deleteTicket(ticket.id);
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Failed to delete ticket:', error);
            alert('Failed to delete ticket');
        }
    };

    const handleSave = () => {
        onUpdateTicket({ status, priority, assignedTo, resolutionNotes, category });
    };

    const handleLinkTask = async () => {
        if (!linkTaskId.trim()) return;
        try {
            await api.linkTaskToTicket(ticket.id, linkTaskId.trim());
            setIsLinkingTask(false);
            setLinkTaskId('');
            onRefresh();
        } catch (error: any) {
            console.error('Failed to link task:', error);
            alert(error.message || 'Failed to link task');
        }
    };

    const handleUnlinkTask = async (taskId: number) => {
        if (!confirm('Are you sure you want to unlink this task from the ticket?')) return;
        try {
            await api.unlinkTaskFromTicket(ticket.id, taskId);
            onRefresh();
        } catch (error: any) {
            console.error('Failed to unlink task:', error);
            alert(error.message || 'Failed to unlink task');
        }
    };

    const canEdit = user.role === 'Admin' || user.role === 'Staff' || ticket.assignedTo === user.id;
    const isAdmin = user.role === 'Admin';
    const isClosed = ['Resolved', 'Closed'].includes(ticket.status);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
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
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <button
                                onClick={handleDeleteTicket}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete Ticket"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Problem Description</label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {ticket.description}
                        </div>
                    </div>

                    {/* Attachments Section */}
                    {ticket.attachments && (ticket.attachments as any).length > 0 && (
                        <div className="animate-in slide-in-from-left-4 duration-500">
                            <div className="flex items-center gap-2 mb-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Attachments</label>
                                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded text-[10px] font-bold">{(ticket.attachments as any).length}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(ticket.attachments as any).map((attachment: any, index: number) => {
                                    const fileExtension = attachment.name.split('.').pop()?.toLowerCase();
                                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                                    const isPDF = fileExtension === 'pdf';
                                    const canPreview = isImage || isPDF;

                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg hover:border-blue-200 transition-all group"
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
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
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
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded"
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

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</label>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                {ticket.contactName || 'Unknown'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Created By</label>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                {ticket.createdByName || 'Internal'}
                            </p>
                        </div>
                    </div>

                    {/* Task Integration Section */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Related Tasks</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        (window as any).dispatchCreateTaskFromTicket?.({
                                            title: `Ticket: ${ticket.subject}`,
                                            description: `Related to Ticket ${ticket.ticketId}:\n${ticket.description}`,
                                            contactId: ticket.contactId,
                                            ticketId: ticket.id,
                                            isVisibleToStudent: true
                                        });
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-md text-[10px] font-bold hover:bg-blue-100 transition-colors"
                                >
                                    <UserPlus size={14} />
                                    New Task
                                </button>
                                <button
                                    onClick={() => setIsLinkingTask(!isLinkingTask)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md text-[10px] font-bold hover:bg-gray-100 transition-colors"
                                >
                                    <LinkIcon size={14} />
                                    Link Existing
                                </button>
                            </div>
                        </div>

                        {isLinkingTask && (
                            <div className="mb-4 flex gap-2 animate-in slide-in-from-top-2 duration-200">
                                <input
                                    type="text"
                                    placeholder="Enter Task ID (e.g. TSK-12345)"
                                    value={linkTaskId}
                                    onChange={(e) => setLinkTaskId(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-900 dark:text-white"
                                />
                                <button
                                    onClick={handleLinkTask}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Link
                                </button>
                            </div>
                        )}

                        <div className="space-y-2">
                            {ticket.linkedTasks && ticket.linkedTasks.length > 0 ? (
                                ticket.linkedTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-sm hover:border-gray-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => onNavigateToTask?.(task.id)}>
                                            <div className={`p-2 rounded-lg ${task.status === 'Done' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {task.status === 'Done' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono font-bold text-lyceum-blue">{task.taskId}</span>
                                                    <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">{task.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                                                    <span className={`px-1.5 py-0.5 rounded ${task.status === 'Done' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                                                        {task.status}
                                                    </span>
                                                    {task.isVisibleToStudent && (
                                                        <span className="flex items-center gap-0.5 text-blue-500">
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                            Visible to Student
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUnlinkTask(task.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Unlink Task"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 bg-gray-50 dark:bg-gray-900/30 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                    <AlertIcon size={24} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">No linked tasks</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messaging Section - NEW */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Messages</label>
                        <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto p-2">
                            {messages.length > 0 ? messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-[10px] font-bold text-gray-500">{msg.senderName}</span>
                                        <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.senderId === user.id
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                        }`}>
                                        {msg.message}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-400 italic text-xs">No messages yet</div>
                            )}
                        </div>
                        {isClosed ? (
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-center text-sm text-gray-500 italic border border-gray-200 dark:border-gray-700">
                                This ticket is {ticket.status.toLowerCase()}. No further messages can be sent.
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isSendingMessage || !newMessage.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    Send
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Status, Priority and Category Integration */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                disabled={!canEdit}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Set Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                disabled={!canEdit}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                disabled={!canEdit}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
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
                    </div>

                    {isAdmin && (
                        <div className="space-y-1.5 pt-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assign Counselor (Admin Only)</label>
                            <select
                                value={assignedTo || ''}
                                onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="">Awaiting Assignment</option>
                                {users
                                    .filter(u => u.role !== 'Student')
                                    .map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))
                                }
                            </select>
                        </div>
                    )}

                    {/* Resolution Notes - Updated to one-line as requested */}
                    <div className="space-y-1.5 pb-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resolution Summary</label>
                        <input
                            type="text"
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            disabled={!canEdit}
                            placeholder="Briefly describe the resolution..."
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                {/* Footer */}
                {canEdit && (
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onUpdateTicket({ status, priority, assignedTo, resolutionNotes, category })}
                            className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            Update Ticket
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketsView;
