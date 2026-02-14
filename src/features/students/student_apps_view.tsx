import React from 'react';
import { BookOpen, FileText, User, Paperclip, Receipt, CheckCircle2, MessagesSquare } from 'lucide-react';

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

const StudentAppsView: React.FC<StudentAppsViewProps> = ({ onAppSelect }) => {
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
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            iconColor: 'text-green-600 dark:text-green-400',
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
    ];

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Apps</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Access all your student portal applications
                    </p>
                </div>

                {/* Apps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apps.map((app) => (
                        <button
                            key={app.name}
                            onClick={() => onAppSelect(app.name)}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('application/json', JSON.stringify({ name: app.name, type: 'APP_GRID_ITEM' }));
                                e.dataTransfer.effectAllowed = 'copyMove';
                            }}
                            className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-left border border-gray-200 dark:border-gray-700 hover:border-lyceum-blue dark:hover:border-lyceum-blue transform hover:-translate-y-1 cursor-grab active:cursor-grabbing"
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
                    ))}
                </div>

                {/* Quick Stats or Info Section */}

            </div>
        </div>
    );
};

export default StudentAppsView;
