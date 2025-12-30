

import React, { useState } from 'react';
import type { TodoTask, TodoStatus } from '../types';
import { CheckCircle2, Clock, Circle, X } from '../components/icons';

interface TodoViewProps {
  tasks: TodoTask[];
  onSaveTask: (task: Omit<TodoTask, 'id'>) => void;
}

const statusConfig: { [key in TodoStatus]: { icon: React.ReactNode; label: string; color: string; } } = {
  todo: {
    icon: <Circle size={16} className="mr-2" />,
    label: 'To Do',
    color: 'text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
  },
  inProgress: {
    icon: <Clock size={16} className="mr-2" />,
    label: 'In Progress',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300',
  },
  done: {
    icon: <CheckCircle2 size={16} className="mr-2" />,
    label: 'Done',
    color: 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
  },
};

const TaskCard: React.FC<{ task: TodoTask }> = ({ task }) => {
  const { icon, label, color } = statusConfig[task.status];
  const isPastDue = new Date(task.dueDate) < new Date() && task.status !== 'done';
  
  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col justify-between transition-shadow hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20">
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg mb-2">{task.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{task.description}</p>
      </div>
      <div className="flex items-center justify-between mt-2 text-sm">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${color}`}>
          {icon}
          {label}
        </span>
        <span className={`font-medium ${isPastDue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

const NewTaskModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (task: Omit<TodoTask, 'id'>) => void }> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<TodoStatus>('todo');

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ title, description, dueDate, status });
        onClose();
        setTitle('');
        setDescription('');
        setDueDate(new Date().toISOString().split('T')[0]);
        setStatus('todo');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold">New Task</h2>
                    <button onClick={onClose}><X size={24}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" rows={3}></textarea>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <select value={status} onChange={e => setStatus(e.target.value as TodoStatus)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="todo">To Do</option>
                        <option value="inProgress">In Progress</option>
                        <option value="done">Done</option>
                    </select>
                </div>
                <div className="flex justify-end p-4 border-t dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 mr-2 border rounded-md">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-lyceum-blue text-white rounded-md">Save Task</button>
                </div>
            </div>
        </div>
    );
};

const TodoView: React.FC<TodoViewProps> = ({ tasks, onSaveTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">To-do</h1>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue transition-colors">
            New Task
          </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onSaveTask} />
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TodoView;
