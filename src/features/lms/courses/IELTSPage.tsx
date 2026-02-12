import React from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Clock, Award } from 'lucide-react';

interface IELTSPageProps {
    onBack: () => void;
}

const IELTSPage: React.FC<IELTSPageProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-lyceum-blue transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Home</span>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">IELTS Preparation</h1>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-12 bg-blue-50 dark:bg-blue-900/10">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex p-4 rounded-full bg-white dark:bg-gray-800 shadow-sm mb-6 text-lyceum-blue">
                        <BookOpen size={32} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
                        Master the <span className="text-lyceum-blue">IELTS</span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Comprehensive training for the International English Language Testing System. Achieve your target band score with our expert-led curriculum.
                    </p>
                </div>
            </section>

            {/* Course Details */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <Clock className="text-lyceum-blue mb-4" size={24} />
                            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Duration</h3>
                            <p className="text-gray-500 dark:text-gray-400">4-8 Weeks</p>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <BookOpen className="text-lyceum-blue mb-4" size={24} />
                            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Modules</h3>
                            <p className="text-gray-500 dark:text-gray-400">Reading, Writing, Listening, Speaking</p>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <Award className="text-lyceum-blue mb-4" size={24} />
                            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Target Score</h3>
                            <p className="text-gray-500 dark:text-gray-400">7.0+ Band Guaranteed</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What You Will Learn</h3>
                            <ul className="grid md:grid-cols-2 gap-4">
                                {[
                                    'Advanced Vocabulary building',
                                    'Time management strategies',
                                    'Mock tests with feedback',
                                    'One-on-one speaking practice',
                                    'Essay writing techniques',
                                    'Listening comprehension drills'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-1" />
                                        <span className="text-gray-600 dark:text-gray-300">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default IELTSPage;
