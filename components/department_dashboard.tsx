import React, { useState, useEffect } from 'react';
import type { Visitor, User, TodoTask, Ticket } from '../types';
import * as api from '../utils/api';
import { Users, CheckCircle, Clock, Volume2, ArrowRight, AlertCircle } from './icons';

interface DepartmentDashboardProps {
    user: User;
    tickets: Ticket[];
    onViewVisits?: (contactId?: number, contactName?: string) => void;
    onTicketSelect?: (ticketId: number) => void;
}

const DepartmentDashboard: React.FC<DepartmentDashboardProps> = ({ user, tickets, onViewVisits, onTicketSelect }) => {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [myTasks, setMyTasks] = useState<TodoTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [followUpVisitor, setFollowUpVisitor] = useState<Visitor | null>(null);
    const [targetStaff, setTargetStaff] = useState('');
    const [staffMembers, setStaffMembers] = useState<User[]>([]);
    const [viewMode, setViewMode] = useState<'Mine' | 'All'>(user.role === 'Admin' ? 'All' : 'Mine');

    const userDepartment = user.role === 'Admin' ? 'All' : (user.permissions?.department || 'Unassigned');

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const users = await api.getUsers();
                const staff = users.filter(u => u.role === 'Staff');
                setStaffMembers(staff);
            } catch (error) {
                console.error('Failed to load staff:', error);
            }
        };
        fetchStaff();

        const intervalId = setInterval(fetchData, 5000); // Auto-refresh every 5s
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

            // Filter visitors waiting or recently called for THIS department
            console.log(`[Dashboard] Filtering ${allVisitors.length} visitors for user ${user.name} (${user.role})`);

            const waiting = allVisitors.filter(v => {
                // Never show checked-out visitors in this dashboard
                if (v.status === 'Checked-out') return false;

                // 1. Determine if this visitor belongs to the current user ("My Visitors")
                let isForMe = false;

                // Check by host ID (most accurate)
                if (v.host && String(v.host) === String(user.id)) isForMe = true;

                // Check by name or department string
                const targetDeptName = String((v as any).host_name || v.host || '').toLowerCase().trim();
                const userNameNormalized = String(user.name || '').toLowerCase().trim();
                const userDeptNormalized = (user.permissions?.department || '').toLowerCase().trim();

                if (targetDeptName.includes(userNameNormalized) ||
                    (userDeptNormalized && targetDeptName.includes(userDeptNormalized))) {
                    isForMe = true;
                }

                // Also check visit segments for department/name match
                if (!isForMe && v.visitSegments && v.visitSegments.length > 0) {
                    const lastSegment = v.visitSegments[v.visitSegments.length - 1];
                    if (lastSegment && lastSegment.department) {
                        const segDept = String(lastSegment.department).toLowerCase().trim();
                        if (segDept.includes(userNameNormalized) ||
                            (userDeptNormalized && segDept.includes(userDeptNormalized))) {
                            isForMe = true;
                        }
                    }
                }

                // 2. Decide visibility based on User Role and View Mode
                if (user.role === 'Admin') {
                    // Admins see everything that isn't checked out
                    return true;
                }

                // Staff see their own scope or everything if specifically in "All" mode (though toggle is hidden for them currently)
                if (viewMode === 'All') return true;
                return isForMe;
            }).sort((a, b) => {
                const timeA = new Date(a.checkIn || a.scheduledCheckIn || 0).getTime();
                const timeB = new Date(b.checkIn || b.scheduledCheckIn || 0).getTime();
                return timeA - timeB;
            });

            console.log(`[Dashboard] Found ${waiting.length} visitors matching scope`);
            setVisitors(waiting);
            setMyTasks(tasks.filter(t => t.status !== 'Done'));
        } catch (error) {
            console.error("Fetch error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCallVisitor = async (visitor: Visitor) => {
        try {
            const currentSegments = visitor.visitSegments && visitor.visitSegments.length > 0
                ? [...visitor.visitSegments]
                : [{ department: visitor.host, purpose: visitor.purpose || '', timestamp: visitor.checkIn }];

            // Mark current segment action as 'Called'
            if (currentSegments.length > 0) {
                currentSegments[currentSegments.length - 1].action = 'Called';
            }

            await api.saveVisitor({
                ...visitor,
                status: 'Checked-in',
                calledAt: new Date().toISOString(),
                visitSegments: currentSegments
            });

            fetchData();
        } catch (error) {
            console.error("Failed to call visitor", error);
        }
    };

    const handleCallNext = async () => {
        // Find first visitor who is NOT already called
        const nextVisitor = visitors.find(v => v.status === 'Checked-in' || (v.status as any) === 'Scheduled'); // Basically waiting

        if (!nextVisitor) {
            alert("No waiting visitors to call.");
            return;
        }

        handleCallVisitor(nextVisitor);
    };

    const handleFollowUpClick = (visitor: Visitor) => {
        setFollowUpVisitor(visitor);
        if (staffMembers.length > 0) {
            setTargetStaff(staffMembers[0].email);
        }
    };

    const handleConfirmFollowUp = async () => {
        if (!followUpVisitor || !targetStaff) return;

        try {
            const selectedStaff = staffMembers.find(s => s.email === targetStaff);
            if (!selectedStaff) return;

            const currentSegments = followUpVisitor.visitSegments && followUpVisitor.visitSegments.length > 0
                ? [...followUpVisitor.visitSegments]
                : [{ department: followUpVisitor.host, purpose: followUpVisitor.purpose || '', timestamp: followUpVisitor.checkIn, action: 'Called' }];

            // Add new segment for the next staff member
            currentSegments.push({
                department: selectedStaff.name,
                purpose: `Follow up from ${user.name}`,
                timestamp: new Date().toISOString()
            });

            await api.saveVisitor({
                ...followUpVisitor,
                status: 'Checked-in', // Status remains checked-in so they appear in next staff's dashboard
                staffEmail: selectedStaff.email,
                staffName: selectedStaff.name,
                visitSegments: currentSegments
            });

            setFollowUpVisitor(null);
            fetchData();
        } catch (error) {
            console.error("Failed to process follow up", error);
        }
    };

    const handleTaskDone = async (task: TodoTask) => {
        try {
            await api.saveTask({ ...task, status: 'Done' });
            fetchData();
        } catch (error) {
            console.error("Failed to mark task as done", error);
        }
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
                <div className="flex gap-4 items-center">
                    {/* Toggle hidden at user request, defaults to All for Admin */}
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
                                                <div className="text-sm text-gray-500 max-w-md">
                                                    {v.visitSegments && v.visitSegments.length > 1 ? (
                                                        <div className="flex flex-wrap gap-1 items-center mt-1">
                                                            Visit Journey:
                                                            {v.visitSegments.map((seg, idx) => (
                                                                <span key={idx} className="flex items-center text-xs font-semibold bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200">
                                                                    {seg.department}
                                                                    {idx < (v.visitSegments?.length || 0) - 1 && <ArrowRight size={10} className="ml-1 text-gray-400" />}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        v.purpose
                                                    )}
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    {v.calledAt && (new Date().getTime() - new Date(v.calledAt).getTime() < 60000) ? (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded animate-pulse">
                                                            <Volume2 size={14} />
                                                            Calling...
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCallVisitor(v)}
                                                            className="flex items-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded shadow-sm hover:shadow active:scale-95 transition-all"
                                                        >
                                                            <Volume2 size={14} />
                                                            Call
                                                        </button>
                                                    )}
                                                    {onViewVisits && (
                                                        <button
                                                            onClick={() => onViewVisits(v.contactId, v.name)}
                                                            className="flex items-center gap-1 text-xs font-semibold text-lyceum-blue hover:text-lyceum-blue-dark px-2 py-1 rounded hover:bg-lyceum-blue/5"
                                                        >
                                                            <ArrowRight size={14} />
                                                            Details
                                                        </button>
                                                    )}
                                                </div>
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

                {followUpVisitor && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
                            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Forward Visitor</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Select the department you want to refer <b>{followUpVisitor.name}</b> to for follow up.
                            </p>

                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Staff Member</label>
                            <select
                                value={targetStaff}
                                onChange={(e) => setTargetStaff(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-6 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-lyceum-blue"
                            >
                                {staffMembers.map(staff => (
                                    <option key={staff.id} value={staff.email}>
                                        {staff.name} ({staff.email})
                                    </option>
                                ))}
                            </select>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setFollowUpVisitor(null)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmFollowUp}
                                    className="px-4 py-2 bg-lyceum-blue text-white rounded hover:bg-lyceum-blue-dark transition-colors font-semibold"
                                >
                                    Confirm Forward
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                    <div key={task.id} className="group flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <input
                                            type="checkbox"
                                            onChange={() => handleTaskDone(task)}
                                            className="mt-1.5 w-4 h-4 rounded border-gray-300 text-lyceum-blue focus:ring-lyceum-blue"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{task.title}</div>
                                            {task.description && <div className="text-xs text-gray-500 line-clamp-1">{task.description}</div>}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${task.priority === 'High' ? 'bg-red-100 text-red-600' :
                                                    task.priority === 'Low' ? 'bg-blue-100 text-blue-600' :
                                                        'bg-yellow-100 text-yellow-600'
                                                    }`}>
                                                    {task.priority || 'Med'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">Due: {task.dueDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                            <AlertCircle className="text-lyceum-blue" />
                            My Tickets
                        </h2>
                        {(() => {
                            const myTickets = tickets.filter(t =>
                                (user.role === 'Admin' || t.assignedTo === user.id) &&
                                t.status !== 'Closed' && t.status !== 'Resolved'
                            );

                            return myTickets.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No active tickets.</div>
                            ) : (
                                <div className="space-y-3">
                                    {myTickets.map(ticket => (
                                        <div
                                            key={ticket.id}
                                            onClick={() => onTicketSelect?.(ticket.id)}
                                            className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="text-[10px] font-mono font-bold text-lyceum-blue">{ticket.ticketId}</div>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${ticket.priority === 'Urgent' ? 'bg-red-100 text-red-600' :
                                                    ticket.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {ticket.priority}
                                                </span>
                                            </div>
                                            <div className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate group-hover:text-lyceum-blue transition-colors">{ticket.subject}</div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                                                    {ticket.contactName || 'General Query'}
                                                </div>
                                                <div className="text-[10px] text-gray-400">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentDashboard;
