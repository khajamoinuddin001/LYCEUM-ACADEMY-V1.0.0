import React from 'react';
import { GraduationCap, FileText, Users, Calendar, CheckCircle } from './icons';

interface UniversityApplicationViewProps {
    user: any;
}

const UniversityApplicationView: React.FC<UniversityApplicationViewProps> = ({ user }) => {
    return (
        <div className="animate-fade-in space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">University Application</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage university applications and student admissions</p>
                </div>
            </header>

            {/* Placeholder Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="w-24 h-24 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <GraduationCap size={48} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                        University Application Module
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        This module is currently under development. It will help you manage student university applications,
                        track application status, and streamline the admission process.
                    </p>

                    {/* Feature Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText size={20} className="text-violet-600 dark:text-violet-400" />
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Application Management</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Track and manage student applications to universities
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <Users size={20} className="text-violet-600 dark:text-violet-400" />
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Student Profiles</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Comprehensive student information and documents
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar size={20} className="text-violet-600 dark:text-violet-400" />
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Deadline Tracking</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Monitor application deadlines and important dates
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle size={20} className="text-violet-600 dark:text-violet-400" />
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Status Updates</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Real-time application status and admission results
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default UniversityApplicationView;
