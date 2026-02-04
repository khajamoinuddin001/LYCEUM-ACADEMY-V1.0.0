import React, { useState } from 'react';
import { ArrowLeft, BookOpen } from './icons'; // Assuming BookOpen is in icons, if not will use Lucide default import or fix later
import type { Contact, User, LmsCourse } from '../types';
import { StudentProgressModal } from './course_analytics_view';

interface ContactCoursesViewProps {
    contact: Contact;
    user: User;
    onNavigateBack: () => void;
    courses: LmsCourse[];
}

const ContactCoursesView: React.FC<ContactCoursesViewProps> = ({ contact, user, onNavigateBack, courses }) => {
    const [selectedCourse, setSelectedCourse] = useState<LmsCourse | null>(null);

    const enrolledCourses = courses.filter(course => contact.lmsProgress?.[course.id]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm w-full mx-auto animate-fade-in p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button
                        onClick={onNavigateBack}
                        className="mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Courses: {contact.name}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage courses for this contact</p>
                    </div>
                </div>
            </div>

            {enrolledCourses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                    <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No enrolled courses found</h3>
                    <p className="text-gray-500 dark:text-gray-400">This contact is not enrolled in any courses yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledCourses.map(course => {
                        const progress = contact.lmsProgress?.[course.id];
                        const completedCount = progress?.completedLessons.length || 0;
                        const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                        const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

                        return (
                            <div
                                key={course.id}
                                onClick={() => setSelectedCourse(course)}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                            >
                                <div className="h-32 bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden group-hover:opacity-90 transition-opacity">
                                    <div className="absolute inset-0 bg-gradient-to-br from-lyceum-blue/5 to-lyceum-blue/20 flex items-center justify-center text-lyceum-blue/30">
                                        <BookOpen size={64} />
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 truncate group-hover:text-lyceum-blue transition-colors" title={course.title}>{course.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{course.instructor}</p>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
                                            <span>Progress</span>
                                            <span>{Math.round(progressPercent)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-lyceum-blue h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-400 text-right mt-1">
                                            {completedCount} / {totalLessons} lessons
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedCourse && (
                <StudentProgressModal
                    student={contact}
                    course={selectedCourse}
                    onClose={() => setSelectedCourse(null)}
                />
            )}

            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div >
    );
};

export default ContactCoursesView;
