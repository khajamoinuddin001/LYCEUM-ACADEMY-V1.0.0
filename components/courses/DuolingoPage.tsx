import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, Award, Users, TrendingUp, Star, ChevronDown, Play, Shield, Zap, BookOpen, Target, Globe, MessageSquare, Video, FileText, Headphones, GraduationCap, Home, Package, UserCheck, Phone, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

interface DuolingoPageProps {
    onBack: () => void;
}

const DuolingoPage: React.FC<DuolingoPageProps> = ({ onBack }) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'premium'>('pro');

    // Lead Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('submitting');
        try {
            const response = await fetch(`${API_BASE_URL}/public/enquiries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    interest: 'Duolingo English Test',
                    country: 'India' // Default or based on user selection if added
                })
            });

            if (response.ok) {
                setFormStatus('success');
                setFormData({ name: '', email: '', phone: '', message: '' });
                setTimeout(() => setFormStatus('idle'), 5000);
            } else {
                setFormStatus('error');
            }
        } catch (error) {
            setFormStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            {/* Sticky Header */}
            <header className="bg-white dark:bg-gray-900 sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Home</span>
                    </button>
                    <a href="https://lyceumlms.com/product/duolingo-english-test/" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 hover:scale-105 transition-all shadow-lg shadow-green-500/30 inline-block">
                        Enroll Now
                    </a>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-20 bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-900/10 dark:via-gray-900 dark:to-emerald-900/10 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-bold mb-6">
                                <Star size={16} className="fill-current" />
                                #1 Rated Duolingo Prep Course
                            </div>

                            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                                Score <span className="text-green-500">110+</span> on Duolingo English Test
                            </h1>

                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                Master the adaptive test with our proven strategies. Join 1,200+ students who achieved their dream scores in just 2-4 weeks.
                            </p>

                            {/* Trust Badges */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="text-3xl font-black text-green-500">98%</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Success Rate</div>
                                </div>
                                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="text-3xl font-black text-green-500">1200+</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Students</div>
                                </div>
                                <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="text-3xl font-black text-green-500">4.9★</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Rating</div>
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col gap-4">
                                <a href="https://lyceumlms.com/product/duolingo-english-test/" target="_blank" rel="noopener noreferrer" className="w-full px-8 py-5 bg-green-500 text-white rounded-2xl font-bold text-xl hover:bg-green-600 hover:scale-105 transition-all shadow-xl shadow-green-500/30 flex items-center justify-center gap-2">
                                    Enroll Now
                                    <ArrowLeft className="rotate-180" size={24} />
                                </a>
                            </div>

                            {/* Social Proof */}
                            <div className="mt-8 flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    {[
                                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
                                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                                        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
                                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
                                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
                                    ].map((img, i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 overflow-hidden">
                                            <img src={img} alt={`Student ${i + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm">
                                    <div className="font-bold text-gray-900 dark:text-white">1,200+ students enrolled</div>
                                    <div className="text-gray-500 dark:text-gray-400">Join them today!</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Content - Feature Card */}
                        <div className="relative">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-[4rem]"></div>
                                {/* Academy Logo Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-5 dark:opacity-10">
                                    <img src="/academy logo.png" alt="" className="w-48 h-48 object-contain" />
                                </div>

                                <div className="relative z-10">
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                                        <img src="/duolingo logo.png" alt="Duolingo" className="w-16 h-16 object-contain" />
                                    </div>

                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Special Offer!</h3>

                                    <div className="text-center space-y-3">
                                        <div className="text-4xl font-black text-gray-900 dark:text-white">
                                            Pay ₹6,300 for DET Exam
                                        </div>
                                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                            & Get the Course <span className="text-4xl">Free!</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                                        <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 font-bold">
                                            <Shield size={20} />
                                            <span>Official DET Voucher Included</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof - Testimonials */}
            <section className="py-20 bg-gray-50 dark:bg-gray-800/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            Real Results from Real Students
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            See how our students achieved their dream scores
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: 'Sarah Johnson', score: '120/160', before: '90', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', text: 'Improved my score by 45 points in just 3 weeks! The practice tests were exactly like the real exam.' },
                            { name: 'Raj Patel', score: '105/160', before: '75', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', text: 'The AI feedback helped me identify my weak areas. Got accepted to my dream university!' },
                            { name: 'Maria Garcia', score: '135/160', before: '95', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', text: 'Best investment I made for my education. The live sessions were incredibly helpful.' }
                        ].map((testimonial, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                                <div className="flex gap-1 text-yellow-500 mb-4">
                                    {[...Array(5)].map((_, idx) => <Star key={idx} size={16} fill="currentColor" />)}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">"{testimonial.text}"</p>
                                <div className="flex items-center gap-4">
                                    <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{testimonial.name}</div>
                                        <div className="text-sm text-green-500 font-bold">{testimonial.before} → {testimonial.score}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How This Offer Works */}
            <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            How This Offer Works
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Simple, transparent, and designed to help you succeed
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                step: '1',
                                title: 'Pay ₹6,300 for DET Exam Voucher',
                                desc: 'Get an official Duolingo English Test voucher at the standard price',
                                icon: <Award size={32} />,
                                color: 'from-blue-500 to-cyan-400'
                            },
                            {
                                step: '2',
                                title: 'Get Full DET Course FREE',
                                desc: 'Receive complete access to our comprehensive DET preparation course at no extra cost',
                                icon: <BookOpen size={32} />,
                                color: 'from-green-500 to-emerald-400'
                            },
                            {
                                step: '3',
                                title: 'Prepare & Book Your Test with Confidence',
                                desc: 'Study with our materials, practice thoroughly, and take your exam when you\'re ready',
                                icon: <Target size={32} />,
                                color: 'from-purple-500 to-pink-400'
                            }
                        ].map((item, i) => (
                            <div key={i} className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all hover:-translate-y-1">
                                {/* Step Number Badge */}
                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-black text-xl shadow-lg">
                                    {item.step}
                                </div>

                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-6 mx-auto shadow-sm`}>
                                    {item.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">
                                    {item.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Course Features */}
            <section className="py-20 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            What's Included in Your <span className="text-green-500">FREE</span> Course
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Everything you need to ace the DET exam - absolutely free when you register!
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: <BookOpen size={32} />, title: 'Complete DET Syllabus Coverage', desc: 'Full curriculum covering all sections and question types', color: 'from-blue-500 to-cyan-400' },
                            { icon: <Home size={32} />, title: 'Free Room for Final Exam', desc: 'Dedicated exam room facility for your actual DET test', color: 'from-green-500 to-emerald-400' },
                            { icon: <Package size={32} />, title: 'Free Materials', desc: 'Complete study materials and practice resources included', color: 'from-purple-500 to-pink-400' },
                            { icon: <Globe size={32} />, title: 'Free Online Counselling', desc: 'Expert guidance for your abroad study plans', color: 'from-orange-500 to-red-400' },
                            { icon: <UserCheck size={32} />, title: 'Personal Doubt Support', desc: 'One-on-one assistance to clear all your doubts', color: 'from-indigo-500 to-blue-400' }
                        ].map((feature, i) => (
                            <div key={i} className="group p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-green-500 transition-all hover:-translate-y-1">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Students Choose Lyceum Academy */}
            <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            Why Students Choose <span className="text-green-500">Lyceum Academy</span>
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Your trusted partner for DET success and study abroad dreams
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {[
                            {
                                icon: <Users size={32} />,
                                title: 'Experienced Language Trainers',
                                desc: 'Learn from certified experts with years of DET training experience',
                                color: 'from-blue-500 to-cyan-400'
                            },
                            {
                                icon: <TrendingUp size={32} />,
                                title: 'High Success Rate',
                                desc: 'Join our 98% success rate with proven results and student achievements',
                                color: 'from-green-500 to-emerald-400'
                            },
                            {
                                icon: <BookOpen size={32} />,
                                title: 'Updated DET Pattern Training',
                                desc: 'Stay ahead with the latest test format and question patterns',
                                color: 'from-purple-500 to-pink-400'
                            },
                            {
                                icon: <UserCheck size={32} />,
                                title: 'Personal Guidance',
                                desc: 'Get one-on-one mentoring tailored to your learning needs',
                                color: 'from-orange-500 to-red-400'
                            },
                            {
                                icon: <Globe size={32} />,
                                title: 'Visa & Admission Support Available',
                                desc: 'Complete assistance for your study abroad journey beyond just the test',
                                color: 'from-indigo-500 to-blue-400'
                            }
                        ].map((item, i) => (
                            <div key={i} className="group bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:-translate-y-2">
                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm`}>
                                    {item.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Trust Badge */}
                    <div className="mt-12 text-center">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700">
                            <Shield size={24} className="text-green-500" />
                            <span className="font-bold text-gray-900 dark:text-white">Trusted by 1,200+ Students Worldwide</span>
                        </div>
                    </div>
                </div>
            </section>


            {/* FAQ Section */}
            <section className="py-20 bg-white dark:bg-gray-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Everything you need to know
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { q: 'Is this an official DET voucher?', a: 'Yes, you will receive an official Duolingo English Test voucher.' },
                            { q: 'Is the course really free?', a: 'Yes. You only pay for the exam fee. The course is a bonus offer.' },
                            { q: 'How will I get access to the course?', a: 'You will get access to the course immediately after purchase.' },
                            { q: 'Is this offer valid for a limited time?', a: 'Yes, this is a limited‑period promotional offer.' },
                            { q: 'How long does it take to see results?', a: 'Most students see significant improvement within 2-3 weeks of consistent practice. Our adaptive learning system ensures you focus on your weak areas for maximum efficiency.' },
                            { q: 'Do I need any prior English knowledge?', a: 'Our course is designed for all levels. Whether you\'re starting from scratch or looking to perfect your score, we have content tailored to your needs.' }
                        ].map((faq, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full px-8 py-6 text-left flex justify-between items-center group"
                                >
                                    <span className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-green-500 transition-colors">{faq.q}</span>
                                    <ChevronDown size={24} className={`text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`px-8 overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-96 pb-6' : 'max-h-0'}`}>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-6">
                                        {faq.a}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Info & Lead Form Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-32 md:pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="grid lg:grid-cols-2">
                            {/* Left Content */}
                            <div className="p-8 md:p-12 bg-gradient-to-br from-green-500 to-emerald-600 text-white flex flex-col justify-center relative overflow-hidden">
                                {/* Decor */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                                <div className="relative z-10">
                                    <h2 className="text-3xl md:text-4xl font-black mb-6">Get Free Expert Guidance</h2>
                                    <p className="text-green-50 text-lg mb-8 leading-relaxed">
                                        Not sure where to start? Fill out the form and our expert counselors will invoke a personalized plan for you.
                                    </p>

                                    <div className="space-y-6 mb-8">
                                        {[
                                            'Free Profile Evaluation',
                                            'Customized Study Plan',
                                            'Visa Support'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                    <CheckCircle size={18} className="text-white" />
                                                </div>
                                                <span className="font-bold text-lg">{item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Contact Numbers directly in the left panel */}
                                    <div className="mt-8 pt-8 border-t border-white/20">
                                        <p className="text-green-100 font-bold uppercase tracking-widest text-sm mb-4">Or Call Us Directly</p>
                                        <div className="flex flex-col gap-3">
                                            <a href="tel:+917842078791" className="flex items-center gap-3 text-2xl font-black hover:text-green-200 transition-colors">
                                                <Phone className="fill-current" /> 78420 78791
                                            </a>
                                            <a href="tel:+917075278791" className="flex items-center gap-3 text-2xl font-black hover:text-green-200 transition-colors">
                                                <Phone className="fill-current" /> 70752 78791
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Form */}
                            <div className="p-8 md:p-12 bg-white dark:bg-gray-800">
                                {formStatus === 'success' ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
                                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center animate-bounce">
                                            <CheckCircle size={48} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Thank You!</h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                                We have received your enquiry. Our team will contact you shortly to schedule your free session.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setFormStatus('idle')}
                                            className="px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Send Another Response
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleFormSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white font-medium"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white font-medium"
                                                placeholder="+91 98765 43210"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address (Optional)</label>
                                            <input
                                                type="email"
                                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white font-medium"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message (Optional)</label>
                                            <textarea
                                                rows={3}
                                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:text-white font-medium resize-none"
                                                placeholder="I'm interested in..."
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            ></textarea>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={formStatus === 'submitting'}
                                            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-lg shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {formStatus === 'submitting' ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    Get Free Consultation <ArrowRight size={20} />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-xs text-gray-400">
                                            By submitting, you agree to our Terms & Conditions.
                                        </p>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 bg-gradient-to-br from-green-500 to-emerald-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">
                        Ready to Achieve Your Dream Score?
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join 1,200+ successful students. Register and Start your Journey today!
                    </p>

                    <div className="flex justify-center mb-8">
                        <a href="https://lyceumlms.com/product/duolingo-english-test/" target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-white text-green-600 rounded-2xl font-bold text-xl hover:scale-105 transition-all shadow-2xl inline-block">
                            Register Now
                        </a>
                    </div>

                    <div className="flex items-center justify-center gap-6 text-sm opacity-90">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} />
                            <span>T & C Applied </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sticky Mobile CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl md:hidden z-50">
                <a href="https://lyceumlms.com/product/duolingo-english-test/" target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-lg hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 flex items-center justify-center">
                    Enroll Now - Limited Seats
                </a>
            </div>
        </div >
    );
};

export default DuolingoPage;
