import React, { useState, useEffect, useRef } from 'react';
import type { Visitor } from '../types';
import * as api from '../utils/api';
import { Bell, Users, Clock } from './icons';

const VisitorDisplay: React.FC = () => {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [lastCalledVisitor, setLastCalledVisitor] = useState<Visitor | null>(null);
    const [flashing, setFlashing] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio('/notification-beep.mp3'); // Need to ensure this file exists or use a standard URL
    }, []);

    useEffect(() => {
        const intervalId = setInterval(fetchVisitors, 5000);
        fetchVisitors(); // Initial fetch

        return () => clearInterval(intervalId);
    }, []);

    const fetchVisitors = async () => {
        try {
            const allVisitors = await api.getVisitors();

            // Filter for Checked-in or Called visitors
            const waitingVisitors = allVisitors.filter(v =>
                v.status === 'Checked-in' || v.status === 'Called'
            ).sort((a, b) => {
                // Sort by checkIn time ascending (first come first served)
                return new Date(a.checkIn || '').getTime() - new Date(b.checkIn || '').getTime();
            });

            setVisitors(waitingVisitors);

            // Check for newly called visitors to trigger alert
            checkForAlerts(allVisitors);

        } catch (error) {
            console.error("Failed to fetch visitors:", error);
        }
    };

    const checkForAlerts = (currentVisitors: Visitor[]) => {
        // Find a visitor who was "Called" very recently (e.g., within last 10 seconds)
        // We might need to rely on a 'calledAt' timestamp which we haven't strictly added yet.
        // Or we can rely on local state comparison if we keep track of previous 'Called' visitors.
        // For simplicity, let's assume if status is 'Called' and we haven't flashed for them yet.

        // Better approach: Look for 'Called' status in segments with recent timestamp?
        // Let's iterate and find if anyone is 'Called' and different from lastCalledVisitor
        const justCalled = currentVisitors.find(v => v.status === 'Called');

        if (justCalled && justCalled.id !== lastCalledVisitor?.id) {
            triggerAlert(justCalled);
            setLastCalledVisitor(justCalled);
        }
    };

    const triggerAlert = (visitor: Visitor) => {
        // Play Sound
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play failed", e));
        }

        // Flash Screen
        setFlashing(true);
        setTimeout(() => setFlashing(false), 5000); // Flash for 5 seconds
    };

    const getWaitingFor = (visitor: Visitor) => {
        // Get the last department from segments
        if (visitor.visitSegments && visitor.visitSegments.length > 0) {
            return visitor.visitSegments[visitor.visitSegments.length - 1].department;
        }
        return visitor.host; // Default to host/department initially selected
    };

    const getWaitTime = (checkInTime?: string) => {
        if (!checkInTime) return '-';
        const diff = Date.now() - new Date(checkInTime).getTime();
        const mins = Math.floor(diff / 60000);
        return `${mins} mins`;
    };

    return (
        <div className={`min-h-screen bg-gray-900 text-white p-8 ${flashing ? 'animate-pulse bg-red-900' : ''}`}>
            <div className="flex justify-between items-center mb-12 border-b border-gray-700 pb-6">
                <div className="flex items-center gap-4">
                    <Users size={48} className="text-lyceum-blue" />
                    <h1 className="text-5xl font-bold tracking-wider">Visitor Queue</h1>
                </div>
                <div className="text-3xl text-gray-400 font-mono">
                    {new Date().toLocaleTimeString()}
                </div>
            </div>

            {flashing && lastCalledVisitor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="text-center animate-bounce">
                        <h2 className="text-6xl font-bold text-white mb-4">CALLING</h2>
                        <h1 className="text-9xl font-bold text-lyceum-blue mb-8">{lastCalledVisitor.name}</h1>
                        <h3 className="text-5xl text-gray-300">Please proceed to {getWaitingFor(lastCalledVisitor)}</h3>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 text-2xl font-bold text-gray-400 border-b border-gray-700 pb-4 px-6">
                    <div>Visitor Name</div>
                    <div>Waiting For</div>
                    <div>Purpose</div>
                    <div>Wait Time</div>
                </div>

                {/* List */}
                {visitors.length === 0 ? (
                    <div className="text-center py-20 text-4xl text-gray-600">No visitors waiting</div>
                ) : (
                    visitors.map((visitor, index) => (
                        <div key={visitor.id} className={`grid grid-cols-4 gap-4 p-6 rounded-xl text-3xl font-medium items-center transition-all ${visitor.status === 'Called'
                            ? 'bg-green-900/50 border-2 border-green-500 text-green-100 scale-105 shadow-lg shadow-green-900/20'
                            : 'bg-gray-800 border border-gray-700 text-gray-100 hover:bg-gray-750'
                            }`}>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-500 text-xl font-bold">#{visitor.dailySequenceNumber}</span>
                                {visitor.name}
                            </div>
                            <div className="text-lyceum-blue">
                                {getWaitingFor(visitor)}
                            </div>
                            <div className="text-gray-200 truncate">
                                {visitor.purpose || '-'}
                            </div>
                            <div className="flex items-center gap-3 text-yellow-400 font-mono">
                                <Clock size={28} />
                                {getWaitTime(visitor.checkIn)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default VisitorDisplay;
