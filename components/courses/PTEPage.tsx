import React from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Clock, Award } from 'lucide-react';

interface PTEPageProps {
    onBack: () => void;
}

const PTEPage: React.FC<PTEPageProps> = ({ onBack }) => {
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
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">PTE Academic</h1>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-12 bg-orange-50 dark:bg-orange-900/10">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex p-4 rounded-full bg-white dark:bg-gray-800 shadow-sm mb-6 text-orange-500">
                        <BookOpen size={32} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
                        Ace the <span className="text-orange-500">PTE</span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Fast-track your English proficiency with our improved Pearson Test of English curriculum. Computer-based testing strategies simplified.
                    </p>
                </div>
            </section>

            {/* Course Details */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <Clock className="text-orange-500 mb-4" size={24} />
                            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Duration</h3>
                            <p className="text-gray-500 dark:text-gray-400">3-6 Weeks</p>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <BookOpen className="text-orange-500 mb-4" size={24} />
                            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Format</h3>
                            <p className="text-gray-500 dark:text-gray-400">Computer-based Testing</p>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <Award className="text-orange-500 mb-4" size={24} />
                            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Target Score</h3>
                            <p className="text-gray-500 dark:text-gray-400">65+ (79+ available)</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Highlights</h3>
                            <ul className="grid md:grid-cols-2 gap-4">
                                {[
                                    'AI-scoring algorithm insights',
                                    'Speaking fluency & pronunciation drills',
                                    'Describe Image & Retell Lecture templates',
                                    'Essay & Summarize Written Text framework',
                                    'Real-time computer practice test',
                                    'Unlimited doubt clearing sessions'
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

export default PTEPage;
