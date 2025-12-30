



import React, { useState, useMemo } from 'react';
import type { LmsCourse, LmsLesson, LmsModule, Contact, User } from '../types';
import { ArrowLeft, BookOpen, ChevronDown, CheckCircle2, Circle, Video, Plus, Edit, Trash2, X, Paperclip, FileQuestion, BarChart3, GraduationCap, IndianRupee, FileText, MessageCircle } from './icons';
import CourseAnalyticsView from './course_analytics_view';
import CourseDiscussionsView from './course_discussions_view';

interface CourseDetailViewProps {
  course: LmsCourse;
  student?: Contact;
  user: User;
  users: User[];
  contacts: Contact[];
  onSelectLesson: (lesson: LmsLesson) => void;
  onBack: () => void;
  onModuleCreate: (courseId: string, title: string) => void;
  onModuleUpdate: (courseId: string, moduleId: string, newTitle: string) => void;
  onModuleDelete: (courseId: string, moduleId: string) => void;
  onLessonCreate: (moduleId: string) => void;
  onLessonUpdate: (lesson: LmsLesson) => void;
  onLessonDelete: (courseId: string, lessonId: string) => void;
  onViewCertificate: (course: LmsCourse) => void;
  onInitiatePurchase: (course: LmsCourse) => void;
  onSavePost: (courseId: string, threadId: string | 'new', postContent: { title?: string; content: string }) => void;
}

