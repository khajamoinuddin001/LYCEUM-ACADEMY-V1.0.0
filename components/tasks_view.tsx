import React, { useState, useMemo, useEffect } from 'react';
import type { TodoTask, User, TaskPriority, TodoStatus } from '../types';
import { Search, Filter, Plus, Edit, Trash2, Calendar, User as UserIcon, AlertCircle, CheckCircle2, Clock, MoreHorizontal, X, Play, Pause } from './icons';
import { getStaffMembers, getRecurringTasks, updateRecurringTask, deleteRecurringTask, createRecurringTask, getContacts, getTasks } from '../utils/api';
import type { Contact } from '../types';
import type { RecurringTask } from '../types';
import TaskDetailModal from './task_detail_modal';

interface TasksViewProps {
    tasks: TodoTask[];
    onNewTaskClick: () => void;
    onEditTask: (task: TodoTask) => void;
    onSaveTask?: (task: Partial<TodoTask>) => Promise<void>;
    onDeleteTask: (taskId: number) => void;
    onStatusChange: (task: TodoTask, newStatus: TodoStatus) => void;
    user: User;
    onFilterChange: (filters: { userId?: number; all?: boolean }) => void;
    preSelectedTaskId?: number | null;
    onClearPreSelectedTask?: () => void;
}

const HistoryRow: React.FC<{ task: TodoTask, staff: { id: number; name: string; role: string }[] }> = ({ task, staff }) => {
    const completedBy = staff.find(s => s.id === task.completedBy)?.name || 'Unknown';
    const createdBy = staff.find(s => s.id === task.assignedBy)?.name || 'Unknown';
    const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
    }) : 'N/A';
    const createdDate = task.createdAt ? new Date(task.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
    }) : 'N/A';

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <td className="px-6 py-4">
                {task.contactName && (
                    <div className="text-xs font-semibold text-lyceum-blue mb-0.5 flex items-center gap-1">
                        <UserIcon size={10} /> {task.contactName}
                    </div>
                )}
                <div className="font-bold text-gray-800 dark:text-gray-100">{task.title}</div>
                <div className="text-xs text-gray-500 mt-1">{task.description}</div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">{createdBy}</div>
                <div className="text-xs text-gray-500">{createdDate}</div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">{completedBy}</div>
                <div className="text-xs text-gray-500">{completedDate}</div>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">{task.dueDate}</span>
            </td>
            <td className="px-6 py-4 text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Done
                </span>
            </td>
        </tr>
    );
};


