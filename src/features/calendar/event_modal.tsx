import React, { useState, useEffect } from 'react';
import { X, Trash2 } from '@/components/common/icons';
import type { CalendarEvent, User } from '@/types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'> & { id?: number }) => void;
  onDelete: (eventId: number) => void;
  eventInfo: { event?: CalendarEvent; date?: Date } | null;
  user: User;
}

const eventColors: CalendarEvent['color'][] = ['blue', 'green', 'purple', 'red'];
const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
};

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, eventInfo, user }) => {
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    color: 'blue' as CalendarEvent['color'],
  });
  const [error, setError] = useState('');

  const isNew = !eventInfo?.event;
  const canWrite = isNew ? user.permissions['Calendar']?.create : user.permissions['Calendar']?.update;

  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (isOpen && eventInfo) {
      if (eventInfo.event) { 
        setFormData({
          title: eventInfo.event.title,
          start: formatDateForInput(eventInfo.event.start),
          end: formatDateForInput(eventInfo.event.end),
          description: eventInfo.event.description || '',
          color: eventInfo.event.color,
        });
      } else if (eventInfo.date) {
        const startDate = new Date(eventInfo.date);
        startDate.setHours(9, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(10, 0, 0, 0); 
        setFormData({
          title: '',
          start: formatDateForInput(startDate),
          end: formatDateForInput(endDate),
          description: '',
          color: 'blue',
        });
      }
      setError('');
    }
  }, [isOpen, eventInfo]);

  const handleClose = () => {
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    const start = new Date(formData.start);
    const end = new Date(formData.end);
    if (end < start) {
      setError('End date must be after start date.');
      return;
    }
    onSave({
      id: eventInfo?.event?.id,
      title: formData.title,
      start,
      end,
      description: formData.description,
      color: formData.color,
    });
  };

  const handleDelete = () => {
    if (eventInfo?.event && window.confirm('Are you sure you want to delete this event?')) {
      onDelete(eventInfo.event.id);
    }
  };
  
  if (!isOpen) return null;

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white disabled:opacity-70";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{isNew ? 'New Event' : 'Edit Event'}</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="event-title" className={labelClasses}>Title</label>
            <input id="event-title" name="title" type="text" value={formData.title} onChange={handleChange} className={inputClasses} disabled={!canWrite} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="event-start" className={labelClasses}>Start</label>
              <input id="event-start" name="start" type="datetime-local" value={formData.start} onChange={handleChange} className={inputClasses} disabled={!canWrite} />
            </div>
            <div>
              <label htmlFor="event-end" className={labelClasses}>End</label>
              <input id="event-end" name="end" type="datetime-local" value={formData.end} onChange={handleChange} className={inputClasses} disabled={!canWrite} />
            </div>
          </div>
          <div>
            <label htmlFor="event-description" className={labelClasses}>Description</label>
            <textarea id="event-description" name="description" rows={3} value={formData.description} onChange={handleChange} className={inputClasses} disabled={!canWrite}></textarea>
          </div>
          <div>
            <label className={labelClasses}>Color</label>
            <div className="flex items-center space-x-2">
              {eventColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => canWrite && setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full ${colorClasses[color]} ${formData.color === color ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-lyceum-blue' : ''} disabled:opacity-70`}
                  disabled={!canWrite}
                  aria-label={`Set color to ${color}`}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <div>
            {!isNew && user.permissions['Calendar']?.delete && (
              <button onClick={handleDelete} className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">
                <Trash2 size={16} className="mr-2" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center">
            <button onClick={handleClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm">Cancel</button>
            {canWrite && (
              <button onClick={handleSave} className="ml-3 px-4 py-2 bg-lyceum-blue text-white rounded-md text-sm">Save</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;