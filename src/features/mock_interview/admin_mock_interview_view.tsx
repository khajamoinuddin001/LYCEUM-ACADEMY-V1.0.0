import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, History, Trash2, Edit, LayoutGrid, CheckCircle, X, AlertCircle, Clock, GraduationCap, BookOpen, Users, Target, TrendingUp, FileText } from '@/components/common/icons';
import QuestionBank from './question_bank';
import SessionHistory from './session_history';
import NewSession from './session_form';
import type { Contact, MockInterviewSession, QuestionTemplate } from '@/types';
import * as api from '@/utils/api';

interface MockInterviewViewProps {
    contacts?: Contact[];
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string; trend?: string }> = ({ icon, label, value, color, trend }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center mb-4`}>
            {icon}
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
        {trend && (
            <div className={`text-xs mt-2 ${trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend}
            </div>
        )}
    </div>
);

const MockInterviewView: React.FC<MockInterviewViewProps> = ({ contacts = [] }) => {
    const [activeTab, setActiveTab] = useState<'questions' | 'sessions' | 'history'>('sessions');
    const [allContacts, setAllContacts] = useState<Contact[]>(contacts);
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalStudents: 0,
        totalQuestions: 0,
        avgScore: 0
    });

    useEffect(() => {
        // Calculate stats from all contacts
        let totalSessions = 0;
        let totalStudents = 0;
        let totalQuestions = 0;
        let sumScores = 0;
        let scoredSessions = 0;

        allContacts.forEach(contact => {
            const sessions = contact.metadata?.mockInterviewSessions || [];
            if (sessions.length > 0) {
                totalStudents++;
                totalSessions += sessions.length;
                (sessions as any[]).forEach(session => {
                    totalQuestions += session.questions?.length || 0;
                    if (session.overall_average) {
                        sumScores += session.overall_average;
                        scoredSessions++;
                    }
                });
            }
        });

        setStats({
            totalSessions,
            totalStudents,
            totalQuestions,
            avgScore: scoredSessions > 0 ? (sumScores / scoredSessions).toFixed(2) : '0.00'
        });
    }, [allContacts]);

    const handleSaveSession = async (session: MockInterviewSession) => {
        // Find contact and add session to their metadata
        const contactIndex = allContacts.findIndex(c => c.id === session.student_id);
        if (contactIndex === -1) {
            alert('Error: Contact not found');
            return;
        }

        // Get current mock sessions from contact metadata
        const currentSessions = (allContacts[contactIndex].metadata?.mockInterviewSessions || []) as any[];

        // Add new session
        const updatedSessions = [...currentSessions, session];

        // Update contact metadata
        const updatedContact = {
            ...allContacts[contactIndex],
            metadata: {
                ...allContacts[contactIndex].metadata,
                mockInterviewSessions: updatedSessions
            }
        };

        // Save to backend
        try {
            const savedContact = await api.saveContact(updatedContact, false);

            // Update local state
            const newContacts = [...allContacts];
            newContacts[contactIndex] = savedContact;
            setAllContacts(newContacts);

            console.log('Session saved:', session);
            console.log('Saved contact:', savedContact);

            // Trigger automation for mock interview approval/rejection
            let automationTrigger = '';
            if (session.overall_average >= 3.5) {
                automationTrigger = 'Mock Interview Approved (>=3.5)';
            } else if (session.overall_average < 2.5) {
                automationTrigger = 'Mock Interview Rejected (<2.5)';
            } else if (session.verdict === 'Review Required') {
                automationTrigger = 'Mock Interview Review Required';
            }

            if (automationTrigger) {
                const questionsCount = session.questions_count || 0;
                const correctCount = session.correct_count || 0;
                const accuracy = questionsCount > 0 ? ((correctCount / questionsCount) * 100).toFixed(1) : '0.0';

                const automationPayload = {
                    contact_id: allContacts[contactIndex].id,
                    contact_name: allContacts[contactIndex].name,
                    contact_email: allContacts[contactIndex].email,
                    student_id: session.student_id,
                    mock_interview_date: new Date(session.session_date).toLocaleDateString(),
                    attempt_number: session.attempt_number || 1,
                    mock_interview_outcome: session.verdict,
                    mock_interview_average_score: session.overall_average.toFixed(2),
                    mock_interview_questions_count: questionsCount,
                    correct_count: correctCount,
                    incorrect_count: session.incorrect_count || 0,
                    accuracy: accuracy,
                    visa_type: session.visa_type,
                    mock_interview_context_score: session.average_scores?.context?.toFixed(2) || '0.00',
                    mock_interview_body_language_score: session.average_scores?.body_language?.toFixed(2) || '0.00',
                    mock_interview_fluency_score: session.average_scores?.fluency?.toFixed(2) || '0.00',
                    mock_interview_grammar_score: session.average_scores?.grammar?.toFixed(2) || '0.00',
                    mock_interview_feedback: session.ai_feedback || ''
                };

                await api.triggerAutomation(
                    automationTrigger,
                    automationPayload
                ).catch(err => {
                    console.error('Failed to trigger automation:', err);
                });
            }

            return true;
        } catch (error: any) {
            console.error('Error saving contact:', error);
            alert(`Failed to save session: ${error.message || 'Unknown error'}`);
            return false;
        }
    };

    const refreshContacts = async () => {
        try {
            const updatedContacts = await api.getContacts();
            setAllContacts(updatedContacts);
        } catch (error) {
            console.error('Failed to refresh contacts:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 md:p-8 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-lyceum-blue to-blue-600 flex items-center justify-center shadow-lg">
                                <GraduationCap size={28} className="text-white md:w-8 md:h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-0.5 md:mb-1">
                                    Mock Interviews
                                </h1>
                                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                                    Admin Dashboard
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('sessions')}
                            className="w-full md:w-auto flex items-center justify-center px-6 py-3 md:py-4 bg-gradient-to-r from-lyceum-blue to-blue-600 text-white rounded-xl md:rounded-2xl font-semibold hover:shadow-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:-translate-y-1"
                        >
                            <Plus size={20} className="mr-2" />
                            New Session
                        </button>
                    </div>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <StatCard
                        icon={<BookOpen size={24} className="text-blue-600 dark:text-blue-400" />}
                        label="Total Sessions"
                        value={stats.totalSessions}
                        color="bg-blue-600"
                    />
                    <StatCard
                        icon={<Users size={24} className="text-green-600 dark:text-green-400" />}
                        label="Active Students"
                        value={stats.totalStudents}
                        color="bg-green-600"
                    />
                    <StatCard
                        icon={<Target size={24} className="text-purple-600 dark:text-purple-400" />}
                        label="Total Questions"
                        value={stats.totalQuestions}
                        color="bg-purple-600"
                    />
                    <StatCard
                        icon={<TrendingUp size={24} className="text-amber-600 dark:text-amber-400" />}
                        label="Avg Score"
                        value={`${stats.avgScore}/5`}
                        color="bg-amber-600"
                    />
                </div>

                {/* Tab Navigation */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-1.5 md:p-2 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="flex gap-1 md:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                        {[
                            { key: 'sessions', label: 'New Session', icon: Plus },
                            { key: 'history', label: 'Session History', icon: History },
                            { key: 'questions', label: 'Question Bank', icon: FileText }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-medium transition-all duration-300 whitespace-nowrap ${activeTab === tab.key
                                    ? 'bg-gradient-to-r from-lyceum-blue to-blue-600 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <tab.icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700">
                    {activeTab === 'questions' ? (
                        <QuestionBank />
                    ) : activeTab === 'history' ? (
                        <SessionHistory contacts={allContacts} onRefresh={refreshContacts} />
                    ) : (
                        <NewSession contacts={allContacts} onSave={handleSaveSession} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MockInterviewView;
