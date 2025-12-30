

import React from 'react';
import type { Contact, LmsCourse } from '../types';
import { GraduationCap, BookOpen, CalendarClock, Paperclip, CheckCircle2, Circle } from './icons';
import { SAMPLE_EVENTS } from '../hooks/calendar';

interface StudentDashboardProps {
  student?: Contact;
  courses: LmsCourse[];
  onAppSelect: (appName: string) => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
            <div className="p-2 rounded-full bg-lyceum-blue/10 dark:bg-lyceum-blue/20 text-lyceum-blue mr-3">
                {icon}
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
        {children}
    </div>
);

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, courses, onAppSelect }) => {

  if (!student) {
    return (
      <div className="animate-fade-in text-center py-12">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Welcome, Student!</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Your student profile could not be loaded. Please contact support.</p>
      </div>
    );
  }
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  const upcomingEvents = SAMPLE_EVENTS
    .filter(e => e.start >= today && e.start <= nextWeek)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 3);
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