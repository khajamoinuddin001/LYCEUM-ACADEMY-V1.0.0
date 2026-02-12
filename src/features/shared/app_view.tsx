import React from 'react';
import { ArrowLeft } from '@/components/common/icons';

interface AppViewProps {
  appName: string;
  onNavigateBack: () => void;
}

const AppView: React.FC<AppViewProps> = ({ appName, onNavigateBack }) => {
  return (
    <div className="p-4 md:p-6 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm animate-fade-in">
      <button
        onClick={onNavigateBack}
        className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-4 transition-colors"
        aria-label="Back to apps"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Apps
      </button>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">{appName}</h1>
      <p className="mt-4 text-gray-500 dark:text-gray-400">
        This is a placeholder for the <span className="font-semibold">{appName}</span> application.
        All the specific functionality and UI for this app would be built here.
      </p>
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

export default AppView;