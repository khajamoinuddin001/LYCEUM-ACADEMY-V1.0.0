import React, { useState, useEffect, useRef } from 'react';
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
    Users,
    Star,
    ChevronDown,
    ChevronUp,
    Play,
    Shield,
    Smartphone,
    TrendingUp,
    Heart,
    Zap,
    MessageSquare,
    HelpCircle,
    ExternalLink,
    Search,
    Sun,
    Moon
} from 'lucide-react';

interface LandingPageProps {
    onLogin: () => void;
    onRegister: () => void;
    onTerms: () => void;
    onPrivacy: () => void;
    onDocuments: () => void;
    darkMode?: boolean;
    setDarkMode?: () => void;
}

const AnimatedCounter: React.FC<{ target: number; suffix?: string; prefix?: string }> = ({ target, suffix = '', prefix = '' }) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const counterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasAnimated) {
                setHasAnimated(true);
                let start = 0;
                const duration = 2000;
                const increment = target / (duration / 16); // 60fps

                const timer = setInterval(() => {
                    start += increment;
                    if (start >= target) {
                        setCount(target);
                        clearInterval(timer);
                    } else {
                        setCount(Math.floor(start));
                    }
                }, 16);
            }
        }, { threshold: 0.1 });

        if (counterRef.current) observer.observe(counterRef.current);
        return () => observer.disconnect();
    }, [target, hasAnimated]);

    return (
        <div ref={counterRef} className="tabular-nums">
            {prefix}{count.toLocaleString()}{suffix}
        </div>
    );
};

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister, onTerms, onPrivacy, onDocuments, darkMode, setDarkMode }) => {
    const [enquiry, setEnquiry] = useState({
        name: '',
        email: '',
        phone: '',
        country: '',
        interest: 'Study Abroad',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [logoError, setLogoError] = useState(false);

    // Overhaul Data Constants
    const statistics = [
        { label: 'Success Stories', value: 5000, suffix: '+', icon: <Users size={24} />, color: 'text-blue-600' },
        { label: 'Visa Success Rate', value: 98, suffix: '%', icon: <TrendingUp size={24} />, color: 'text-emerald-600' },
        { label: 'Global Partners', value: 500, suffix: '+', icon: <Globe size={24} />, color: 'text-purple-600' },
        { label: 'Scholarships Secured', value: 2, prefix: '$', suffix: 'M+', icon: <Award size={24} />, color: 'text-orange-600' },
    ];

    const testimonials = [
        {
            name: "Sarah Ahmed",
            university: "University of Toronto, Canada",
            text: "Lyceum Academy made my dream come true. Their guidance on SOP and visa was impeccable. I couldn't have done it without them!",
            rating: 5,
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
        },
        {
            name: "Rahul Verma",
            university: "Imperial College London, UK",
            text: "The IELTS training I received here was top-notch. I improved from 6.0 to 8.0 in just a month. Highly recommended for test prep!",
            rating: 5,
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
        },
        {
            name: "John Smith",
            university: "Arizona State University, USA",
            text: "From university selection to pre-departure briefing, every step was handled professionally. They really care about the students.",
            rating: 5,
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
        }
    ];

    const faqs = [
        {
            q: "How do I start my study abroad journey with Lyceum Academy?",
            a: "The first step is to book a free consultation with our experts. We'll evaluate your profile and help you choose the right country and university."
        },
        {
            q: "Which countries do you provide assistance for?",
            a: "We specialize in USA, UK, Canada, Australia, Europe (Germany, France, Ireland), and the Gulf region."
        },
        {
            q: "Do you provide help with scholarships?",
            a: "Yes! We guide students on finding and applying for university scholarships, government aids, and private grants."
        },
        {
            q: "What is the success rate for visa applications?",
            a: "We take pride in our 98% visa success rate, thanks to our rigorous documentation checks and mock interview sessions."
        }
    ];

    const partners = ["Harvard", "Oxford", "McGill", "Monash", "TUM", "UCLA", "NTU", "Kings College"];

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

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setNewsletterStatus('submitting');
        // Simulate API call
        setTimeout(() => {
            setNewsletterStatus('success');
            setNewsletterEmail('');
            setTimeout(() => setNewsletterStatus('idle'), 5000);
        }, 1500);
    };

    const handleDarkToggle = () => {
        if (!setDarkMode) return;
        setDarkMode();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setEnquiry({ ...enquiry, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 font-sans transition-colors duration-500 overflow-x-hidden">
            {/* Transparent Navbar */}
            <nav className="fixed w-full z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="p-1 bg-white dark:bg-gray-800 rounded-lg group hover:rotate-6 transition-transform h-12 w-12 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                                <img
                                    src="/logo.png"
                                    alt="Lyceum Academy Logo"
                                    className="w-full h-full object-contain p-1"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-lyceum-blue to-blue-600">
                                    Lyceum Academy
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] -mt-1">Education Experts</span>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#destinations" className="text-gray-600 dark:text-gray-300 hover:text-lyceum-blue font-bold transition-colors">Destinations</a>
                            <a href="#test-prep" className="text-gray-600 dark:text-gray-300 hover:text-lyceum-blue font-bold transition-colors">Test Prep</a>
                            <a href="#services" className="text-gray-600 dark:text-gray-300 hover:text-lyceum-blue font-bold transition-colors">Services</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleDarkToggle}
                                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-lyceum-blue hover:text-white transition-all shadow-sm"
                                title="Toggle Dark Mode"
                            >
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button onClick={onLogin} className="text-gray-700 dark:text-gray-200 hover:text-lyceum-blue font-bold transition-colors">Log In</button>
                            <button onClick={onRegister} className="px-6 py-3 bg-lyceum-blue text-white rounded-2xl hover:bg-lyceum-blue-dark transition-all transform hover:scale-105 font-black shadow-xl shadow-blue-500/30">
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-500">
                {/* Floating Elements for Premium Feel */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-40 left-10 animate-floating flex flex-col items-center gap-2 grayscale opacity-20 dark:opacity-10">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-3xl shadow-xl"><BookOpen size={40} className="text-lyceum-blue" /></div>
                    </div>
                    <div className="absolute bottom-40 right-10 animate-floating-delayed flex flex-col items-center gap-2 grayscale opacity-20 dark:opacity-10">
                        <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-3xl shadow-xl"><Globe size={40} className="text-purple-600" /></div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-[120px] -z-10"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="flex justify-center mb-8">
                        <span className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-blue-50/80 dark:bg-blue-900/30 text-lyceum-blue dark:text-blue-300 text-sm font-black border border-blue-100 dark:border-blue-800 animate-fade-in-up backdrop-blur-sm">
                            <Star size={14} className="fill-current" />
                            Trusted by 5000+ Students Globally
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-9xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter leading-none animate-fade-in-up delay-100">
                        Design Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-lyceum-blue via-blue-600 to-purple-600 drop-shadow-sm">Global Future</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-14 animate-fade-in-up delay-200 leading-relaxed font-medium">
                        Expert guidance for international education. We turn your global aspirations into reality with personalized counseling and end-to-end support.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up delay-300">
                        <a href="#contact" className="px-12 py-6 bg-lyceum-blue text-white rounded-[2rem] hover:bg-lyceum-blue-dark transition-all transform hover:scale-105 active:scale-95 font-black text-xl shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3 group">
                            Book Free Consultation
                            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                        <button onClick={onLogin} className="px-12 py-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-[2rem] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-black text-xl flex items-center justify-center gap-3 shadow-lg">
                            <Play size={22} className="fill-current text-lyceum-blue" />
                            Watch Stories
                        </button>
                    </div>

                    {/* Stats Ribbon with Animated Counters */}
                    <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-8 pt-16 border-t border-gray-100 dark:border-gray-800 animate-fade-in-up delay-400">
                        {statistics.map((stat, i) => (
                            <div key={i} className="text-center group p-6 rounded-[2.5rem] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className={`inline-flex p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ${stat.color} shadow-sm`}>
                                    {stat.icon}
                                </div>
                                <div className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter flex justify-center">
                                    <AnimatedCounter target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                                </div>
                                <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* University Partners Ticker */}
            <div className="py-12 bg-gray-50 dark:bg-gray-900/50 overflow-hidden border-y border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 text-center mb-8">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em]">Partnering with the World's Finest</p>
                </div>
                <div className="relative flex overflow-x-hidden">
                    <div className="animate-marquee whitespace-nowrap flex items-center gap-16 py-4">
                        {[...partners, ...partners].map((p, i) => (
                            <span key={i} className="text-3xl md:text-4xl font-black text-gray-300 dark:text-gray-700 hover:text-lyceum-blue transition-colors cursor-default select-none">
                                {p.toUpperCase()}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

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
            <section id="services" className="py-32 bg-white dark:bg-gray-900 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                                Comprehensive <br />
                                <span className="text-lyceum-blue">End-to-End Support</span>
                            </h2>
                            <p className="text-lg text-gray-500 dark:text-gray-400">
                                We go beyond simple applications. Our holistic approach ensures you are prepared for every aspect of your international education.
                            </p>
                        </div>
                        <a href="#contact" className="hidden md:flex items-center gap-2 text-lyceum-blue font-bold hover:gap-4 transition-all">
                            View all services <ArrowRight size={20} />
                        </a>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { title: 'Counseling', icon: <Users size={28} />, desc: 'Expert career guidance to choose the right course and university.', color: 'bg-blue-500' },
                            { title: 'Admission', icon: <FileText size={28} />, desc: 'Assistance with application documentation and submission.', color: 'bg-purple-600' },
                            { title: 'Visa', icon: <Plane size={28} />, desc: 'Complete support for visa application and mock interviews.', color: 'bg-indigo-600' },
                            { title: 'Pre-Departure', icon: <MapPin size={28} />, desc: 'Briefings on accommodation, lifestyle, and travel.', color: 'bg-rose-500' }
                        ].map((srv, i) => (
                            <div key={i} className="group p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                <div className={`w-16 h-16 ${srv.color} text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                                    {srv.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{srv.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed italic">
                                    "{srv.desc}"
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-32 bg-gray-50 dark:bg-gray-800/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">How It Works</h2>
                        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Your journey from dreaming to arriving at your destination, simplified into four clear steps.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-blue-100 via-purple-100 to-blue-100 dark:from-blue-900/50 dark:via-purple-900/50 dark:to-blue-900/50 z-0"></div>

                        {[
                            { step: '01', title: 'Consultation', desc: 'Personalized profile evaluation and goal setting.', icon: <MessageSquare size={24} /> },
                            { step: '02', title: 'Selection', desc: 'Curating the best-fit universities and programs.', icon: <Search size={24} /> },
                            { step: '03', title: 'Preparation', desc: 'Expert test prep and document perfection.', icon: <Zap size={24} /> },
                            { step: '04', title: 'Departure', desc: 'Visa success and pre-travel briefing.', icon: <Plane size={24} /> }
                        ].map((item, idx) => (
                            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                                <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-100 dark:border-gray-700 flex items-center justify-center mb-8 shadow-xl group-hover:border-lyceum-blue group-hover:scale-110 transition-all duration-500">
                                    <span className="text-2xl font-black text-lyceum-blue">{item.step}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-32 bg-white dark:bg-gray-900 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="w-full md:w-1/3">
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8 leading-tight">
                                Hear from our <br />
                                <span className="text-lyceum-blue">Global Alumni</span>
                            </h2>
                            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
                                Join thousands of students who have already embarked on their international journey with us.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div className="font-bold text-gray-900 dark:text-white">5K+ Success Stories</div>
                            </div>
                        </div>

                        <div className="w-full md:w-2/3 grid sm:grid-cols-2 gap-8">
                            {testimonials.map((t, i) => (
                                <div key={i} className={`p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-500 ${i === 1 ? 'sm:mt-8' : ''}`}>
                                    <div className="flex items-center gap-1 text-yellow-500 mb-6">
                                        {[...Array(t.rating)].map((_, idx) => <Star key={idx} size={16} className="fill-current" />)}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 mb-8 italic leading-relaxed">
                                        "{t.text}"
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                            <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">{t.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{t.university}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-32 bg-gray-50 dark:bg-gray-800/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h2>
                        <p className="text-lg text-gray-500 dark:text-gray-400">
                            Clear answers to your most common curiosities about studying abroad.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full px-8 py-6 text-left flex justify-between items-center group"
                                >
                                    <span className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-lyceum-blue transition-colors">{faq.q}</span>
                                    <div className={`p-2 rounded-xl bg-gray-50 dark:bg-gray-900 transition-all ${openFaq === idx ? 'rotate-180 bg-lyceum-blue text-white' : ''}`}>
                                        <ChevronDown size={20} />
                                    </div>
                                </button>
                                <div className={`px-8 overflow-hidden transition-all duration-500 ease-in-out ${openFaq === idx ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-gray-700 pt-6">
                                        {faq.a}
                                    </p>
                                </div>
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

            {/* Newsletter Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-800/30">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-lyceum-blue/5 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Stay Informed</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">
                                Subscribe to our newsletter for the latest updates on university intakes, scholarship opportunities, and visa policy changes.
                            </p>
                            {newsletterStatus === 'success' ? (
                                <div className="py-4 text-green-600 font-bold flex items-center justify-center gap-2 animate-fade-in">
                                    <CheckCircle size={20} />
                                    Successfully subscribed to our newsletter!
                                </div>
                            ) : (
                                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                    <input
                                        type="email"
                                        required
                                        value={newsletterEmail}
                                        onChange={(e) => setNewsletterEmail(e.target.value)}
                                        placeholder="Enter your email address"
                                        className="flex-1 px-6 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-lyceum-blue outline-none transition-all dark:text-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={newsletterStatus === 'submitting'}
                                        className="px-8 py-4 bg-lyceum-blue text-white font-bold rounded-full hover:bg-lyceum-blue-dark transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70"
                                    >
                                        {newsletterStatus === 'submitting' ? 'Subscribing...' : 'Subscribe'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-6">
                                <GraduationCap size={32} className="text-lyceum-blue" />
                                <span className="text-2xl font-bold">Lyceum Academy</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                Empowering students to achieve their global education dreams through expert guidance and comprehensive support since 2015.
                            </p>
                            <div className="flex gap-4">
                                {/* Social icons could go here */}
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-lyceum-blue transition-colors cursor-pointer">
                                    <Globe size={18} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-6">Quick Links</h4>
                            <ul className="space-y-4 text-gray-400 text-sm">
                                <li><a href="#destinations" className="hover:text-lyceum-blue transition-colors">Destinations</a></li>
                                <li><a href="#tests" className="hover:text-lyceum-blue transition-colors">Test Preparation</a></li>
                                <li><a href="#services" className="hover:text-lyceum-blue transition-colors">Our Services</a></li>
                                <li><button onClick={onDocuments} className="hover:text-lyceum-blue transition-colors text-left">Downloads & Documents</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-6">Support</h4>
                            <ul className="space-y-4 text-gray-400 text-sm">
                                <li><button onClick={onTerms} className="hover:text-lyceum-blue transition-colors text-left">Terms & Conditions</button></li>
                                <li><button onClick={onPrivacy} className="hover:text-lyceum-blue transition-colors text-left">Privacy Policy</button></li>
                                <li><a href="#contact" className="hover:text-lyceum-blue transition-colors">Enquiry Form</a></li>
                                <li><button onClick={onLogin} className="hover:text-lyceum-blue transition-colors text-left">Student Login</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-6">Contact Us</h4>
                            <ul className="space-y-4 text-gray-400 text-sm">
                                <li className="flex items-center gap-3">
                                    <Send size={16} className="text-lyceum-blue" />
                                    <span>info@lyceumacademy.com</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Users size={16} className="text-lyceum-blue" />
                                    <span>+91 78930 78791</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <MapPin size={16} className="text-lyceum-blue mt-1" />
                                    <span> 19-4-2/3/13, First Floor, Below Gladiator Gym, opposite HP Petrol Pump, Falaknuma, Hyderabad, Telangana 500053<br />India - 500001</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
                        <p>© 2026 Lyceum Academy. All rights reserved.</p>
                        <div className="flex gap-8">
                            <button onClick={onPrivacy} className="hover:text-gray-300">Privacy</button>
                            <button onClick={onTerms} className="hover:text-gray-300">Terms</button>
                            <button onClick={onDocuments} className="hover:text-gray-300">Cookies</button>
                        </div>
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes floating {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                .animate-floating {
                    animation: floating 6s ease-in-out infinite;
                }
                .animate-floating-delayed {
                    animation: floating 8s ease-in-out infinite;
                    animation-delay: 2s;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
                .animate-fade-in {
                    animation: fade-in-up 0.4s ease-out forwards;
                }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
            `}</style>
        </div>
    );
};

export default LandingPage;
