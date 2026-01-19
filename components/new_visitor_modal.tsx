
import React, { useState, useEffect } from 'react';
import { X } from './icons';
import type { User, Visitor, Contact } from '../types';

interface NewVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: number; name: string; company: string; host: string; cardNumber: string; purpose?: string; staffEmail?: string; staffName?: string }) => Promise<void> | void;
  staff: User[];
  user: User;
  visitorToEdit?: Visitor | null;
  contacts?: Contact[];
}

const NewVisitorModal: React.FC<NewVisitorModalProps> = ({ isOpen, onClose, onSave, staff, user, visitorToEdit, contacts = [] }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', company: '', host: '', purpose: '' });
  const [cardNumber, setCardNumber] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isEditing = !!visitorToEdit;
  const canCreate = user.role === 'Admin' || user.permissions?.['Reception']?.create;
  const canUpdate = user.role === 'Admin' || user.permissions?.['Reception']?.update;
  const isDisabled = isEditing ? !canUpdate : !canCreate;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({ name: visitorToEdit.name, company: visitorToEdit.company, host: visitorToEdit.host, purpose: visitorToEdit.purpose || '' });
        setCardNumber(visitorToEdit.cardNumber || '');
        // Find staff member if staffEmail exists
        if (visitorToEdit.staffEmail) {
          const staffMember = staff.find(s => s.email === visitorToEdit.staffEmail);
          if (staffMember) {
            setSelectedStaff(staffMember);
            setStaffSearch(staffMember.name);
          }
        }
      } else {
        setFormData({ name: '', company: '', host: '', purpose: '' });
        setCardNumber('');
        setSelectedStaff(null);
        setStaffSearch('');
      }
      setError('');
      setSuggestions([]);
      setShowSuggestions(false);
      setShowStaffDropdown(false);
    }
  }, [isOpen, staff, isEditing, visitorToEdit]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'name') {
      if (value.length > 1) {
        const filtered = contacts.filter(c => c.name.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
        setSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setFormData(prev => ({
      ...prev,
      name: contact.name,
      company: contact.phone || prev.company,
      host: contact.department || prev.host
    }));
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Visitor name is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        id: visitorToEdit?.id,
        name: formData.name,
        company: formData.company || 'N/A',
        host: formData.host || 'Walk-in',
        purpose: formData.purpose,
        cardNumber,
        staffEmail: selectedStaff?.email,
        staffName: selectedStaff?.name,
      });
    } catch (e) {
      console.error(e);
      setError('Failed to save visitor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(staffSearch.toLowerCase())
  );

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
        onClick={(e) => {
          e.stopPropagation();
          setShowSuggestions(false);
        }}
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
            <div className="relative">
              <label htmlFor="visitor-name" className={labelClasses}>Visitor Name</label>
              <input
                type="text"
                id="visitor-name"
                name="name"
                className={inputClasses}
                value={formData.name}
                onChange={handleChange}
                onFocus={(e) => { if (e.target.value.length > 1) setShowSuggestions(true) }}
                onClick={(e) => e.stopPropagation()}
                placeholder="e.g., John Doe"
                disabled={isDisabled}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                  {suggestions.map((contact) => (
                    <li
                      key={contact.id}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectContact(contact);
                      }}
                    >
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{contact.phone} • {contact.department || 'No Dept'}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label htmlFor="visitor-company" className={labelClasses}>Mobile Number (Optional)</label>
              <input type="text" id="visitor-company" name="company" className={inputClasses} value={formData.company} onChange={handleChange} placeholder="e.g., +91 98765 43210" disabled={isDisabled} />
            </div>
            <div className="relative">
              <label htmlFor="visitor-staff" className={labelClasses}>Staff Member (Optional)</label>
              <input
                type="text"
                id="visitor-staff"
                className={inputClasses}
                value={staffSearch}
                onChange={(e) => {
                  setStaffSearch(e.target.value);
                  setShowStaffDropdown(true);
                }}
                onFocus={() => setShowStaffDropdown(true)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Search staff by name or email..."
                disabled={isDisabled}
                autoComplete="off"
              />
              {showStaffDropdown && filteredStaff.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                  {filteredStaff.map((staffMember) => (
                    <li
                      key={staffMember.id}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStaff(staffMember);
                        setStaffSearch(staffMember.name);
                        setShowStaffDropdown(false);
                      }}
                    >
                      <div className="font-medium">{staffMember.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{staffMember.email}</div>
                    </li>
                  ))}
                </ul>
              )}
              {selectedStaff && (
                <div className="mt-2 flex items-center justify-between bg-lyceum-blue/10 dark:bg-lyceum-blue/20 px-3 py-2 rounded text-sm text-lyceum-blue">
                  <div>
                    <div className="font-medium">{selectedStaff.name}</div>
                    <div className="text-xs">{selectedStaff.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStaff(null);
                      setStaffSearch('');
                    }}
                    className="text-lyceum-blue hover:text-lyceum-blue-dark"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
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
          <button type="button" onClick={handleSave} disabled={isDisabled || isSubmitting} className="ml-3 px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark disabled:bg-gray-400">
            {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Check-in Visitor')}
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
