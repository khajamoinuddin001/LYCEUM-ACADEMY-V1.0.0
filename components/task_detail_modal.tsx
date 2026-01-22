import React, { useState } from 'react';
import type { TodoTask, User, TaskReply } from '../types';
import { X, MessageSquare, Send, Clock, User as UserIcon } from './icons';

interface TaskDetailModalProps {
    task: TodoTask | null;
    isOpen: boolean;
    onClose: () => void;
    onAddReply: (taskId: number, message: string) => void;
    onStatusChange: (task: TodoTask, newStatus: 'To Do' | 'In Progress' | 'Done') => void;
    user: User;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
    task,
    isOpen,
    onClose,
    onAddReply,
    onStatusChange,
    user
}) => {
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !task) return null;

    const handleAddReply = async () => {
        if (!replyMessage.trim()) return;

        setIsSubmitting(true);
        try {
            await onAddReply(task.id, replyMessage.trim());
            setReplyMessage('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkComplete = () => {
        onStatusChange(task, 'Done');
        onClose();
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata'
        });
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

    const isAssignedToCurrentUser = task.assignedTo === user.id || task.assignedTo === user.name;
    const canReply = isAssignedToCurrentUser && task.status !== 'Done';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
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

                {/* Content */}
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
                            <p className="text-gray-600 dark:text-gray-400">{task.assignedTo || 'Unassigned'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Assigned By
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">{task.assignedBy || 'Unknown'}</p>
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
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {reply.message}
                                        </p>
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
                                <button
                                    onClick={handleAddReply}
                                    disabled={!replyMessage.trim() || isSubmitting}
                                    className="mt-2 px-4 py-2 bg-lyceum-blue text-white rounded-lg font-semibold hover:bg-lyceum-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Send size={16} />
                                    {isSubmitting ? 'Sending...' : 'Add Update'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                        Close
                    </button>
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
    );
};

export default TaskDetailModal;
