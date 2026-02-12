import React, { useState, useEffect } from 'react';
import { getStaffMembers, getTaskLogs } from '@/utils/api';
import type { TodoTask, TaskPriority, TodoStatus, ActivityType, TaskTimeLog } from '@/types';
import { X, UserPlus, Calendar, AlertCircle, CheckCircle2, Clock } from '@/components/common/icons';

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
    const [isVisibleToStudent, setIsVisibleToStudent] = useState(false);
    const [staff, setStaff] = useState<{ id: number; name: string; role: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    const [logs, setLogs] = useState<TaskTimeLog[]>([]);
    const [taskDuration, setTaskDuration] = useState<string>('');
    const [ticketId, setTicketId] = useState<number | undefined>(undefined);

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

            if (editTask && editTask.id) {
                // Fetch logs
                getTaskLogs(editTask.id).then(fetchedLogs => {
                    setLogs(fetchedLogs);
                    // Calculate duration
                    if (fetchedLogs.length > 0) {
                        const start = new Date(fetchedLogs[0].startTime).getTime();
                        const end = fetchedLogs[fetchedLogs.length - 1].endTime ? new Date(fetchedLogs[fetchedLogs.length - 1].endTime!).getTime() : Date.now();
                        const diff = end - start;
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        setTaskDuration(`${days}d ${hours}h ${minutes}m`);
                    }
                });

                setTitle(editTask.title || '');
                setDescription(editTask.description || '');
                setDueDate(editTask.dueDate || '');
                setStatus(editTask.status || 'todo');
                setPriority(editTask.priority || 'Medium');
                setAssignedTo(editTask.assignedTo || currentUserId);
                setContactId(editTask.contactId || '');
                setIsVisibleToStudent(editTask.isVisibleToStudent || false);
                setTicketId(editTask.ticketId);
                if (editTask.contactId) {
                    const linkedContact = contacts.find(c => c.id === editTask.contactId);
                    setContactSearch(linkedContact ? linkedContact.name : '');
                } else {
                    setContactSearch('');
                }
            } else {
                setTitle(editTask?.title || '');
                setDescription(editTask?.description || '');
                setDueDate(editTask?.dueDate || new Date().toISOString().split('T')[0]);
                setStatus(editTask?.status || 'todo');
                setPriority(editTask?.priority || 'Medium');
                setAssignedTo(editTask?.assignedTo || currentUserId);
                setContactId(editTask?.contactId || '');
                setTicketId(editTask?.ticketId);
                setIsVisibleToStudent(editTask?.isVisibleToStudent || false);

                if (editTask?.contactId) {
                    const linkedContact = contacts.find(c => c.id === editTask.contactId);
                    setContactSearch(linkedContact ? linkedContact.name : '');
                } else {
                    setContactSearch('');
                }

                setLogs([]);
                setTaskDuration('');
            }
            setActiveTab('details');
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
            isVisibleToStudent,
            ticketId
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            {editTask ? 'Edit Task' : 'Create New Task'}
                            {taskDuration && <span className="text-xs font-normal px-2 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 flex items-center gap-1"><Clock size={12} /> {taskDuration} elapsed</span>}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {editTask && (
                    <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 shrink-0">
                        <button
                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Details
                        </button>
                        <button
                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            onClick={() => setActiveTab('history')}
                        >
                            Timeline & History
                        </button>
                    </div>
                )}

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {activeTab === 'details' ? (
                        <>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Due Date <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-lyceum-blue outline-none dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
                                    <div className="relative">
                                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <select
                                            value={assignedTo}
                                            onChange={(e) => setAssignedTo(Number(e.target.value))}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-lyceum-blue outline-none dark:text-white appearance-none"
                                        >
                                            {staff.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
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
                                {isContactDropdownOpen && (
                                    <div className="fixed inset-0 z-0" onClick={() => setIsContactDropdownOpen(false)}></div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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

                            <div className="flex items-center px-1 py-2">
                                <label className="flex items-center cursor-pointer relative">
                                    <input
                                        type="checkbox"
                                        checked={isVisibleToStudent}
                                        onChange={(e) => setIsVisibleToStudent(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-lyceum-blue"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Visible to Student Portal</span>
                                </label>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            {logs.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No history available for this task.</p>
                            ) : (
                                <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
                                    {logs.map((log) => {
                                        const startDate = new Date(log.startTime);
                                        const endDate = log.endTime ? new Date(log.endTime) : new Date();
                                        const diff = endDate.getTime() - startDate.getTime();

                                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                                        const durationStr = `${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m`;

                                        return (
                                            <div key={log.id} className="mb-6 ml-4">
                                                <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-4 ring-white dark:ring-gray-800 ${log.endTime ? 'bg-gray-100 dark:bg-gray-700' : 'bg-green-100 dark:bg-green-900'}`}>
                                                    <Clock size={12} className={log.endTime ? 'text-gray-500' : 'text-green-600'} />
                                                </span>
                                                <h3 className="flex items-center mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                                                    {log.assigneeName || 'Unknown User'}
                                                    {!log.endTime && <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 ml-3">Current</span>}
                                                </h3>
                                                <time className="block mb-2 text-xs font-normal leading-none text-gray-400 dark:text-gray-500">
                                                    {startDate.toLocaleString()} - {log.endTime ? new Date(log.endTime).toLocaleString() : 'Now'}
                                                </time>
                                                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                                    Duration: <span className="font-medium text-gray-700 dark:text-gray-300">{durationStr}</span>
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl shrink-0">
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
