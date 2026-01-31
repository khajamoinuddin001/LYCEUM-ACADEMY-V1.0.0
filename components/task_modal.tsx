import React, { useState, useEffect } from 'react';
import type { TodoTask, TaskPriority, TodoStatus, ActivityType } from '../types';
import { X, UserPlus, Calendar, AlertCircle, CheckCircle2 } from './icons';
import { getStaffMembers } from '../utils/api';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Partial<TodoTask>) => void;
    editTask: TodoTask | null;
    currentUserId: number;
    contacts: { id: number; name: string; email?: string }[];
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, editTask, currentUserId, contacts }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState<TodoStatus>('todo');
    const [priority, setPriority] = useState<TaskPriority>('Medium');
    const [assignedTo, setAssignedTo] = useState<number>(currentUserId);
    const [contactId, setContactId] = useState<number | ''>('');
    const [contactSearch, setContactSearch] = useState('');
    const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
    const [staff, setStaff] = useState<{ id: number; name: string; role: string }[]>([]);

    useEffect(() => {
        if (isOpen) {
            const fetchStaff = async () => {
                try {
                    const staffList = await getStaffMembers();
                    setStaff(staffList);
                } catch (error) {
                    console.error("Failed to fetch staff members", error);
                }
            };
            fetchStaff();

            if (editTask) {
                setTitle(editTask.title || '');
                setDescription(editTask.description || '');
                setDueDate(editTask.dueDate || '');
                setStatus(editTask.status || 'todo');
                setPriority(editTask.priority || 'Medium');
                setAssignedTo(editTask.assignedTo || currentUserId);
                setContactId(editTask.contactId || '');
                if (editTask.contactId) {
                    const linkedContact = contacts.find(c => c.id === editTask.contactId);
                    setContactSearch(linkedContact ? linkedContact.name : '');
                } else {
                    setContactSearch('');
                }
            } else {
                setTitle('');
                setDescription('');
                setDueDate(new Date().toISOString().split('T')[0]);
                setStatus('todo');
                setPriority('Medium');
                setAssignedTo(currentUserId);
                setContactId('');
                setContactSearch('');
            }
        }
    }, [isOpen, editTask, currentUserId]);

    const handleSave = () => {
        if (!title.trim() || !dueDate) {
            alert('Title and Due Date are required');
            return;
        }

        onSave({
            id: editTask?.id,
            title,
            description,
            dueDate,
            status,
            priority,
            assignedTo: Number(assignedTo),
            contactId: contactId ? Number(contactId) : undefined,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        {editTask ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Task Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Follow up on student visa"
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-lyceum-blue outline-none dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Add more details about the task..."
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-lyceum-blue outline-none dark:text-white resize-none"
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Related Contact / Student (Optional)</label>
                        <input
                            type="text"
                            value={contactSearch}
                            onChange={(e) => {
                                setContactSearch(e.target.value);
                                setIsContactDropdownOpen(true);
                                if (!e.target.value) setContactId('');
                            }}
                            onFocus={() => setIsContactDropdownOpen(true)}
                            placeholder="Type to search contact..."
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-lyceum-blue outline-none dark:text-white"
                        />
                        {isContactDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {contacts.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase()))).length > 0 ? (
                                    contacts.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase()))).map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => {
                                                setContactId(c.id);
                                                setContactSearch(c.name);
                                                setIsContactDropdownOpen(false);
                                            }}
                                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                                        >
                                            {c.name} {c.email ? <span className="text-gray-400 text-xs">({c.email})</span> : ''}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No contacts found</div>
                                )}
                            </div>
                        )}
                        {/* Overlay to close dropdown when clicking outside */}
                        {isContactDropdownOpen && (
                            <div className="fixed inset-0 z-0" onClick={() => setIsContactDropdownOpen(false)}></div>
                        )}
                    </div>
                    {/* Use a backdrop invisible div to handle closing logic better if needed, but simple blur or outside click is handled by the ui normally. For now, let's just use focus/click logic. Actually, a click outside listener is better but let's keep it simple first. The user asks for suggestion dropdown. */}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                        <div className="relative">
                            <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-lyceum-blue outline-none dark:text-white appearance-none"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <div className="relative">
                            <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TodoStatus)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-lyceum-blue outline-none dark:text-white appearance-none"
                            >
                                <option value="todo">To Do</option>
                                <option value="inProgress">In Progress</option>
                                <option value="done">Completed</option>
                            </select>
                        </div>
                    </div>
                </div>




                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-lyceum-blue text-white rounded-lg font-bold shadow-lg hover:shadow-lyceum-blue/30 hover:bg-lyceum-blue-dark transition-all active:scale-95"
                    >
                        {editTask ? 'Save Changes' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
