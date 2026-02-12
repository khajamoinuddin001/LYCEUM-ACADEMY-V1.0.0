
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search, MapPin, Globe, GraduationCap } from 'lucide-react';
import { DESTINATIONS_DATA } from './destinations_data';

const AllDestinationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');
    const destinations = Object.values(DESTINATIONS_DATA);

    const filteredDestinations = destinations.filter(dest =>
        dest.country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-lyceum-blue transition-colors group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold">Home</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <Globe className="text-lyceum-blue" size={24} />
                        <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                            Explore <span className="text-lyceum-blue">Destinations</span>
                        </h1>
                    </div>

                    <div className="hidden md:flex items-center bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700">
                        <Search size={18} className="text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search country..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-gray-600 dark:text-gray-300 w-40"
                        />
                    </div>
                </div>
            </header>

            {/* Hero Banner */}
            <div className="bg-blue-600 dark:bg-blue-900 py-20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -ml-20 -mt-20"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -mr-20 -mb-20"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        Your Global Journey <br /> <span className="text-blue-200">Starts Here</span>
                    </h2>
                    <p className="text-lg text-blue-100 max-w-2xl mx-auto font-medium opacity-90">
                        Discover world-class education opportunities across {destinations.length} countries. Your dream university is just a click away.
                    </p>
                </div>
            </div>

            {/* Destinations Grid */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredDestinations.map((dest) => (
                            <div
                                key={dest.id}
                                onClick={() => navigate(`/destinations/${dest.id}`)}
                                className="group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer h-[450px]"
                            >
                                {/* Image Wrapper */}
                                <div className="absolute inset-0">
                                    <img
                                        src={dest.image}
                                        alt={dest.country}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="w-14 h-14 rounded-full border-2 border-white/40 overflow-hidden shadow-2xl bg-black/20 backdrop-blur-md">
                                            <img
                                                src={`https://flagcdn.com/w80/${dest.flag}.png`}
                                                alt={dest.country}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-xl p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 border border-white/20">
                                            <ArrowRight className="text-white" size={24} />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-4xl font-black text-white mb-3 tracking-tighter">{dest.country}</h3>
                                        <p className="text-gray-200 text-sm font-medium leading-relaxed mb-6 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 line-clamp-2">
                                            {((dest as any).study?.overview || (dest as any).overview)}
                                        </p>
                                        <div className="flex gap-4 opacity-80">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-widest">
                                                <GraduationCap size={14} className="text-lyceum-blue" />
                                                Ranked
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-widest">
                                                <MapPin size={14} className="text-lyceum-blue" />
                                                Global
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredDestinations.length === 0 && (
                        <div className="text-center py-20">
                            <Globe size={64} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">No destinations found</h3>
                            <p className="text-gray-500">Try searching for a different country.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gray-50 dark:bg-gray-800/50 py-24 border-t border-gray-100 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Can't decide where to go?</h3>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-10">
                        Our expert counselors are here to help you choose the best destination based on your profile, budget, and career goals.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/#contact')}
                            className="px-10 py-5 bg-lyceum-blue text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
                        >
                            Talk to an Expert
                        </button>
                        <button className="px-10 py-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl font-black shadow-lg hover:bg-gray-50 transition-all">
                            Download Brochure
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AllDestinationsPage;
