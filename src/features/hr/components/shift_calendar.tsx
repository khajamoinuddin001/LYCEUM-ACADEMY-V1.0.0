import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Sun, Moon, Plus, Save } from 'lucide-react';

interface ShiftRoster {
    userId: number;
    userName: string;
    shifts: { [date: string]: 'Morning' | 'Evening' | null };
}

interface ShiftCalendarProps {
    staff: any[];
    onSaveRoster: (roster: any) => void;
}

const ShiftCalendar: React.FC<ShiftCalendarProps> = ({ staff, onSaveRoster }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedShift, setSelectedShift] = useState<'Morning' | 'Evening' | null>('Morning');
    const [roster, setRoster] = useState<{ [key: string]: 'Morning' | 'Evening' | null }>({});

    // Get days in month (excluding weekends as per request)
    const getDaysInMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
                days.push(new Date(date));
            }
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const monthDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const toggleShift = (staffId: number, dateStr: string) => {
        const key = `${staffId}-${dateStr}`;
        setRoster(prev => ({
            ...prev,
            [key]: prev[key] === selectedShift ? null : selectedShift
        }));
    };

    const navigateMonth = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <CalendarIcon className="w-8 h-8" />
                        Shift Scheduling
                    </h2>
                    <p className="text-blue-100 mt-1">{monthName} {currentDate.getFullYear()} (Mon - Fri)</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="p-6">
                <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Select Shift Type:</span>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setSelectedShift('Morning')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${selectedShift === 'Morning'
                                    ? 'bg-orange-100 text-orange-700 border-2 border-orange-500 shadow-sm'
                                    : 'bg-white text-gray-600 border-2 border-transparent hover:border-gray-200'
                                }`}
                        >
                            <Sun className="w-4 h-4" />
                            Morning (09:00 - 17:00)
                        </button>
                        <button
                            onClick={() => setSelectedShift('Evening')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${selectedShift === 'Evening'
                                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500 shadow-sm'
                                    : 'bg-white text-gray-600 border-2 border-transparent hover:border-gray-200'
                                }`}
                        >
                            <Moon className="w-4 h-4" />
                            Evening (17:00 - 01:00)
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="sticky left-0 bg-white z-10 p-4 text-left font-bold text-gray-400 uppercase text-xs border-b min-w-[200px]">Staff Name</th>
                                {monthDays.map(day => (
                                    <th key={day.toISOString()} className="p-4 text-center border-b min-w-[60px]">
                                        <div className="text-xs font-bold text-gray-400">{day.toLocaleString('default', { weekday: 'short' })}</div>
                                        <div className="text-lg font-bold text-gray-800">{day.getDate()}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map(member => (
                                <tr key={member.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="sticky left-0 bg-white group-hover:bg-gray-50/50 z-10 p-4 font-semibold text-gray-700 border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                                                {member.name.charAt(0)}
                                            </div>
                                            {member.name}
                                        </div>
                                    </td>
                                    {monthDays.map(day => {
                                        const dateStr = day.toISOString().split('T')[0];
                                        const currentShift = roster[`${member.id}-${dateStr}`];
                                        return (
                                            <td key={dateStr} className="p-2 border-b text-center">
                                                <button
                                                    onClick={() => toggleShift(member.id, dateStr)}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-90 ${currentShift === 'Morning' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' :
                                                            currentShift === 'Evening' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' :
                                                                'bg-gray-100 text-transparent hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {currentShift === 'Morning' && <Sun className="w-5 h-5" />}
                                                    {currentShift === 'Evening' && <Moon className="w-5 h-5" />}
                                                    {!currentShift && <Plus className="w-5 h-5 text-gray-300" />}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 flex justify-between items-center py-6 border-t">
                    <div className="flex gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            Morning Shift
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                            Evening Shift
                        </div>
                    </div>
                    <button
                        onClick={() => onSaveRoster(roster)}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 transition-all transform active:scale-95"
                    >
                        <Save className="w-5 h-5" />
                        Save Roster
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShiftCalendar;
