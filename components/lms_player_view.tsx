import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { LmsCourse, LmsLesson, LmsModule, Contact, User, QuizQuestion } from '../types';
import { ArrowLeft, BookOpen, ChevronDown, CheckCircle2, Circle, Video, Plus, Edit, Trash2, X, Paperclip, FileQuestion, FileText, ChevronLeft, ChevronRight, MessageCircle } from './icons';
import CourseDiscussionsView from './course_discussions_view';
const Quiz: React.FC<{ questions: QuizQuestion[]; onQuizAttempted: () => void; }> = ({ questions, onQuizAttempted }) => {
    const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleSelectAnswer = (questionId: string, optionIndex: number) => {
        if (isSubmitted) return;
        setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const handleSubmit = () => {
        let correctAnswers = 0;
        questions.forEach(q => {
            if (selectedAnswers[q.id] === q.correctAnswerIndex) {
                correctAnswers++;
            }
        });
        setScore(correctAnswers);
        setIsSubmitted(true);
        onQuizAttempted();
    };

    const allQuestionsAnswered = Object.keys(selectedAnswers).length === questions.length;

    return (
        <div className="space-y-6">
            {questions.map((q, index) => {
                const isCorrect = isSubmitted && selectedAnswers[q.id] === q.correctAnswerIndex;
                const selectedIncorrect = isSubmitted && selectedAnswers[q.id] !== q.correctAnswerIndex;
                return (
                    <div key={q.id}>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{index + 1}. {q.question}</p>
                        <div className="mt-2 space-y-2">
                            {q.options.map((option, optIndex) => {
                                let optionClass = "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50";
                                if (isSubmitted) {
                                    if (optIndex === q.correctAnswerIndex) {
                                        optionClass = "border-green-500 bg-green-50 dark:bg-green-900/50";
                                    } else if (optIndex === selectedAnswers[q.id]) {
                                        optionClass = "border-red-500 bg-red-50 dark:bg-red-900/50";
                                    }
                                }
                                return (
                                <label key={optIndex} className={`flex items-center p-3 rounded-md border cursor-pointer ${optionClass}`}>
                                    <input type="radio" name={q.id} checked={selectedAnswers[q.id] === optIndex} onChange={() => handleSelectAnswer(q.id, optIndex)} disabled={isSubmitted} className="h-4 w-4 text-lyceum-blue focus:ring-lyceum-blue" />
                                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-200">{option}</span>
                                </label>
                            )})}
                        </div>
                         {isSubmitted && selectedIncorrect && <p className="text-xs text-green-600 mt-1">Correct answer: {q.options[q.correctAnswerIndex]}</p>}
                    </div>
                );
            })}
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                {isSubmitted ? (
                    <div className="w-full text-center sm:text-left text-lg font-bold text-lyceum-blue p-3 bg-lyceum-blue/10 rounded-lg">
                        Your Score: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
                    </div>
                ) : (
                    <button onClick={handleSubmit} disabled={!allQuestionsAnswered} className="w-full sm:w-auto px-6 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark disabled:bg-gray-400">
                        Check Answers
                    </button>
                )}
            </div>
        </div>
    );
};
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}


interface LmsPlayerViewProps {
  course: LmsCourse;
  student?: Contact;
  user: User;
  users: User[];
  onBack: () => void;
  onMarkComplete: (courseId: string, lessonId: string) => void;
  onSaveNote: (lessonId: string, note: string) => void;
  onSavePost: (courseId: string, threadId: string | 'new', postContent: { title?: string; content: string }) => void;
}

