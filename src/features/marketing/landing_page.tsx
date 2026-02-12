import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Moon,
    Menu,
    X,
    Download
} from 'lucide-react';
import { DESTINATIONS_DATA } from '@/features/university/destinations/destinations_data';
import { trackVisit } from '@/utils/visitor_tracking';
import { API_BASE_URL } from '@/utils/api';

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
    const navigate = useNavigate();
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
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Track visit on mount
        trackVisit(window.location.pathname);

        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);



    // Overhaul Data Constants
    const statistics = [
        { label: 'Success Stories', value: 5000, suffix: '+', icon: <Users size={24} />, color: 'text-blue-600' },
        { label: 'Visa Success Rate', value: 98, suffix: '%', icon: <TrendingUp size={24} />, color: 'text-emerald-600' },
        { label: 'Global Partners', value: 500, suffix: '+', icon: <Globe size={24} />, color: 'text-purple-600' },
        { label: 'Scholarships Secured', value: 2, prefix: '$', suffix: 'M+', icon: <Award size={24} />, color: 'text-orange-600' },
    ];

    const testimonials = [
        {
            name: "Fatima Al-Sayed",
            university: "University of Toronto, Canada",
            text: "Lyceum Academy made my dream come true. Their guidance on SOP and visa was impeccable. I couldn't have done it without them! The counselors were available 24/7.",
            rating: 5,
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
        },
        {
            name: "Rajesh Kumar",
            university: "Imperial College London, UK",
            text: "The IELTS training I received here was top-notch. I improved from 6.0 to 8.0 in just a month. Highly recommended for anyone struggling with language tests!",
            rating: 5,
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
        },
        {
            name: "Emily Chen",
            university: "University of Melbourne, Australia",
            text: "From university selection to pre-departure briefing, every step was handled professionally. They really care about the students and it shows in their work.",
            rating: 5,
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
        },
        {
            name: "Michael Ross",
            university: "TUM, Germany",
            text: "Navigating the German education system was tough, but Lyceum simplified everything. I'm now pursuing my Masters in Engineering tuition-free!",
            rating: 5,
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
        },
        {
            name: "Aisha Khan",
            university: "New York University, USA",
            text: "The scholarship guidance was a game changer. I secured a 50% waiver on my tuition fees thanks to their strategic advice on my application essays.",
            rating: 5,
            image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
        },
        {
            name: "David Miller",
            university: "University of British Columbia, Canada",
            text: "Excellent service! The visa mock interviews gave me so much confidence. I got my study permit approved in record time.",
            rating: 5,
            image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop"
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

    const partners = ["Harvard", "Oxford", "McGill", "Monash", "TUM", "UCLA", "NTU", "Kings College", "Lewis University", "NYIT", "MVNU", "Dallas Baptist University", "New haven University",];


    const handleEnquirySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/public/enquiries`, {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setEnquiry({ ...enquiry, [e.target.name]: e.target.value });
    };

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setNewsletterStatus('submitting');
        // Simulate API call
        setTimeout(() => {
            setNewsletterStatus('success');
            setNewsletterEmail('');
            setTimeout(() => setNewsletterStatus('idle'), 3000);
        }, 1500);
    };

    const handleDarkToggle = () => {
        if (setDarkMode) setDarkMode();
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 py-2' : 'bg-transparent py-4 md:py-6'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-3 group relative z-50">
                            <div className="w-10 h-10 group-hover:rotate-12 transition-transform duration-300">
                                <img src="/academy logo.png" alt="Lyceum Academy Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                                Lyceum<span className="text-lyceum-blue">Academy</span>
                            </span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600 dark:text-slate-400">
                            {['Destinations', 'Services', 'Test Prep', 'About'].map(item => (
                                <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="hover:text-lyceum-blue dark:hover:text-blue-400 transition-colors">{item}</a>
                            ))}
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <button onClick={handleDarkToggle} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button onClick={onLogin} className="text-sm font-semibold hover:text-lyceum-blue transition">Log in</button>
                            <button onClick={onRegister} className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:shadow-lg hover:scale-105 transition-all duration-300">
                                Get Started
                            </button>
                        </div>

                        {/* Mobile Toggle Button */}
                        <div className="md:hidden flex items-center gap-4 z-50">
                            <button onClick={handleDarkToggle} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`fixed inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl z-40 transition-all duration-300 md:hidden flex flex-col justify-center items-center ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                    <div className="flex flex-col items-center gap-8 text-lg font-medium">
                        {['Destinations', 'Services', 'Test Prep', 'About'].map(item => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-gray-900 dark:text-white hover:text-lyceum-blue dark:hover:text-lyceum-blue text-2xl font-bold transition-colors"
                            >
                                {item}
                            </a>
                        ))}
                        <div className="w-16 h-1 bg-gray-100 dark:bg-gray-800 rounded-full my-4"></div>
                        <button
                            onClick={() => {
                                onLogin();
                                setIsMobileMenuOpen(false);
                            }}
                            className="text-gray-600 dark:text-gray-300 hover:text-lyceum-blue font-semibold"
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => {
                                onRegister();
                                setIsMobileMenuOpen(false);
                            }}
                            className="px-8 py-3 bg-lyceum-blue text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
                        >
                            Get Started
                        </button>
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

                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        {Object.values(DESTINATIONS_DATA).slice(0, 6).map((dest, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(`/destinations/${dest.id}`)}
                                className="group relative overflow-hidden rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-500 h-[400px] cursor-pointer"
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <img src={dest.image} alt={dest.country} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                </div>

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

                                {/* Content */}
                                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden shadow-lg bg-black/20 backdrop-blur-sm">
                                            <img src={`https://flagcdn.com/w80/${dest.flag}.png`} alt={`${dest.country} flag`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                            <ArrowRight className="text-white" size={20} />
                                        </div>
                                    </div>

                                    <div className="transform transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                                        <h3 className="text-3xl font-black text-white mb-2">{dest.country}</h3>
                                        <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-500">
                                            <p className="text-gray-200 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                                {((dest as any).study?.overview || (dest as any).overview)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <button
                            onClick={() => navigate('/destinations')}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-lyceum-blue text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all group"
                        >
                            Explore All Destinations
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Test Prep Section */}
            <section id="tests" className="py-24 bg-gray-50 dark:bg-gray-800/50 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-lyceum-blue font-bold tracking-widest text-xs uppercase mb-2 block animate-fade-in">Global Certification</span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
                            Ace Your Language Tests
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Unlock global opportunities with our comprehensive training programs. We provide the strategies, practice, and feedback you need to achieve your target score.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                        {/* Course Grid */}
                        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">
                            {[
                                { name: 'IELTS', full: 'International English Language Testing System', color: 'text-red-500', bg: 'bg-white dark:bg-gray-800', border: 'hover:border-red-500/30', logo: '/ielts logo.png' },
                                { name: 'PTE', full: 'Pearson Test of English Academic', color: 'text-blue-500', bg: 'bg-white dark:bg-gray-800', border: 'hover:border-blue-500/30', logo: '/pte logo.png' },
                                { name: 'TOEFL', full: 'Test of English as a Foreign Language', color: 'text-purple-600', bg: 'bg-white dark:bg-gray-800', border: 'hover:border-purple-500/30', logo: '/tofel logo.png' },
                                { name: 'Duolingo', full: 'Duolingo English Test', color: 'text-green-500', bg: 'bg-white dark:bg-gray-800', border: 'hover:border-green-500/30', logo: '/duolingo logo.png' }
                            ].map((test) => (
                                <button
                                    key={test.name}
                                    onClick={() => navigate(`/${test.name.toLowerCase()}`)}
                                    className={`group flex flex-col items-start text-left p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${test.border} relative overflow-hidden`}
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 ${test.bg} rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110 opacity-50`}></div>

                                    <div className={`h-16 w-28 bg-white dark:bg-gray-700 p-3 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm relative z-10 border border-gray-100 dark:border-gray-600`}>
                                        <img src={test.logo} alt={test.name} className="w-full h-full object-contain" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-lyceum-blue transition-colors relative z-10">
                                        {test.name}
                                    </h3>

                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 relative z-10">
                                        {test.full}
                                    </p>

                                    <div className="mt-auto flex items-center text-sm font-bold text-gray-900 dark:text-white group-hover:gap-2 transition-all relative z-10">
                                        View Details <ArrowRight size={16} className="ml-2 text-lyceum-blue" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Success Card (Right Side Sticky) */}
                        <div className="lg:col-span-1 border border-gray-100 dark:border-gray-700 p-1 rounded-[2.5rem] bg-white dark:bg-gray-800 shadow-2xl relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl rounded-[2.5rem] -z-10"></div>
                            <div className="bg-gray-900 dark:bg-black rounded-[2.3rem] p-8 text-center text-white relative overflow-hidden">
                                {/* Decor */}
                                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                                    <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full blur-2xl"></div>
                                    <div className="absolute bottom-10 right-10 w-20 h-20 bg-purple-500 rounded-full blur-2xl"></div>
                                </div>

                                <div className="relative z-10">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20 mb-6 rotate-3 hover:rotate-12 transition-transform duration-500">
                                        <Award size={40} className="text-white" />
                                    </div>

                                    <h3 className="text-2xl font-black mb-2">Guaranteed Success</h3>
                                    <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                                        Join over 5000+ students who have successfully achieved their target scores with our proven methodology.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5 hover:bg-white/20 transition-colors">
                                            <div className="text-3xl font-black text-blue-400">98%</div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pass Rate</div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5 hover:bg-white/20 transition-colors">
                                            <div className="text-3xl font-black text-purple-400">5000+</div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Students Placed</div>
                                        </div>
                                    </div>

                                    <button onClick={onRegister} className="w-full mt-8 py-4 bg-white text-gray-900 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg">
                                        Start Your Journey
                                    </button>
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
                        <a href="#contact" className="hidden md:flex items-center gap-2 text-lyceum-blue font-bold hover:gap-4 transition-all group">
                            View all services <ArrowRight size={20} className="group-hover:text-blue-600" />
                        </a>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { title: 'Counseling', icon: <Users size={32} />, desc: 'Expert career guidance to choose the right course and university.', color: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-500/20' },
                            { title: 'Admission', icon: <FileText size={32} />, desc: 'Assistance with application documentation and submission.', color: 'from-purple-600 to-pink-500', shadow: 'shadow-purple-500/20' },
                            { title: 'Visa', icon: <Plane size={32} />, desc: 'Complete support for visa application and mock interviews.', color: 'from-indigo-600 to-blue-600', shadow: 'shadow-indigo-500/20' },
                            { title: 'Pre-Departure', icon: <MapPin size={32} />, desc: 'Briefings on accommodation, lifestyle, and travel.', color: 'from-rose-500 to-orange-400', shadow: 'shadow-rose-500/20' }
                        ].map((srv, i) => (
                            <div key={i} className="group relative p-8 rounded-[2rem] bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 hover:border-transparent transition-all duration-300 hover:-translate-y-2">
                                {/* Hover Gradient Border Effect Removed */}

                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${srv.color} text-white flex items-center justify-center mb-8 shadow-lg ${srv.shadow} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                    {srv.icon}
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 dark:group-hover:from-white dark:group-hover:to-gray-300 transition-colors">
                                    {srv.title}
                                </h3>

                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                    {srv.desc}
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

            {/* 5. Wall of Love (Testimonials) */}
            <section className="py-32 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 text-center mb-16">
                    <span className="text-lyceum-blue font-bold tracking-widest text-xs uppercase mb-2 block">Community</span>
                    <h2 className="text-4xl font-black mb-4">Loved by Students</h2>
                </div>

                <div className="flex flex-col gap-6 overflow-hidden max-h-[600px] relative">
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-50 dark:from-slate-900 to-transparent z-10"></div>
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent z-10"></div>

                    {/* Infinite Scroll Container */}
                    <div className="w-full inline-flex flex-nowrap overflow-hidden">
                        <div className="flex gap-6 animate-scroll hover:pause items-center">
                            {/* Duplicate list for seamless loop */}
                            {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                                <div key={i} className="min-w-[350px] max-w-[350px] p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-105 duration-300">
                                    <div className="flex gap-1 text-yellow-500 mb-4">
                                        {[...Array(5)].map((_, idx) => <Star key={idx} size={16} fill="currentColor" />)}
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed line-clamp-4">"{t.text}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                            <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</div>
                                            <div className="text-xs text-slate-400">{t.university}</div>
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address (Optional)</label>
                                        <input
                                            name="email"
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

            {/* Android App Download Section */}
            <section className="py-20 bg-gradient-to-br from-lyceum-blue/5 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Side - Mobile Mockup */}
                        <div className="relative flex justify-center lg:justify-end">
                            <div className="relative group">
                                {/* Phone Frame - Android Style */}
                                <div className="relative w-[280px] h-[580px] bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                                    {/* Screen */}
                                    <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
                                        {/* Punch-hole Camera (Android style - centered at top) */}
                                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rounded-full z-10 shadow-lg"></div>

                                        {/* App Screenshot Placeholder */}
                                        <div className="w-full h-full bg-gradient-to-br from-lyceum-blue to-purple-600 flex flex-col items-center justify-center p-6 pt-10">
                                            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg p-2">
                                                <img src="/academy logo.png" alt="Lyceum Academy" className="w-full h-full object-contain" />
                                            </div>
                                            <h3 className="text-white font-bold text-xl mb-2">Lyceum Academy</h3>
                                            <p className="text-white/90 text-sm text-center">Creative Learning</p>

                                            {/* Mock UI Elements */}
                                            <div className="mt-8 w-full space-y-3">
                                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-pulse"></div>
                                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                            </div>
                                        </div>

                                        {/* Samsung-style Navigation Buttons (appear on hover) */}
                                        <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center gap-16 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 pb-2">
                                            {/* Recent Apps Button (left) - Three vertical lines */}
                                            <div className="flex gap-1 items-end">
                                                <div className="w-0.5 h-4 bg-white rounded-full"></div>
                                                <div className="w-0.5 h-4 bg-white rounded-full"></div>
                                                <div className="w-0.5 h-4 bg-white rounded-full"></div>
                                            </div>
                                            {/* Home Button (center) - Rounded rectangle/pill */}
                                            <div className="w-5 h-4 border-2 border-white rounded-full"></div>
                                            {/* Back Button (right) - Left arrow */}
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
                                                <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Power Button - Android style (right side) */}
                                    <div className="absolute right-0 top-28 w-1 h-16 bg-gray-700 rounded-l"></div>
                                    {/* Volume Buttons - Android style (left side) */}
                                    <div className="absolute left-0 top-24 w-1 h-10 bg-gray-700 rounded-r"></div>
                                    <div className="absolute left-0 top-36 w-1 h-10 bg-gray-700 rounded-r"></div>
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute -top-4 -right-4 w-20 h-20 bg-lyceum-blue/10 rounded-full blur-2xl animate-pulse"></div>
                                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                            </div>
                        </div>

                        {/* Right Side - Content */}
                        <div className="space-y-6">
                            <div className="inline-block px-4 py-2 bg-lyceum-blue/10 text-lyceum-blue rounded-full text-sm font-semibold mb-2">
                                📱 Mobile Experience
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                                Download Our Android App
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                While our website is fully optimized for the best experience across all devices,
                                you can also download our Android app for quick access on the go.
                            </p>

                            {/* Features List */}
                            <div className="space-y-4 py-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                                        <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Optimized Web Experience</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Our website provides the best, most comprehensive experience</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Smartphone size={16} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Mobile App Available</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Download our Android app for convenient mobile access</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Zap size={16} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">Quick Access</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Access your dashboard and documents anytime, anywhere</p>
                                    </div>
                                </div>
                            </div>

                            {/* Download Button */}
                            <div className="pt-4">
                                <a
                                    href="https://drive.google.com/file/d/1LoBSulgsER1_K4QxIkpy_9N8B_dRdc1d/view?usp=drivesdk"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-lyceum-blue to-purple-600 text-white font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
                                >
                                    <Download size={24} className="group-hover:animate-bounce" />
                                    <span>Download Android App</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </a>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                                    Available for Android devices • Free Download
                                </p>
                            </div>
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
                                <img src="/academy logo.png" alt="Lyceum Academy" className="w-10 h-10 object-contain" />
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
                                <li><button onClick={() => navigate('/terms')} className="hover:text-lyceum-blue transition-colors text-left">Terms & Conditions</button></li>
                                <li><button onClick={() => navigate('/privacy')} className="hover:text-lyceum-blue transition-colors text-left">Privacy Policy</button></li>
                                <li><a href="#contact" className="hover:text-lyceum-blue transition-colors">Enquiry Form</a></li>
                                <li><button onClick={onLogin} className="hover:text-lyceum-blue transition-colors text-left">Student Login</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-6">Contact Us</h4>
                            <ul className="space-y-4 text-gray-400 text-sm">
                                <li className="flex items-center gap-3">
                                    <Send size={16} className="text-lyceum-blue" />
                                    <span>omar@lyceumacad.com</span>
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
                            <button onClick={() => navigate('/privacy')} className="hover:text-gray-300">Privacy</button>
                            <button onClick={() => navigate('/terms')} className="hover:text-gray-300">Terms</button>
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
