import React, { useState, useMemo } from 'react';
import type { CalendarEvent } from '@/types';
import { ChevronLeft, ChevronRight, Plus, Calendar, List } from '@/components/common/icons';

interface CalendarViewProps {
  events: CalendarEvent[];
  onNewEvent: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const eventColorClasses: { [key in CalendarEvent['color']]: { bg: string; text: string; border: string; } } = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-200', border: 'border-l-4 border-blue-500' },
  green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200', border: 'border-l-4 border-green-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-200', border: 'border-l-4 border-purple-500' },
  red: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200', border: 'border-l-4 border-red-500' },
};

const CalendarView: React.FC<CalendarViewProps> = ({ events, onNewEvent, onSelectEvent }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'agenda'>('month');

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const calendarDays = Array.from({ length: startingDayOfWeek }).map((_, i) => ({ key: `empty-${i}`, date: undefined, isToday: false }))
      .concat(Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
          return { key: `day-${i + 1}`, date, isToday: date.toDateString() === new Date().toDateString() };
      }));

    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        events.forEach(event => {
            const key = event.start.toDateString();
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(event);
        });
        return map;
    }, [events]);

    const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const goToToday = () => setCurrentDate(new Date());
    
    const AgendaView: React.FC = () => {
        const upcomingEvents = useMemo(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return events
                .filter(e => e.start >= today)
                .sort((a, b) => a.start.getTime() - b.start.getTime());
        }, [events]);

        const groupedEvents = useMemo(() => {
            const groups: { [key: string]: CalendarEvent[] } = {};
            upcomingEvents.forEach(event => {
                const dateKey = event.start.toDateString();
                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(event);
            });
            return groups;
        }, [upcomingEvents]);

        return (
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {Object.keys(groupedEvents).map(dateKey => (
                    <div key={dateKey}>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                            {new Date(dateKey).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h3>
                        <div className="space-y-2">
                            {groupedEvents[dateKey].map(event => (
                                <button key={event.id} onClick={() => onSelectEvent(event)} className={`w-full text-left p-3 rounded-lg flex ${eventColorClasses[event.color].bg} ${eventColorClasses[event.color].border}`}>
                                    <div className="flex-grow">
                                        <p className={`font-semibold text-sm ${eventColorClasses[event.color].text}`}>{event.title}</p>
                                        <p className={`text-xs ${eventColorClasses[event.color].text} opacity-80`}>{event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
                {upcomingEvents.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-10">No upcoming events.</p>}
            </div>
        )
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm animate-fade-in flex flex-col h-full">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h1>
                    <div className="flex items-center">
                        <button onClick={goToPreviousMonth} className="p-1 text-gray-500 dark:text-gray-400 hover:text-lyceum-blue rounded-full"><ChevronLeft size={24} /></button>
                        <button onClick={goToToday} className="px-3 py-1 mx-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Today</button>
                        <button onClick={goToNextMonth} className="p-1 text-gray-500 dark:text-gray-400 hover:text-lyceum-blue rounded-full"><ChevronRight size={24} /></button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 text-sm">
                        <button onClick={() => setView('month')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${view === 'month' ? 'bg-white dark:bg-gray-800 shadow-sm text-lyceum-blue font-semibold' : 'text-gray-500 dark:text-gray-400'}`}><Calendar size={16}/> Month</button>
                        <button onClick={() => setView('agenda')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${view === 'agenda' ? 'bg-white dark:bg-gray-800 shadow-sm text-lyceum-blue font-semibold' : 'text-gray-500 dark:text-gray-400'}`}><List size={16}/> Agenda</button>
                    </div>
                    <button onClick={() => onNewEvent(new Date())} className="inline-flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark"><Plus size={16} className="mr-2" /> New Event</button>
                </div>
            </header>
            
            {view === 'month' ? (
                 <div className="flex-1 grid grid-cols-7 grid-rows-6">
                    {weekdays.map(day => <div key={day} className="text-center font-semibold text-xs text-gray-500 dark:text-gray-400 py-2 border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">{day}</div>)}
                    {calendarDays.map((day, index) => (
                        <div key={day.key} className="group relative border-r border-b border-gray-200 dark:border-gray-700 p-1.5 flex flex-col min-h-[120px] transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            {day.date && (
                                <>
                                    <button onClick={() => onNewEvent(day.date)} className="absolute top-1 right-1 p-1 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-lyceum-blue/10 hover:text-lyceum-blue"><Plus size={14}/></button>
                                    <span className={`text-sm self-end ${day.isToday ? 'bg-lyceum-blue text-white rounded-full w-7 h-7 flex items-center justify-center font-bold' : 'text-gray-600 dark:text-gray-300'}`}>{day.date.getDate()}</span>
                                    <div className="mt-1 space-y-1 overflow-y-auto">
                                        {(eventsByDate.get(day.date.toDateString()) || []).map(event => (
                                            <button key={event.id} onClick={() => onSelectEvent(event)} className={`w-full text-left px-2 py-1 rounded-md text-xs truncate ${eventColorClasses[event.color].bg} ${eventColorClasses[event.color].text} font-semibold`}>
                                                {event.title}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <AgendaView />
            )}
             <style>{`
                @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default CalendarView;