const ModuleEditor: React.FC<{
    module: LmsModule;
    courseId: string;
    onModuleUpdate: (courseId: string, moduleId: string, newTitle: string) => void;
    onModuleDelete: (courseId: string, moduleId: string) => void;
}> = ({ module, courseId, onModuleUpdate, onModuleDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(module.title);

    const handleSave = () => {
        if (title.trim() && title.trim() !== module.title) {
            onModuleUpdate(courseId, module.id, title.trim());
        }
        setIsEditing(false);
    }
    
    return isEditing ? (
        <div className="flex items-center gap-2">
            <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="bg-transparent text-gray-800 dark:text-gray-100 font-semibold focus:ring-1 focus:ring-lyceum-blue focus:outline-none rounded-md px-1 -ml-1"
                autoFocus
            />
             <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-100 rounded-full"><CheckCircle2 size={16} /></button>
             <button onClick={() => setIsEditing(false)} className="p-1 text-red-600 hover:bg-red-100 rounded-full"><X size={16} /></button>
        </div>
    ) : (
        <div className="flex items-center gap-2 group">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{module.title}</h3>
            <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-lyceum-blue opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={16} /></button>
            <button onClick={() => onModuleDelete(courseId, module.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
        </div>
    );
};

const CourseEnrollmentView: React.FC<{ course: LmsCourse; onPurchase: () => void; }> = ({ course, onPurchase }) => {
    const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
    const totalAttachments = course.modules.reduce((acc, mod) => acc + mod.lessons.reduce((lAcc, l) => lAcc + (l.attachments?.length || 0), 0), 0);
    const totalQuizzes = course.modules.reduce((acc, mod) => acc + mod.lessons.reduce((lAcc, l) => lAcc + (l.quiz?.length ? 1 : 0), 0), 0);

    return (
        <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Course Curriculum</h3>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 -mr-4">
                        {course.modules.map((module, index) => (
                            <div key={module.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-200">Module {index+1}: {module.title}</h4>
                                <ul className="mt-2 ml-4 list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    {module.lessons.map(lesson => (
                                        <li key={lesson.id}>{lesson.title}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-1 space-y-4">
                    <div className="p-4 bg-lyceum-blue/5 dark:bg-lyceum-blue/10 rounded-lg border border-lyceum-blue/20 sticky top-6">
                        <p className="text-3xl font-bold text-lyceum-blue-dark dark:text-lyceum-blue flex items-center">
                            <IndianRupee size={28} className="mr-1" />
                            {course.price?.toLocaleString('en-IN') ?? 'Free'}
                        </p>
                        <button onClick={onPurchase} className="w-full mt-4 px-6 py-3 bg-lyceum-blue text-white rounded-md shadow-sm text-lg font-semibold hover:bg-lyceum-blue-dark transition-colors">
                            Buy Now
                        </button>
                         <div className="mt-4 pt-4 border-t border-lyceum-blue/20 space-y-2 text-sm">
                            <h4 className="font-semibold text-gray-700 dark:text-gray-200">This course includes:</h4>
                            <p className="flex items-center text-gray-600 dark:text-gray-300"><BookOpen size={16} className="mr-2 text-gray-500" /> {course.modules.length} modules</p>
                            <p className="flex items-center text-gray-600 dark:text-gray-300"><Paperclip size={16} className="mr-2 text-gray-500" /> {totalLessons} lessons</p>
                            {totalAttachments > 0 && <p className="flex items-center text-gray-600 dark:text-gray-300"><FileText size={16} className="mr-2 text-gray-500" /> {totalAttachments} resources</p>}
                            {totalQuizzes > 0 && <p className="flex items-center text-gray-600 dark:text-gray-300"><FileQuestion size={16} className="mr-2 text-gray-500" /> {totalQuizzes} quizzes</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CourseDetailView: React.FC<CourseDetailViewProps> = (props) => {
    const { course, student, user, users, contacts, onSelectLesson, onBack, onModuleCreate, onModuleUpdate, onModuleDelete, onLessonCreate, onLessonUpdate, onLessonDelete, onViewCertificate, onInitiatePurchase } = props;
    const [openModuleId, setOpenModuleId] = useState<string | null>(course.modules[0]?.id || null);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [viewMode, setViewMode] = useState<'content' | 'analytics' | 'discussions'>('content');

    const isAdmin = user.role === 'Admin';
    const isEnrolled = !!(student?.lmsProgress?.[course.id]);
    const isStudent = user.role === 'Student';

    const enrolledStudents = useMemo(() => 
        contacts.filter(c => c.lmsProgress && course.id in c.lmsProgress), 
    [contacts, course.id]);

    const toggleModule = (moduleId: string) => {
        setOpenModuleId(openModuleId === moduleId ? null : moduleId);
    };

    const handleAddModule = () => {
        onModuleCreate(course.id, newModuleTitle);
        setNewModuleTitle('');
    };

    const completedLessons = student?.lmsProgress?.[course.id]?.completedLessons || [];
    const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
    const progress = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0;
    const isCourseCompleted = progress >= 100;

    if (isStudent && !isEnrolled) {
        return (
            <div className="animate-fade-in max-w-6xl mx-auto">
                <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Courses
                </button>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{course.title}</h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    Taught by <span className="font-medium text-gray-700 dark:text-gray-300">{course.instructor}</span>
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">{course.description}</p>
                            </div>
                            <div className="p-3 rounded-full bg-lyceum-blue/10 dark:bg-lyceum-blue/20 text-lyceum-blue ml-4 flex-shrink-0">
                                <GraduationCap size={24} />
                            </div>
                        </div>
                    </div>
                    
                    <CourseEnrollmentView course={course} onPurchase={() => onInitiatePurchase(course)} />
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
        )
    }

    const CourseContent = () => (
        <div className="border-t border-gray-200 dark:border-gray-700">
            {course.modules.map((module, index) => (
                <div key={module.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <button onClick={() => toggleModule(module.id)} className="flex items-center text-left flex-grow">
                            <span className="text-lg font-bold text-lyceum-blue mr-4">{String(index + 1).padStart(2, '0')}</span>
                            {isAdmin ? (
                                <ModuleEditor module={module} courseId={course.id} onModuleUpdate={onModuleUpdate} onModuleDelete={onModuleDelete} />
                            ) : (
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{module.title}</h3>
                            )}
                        </button>
                        <button onClick={() => toggleModule(module.id)}>
                            <ChevronDown size={20} className={`text-gray-500 transition-transform ${openModuleId === module.id ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                    {openModuleId === module.id && (
                        <div className="bg-gray-50/50 dark:bg-gray-900/20">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {module.lessons.map(lesson => {
                                    const isCompleted = completedLessons.includes(lesson.id);
                                    return (
                                        <li key={lesson.id} className="group flex items-center pr-4">
                                            <button onClick={() => onSelectLesson(lesson)} className="w-full flex items-center p-4 pl-16 text-left hover:bg-lyceum-blue/5 dark:hover:bg-lyceum-blue/10 flex-grow">
                                                {isCompleted ? <CheckCircle2 size={18} className="text-green-500 mr-3 flex-shrink-0" /> : <Circle size={18} className="text-gray-300 dark:text-gray-600 mr-3 flex-shrink-0" />}
                                                <span className={`text-sm ${isCompleted ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {lesson.title}
                                                </span>
                                                <div className="ml-auto flex items-center gap-3 pl-2">
                                                    {lesson.attachments && lesson.attachments.length > 0 && <Paperclip size={16} className="text-gray-400 dark:text-gray-500" />}
                                                    {lesson.quiz && lesson.quiz.length > 0 && <FileQuestion size={16} className="text-gray-400 dark:text-gray-500" />}
                                                    {lesson.videoUrl && <Video size={16} className="text-gray-400 dark:text-gray-500" />}
                                                </div>
                                            </button>
                                            {isAdmin && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => onLessonUpdate(lesson)} className="p-1 text-gray-400 hover:text-lyceum-blue"><Edit size={16} /></button>
                                                    <button onClick={() => onLessonDelete(course.id, lesson.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            {isAdmin && (
                                <div className="p-4 pl-16">
                                    <button onClick={() => onLessonCreate(module.id)} className="flex items-center text-sm font-medium text-lyceum-blue hover:underline">
                                        <Plus size={16} className="mr-2" /> Add Lesson
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
            {isAdmin && (
                <div className="p-4 flex items-center gap-2">
                     <input 
                        type="text"
                        placeholder="New module title..."
                        value={newModuleTitle}
                        onChange={(e) => setNewModuleTitle(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button onClick={handleAddModule} disabled={!newModuleTitle.trim()} className="px-3 py-2 text-sm bg-lyceum-blue text-white rounded-md hover:bg-lyceum-blue-dark disabled:opacity-50">
                        <Plus size={16} />
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-4 transition-colors">
                <ArrowLeft size={16} className="mr-2" />
                Back to Courses
            </button>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{course.title}</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Taught by <span className="font-medium text-gray-700 dark:text-gray-300">{course.instructor}</span>
                            </p>
                            {course.price !== undefined && (
                                <p className="mt-2 text-3xl font-bold text-lyceum-blue-dark dark:text-lyceum-blue flex items-center">
                                    <IndianRupee size={28} className="mr-2" />
                                    {course.price.toLocaleString('en-IN')}
                                </p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{course.description}</p>
                        </div>
                        <div className="flex-shrink-0 ml-4 flex flex-col items-end gap-4">
                            <div className="p-3 rounded-full bg-lyceum-blue/10 dark:bg-lyceum-blue/20 text-lyceum-blue">
                                <BookOpen size={24} />
                            </div>
                            {user.role === 'Student' && isCourseCompleted && (
                                <button 
                                    onClick={() => onViewCertificate(course)}
                                    className="inline-flex items-center px-3 py-2 text-sm font-semibold text-yellow-900 bg-yellow-400 rounded-md shadow-sm hover:bg-yellow-500 whitespace-nowrap"
                                >
                                    <GraduationCap size={16} className="mr-2" />
                                    View Certificate
                                </button>
                            )}
                        </div>
                    </div>
                     <div className="mt-4">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-lyceum-blue">Course Progress</span>
                            <span className="text-sm font-medium text-lyceum-blue">{completedLessons.length} of {totalLessons} complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div className="bg-lyceum-blue h-2.5 rounded-full transition-width duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="border-b border-t border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-4 px-6">
                        <button
                            onClick={() => setViewMode('content')}
                            className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${viewMode === 'content' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            <BookOpen size={16} /> Content
                        </button>
                         <button
                            onClick={() => setViewMode('discussions')}
                            className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${viewMode === 'discussions' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}
                        >
                            <MessageCircle size={16} /> Discussions
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setViewMode('analytics')}
                                className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${viewMode === 'analytics' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            >
                                <BarChart3 size={16} /> Analytics
                            </button>
                        )}
                    </nav>
                </div>
                
                {viewMode === 'analytics' && isAdmin ? (
                    <CourseAnalyticsView course={course} enrolledStudents={enrolledStudents} />
                ) : viewMode === 'discussions' ? (
                    <CourseDiscussionsView course={course} user={user} users={users} onSavePost={props.onSavePost} />
                ) : (
                    <CourseContent />
                )}
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

export default CourseDetailView;