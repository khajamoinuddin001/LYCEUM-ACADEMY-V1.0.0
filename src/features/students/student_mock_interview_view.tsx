import React, { useState } from 'react';
import { UserCheck, BookOpen, Clock, Calendar, ChevronRight, Play, Users, Target, TrendingUp, CheckCircle, X, AlertCircle, Printer } from '@/components/common/icons';
import type { User, MockInterviewSession } from '@/types';

interface StudentMockInterviewViewProps {
    user: User;
    sessions: MockInterviewSession[];
}

const StudentMockInterviewView: React.FC<StudentMockInterviewViewProps> = ({ user, sessions = [] }) => {
    const [selectedSession, setSelectedSession] = useState<MockInterviewSession | null>(null);

    const stats = {
        totalSessions: sessions.length,
        avgScore: sessions.length > 0 
            ? (sessions.reduce((acc, s) => acc + s.overall_average, 0) / sessions.length).toFixed(1)
            : '0.0',
        latestVerdict: sessions.length > 0 ? sessions[sessions.length - 1].verdict : 'Pending'
    };

    const getVerdictStyle = (verdict: string) => {
        switch (verdict) {
            case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'Review Required': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    return (
        <div className={`p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto ${selectedSession ? 'no-print' : ''}`}>
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-rose-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-rose-500/30">
                <div className="relative z-10 max-w-2xl">
                    <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest mb-6">
                        Hello, {user.name}
                    </span>
                    <h1 className="text-3xl md:text-6xl font-black leading-tight mb-4 md:mb-6">
                        Master Your <br className="hidden md:block"/>Interview Skills.
                    </h1>
                    <p className="text-rose-100 text-base md:text-xl font-medium mb-6 md:mb-8 leading-relaxed">
                        Track your progress, review feedback from experts, and get ready for your big day.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 bg-white text-rose-600 rounded-xl md:rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                            <Clock size={20} />
                            Book New Session
                        </button>
                    </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 w-64 h-64 bg-rose-400/20 rounded-full blur-2xl"></div>
                <UserCheck size={280} className="absolute right-[-20px] bottom-[-40px] text-white/5 rotate-[-15deg] pointer-events-none hidden lg:block" />
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-gray-500 text-xs font-black uppercase tracking-widest mb-2">Total Practices</div>
                    <div className="text-4xl font-black text-gray-900 dark:text-white">{stats.totalSessions}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-gray-500 text-xs font-black uppercase tracking-widest mb-2">Average Score</div>
                    <div className="text-4xl font-black text-rose-500">{stats.avgScore}<span className="text-sm text-gray-400 font-medium">/5.0</span></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-gray-500 text-xs font-black uppercase tracking-widest mb-2">Latest Verdict</div>
                    <div className={`text-xl font-black mt-2 inline-block px-4 py-1 rounded-xl ${getVerdictStyle(stats.latestVerdict)}`}>
                        {stats.latestVerdict}
                    </div>
                </div>
            </div>

            {/* Session History */}
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <Calendar className="text-rose-500" /> Your Interview History
                </h2>

                <div className="grid grid-cols-1 gap-4">
                    {sessions.length > 0 ? (
                        [...sessions].reverse().map((session, index) => (
                            <div 
                                key={index}
                                onClick={() => setSelectedSession(session)}
                                className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-rose-500/30 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                                        <Play size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{session.visa_type} Interview</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(session.session_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-xl font-black text-gray-900 dark:text-white">{session.overall_average.toFixed(1)}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">Score</div>
                                    </div>
                                    <span className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider ${getVerdictStyle(session.verdict)}`}>
                                        {session.verdict}
                                    </span>
                                    <ChevronRight className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-12 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                            <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No sessions yet</h3>
                            <p className="text-gray-500 dark:text-gray-400">Practice makes perfect. Book your first mock interview today!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Session Detail Modal */}
            {selectedSession && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-none md:rounded-[2.5rem] w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-fade-in border border-white/10">
                        <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-6 md:p-8 text-white flex justify-between items-center">
                            <div>
                                <h1 className="text-xl md:text-3xl font-black">{selectedSession.visa_type} Interview</h1>
                                <p className="text-rose-100 text-sm md:font-medium">{new Date(selectedSession.session_date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3">
                                <button 
                                    onClick={() => window.print()} 
                                    className="p-2 md:p-3 hover:bg-white/20 rounded-xl md:rounded-2xl transition-all flex items-center gap-2 font-bold text-xs md:text-sm no-print"
                                    title="Print Report"
                                >
                                    <Printer size={20} className="md:w-6 md:h-6" />
                                    <span className="hidden sm:inline">Print</span>
                                </button>
                                <button onClick={() => setSelectedSession(null)} className="p-2 md:p-3 hover:bg-white/20 rounded-xl md:rounded-2xl transition-all no-print">
                                    <X size={24} className="md:w-8 md:h-8" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-4 md:p-8 overflow-y-auto space-y-6 md:space-y-8">
                            {/* Performance Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="bg-rose-50 dark:bg-rose-900/20 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-rose-100 dark:border-rose-800">
                                    <div className="text-rose-600 dark:text-rose-400 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1">Score</div>
                                    <div className="text-2xl md:text-4xl font-black text-rose-700 dark:text-rose-300">{selectedSession.overall_average.toFixed(1)}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-gray-800">
                                    <div className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1">Accuracy</div>
                                    <div className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white">
                                        {selectedSession.questions_count > 0 
                                            ? ((selectedSession.correct_count / selectedSession.questions_count) * 100).toFixed(0) 
                                            : 0}%
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-gray-800 font-black flex flex-col justify-center">
                                    <div className="text-gray-500 text-[10px] md:text-xs uppercase tracking-widest mb-1">Verdict</div>
                                    <div className={`text-sm md:text-lg ${
                                        selectedSession.verdict === 'Approved' ? 'text-green-600' : 
                                        selectedSession.verdict === 'Rejected' ? 'text-red-600' : 'text-amber-600'
                                    }`}>
                                        {selectedSession.verdict}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-gray-800">
                                    <div className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-widest mb-1">Questions</div>
                                    <div className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white">{selectedSession.questions_count}</div>
                                </div>
                            </div>

                            {/* Detailed Scores */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black flex items-center gap-3 text-gray-900 dark:text-white">
                                        <TrendingUp size={24} className="text-rose-500" /> Performance Breakdown
                                    </h3>
                                    <div className="space-y-5 bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl">
                                        {[
                                            { label: 'Content Quality', value: selectedSession.average_scores.context },
                                            { label: 'Body Language', value: selectedSession.average_scores.body_language },
                                            { label: 'Fluency', value: selectedSession.average_scores.fluency },
                                            { label: 'Grammar', value: selectedSession.average_scores.grammar }
                                        ].map(score => (
                                            <div key={score.label} className="space-y-2">
                                                <div className="flex justify-between text-sm font-bold">
                                                    <span className="text-gray-600 dark:text-gray-400">{score.label}</span>
                                                    <span className="text-gray-900 dark:text-white">{score.value.toFixed(1)}/5.0</span>
                                                </div>
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(score.value / 5) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black flex items-center gap-3 text-gray-900 dark:text-white">
                                        <AlertCircle size={24} className="text-rose-500" /> Expert Feedback
                                    </h3>
                                    <div className="bg-rose-50/50 dark:bg-rose-900/10 p-8 rounded-3xl border-2 border-rose-100 dark:border-rose-900/30 text-rose-900 dark:text-rose-100 leading-relaxed font-medium whitespace-pre-wrap">
                                        {selectedSession.ai_feedback || "Your feedback is being processed. It will appear here shortly."}
                                    </div>
                                </div>
                            </div>

                            {/* Question List */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black flex items-center gap-3 text-gray-900 dark:text-white">
                                    <BookOpen size={24} className="text-rose-500" /> Interview Question Log
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedSession.questions.map((q, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row gap-4 md:gap-6 p-4 md:p-6 rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                                            <div className="flex items-center gap-3 sm:block sm:mt-1">
                                                {q.is_correct ? <CheckCircle size={24} className="text-green-500" /> : <X size={24} className="text-red-500" />}
                                                <span className="sm:hidden font-bold text-gray-900 dark:text-white">Q{i + 1}</span>
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div className="font-black text-gray-900 dark:text-white text-base md:text-lg">{q.question_text}</div>
                                                {q.notes && (
                                                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                        <span className="text-rose-500 font-black uppercase text-[10px] block mb-1">Counsellor Notes</span>
                                                        {q.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentMockInterviewView;
