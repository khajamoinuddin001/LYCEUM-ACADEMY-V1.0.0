import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle } from '@/components/common/icons';
import type { Contact, Visitor } from '@/types';
import * as api from '@/utils/api';

interface StudentAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (date: string, time: string, purpose: string) => void;
    counselorName: string;
    shiftStart?: string;
    shiftEnd?: string;
}

const StudentAppointmentModal: React.FC<StudentAppointmentModalProps> = ({
    isOpen, onClose, onSave, counselorName, shiftStart = "09:00", shiftEnd = "18:00"
}) => {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [purpose, setPurpose] = useState('');
    const [slots, setSlots] = useState<string[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Default to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setSelectedDate(tomorrow.toISOString().split('T')[0]);
            setSelectedSlot('');
            setPurpose('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedDate && shiftStart && shiftEnd) {
            generateSlots();
            fetchBookedSlots();
        }
    }, [selectedDate, shiftStart, shiftEnd, counselorName]);

    const fetchBookedSlots = async () => {
        if (!selectedDate || !counselorName) return;
        setIsLoading(true);
        try {
            const visitors = await api.getVisitors();
            // Filter by counselor and selected date
            const booked = visitors
                .filter(v => {
                    if (v.host !== counselorName || v.status !== 'Scheduled' || !v.scheduledCheckIn) return false;
                    const d = new Date(v.scheduledCheckIn);
                    const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    return dStr === selectedDate;
                })
                .map(v => {
                    const date = new Date(v.scheduledCheckIn!);
                    const h = date.getHours();
                    const m = date.getMinutes();
                    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                });
            setBookedSlots(booked);
        } catch (error) {
            console.error("Failed to fetch booked slots:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateSlots = () => {
        const [startH, startM] = shiftStart.split(':').map(Number);
        const [endH, endM] = shiftEnd.split(':').map(Number);

        // Logic: Start + 2 hours
        let currentH = startH + 2;
        let currentM = startM;

        // Logic: End - 2 hours
        let limitH = endH - 2;
        let limitM = endM;

        const generated: string[] = [];

        // Convert to minutes for easier comparison
        let currentTotal = currentH * 60 + currentM;
        let limitTotal = limitH * 60 + limitM;

        while (currentTotal <= limitTotal) {
            const h = Math.floor(currentTotal / 60);
            const m = currentTotal % 60;
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            generated.push(timeStr);
            currentTotal += 30; // 30 min interval
        }
        setSlots(generated);
    };

    const handleSave = () => {
        if (!selectedDate || !selectedSlot || !purpose) return;
        onSave(selectedDate, selectedSlot, purpose);
    };

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsAnimatingOut(false);
            onClose();
        }, 200);
    };

    if (!isOpen) return null;

    const modalClass = isAnimatingOut ? 'animate-scale-out' : 'animate-scale-in';
    const bgClass = isAnimatingOut ? 'animate-fade-out-fast' : 'animate-fade-in-fast';

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${bgClass}`}>
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ${modalClass}`}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Schedule Appointment</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">With {counselorName}</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Date Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={selectedDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-lyceum-blue outline-none transition-all"
                            />
                            <Calendar size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                        </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Available Time Slots</label>
                            {isLoading && <div className="text-xs text-lyceum-blue animate-pulse">Checking availability...</div>}
                        </div>
                        {slots.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
                                {slots.map(slot => {
                                    const [h, m] = slot.split(':').map(Number);
                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                    const h12 = h % 12 || 12;
                                    const displayStr = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;

                                    const isSelected = selectedSlot === slot;
                                    const isBooked = bookedSlots.includes(slot);

                                    return (
                                        <button
                                            key={slot}
                                            disabled={isBooked}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`py-2 px-3 text-sm font-medium rounded-lg border transition-all ${isBooked
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60 line-through'
                                                : isSelected
                                                    ? 'bg-lyceum-blue text-white border-lyceum-blue shadow-md scale-105'
                                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-lyceum-blue hover:text-lyceum-blue'
                                                }`}
                                        >
                                            {displayStr}
                                            {isBooked && <span className="block text-[8px] font-bold uppercase mt-0.5">Booked</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No slots available for this date.</p>
                        )}
                    </div>

                    {/* Purpose */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Purpose Of Appointment</label>
                        <textarea
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="e.g. Visa Interview Prep, Document Review..."
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-lyceum-blue outline-none transition-all h-24 resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedDate || !selectedSlot || !purpose || isLoading}
                        className="px-6 py-2.5 bg-lyceum-blue text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        Confirm Appointment
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-out-fast { from { opacity: 1; } to { opacity: 0; } }
                .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
                .animate-fade-out-fast { animation: fade-out-fast 0.2s ease-in forwards; }
                @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes scale-out { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }
                .animate-scale-in { animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-scale-out { animation: scale-out 0.2s ease-in forwards; }
            `}</style>
        </div>
    );
};

export default StudentAppointmentModal;
