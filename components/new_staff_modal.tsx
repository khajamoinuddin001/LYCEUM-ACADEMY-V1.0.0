
import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from './icons';
import type { User, UserRole } from '../types';
import { STAFF_ROLES } from './constants';

interface NewStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<User, 'id' | 'permissions'>) => void;
  user: User;
}

const NewStaffModal: React.FC<NewStaffModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Staff' as UserRole });
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{ email: string; tempPass: string } | null>(null);
  
  const canCreate = user.permissions['Access Control']?.create;

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', email: '', role: 'Staff' as UserRole });
      setError('');
      setSuccessData(null);
    }
  }, [isOpen]);

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
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const tempPass = Math.random().toString(36).slice(-8);
    const userToSave: Omit<User, 'id' | 'permissions'> = {
      ...formData,
      password: tempPass,
      mustResetPassword: true,
    };
    
    onSave(userToSave);
    setSuccessData({ email: formData.email, tempPass });
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
      aria-labelledby="new-staff-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="new-staff-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {successData ? 'User Created Successfully' : 'Create New Staff Member'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {successData ? (
          <>
            <div className="p-6 text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Please securely share the following temporary login credentials with the new staff member. They will be required to set a new password on their first login.
              </p>
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md text-left space-y-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400">EMAIL</label>
                  <p className="font-mono text-sm">{successData.email}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400">TEMPORARY PASSWORD</label>
                  <p className="font-mono text-sm">{successData.tempPass}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
              <button type="button" onClick={handleClose} className="px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark">
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="staff-name" className={labelClasses}>Full Name</label>
                  <input type="text" id="staff-name" name="name" className={inputClasses} value={formData.name} onChange={handleChange} placeholder="e.g., John Doe" disabled={!canCreate} />
                </div>
                <div>
                  <label htmlFor="staff-email" className={labelClasses}>Email Address</label>
                  <input type="email" id="staff-email" name="email" className={inputClasses} value={formData.email} onChange={handleChange} placeholder="e.g., john.d@lyceum.academy" disabled={!canCreate} />
                </div>
                <div>
                  <label htmlFor="staff-role" className={labelClasses}>Role</label>
                  <select id="staff-role" name="role" value={formData.role} onChange={handleChange} className={inputClasses} disabled={!canCreate}>
                    {STAFF_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              </div>
            </div>
            <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
              <button type="button" onClick={handleClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={!canCreate} className="ml-3 px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark disabled:bg-gray-400">
                Create User
              </button>
            </div>
          </>
        )}
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

export default NewStaffModal;
