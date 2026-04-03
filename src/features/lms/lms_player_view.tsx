import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { LmsCourse, LmsLesson, LmsModule, Contact, User, QuizQuestion, ClassSession, ActivitySubmission } from '@/types';
import { ArrowLeft, BookOpen, ChevronDown, CheckCircle2, Circle, Video, Plus, Edit, Trash2, X, Paperclip, FileQuestion, FileText, ChevronLeft, ChevronRight, MessageCircle, Monitor, StopCircle, Maximize, Minimize, Users as UsersIcon, Trophy, RefreshCw } from '@/components/common/icons';
import CourseDiscussionsView from './course_discussions_view';
import { io, Socket } from 'socket.io-client';
import { getActiveSession, startClassSession, joinClassSession, updateSlideIndex, updatePdfPage, updateSessionLesson, endClassSession, submitActivityAnswer, API_BASE_URL, getToken } from '@/utils/api';

const Quiz: React.FC<{ questions: QuizQuestion[]; onQuizAttempted: () => void; isLive?: boolean, onAnswerSubmit?: (answer: any) => void }> = ({ questions, onQuizAttempted, isLive, onAnswerSubmit }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: any }>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCelebration, setIsCelebration] = useState(false);
    const [score, setScore] = useState(0);

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + (isSubmitted ? 1 : 0)) / questions.length) * 100;

    const handleAnswerChange = (questionId: string, answer: any) => {
        if (isSubmitted) return;
        setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
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
        
        const finalScore = correctAnswers;
        setScore(finalScore);
        setIsSubmitted(true);
        
        if (finalScore === questions.length) {
            setIsCelebration(true);
        }

        if (isLive && onAnswerSubmit) {
            onAnswerSubmit(selectedAnswers);
        }
        onQuizAttempted();
    };

    const isQuestionAnswered = selectedAnswers[currentQuestion?.id] !== undefined;

    if (isSubmitted && isCelebration) {
        return (
            <div className="flex flex-col items-center justify-center p-4 sm:p-12 text-center animate-in fade-in zoom-in duration-500">
                <div className="relative mb-6 sm:mb-8">
                    <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse"></div>
                    <Trophy size={80} className="sm:w-[120px] sm:h-[120px] text-yellow-500 relative z-10 animate-bounce" />
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3 sm:mb-4 italic">PERFECT SCORE!</h2>
                <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md leading-relaxed">
                    You've mastered this knowledge check! You answered all {questions.length} questions correctly.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                    <button 
                        onClick={() => setIsCelebration(false)}
                        className="w-full sm:w-auto px-8 py-3 sm:py-4 bg-lyceum-blue text-white rounded-2xl font-black shadow-lg shadow-lyceum-blue/30 hover:scale-105 transition-transform"
                    >
                        Review Answers
                    </button>
                    <button 
                        onClick={() => {
                            setIsSubmitted(false);
                            setIsCelebration(false);
                            setSelectedAnswers({});
                            setCurrentQuestionIndex(0);
                        }}
                        className="w-full sm:w-auto px-8 py-3 sm:py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black hover:bg-gray-200 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Progress Bar */}
            <div className="relative h-3 sm:h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-lyceum-blue to-blue-400 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4 sm:mb-8 px-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                {isSubmitted && (
                    <span className="text-xs sm:text-sm font-black text-lyceum-blue">
                        Score: {score}/{questions.length}
                    </span>
                )}
            </div>

            {/* Question Card */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-lyceum-blue/20 to-blue-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-4 sm:p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl transition-all animate-in slide-in-from-bottom-4 duration-500">
                    
                    <div className="mb-4 sm:mb-8">
                        <h3 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                            {currentQuestion.question}
                        </h3>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        {currentQuestion.type === 'mcq' && currentQuestion.options?.map((option, idx) => {
                            const isSelected = selectedAnswers[currentQuestion.id] === idx;
                            const isCorrect = isSubmitted && idx === currentQuestion.correctAnswerIndex;
                            const isWrong = isSubmitted && isSelected && idx !== currentQuestion.correctAnswerIndex;

                            let cardClass = "border-gray-200 dark:border-gray-700 hover:border-lyceum-blue/50 hover:bg-lyceum-blue/5";
                            if (isSelected) cardClass = "border-lyceum-blue bg-lyceum-blue/10 ring-2 ring-lyceum-blue/20";
                            if (isSubmitted) {
                                if (isCorrect) cardClass = "border-green-500 bg-green-500/10 ring-2 ring-green-500/20";
                                else if (isWrong) cardClass = "border-red-500 bg-red-500/10 ring-2 ring-red-500/20";
                                else cardClass = "opacity-50 border-gray-100 dark:border-gray-800 pointer-events-none";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswerChange(currentQuestion.id, idx)}
                                    disabled={isSubmitted}
                                    className={`w-full flex items-center p-3 sm:p-5 rounded-2xl border-2 text-left transition-all group/opt ${cardClass}`}
                                >
                                    <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 flex items-center justify-center mr-3 sm:mr-4 transition-colors ${isSelected ? 'bg-lyceum-blue border-lyceum-blue text-white shadow-lg' : 'border-gray-300 dark:border-gray-600'}`}>
                                        <span className="text-[10px] sm:text-sm font-black italic">{String.fromCharCode(65 + idx)}</span>
                                    </div>
                                    <span className={`text-base sm:text-lg font-bold flex-grow ${isSelected ? 'text-lyceum-blue' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {option}
                                    </span>
                                    {isSubmitted && isCorrect && <CheckCircle2 size={24} className="text-green-500 animate-in zoom-in" />}
                                    {isSubmitted && isWrong && <X size={24} className="text-red-500 animate-in zoom-in" />}
                                </button>
                            );
                        })}

                        {currentQuestion.type === 'true-false' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {['true', 'false'].map(val => {
                                    const isSelected = String(selectedAnswers[currentQuestion.id]) === val;
                                    const isCorrect = isSubmitted && String(currentQuestion.correctAnswer) === val;
                                    const isWrong = isSubmitted && isSelected && String(currentQuestion.correctAnswer) !== val;

                                    let cardClass = "border-gray-200 dark:border-gray-700 hover:border-lyceum-blue/50 bg-gray-50/50 dark:bg-gray-800/50";
                                    if (isSelected) cardClass = "border-lyceum-blue bg-lyceum-blue/10 ring-4 ring-lyceum-blue/10";
                                    if (isSubmitted) {
                                        if (isCorrect) cardClass = "border-green-500 bg-green-500/10 text-green-600";
                                        else if (isWrong) cardClass = "border-red-500 bg-red-500/10 text-red-600";
                                        else cardClass = "opacity-40 grayscale pointer-events-none";
                                    }

                                    return (
                                        <button
                                            key={val}
                                            onClick={() => handleAnswerChange(currentQuestion.id, val)}
                                            disabled={isSubmitted}
                                            className={`py-4 sm:py-8 rounded-2xl sm:rounded-3xl border-2 sm:border-3 flex flex-col items-center gap-2 sm:gap-4 transition-all ${cardClass}`}
                                        >
                                            <div className={`h-10 w-10 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-lyceum-blue text-white rotate-12 scale-110 shadow-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 grayscale'}`}>
                                                {val === 'true' ? <CheckCircle2 size={24} className="sm:hidden" /> : <X size={24} className="sm:hidden" />}
                                                {val === 'true' ? <CheckCircle2 size={32} className="hidden sm:block" /> : <X size={32} className="hidden sm:block" />}
                                            </div>
                                            <span className="text-lg sm:text-2xl font-black uppercase tracking-tighter italic">
                                                {val === 'true' ? 'True' : 'False'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {currentQuestion.type === 'fill-in-blanks' && (
                            <div className="space-y-4">
                                <input 
                                    type="text" 
                                    value={selectedAnswers[currentQuestion.id] || ''} 
                                    onChange={e => handleAnswerChange(currentQuestion.id, e.target.value)} 
                                    disabled={isSubmitted} 
                                    placeholder="TYPE YOUR ANSWER..."
                                    className={`w-full px-4 sm:px-8 py-4 sm:py-6 text-lg sm:text-2xl font-black italic rounded-2xl sm:rounded-3xl border-2 sm:border-4 focus:outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700 ${isSubmitted ? (selectedAnswers[currentQuestion.id]?.toLowerCase() === currentQuestion.correctAnswer?.toLowerCase() ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700') : 'border-gray-100 dark:bg-gray-800 focus:border-lyceum-blue shadow-inner'}`}
                                />
                                {isSubmitted && selectedAnswers[currentQuestion.id]?.toLowerCase() !== currentQuestion.correctAnswer?.toLowerCase() && (
                                    <div className="p-4 sm:p-6 bg-green-50 dark:bg-green-900/10 border-2 border-green-500 rounded-2xl animate-in fade-in duration-700">
                                        <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] mb-1 sm:mb-2">CORRECT ANSWER</p>
                                        <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white italic">{currentQuestion.correctAnswer}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
                <button 
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                    className="w-full sm:w-auto px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 flex items-center justify-center disabled:opacity-20 transition-all"
                >
                    <ChevronLeft size={20} className="mr-2" />
                    Back
                </button>
                <button 
                    onClick={handleNext}
                    disabled={!isQuestionAnswered && !isSubmitted}
                    className={`w-full sm:flex-grow py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg transition-all flex items-center justify-center gap-2 shadow-xl ${isSubmitted ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 pointer-events-none' : 'bg-lyceum-blue text-white shadow-lyceum-blue/20 hover:scale-[1.02] active:scale-95'}`}
                >
                    {isSubmitted ? 'SUBMITTED' : (currentQuestionIndex === questions.length - 1 ? 'FINISH QUIZ' : 'CONTINUE')}
                    {!isSubmitted && <ChevronRight size={24} className="animate-pulse" />}
                </button>
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

    const [localActiveLesson, setLocalActiveLesson] = useState<LmsLesson | null>(findInitialLesson());
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
    const activeLessonIdRef = useRef<string | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const presentationRef = useRef<HTMLDivElement>(null);
    const presentationBlobUrlRef = useRef<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<ActivitySubmission | null>(null);

    // Reactive Derivation: activeLesson always follows the live session for students
    const activeLesson = useMemo(() => {
        const isStaff = user.role === 'Admin' || user.role === 'Staff';
        // Teachers/Staff specify the lesson locally and push to the session.
        // Students follow the session authoritative ID.
        if (liveSession && liveSession.current_lesson_id && !isStaff) {
            const incomingId = String(liveSession.current_lesson_id).toLowerCase().trim();
            const found = course.modules.flatMap(m => m.lessons).find(l => String(l.id).toLowerCase().trim() === incomingId);
            if (found) return found;
        }
        return localActiveLesson;
    }, [liveSession?.current_lesson_id, localActiveLesson?.id, course.id, user.role]);

    useEffect(() => {
        if (activeLesson?.id && activeLesson.id !== activeLessonIdRef.current) {
            console.log(`🔄 [LMS Reactive] Lesson changed to ${activeLesson.id}, resetting viewer indices...`);
            setPdfPageCount(null);
            
            // ALWAYS reset navigation indices on lesson switch
            setCurrentSlideIndex(0);
            setCurrentPdfPage(1);
            
            activeLessonIdRef.current = activeLesson.id;
        }
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
            const hasPresentation = !!activeLesson.presentationUrl;

            // Auto-exit fullscreen if we switch to a quiz lesson with no presentation
            if (isFullscreen && hasQuiz && !hasPresentation) {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            }

            // Priority for Staff/Admin: Live Results (only for quizzes) > Resources/Quiz > Notes
            const isTeacher = user.role === 'Admin' || user.role === 'Staff';
            if (isTeacher && liveSession && activeLesson.type === 'quiz') setActiveTab('live-results' as any);
            else if (hasPresentation || hasAttachments) setActiveTab('resources');
            else if (hasQuiz) setActiveTab('quiz');
            else if (isTeacher && liveSession) setActiveTab('discussions'); // Default for live non-quiz
            else setActiveTab('notes');

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
                    if (presentationBlobUrlRef.current) URL.revokeObjectURL(presentationBlobUrlRef.current);
                    const url = URL.createObjectURL(blob);
                    presentationBlobUrlRef.current = url;
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
                        setLiveSession(session);
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
            if (user.role === 'Student' && String(data.courseId) === String(course.id)) {
                console.log(`🚀 [LMS Socket] Global Lesson Switch to ${data.lessonId}`);
                setLiveSession(prev => prev ? { ...prev, current_lesson_id: data.lessonId } : null);
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
            
            // Calculate score for instant teacher feedback
            let correctCount = 0;
            const quizQuestions = activeLesson.quiz || [];
            quizQuestions.forEach(q => {
                const ua = answer[q.id];
                if (q.type === 'mcq' && ua === q.correctAnswerIndex) correctCount++;
                else if (q.type === 'true-false' && String(ua) === String(q.correctAnswer)) correctCount++;
                else if (q.type === 'fill-in-blanks' && String(ua || '').trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase()) correctCount++;
            });

            socketRef.current?.emit('submit-activity', {
                sessionId: liveSession.id,
                submission: {
                    ...submission,
                    studentName: user.name,
                    score: `${correctCount}/${quizQuestions.length}`,
                    accuracy: Math.round((correctCount / (quizQuestions.length || 1)) * 100)
                }
            });
        } catch (error) {
            console.error('Failed to submit activity:', error);
        }
    };

    const handleSwitchLesson = (lesson: LmsLesson) => {
        setLocalActiveLesson(lesson);
        if (liveSession && (user.role === 'Admin' || user.role === 'Staff')) {
            updateSessionLesson(liveSession.id, lesson.id).catch(err => console.error(err));
            socketRef.current?.emit('switch-lesson', {
                sessionId: liveSession.id,
                courseId: course.id,
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
                                                <button onClick={() => setLocalActiveLesson(lesson)} className={`w-full flex items-center p-3 text-left text-sm ${isLessonActive ? 'bg-lyceum-blue/10 text-lyceum-blue font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
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
                        <div className="px-3 sm:px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <button 
                                    onClick={() => setShowSidebar(true)}
                                    className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <UsersIcon size={20} />
                                </button>
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
                                        {(user.role === 'Admin' || user.role === 'Staff') && liveSession && (
                                            <button 
                                                onClick={() => setActiveTab('live-results' as any)} 
                                                className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-all ${activeTab === ('live-results' as any) ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                            >
                                                <div className="relative">
                                                    <Monitor size={14} />
                                                    {submissions.length > 0 && (
                                                        <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-bounce shadow-sm">
                                                            {submissions.length}
                                                        </span>
                                                    )}
                                                </div>
                                                Live Results
                                            </button>
                                        )}
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
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="p-4 bg-lyceum-blue/5 rounded-lg border border-lyceum-blue/20">
                                                    <span className="block text-[10px] font-bold text-lyceum-blue uppercase tracking-widest mb-1">Total Students</span>
                                                    <span className="text-3xl font-black text-gray-800 dark:text-white">{attendanceCount}</span>
                                                </div>
                                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                                    <span className="block text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Submissions</span>
                                                    <span className="text-3xl font-black text-gray-800 dark:text-white">{submissions.length}</span>
                                                </div>
                                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                                    <span className="block text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1">Avg. Accuracy</span>
                                                    <span className="text-3xl font-black text-gray-800 dark:text-white">
                                                        {submissions.length > 0 ? Math.round(submissions.reduce((acc, s: any) => acc + (s.accuracy || 0), 0) / submissions.length) : 0}%
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Live Feed</h4>
                                                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                                                    {submissions.length === 0 ? (
                                                        <p className="text-xs text-gray-500 text-center py-12 italic border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">Waiting for student submissions...</p>
                                                    ) : (
                                                        [...submissions].reverse().map((sub, i) => {
                                                            const accuracy = (sub as any).accuracy || 0;
                                                            const score = (sub as any).score || '0/0';
                                                            const studentName = (sub as any).studentName || 'Student';
                                                            const submittedAt = (sub as any).submittedAt || (sub as any).created_at;
                                                            
                                                            return (
                                                                <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in slide-in-from-right duration-300">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-white ${accuracy >= 80 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : accuracy >= 50 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`}>
                                                                            {studentName.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <span className="block text-sm font-black text-gray-900 dark:text-white">{studentName}</span>
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                                                {submittedAt ? `At ${new Date(submittedAt).toLocaleTimeString()}` : 'Just Now'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="text-right">
                                                                            <span className={`block text-lg font-black leading-none ${accuracy >= 80 ? 'text-green-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{score}</span>
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Accuracy: {accuracy}%</span>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => setSelectedSubmission(sub)}
                                                                            className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-lyceum-blue hover:text-white flex items-center justify-center transition-all"
                                                                        >
                                                                            <Maximize size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                            {/* Submission Detail Modal */}
                                            {selectedSubmission && (
                                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95 duration-200">
                                                        <div className="p-6 bg-lyceum-blue text-white flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black">
                                                                    {(selectedSubmission as any).studentName?.charAt(0).toUpperCase() || 'S'}
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-xl font-black italic">{(selectedSubmission as any).studentName || 'Student Submission'}</h3>
                                                                    <p className="text-xs font-bold opacity-70 uppercase tracking-widest">
                                                                        Score: {(selectedSubmission as any).score} ({(selectedSubmission as any).accuracy}%)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => setSelectedSubmission(null)}
                                                                className="h-10 w-10 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
                                                            >
                                                                <X size={24} />
                                                            </button>
                                                        </div>
                                                        <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-gray-50 dark:bg-gray-950">
                                                            {(activeLesson.quiz || []).map((q, idx) => {
                                                                const userAnswer = typeof selectedSubmission.answer === 'string' ? JSON.parse(selectedSubmission.answer)[q.id] : selectedSubmission.answer[q.id];
                                                                const isCorrect = q.type === 'mcq' ? userAnswer === q.correctAnswerIndex : 
                                                                                q.type === 'true-false' ? String(userAnswer) === String(q.correctAnswer) :
                                                                                String(userAnswer || '').trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase();

                                                                return (
                                                                    <div key={q.id} className={`p-6 rounded-2xl border-2 bg-white dark:bg-gray-900 transition-all ${isCorrect ? 'border-green-100 dark:border-green-900/30' : 'border-red-100 dark:border-red-900/30'}`}>
                                                                        <div className="flex items-center gap-3 mb-4">
                                                                            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Question {idx + 1}</span>
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                                                {isCorrect ? 'Correct' : 'Incorrect'}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-lg font-black text-gray-800 dark:text-white mb-6 leading-tight">{q.question}</p>
                                                                        
                                                                        <div className="grid gap-3">
                                                                            {q.type === 'mcq' && q.options?.map((opt, optIdx) => {
                                                                                const isSelected = userAnswer === optIdx;
                                                                                const isActualCorrect = optIdx === q.correctAnswerIndex;
                                                                                
                                                                                let optClass = "border-gray-100 dark:border-gray-800 opacity-40";
                                                                                if (isSelected && isActualCorrect) optClass = "border-green-500 bg-green-50 text-green-700 opacity-100 ring-2 ring-green-500/20";
                                                                                else if (isSelected && !isActualCorrect) optClass = "border-red-500 bg-red-50 text-red-700 opacity-100 ring-2 ring-red-500/20";
                                                                                else if (isActualCorrect) optClass = "border-green-500 border-dashed opacity-100";

                                                                                return (
                                                                                    <div key={optIdx} className={`p-4 rounded-xl border-2 flex items-center gap-3 font-bold transition-all ${optClass}`}>
                                                                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-current text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                                                                            {String.fromCharCode(65 + optIdx)}
                                                                                        </div>
                                                                                        {opt}
                                                                                        {isSelected && isCorrect && <CheckCircle2 size={16} className="ml-auto" />}
                                                                                        {isSelected && !isCorrect && <X size={16} className="ml-auto" />}
                                                                                    </div>
                                                                                );
                                                                            })}

                                                                            {q.type === 'true-false' && (
                                                                                <div className="flex gap-4">
                                                                                    {['true', 'false'].map(val => {
                                                                                        const isSelected = String(userAnswer) === val;
                                                                                        const isActualCorrect = String(q.correctAnswer) === val;
                                                                                        
                                                                                        let optClass = "border-gray-100 dark:border-gray-800 opacity-40";
                                                                                        if (isSelected && isActualCorrect) optClass = "border-green-500 bg-green-50 text-green-700 opacity-100";
                                                                                        else if (isSelected && !isActualCorrect) optClass = "border-red-500 bg-red-50 text-red-700 opacity-100";
                                                                                        else if (isActualCorrect) optClass = "border-green-500 border-dashed opacity-100";

                                                                                        return (
                                                                                            <div key={val} className={`flex-1 py-4 text-center rounded-xl border-2 font-black uppercase text-sm ${optClass}`}>
                                                                                                {val}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            )}

                                                                            {q.type === 'fill-in-blanks' && (
                                                                                <div className="space-y-2">
                                                                                    <div className={`p-4 rounded-xl border-2 font-black italic ${isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'}`}>
                                                                                        {String(userAnswer || '(Empty)')}
                                                                                    </div>
                                                                                    {!isCorrect && (
                                                                                        <div className="text-xs font-bold text-green-600 p-2">
                                                                                            CORRECT ANSWER: <span className="underline italic ml-1">{q.correctAnswer}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="p-6 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                                            <button 
                                                                onClick={() => setSelectedSubmission(null)}
                                                                className="px-8 py-3 bg-gray-800 text-white rounded-xl font-black hover:scale-[1.02] transition-transform"
                                                            >
                                                                CLOSE REVIEW
                                                            </button>
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
                                        <button onClick={() => prevLesson && setLocalActiveLesson(prevLesson)} disabled={!prevLesson || !!liveSession} className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-30 transition-shadow hover:shadow-sm"><ChevronLeft size={16} className="mr-1.5" />Previous</button>
                                        <button onClick={() => nextLesson && setLocalActiveLesson(nextLesson)} disabled={!nextLesson || !!liveSession} className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-30 transition-shadow hover:shadow-sm">Next<ChevronRight size={16} className="ml-1.5" /></button>
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
