import React, { useState, useEffect } from 'react';
import { X } from './icons';
import type { User } from '../types';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, company: string, host: string, scheduledCheckIn: string) => void;
  staff: User[];
  user: User;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ isOpen, onClose, onSave, staff, user }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [formData, setFormData] = useState({ name: '', company: '', host: '', scheduledCheckIn: '' });
  const [error, setError] = useState('');

  const canCreate = user.role === 'Admin' || !!user.permissions?.['Reception']?.create;

  const getInitialDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }


  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        company: '',
        host: '',
        scheduledCheckIn: getInitialDateTime(),
      });
      setError('');
    }
  }, [isOpen, staff]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.scheduledCheckIn) {
      setError('Visitor name and scheduled time are required.');
      return;
    }
    const scheduledDate = new Date(formData.scheduledCheckIn);
    if (scheduledDate < new Date()) {
      setError('Scheduled time cannot be in the past.');
      return;
    }
    onSave(formData.name, formData.company, formData.host, scheduledDate.toISOString());
  };

  if (!isOpen) return null;

  const animationClass = isAnimatingOut ? 'animate-fade-out-fast' : 'animate-fade-in-fast';
  const modalAnimationClass = isAnimatingOut ? 'animate-scale-out' : 'animate-scale-in';

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white disabled:opacity-70";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div
      className={`fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 ${animationClass}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-appointment-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="new-appointment-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Schedule a Visitor
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="appt-name" className={labelClasses}>Visitor Name</label>
              <input type="text" id="appt-name" name="name" className={inputClasses} value={formData.name} onChange={handleChange} placeholder="e.g., Jane Doe" disabled={!canCreate} />
            </div>
            <div>
              <label htmlFor="appt-company" className={labelClasses}>Mobile Number</label>
              <input type="text" id="appt-company" name="company" className={inputClasses} value={formData.company} onChange={handleChange} placeholder="e.g., +91 98765 43210" disabled={!canCreate} />
            </div>
            <div>
              <label htmlFor="appt-host" className={labelClasses}>Department</label>
              <select id="appt-host" name="host" value={formData.host} onChange={handleChange} className={inputClasses} disabled={!canCreate}>
                <option value="">-- Select Department --</option>
                <option value="Academic Director">Academic Director</option>
                <option value="Admissions Department (Syed Nasir Ali)">Admissions Department (Syed Nasir Ali)</option>
                <option value="Admissions Department (Mohammed Khaja Moinuddin)">Admissions Department (Mohammed Khaja Moinuddin)</option>
                <option value="Sales Department (Abdul Samad)">Sales Department (Abdul Samad)</option>
                <option value="Finance Department (Syed)">Finance Department (Syed)</option>
                <option value="Instructor">Instructor</option>
              </select>
            </div>
            <div>
              <label htmlFor="appt-datetime" className={labelClasses}>Scheduled Check-in Time</label>
              <input type="datetime-local" id="appt-datetime" name="scheduledCheckIn" className={inputClasses} value={formData.scheduledCheckIn} onChange={handleChange} disabled={!canCreate} />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <button type="button" onClick={handleClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={!canCreate} className="ml-3 px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark disabled:bg-gray-400">
            Schedule Visitor
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
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
        .animate-scale-out { animation: scale-out 0.2s ease-in forwards; }
      `}</style>
    </div>
  );
};

export default NewAppointmentModal;