const LmsPlayerView: React.FC<LmsPlayerViewProps> = (props) => {
    const { course, student, user, users, onBack, onMarkComplete, onSaveNote, onSavePost } = props;

    const findInitialLesson = () => {
        if (!course.modules || course.modules.length === 0) return null;
        for (const module of course.modules) {
            if (module.lessons && module.lessons.length > 0) {
                return module.lessons[0];
            }
        }
        return null;
    };

    const [activeLesson, setActiveLesson] = useState<LmsLesson | null>(findInitialLesson());
    const [openModuleIds, setOpenModuleIds] = useState<Set<string>>(new Set(course.modules.map(m => m.id)));
    const [activeTab, setActiveTab] = useState<'resources' | 'quiz' | 'notes' | 'discussions'>('resources');
    const [note, setNote] = useState('');
    const debouncedNote = useDebounce(note, 1000);
    
    useEffect(() => {
        if (activeLesson && debouncedNote !== student?.lmsNotes?.[activeLesson.id]) {
            onSaveNote(activeLesson.id, debouncedNote);
        }
    }, [debouncedNote, activeLesson, onSaveNote, student]);

    useEffect(() => {
        if (activeLesson) {
            const moduleId = course.modules.find(m => m.lessons.some(l => l.id === activeLesson.id))?.id;
            if (moduleId && !openModuleIds.has(moduleId)) {
                setOpenModuleIds(prev => new Set(prev).add(moduleId));
            }
            const hasAttachments = activeLesson.attachments && activeLesson.attachments.length > 0;
            const hasQuiz = activeLesson.quiz && activeLesson.quiz.length > 0;
            if (!hasAttachments && hasQuiz) setActiveTab('quiz');
            else if (!hasAttachments && !hasQuiz) setActiveTab('notes');
            else setActiveTab('resources');
            
            setNote(student?.lmsNotes?.[activeLesson.id] || '');
        }
    }, [activeLesson, course.modules, student]);

    const isCompleted = student?.lmsProgress?.[course.id]?.completedLessons.includes(activeLesson?.id || '') || false;
    
    const allLessons = course.modules.flatMap(m => m.lessons);
    const currentIndex = activeLesson ? allLessons.findIndex(l => l.id === activeLesson.id) : -1;
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    const completedLessons = student?.lmsProgress?.[course.id]?.completedLessons || [];
    const totalLessons = allLessons.length;
    const progress = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0;

    return (
        <div className="animate-fade-in flex flex-col md:flex-row h-full gap-6">
            {/* sidebar */}
            <aside className="w-full md:w-1/3 xl:w-1/4 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button onClick={onBack} className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-lyceum-blue mb-2">
                        <ArrowLeft size={14} className="mr-1" /> All Courses
                    </button>
                    <h2 className="font-bold text-gray-800 dark:text-gray-100 truncate">{course.title}</h2>
                     <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progress</span>
                            <span className="text-xs font-semibold text-lyceum-blue">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                            <div className="bg-lyceum-blue h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {course.modules.map((module, index) => (
                        <div key={module.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                             <button onClick={() => setOpenModuleIds(p => { const n = new Set(p); n.has(module.id) ? n.delete(module.id) : n.add(module.id); return n; })} className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Module {index+1}: {module.title}</span>
                                <ChevronDown size={18} className={`text-gray-500 transition-transform ${openModuleIds.has(module.id) ? 'rotate-180' : ''}`} />
                            </button>
                            {openModuleIds.has(module.id) && (
                                <ul className="py-1">
                                    {module.lessons.map(lesson => {
                                        const isLessonCompleted = completedLessons.includes(lesson.id);
                                        const isLessonActive = activeLesson?.id === lesson.id;
                                        return (
                                            <li key={lesson.id}>
                                                <button onClick={() => setActiveLesson(lesson)} className={`w-full flex items-center p-3 text-left text-sm ${isLessonActive ? 'bg-lyceum-blue/10 text-lyceum-blue font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                                    {isLessonCompleted ? <CheckCircle2 size={16} className="text-green-500 mr-3 flex-shrink-0" /> : <Circle size={16} className="text-gray-300 dark:text-gray-600 mr-3 flex-shrink-0" />}
                                                    <span className="flex-grow truncate">{lesson.title}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </aside>
            
            {/* main area */}
            <main className="w-full md:w-2/3 xl:w-3/4 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                {activeLesson ? (
                    <>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{activeLesson.title}</h1>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {/* video */}
                        {activeLesson.videoUrl && (
                            <div className="aspect-video bg-black">
                                <video key={activeLesson.videoUrl} className="w-full h-full" controls src={activeLesson.videoUrl} />
                            </div>
                        )}
                        {/* content */}
                        <div className="p-6 prose dark:prose-invert max-w-none">
                             <p>{activeLesson.content.replace(/###\s/g, '').replace(/```python\n/g, '').replace(/```/g, '')}</p>
                        </div>
                        {/* tabs */}
                        <div className="px-6">
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <nav className="-mb-px flex space-x-4">
                                    {(activeLesson.attachments && activeLesson.attachments.length > 0) && <button onClick={() => setActiveTab('resources')} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'resources' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Paperclip size={14}/>Resources</button>}
                                    {(activeLesson.quiz && activeLesson.quiz.length > 0) && <button onClick={() => setActiveTab('quiz')} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'quiz' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FileQuestion size={14}/>Quiz</button>}
                                    <button onClick={() => setActiveTab('discussions')} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'discussions' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><MessageCircle size={14}/>Discussions</button>
                                    {user.role === 'Student' && <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'notes' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FileText size={14}/>My Notes</button>}
                                </nav>
                            </div>
                            <div className="py-6">
                                {activeTab === 'resources' && activeLesson.attachments && <ul className="space-y-2">
                                    {activeLesson.attachments.map(att => (<li key={att.id}><a href={att.url} download={att.name} className="flex items-center p-3 rounded-md bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-lyceum-blue"><Paperclip size={16} className="mr-3 text-gray-400"/>{att.name}</a></li>))}
                                </ul>}
                                {activeTab === 'quiz' && activeLesson.quiz && <Quiz questions={activeLesson.quiz} onQuizAttempted={() => {}} />}
                                {activeTab === 'discussions' && <CourseDiscussionsView course={course} user={user} users={users} onSavePost={onSavePost} />}
                                {activeTab === 'notes' && user.role === 'Student' && (
                                    <div>
                                        <label htmlFor="lesson-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Use this space for your personal notes.</label>
                                        <textarea id="lesson-notes" value={note} onChange={e => setNote(e.target.value)} rows={8} className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Type your notes here... they will be saved automatically." />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                        {/* navigation buttons */}
                        <div className="flex items-center gap-4">
                            <button onClick={() => prevLesson && setActiveLesson(prevLesson)} disabled={!prevLesson} className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50"><ChevronLeft size={16} className="mr-2"/>Previous</button>
                            <button onClick={() => nextLesson && setActiveLesson(nextLesson)} disabled={!nextLesson} className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50">Next<ChevronRight size={16} className="ml-2"/></button>
                        </div>
                        {/* mark complete */}
                        <button onClick={() => onMarkComplete(course.id, activeLesson.id)} disabled={isCompleted} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400">
                            <CheckCircle2 size={16} className="mr-2" />
                            {isCompleted ? 'Completed' : 'Mark as Complete'}
                        </button>
                    </div>
                    </>
                ) : (
                     <div className="flex-grow flex items-center justify-center text-center p-6">
                        <div className="text-gray-500 dark:text-gray-400">
                            <BookOpen size={48} className="mx-auto" />
                            <h3 className="mt-2 text-lg font-semibold">Select a lesson to begin</h3>
                            <p className="text-sm">Choose a lesson from the course outline on the left to start learning.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LmsPlayerView;
