import React from 'react';
import { ArrowLeft, Shield, FileText, FolderOpen } from 'lucide-react';

interface LegalViewProps {
    onBack: () => void;
}

export const TermsView: React.FC<LegalViewProps> = ({ onBack }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-20 px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-lyceum-blue/10 text-lyceum-blue rounded-lg">
                        <FileText size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms & Conditions</h1>
                </div>
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-lyceum-blue transition-colors font-medium">
                    <ArrowLeft size={18} /> Back
                </button>
            </div>
            <div className="p-8 prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-4">
                <p>Welcome to Lyceum Academy. These terms and conditions outline the rules and regulations for the use of Lyceum Academy's Website.</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">1. Acceptance of Terms</h2>
                <p>By accessing this website, we assume you accept these terms and conditions. Do not continue to use Lyceum Academy if you do not agree to all of the terms and conditions stated on this page.</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">2. Services</h2>
                <p>Lyceum Academy provides educational consultancy, test preparation, and visa assistance services. Each service may have its own specific terms of engagement.</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">3. User Responsibility</h2>
                <p>Users are responsible for providing accurate and truthful information for all applications and consulting sessions.</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">4. Modifications</h2>
                <p>We reserve the right to revise these terms at any time. By using this website, you are expected to review these terms on a regular basis.</p>
            </div>
        </div>
    </div>
);

export const PrivacyView: React.FC<LegalViewProps> = ({ onBack }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-20 px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-lyceum-blue/10 text-lyceum-blue rounded-lg">
                        <Shield size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
                </div>
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-lyceum-blue transition-colors font-medium">
                    <ArrowLeft size={18} /> Back
                </button>
            </div>
            <div className="p-8 prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-4">
                <p>At Lyceum Academy, accessible from lyceumacademy.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Lyceum Academy and how we use it.</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">1. Information Collection</h2>
                <p>We collect information you provide directly to us, such as when you create an account, fill out an enquiry form, or subscribe to our newsletter.</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">2. Use of Information</h2>
                <p>We use the information we collect to provide, maintain, and improve our services, communicate with you, and personalize your experience.</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">3. Data Security</h2>
                <p>We implement a variety of security measures to maintain the safety of your personal information.</p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6">4. Consent</h2>
                <p>By using our website, you hereby consent to our Privacy Policy and agree to its terms.</p>
            </div>
        </div>
    </div>
);

export const LandingDocumentsView: React.FC<LegalViewProps> = ({ onBack }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-20 px-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-lyceum-blue/10 text-lyceum-blue rounded-lg">
                        <FolderOpen size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
                </div>
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-lyceum-blue transition-colors font-medium">
                    <ArrowLeft size={18} /> Back
                </button>
            </div>
            <div className="p-8 text-center space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800">
                    <FolderOpen size={48} className="mx-auto text-lyceum-blue mb-4 opacity-50" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Public Documentation</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        This section will soon contain public brochures, university guides, and visa checklists.
                    </p>
                </div>
                <p className="text-sm text-gray-500 italic">
                    For personalized documents, please log in to your student portal.
                </p>
            </div>
        </div>
    </div>
);
