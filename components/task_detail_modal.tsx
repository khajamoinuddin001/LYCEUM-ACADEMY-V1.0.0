import React, { useState, useEffect } from 'react';
import type { TodoTask, User, TaskReply } from '../types';
import { X, MessageSquare, Send, Clock, Paperclip, FileText, UserPlus, MoreHorizontal, Eye, Edit, Trash2, Download } from './icons';
import { getStaffMembers } from '../utils/api';

interface TaskDetailModalProps {
    task: TodoTask | null;
    isOpen: boolean;
    onClose: () => void;
    onAddReply: (taskId: number, message: string, attachments?: File[]) => Promise<void>;
    onStatusChange: (task: TodoTask, newStatus: 'To Do' | 'In Progress' | 'Done') => void;
    onForwardTask: (task: TodoTask, newAssigneeId: number, newAssigneeName: string) => void;
    user: User;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
    task,
    isOpen,
    onClose,
    onAddReply,
    onStatusChange,
    onForwardTask,
    user
}) => {
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<number>(0);
    const [staff, setStaff] = useState<{ id: number; name: string; role: string; email: string }[]>([]);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
    const [editingReplyText, setEditingReplyText] = useState('');
    const [previewAttachment, setPreviewAttachment] = useState<{ name: string; url: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            getStaffMembers().then(setStaff).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen || !task) return null;

    const handleAddReply = async () => {
        if (!replyMessage.trim() && attachments.length === 0) return;

        setIsSubmitting(true);
        try {
            await onAddReply(task.id, replyMessage.trim(), attachments);
            setReplyMessage('');
            setAttachments([]);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkComplete = () => {
        onStatusChange(task, 'done' as any);
        onClose();
    };

    const handleForwardTask = () => {
        if (!selectedStaffId) {
            alert('Please select a staff member to forward to');
            return;
        }
        const selectedStaff = staff.find(s => s.id === selectedStaffId);
        if (selectedStaff) {
            onForwardTask(task, selectedStaffId, selectedStaff.name);
            setShowForwardModal(false);
            onClose();
        }
    };

    const handleSaveEdit = async () => {
        if (!editingReplyId || !editingReplyText.trim()) return;

        const updatedReplies = task.replies?.map(r =>
            r.id === editingReplyId ? { ...r, message: editingReplyText } : r
        ) || [];

        await onAddReply(task.id, '', []); // This will trigger a save
        // Update task with edited replies
        const updatedTask = { ...task, replies: updatedReplies };
        onStatusChange(updatedTask as any, task.status as any);

        setEditingReplyId(null);
        setEditingReplyText('');
    };

    const handleDeleteReply = async (replyId: number) => {
        if (!confirm('Delete this reply?')) return;

        const updatedReplies = task.replies?.filter(r => r.id !== replyId) || [];
        const updatedTask = { ...task, replies: updatedReplies };
        onStatusChange(updatedTask as any, task.status as any);
        setOpenMenuId(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments(prev => [...prev, ...files]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata'
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Low':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Done':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'In Progress':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    // Get actual names from staff list
    const getStaffName = (identifier: any) => {
        if (!identifier) return 'Unassigned';
        // If it's already a name (string), return it
        if (typeof identifier === 'string') return identifier;
        // If it's an ID, find the staff member
        const staffMember = staff.find(s => s.id === identifier);
        return staffMember ? staffMember.name : String(identifier);
    };

    const isAssignedToCurrentUser = task.assignedTo === user.id || task.assignedTo === user.name;
    const canReply = isAssignedToCurrentUser && task.status !== 'Done';

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col border border-gray-200 dark:border-gray-700" style={{ maxHeight: '70vh' }}>
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start flex-shrink-0">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {task.title}
                            </h2>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                                    {task.status}
                                </span>
                                {task.priority && (
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                                        {task.priority} Priority
                                    </span>
                                )}
                                {task.dueDate && (
                                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                        <Clock size={14} />
                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Description */}
                        {task.description && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                    {task.description}
                                </p>
                            </div>
                        )}

                        {/* Task Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Assigned To
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">{getStaffName(task.assignedTo)}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Assigned By
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">{getStaffName(task.assignedBy)}</p>
                            </div>
                        </div>

                        {/* Replies Section */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <MessageSquare size={16} />
                                Progress Updates & Remarks ({task.replies?.length || 0})
                            </h3>

                            {/* Replies List */}
                            <div className="space-y-3 mb-4">
                                {task.replies && task.replies.length > 0 ? (
                                    task.replies.map((reply) => (
                                        <div
                                            key={reply.id}
                                            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-lyceum-blue rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                                        {reply.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {reply.userName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatTimestamp(reply.timestamp)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Three-dot menu */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === reply.id ? null : reply.id)}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                    >
                                                        <MoreHorizontal size={16} className="text-gray-600 dark:text-gray-400" />
                                                    </button>
                                                    {openMenuId === reply.id && (
                                                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                                                            {reply.attachments && reply.attachments.length > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        setPreviewAttachment(reply.attachments![0]);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 rounded-t-lg"
                                                                >
                                                                    <Eye size={14} />
                                                                    Preview
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    setEditingReplyId(reply.id);
                                                                    setEditingReplyText(reply.message);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                                                            >
                                                                <Edit size={14} />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('Delete this reply?')) {
                                                                        // Handle delete
                                                                        const updatedReplies = task.replies?.filter(r => r.id !== reply.id) || [];
                                                                        onAddReply(task.id, '', []); // Trigger update
                                                                    }
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-red-600 dark:text-red-400 rounded-b-lg"
                                                            >
                                                                <Trash2 size={14} />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {editingReplyId === reply.id ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={editingReplyText}
                                                        onChange={(e) => setEditingReplyText(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                        rows={3}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="px-3 py-1 bg-lyceum-blue text-white rounded text-sm"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingReplyId(null);
                                                                setEditingReplyText('');
                                                            }}
                                                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">
                                                    {reply.message}
                                                </p>
                                            )}
                                            {reply.attachments && reply.attachments.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {reply.attachments.map((file, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setPreviewAttachment(file)}
                                                            className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-lyceum-blue dark:hover:text-lyceum-blue cursor-pointer w-full text-left"
                                                        >
                                                            <FileText size={14} />
                                                            <span className="underline">{file.name}</span>
                                                            <span className="text-gray-400">({formatFileSize(file.size)})</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                        No updates yet
                                    </p>
                                )}
                            </div>

                            {/* Add Reply Form */}
                            {canReply && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Add Progress Update (Optional)
                                    </label>
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Share progress, updates, or remarks about this task..."
                                        rows={3}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-lyceum-blue outline-none dark:text-white resize-none"
                                    />

                                    {/* File Upload */}
                                    <div className="mt-3">
                                        <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-fit">
                                            <Paperclip size={16} className="text-gray-600 dark:text-gray-400" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Attach Files (Optional)</span>
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                        </label>

                                        {/* Selected Files */}
                                        {attachments.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {attachments.map((file, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-600">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <FileText size={14} className="text-gray-600 dark:text-gray-400" />
                                                            <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
                                                            <span className="text-gray-400 text-xs">({formatFileSize(file.size)})</span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeAttachment(idx)}
                                                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleAddReply}
                                        disabled={(!replyMessage.trim() && attachments.length === 0) || isSubmitting}
                                        className="mt-3 px-4 py-2 bg-lyceum-blue text-white rounded-lg font-semibold hover:bg-lyceum-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Send size={16} />
                                        {isSubmitting ? 'Sending...' : 'Add Update'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer - Fixed */}
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => setShowForwardModal(true)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                            >
                                <UserPlus size={16} />
                                Forward Task
                            </button>
                        </div>
                        {canReply && (
                            <button
                                onClick={handleMarkComplete}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 transition-all active:scale-95"
                            >
                                Mark as Complete
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Forward Task Modal */}
            {showForwardModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Forward Task</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Reassign this task to another staff member
                            </p>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Select Staff Member
                            </label>
                            <select
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue outline-none dark:text-white"
                            >
                                <option value={0}>Select a staff member...</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.role}) - {s.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setShowForwardModal(false)}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleForwardTask}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-all"
                            >
                                Forward Task
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {previewAttachment && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setPreviewAttachment(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-4">{previewAttachment.name}</h3>
                            <div className="flex items-center gap-2">
                                <a
                                    href={previewAttachment.url}
                                    download={previewAttachment.name}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Download size={16} />
                                    Download
                                </a>
                                <button onClick={() => setPreviewAttachment(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            {(() => {
                                const fileName = previewAttachment.name.toLowerCase();
                                const isImage = fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/);
                                const isPDF = fileName.endsWith('.pdf');

                                if (isImage) {
                                    return (
                                        <div className="flex items-center justify-center min-h-[400px]">
                                            <img
                                                src={previewAttachment.url}
                                                alt={previewAttachment.name}
                                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = `
                                                            <div class="text-center">
                                                                <svg class="mx-auto mb-4 text-gray-400" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                                </svg>
                                                                <p class="text-gray-600 dark:text-gray-400 mb-4">Unable to load image preview</p>
                                                            </div>
                                                        `;
                                                    }
                                                }}
                                            />
                                        </div>
                                    );
                                } else if (isPDF) {
                                    return (
                                        <iframe
                                            src={previewAttachment.url}
                                            className="w-full h-[70vh] rounded-lg border border-gray-200 dark:border-gray-700"
                                            title={previewAttachment.name}
                                        />
                                    );
                                } else {
                                    return (
                                        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
                                            <FileText size={64} className="mx-auto mb-4 text-gray-400" />
                                            <p className="text-gray-600 dark:text-gray-400 mb-2 font-semibold">Preview not available for this file type</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                                                {fileName.match(/\.(\w+)$/)?.[1]?.toUpperCase() || 'Unknown'} files cannot be previewed in the browser
                                            </p>
                                            <a
                                                href={previewAttachment.url}
                                                download={previewAttachment.name}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-colors"
                                            >
                                                <Download size={18} />
                                                Download to View
                                            </a>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaskDetailModal;
