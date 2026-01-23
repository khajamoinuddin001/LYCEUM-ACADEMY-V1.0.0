import React, { useState, useEffect, useRef } from 'react';
import type { Visitor } from '../types';
import * as api from '../utils/api';
import { Users, Clock, Filter, Monitor } from './icons';

const DEPARTMENTS = ['All', 'Admission', 'Accounts', 'Visa', 'LMS', 'Reception', 'Counseling'];
const FLASH_DURATION_MS = 15000; // Flash for 15 seconds
const DISPLAY_DURATION_MS = 60000; // Keep on display for 1 minute total

const VisitorDisplay: React.FC = () => {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [lastCalledVisitor, setLastCalledVisitor] = useState<Visitor | null>(null);
    const [flashing, setFlashing] = useState(false);
    const [selectedDept, setSelectedDept] = useState('All');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio('/notification-beep.mp3');
    }, []);

    useEffect(() => {
        const intervalId = setInterval(fetchVisitors, 2000); // Poll every 2s for faster updates
        fetchVisitors(); // Initial fetch
        return () => clearInterval(intervalId);
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
            console.log('[Alert Check] Found just called visitor:', justCalled.name, 'Last called:', lastCalledVisitor?.name);
            if (!lastCalledVisitor || justCalled.id !== lastCalledVisitor.id) {
                console.log('[Alert Check] Triggering alert for:', justCalled.name);
                triggerAlert(justCalled);
                setLastCalledVisitor(justCalled);
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
                    <Monitor size={56} className="text-lyceum-blue" />
                    <div>
                        <h1 className="text-5xl font-bold tracking-tight">Visitor Queue</h1>
                        <p className="text-xl text-gray-400 mt-2 font-medium bg-gray-800 px-3 py-1 rounded inline-block">
                            {selectedDept === 'All' ? 'All Departments' : `${selectedDept} Department`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <div className="text-6xl font-mono font-bold tracking-widest">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-gray-400 text-xl font-medium mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            {/* Department Filter Bar (Clickable) */}
            <div className="flex justify-center gap-4 py-6 bg-gray-800/30 overflow-x-auto px-8">
                {DEPARTMENTS.map(dept => (
                    <button
                        key={dept}
                        onClick={() => setSelectedDept(dept)}
                        className={`px-6 py-2 rounded-full text-lg font-bold transition-all whitespace-nowrap ${selectedDept === dept
                            ? 'bg-lyceum-blue text-white shadow-lg shadow-lyceum-blue/30 scale-105'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                    >
                        {dept}
                    </button>
                ))}
            </div>

            {/* Full Screen Alert Overlay */}
            {flashing && lastCalledVisitor && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-600 text-white animate-bounce-subtle">
                    <div className="text-[150px] font-black leading-none mb-8 animate-pulse text-yellow-300">CALLING</div>
                    <div className="text-[120px] font-bold text-center leading-tight mb-12 drop-shadow-lg">{lastCalledVisitor.name}</div>
                    <div className="bg-white text-red-600 px-16 py-8 rounded-3xl text-6xl font-bold shadow-2xl skew-x-[-10deg]">
                        Proceed to {getWaitingFor(lastCalledVisitor)}
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

                                    <div className="flex h-40">
                                        {/* Sequence Number */}
                                        <div className={`w-32 flex items-center justify-center text-5xl font-black ${isCalled ? 'bg-green-700 text-white' : 'bg-gray-700/50 text-gray-400'}`}>
                                            #{visitor.dailySequenceNumber}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 p-6 flex flex-col justify-center">
                                            <h2 className="text-5xl font-bold truncate tracking-tight mb-2">{visitor.name}</h2>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className={`px-4 py-1 rounded-lg text-xl font-bold uppercase tracking-wider ${isCalled ? 'bg-white text-green-700' : 'bg-lyceum-blue/20 text-blue-300'}`}>
                                                    {getWaitingFor(visitor)}
                                                </div>

                                                {!isCalled && (
                                                    <div className="flex items-center gap-3 text-2xl font-mono text-yellow-400/90 font-bold bg-black/20 px-4 py-1 rounded-lg">
                                                        <Clock size={28} />
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