const priorityColors: Record<TaskPriority, string> = {
    Low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusColors: Record<TodoStatus, string> = {
    todo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    inProgress: 'bg-lyceum-blue/10 text-lyceum-blue dark:bg-lyceum-blue/20 dark:text-blue-400',
    done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const TasksView: React.FC<TasksViewProps> = ({
    tasks,
    onNewTaskClick,
    onEditTask,
    onSaveTask,
    onDeleteTask,
    onStatusChange,
    user,
    onFilterChange,
    preSelectedTaskId,
    onClearPreSelectedTask
}) => {
    const [mainView, setMainView] = useState<'tasks' | 'recurring'>('tasks');
    const [taskTypeFilter, setTaskTypeFilter] = useState<'All' | 'Manual' | 'Recurring'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | TodoStatus>('todo');
    const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
    const [startDate, setStartDate] = useState(''); // New start date filter
    const [endDate, setEndDate] = useState(''); // New end date filter
    const [adminFilterUser, setAdminFilterUser] = useState<string>('self'); // 'self', 'all', or userId
    const [activeTab, setActiveTab] = useState<'Tasks' | 'History' | 'Personal'>('Tasks');
    const [staff, setStaff] = useState<{ id: number; name: string; role: string }[]>([]);
    const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
    const [isRefreshingRecurring, setIsRefreshingRecurring] = useState(false);
    const [editingRT, setEditingRT] = useState<RecurringTask | null>(null);
    const [editingFrequencyId, setEditingFrequencyId] = useState<number | null>(null);
    const [tempFrequency, setTempFrequency] = useState<number>(2);
    const [viewingRTHistory, setViewingRTHistory] = useState<RecurringTask | null>(null);
    const [rtGeneratedTasks, setRtGeneratedTasks] = useState<TodoTask[]>([]);
    const [isCreatingRT, setIsCreatingRT] = useState(false);
    const [newRT, setNewRT] = useState({ contactId: 0, title: '', description: '', frequencyDays: 2, visibilityEmails: [] as string[] });
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactSearch, setContactSearch] = useState('');
    const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);

    const isAdmin = user.role === 'Admin';

    useEffect(() => {
        if (isAdmin) {
            getStaffMembers().then(setStaff).catch(console.error);
        }
    }, [isAdmin]);

    const fetchRecurringTasks = async () => {
        if (!isAdmin) return;
        setIsRefreshingRecurring(true);
        try {
            const data = await getRecurringTasks();
            setRecurringTasks(data);
        } catch (error) {
            console.error('Failed to fetch recurring tasks:', error);
        } finally {
            setIsRefreshingRecurring(false);
        }
    };

    useEffect(() => {
        if (mainView === 'recurring') {
            fetchRecurringTasks();
            getContacts().then(setContacts).catch(console.error);
        }
    }, [mainView]);

    useEffect(() => {
        if (preSelectedTaskId && tasks.length > 0) {
            const task = tasks.find(t => t.id === preSelectedTaskId);
            if (task) {
                setSelectedTask(task);
                setIsDetailModalOpen(true);
                onClearPreSelectedTask?.();
            }
        }
    }, [preSelectedTaskId, tasks, onClearPreSelectedTask]);

    const handleAdminFilter = (value: string) => {
        setAdminFilterUser(value);
        if (value === 'self') {
            onFilterChange({});
        } else if (value === 'all') {
            onFilterChange({ all: true });
        } else {
            onFilterChange({ userId: Number(value) });
        }
    };

    const handleTaskClick = (task: TodoTask) => {
        setSelectedTask(task);
        setIsDetailModalOpen(true);
    };

    const handleAddReply = async (taskId: number, message: string, attachments?: File[]) => {
        // Find the task and add reply
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Process attachments (in real app, upload to server)
        const processedAttachments = attachments?.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file), // In production, this would be the uploaded file URL
            size: file.size
        })) || [];

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

        // Save to backend
        if (onSaveTask) {
            await onSaveTask(updatedTask);
        }

        // Update the selected task to show the new reply immediately
        setSelectedTask(updatedTask);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTask(null);
    };

    const handleForwardTask = (task: TodoTask, newAssigneeId: number, newAssigneeName: string) => {
        const updatedTask = {
            ...task,
            assignedTo: newAssigneeId,
            status: 'todo' as TodoStatus // Reset to todo when forwarded
        };
        if (onSaveTask) {
            onSaveTask(updatedTask);
        } else {
            onEditTask(updatedTask);
        }
    };

    const filteredTasks = useMemo(() => {
        return (tasks || []).filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                (t.taskId?.toLowerCase() || '').includes(searchQuery.toLowerCase());

            // Date filtering logic
            let matchesDate = true;
            const taskDateStr = (t.status === 'done' && t.completedAt)
                ? new Date(t.completedAt).toLocaleDateString('en-CA')
                : t.dueDate;

            if (startDate || endDate) {
                if (!taskDateStr) {
                    matchesDate = false;
                } else {
                    if (startDate && taskDateStr < startDate) matchesDate = false;
                    if (endDate && taskDateStr > endDate) matchesDate = false;
                }
            }

            if (activeTab === 'History') {
                return t.status === 'done' && matchesSearch && matchesDate;
            }

            if (activeTab === 'Personal') {
                return t.assignedTo === user.id && t.assignedBy === user.id && t.status !== 'done' && matchesSearch && matchesDate;
            }

            // Default Tasks Tab - show active tasks (not done)
            const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
            const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;

            // Task Type filtering
            let matchesType = true;
            if (taskTypeFilter === 'Manual') {
                matchesType = !t.recurringTaskId;
            } else if (taskTypeFilter === 'Recurring') {
                matchesType = !!t.recurringTaskId;
            }

            // Only filter out 'done' tasks if status filter is not explicitly set to 'done' or 'All'
            const shouldShowTask = statusFilter === 'done' || statusFilter === 'All'
                ? matchesStatus
                : t.status !== 'done' && matchesStatus;

            return matchesSearch && shouldShowTask && matchesPriority && matchesDate && matchesType;
        });
    }, [tasks, searchQuery, statusFilter, priorityFilter, activeTab, user.id, startDate, endDate, taskTypeFilter]);

    return (
        <>
            <div className="animate-fade-in space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Tasks</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage and track shared tasks across departments.</p>
                    </div>
                    <button
                        onClick={onNewTaskClick}
                        className="flex items-center gap-2 px-6 py-2.5 bg-lyceum-blue text-white rounded-lg font-bold shadow-lg shadow-lyceum-blue/20 hover:bg-lyceum-blue-dark transform hover:scale-105 transition-all"
                    >
                        <Plus size={20} />
                        New Task
                    </button>
                </header>

                <div className="flex gap-2 p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl w-fit border border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setMainView('tasks')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mainView === 'tasks'
                            ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        All Tasks
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setMainView('recurring')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mainView === 'recurring'
                                ? 'bg-white dark:bg-gray-700 text-lyceum-blue shadow-md'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Recurring Tasks
                        </button>
                    )}
                </div>

                {mainView === 'tasks' ? (
                    <>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-lyceum-blue/50 dark:text-white"
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                {/* Date Filters */}
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg text-sm outline-none dark:text-white h-[38px] w-[140px]"
                                            title="From Date"
                                        />
                                        {startDate && (
                                            <button
                                                onClick={() => setStartDate('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                title="Clear start date"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-gray-400 text-xs font-bold">TO</span>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg text-sm outline-none dark:text-white h-[38px] w-[140px]"
                                            title="To Date"
                                        />
                                        {endDate && (
                                            <button
                                                onClick={() => setEndDate('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                title="Clear end date"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg text-sm outline-none dark:text-white"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="todo">To Do</option>
                                    <option value="inProgress">In Progress</option>
                                    <option value="done">Completed</option>
                                </select>
                                <select
                                    value={taskTypeFilter}
                                    onChange={(e) => setTaskTypeFilter(e.target.value as any)}
                                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg text-sm outline-none dark:text-white"
                                >
                                    <option value="All">All Types</option>
                                    <option value="Manual">Tasks</option>
                                    <option value="Recurring">Recurring Only</option>
                                </select>
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg text-sm outline-none dark:text-white"
                                >
                                    <option value="All">All Priorities</option>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                                {isAdmin && (
                                    <select
                                        value={adminFilterUser}
                                        onChange={(e) => handleAdminFilter(e.target.value)}
                                        className="px-3 py-2 bg-lyceum-blue/5 dark:bg-lyceum-blue/10 border border-lyceum-blue/20 rounded-lg text-sm font-semibold text-lyceum-blue outline-none"
                                    >
                                        <option value="self">My Tasks</option>
                                        <option value="all">Global Tasks</option>
                                        <optgroup label="Staff Members">
                                            {staff.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
                                            {activeTab === 'History' ? (
                                                <>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Task</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Created By</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Completed By</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Due Date</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-right text-gray-500 uppercase">Status</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Task ID</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Task</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Priority</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Due Date</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                                    {isAdmin && adminFilterUser === 'all' && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Assigned To</th>}
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={isAdmin && adminFilterUser === 'all' ? 7 : 6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                    <div className="flex flex-col items-center">
                                                        <Clock size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
                                                        <p className="text-lg font-medium">No tasks found</p>
                                                        <p className="text-sm">Try adjusting your filters or search query.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTasks.map(task => (
                                                activeTab === 'History' ? (
                                                    <HistoryRow key={task.id} task={task} staff={staff} />
                                                ) : (
                                                    <tr
                                                        key={task.id}
                                                        onClick={() => handleTaskClick(task)}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-mono font-bold text-lyceum-blue bg-lyceum-blue/5 px-2 py-1 rounded">
                                                                {task.taskId || `TSK-${task.id.toString().padStart(6, '0')}`}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className={`font-semibold text-gray-800 dark:text-gray-200 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                                                                    {task.title}
                                                                </span>
                                                                {task.description && (
                                                                    <span className="text-xs text-gray-500 line-clamp-1">{task.description}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority || 'Medium']}`}>
                                                                {task.priority || 'Medium'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                                <Calendar size={14} className="text-lyceum-blue" />
                                                                {task.dueDate}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                            <select
                                                                value={task.status}
                                                                onChange={(e) => {
                                                                    const newStatus = e.target.value as TodoStatus;
                                                                    if (newStatus === 'done') {
                                                                        handleTaskClick(task);
                                                                    } else {
                                                                        onStatusChange(task, newStatus);
                                                                    }
                                                                }}
                                                                className={`px-3 py-1 rounded-lg text-xs font-bold outline-none border-none cursor-pointer ${statusColors[task.status]}`}
                                                            >
                                                                <option value="todo">To Do</option>
                                                                <option value="inProgress">In Progress</option>
                                                                <option value="done">Completed</option>
                                                            </select>
                                                        </td>
                                                        {isAdmin && adminFilterUser === 'all' && (
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                    <span className="w-8 h-8 rounded-full bg-lyceum-blue/10 flex items-center justify-center text-lyceum-blue font-bold text-xs">
                                                                        {staff.find(s => s.id === task.assignedTo)?.name.charAt(0) || '?'}
                                                                    </span>
                                                                    {staff.find(s => s.id === task.assignedTo)?.name || 'Unknown'}
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => onEditTask(task)}
                                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-lyceum-blue transition-colors"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => { if (confirm('Delete this task?')) onDeleteTask(task.id); }}
                                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setIsCreatingRT(true)}
                                className="px-4 py-2 bg-lyceum-blue hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 font-bold"
                            >
                                <Plus size={18} /> Create Recurring Task
                            </button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Task ID</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Task Definition</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Frequency</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Last / Next Run</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Visibility</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {recurringTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                                                    No recurring tasks found. They are auto-generated from CRM leads in 'New', 'Qualified', or 'Proposal' stages.
                                                </td>
                                            </tr>
                                        ) : (
                                            recurringTasks.map((rt) => (
                                                <tr key={rt.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className="text-xs font-mono font-bold text-lyceum-blue bg-lyceum-blue/5 px-2 py-1 rounded cursor-pointer hover:bg-lyceum-blue/10 transition-colors"
                                                            onClick={async () => {
                                                                setViewingRTHistory(rt);
                                                                setRtGeneratedTasks([]); // Clear existing
                                                                try {
                                                                    const history = await getTasks({ recurringTaskId: rt.id });
                                                                    setRtGeneratedTasks(history);
                                                                } catch (error) {
                                                                    console.error('Error fetching RT history:', error);
                                                                }
                                                            }}
                                                            title="Click to view generated tasks"
                                                        >
                                                            {rt.taskId || `REQ-${rt.id.toString().padStart(6, '0')}`}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-800 dark:text-gray-100">{rt.title}</div>
                                                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">{rt.description}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {editingFrequencyId === rt.id ? (
                                                            <div className="inline-flex items-center gap-1.5">
                                                                <span className="text-xs text-gray-500">Every</span>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="365"
                                                                    value={tempFrequency}
                                                                    onChange={(e) => setTempFrequency(parseInt(e.target.value) || 1)}
                                                                    onBlur={async () => {
                                                                        await updateRecurringTask(rt.id, {
                                                                            frequencyDays: tempFrequency,
                                                                            visibilityEmails: rt.visibilityEmails,
                                                                            isActive: rt.isActive
                                                                        });
                                                                        setEditingFrequencyId(null);
                                                                        fetchRecurringTasks();
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.currentTarget.blur();
                                                                        } else if (e.key === 'Escape') {
                                                                            setEditingFrequencyId(null);
                                                                            setTempFrequency(rt.frequencyDays);
                                                                        }
                                                                    }}
                                                                    autoFocus
                                                                    className="w-16 px-2 py-1 text-center bg-white dark:bg-gray-700 border-2 border-lyceum-blue rounded text-sm font-bold text-gray-800 dark:text-white outline-none"
                                                                />
                                                                <span className="text-xs text-gray-500">Days</span>
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                                                                onClick={() => {
                                                                    setEditingFrequencyId(rt.id);
                                                                    setTempFrequency(rt.frequencyDays);
                                                                }}
                                                                title="Click to edit"
                                                            >
                                                                Every {rt.frequencyDays} Days
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                            <div className="flex items-center gap-1">
                                                                <Clock size={10} /> Last: {rt.lastGeneratedAt ? new Date(rt.lastGeneratedAt).toLocaleDateString() : 'Never'}
                                                            </div>
                                                            <div className="flex items-center gap-1 mt-1 text-lyceum-blue font-semibold">
                                                                <Calendar size={10} /> Next: {rt.nextGenerationAt ? new Date(rt.nextGenerationAt).toLocaleDateString() : 'ASAP'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${rt.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                {rt.isActive ? 'Active' : 'Paused'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                            {rt.visibilityEmails?.length > 0 ? (
                                                                rt.visibilityEmails.map(email => (
                                                                    <span key={email} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 border-dashed">
                                                                        {email}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-[10px] text-gray-400 italic">Only Assignee</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setEditingRT(rt)}
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-lyceum-blue transition-colors"
                                                            title="Edit recurring task"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                await updateRecurringTask(rt.id, {
                                                                    frequencyDays: rt.frequencyDays,
                                                                    visibilityEmails: rt.visibilityEmails,
                                                                    isActive: !rt.isActive
                                                                });
                                                                fetchRecurringTasks();
                                                            }}
                                                            className={`p-2 rounded-lg transition-colors ${rt.isActive ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-400 hover:text-amber-500' : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-500'}`}
                                                            title={rt.isActive ? 'Pause recurring task' : 'Resume recurring task'}
                                                        >
                                                            {rt.isActive ? <Pause size={16} /> : <Play size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(`Delete recurring task "${rt.title}"? This will not delete already generated tasks.`)) {
                                                                    await deleteRecurringTask(rt.id);
                                                                    fetchRecurringTasks();
                                                                }
                                                            }}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                                            title="Delete recurring task"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>


                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Visibility Modal */}
                        {editingRT && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Recurring Task</h3>
                                            <p className="text-xs text-gray-500 mt-1">{editingRT.title}</p>
                                        </div>
                                        <button onClick={() => setEditingRT(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors text-gray-500">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Frequency (Days)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    value={editingRT.frequencyDays}
                                                    onChange={(e) => setEditingRT({ ...editingRT, frequencyDays: parseInt(e.target.value) || 2 })}
                                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-lyceum-blue outline-none dark:text-white"
                                                    placeholder="2"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">How often should this task be generated (in days)</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Assign to Staff</label>
                                            <p className="text-xs text-gray-500">Select staff member who should see this task.</p>
                                        </div>
                                        <div>
                                            <select
                                                value={editingRT.visibilityEmails?.[0] || ''}
                                                onChange={(e) => {
                                                    const newVisibility = e.target.value ? [e.target.value] : [];
                                                    setEditingRT({ ...editingRT, visibilityEmails: newVisibility });
                                                }}
                                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-lyceum-blue outline-none dark:text-white"
                                            >
                                                <option value="">Select a staff member...</option>
                                                {staff.map(s => (
                                                    <option key={s.id} value={s.email}>
                                                        {s.name} ({s.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={async () => {
                                                    await updateRecurringTask(editingRT.id, {
                                                        visibilityEmails: editingRT.visibilityEmails,
                                                        frequencyDays: editingRT.frequencyDays,
                                                        isActive: editingRT.isActive
                                                    });
                                                    setEditingRT(null);
                                                    fetchRecurringTasks();
                                                }}
                                                className="w-full py-3 bg-lyceum-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Create Recurring Task Modal */}
                        {isCreatingRT && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Recurring Task</h3>
                                            <p className="text-xs text-gray-500 mt-1">Set up automatic task generation</p>
                                        </div>
                                        <button onClick={() => { setIsCreatingRT(false); setNewRT({ contactId: 0, title: '', description: '', frequencyDays: 2, visibilityEmails: [] }); setContactSearch(''); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors text-gray-500">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="relative">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Select Contact *</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={contactSearch}
                                                    onChange={(e) => {
                                                        setContactSearch(e.target.value);
                                                        if (newRT.contactId !== 0) {
                                                            setNewRT({ ...newRT, contactId: 0 });
                                                        }
                                                        setIsContactDropdownOpen(true);
                                                    }}
                                                    onFocus={() => setIsContactDropdownOpen(true)}
                                                    placeholder="Type to search contact..."
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-lyceum-blue outline-none"
                                                />
                                                {newRT.contactId !== 0 && (
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                                                        <CheckCircle2 size={16} />
                                                    </div>
                                                )}
                                            </div>

                                            {isContactDropdownOpen && (
                                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                    {contacts.length === 0 ? (
                                                        <div className="p-3 text-gray-500 text-sm text-center">Loading contacts...</div>
                                                    ) : (
                                                        <>
                                                            {contacts
                                                                .filter(c =>
                                                                    !contactSearch ||
                                                                    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                                                                    (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase()))
                                                                )
                                                                .map(contact => (
                                                                    <button
                                                                        key={contact.id}
                                                                        onClick={() => {
                                                                            setNewRT({ ...newRT, contactId: contact.id });
                                                                            setContactSearch(contact.name);
                                                                            setIsContactDropdownOpen(false);
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                                                                    >
                                                                        <div className="font-bold text-sm text-gray-800 dark:text-gray-200">{contact.name}</div>
                                                                        <div className="text-xs text-gray-500">{contact.email}</div>
                                                                    </button>
                                                                ))}
                                                            {contacts.filter(c => !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase())).length === 0 && (
                                                                <div className="p-3 text-gray-500 text-sm text-center">No contacts found</div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Task Title *</label>
                                            <input
                                                type="text"
                                                value={newRT.title}
                                                onChange={(e) => setNewRT({ ...newRT, title: e.target.value })}
                                                placeholder="e.g., Follow up with client"
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                            <textarea
                                                value={newRT.description}
                                                onChange={(e) => setNewRT({ ...newRT, description: e.target.value })}
                                                placeholder="Task description..."
                                                rows={3}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Frequency (Days) *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={newRT.frequencyDays}
                                                onChange={(e) => setNewRT({ ...newRT, frequencyDays: parseInt(e.target.value) || 2 })}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Assign to Staff</label>
                                            <select
                                                value={newRT.visibilityEmails[0] || ''}
                                                onChange={(e) => {
                                                    setNewRT({ ...newRT, visibilityEmails: e.target.value ? [e.target.value] : [] });
                                                }}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white"
                                            >
                                                <option value="">Select a staff member...</option>
                                                {staff.map(s => (
                                                    <option key={s.id} value={s.email}>
                                                        {s.name} ({s.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={async () => {
                                                    if (!newRT.contactId || !newRT.title) {
                                                        alert('Please fill in all required fields');
                                                        return;
                                                    }
                                                    await createRecurringTask(newRT);
                                                    setIsCreatingRT(false);
                                                    setNewRT({ contactId: 0, title: '', description: '', frequencyDays: 2, visibilityEmails: [] });
                                                    setContactSearch('');
                                                    fetchRecurringTasks();
                                                }}
                                                className="w-full py-3 bg-lyceum-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                Create Recurring Task
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                )}
            </div>

            {/* Task Detail Modal */}
            <TaskDetailModal
                task={selectedTask}
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                onAddReply={handleAddReply}
                onStatusChange={onStatusChange}
                onForwardTask={handleForwardTask}
                user={user}
            />

            {/* Recurring Task History Modal */}
            {viewingRTHistory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generated Task History</h3>
                                <p className="text-xs text-gray-500 mt-1">{viewingRTHistory.title}</p>
                                <p className="text-xs font-mono text-lyceum-blue mt-1">{viewingRTHistory.taskId || `REQ-${viewingRTHistory.id.toString().padStart(6, '0')}`}</p>
                            </div>
                            <button onClick={() => setViewingRTHistory(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Recurring Task Details Summary */}
                            <div className="mb-6 p-4 bg-lyceum-blue/5 rounded-xl border border-lyceum-blue/10">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Recurring Definition</div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{viewingRTHistory.title}</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{viewingRTHistory.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] font-bold uppercase text-gray-400 mb-1">Frequency</div>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                            Every {viewingRTHistory.frequencyDays} days
                                        </div>
                                        <div className="mt-3 text-[10px] font-bold uppercase text-gray-400 mb-1">Status</div>
                                        <div className={`inline-flex items-center gap-1 text-[10px] font-bold ${viewingRTHistory.isActive ? 'text-green-500' : 'text-gray-400'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${viewingRTHistory.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            {viewingRTHistory.isActive ? 'Active' : 'Paused'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={16} className="text-gray-400" />
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Generated Task History</h4>
                            </div>

                            {rtGeneratedTasks.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p className="font-medium">No tasks generated yet</p>
                                    <p className="text-sm mt-1">Tasks will be automatically generated based on the frequency schedule.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {rtGeneratedTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-lyceum-blue/30 transition-colors cursor-pointer"
                                            onClick={() => handleTaskClick(task)}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-mono font-bold text-lyceum-blue bg-lyceum-blue/5 px-2 py-1 rounded">
                                                            {task.taskId || `TSK-${task.id.toString().padStart(6, '0')}`}
                                                        </span>
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[task.status] || statusColors[task.status?.toLowerCase() as TodoStatus] || 'bg-gray-100'}`}>
                                                            {task.status?.toString().toLowerCase().includes('todo') ? 'To Do' :
                                                                task.status?.toString().toLowerCase().includes('progress') ? 'In Progress' : 'Done'}
                                                        </span>
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${priorityColors[task.priority || 'Medium']}`}>
                                                            {task.priority || 'Medium'}
                                                        </span>
                                                    </div>
                                                    <div className="font-bold text-gray-800 dark:text-gray-100 mb-1">{task.title}</div>
                                                    {task.description && (
                                                        <div className="text-xs text-gray-500 line-clamp-2">{task.description}</div>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            Due: {task.dueDate}
                                                        </div>
                                                        {task.completedAt && (
                                                            <div className="flex items-center gap-1 text-green-600">
                                                                <CheckCircle2 size={12} />
                                                                Completed: {new Date(task.completedAt).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                        {task.assignedTo && (
                                                            <div className="flex items-center gap-1">
                                                                <UserIcon size={12} />
                                                                {staff.find(s => s.id === task.assignedTo)?.name || 'Assigned'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                            <div className="flex items-center justify-between text-sm">
                                <div className="text-gray-600 dark:text-gray-400">
                                    <span className="font-bold">{rtGeneratedTasks.length}</span> task{rtGeneratedTasks.length !== 1 ? 's' : ''} generated
                                </div>
                                <div className="flex gap-4 text-xs">
                                    <span className="text-gray-500">Todo: <span className="font-bold">{rtGeneratedTasks.filter(t => t.status === 'todo').length}</span></span>
                                    <span className="text-blue-600">In Progress: <span className="font-bold">{rtGeneratedTasks.filter(t => t.status === 'inProgress').length}</span></span>
                                    <span className="text-green-600">Done: <span className="font-bold">{rtGeneratedTasks.filter(t => t.status === 'done').length}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
};

export default TasksView;
