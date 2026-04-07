import React, { useState, useEffect, useRef } from 'react';
import type { Visitor } from '@/types';
import * as api from '@/utils/api';
import { Users, Clock, Filter } from '@/components/common/icons';


const FLASH_DURATION_MS = 10000; // Flash for 10 seconds (reduced from 15)
const DISPLAY_DURATION_MS = 30000; // Keep on list for 30 seconds (reduced from 60)

const VisitorDisplay: React.FC = () => {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [lastCalledVisitor, setLastCalledVisitor] = useState<Visitor | null>(null);
    const [flashing, setFlashing] = useState(false);
    const [selectedDept, setSelectedDept] = useState('All');
    const [time, setTime] = useState(new Date());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio('/sounds/bell.mp3');
    }, []);

    useEffect(() => {
        const intervalId = setInterval(fetchVisitors, 5000); // Poll every 5s for updates
        fetchVisitors(); // Initial fetch

        const timeInterval = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => {
            clearInterval(intervalId);
            clearInterval(timeInterval);
        };
    }, [selectedDept]);

    const fetchVisitors = async () => {
        try {
            const allVisitors = await api.getVisitors();

            console.log('[Visitor Display] Fetched visitors:', allVisitors.length);
            const calledVisitors = allVisitors.filter(v => v.calledAt);
            console.log('[Visitor Display] Visitors with calledAt:', calledVisitors.map(v => ({
                name: v.name,
                calledAt: v.calledAt,
                timeSince: Date.now() - new Date(v.calledAt).getTime(),
                withinDuration: (Date.now() - new Date(v.calledAt).getTime()) < FLASH_DURATION_MS
            })));

            // Filter Logic
            const filtered = allVisitors.filter(v => {
                const targetDept = getWaitingFor(v);

                // Department Filter
                if (selectedDept !== 'All' && targetDept !== selectedDept) return false;

                // Show checked-in visitors OR visitors called within last minute
                if (v.status === 'Checked-in' || (v.status as any) === 'Scheduled') {
                    return true; // Show all checked-in/scheduled visitors
                }

                // Also show visitors who were called within the last minute (even if checked out)
                if (v.calledAt) {
                    const calledTime = new Date(v.calledAt).getTime();
                    const timeSinceCalled = Date.now() - calledTime;
                    const withinDisplayDuration = timeSinceCalled < DISPLAY_DURATION_MS;
                    console.log(`[Visitor Display] ${v.name} called ${timeSinceCalled}ms ago, still showing: ${withinDisplayDuration}`);
                    return withinDisplayDuration;
                }

                return false;
            }).sort((a, b) => {
                // Sort by check-in time, but push recently called visitors to the very top
                const aIsCalled = a.calledAt && (Date.now() - new Date(a.calledAt).getTime() < DISPLAY_DURATION_MS);
                const bIsCalled = b.calledAt && (Date.now() - new Date(b.calledAt).getTime() < DISPLAY_DURATION_MS);
                if (aIsCalled && !bIsCalled) return -1;
                if (bIsCalled && !aIsCalled) return 1;
                return new Date(a.checkIn || '').getTime() - new Date(b.checkIn || '').getTime();
            });

            // Limit to 6
            setVisitors(filtered.slice(0, 6));

            checkForAlerts(allVisitors);

        } catch (error) {
            console.error("Failed to fetch visitors:", error);
        }
    };

    const getWaitingFor = (visitor: Visitor) => {
        // PRIORITIZE The Person (Staff) Name
        if (visitor.staffName) {
            return visitor.staffName;
        }
        // Fallback to Host Name
        if ((visitor as any).host_name) {
            return (visitor as any).host_name;
        }
        // Then Department as fallback
        if (visitor.visitSegments && visitor.visitSegments.length > 0) {
            return visitor.visitSegments[visitor.visitSegments.length - 1].department;
        }
        return visitor.host;
    };

    const checkForAlerts = (currentVisitors: Visitor[]) => {
        // Check for ANY visitor called in the last few seconds globally (or for this dept)
        const justCalled = currentVisitors.find(v => {
            if (!v.calledAt) return false;  // Check for calledAt timestamp instead of status

            // If viewing specific dept, only alert for that dept
            if (selectedDept !== 'All' && getWaitingFor(v) !== selectedDept) return false;

            const calledTime = new Date(v.calledAt).getTime();
            const timeSinceCalled = Date.now() - calledTime;
            console.log(`[Alert Check] ${v.name}: ${timeSinceCalled}ms since called`);
            return timeSinceCalled < FLASH_DURATION_MS;
        });

        if (justCalled) {
            if (!lastCalledVisitor || justCalled.id !== lastCalledVisitor.id || justCalled.calledAt !== lastCalledVisitor.calledAt) {
                console.log('[Alert Check] Triggering alert for:', justCalled.name, 'New calledAt:', justCalled.calledAt);
                triggerAlert(justCalled);
                setLastCalledVisitor({ ...justCalled });
            }
        }
    };

    const triggerAlert = (visitor: Visitor) => {
        console.log('[Alert] Triggering alert for:', visitor.name);
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play failed", e));
        }
        setFlashing(true);
        setTimeout(() => {
            console.log('[Alert] Stopping flash');
            setFlashing(false);
        }, FLASH_DURATION_MS);
    };

    const getWaitTime = (checkInTime?: string) => {
        if (!checkInTime) return '-';
        const diff = Date.now() - new Date(checkInTime).getTime();
        const mins = Math.floor(diff / 60000);
        return `${mins} min${mins !== 1 ? 's' : ''}`;
    };

    return (
        <div className={`min-h-screen ${flashing ? 'bg-red-600 animate-pulse' : 'bg-gray-900'} text-white transition-colors duration-500`}>
            {/* Top Bar / Header */}
            <div className="flex justify-between items-center p-8 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-6">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                        <img src="/academy logo.png" alt="Lyceum Academy" className="h-14 w-auto filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                    </div>
                    <div className="border-l border-white/10 pl-6 h-12 flex flex-col justify-center">
                        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Lyceum Academy</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] mt-0.5">Creative Learning</p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <div className="text-6xl font-mono font-bold tracking-widest">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        <div className="text-gray-400 text-xl font-medium mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                    </div>
                </div>
            </div>



            {/* Full Screen Alert Overlay */}
            {flashing && lastCalledVisitor && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-3xl overflow-hidden">
                    {/* Atmospheric Background Effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.15)_0%,_transparent_70%)] animate-pulse"></div>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)]"></div>
                    
                    {/* Background "CALLING" watermarked text */}
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 text-[180px] font-black text-emerald-500/5 select-none tracking-[0.2em] whitespace-nowrap">
                        CALLING
                    </div>

                    <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
                        <div className="text-emerald-400 text-xl font-black uppercase tracking-[0.8em] mb-8 opacity-60">System Arrival Notice</div>
                        
                        <div className="text-[140px] font-black text-white text-center leading-[0.9] tracking-tighter mb-12 drop-shadow-[0_0_50px_rgba(255,255,255,0.3)] max-w-[90vw]">
                            {lastCalledVisitor.name}
                        </div>

                        <div className="relative overflow-hidden group">
                           <div className="absolute inset-0 bg-emerald-500/20 blur-2xl animate-pulse"></div>
                           <div className="relative bg-black/40 border-y-2 border-emerald-500/40 px-24 py-10 flex flex-col items-center">
                               <div className="text-emerald-500/60 text-xs font-black uppercase tracking-[0.5em] mb-4">Please Proceed Immediately to</div>
                               <div className="text-7xl font-black text-emerald-400 uppercase tracking-[0.1em] drop-shadow-glow">
                                   {getWaitingFor(lastCalledVisitor)}
                               </div>
                           </div>
                        </div>
                    </div>

                    <div className="absolute bottom-20 flex items-center gap-4 text-slate-500 font-black text-xs uppercase tracking-[0.4em]">
                        <div className="w-12 h-[2px] bg-slate-800"></div>
                        Institutional Lobby Protocol
                        <div className="w-12 h-[2px] bg-slate-800"></div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="p-8 max-w-[1920px] mx-auto">
                {visitors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-gray-600">
                        <Users size={120} className="mb-8 opacity-20" />
                        <h2 className="text-5xl font-bold opacity-30">No Visitors Waiting</h2>
                        <p className="text-2xl mt-4 opacity-30">The queue is currently empty.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {visitors.map((visitor, index) => {
                            // Check if visitor was called recently (within FLASH_DURATION_MS)
                            const isCalled = visitor.calledAt && (Date.now() - new Date(visitor.calledAt).getTime() < FLASH_DURATION_MS);
                            return (
                                <div
                                    key={visitor.id}
                                    className={`relative overflow-hidden rounded-2xl border-2 shadow-2xl transition-all duration-500 ${isCalled
                                        ? 'bg-green-600 border-green-400 transform scale-105 z-10'
                                        : 'bg-gray-800/80 border-gray-700/50 backdrop-blur-md'
                                        }`}
                                >
                                    {isCalled && <div className="absolute inset-0 bg-green-500 opacity-20 animate-pulse"></div>}

                                    <div className="flex min-h-[11rem]">
                                        {/* Sequence Number */}
                                        <div className={`w-32 flex items-center justify-center text-5xl font-black ${isCalled ? 'bg-green-700 text-white' : 'bg-gray-700/50 text-gray-400'}`}>
                                            #{visitor.dailySequenceNumber}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 p-8 flex flex-col justify-center">
                                            <h2 className="text-5xl font-bold tracking-tight mb-4 leading-[1.1]">{visitor.name}</h2>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className={`px-5 py-2 rounded-xl text-lg font-black uppercase tracking-wider leading-tight max-w-[280px] border shadow-lg ${isCalled 
                                                    ? 'bg-white text-green-700 border-white' 
                                                    : 'bg-lyceum-blue/10 text-blue-300 border-lyceum-blue/20'}`}>
                                                    {getWaitingFor(visitor)}
                                                </div>

                                                {!isCalled && (
                                                    <div className="flex items-center gap-3 text-xl font-mono text-yellow-400/90 font-bold bg-black/20 px-4 py-2 rounded-xl border border-white/5 shrink-0">
                                                        <Clock size={24} />
                                                        {getWaitTime(visitor.checkIn)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Bar */}
                                    {isCalled && (
                                        <div className="bg-green-800 text-center py-2 text-xl font-bold tracking-widest uppercase text-green-100 animate-pulse">
                                            Please Proceed Immediately
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(-2%); }
                    50% { transform: translateY(2%); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default VisitorDisplay;
