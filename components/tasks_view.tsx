import React, { useState, useMemo, useEffect } from 'react';
import type { TodoTask, User, TaskPriority, TodoStatus } from '../types';
import { Search, Filter, Plus, Edit, Trash2, Calendar, User as UserIcon, AlertCircle, CheckCircle2, Clock, MoreHorizontal } from './icons';
import { getStaffMembers } from '../utils/api';

interface TasksViewProps {
    tasks: TodoTask[];
    onNewTaskClick: () => void;
    onEditTask: (task: TodoTask) => void;
    onDeleteTask: (taskId: number) => void;
    onStatusChange: (task: TodoTask, newStatus: TodoStatus) => void;
    user: User;
    onFilterChange: (filters: { userId?: number; all?: boolean }) => void;
}

const HistoryRow: React.FC<{ task: TodoTask, staff: { id: number; name: string; role: string }[] }> = ({ task, staff }) => {
    const completedBy = staff.find(s => s.id === task.completedBy)?.name || 'Unknown';
    const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleString() : 'N/A';

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <td className="px-6 py-4">
                <div className="font-bold text-gray-800 dark:text-gray-100">{task.title}</div>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">{completedBy}</span>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">{completedDate}</span>
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
    onDeleteTask,
    onStatusChange,
    user,
    onFilterChange
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | TodoStatus>('All');
    const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
    const [adminFilterUser, setAdminFilterUser] = useState<string>('self'); // 'self', 'all', or userId
    const [activeTab, setActiveTab] = useState<'Tasks' | 'History' | 'Personal'>('Tasks');
    const [staff, setStaff] = useState<{ id: number; name: string; role: string }[]>([]);

    const isAdmin = user.role === 'Admin';

    useEffect(() => {
        if (isAdmin) {
            getStaffMembers().then(setStaff).catch(console.error);
        }
    }, [isAdmin]);

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

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
            const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;

            if (activeTab === 'History') {
                return t.status === 'done' && matchesSearch;
            }

            if (activeTab === 'Personal') {
                // Personal means assigned TO me and created BY me (self-tasks)
                // Or just strictly assigned to me? 
                // Let's define Personal as: Assigned To Me (which is default view mostly)
                // But typically "Personal" implies things I added for myself.
                // Let's stick to standard filters for now, but tab switches context?
                // Actually, "Personal To-Do" usually means tasks where I am both creator and assignee.
                return t.assignedTo === user.id && t.assignedBy === user.id && t.status !== 'done' && matchesSearch;
            }

            // Default Tasks Tab:
            // exclude 'done' usually, unless filter says otherwise?
            // "History" takes care of done.
            // So Tasks view should ideally hide done?
            // Or let users filter.
            // Let's filter out 'done' for the main 'Tasks' list to keep it clean, 
            // unless user explicitly sets Status Filter to 'done' or 'All'.
            // Actually, if we have a History tab, usually main tab is active tasks.
            const isNotDone = t.status !== 'done';

            return matchesSearch && matchesStatus && matchesPriority && isNotDone;
        });
    }, [tasks, searchQuery, statusFilter, priorityFilter, activeTab, user.id]);

    return (
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
                <div className="flex gap-2 w-full md:w-auto">
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
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Completed By</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Completed At</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Original Due Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-right text-gray-500 uppercase">Status</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Task</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Priority</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Due Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                        {isAdmin && adminFilterUser === 'all' && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Assigned To</th>}
                                        <th className="px-6 py-4 text-xs font-bold text-right text-gray-500 uppercase">Actions</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                                        No tasks found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map(task => (
                                    activeTab === 'History' ? (
                                        <HistoryRow key={task.id} task={task} staff={staff} />
                                    ) : (
                                        <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800 dark:text-gray-100">{task.title}</div>
                                                <div className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${priorityColors[task.priority || 'Medium']}`}>
                                                    {task.priority || 'Medium'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <Calendar size={14} />
                                                    {task.dueDate}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={task.status}
                                                    onChange={(e) => onStatusChange(task, e.target.value as TodoStatus)}
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

            <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default TasksView;
