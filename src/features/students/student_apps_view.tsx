import React from 'react';
import { BookOpen, FileText, User, FileUp, Paperclip, Receipt, CheckCircle2, MessagesSquare, GraduationCap, Megaphone, UserCheck, FileStack, Clock } from 'lucide-react';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface StudentAppsViewProps {
    onAppSelect: (appName: string) => void;
}

interface AppCard {
    name: string;
    icon: React.ReactNode;
    description: string;
    bgColor: string;
    iconColor: string;
}

const DraggableAppCard: React.FC<{ app: AppCard, onAppSelect: (appName: string) => void }> = ({ app, onAppSelect }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: app.name,
        data: { name: app.name, type: 'APP_GRID_ITEM' }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <button
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => !isDragging && onAppSelect(app.name)}
            className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-left border border-gray-200 dark:border-gray-700 hover:border-lyceum-blue dark:hover:border-lyceum-blue transform hover:-translate-y-1 cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-2xl scale-105 ring-2 ring-blue-500' : ''}`}
        >
            {/* Icon Container */}
            <div className={`${app.bgColor} ${app.iconColor} w-20 h-20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {app.icon}
            </div>

            {/* App Name */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-lyceum-blue dark:group-hover:text-lyceum-blue transition-colors">
                {app.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
                {app.description}
            </p>

            {/* Hover Arrow */}
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                    className="w-6 h-6 text-lyceum-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </div>
        </button>
    );
};

import * as api from '@/utils/api';
import { FormAssignment, FormTemplate, FormSubmission } from '@/types';
import StudentFormFiller from '../forms/student_form_filler';

const StudentAppsView: React.FC<StudentAppsViewProps> = ({ onAppSelect }) => {
    const [pendingForms, setPendingForms] = React.useState<FormAssignment[]>([]);
    const [templates, setTemplates] = React.useState<FormTemplate[]>([]);
    const [activeAssignment, setActiveAssignment] = React.useState<FormAssignment | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [asgns, tmpls] = await Promise.all([
                    api.getFormAssignments(1), // Using a mock studentId for now
                    api.getFormTemplates()
                ]);
                setPendingForms(asgns.filter(a => a.status === 'Pending' || a.status === 'In Progress'));
                setTemplates(tmpls);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFormSubmitted = (submission: FormSubmission) => {
        setPendingForms(prev => prev.filter(f => f.id !== submission.assignmentId));
        setActiveAssignment(null);
    };

    const apps: AppCard[] = [
        {
            name: 'LMS',
            icon: <BookOpen size={48} />,
            description: 'Access your courses, lessons, and learning materials',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            name: 'Tickets',
            icon: <FileText size={48} />,
            description: 'Raise support tickets and track your queries',
            bgColor: 'bg-amber-100 dark:bg-amber-900/20',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            name: 'Accounts',
            icon: <Receipt size={48} />,
            description: 'View your invoices and payment records',
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            name: 'Quotations',
            icon: <FileText size={48} />,
            description: 'View quotations and proposals created for you',
            bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            name: 'My Profile',
            icon: <User size={48} />,
            description: 'View and update your profile information',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
            iconColor: 'text-purple-600 dark:text-purple-400',
        },
        {
            name: 'Documents',
            icon: <Paperclip size={48} />,
            description: 'Access your uploaded documents and files',
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            name: 'Document manager',
            icon: <FileUp size={48} strokeWidth={1.8} />,
            description: 'Manage and organize your portal documents',
            bgColor: 'bg-gradient-to-br from-sky-400 to-blue-500',
            iconColor: 'text-white',
        },
        {
            name: 'Tasks',
            icon: <CheckCircle2 size={48} />,
            description: 'View your assigned tasks and to-dos',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
            iconColor: 'text-orange-600 dark:text-orange-400',
        },
        {
            name: 'Visa Application',
            icon: <FileText size={48} />,
            description: 'Track your visa process, CGI credentials, and status',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
            iconColor: 'text-orange-600 dark:text-orange-400',
        },
        {
            name: 'Discuss',
            icon: <MessagesSquare size={48} />,
            description: 'Chat with staff, admins, and fellow students',
            bgColor: 'bg-teal-100 dark:bg-teal-900/20',
            iconColor: 'text-teal-600 dark:text-teal-400',
        },
        {
            name: 'University Application',
            icon: <GraduationCap size={48} />,
            description: 'Track your university applications and admission status',
            bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
            iconColor: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            name: 'Announcements',
            icon: <Megaphone size={48} />,
            description: 'View important announcements and updates from the academy',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
            iconColor: 'text-orange-600 dark:text-orange-400',
        },
        {
            name: 'Mock Interview',
            icon: <UserCheck size={48} />,
            description: 'View your mock interview sessions and performance feedback',
            bgColor: 'bg-rose-100 dark:bg-rose-900/20',
            iconColor: 'text-rose-600 dark:text-rose-400',
        },
        {
            name: 'Forms',
            icon: <FileStack size={48} />,
            description: 'Access and submit various academy forms and surveys',
            bgColor: 'bg-violet-100 dark:bg-violet-900/20',
            iconColor: 'text-violet-600 dark:text-violet-400',
        },
    ];

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Apps</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Access all your student portal applications
                        </p>
                    </div>
                    {isLoading && <Clock className="animate-spin text-gray-300" size={24} />}
                </div>

                {/* Pending Forms Widget */}
                {pendingForms.length > 0 && (
                    <div className="mb-10 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-violet-500/20 animate-in fade-in duration-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                <FileStack size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Pending Academy Forms</h2>
                                <p className="text-violet-100 text-sm font-medium">You have {pendingForms.length} form{pendingForms.length > 1 ? 's' : ''} that need your attention.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingForms.map(asgn => {
                                const template = templates.find(t => t.id === asgn.templateId);
                                return (
                                    <div key={asgn.id} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/20 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-lg">{template?.title || 'Unknown Form'}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${asgn.status === 'In Progress' ? 'bg-amber-400 text-amber-950' : 'bg-white/20 text-white'}`}>
                                                {asgn.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-violet-100 font-medium">
                                                <Clock size={14} />
                                                <span>Assigned: {new Date(asgn.assignedAt).toLocaleDateString()}</span>
                                            </div>
                                            <button 
                                                onClick={() => setActiveAssignment(asgn)}
                                                className="flex items-center gap-2 bg-white text-violet-700 px-4 py-2 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all"
                                            >
                                                <span>{asgn.status === 'In Progress' ? 'Resume' : 'Fill Now'}</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeAssignment && (
                    <StudentFormFiller 
                        assignment={activeAssignment}
                        template={templates.find(t => t.id === activeAssignment.templateId)!}
                        onClose={() => setActiveAssignment(null)}
                        onSubmitted={handleFormSubmitted}
                    />
                )}

                {/* Apps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apps.map((app) => (
                        <DraggableAppCard key={app.name} app={app} onAppSelect={onAppSelect} />
                    ))}
                </div>

                {/* Quick Stats or Info Section */}

            </div>
        </div>
    );
};

export default StudentAppsView;
