import React, { useState, useMemo } from 'react';
import { History, Calendar, User, Target, ChevronRight, Search, TrendingUp, CheckCircle, X, AlertCircle, BookOpen, Trash2 } from '@/components/common/icons';
import type { Contact, MockInterviewSession } from '@/types';
import * as api from '@/utils/api';

interface SessionHistoryProps {
    contacts: Contact[];
    onRefresh?: () => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ contacts, onRefresh }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterVerdict, setFilterVerdict] = useState('All');
    const [selectedSession, setSelectedSession] = useState<MockInterviewSession | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Flatten all sessions from all contacts
    const allSessions = useMemo(() => {
        const sessions: (MockInterviewSession)[] = [];
        contacts.forEach(contact => {
            const studentSessions = contact.metadata?.mockInterviewSessions || [];
            studentSessions.forEach((s: any) => {
                sessions.push({ ...s, studentName: contact.name });
            });
        });
        return sessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
    }, [contacts]);

    const filteredSessions = allSessions.filter(s => {
        const matchesSearch = (s as any).studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.visa_type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesVerdict = filterVerdict === 'All' || s.verdict === filterVerdict;
        return matchesSearch && matchesVerdict;
    });

    const getVerdictStyle = (verdict: string) => {
        switch (verdict) {
            case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'Review Required': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const handleDeleteSession = async (e: React.MouseEvent, session: MockInterviewSession) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete this session for ${(session as any).studentName}?`)) {
            return;
        }

        setIsDeleting(session.id);
        try {
            await api.deleteMockInterviewSession(session.student_id, session.id);
            onRefresh?.();
        } catch (error: any) {
            console.error('Failed to delete session:', error);
            alert(`Error deleting session: ${error.message || 'Unknown error'}`);
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-gray-700 pb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search student or visa type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-lyceum-blue"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {['All', 'Approved', 'Rejected', 'Review Required'].map(v => (
                        <button
                            key={v}
                            onClick={() => setFilterVerdict(v)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                                filterVerdict === v 
                                ? 'bg-lyceum-blue text-white shadow-lg' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                            }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Session List */}
            <div className="space-y-4">
                {filteredSessions.length > 0 ? (
                    filteredSessions.map((session, index) => (
                        <div 
                            key={index}
                            onClick={() => setSelectedSession(session)}
                            className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-lyceum-blue/30 transition-all cursor-pointer group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-lyceum-blue transition-colors">
                                            {(session as any).studentName}
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            <span className="flex items-center gap-1"><Target size={14} /> {session.visa_type}</span>
                                            <span>•</span>
                                            <span>{new Date(session.session_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-gray-50 dark:border-gray-700">
                                    <div className="text-right">
                                        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                            {session.overall_average.toFixed(2)}
                                        </div>
                                        <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Avg Score</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-1.5 md:py-2 rounded-xl font-bold text-xs md:text-sm ${getVerdictStyle(session.verdict)}`}>
                                            {session.verdict}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleDeleteSession(e, session)}
                                                disabled={isDeleting === session.id}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-50"
                                                title="Delete Session"
                                            >
                                                {isDeleting === session.id ? (
                                                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 size={20} />
                                                )}
                                            </button>
                                            <ChevronRight className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                        <History size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Sessions Found</h3>
                        <p className="text-gray-600 dark:text-gray-400">Previous mock interview data will appear here.</p>
                    </div>
                )}
            </div>

            {/* Session Detail Modal */}
            {selectedSession && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-none md:rounded-3xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-fade-in">
                        <div className="bg-gradient-to-r from-lyceum-blue to-blue-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold">Interview Details</h1>
                                <p className="text-blue-100 text-sm md:text-base">{(selectedSession as any).studentName} • {selectedSession.visa_type} • {new Date(selectedSession.session_date).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setSelectedSession(null)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={24} className="md:w-7 md:h-7" /></button>
                        </div>
                        
                        <div className="p-4 md:p-8 overflow-y-auto space-y-6 md:space-y-8">
                            {/* Performance Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Overall Avg</div>
                                    <div className="text-3xl font-black text-lyceum-blue">{selectedSession.overall_average.toFixed(2)}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Accuracy</div>
                                    <div className="text-3xl font-black text-gray-900 dark:text-white">
                                        {selectedSession.questions_count > 0 
                                            ? ((selectedSession.correct_count / selectedSession.questions_count) * 100).toFixed(0) 
                                            : 0}%
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Verdict</div>
                                    <div className={`text-lg font-bold mt-1 ${
                                        selectedSession.verdict === 'Approved' ? 'text-green-600' : 
                                        selectedSession.verdict === 'Rejected' ? 'text-red-600' : 'text-amber-600'
                                    }`}>
                                        {selectedSession.verdict}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Questions</div>
                                    <div className="text-3xl font-black text-gray-900 dark:text-white">{selectedSession.questions_count}</div>
                                </div>
                            </div>

                            {/* Detailed Scores */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white"><TrendingUp size={18} className="text-lyceum-blue" /> Criteria Breakdown</h3>
                                    <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl">
                                        {[
                                            { label: 'Content & Context', value: selectedSession.average_scores.context },
                                            { label: 'Body Language', value: selectedSession.average_scores.body_language },
                                            { label: 'Fluency', value: selectedSession.average_scores.fluency },
                                            { label: 'Grammar & Tone', value: selectedSession.average_scores.grammar }
                                        ].map(score => (
                                            <div key={score.label} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400 font-medium">{score.label}</span>
                                                    <span className="font-bold text-gray-900 dark:text-white">{score.value.toFixed(1)}/5.0</span>
                                                </div>
                                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-lyceum-blue" style={{ width: `${(score.value / 5) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white"><AlertCircle size={18} className="text-purple-600" /> AI Insights</h3>
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-100 dark:border-purple-800 text-sm text-purple-900 dark:text-purple-100 leading-relaxed italic">
                                        {selectedSession.ai_feedback || "No AI feedback generated for this session."}
                                    </div>
                                </div>
                            </div>

                            {/* Question List */}
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white"><BookOpen size={18} className="text-amber-600" /> Response Log</h3>
                                <div className="space-y-3">
                                    {selectedSession.questions.map((q, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                            <div className="mt-1">
                                                {q.is_correct ? <CheckCircle size={20} className="text-green-500" /> : <X size={20} className="text-red-500" />}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="font-semibold text-gray-900 dark:text-white">{q.question_text}</div>
                                                {q.notes && <div className="text-sm text-gray-600 dark:text-gray-400 italic">Notes: {q.notes}</div>}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-lyceum-blue">
                                                    {((q.scores.context + q.scores.body_language + q.scores.fluency + q.scores.grammar) / 4).toFixed(1)}
                                                </div>
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

export default SessionHistory;
