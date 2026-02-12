import React, { useMemo, useState } from 'react';
import type { LmsCourse, Contact, LmsModule, LmsLesson } from '@/types';
import { Users, TrendingUp, CheckCircle2, ChevronDown, ChevronRight, X, FileText } from '@/components/common/icons';

interface CourseAnalyticsViewProps {
    course: LmsCourse;
    enrolledStudents: Contact[];
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
        <div className="flex items-center">
            <div className="p-2 rounded-full bg-lyceum-blue/10 text-lyceum-blue mr-3">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
            </div>
        </div>
    </div>
);

const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

export const StudentProgressModal: React.FC<{
    student: Contact;
    course: LmsCourse;
    onClose: () => void;
}> = ({ student, course, onClose }) => {
    // Re-calculate progress from the passed student object to ensure it's fresh
    // The student object passed here is from the click event, so it might need a re-fetch if not updated relative to the parent state.
    // However, CourseAnalyticsView recalculates studentProgressData on every render, and passes the specific student object.

    // We access the lmsProgress directly from the student object.
    const progress = student.lmsProgress?.[course.id] || { completedLessons: [] };
    const notes = student.lmsNotes || {};

    const overallProgress = useMemo(() => {
        const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
        if (totalLessons === 0) return 0;
        // Use the length of unique completed lessons.
        const uniqueCompleted = new Set(progress.completedLessons).size;
        return (uniqueCompleted / totalLessons) * 100;
    }, [course, progress]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-lyceum-blue/20 text-lyceum-blue flex items-center justify-center font-bold text-lg mr-3">
                            {getInitials(student.name)}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{student.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 bg-lyceum-blue/5 border-b border-lyceum-blue/10">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-lyceum-blue">Overall Progress</span>
                        <span className="text-lg font-bold text-lyceum-blue">{Math.round(overallProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-lyceum-blue h-2.5 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
                    </div>
                </div>

                <div className="overflow-y-auto p-4 flex-1 space-y-4">
                    {course.modules.map((module) => (
                        <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                                {module.title}
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {module.lessons.map((lesson) => {
                                    const isCompleted = progress.completedLessons.includes(lesson.id);
                                    const noteContent = notes[lesson.id];
                                    const hasNotes = !!noteContent;

                                    return (
                                        <div key={lesson.id} className="group">
                                            <div className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    {isCompleted ? (
                                                        <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                                                    )}
                                                    <span className={`text-sm ${isCompleted ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {lesson.title}
                                                    </span>
                                                </div>
                                            </div>
                                            {hasNotes && (
                                                <div className="px-4 pb-3 pl-11">
                                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-md p-3">
                                                        <div className="flex items-center text-xs font-semibold text-amber-700 dark:text-amber-500 mb-1">
                                                            <FileText size={12} className="mr-1.5" />
                                                            Student Note
                                                        </div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                            {noteContent}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const CourseAnalyticsView: React.FC<CourseAnalyticsViewProps> = ({ course, enrolledStudents }) => {
    const [selectedStudent, setSelectedStudent] = useState<Contact | null>(null);

    const totalLessons = useMemo(() => {
        return course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    }, [course]);

    const analyticsData = useMemo(() => {
        if (enrolledStudents.length === 0 || totalLessons === 0) {
            return {
                enrollment: enrolledStudents.length,
                avgProgress: 0,
                completionRate: 0,
                studentProgressData: [],
                lessonEngagement: [],
            };
        }

        let totalProgressSum = 0;
        let completedStudentsCount = 0;
        const studentProgressData = enrolledStudents.map(student => {
            const progress = student.lmsProgress?.[course.id];
            const completedCount = progress?.completedLessons.length || 0;
            const progressPercent = (completedCount / totalLessons) * 100;
            totalProgressSum += progressPercent;
            if (progressPercent === 100) {
                completedStudentsCount++;
            }
            return {
                id: student.id,
                name: student.name,
                progress: progressPercent,
            };
        });

        const lessonEngagement = course.modules.flatMap(m => m.lessons).map(lesson => {
            const completions = enrolledStudents.filter(s => s.lmsProgress?.[course.id]?.completedLessons.includes(lesson.id)).length;
            return {
                id: lesson.id,
                title: lesson.title,
                completionRate: (completions / enrolledStudents.length) * 100,
            };
        });

        return {
            enrollment: enrolledStudents.length,
            avgProgress: totalProgressSum / enrolledStudents.length,
            completionRate: (completedStudentsCount / enrolledStudents.length) * 100,
            studentProgressData: studentProgressData.sort((a, b) => b.progress - a.progress),
            lessonEngagement,
        };
    }, [course, enrolledStudents, totalLessons]);


    if (enrolledStudents.length === 0) {
        return <div className="p-6 text-center text-gray-500 dark:text-gray-400">No students are enrolled in this course yet.</div>;
    }

    return (
        <div className="p-6 space-y-6">
            { }
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard title="Total Enrollment" value={analyticsData.enrollment} icon={<Users size={20} />} />
                <KpiCard title="Average Progress" value={`${Math.round(analyticsData.avgProgress)}%`} icon={<TrendingUp size={20} />} />
                <KpiCard title="Completion Rate" value={`${Math.round(analyticsData.completionRate)}%`} icon={<CheckCircle2 size={20} />} />
            </div>

            { }
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Student Progress</h3>
                <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Progress</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {analyticsData.studentProgressData.map(studentSummary => (
                                <tr key={studentSummary.id} onClick={() => {
                                    const fullStudent = enrolledStudents.find(s => s.id === studentSummary.id);
                                    if (fullStudent) setSelectedStudent(fullStudent);
                                }} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-lyceum-blue/20 text-lyceum-blue flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">{getInitials(studentSummary.name)}</div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{studentSummary.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-4">
                                                <div className="bg-lyceum-blue h-2.5 rounded-full" style={{ width: `${studentSummary.progress}%` }}></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-12 text-right">{Math.round(studentSummary.progress)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            { }
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Lesson Engagement</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {analyticsData.lessonEngagement.map(lesson => (
                        <div key={lesson.id}>
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="text-gray-700 dark:text-gray-200 truncate pr-4">{lesson.title}</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-100">{Math.round(lesson.completionRate)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${lesson.completionRate}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedStudent && (
                <StudentProgressModal
                    student={selectedStudent}
                    course={course}
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
}

export default CourseAnalyticsView;