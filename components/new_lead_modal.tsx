import React, { useState, useEffect, useRef } from 'react';
import { X } from './icons';
import type { CrmLead, User, Contact } from '../types';
import * as api from '../utils/api';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Omit<CrmLead, 'id' | 'stage'> & { id?: number }) => Promise<void>;
  lead?: CrmLead | null;
  agents: string[];
  user: User;
}

const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, onSave, lead, agents, user }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    contact: '',
    email: '',
    phone: '',
    type: '',
    source: '',
    assignedTo: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEditing = !!lead;
  const canWrite = user.role === 'Admin' || (isEditing ? user.permissions['CRM']?.update : user.permissions['CRM']?.create);

  // Fetch contacts
  useEffect(() => {
    if (isOpen) {
      api.getContacts().then(setContacts).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({
          contact: lead.contact || '',
          email: lead.email || '',
          phone: lead.phone || '',
          type: (lead as any).type || '',
          source: lead.source || '',
          assignedTo: lead.assignedTo || '',
          notes: lead.notes || '',
        });
      } else {
        setFormData({
          contact: '', email: '', phone: '',
          type: '', source: '', assignedTo: agents[0] || '', notes: ''
        });
      }
      setError('');
      setContactSearchQuery('');
    }
  }, [isOpen, lead, agents, isEditing]);

  const handleContactSelect = (contact: Contact) => {
    setFormData(prev => ({
      ...prev,
      contact: contact.name,
      email: contact.email || '',
      phone: contact.phone || ''
    }));
    setSelectedContactId(contact.id);
    setContactSearchQuery('');
    setShowContactDropdown(false);
  };

  const handleContactSearch = (value: string) => {
    setContactSearchQuery(value);
    setFormData(prev => ({ ...prev, contact: value }));
    setSelectedContactId(null); // Clear selected contact when user types

    // Only show dropdown if there's a value and matching contacts
    // Only show dropdown if there's a value (even if no matches, to show the "Create new" message)
    setShowContactDropdown(value.length > 0);

    // Auto-fill if exact match found
    const exactMatch = contacts.find(c => c.name.toLowerCase() === value.toLowerCase());
    if (exactMatch) {
      setFormData(prev => ({
        ...prev,
        contact: exactMatch.name,
        email: exactMatch.email || prev.email,
        phone: exactMatch.phone || prev.phone
      }));
      setShowContactDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowContactDropdown(false);
      }
    };

    if (showContactDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showContactDropdown]);

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
  };

  const handleSave = async () => {
    setError('');

    // Validate required fields
    if (!formData.contact.trim() || !formData.phone.trim()) {
      setError('Contact name and phone are required.');
      return;
    }

    if (!formData.type || !formData.notes.trim()) {
      setError('Type and Notes are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate that contact exists
      const existingContact = contacts.find(c =>
        c.name.toLowerCase() === formData.contact.trim().toLowerCase()
      );

      if (!existingContact && !selectedContactId) {
        setError('Contact must exist before creating a lead. Please create the contact first in the Contacts section.');
        setIsSubmitting(false);
        return;
      }

      // Leads do not automatically create contacts
      // User must manually create contacts separately

      const leadToSave = {
        contact: formData.contact.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        value: 0, // Set default value to 0
        type: formData.type,
        source: formData.source,
        assignedTo: formData.assignedTo,
        notes: formData.notes,
        // Auto-fill Title and Company to satisfy DB constraints
        title: `${formData.contact.trim()}'s Opportunity`,
        company: 'N/A',
        id: isEditing ? lead.id : undefined,
      } as any;

      await onSave(leadToSave);
    } catch (err: any) {
      console.error('Save failed', err);
      setError(err.message || 'Failed to save lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      aria-labelledby="new-lead-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="new-lead-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {isEditing ? 'Edit Lead' : 'Create New Lead'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Contact Person with Autocomplete */}
            <div className="relative" ref={dropdownRef}>
              <label htmlFor="lead-contact" className={labelClasses}>Contact Person (Client Name) *</label>
              <input
                type="text"
                id="lead-contact"
                name="contact"
                value={formData.contact}
                onChange={(e) => handleContactSearch(e.target.value)}
                onFocus={() => {
                  const hasMatches = contacts.some(c =>
                    c.name.toLowerCase().includes(formData.contact.toLowerCase())
                  );
                  setShowContactDropdown(formData.contact.length > 0 && hasMatches);
                }}
                onBlur={() => {
                  // Delay to allow click on dropdown item
                  setTimeout(() => setShowContactDropdown(false), 200);
                }}
                placeholder="Type contact name..."
                className={inputClasses}
                disabled={!canWrite}
              />

              {showContactDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-60 overflow-y-auto">
                  {contacts
                    .filter(c =>
                      c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                      c.email?.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                      c.phone?.includes(contactSearchQuery)
                    )
                    .slice(0, 10)
                    .map(c => (
                      <div
                        key={c.id}
                        onClick={() => handleContactSelect(c)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                      >
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.email || c.phone || 'No contact info'}</div>
                      </div>
                    ))}
                  {contacts.filter(c =>
                    c.name.toLowerCase().includes(contactSearchQuery.toLowerCase())
                  ).length === 0 && contactSearchQuery && (
                      <div className="p-3 text-sm text-gray-500 italic">
                        No existing contact found. Fill in the details below to create a new contact.
                      </div>
                    )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Start typing to search existing contacts or enter a new name</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lead-email" className={labelClasses}>Contact Email</label>
                <input type="email" id="lead-email" name="email" className={inputClasses} value={formData.email} onChange={handleChange} placeholder="e.g., john@example.com" disabled={!canWrite} />
              </div>
              <div>
                <label htmlFor="lead-phone" className={labelClasses}>Contact Phone *</label>
                <input type="tel" id="lead-phone" name="phone" className={inputClasses} value={formData.phone} onChange={handleChange} placeholder="e.g., +91 9876543210" disabled={!canWrite} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lead-type" className={labelClasses}>Type *</label>
                <select id="lead-type" name="type" value={formData.type} onChange={handleChange} className={inputClasses} disabled={!canWrite}>
                  <option value="" disabled>Select a type</option>
                  <option value="Student Visa">Student Visa</option>
                  <option value="Visit Visa">Visit Visa</option>
                  <option value="Coaching">Coaching</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div>
                <label htmlFor="lead-source" className={labelClasses}>Lead Source</label>
                <select id="lead-source" name="source" value={formData.source} onChange={handleChange} className={inputClasses} disabled={!canWrite}>
                  <option value="" disabled>Select a source</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Partner">Partner</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="lead-assignedTo" className={labelClasses}>Assigned To</label>
              <select id="lead-assignedTo" name="assignedTo" value={formData.assignedTo} onChange={handleChange} className={inputClasses} disabled={!canWrite}>
                {agents.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lead-notes" className={labelClasses}>Notes *</label>
              <textarea id="lead-notes" name="notes" rows={4} className={inputClasses} value={formData.notes} onChange={handleChange} placeholder="Add any relevant notes about this lead..." disabled={!canWrite}></textarea>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canWrite || isSubmitting}
            className="ml-3 px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Lead')}
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

export default NewLeadModal;