
import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, Clock, Calendar, Plus, ArrowLeft, AlertCircle } from 'lucide-react';
import type { Contact, TodoTask, User } from '../types';
import TaskModal from './task_modal';
import * as api from '../utils/api';

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

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            case 'Medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
            case 'Low': return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
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
                            onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                            className="group flex items-center justify-between p-4 bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-lyceum-blue dark:hover:border-lyceum-blue"
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`mt-1 p-1 rounded-full ${task.status === 'Done' ? 'text-green-500 bg-green-50' : 'text-gray-300 bg-gray-100'}`}>
                                    <CheckCircle2 size={16} className={task.status === 'Done' ? 'fill-current' : ''} />
                                </div>
                                <div>
                                    <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${task.status === 'Done' ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>
                                        {task.title}
                                    </h3>
                                    {task.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{task.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center">
                                            <Calendar size={12} className="mr-1" />
                                            Due: {task.dueDate}
                                        </span>
                                        {task.assignedTo && (
                                            <span className="flex items-center bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                Assignee ID: {task.assignedTo}
                                            </span>
                                        )}
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

            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default ContactTasksView;
