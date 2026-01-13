import React, { useState } from 'react';
import {
    GraduationCap,
    BookOpen,
    Globe,
    CheckCircle,
    ArrowRight,
    MapPin,
    Plane,
    FileText,
    Award,
    Send,
    Users
} from 'lucide-react';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
    const [enquiry, setEnquiry] = useState({
        name: '',
        email: '',
        phone: '',
        country: '',
        interest: 'Study Abroad',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleEnquirySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        try {
            const response = await fetch('/api/public/enquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(enquiry)
            });

            if (response.ok) {
                setStatus('success');
                setEnquiry({ name: '', email: '', phone: '', country: '', interest: 'Study Abroad', message: '' });
                setTimeout(() => setStatus('idle'), 5000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setEnquiry({ ...enquiry, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 font-sans">
            {/* Transparent Navbar */}
            <nav className="fixed w-full z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-lyceum-blue text-white rounded-lg">
                                <GraduationCap size={28} />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-lyceum-blue to-blue-600">
                                Lyceum Academy
                            </span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#destinations" className="text-gray-600 dark:text-gray-300 hover:text-lyceum-blue font-medium transition-colors">Destinations</a>
                            <a href="#tests" className="text-gray-600 dark:text-gray-300 hover:text-lyceum-blue font-medium transition-colors">Test Prep</a>
                            <a href="#services" className="text-gray-600 dark:text-gray-300 hover:text-lyceum-blue font-medium transition-colors">Services</a>
                            <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-lyceum-blue font-medium transition-colors">Contact</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={onLogin} className="text-gray-700 dark:text-gray-200 hover:text-lyceum-blue font-medium transition-colors">Log In</button>
                            <button onClick={onRegister} className="px-5 py-2.5 bg-lyceum-blue text-white rounded-full hover:bg-lyceum-blue-dark transition-all transform hover:scale-105 font-medium shadow-lg shadow-blue-500/30">
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 opacity-70"></div>
                    {/* Abstract shapes or background image could go here */}
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-lyceum-blue text-sm font-semibold mb-6 animate-fade-in-up">
                        Your Gateway to Global Education
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight leading-tight animate-fade-in-up delay-100">
                        Study Abroad in
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-lyceum-blue to-purple-600"> Top Universities</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
                        We guide you through every step of your international education journey. From university selection and test prep to visa assistance and pre-departure briefing.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
                        <a href="#contact" className="px-8 py-4 bg-lyceum-blue text-white rounded-full hover:bg-lyceum-blue-dark transition-all transform hover:scale-105 font-bold text-lg shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2">
                            Book Free Consultation
                            <ArrowRight size={20} />
                        </a>
                        <a href="#destinations" className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-bold text-lg">
                            Explore Destinations
                        </a>
                    </div>
                </div>
            </section>

            {/* Destinations Section */}
            <section id="destinations" className="py-24 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Destination</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">We help you apply to the best universities in the world's top educational hubs.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { country: 'USA', color: 'bg-blue-500', desc: 'World-class universities and diverse cultural experiences.' },
                            { country: 'UK', color: 'bg-red-600', desc: 'Historic institutions with short, intensive degree programs.' },
                            { country: 'Canada', color: 'bg-red-500', desc: 'High quality of life and excellent post-study work opportunities.' },
                            { country: 'Australia', color: 'bg-indigo-600', desc: 'Cutting-edge research and a vibrant outdoor lifestyle.' },
                            { country: 'Gulf', color: 'bg-emerald-600', desc: 'Emerging educational hubs with tax-free benefits.' },
                            { country: 'Europe', color: 'bg-yellow-500', desc: 'Affordable quality education and rich cultural heritage.' },
                        ].map((dest, idx) => (
                            <div key={idx} className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 h-64">
                                <div className={`absolute inset-0 ${dest.color} opacity-90 transition-opacity group-hover:opacity-100`}></div>
                                <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 text-center">
                                    <Globe size={48} className="mb-4 opacity-80 group-hover:scale-110 transition-transform duration-300" />
                                    <h3 className="text-2xl font-bold mb-2">{dest.country}</h3>
                                    <p className="text-white/90 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        {dest.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Test Prep Section */}
            <section id="tests" className="py-24 bg-gray-50 dark:bg-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="w-full md:w-1/2">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Ace Your Language Tests
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                                Get comprehensive training for all major English proficiency tests. Our expert trainers ensure you achieve the score required for your dream university.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { name: 'IELTS', desc: 'International English Language Testing System' },
                                    { name: 'PTE', desc: 'Pearson Test of English' },
                                    { name: 'TOEFL', desc: 'Test of English as a Foreign Language' },
                                    { name: 'Duolingo', desc: 'Duolingo English Test' }
                                ].map((test) => (
                                    <div key={test.name} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="h-12 w-12 rounded-full bg-lyceum-blue/10 flex items-center justify-center text-lyceum-blue font-bold">
                                            {test.name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">{test.name}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{test.desc}</p>
                                        </div>
                                        <CheckCircle className="ml-auto text-green-500" size={20} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 relative">
                            <div className="aspect-square rounded-full bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 absolute inset-0 -z-10 animate-pulse"></div>
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700">
                                <div className="text-center mb-8">
                                    <Award size={64} className="mx-auto text-yellow-500 mb-4" />
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Success Guarantee</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2">Join thousands of students who achieved their target scores.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <div className="text-3xl font-bold text-lyceum-blue">98%</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Pass Rate</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <div className="text-3xl font-bold text-purple-600">5000+</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Students</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-24 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">End-to-End Support</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">We don't just help you apply; we help you settle in.</p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { title: 'Counseling', icon: <Users size={24} />, desc: 'Expert career guidance to choose the right course and university.' },
                            { title: 'Admission', icon: <FileText size={24} />, desc: 'Assistance with application documentation and submission.' },
                            { title: 'Visa', icon: <Plane size={24} />, desc: 'Complete support for visa application and mock interviews.' },
                            { title: 'Pre-Departure', icon: <MapPin size={24} />, desc: 'Briefings on accommodation, lifestyle, and travel.' }
                        ].map((srv, i) => (
                            <div key={i} className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-white hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700">
                                <div className="w-12 h-12 bg-lyceum-blue/10 rounded-lg flex items-center justify-center text-lyceum-blue mb-4">
                                    {srv.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{srv.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {srv.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enquiry Form Section */}
            <section id="contact" className="py-24 bg-lyceum-blue relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                        <div className="md:w-1/2 p-8 md:p-12 bg-gray-50 dark:bg-gray-900 flex flex-col justify-center">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Get Free Expert Advice</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-8">
                                Fill out the form and our expert counselors will contact you within 24 hours to discuss your study abroad plans.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle size={16} /></div>
                                    <span>Free profile evaluation</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle size={16} /></div>
                                    <span>Scholarship guidance</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle size={16} /></div>
                                    <span>Visa assistance</span>
                                </div>
                            </div>
                        </div>

                        <div className="md:w-1/2 p-8 md:p-12">
                            {status === 'success' ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h3>
                                    <p className="text-gray-600 dark:text-gray-400">We received your enquiry. Our team will contact you shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                        <input
                                            name="name"
                                            required
                                            value={enquiry.name}
                                            onChange={handleChange}
                                            type="text"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                        <input
                                            name="email"
                                            required
                                            value={enquiry.email}
                                            onChange={handleChange}
                                            type="email"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                        <input
                                            name="phone"
                                            required
                                            value={enquiry.phone}
                                            onChange={handleChange}
                                            type="tel"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interested Country</label>
                                            <select
                                                name="country"
                                                value={enquiry.country}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Select...</option>
                                                <option value="USA">USA</option>
                                                <option value="UK">UK</option>
                                                <option value="Canada">Canada</option>
                                                <option value="Australia">Australia</option>
                                                <option value="Europe">Europe</option>
                                                <option value="Gulf">Gulf</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Interest</label>
                                            <select
                                                name="interest"
                                                value={enquiry.interest}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="Study Abroad">Study Abroad</option>
                                                <option value="IELTS Coaching">IELTS Coaching</option>
                                                <option value="PTE Coaching">PTE Coaching</option>
                                                <option value="TOEFL Coaching">TOEFL Coaching</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message (Optional)</label>
                                        <textarea
                                            name="message"
                                            value={enquiry.message}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lyceum-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
                                            placeholder="Tell us about your educational background..."
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'submitting'}
                                        className="w-full py-3 bg-lyceum-blue text-white rounded-lg hover:bg-lyceum-blue-dark transition-all font-bold shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {status === 'submitting' ? 'Sending...' : 'Submit Enquiry'}
                                        {!status.startsWith('submi') && <Send size={18} />}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <GraduationCap size={24} className="text-lyceum-blue" />
                                <span className="text-xl font-bold">Lyceum Academy</span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Empowering students to achieve their global education dreams through expert guidance and comprehensive support.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Services</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>Study Abroad</li>
                                <li>Test Preparation</li>
                                <li>Visa Counseling</li>
                                <li>Career Guidance</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Destinations</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>USA</li>
                                <li>UK</li>
                                <li>Canada</li>
                                <li>Australia</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Contact</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>info@lyceumacademy.com</li>
                                <li>+91 98765 43210</li>
                                <li>Hyderabad, India</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
                        © 2025 Lyceum Academy. All rights reserved.
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
            `}</style>
        </div>
    );
};

export default LandingPage;
