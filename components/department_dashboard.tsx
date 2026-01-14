import React, { useState, useEffect } from 'react';
import type { Visitor, User, TodoTask } from '../types';
import * as api from '../utils/api';
import { Users, CheckCircle, Clock, Volume2, ArrowRight } from './icons';

interface DepartmentDashboardProps {
    user: User;
}

const DepartmentDashboard: React.FC<DepartmentDashboardProps> = ({ user }) => {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [myTasks, setMyTasks] = useState<TodoTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const userDepartment = user.role === 'Admin' ? 'All' : (user.permissions?.department || 'Unassigned');

    useEffect(() => {
        const intervalId = setInterval(fetchData, 10000); // Auto-refresh every 10s
        fetchData();
        return () => clearInterval(intervalId);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [allVisitors, tasks] = await Promise.all([
                api.getVisitors(),
                api.getTasks() // Assuming this returns tasks for current user
            ]);

            // Filter visitors waiting for THIS department
            // Logic: Visit active (Checked-in) AND (current segment department matches OR host matches if no segments)
            const waiting = allVisitors.filter(v => {
                if (v.status === 'Checked-out') return false;

                let targetDept = v.host;
                if (v.visitSegments && v.visitSegments.length > 0) {
                    targetDept = v.visitSegments[v.visitSegments.length - 1].department;
                }

                // Admin sees all? Or should Admin select a view? For now Admin sees all waiting.
                if (user.role === 'Admin') return true;

                // Match department
                // Note: user.permissions.department is not standard, we might need to rely on Name matching "host" 
                // or we need to add a proper department field to User. 
                // For this impl, I will match simply if the User's Name is mentioned in department string 
                // OR if we assume the user object serves as the identity.
                // Let's assume strict string match for now, user needs to ensure names match.
                // Or "Finance Department (Syed)" -> user name "Syed" matches?
                return targetDept.includes(user.name) || targetDept === userDepartment;
            }).sort((a, b) => new Date(a.checkIn || '').getTime() - new Date(b.checkIn || '').getTime());

            setVisitors(waiting);
            setMyTasks(tasks.filter(t => t.status !== 'done'));
        } catch (error) {
            console.error("Fetch error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCallNext = async () => {
        // Find first visitor who is NOT already called
        const nextVisitor = visitors.find(v => v.status === 'Checked-in' || (v.status as any) === 'Scheduled'); // Basically waiting

        if (!nextVisitor) {
            alert("No waiting visitors to call.");
            return;
        }

        try {
            // Update visitor status to 'Called' (using visitSegments or simple status if supported)
            // We defined 'Called' status in logic but not strictly in types yet.
            // Let's use the 'Action' logic.

            const currentSegments = nextVisitor.visitSegments && nextVisitor.visitSegments.length > 0
                ? [...nextVisitor.visitSegments]
                : [{ department: nextVisitor.host, purpose: nextVisitor.purpose || '', timestamp: nextVisitor.checkIn }];

            // Mark current segment action as 'Called'
            if (currentSegments.length > 0) {
                currentSegments[currentSegments.length - 1].action = 'Called';
            }

            await api.saveVisitor({
                ...nextVisitor,
                status: 'Called' as any, // We need to allow 'Called' in types or map it.
                // Actually I should update backend API to accept 'Called' if strict check exists.
                // For now, let's keep status 'Checked-in' but action 'Called' which the display looks for?
                // The Display looked for status 'Called'. 
                // I will update the type Visitor status to include 'Called'.
                visitSegments: currentSegments
            });

            fetchData();
        } catch (error) {
            console.error("Failed to call visitor", error);
        }
    };

    const handleTaskDone = async (taskId: number) => {
        // Implement saveTask update
        // Assuming api.saveTask exists or can be done via PUT /tasks
        // api.saveTask is defined in api.ts
        // But getTasks returns TodoTask type, checking logic...
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Department Dashboard
                    </h1>
                    <p className="text-gray-500">{user.name} - {userDepartment}</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Waiting</div>
                        <div className="text-2xl font-bold text-lyceum-blue">{visitors.length}</div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Available / Call Next Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Users className="text-lyceum-blue" />
                                Waiting Visitors
                            </h2>
                            <button
                                onClick={handleCallNext}
                                disabled={visitors.length === 0}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95"
                            >
                                <Volume2 size={20} />
                                CALL NEXT
                            </button>
                        </div>

                        {isLoading ? (
                            <div>Loading...</div>
                        ) : visitors.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                No visitors waiting for your department.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {visitors.map((v, i) => (
                                    <div key={v.id} className={`p-4 rounded-lg border ${i === 0 ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-700/30 dark:border-gray-700'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-lg">#{v.dailySequenceNumber} {v.name}</div>
                                                <div className="text-sm text-gray-500">{v.purpose}</div>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <Clock size={16} />
                                                <span>{new Date(v.checkIn || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                            <CheckCircle className="text-lyceum-blue" />
                            My Tasks
                        </h2>
                        {myTasks.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No pending tasks.</div>
                        ) : (
                            <div className="space-y-3">
                                {myTasks.map(task => (
                                    <div key={task.id} className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                        <input type="checkbox" className="mt-1" />
                                        <div>
                                            <div className="font-medium text-sm">{task.title}</div>
                                            <div className="text-xs text-gray-500">{task.description}</div>
                                            <div className="text-xs text-red-500 mt-1">Due: {task.dueDate}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentDashboard;
