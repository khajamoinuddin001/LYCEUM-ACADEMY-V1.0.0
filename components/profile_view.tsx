
import React from 'react';
import { ArrowLeft, Mail, Phone, UserCircle } from './icons';
import type { User } from '../types';

interface ProfileViewProps {
  onNavigateBack: () => void;
  user: User;
}

const InfoCard: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const ProfileView: React.FC<ProfileViewProps> = ({ onNavigateBack, user }) => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
       <button
        onClick={onNavigateBack}
        className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue dark:hover:text-lyceum-blue/80 mb-4 transition-colors"
        aria-label="Back to apps"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col sm:flex-row items-center mb-6">
        <UserCircle size={100} className="text-gray-300 dark:text-gray-600 mb-4 sm:mb-0 sm:mr-6" />
        <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{user.name}</h1>
            <p className="text-gray-600 dark:text-gray-300">{user.role}</p>
             <div className="flex items-center justify-center sm:justify-start space-x-4 mt-2 text-sm">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Mail size={14} className="mr-1.5" />
                    {user.email}
                </div>
                 <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Phone size={14} className="mr-1.5" />
                    +1 (555) 000-0000
                </div>
            </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <InfoCard title="Preferences">
            <p className="text-gray-600 dark:text-gray-300">This section would contain user-specific preferences like language, timezone, and notification settings.</p>
        </InfoCard>
         <InfoCard title="Security">
            <p className="text-gray-600 dark:text-gray-300">This section would allow users to change their password, manage API keys, and view active sessions.</p>
        </InfoCard>
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

export default ProfileView;
