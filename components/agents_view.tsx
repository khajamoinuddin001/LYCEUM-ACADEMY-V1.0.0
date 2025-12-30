import React from 'react';
import { ArrowLeft } from './icons';

interface AgentsViewProps {
    onNavigateBack: () => void;
}

const AgentsView: React.FC<AgentsViewProps> = ({ onNavigateBack }) => {
    return (
        <div className="p-6">
            <button
                onClick={onNavigateBack}
                className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-4 transition-colors"
            >
                <ArrowLeft size={16} className="mr-2" />
                Back to Apps
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">Agents Module</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    This module is reserved for future agent management features.
                </p>
                <div className="inline-block px-6 py-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg">
                    Coming Soon
                </div>
            </div>
        </div>
    );
};

export default AgentsView;
