import React, { useState } from 'react';
import { Plus, Search, X, AlertCircle } from 'lucide-react';
import type { Ticket, User, Contact } from '../types';
import * as api from '../utils/api';

interface TicketsViewProps {
    tickets: Ticket[];
    onUpdate: () => void;
    user: User;
    contacts: Contact[];
}

const TicketsView: React.FC<TicketsViewProps> = ({ tickets, onUpdate, user, contacts }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{ticket.subject}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.description}</p>
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
                    }}
                    onUpdate={handleUpdateTicket}
                    user={user}
                />
            )}
        </div>
    );
};

// Ticket Detail Modal Component
interface TicketDetailModalProps {
    ticket: Ticket;
    onClose: () => void;
    onUpdate: (updates: Partial<Ticket>) => void;
    user: User;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose, onUpdate, user }) => {
    const [status, setStatus] = useState(ticket.status);
    const [priority, setPriority] = useState(ticket.priority);
    const [resolutionNotes, setResolutionNotes] = useState(ticket.resolutionNotes || '');

    const handleSave = () => {
        onUpdate({ status, priority, resolutionNotes });
    };

    const canEdit = user.role === 'Admin' || ticket.assignedTo === user.id;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ticket.ticketId}</h2>
                        <p className="text-sm text-gray-500">Created {new Date(ticket.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                        <p className="text-gray-900 dark:text-white font-semibold">{ticket.subject}</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
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
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 flex-shrink-0">
                                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                                    <polyline points="13 2 13 9 20 9" />
                                                </svg>
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

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact</label>
                            <p className="text-gray-900 dark:text-white">{ticket.contactName || 'Unknown'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created By</label>
                            <p className="text-gray-900 dark:text-white">{ticket.createdByName || 'Unknown'}</p>
                        </div>
                    </div>

                    {/* Status and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                disabled={!canEdit}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white disabled:opacity-50"
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                disabled={!canEdit}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white disabled:opacity-50"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Assigned To */}
                    {ticket.assignedToName && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
                            <p className="text-gray-900 dark:text-white">{ticket.assignedToName}</p>
                        </div>
                    )}

                    {/* Resolution Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resolution Notes</label>
                        <textarea
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            disabled={!canEdit}
                            rows={4}
                            placeholder="Add resolution notes..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Footer */}
                {canEdit && (
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketsView;
