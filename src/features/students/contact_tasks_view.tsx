
import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, Clock, Calendar, Plus, ArrowLeft, AlertCircle } from 'lucide-react';
import type { Contact, TodoTask, User } from '@/types';
import TaskModal from '@/features/tasks/task_modal';
import TaskDetailModal from '@/features/tasks/task_detail_modal';
import * as api from '@/utils/api';

interface ContactTasksViewProps {
    contact: Contact;
    tasks: TodoTask[]; // Keep for compatibility but won't use
    user: User;
    onNavigateBack: () => void;
    onSaveTask: (task: Partial<TodoTask>) => Promise<void>;
}

const ContactTasksView: React.FC<ContactTasksViewProps> = ({ contact, user, onNavigateBack, onSaveTask }) => {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
    const [contactTasks, setContactTasks] = useState<TodoTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TodoTask | null>(null);

    // Fetch ALL tasks for this contact (visible to all staff)
    const fetchContactTasks = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const tasks = await api.getTasks({ contactId: contact.id });
            setContactTasks(tasks.sort((a, b) => {
                if (a.status === 'Done' && b.status !== 'Done') return 1;
                if (a.status !== 'Done' && b.status === 'Done') return -1;
                return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
            }));
        } catch (error) {
            console.error('Failed to fetch contact tasks:', error);
        } finally {
            setIsLoading(false);
        }
    }, [contact.id]);

    useEffect(() => {
        fetchContactTasks();
    }, [fetchContactTasks]);


    const handleSave = async (taskData: Partial<TodoTask>) => {
        // Inject contactId
        const finalTask = { ...taskData, contactId: contact.id };
        await onSaveTask(finalTask);
        // Refresh tasks after save
        await fetchContactTasks();
        setIsTaskModalOpen(false);
        setEditingTask(null);
    };

    const handleTaskClick = (task: TodoTask) => {
        setSelectedTaskForDetail(task);
        setIsDetailModalOpen(true);
    };

    const handleEditFromDetail = (task: TodoTask) => {
        setIsDetailModalOpen(false);
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleAddReply = async (taskId: number, message: string, attachments?: File[]) => {
        // In a real app, process attachments properly. For now we use simpler logic or call api.
        // Re-using logic from TasksView or similar if available, otherwise just use api.
        try {
            // Process attachments logic (simplified here)
            const processedAttachments = attachments?.map(file => ({
                name: file.name,
                url: URL.createObjectURL(file), // Mock URL
                size: file.size
            })) || [];

            const task = contactTasks.find(t => t.id === taskId);
            if (!task) return;

            const newReply = {
                id: Date.now(),
                taskId,
                userId: user.id,
                userName: user.name,
                message,
                timestamp: new Date().toISOString(),
                attachments: processedAttachments.length > 0 ? processedAttachments : undefined
            };

            const updatedTask = {
                ...task,
                replies: [...(task.replies || []), newReply]
            };

            await onSaveTask(updatedTask);
            await fetchContactTasks();

            // Update selected task for detail modal to show new reply
            const refreshedTask = (await api.getTasks({ contactId: contact.id })).find(t => t.id === taskId);
            if (refreshedTask) setSelectedTaskForDetail(refreshedTask);

        } catch (error) {
            console.error('Failed to add reply:', error);
        }
    };

    const handleStatusChange = async (task: TodoTask, newStatus: any) => {
        try {
            await onSaveTask({ ...task, status: newStatus });
            await fetchContactTasks();
            setIsDetailModalOpen(false);
        } catch (error) {
            console.error('Failed to change status:', error);
        }
    };

    const handleForwardTask = async (task: TodoTask, newAssigneeId: number, newAssigneeName: string) => {
        try {
            await onSaveTask({ ...task, assignedTo: newAssigneeId, status: 'To Do' as any });
            await fetchContactTasks();
            setIsDetailModalOpen(false);
        } catch (error) {
            console.error('Failed to forward task:', error);
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'Medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
            case 'Low': return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    const handleToggleVisibility = async (task: TodoTask, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedVisibility = !task.isVisibleToStudent;
        try {
            // Optimistic update
            setContactTasks(prev => prev.map(t => t.id === task.id ? { ...t, isVisibleToStudent: updatedVisibility } : t));

            await onSaveTask({
                ...task,
                isVisibleToStudent: updatedVisibility
            });
        } catch (error) {
            console.error('Failed to update task visibility:', error);
            // Revert on error
            setContactTasks(prev => prev.map(t => t.id === task.id ? { ...t, isVisibleToStudent: !updatedVisibility } : t));
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm w-full mx-auto animate-fade-in p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button
                        onClick={onNavigateBack}
                        className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Tasks: {contact.name}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage tasks linked to this contact</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                    className="flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-colors shadow-sm"
                >
                    <Plus size={18} className="mr-2" />
                    New Task
                </button>
            </div>



            <div className="space-y-3">
                {contactTasks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                        <CheckCircle2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No tasks found</h3>
                        <p className="text-gray-500 dark:text-gray-400">No tasks created for this contact.</p>
                    </div>
                ) : (
                    contactTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className="group flex items-center justify-between p-4 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-lyceum-blue dark:hover:border-lyceum-blue"
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`mt-1 p-1 rounded-full ${task.status === 'Done' ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-gray-300 bg-gray-100 dark:bg-gray-700 dark:text-gray-500'}`}>
                                    <CheckCircle2 size={16} className={task.status === 'Done' ? 'fill-current' : ''} />
                                </div>
                                <div>
                                    <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${task.status === 'Done' ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>
                                        {task.title}
                                    </h3>
                                    {task.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{task.description}</p>
                                    )}
                                    <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
                                        <span className="flex items-center">
                                            <Calendar size={12} className="mr-1" />
                                            Due: {task.dueDate}
                                        </span>
                                        {task.assignedTo && (
                                            <span className="flex items-center px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                Assignee ID: {task.assignedTo}
                                            </span>
                                        )}
                                        {/* Duration Display */}
                                        <span className="flex items-center text-blue-600 dark:text-blue-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            {(() => {
                                                const start = new Date(task.createdAt || Date.now()).getTime();
                                                const end = task.status === 'Done' || task.status === 'done'
                                                    ? (task.completedAt ? new Date(task.completedAt).getTime() : Date.now()) // Use completedAt if available, else now (fallback)
                                                    : Date.now();
                                                const diff = end - start;

                                                if (diff < 0) return 'Just now';

                                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                                                if (task.status === 'Done' || task.status === 'done') {
                                                    return `${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m taken`;
                                                }
                                                return `${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m elapsed`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                                    {task.priority || 'Medium'}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {task.status}
                                </span>

                                <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={(e) => handleToggleVisibility(task, e)}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${task.isVisibleToStudent ? 'bg-lyceum-blue' : 'bg-gray-200 dark:bg-gray-700'}`}
                                        title={task.isVisibleToStudent ? "Visible to Student" : "Hidden from Student"}
                                    >
                                        <span className="sr-only">Use setting</span>
                                        <span
                                            aria-hidden="true"
                                            className={`${task.isVisibleToStudent ? 'translate-x-4' : 'translate-x-0'}
                                                    pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                                        />
                                    </button>
                                    <span className="text-[10px] text-gray-400">
                                        {task.isVisibleToStudent ? 'Visible' : 'Hidden'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={handleSave}
                editTask={editingTask}
                currentUserId={user.id}
                contacts={[contact]}
            />

            <TaskDetailModal
                task={selectedTaskForDetail}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                onAddReply={handleAddReply}
                onStatusChange={handleStatusChange}
                onForwardTask={handleForwardTask}
                onEdit={handleEditFromDetail}
                user={user}
            />

            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div >
    );
};

export default ContactTasksView;
