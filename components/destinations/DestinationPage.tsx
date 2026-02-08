
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

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            {/* Navigation Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-lyceum-blue transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-semibold">Back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <img src={`https://flagcdn.com/w40/${data.flag}.png`} alt={data.country} className="w-8 h-5 object-cover rounded-sm shadow-sm" />
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">{data.country}</h1>
                    </div>
                    <div className="w-20"></div> {/* Spacer for alignment */}
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative h-[60vh] min-h-[400px] overflow-hidden flex items-center">
                <div className="absolute inset-0">
                    <img
                        src={data.image}
                        alt={data.country}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/60 to-transparent opacity-90"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl animate-fade-in-up">
                        <span className="inline-block py-1 px-3 rounded-full bg-lyceum-blue/20 text-blue-300 text-sm font-bold mb-6 backdrop-blur-sm border border-blue-400/20">
                            Study in {data.country}
                        </span>
                        <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter">
                            {data.heroText}
                        </h2>
                        <p className="text-xl text-gray-200 leading-relaxed font-medium">
                            {data.overview}
                        </p>
                    </div>
                </div>
            </section>

            {/* Statistics Ribbon */}
            <div className="relative z-20 -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {data.statistics.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-lyceum-blue rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                <stat.icon size={28} />
                            </div>
                            <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
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

                            {/* Why Study Here */}
                            <div className="animate-fade-in">
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
                                    <span className="w-1.5 h-10 bg-lyceum-blue rounded-full"></span>
                                    Why Study in {data.country}?
                                </h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {data.whyStudy}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider text-sm">Key Highlights</h4>
                                        <ul className="space-y-4">
                                            {data.highlights.map((item, i) => (
                                                <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300">
                                                    <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span className="font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Top Universities & Popular Courses */}
                            <div className="grid md:grid-cols-2 gap-12">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                                        <Award className="text-lyceum-blue" size={24} />
                                        Top Universities
                                    </h3>
                                    <div className="space-y-3">
                                        {data.topUniversities.map((uni, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-lyceum-blue/30 transition-colors">
                                                <span className="font-bold text-gray-700 dark:text-gray-200">{uni}</span>
                                                <ChevronRight size={16} className="text-gray-300" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                                        <TrendingUp className="text-lyceum-blue" size={24} />
                                        Popular Courses
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {data.popularCourses.map((course, i) => (
                                            <span key={i} className="px-5 py-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full font-bold border border-gray-100 dark:border-gray-700 text-sm">
                                                {course}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Cost of Living */}
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-4">
                                    <span className="w-1.5 h-10 bg-lyceum-blue rounded-full"></span>
                                    Cost of Living
                                </h3>
                                <div className="overflow-hidden rounded-[2rem] border border-gray-100 dark:border-gray-700">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Category</th>
                                                <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest text-right">Avg. Range</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {data.costOfLiving.map((item, i) => (
                                                <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-8 py-5 font-bold text-gray-700 dark:text-gray-200">{item.category}</td>
                                                    <td className="px-8 py-5 text-right font-black text-lyceum-blue">{item.range}</td>
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
                                        Visa Pathway
                                    </h4>
                                    <div className="space-y-4">
                                        {data.visaRequirements.map((req, i) => (
                                            <div key={i} className="flex gap-3 group">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-yellow-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    {i + 1}
                                                </div>
                                                <span className="text-gray-300 text-sm font-medium leading-relaxed">{req}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-white/10 text-xs text-gray-500 italic">
                                        * Requirements may vary based on university and course type.
                                    </div>
                                </div>

                                {/* CTA Box */}
                                <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/30">
                                    <h4 className="text-2xl font-black mb-4">Start Your Application</h4>
                                    <p className="text-blue-100 mb-8 opacity-80 text-sm">
                                        Our expert counselors have helped thousands of students secure admissions in {data.country}. Get your free evaluation today!
                                    </p>
                                    <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all mb-4">
                                        Book Free Consultation
                                    </button>
                                    <button className="w-full py-4 border border-white/30 text-white rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                        Download Guide <FileText size={18} />
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>

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
