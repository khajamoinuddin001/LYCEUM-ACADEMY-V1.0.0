
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Globe, MapPin, TrendingUp, Award, Clock, GraduationCap, Plane, FileText, ChevronRight } from 'lucide-react';
import { DESTINATIONS_DATA, DestinationDetail } from './destinations_data';

interface DestinationPageProps {
    countryId?: string;
    onBack?: () => void;
}

const DestinationPage: React.FC<DestinationPageProps> = ({ onBack }) => {
    const navigate = useNavigate();
    const { countryId } = useParams();
    const [viewMode, setViewMode] = React.useState<'study' | 'visit'>('study');
    const [isAnimating, setIsAnimating] = React.useState(false);

    const data = countryId ? DESTINATIONS_DATA[countryId.toLowerCase()] : null;

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [countryId]);

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Destination Not Found</h1>
                    <button
                        onClick={() => onBack ? onBack() : navigate('/')}
                        className="text-lyceum-blue hover:underline flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={20} /> Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Safety fallback for countries not yet updated to the new structure
    const currentData = (viewMode === 'study' ? (data.study || data) : (data.visit || data.study || data)) as any;
    const currentImage = currentData.image || data.image;

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const handleToggle = (mode: 'study' | 'visit') => {
        if (mode === viewMode) return;
        setIsAnimating(true);
        setTimeout(() => {
            setViewMode(mode);
            setIsAnimating(false);
        }, 300);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            {/* Navigation Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-lyceum-blue transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-semibold">Back</span>
                    </button>

                    {/* Mode Toggle Switch */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 relative">
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-700 rounded-xl shadow-sm transition-all duration-300 ease-out ${viewMode === 'visit' ? 'left-[50%]' : 'left-1'}`}
                        ></div>
                        <button
                            onClick={() => handleToggle('study')}
                            className={`relative z-10 px-6 py-2 text-sm font-black transition-colors duration-300 flex items-center gap-2 ${viewMode === 'study' ? 'text-lyceum-blue' : 'text-gray-400'}`}
                        >
                            <GraduationCap size={16} />
                            STUDENT
                        </button>
                        <button
                            onClick={() => handleToggle('visit')}
                            className={`relative z-10 px-6 py-2 text-sm font-black transition-colors duration-300 flex items-center gap-2 ${viewMode === 'visit' ? 'text-lyceum-blue' : 'text-gray-400'}`}
                        >
                            <Plane size={16} />
                            VISIT
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <img src={`https://flagcdn.com/w40/${data.flag}.png`} alt={data.country} className="w-8 h-5 object-cover rounded-sm shadow-sm" />
                        <h1 className="hidden md:block text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">{data.country}</h1>
                    </div>
                </div>
            </header>

            <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                {/* Hero Section */}
                <section className="relative h-[65vh] min-h-[500px] overflow-hidden flex items-center">
                    <div className="absolute inset-0 transition-transform duration-1000 ease-out" key={`img-${viewMode}`}>
                        <img
                            src={currentImage}
                            alt={data.country}
                            className={`w-full h-full object-cover transition-all duration-1000 ${isAnimating ? 'scale-110 blur-sm' : 'scale-100 blur-0'}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/40 to-transparent opacity-90"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className={`max-w-2xl transition-all duration-700 ${isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`} key={`text-${viewMode}`}>
                            <span className="inline-block py-1.5 px-4 rounded-full bg-lyceum-blue/20 text-blue-300 text-sm font-black mb-8 backdrop-blur-md border border-blue-400/30 uppercase tracking-[0.2em] animate-pulse">
                                {viewMode} Visa in {data.country}
                            </span>
                            <h2 className="text-6xl md:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tighter">
                                {currentData.heroText}
                            </h2>
                            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed font-medium opacity-90">
                                {currentData.overview}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Statistics Ribbon */}
                <div className="relative z-20 -mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {currentData.statistics.map((stat: any, i: number) => (
                            <div
                                key={`${viewMode}-stat-${i}`}
                                className={`bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center group hover:-translate-y-3 transition-all duration-500 hover:shadow-lyceum-blue/10 ${isAnimating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-lyceum-blue rounded-2xl mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                    <stat.icon size={32} />
                                </div>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{stat.value}</div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Grid */}
                <section className="py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-3 gap-16">

                            {/* Left Column: Details */}
                            <div className="lg:col-span-2 space-y-20">

                                {/* Why Selection */}
                                <div className={`transition-all duration-700 ${isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`} key={`${viewMode}-why`}>
                                    <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-10 flex items-center gap-4">
                                        <span className="w-1.5 h-12 bg-lyceum-blue rounded-full"></span>
                                        Why {viewMode === 'study' ? 'Study' : 'Visit'} {data.country}?
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                                {currentData.whyContent || currentData.whyStudy}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800/80 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-inner">
                                            <h4 className="font-black text-gray-900 dark:text-white mb-8 uppercase tracking-[0.2em] text-xs">Essential Highlights</h4>
                                            <ul className="space-y-5">
                                                {currentData.highlights.map((item: string, i: number) => (
                                                    <li key={i} className="flex gap-4 text-gray-600 dark:text-gray-300 items-start group">
                                                        <div className="p-1 bg-green-500/10 rounded-full group-hover:bg-green-500/20 transition-colors">
                                                            <CheckCircle size={18} className="text-green-500" />
                                                        </div>
                                                        <span className="font-bold text-lg">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Lists */}
                                <div className={`grid md:grid-cols-2 gap-12 transition-all duration-700 delay-100 ${isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`} key={`${viewMode}-lists`}>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-10 flex items-center gap-4">
                                            <div className="p-2 bg-lyceum-blue/10 rounded-xl">
                                                <Award className="text-lyceum-blue" size={24} />
                                            </div>
                                            {currentData.mainListLabel || (viewMode === 'study' ? 'Top Universities' : 'Must-Visit Attractions')}
                                        </h3>
                                        <div className="space-y-4">
                                            {(currentData.mainList || currentData.topUniversities).map((uni: string, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-5 bg-white dark:bg-gray-800 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 hover:border-lyceum-blue/50 hover:shadow-xl hover:shadow-lyceum-blue/5 transition-all group">
                                                    <span className="font-bold text-gray-800 dark:text-gray-100">{uni}</span>
                                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-lyceum-blue group-hover:translate-x-1 transition-all" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-10 flex items-center gap-4">
                                            <div className="p-2 bg-lyceum-blue/10 rounded-xl">
                                                <TrendingUp className="text-lyceum-blue" size={24} />
                                            </div>
                                            {currentData.subListLabel || (viewMode === 'study' ? 'Popular Courses' : 'Top Activities')}
                                        </h3>
                                        <div className="flex flex-wrap gap-4">
                                            {(currentData.subList || currentData.popularCourses).map((course: string, i: number) => (
                                                <span key={i} className="px-6 py-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-black border border-gray-100 dark:border-gray-700 text-sm hover:scale-110 hover:bg-lyceum-blue hover:text-white transition-all cursor-default">
                                                    {course}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Costs */}
                                <div className={`transition-all duration-700 delay-200 ${isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`} key={`${viewMode}-costs`}>
                                    <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-10 flex items-center gap-4">
                                        <span className="w-1.5 h-12 bg-lyceum-blue rounded-full"></span>
                                        {viewMode === 'study' ? 'Estimated living expenses' : 'Typical Travel Costs'}
                                    </h3>
                                    <div className="overflow-hidden rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-2xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-gray-800">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                                                <tr>
                                                    <th className="px-10 py-6 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Category</th>
                                                    <th className="px-10 py-6 text-xs font-black text-gray-400 uppercase tracking-[0.2em] text-right">Average Range</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {(currentData.costOfLiving || currentData.costs).map((item: any, i: number) => (
                                                    <tr key={i} className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all">
                                                        <td className="px-10 py-6 font-bold text-gray-700 dark:text-gray-200 group-hover:pl-12 transition-all">{item.category}</td>
                                                        <td className="px-10 py-6 text-right font-black text-lyceum-blue group-hover:pr-12 transition-all">{item.range}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Sticky Sidebar with Visa & CTA */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-24 space-y-8">

                                    {/* Visa Requirements Box */}
                                    <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-lyceum-blue/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                        <h4 className="text-2xl font-black mb-8 flex items-center gap-3">
                                            <Plane className="text-lyceum-blue" />
                                            Visa Requirements
                                        </h4>
                                        <div className="space-y-4" key={`${viewMode}-reqs`}>
                                            {currentData.visaRequirements.map((req: string, i: number) => (
                                                <div
                                                    key={i}
                                                    className={`flex gap-4 group transition-all duration-500 ${isAnimating ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}`}
                                                    style={{ transitionDelay: `${i * 50}ms` }}
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-lyceum-blue/20 flex items-center justify-center text-xs font-black text-lyceum-blue flex-shrink-0 group-hover:scale-110 group-hover:bg-lyceum-blue group-hover:text-white transition-all">
                                                        {i + 1}
                                                    </div>
                                                    <span className="text-gray-300 text-sm font-bold leading-relaxed group-hover:text-white transition-colors">{req}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-8 pt-8 border-t border-white/10 text-xs text-gray-500 italic">
                                            * Requirements may vary based on personal profile and nationality.
                                        </div>
                                    </div>

                                    {/* CTA Box */}
                                    <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/30">
                                        <h4 className="text-2xl font-black mb-4">Start Your Journey</h4>
                                        <p className="text-blue-100 mb-8 opacity-80 text-sm">
                                            Our expert counselors have helped thousands of individuals secure {viewMode} visas for {data.country}. Get your free evaluation today!
                                        </p>
                                        <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all mb-4">
                                            Get Free Assessment
                                        </button>
                                        <button className="w-full py-4 border border-white/30 text-white rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                            Download Checklist <FileText size={18} />
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fade-in {
                    animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default DestinationPage;
