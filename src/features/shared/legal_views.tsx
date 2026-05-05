import React from 'react';
import { ArrowLeft, Shield, FileText, FolderOpen, Smartphone, Lock, Eye, CheckCircle2, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-lyceum-blue hover:text-white dark:hover:bg-lyceum-blue dark:hover:text-white transition-all duration-300 shadow-sm group"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Lyceum Academy & Mobile App</p>
                    </div>
                </div>
                <div className="hidden sm:flex p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                    <Shield className="w-6 h-6 text-lyceum-blue" />
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="px-8 py-10 sm:p-12 space-y-12 text-gray-600 dark:text-gray-300 leading-relaxed">
                    
                    <section className="relative">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-2 bg-lyceum-blue/10 rounded-lg mt-1">
                                <Shield className="w-5 h-5 text-lyceum-blue" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Introduction</h2>
                                <div className="w-12 h-1 bg-lyceum-blue/20 rounded-full mt-2" />
                            </div>
                        </div>
                        <p>At Lyceum Academy, accessible from <a href="http://www.lyceumacad.com" className="text-lyceum-blue hover:underline">www.lyceumacad.com</a>, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Lyceum Academy and how we use it.</p>
                        <p className="mt-4">If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.</p>
                    </section>

                    <section>
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-2 bg-lyceum-blue/10 rounded-lg mt-1">
                                <FileText className="w-5 h-5 text-lyceum-blue" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Log Files</h2>
                                <div className="w-12 h-1 bg-lyceum-blue/20 rounded-full mt-2" />
                            </div>
                        </div>
                        <p>Lyceum Academy follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.</p>
                    </section>

                    <section>
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-2 bg-lyceum-blue/10 rounded-lg mt-1">
                                <CheckCircle2 className="w-5 h-5 text-lyceum-blue" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cookies and Web Beacons</h2>
                                <div className="w-12 h-1 bg-lyceum-blue/20 rounded-full mt-2" />
                            </div>
                        </div>
                        <p>Like any other website, Lyceum Academy uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>
                    </section>

                    <section>
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-2 bg-lyceum-blue/10 rounded-lg mt-1">
                                <Lock className="w-5 h-5 text-lyceum-blue" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Third Party Privacy Policies</h2>
                                <div className="w-12 h-1 bg-lyceum-blue/20 rounded-full mt-2" />
                            </div>
                        </div>
                        <p>Lyceum Academy's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. You can choose to disable cookies through your individual browser options.</p>
                    </section>

                    <section>
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-2 bg-lyceum-blue/10 rounded-lg mt-1">
                                <Smartphone className="w-5 h-5 text-lyceum-blue" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Children's Information</h2>
                                <div className="w-12 h-1 bg-lyceum-blue/20 rounded-full mt-2" />
                            </div>
                        </div>
                        <p>Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity. Lyceum Academy does not knowingly collect any Personal Identifiable Information from children under the age of 13.</p>
                    </section>

                    <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Consent</h2>
                        <p>By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.</p>
                    </div>

                    {/* Mobile App Section */}
                    <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-lyceum-blue text-white rounded-2xl shadow-lg shadow-lyceum-blue/20">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Mobile Application - Lyceum Academy - Visa & Study</h2>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-lyceum-blue" />
                                        Information collected through the app
                                    </h3>
                                    <ul className="space-y-2 ml-3.5">
                                        <li className="flex gap-2"><span>•</span> Name, email, and phone number (for account creation)</li>
                                        <li className="flex gap-2"><span>•</span> Educational documents: passport, academic certificates, test scores (for university and visa applications)</li>
                                        <li className="flex gap-2"><span>•</span> Payment records for our services (we do not store card details)</li>
                                        <li className="flex gap-2"><span>•</span> Push notification token (for status updates and announcements)</li>
                                    </ul>
                                </div>
                                
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-lyceum-blue" />
                                        How we use it
                                    </h3>
                                    <ul className="space-y-2 ml-3.5">
                                        <li className="flex gap-2"><span>•</span> Process university applications and visa filings</li>
                                        <li className="flex gap-2"><span>•</span> Manage counselor appointments (in-person and online video calls)</li>
                                        <li className="flex gap-2"><span>•</span> Send notifications about application status, document reviews, and appointments</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/50">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-lyceum-blue">
                                        <Lock className="w-4 h-4" />
                                        Data Security
                                    </h3>
                                    <ul className="space-y-2">
                                        <li className="flex gap-2 text-sm text-blue-800 dark:text-blue-300"><span>•</span> All data transmitted over HTTPS encryption</li>
                                        <li className="flex gap-2 text-sm text-blue-800 dark:text-blue-300"><span>•</span> Access restricted to authorized Lyceum Academy staff</li>
                                        <li className="flex gap-2 text-sm text-blue-800 dark:text-blue-300"><span>•</span> Documents stored securely on encrypted servers</li>
                                    </ul>
                                </div>

                                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        Contact
                                    </h3>
                                    <a href="mailto:omar@lyceumacad.com" className="text-lyceum-blue font-medium hover:underline text-lg">omar@lyceumacad.com</a>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} Lyceum Academy. All rights reserved.</p>
                </div>
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
