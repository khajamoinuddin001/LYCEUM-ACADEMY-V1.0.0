import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { LmsCourse, LmsLesson, LmsModule, Contact, User, QuizQuestion, ClassSession, ActivitySubmission } from '@/types';
import { ArrowLeft, BookOpen, ChevronDown, CheckCircle2, Circle, Video, Plus, Edit, Trash2, X, Paperclip, FileQuestion, FileText, ChevronLeft, ChevronRight, MessageCircle, Monitor, StopCircle, Maximize, Minimize, Users as UsersIcon, Trophy, RefreshCw } from '@/components/common/icons';
import CourseDiscussionsView from './course_discussions_view';
import { io, Socket } from 'socket.io-client';
import { getActiveSession, startClassSession, joinClassSession, updateSlideIndex, updatePdfPage, endClassSession, submitActivityAnswer, API_BASE_URL, getToken } from '@/utils/api';

const Quiz: React.FC<{ questions: QuizQuestion[]; onQuizAttempted: () => void; isLive?: boolean, onAnswerSubmit?: (answer: any) => void }> = ({ questions, onQuizAttempted, isLive, onAnswerSubmit }) => {
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: any }>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleAnswerChange = (questionId: string, answer: any) => {
        if (isSubmitted) return;
        setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = () => {
        let correctAnswers = 0;
        questions.forEach(q => {
            const userAnswer = selectedAnswers[q.id];
            if (q.type === 'mcq') {
                if (userAnswer === q.correctAnswerIndex) correctAnswers++;
            } else if (q.type === 'fill-in-blanks') {
                if (String(userAnswer || '').trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase()) {
                    correctAnswers++;
                }
            } else if (q.type === 'true-false') {
                if (String(userAnswer) === String(q.correctAnswer)) correctAnswers++;
            }
        });
        setScore(correctAnswers);
        setIsSubmitted(true);
        if (isLive && onAnswerSubmit) {
            onAnswerSubmit(selectedAnswers);
        }
        onQuizAttempted();
    };

    const allQuestionsAnswered = Object.keys(selectedAnswers).length === questions.length;

    return (
        <div className="space-y-8 animate-fade-in">
            {questions.map((q, index) => {
                const userAnswer = selectedAnswers[q.id];
                let isCorrect = false;
                if (isSubmitted) {
                    if (q.type === 'mcq') isCorrect = userAnswer === q.correctAnswerIndex;
                    else if (q.type === 'fill-in-blanks') isCorrect = String(userAnswer || '').trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase();
                    else if (q.type === 'true-false') isCorrect = String(userAnswer) === String(q.correctAnswer);
                }

                return (
                    <div key={q.id} className={`p-6 rounded-xl border-2 transition-all ${isSubmitted ? (isCorrect ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-red-500 bg-red-50/50 dark:bg-red-900/10') : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                        <div className="flex items-center gap-3 mb-4">
                           <span className="text-xs font-black text-lyceum-blue bg-lyceum-blue/10 px-2 py-1 rounded tracking-widest uppercase">Question {index + 1}</span>
                           {isSubmitted && (
                               <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                   {isCorrect ? 'Correct' : 'Incorrect'}
                               </span>
                           )}
                        </div>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight mb-6">{q.question}</p>
                        
                        <div className="space-y-3">
                            {q.type === 'mcq' && q.options && q.options.map((option, optIndex) => {
                                const isSelected = userAnswer === optIndex;
                                const isAnswerCorrect = isSubmitted && optIndex === q.correctAnswerIndex;
                                const isSelectedWrong = isSubmitted && isSelected && !isCorrect;

                                let optionClass = "border-gray-200 dark:border-gray-700 hover:border-lyceum-blue/50 bg-gray-50/50 dark:bg-gray-700/30";
                                if (isSubmitted) {
                                    if (isAnswerCorrect) optionClass = "border-green-500 bg-green-500/20 text-green-700 dark:text-green-300 ring-2 ring-green-500/20";
                                    else if (isSelectedWrong) optionClass = "border-red-500 bg-red-500/20 text-red-700 dark:text-red-300 ring-2 ring-red-500/20";
                                    else optionClass = "opacity-50 grayscale border-gray-200 dark:border-gray-700";
                                } else if (isSelected) {
                                    optionClass = "border-lyceum-blue bg-lyceum-blue/10 text-lyceum-blue ring-2 ring-lyceum-blue/20";
                                }

                                return (
                                    <label key={optIndex} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${optionClass}`}>
                                        <input 
                                            type="radio" 
                                            name={q.id} 
                                            checked={isSelected} 
                                            onChange={() => handleAnswerChange(q.id, optIndex)} 
                                            disabled={isSubmitted} 
                                            className="h-5 w-5 text-lyceum-blue focus:ring-lyceum-blue border-2 border-gray-300 bg-white" 
                                        />
                                        <span className="ml-4 text-base font-medium">{option}</span>
                                    </label>
                                )
                            })}

                            {q.type === 'fill-in-blanks' && (
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={userAnswer || ''} 
                                        onChange={e => handleAnswerChange(q.id, e.target.value)} 
                                        disabled={isSubmitted} 
                                        placeholder="Type your answer here..."
                                        className={`w-full px-5 py-4 text-lg font-bold border-2 rounded-xl focus:outline-none transition-all ${isSubmitted ? (isCorrect ? 'border-green-500 text-green-700 dark:text-green-400' : 'border-red-500 text-red-700 dark:text-red-400') : 'border-gray-200 dark:border-gray-700 focus:border-lyceum-blue dark:bg-gray-700'}`}
                                    />
                                    {isSubmitted && !isCorrect && (
                                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                                            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Correct Answer</p>
                                            <p className="text-lg font-black text-gray-800 dark:text-white">{q.correctAnswer}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {q.type === 'true-false' && (
                                <div className="flex gap-4">
                                    {['true', 'false'].map(val => {
                                        const isSelected = String(userAnswer) === val;
                                        const isAnswerCorrect = isSubmitted && String(q.correctAnswer) === val;
                                        const isSelectedWrong = isSubmitted && isSelected && !isCorrect;

                                        let btnClass = "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-lyceum-blue";
                                        if (isSubmitted) {
                                            if (isAnswerCorrect) btnClass = "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20";
                                            else if (isSelectedWrong) btnClass = "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20 opacity-100";
                                            else btnClass = "opacity-30 border-gray-200 dark:border-gray-600 grayscale";
                                        } else if (isSelected) {
                                            btnClass = "bg-lyceum-blue border-lyceum-blue text-white shadow-lg shadow-lyceum-blue/20";
                                        }

                                        return (
                                            <button 
                                                key={val}
                                                onClick={() => handleAnswerChange(q.id, val)}
                                                disabled={isSubmitted}
                                                className={`flex-1 py-4 px-6 rounded-xl border-2 font-black text-lg uppercase tracking-widest transition-all ${btnClass}`}
                                            >
                                                {val === 'true' ? 'True' : 'False'}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <div className="mt-12 sticky bottom-6 z-10">
                {isSubmitted ? (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-4 border-lyceum-blue shadow-[0_20px_50px_rgba(37,99,235,0.2)] flex flex-col items-center">
                        <div className="h-16 w-16 bg-lyceum-blue/10 rounded-full flex items-center justify-center text-lyceum-blue mb-4">
                            <Trophy size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Quiz Completed!</h2>
                        <div className="text-5xl font-black text-lyceum-blue mb-4 leading-none">
                            {score} <span className="text-2xl text-gray-400">/ {questions.length}</span>
                        </div>
                        <div className="w-full max-w-xs bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden mb-6">
                            <div className="bg-lyceum-blue h-full transition-all duration-1000" style={{ width: `${(score / questions.length) * 100}%` }}></div>
                        </div>
                        <button 
                            onClick={() => { setIsSubmitted(false); setSelectedAnswers({}); }} 
                            className="bg-lyceum-blue/10 text-lyceum-blue px-6 py-2 rounded-lg font-bold hover:bg-lyceum-blue/20 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw size={16} /> Retake Quiz
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleSubmit} 
                        disabled={!allQuestionsAnswered} 
                        className="w-full py-5 bg-lyceum-blue text-white rounded-2xl font-black text-xl shadow-[0_15px_30px_rgba(37,99,235,0.3)] hover:bg-lyceum-blue-dark active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:shadow-none"
                    >
                        Submit Your Answers
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
    isLiveMode?: boolean;
    onBack: () => void;
    onMarkComplete: (courseId: string, lessonId: string) => void;
    onSaveNote: (lessonId: string, note: string) => void;
    onSavePost: (courseId: string, threadId: string | 'new', postContent: { title?: string; content: string }) => void;
    onSessionChange?: (courseId: string, isLive: boolean) => void;
}

const LmsPlayerView: React.FC<LmsPlayerViewProps> = (props) => {
    const { course, student, user, users, isLiveMode, onBack, onMarkComplete, onSaveNote, onSavePost, onSessionChange } = props;

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

    // Live Session State
    const [liveSession, setLiveSession] = useState<ClassSession | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [currentPdfPage, setCurrentPdfPage] = useState(1);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [submissions, setSubmissions] = useState<ActivitySubmission[]>([]);
    const [presentationBlobUrl, setPresentationBlobUrl] = useState<string | null>(null);
    const [isLoadingPresentation, setIsLoadingPresentation] = useState(false);
    const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const activeLessonIdRef = useRef<string | null>(activeLesson?.id || null);
    const presentationRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        activeLessonIdRef.current = activeLesson?.id || null;
    }, [activeLesson?.id]);

    useEffect(() => {
        if (activeLesson && debouncedNote !== student?.lmsNotes?.[activeLesson.id]) {
            onSaveNote(activeLesson.id, debouncedNote);
        }
    }, [debouncedNote, activeLesson, onSaveNote, student]);

    useEffect(() => {
        if (liveSession && activeLesson && (user.role === 'Admin' || user.role === 'Staff')) {
            updatePdfPage(liveSession.id, activeLesson.id, currentPdfPage, pdfPageCount || undefined);
            socketRef.current?.emit('update-pdf-page', {
                sessionId: liveSession.id,
                lessonId: activeLesson.id,
                pdfPage: currentPdfPage,
                pdfPageCount: pdfPageCount || undefined
            });
        }
    }, [pdfPageCount]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!presentationRef.current) return;

        if (!document.fullscreenElement) {
            presentationRef.current.requestFullscreen().catch((err: any) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeLesson?.id]);

    useEffect(() => {
        let isMounted = true;
        const fetchPresentation = async () => {
            if (!activeLesson?.presentationUrl) {
                setPresentationBlobUrl(null);
                return;
            }
            
            setIsLoadingPresentation(true);
            try {
                const response = await fetch(`${API_BASE_URL}${activeLesson.presentationUrl}`, {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    }
                });
                
                if (!response.ok) throw new Error('Failed to fetch presentation');
                
                const blob = await response.blob();
                if (isMounted) {
                    if (presentationBlobUrl) URL.revokeObjectURL(presentationBlobUrl);
                    const url = URL.createObjectURL(blob);
                    setPresentationBlobUrl(url);
                }
            } catch (error) {
                console.error('Error fetching presentation:', error);
            } finally {
                if (isMounted) setIsLoadingPresentation(false);
            }
        };

        fetchPresentation();

        return () => {
            isMounted = false;
        };
    }, [activeLesson?.id, activeLesson?.presentationUrl]);

    // Periodic Background Sync (Brute Force)
    useEffect(() => {
        if (!liveSession || user.role !== 'Student') return;

        const syncInterval = setInterval(() => {
            getActiveSession(course.id).then(session => {
                if (session && session.status === 'live') {
                    if (session.current_lesson_id && session.current_lesson_id !== activeLessonIdRef.current) {
                        const newLesson = course.modules.flatMap(m => m.lessons).find(l => l.id === session.current_lesson_id);
                        if (newLesson) {
                            setActiveLesson(newLesson);
                        }
                    }
                    if (session.current_pdf_page && session.current_pdf_page !== currentPdfPage) {
                        setCurrentPdfPage(session.current_pdf_page);
                    }
                    if (session.current_slide_index !== undefined && session.current_slide_index !== currentSlideIndex) {
                        setCurrentSlideIndex(session.current_slide_index);
                    }
                } else {
                    // Session ended or no longer live - clear local state
                    setLiveSession(null);
                    setSubmissions([]);
                    setAttendanceCount(0);
                    if (onSessionChange) onSessionChange(course.id, false);
                }
            }).catch(err => console.error('Background sync failed:', err));
        }, 5000); // Sync every 5 seconds

        return () => clearInterval(syncInterval);
    }, [liveSession?.id, course.id, user.role, currentPdfPage, currentSlideIndex]);

    // Live Session Management
    useEffect(() => {
        getActiveSession(course.id).then(session => {
            if (session) {
                // Join automatically to keep in sync (both students and teachers)
                setLiveSession(session);
                setCurrentSlideIndex(session.current_slide_index || 0);
                setCurrentPdfPage(session.current_pdf_page || 1);
                setPdfPageCount(session.current_pdf_page_count || null);
                joinClassSession(session.id).catch(err => console.error(err));
            }
        });

        // Initialize Socket.IO
        const socketToken = getToken();
        // Ensure we connect to the root server, not the /api endpoint
        const socketBaseUrl = (API_BASE_URL || '').replace('/api', '');
        const socket = io(`${socketBaseUrl}/lms`, {
            auth: { token: socketToken }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to LMS socket');
        });

        socket.on('slide-updated', (data) => {
            console.log('Socket: slide-updated received', data);
            const currentId = activeLessonIdRef.current?.toLowerCase().trim();
            const incomingId = data.lessonId?.toLowerCase().trim();
            if (currentId && incomingId && currentId === incomingId) {
                setCurrentSlideIndex(data.slideIndex);
            }
        });

        socket.on('pdf-page-updated', (data) => {
            console.log('Socket: pdf-page-updated received', data);
            const currentId = activeLessonIdRef.current?.toLowerCase().trim();
            const incomingId = data.lessonId?.toLowerCase().trim();
            if (currentId && incomingId && currentId === incomingId) {
                setCurrentPdfPage(data.pdfPage);
                if (data.pdfPageCount !== undefined) {
                    setPdfPageCount(data.pdfPageCount);
                }
            }
        });

        socket.on('attendance-updated', (data) => {
            setAttendanceCount(data.count);
        });

        socket.on('activity-submitted', (data) => {
            setSubmissions(prev => [...prev, data]);
        });

        socket.on('session-ended', () => {
            setLiveSession(null);
            setSubmissions([]);
            setAttendanceCount(0);
            if (onSessionChange) onSessionChange(course.id, false);
        });

        socket.on('lesson-switched', (data) => {
            if (user.role === 'Student') {
                const newLesson = course.modules.flatMap(m => m.lessons).find(l => l.id === data.lessonId);
                if (newLesson) {
                    setActiveLesson(newLesson);
                }
            }
        });

        socket.on('global-session-ended', (data) => {
            if (String(data.courseId) === String(course.id)) {
                setLiveSession(null);
                setSubmissions([]);
                setAttendanceCount(0);
                if (onSessionChange) onSessionChange(course.id, false);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [course.id]); // Stable connection for the course

    // Sync local live state with parent prop (e.g. from polling or global socket in App.tsx)
    useEffect(() => {
        if (liveSession && !course.isLive) {
            setLiveSession(null);
            setSubmissions([]);
            setAttendanceCount(0);
        }
    }, [course.isLive, liveSession?.id]);

    useEffect(() => {
        if (liveSession && socketRef.current) {
            socketRef.current.emit('join-session', liveSession.id);
        }
    }, [liveSession?.id]);


    const handleStartLive = async () => {
        if (!activeLesson) return;
        try {
            const session = await startClassSession(course.id, activeLesson.id);
            setLiveSession(session);
            setCurrentSlideIndex(0);
            setSubmissions([]);
            setAttendanceCount(1); // Teacher is the first one
            if (onSessionChange) onSessionChange(course.id, true);
        } catch (error) {
            console.error('Failed to start session:', error);
        }
    };

    const handleEndLive = async () => {
        if (!liveSession) return;
        const sessionId = liveSession.id;
        
        // Immediate local state reset & socket notification for responsiveness
        socketRef.current?.emit('end-session', { sessionId, courseId: course.id });
        setAttendanceCount(0);
        setLiveSession(null);
        setSubmissions([]);
        if (onSessionChange) onSessionChange(course.id, false);

        try {
            await endClassSession(sessionId, course.id);
        } catch (error) {
            console.error('Failed to end session on server:', error);
            // Even if API fails, the socket was emitted and DB will reflect 'ended' eventually (or on next start)
        }
    };

    const handleNavigateSlide = (index: number) => {
        if (!activeLesson) return;
        const maxSlides = activeLesson.slides?.length || Math.ceil(activeLesson.content.split('\n').length / 3);
        if (index < 0 || index >= maxSlides) return;
        
        setCurrentSlideIndex(index);
        if (liveSession && (user.role === 'Admin' || user.role === 'Staff')) {
            updateSlideIndex(liveSession.id, activeLesson.id, index);
            socketRef.current?.emit('update-slide', {
                sessionId: liveSession.id,
                lessonId: activeLesson.id,
                slideIndex: index
            });
        }
    };

    const handleNavigatePdf = (page: number) => {
        if (!activeLesson || page < 1) return;
        
        setCurrentPdfPage(page);
        if (liveSession && (user.role === 'Admin' || user.role === 'Staff')) {
            updatePdfPage(liveSession.id, activeLesson.id, page, pdfPageCount || undefined);
            socketRef.current?.emit('update-pdf-page', {
                sessionId: liveSession.id,
                lessonId: activeLesson.id,
                pdfPage: page,
                pdfPageCount: pdfPageCount || undefined
            });
        }
    };

    const handleActivitySubmit = async (answer: any) => {
        if (!liveSession || !activeLesson) return;
        try {
            const submission = await submitActivityAnswer(liveSession.id, activeLesson.id, 'quiz', answer);
            socketRef.current?.emit('submit-activity', {
                sessionId: liveSession.id,
                submission
            });
        } catch (error) {
            console.error('Failed to submit activity:', error);
        }
    };

    const handleSwitchLesson = (lesson: LmsLesson) => {
        setActiveLesson(lesson);
        if (liveSession && (user.role === 'Admin' || user.role === 'Staff')) {
            socketRef.current?.emit('switch-lesson', {
                sessionId: liveSession.id,
                lessonId: lesson.id
            });
        }
    };

    const isCompleted = student?.lmsProgress?.[course.id]?.completedLessons.includes(activeLesson?.id || '') || false;

    const allLessons = course.modules.flatMap(m => m.lessons);
    const currentIndex = activeLesson ? allLessons.findIndex(l => l.id === activeLesson.id) : -1;
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    const completedLessons = student?.lmsProgress?.[course.id]?.completedLessons || [];
    const totalLessons = allLessons.length;
    const progress = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0;

    return (
        <div className="animate-fade-in flex flex-col lg:flex-row h-full lg:gap-6 overflow-hidden relative">
            {/* Mobile Sidebar Toggle Button */}
            {!isFullscreen && (
                <button 
                    onClick={() => setShowSidebar(true)}
                    className="lg:hidden fixed bottom-20 right-6 z-[60] flex items-center gap-2 px-4 py-2.5 bg-lyceum-blue text-white rounded-full shadow-xl hover:bg-lyceum-blue-dark transition-all scale-90 sm:scale-100 active:scale-95"
                >
                    <BookOpen size={18} />
                    <span className="text-sm font-bold">Curriculum</span>
                </button>
            )}

            {/* sidebar - Mobile Drawer & Desktop Sidebar */}
            <div 
                className={`fixed inset-0 z-[70] lg:relative lg:z-0 lg:flex transition-opacity duration-300 ${showSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'}`}
            >
                {/* Mobile Overlay */}
                <div 
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setShowSidebar(false)}
                ></div>

                <aside 
                    className={`w-[280px] sm:w-[320px] lg:w-80 flex-shrink-0 bg-white dark:bg-gray-800 rounded-none lg:rounded-lg shadow-2xl lg:shadow-sm border-r lg:border border-gray-200 dark:border-gray-700 h-full flex flex-col transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                        <button onClick={onBack} className="flex items-center text-xs font-bold text-lyceum-blue hover:text-lyceum-blue-dark bg-lyceum-blue/5 px-2 py-1 rounded transition-colors group">
                            <ArrowLeft size={14} className="mr-1.5 group-hover:-translate-x-0.5 transition-transform" /> 
                            {isLiveMode ? 'Exit Teaching Mode' : 'Back to Curriculum'}
                        </button>
                            <button onClick={() => setShowSidebar(false)} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <h2 className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate mb-2">{course.title}</h2>
                        {liveSession && (
                            <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 px-2 py-1.5 rounded-md border border-red-100 dark:border-red-900/30">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-wider">
                                    <span className="flex h-1.5 w-1.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                    </span>
                                    Live
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-bold text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded shadow-sm border border-red-50 dark:border-red-900/20">
                                    <UsersIcon size={8} /> {attendanceCount} Students
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progress</span>
                            <span className="text-xs font-semibold text-lyceum-blue">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                            <div className="bg-lyceum-blue h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                    {course.modules.map((module, index) => (
                        <div key={module.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            <button onClick={() => setOpenModuleIds(p => { const n = new Set(p); n.has(module.id) ? n.delete(module.id) : n.add(module.id); return n; })} className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Module {index + 1}: {module.title}</span>
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
                {(user.role === 'Admin' || user.role === 'Staff') && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        {liveSession ? (
                            <button onClick={handleEndLive} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 shadow-sm transition-colors">
                                <StopCircle size={16} /> End Live Class
                            </button>
                        ) : (
                            <button onClick={handleStartLive} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-lyceum-blue text-white rounded-md text-sm font-semibold hover:bg-lyceum-blue-dark shadow-sm transition-colors">
                                <Video size={16} /> Go Live Now
                            </button>
                        )}
                    </div>
                )}
                </aside>
            </div>

            {/* main area */}
            <main className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden">
                {activeLesson ? (
                    <>
                        <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                {isLiveMode && (user.role === 'Admin' || user.role === 'Staff') ? (
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Lesson</label>
                                        <select 
                                            value={activeLesson.id}
                                            onChange={(e) => {
                                                const lesson = allLessons.find(l => l.id === e.target.value);
                                                if (lesson) handleSwitchLesson(lesson);
                                            }}
                                            className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-bold text-gray-800 dark:text-white rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-lyceum-blue outline-none transition-all shadow-sm pr-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fxml%3E')] bg-[length:24px_24px] bg-[right_4px_center] bg-no-repeat"
                                        >
                                            {allLessons.map(l => (
                                                <option key={l.id} value={l.id}>{l.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="min-w-0 flex-grow">
                                        <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 m-0 leading-tight truncate">{activeLesson.title}</h1>
                                        {liveSession ? (
                                            <div className="flex items-center gap-1.5 mt-0.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span><p className="text-[9px] sm:text-[10px] font-bold text-red-500 uppercase m-0 tracking-wider">Live Now</p></div>
                                        ) : isLiveMode && (user.role === 'Admin' || user.role === 'Staff') && (
                                            <div className="flex items-center gap-3 mt-1">
                                                <button 
                                                    onClick={handleStartLive}
                                                    className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse transition-all shadow-[0_0_10px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95"
                                                >
                                                    <Video size={12} /> Start Live Session
                                                </button>
                                                <p className="text-[10px] text-gray-400 italic">Manual start required</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {liveSession && (
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="flex items-center gap-1.5 sm:gap-2 bg-lyceum-blue/5 dark:bg-lyceum-blue/10 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-lyceum-blue/10">
                                        <Monitor size={14} className="text-lyceum-blue sm:w-4 sm:h-4" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] sm:text-[9px] font-bold text-lyceum-blue uppercase leading-none mb-0.5 tracking-tighter">Live</span>
                                            <span className="text-xs font-black text-gray-700 dark:text-gray-200 leading-none">
                                                {activeLesson.presentationUrl ? (
                                                    activeLesson.presentationType === 'pdf' ? (
                                                        <div className="flex items-center gap-1">
                                                            <span>Page {currentPdfPage}</span>
                                                            <span className="text-gray-400">/</span>
                                                            {(user.role === 'Admin' || user.role === 'Staff') ? (
                                                                <input 
                                                                    type="number" 
                                                                    min="1"
                                                                    className="w-10 bg-transparent border-none p-0 text-xs font-black text-lyceum-blue focus:ring-0 appearance-none"
                                                                    value={pdfPageCount || ''} 
                                                                    onChange={(e) => setPdfPageCount(parseInt(e.target.value) || null)}
                                                                    placeholder="Total"
                                                                />
                                                            ) : (
                                                                <span>{pdfPageCount || '?'}</span>
                                                            )}
                                                        </div>
                                                    ) : `Media: ${activeLesson.presentationType}`
                                                ) : `Slide ${currentSlideIndex + 1}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {activeLesson.type === 'quiz' ? (
                                <div className="p-4 sm:p-8 max-w-4xl mx-auto">
                                    <div className="mb-10 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-lyceum-blue/10 text-lyceum-blue rounded-full text-xs font-black uppercase tracking-widest mb-4">
                                            <FileQuestion size={12} /> Knowledge Check
                                        </div>
                                        <h2 className="text-2xl sm:text-4xl font-black text-gray-800 dark:text-white mb-3 flex items-center justify-center gap-3">
                                            {activeLesson.title}
                                        </h2>
                                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">This assessment is designed to verify your understanding of the current module. Please answer all questions carefully.</p>
                                    </div>
                                    <Quiz 
                                        questions={activeLesson.quiz || []} 
                                        onQuizAttempted={() => {}} 
                                        isLive={!!liveSession} 
                                        onAnswerSubmit={handleActivitySubmit} 
                                    />
                                </div>
                            ) : (
                                <>
                                    {/* video */}
                                    {activeLesson.videoUrl && !liveSession && (
                                        <div className="aspect-video bg-black shadow-lg">
                                            <video key={activeLesson.videoUrl} className="w-full h-full" controls src={activeLesson.videoUrl} />
                                        </div>
                                    )}

                                    {/* content */}
                                    <div className="p-6 prose dark:prose-invert max-w-none">
                                        {liveSession ? (
                                            <div className="space-y-4 h-full">
                                                <div 
                                                    ref={presentationRef}
                                                    className={`bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700 overflow-hidden relative group ${isFullscreen ? 'fixed inset-0 z-[9999] bg-black border-none rounded-none w-screen h-screen' : 'aspect-[16/9] h-full shadow-inner'}`}
                                                >
                                                    {/* Fullscreen Button */}
                                                    <button 
                                                        onClick={toggleFullscreen}
                                                        className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                                    >
                                                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                                                    </button>

                                                    {activeLesson.presentationUrl ? (
                                                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                                                            {isLoadingPresentation ? (
                                                                <div className="flex flex-col items-center gap-3">
                                                                    <div className="h-8 w-8 border-4 border-lyceum-blue border-t-transparent rounded-full animate-spin"></div>
                                                                    <p className="text-xs font-bold text-gray-400 animate-pulse uppercase tracking-widest">Loading Presentation...</p>
                                                                </div>
                                                            ) : presentationBlobUrl ? (
                                                                <>
                                                                    {activeLesson.presentationType === 'pdf' ? (
                                                                        <iframe 
                                                                            key={`${presentationBlobUrl}-${currentPdfPage}`}
                                                                            src={`${presentationBlobUrl}#page=${currentPdfPage}${user.role === 'Student' ? '&toolbar=0&navpanes=0&scrollbar=0' : ''}${user.role === 'Student' ? '&view=Fit' : '&view=FitH'}`} 
                                                                            className={`w-full h-full border-none ${user.role === 'Student' ? 'pointer-events-none' : ''}`}
                                                                            title="PDF Presentation"
                                                                        />
                                                                    ) : activeLesson.presentationType === 'video' ? (
                                                                        <video 
                                                                            src={presentationBlobUrl} 
                                                                            className="w-full h-full object-contain" 
                                                                            controls={user.role !== 'Student'} 
                                                                            autoPlay 
                                                                        />
                                                                    ) : (
                                                                        <img 
                                                                            src={presentationBlobUrl} 
                                                                            alt="Presentation" 
                                                                            className="max-h-full object-contain" 
                                                                        />
                                                                    )}

                                                                    {/* PDF Navigation Overlay for Teacher */}
                                                                    {(user.role === 'Admin' || user.role === 'Staff') && activeLesson.presentationType === 'pdf' && (
                                                                        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                            <button 
                                                                                onClick={() => handleNavigatePdf(currentPdfPage - 1)} 
                                                                                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
                                                                            >
                                                                                <ChevronLeft size={16} />
                                                                            </button>
                                                                            <div className="bg-black/50 px-3 py-1 rounded-full text-white text-xs flex items-center backdrop-blur-sm">
                                                                                Page {currentPdfPage}
                                                                            </div>
                                                                            <button 
                                                                                onClick={() => handleNavigatePdf(currentPdfPage + 1)} 
                                                                                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
                                                                            >
                                                                                <ChevronRight size={16} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
                                                                    <Monitor size={32} className="mx-auto text-gray-300 mb-2" />
                                                                    <p className="text-xs font-medium text-gray-500 mb-3">Presentation Stream Interrupted</p>
                                                                    <button 
                                                                        onClick={() => window.location.reload()}
                                                                        className="text-[10px] font-bold text-lyceum-blue hover:text-lyceum-blue-dark uppercase tracking-widest bg-lyceum-blue/5 px-3 py-1 rounded"
                                                                    >
                                                                        Restore Presentation
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Slides contents */}
                                                            <div className="text-center p-8 w-full h-full flex flex-col justify-center">
                                                                {activeLesson.slides && activeLesson.slides.length > currentSlideIndex ? (
                                                                    <div className="animate-fade-in">
                                                                        <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed text-center">
                                                                            {activeLesson.slides[currentSlideIndex]}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center p-8">
                                                                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Slide Content Area</h3>
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Displaying section: {currentSlideIndex + 1}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* navigation overlay for teacher */}
                                                            {(user.role === 'Admin' || user.role === 'Staff') && (
                                                                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => handleNavigateSlide(currentSlideIndex - 1)} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-all hover:scale-110 active:scale-95"><ChevronLeft size={16} /></button>
                                                                    <button onClick={() => handleNavigateSlide(currentSlideIndex + 1)} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm transition-all hover:scale-110 active:scale-95"><ChevronRight size={16} /></button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <p>{activeLesson.content.replace(/###\s/g, '').replace(/```python\n/g, '').replace(/```/g, '')}</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                            {/* tabs */}
                            <div className="px-6">
                                <div className="border-b border-gray-200 dark:border-gray-700">
                                    <nav className="-mb-px flex space-x-4">
                                        {(activeLesson.type !== 'quiz' && activeLesson.attachments && activeLesson.attachments.length > 0) && <button onClick={() => setActiveTab('resources')} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'resources' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Paperclip size={14} />Resources</button>}
                                        {(activeLesson.type !== 'quiz' && activeLesson.quiz && activeLesson.quiz.length > 0) && <button onClick={() => setActiveTab('quiz')} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'quiz' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FileQuestion size={14} />Course Quiz</button>}
                                        <button onClick={() => setActiveTab('discussions')} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'discussions' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><MessageCircle size={14} />Discussions</button>
                                        {user.role === 'Student' && <button onClick={() => setActiveTab('notes')} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'notes' ? 'border-lyceum-blue text-lyceum-blue' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FileText size={14} />My Notes</button>}
                                        {(user.role === 'Admin' || user.role === 'Staff') && liveSession && <button onClick={() => setActiveTab('live-results' as any)} className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 ${activeTab === ('live-results' as any) ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Monitor size={14} />Live Results</button>}
                                    </nav>
                                </div>
                                <div className="py-6">
                                    {activeTab === 'resources' && activeLesson.attachments && <ul className="space-y-2">
                                        {activeLesson.attachments.map(att => (<li key={att.id}><a href={att.url} download={att.name} className="flex items-center p-3 rounded-md bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-lyceum-blue"><Paperclip size={16} className="mr-3 text-gray-400" />{att.name}</a></li>))}
                                    </ul>}
                                    {activeTab === 'quiz' && activeLesson.quiz && <Quiz questions={activeLesson.quiz} onQuizAttempted={() => { }} isLive={!!liveSession} onAnswerSubmit={handleActivitySubmit} />}
                                    {activeTab === 'discussions' && <CourseDiscussionsView course={course} user={user} users={users} onSavePost={onSavePost} />}
                                    {activeTab === 'notes' && user.role === 'Student' && (
                                        <div>
                                            <label htmlFor="lesson-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Use this space for your personal notes.</label>
                                            <textarea id="lesson-notes" value={note} onChange={e => setNote(e.target.value)} rows={8} className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" placeholder="Type your notes here... they will be saved automatically." />
                                        </div>
                                    )}
                                    {activeTab === ('live-results' as any) && (user.role === 'Admin' || user.role === 'Staff') && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="p-4 bg-lyceum-blue/5 rounded-lg border border-lyceum-blue/20">
                                                    <span className="block text-xs font-bold text-lyceum-blue uppercase">Total Students</span>
                                                    <span className="text-3xl font-black text-gray-800 dark:text-white">{attendanceCount}</span>
                                                </div>
                                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                                    <span className="block text-xs font-bold text-green-600 uppercase">Submissions</span>
                                                    <span className="text-3xl font-black text-gray-800 dark:text-white">{submissions.length}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Recent Activity</h4>
                                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                                    {submissions.length === 0 ? (
                                                        <p className="text-xs text-gray-500 text-center py-4 italic">No submissions yet...</p>
                                                    ) : (
                                                        [...submissions].reverse().map((sub, i) => (
                                                            <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700/50 rounded border border-gray-100 dark:border-gray-600 shadow-xs animate-slide-in-right">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-lyceum-blue/10 flex items-center justify-center text-lyceum-blue font-bold text-xs">
                                                                        S
                                                                    </div>
                                                                    <div>
                                                                        <span className="block text-xs font-bold text-gray-800 dark:text-white">Student Submission</span>
                                                                        <span className="text-[10px] text-gray-500">Submitted at {new Date(sub.submittedAt).toLocaleTimeString()}</span>
                                                                    </div>
                                                                </div>
                                                                <button className="px-2 py-1 text-[10px] font-bold text-lyceum-blue hover:bg-lyceum-blue/10 rounded">View Details</button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0 backdrop-blur-sm">
                            {/* navigation buttons */}
                            <div className="flex items-center gap-3">
                                {liveSession && (user.role === 'Admin' || user.role === 'Staff') ? (
                                    <div className="flex items-center gap-2 bg-white dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                                        <button 
                                            onClick={() => activeLesson.presentationUrl ? handleNavigatePdf(currentPdfPage - 1) : handleNavigateSlide(currentSlideIndex - 1)} 
                                            className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
                                            title="Previous Page/Slide"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div className="px-4 py-1 flex flex-col items-center">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Navigation</span>
                                            <span className="text-sm font-black text-lyceum-blue leading-none">
                                                {activeLesson.presentationUrl ? currentPdfPage : currentSlideIndex + 1}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => activeLesson.presentationUrl ? handleNavigatePdf(currentPdfPage + 1) : handleNavigateSlide(currentSlideIndex + 1)} 
                                            className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
                                            title="Next Page/Slide"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => prevLesson && setActiveLesson(prevLesson)} disabled={!prevLesson || !!liveSession} className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-30 transition-shadow hover:shadow-sm"><ChevronLeft size={16} className="mr-1.5" />Previous</button>
                                        <button onClick={() => nextLesson && setActiveLesson(nextLesson)} disabled={!nextLesson || !!liveSession} className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-30 transition-shadow hover:shadow-sm">Next<ChevronRight size={16} className="ml-1.5" /></button>
                                    </div>
                                )}
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
