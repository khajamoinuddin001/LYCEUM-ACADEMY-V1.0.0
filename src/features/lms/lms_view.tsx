

import React, { useState, useRef, useEffect } from 'react';
import type { LmsCourse, User, Contact } from '@/types';
import { BookOpen, Plus, MoreHorizontal, Edit, Trash2, IndianRupee } from '@/components/common/icons';

interface LmsViewProps {
  courses: LmsCourse[];
  onCourseSelect: (course: LmsCourse) => void;
  user: User;
  contacts: Contact[];
  onNewCourse: () => void;
  onEditCourse: (course: LmsCourse) => void;
  onDeleteCourse: (courseId: string) => void;
  onInitiatePurchase: (course: LmsCourse) => void;
}

const CourseCard: React.FC<{
    course: LmsCourse;
    progress: number;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isAdmin: boolean;
    isStudent: boolean;
    isEnrolled: boolean;
    onPurchase: () => void;
}> = ({ course, progress, onSelect, onEdit, onDelete, isAdmin, isStudent, isEnrolled, onPurchase }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuAction = (action: 'edit' | 'delete', e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
        if (action === 'edit') onEdit();
        if (action === 'delete') onDelete();
    };

    return (
        <div 
            onClick={onSelect}
            className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
        >
            {isAdmin && (
                <div ref={menuRef} className="absolute top-4 right-4">
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <MoreHorizontal size={20} />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-900 rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                            <button onClick={(e) => handleMenuAction('edit', e)} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <Edit size={14} className="mr-2" /> Edit
                            </button>
                            <button onClick={(e) => handleMenuAction('delete', e)} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                                <Trash2 size={14} className="mr-2" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
            <div className="flex-grow">
                <div className="flex items-start justify-between">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-2 group-hover:text-lyceum-blue pr-8">{course.title}</h3>
                    <div className="p-2 rounded-full bg-lyceum-blue/10 dark:bg-lyceum-blue/20 text-lyceum-blue">
                        <BookOpen size={20} />
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Instructor: {course.instructor}</p>
            </div>
            
            {isStudent && !isEnrolled && course.price !== undefined ? (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <IndianRupee size={20} className="mr-1 text-gray-500 dark:text-gray-400" />
                        {course.price.toLocaleString('en-IN')}
                    </p>
                    <button onClick={(e) => { e.stopPropagation(); onPurchase(); }} className="px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm text-sm font-semibold hover:bg-lyceum-blue-dark">
                        Buy Now
                    </button>
                </div>
            ) : (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="text-xs font-semibold text-lyceum-blue">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-lyceum-blue h-2.5 rounded-full transition-width duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};


const LmsView: React.FC<LmsViewProps> = ({ courses, onCourseSelect, user, contacts, onNewCourse, onEditCourse, onDeleteCourse, onInitiatePurchase }) => {
    const studentContact = contacts.find(c => c.userId === user.id);
    const isAdmin = user.role === 'Admin';
    const isStudent = user.role === 'Student';
    
    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Learning Management System</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Browse and start your enrolled courses.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={onNewCourse}
                        className="inline-flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue"
                    >
                        <Plus size={16} className="mr-2" />
                        New Course
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map(course => {
                    const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
                    const completedLessons = studentContact?.lmsProgress?.[course.id]?.completedLessons.length || 0;
                    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
                    const isEnrolled = !!(studentContact?.lmsProgress?.[course.id]);

                    return (
                        <CourseCard 
                            key={course.id} 
                            course={course}
                            progress={progress}
                            onSelect={() => onCourseSelect(course)}
                            onEdit={() => onEditCourse(course)}
                            onDelete={() => onDeleteCourse(course.id)}
                            isAdmin={isAdmin}
                            isStudent={isStudent}
                            isEnrolled={isEnrolled}
                            onPurchase={() => onInitiatePurchase(course)}
                        />
                    );
                })}
            </div>
            <style>{`
                .line-clamp-2 {
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                }
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

export default LmsView;