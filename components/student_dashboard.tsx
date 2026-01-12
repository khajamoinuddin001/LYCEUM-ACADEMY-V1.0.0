

import React, { useEffect, useState } from 'react';
import type { Contact, LmsCourse, CalendarEvent, Visitor } from '../types';
import { GraduationCap, BookOpen, CalendarClock, Paperclip, CheckCircle2, Circle, Trophy, Calendar } from './icons';
import * as api from '../utils/api';

interface StudentDashboardProps {
    student?: Contact;
    courses: LmsCourse[];
    events: CalendarEvent[];
    onAppSelect: (appName: string) => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 ${className}`}>
        <div className="flex items-center mb-5">
            <div className="p-2.5 rounded-lg bg-lyceum-blue/10 dark:bg-lyceum-blue/20 text-lyceum-blue mr-3.5">
                {icon}
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
        {children}
    </div>
);

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, courses, events, onAppSelect }) => {
    const [visits, setVisits] = useState<Visitor[]>([]);

    useEffect(() => {
        if (student) {
            api.getContactVisits(student.id).then(setVisits).catch(console.error);
        }
    }, [student]);

    if (!student) {
        return (
            <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600">
                <div className="bg-lyceum-blue/10 p-4 rounded-full mb-4">
                    <GraduationCap size={48} className="text-lyceum-blue" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Welcome to Lyceum Academy!</h1>
                <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-md">Your student profile is being initialized. If this message persists, please contact support.</p>
                <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue/90 transition-colors">Refresh Dashboard</button>
            </div>
        );
    }

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingEvents = (events || [])
        .filter(e => {
            const start = new Date(e.start);
            return start >= today && start <= nextWeek;
        })
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 5);

    const checklist = student.checklist || [];
    const completedCount = checklist.filter(item => item.completed).length;
    const totalCount = checklist.length;
    const checklistProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome, {student.name}!</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Here's a summary of your academic progress and activities.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <InfoCard icon={<BookOpen size={20} />} title="Enrolled Courses">
                        <div className="space-y-4">
                            {courses.map(course => {
                                const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
                                const completedLessons = student.lmsProgress?.[course.id]?.completedLessons.length || 0;
                                const courseProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

                                return (
                                    <div key={course.id}>
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{course.title}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{completedLessons}/{totalLessons} lessons</p>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                            <div className="bg-lyceum-blue h-2.5 rounded-full" style={{ width: `${courseProgress}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="mt-4 text-right">
                            <button onClick={() => onAppSelect('LMS')} className="text-sm font-medium text-lyceum-blue hover:underline">Go to LMS</button>
                        </div>
                    </InfoCard>

                    <InfoCard icon={<Calendar size={20} />} title="Campus Visits">
                        {visits.length > 0 ? (
                            <ul className="space-y-3">
                                {visits.slice(0, 5).map(visit => (
                                    <li key={visit.id} className="flex flex-col border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                {new Date(visit.checkIn || visit.createdAt!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${visit.status === 'Checked-in' ? 'bg-green-100 text-green-800' :
                                                    visit.status === 'Checked-out' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                                                }`}>{visit.status}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Purpose: {visit.purpose || 'N/A'}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No campus visits recorded.</p>
                        )}
                    </InfoCard>
                </div>
                <div className="space-y-6">
                    <InfoCard icon={<CheckCircle2 size={20} />} title="Application Checklist">
                        {checklist.length > 0 ? (
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-lyceum-blue">Progress</span>
                                    <span className="text-sm font-medium text-lyceum-blue">{completedCount} of {totalCount} complete</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div className="bg-lyceum-blue h-2.5 rounded-full" style={{ width: `${checklistProgress}%` }}></div>
                                </div>
                                <ul className="mt-3 space-y-2">
                                    {checklist.map(item => (
                                        <li key={item.id} className="flex items-center text-sm">
                                            {item.completed ? <CheckCircle2 size={16} className="text-green-500 mr-2 flex-shrink-0" /> : <Circle size={16} className="text-gray-300 dark:text-gray-600 mr-2 flex-shrink-0" />}
                                            <span className={`${item.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{item.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">Checklist not available.</p>
                        )}
                    </InfoCard>

                    <InfoCard icon={<CalendarClock size={20} />} title="Upcoming Deadlines">
                        {upcomingEvents.length > 0 ? (
                            <ul className="space-y-3">
                                {upcomingEvents.map(event => (
                                    <li key={event.id} className="flex items-start">
                                        <div className="text-center mr-4 flex-shrink-0">
                                            <p className="text-xs text-red-500 font-bold">{event.start.toLocaleString('default', { month: 'short' }).toUpperCase()}</p>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100 -mt-1">{event.start.getDate()}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{event.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No deadlines in the next 7 days.</p>
                        )}
                    </InfoCard>

                    <InfoCard icon={<Paperclip size={20} />} title="Your Documents">
                        {student.documents && student.documents.length > 0 ? (
                            <ul className="space-y-2">
                                {student.documents.map((doc) => (
                                    <li key={doc.id} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-800 dark:text-gray-200 truncate pr-2">{doc.name}</span>
                                        <button className="flex-shrink-0 text-lyceum-blue hover:underline font-medium">Download</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No documents on file.</p>
                        )}
                    </InfoCard>
                </div>
            </div>
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

export default StudentDashboard;