
import React, { useState, useMemo } from 'react';
import { CheckCircle2, Calendar, ArrowLeft, X, Clock, AlertCircle } from 'lucide-react';
import type { Contact, TodoTask } from '../types';

interface StudentTasksViewProps {
    student: Contact;
    tasks: TodoTask[]; // These should be all tasks, we will filter them here or pass filtered
    onNavigateBack: () => void;
}

const StudentTasksView: React.FC<StudentTasksViewProps> = ({ student, tasks, onNavigateBack }) => {
    const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);

    const myTasks = useMemo(() => {
        return tasks.filter(t => t.contactId === student.id).sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        });
    }, [tasks, student.id]);



    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'done': return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
            case 'inProgress': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm w-full mx-auto animate-fade-in p-6 max-w-5xl">
            <div className="flex items-center mb-6">
                <button
                    onClick={onNavigateBack}
                    className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Tasks</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View tasks and to-dos assigned to you</p>
                </div>
            </div>

            <div className="space-y-3">
                {myTasks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                        <CheckCircle2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No tasks found</h3>
                        <p className="text-gray-500 dark:text-gray-400">You don't have any pending tasks.</p>
                    </div>
                ) : (
                    myTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="group flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-lyceum-blue dark:hover:border-lyceum-blue"
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`mt-1 p-1 rounded-full ${task.status === 'done' ? 'text-green-500 bg-green-50' : 'text-gray-300 bg-gray-100 dark:bg-gray-700'}`}>
                                    <CheckCircle2 size={16} className={task.status === 'done' ? 'fill-current' : ''} />
                                </div>
                                <div>
                                    <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${task.status === 'done' ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>
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
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">

                                <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(task.status)} capitalize`}>
                                    {task.status === 'inProgress' ? 'In Progress' : task.status}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Task Details Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 pr-4">
                                {selectedTask.title}
                            </h2>
                            <button onClick={() => setSelectedTask(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                                    {selectedTask.description || 'No description provided.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                                        <Calendar size={14} className="mr-1.5" /> Due Date
                                    </h3>
                                    <p className="text-gray-800 dark:text-gray-100 font-medium">{selectedTask.dueDate}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                                        <CheckCircle2 size={14} className="mr-1.5" /> Status
                                    </h3>
                                    <span className={`inline-block text-xs px-2 py-1 rounded border ${getStatusColor(selectedTask.status)} capitalize`}>
                                        {selectedTask.status === 'inProgress' ? 'In Progress' : selectedTask.status || 'To Do'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="px-5 py-2 bg-lyceum-blue text-white rounded-lg font-medium shadow hover:bg-lyceum-blue-dark transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default StudentTasksView;
