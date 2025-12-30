

import React, { useState, useEffect } from 'react';
import { X } from './icons';
import type { User, Visitor } from '../types';

interface NewVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: number; name: string; company: string; host: string; cardNumber: string; }) => void;
  staff: User[];
  user: User;
  visitorToEdit?: Visitor | null;
}

const NewVisitorModal: React.FC<NewVisitorModalProps> = ({ isOpen, onClose, onSave, staff, user, visitorToEdit }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [formData, setFormData] = useState({ name: '', company: '', host: '' });
  const [cardNumber, setCardNumber] = useState('');
  const [error, setError] = useState('');

  const isEditing = !!visitorToEdit;
  const canCreate = user.permissions?.['Reception']?.create;
  const canUpdate = user.permissions?.['Reception']?.update;
  const isDisabled = isEditing ? !canUpdate : !canCreate;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({ name: visitorToEdit.name, company: visitorToEdit.company, host: visitorToEdit.host });
        setCardNumber(visitorToEdit.cardNumber || '');
      } else {
        setFormData({ name: '', company: '', host: '' });
        setCardNumber('');
      }
      setError('');
    }
  }, [isOpen, staff, isEditing, visitorToEdit]);

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
    if (!formData.name.trim()) {
      setError('Visitor name is required.');
      return;
    }
    onSave({
      id: visitorToEdit?.id,
      name: formData.name,
      company: formData.company || 'N/A',
      host: formData.host || 'Walk-in',
      cardNumber,
    });
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
      aria-labelledby="new-visitor-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="new-visitor-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {isEditing ? 'Edit Visitor Details' : 'New Visitor Check-in'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="visitor-name" className={labelClasses}>Visitor Name</label>
              <input type="text" id="visitor-name" name="name" className={inputClasses} value={formData.name} onChange={handleChange} placeholder="e.g., John Doe" disabled={isDisabled} />
            </div>
            <div>
              <label htmlFor="visitor-company" className={labelClasses}>Company (Optional)</label>
              <input type="text" id="visitor-company" name="company" className={inputClasses} value={formData.company} onChange={handleChange} placeholder="e.g., Acme Corp" disabled={isDisabled} />
            </div>
            <div>
              <label htmlFor="visitor-host" className={labelClasses}>Host (Optional)</label>
              <select id="visitor-host" name="host" value={formData.host} onChange={handleChange} className={inputClasses} disabled={isDisabled}>
                <option value="">-- Select Host (Optional) --</option>
                {staff.map(member => (
                  <option key={member.id} value={member.name}>{member.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="visitor-card-number" className={labelClasses}>Card Number (Optional)</label>
              <input type="text" id="visitor-card-number" name="cardNumber" className={inputClasses} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="e.g., C12345" disabled={isDisabled} />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <button type="button" onClick={handleClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={isDisabled} className="ml-3 px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark disabled:bg-gray-400">
            {isEditing ? 'Save Changes' : 'Check-in Visitor'}
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

export default NewVisitorModal;
