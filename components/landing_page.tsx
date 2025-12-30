import React from 'react';
import { GraduationCap, Users, BookOpen, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <GraduationCap className="text-lyceum-blue" size={32} />
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">Lyceum Academy</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onLogin}
                                className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-lyceum-blue font-medium transition-colors"
                            >
                                Log In
                            </button>
                            <button
                                onClick={onRegister}
                                className="px-6 py-2 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-colors font-medium"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 animate-fade-in">
                            Transform Your
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-lyceum-blue to-purple-600">
                                Educational Institution
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                            Complete ERP solution for managing students, staff, admissions, and operations - all in one powerful platform.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={onLogin}
                                className="px-8 py-4 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-all transform hover:scale-105 font-semibold text-lg flex items-center justify-center gap-2 shadow-lg"
                            >
                                Log In
                                <ArrowRight size={20} />
                            </button>
                            <button
                                onClick={onRegister}
                                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold text-lg border-2 border-gray-200 dark:border-gray-600">
                                Create Account
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Everything You Need to Succeed
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Powerful features designed for modern educational institutions
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-lyceum-blue rounded-lg flex items-center justify-center mb-4">
                                <Users className="text-white" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Student Management
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Complete student lifecycle management from admission to graduation with detailed profiles and progress tracking.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 hover:shadow-xl transition-all transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                                <BookOpen className="text-white" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Learning Management
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Integrated LMS with course creation, assignments, quizzes, and progress tracking for enhanced learning.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 hover:shadow-xl transition-all transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                                <TrendingUp className="text-white" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                CRM & Admissions
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Streamline your admissions process with lead tracking, pipeline management, and automated workflows.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 hover:shadow-xl transition-all transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                                <CheckCircle className="text-white" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Attendance & Tasks
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Track attendance, manage tasks, and monitor performance with real-time dashboards and reports.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 hover:shadow-xl transition-all transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                                <GraduationCap className="text-white" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Visa & Immigration
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Specialized tools for managing international student visa applications and documentation.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-1">
                            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                                <BookOpen className="text-white" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Financial Management
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                Complete accounting solution with invoicing, payments, transactions, and financial reporting.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                        Ready to Transform Your Institution?
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                        Join hundreds of educational institutions already using Lyceum Academy
                    </p>
                    <button
                        onClick={onRegister}
                        className="px-10 py-4 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-all transform hover:scale-105 font-semibold text-lg shadow-xl"
                    >
                        Start Your Journey Today
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <GraduationCap size={28} />
                        <span className="text-2xl font-bold">Lyceum Academy</span>
                    </div>
                    <p className="text-gray-400">
                        © 2025 Lyceum Academy. All rights reserved.
                    </p>
                </div>
            </footer>

            <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

export default LandingPage;
