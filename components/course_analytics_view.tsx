import React, { useMemo } from 'react';
import type { LmsCourse, Contact } from '../types';
import { Users, TrendingUp, CheckCircle2 } from './icons';

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


const CourseAnalyticsView: React.FC<CourseAnalyticsViewProps> = ({ course, enrolledStudents }) => {

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
            studentProgressData: studentProgressData.sort((a,b) => b.progress - a.progress),
            lessonEngagement,
        };
    }, [course, enrolledStudents, totalLessons]);


    if (enrolledStudents.length === 0) {
        return <div className="p-6 text-center text-gray-500 dark:text-gray-400">No students are enrolled in this course yet.</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard title="Total Enrollment" value={analyticsData.enrollment} icon={<Users size={20} />} />
                <KpiCard title="Average Progress" value={`${Math.round(analyticsData.avgProgress)}%`} icon={<TrendingUp size={20} />} />
                <KpiCard title="Completion Rate" value={`${Math.round(analyticsData.completionRate)}%`} icon={<CheckCircle2 size={20} />} />
            </div>

            {}
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
                           {analyticsData.studentProgressData.map(student => (
                               <tr key={student.id}>
                                   <td className="px-6 py-4 whitespace-nowrap">
                                       <div className="flex items-center">
                                           <div className="w-8 h-8 rounded-full bg-lyceum-blue/20 text-lyceum-blue flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">{getInitials(student.name)}</div>
                                           <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.name}</span>
                                       </div>
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-4">
                                                <div className="bg-lyceum-blue h-2.5 rounded-full" style={{ width: `${student.progress}%` }}></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-12 text-right">{Math.round(student.progress)}%</span>
                                        </div>
                                   </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {}
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
        </div>
    );
}

export default CourseAnalyticsView;