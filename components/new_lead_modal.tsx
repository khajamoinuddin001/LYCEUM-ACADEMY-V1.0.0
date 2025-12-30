import React, { useState, useEffect } from 'react';
import { X } from './icons';
import type { CrmLead, User } from '../types';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Omit<CrmLead, 'id' | 'stage'> & { id?: number }) => void;
  lead?: CrmLead | null;
  agents: string[];
  user: User;
}

const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, onSave, lead, agents, user }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    contact: '',
    email: '',
    phone: '',
    value: '',
    source: '',
    assignedTo: '',
    notes: ''
  });
  const [error, setError] = useState('');
  
  const isEditing = !!lead;
  const canWrite = isEditing ? user.permissions['CRM']?.update : user.permissions['CRM']?.create;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setFormData({
                title: lead.title || '',
                company: lead.company || '',
                contact: lead.contact || '',
                email: lead.email || '',
                phone: lead.phone || '',
                value: lead.value?.toString() || '',
                source: lead.source || '',
                assignedTo: lead.assignedTo || '',
                notes: lead.notes || '',
            });
        } else {
            setFormData({
                title: '', company: '', contact: '', email: '', phone: '',
                value: '', source: '', assignedTo: agents[0] || '', notes: ''
            });
        }
        setError('');
    }
  }, [isOpen, lead, agents, isEditing]);

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

  const handleSave = () => {
    if (!formData.title.trim() || !formData.company.trim() || !formData.contact.trim() || !formData.value) {
        setError('Title, Company, Contact, and Value are required.');
        return;
    }
    const parsedValue = parseFloat(formData.value);
    if (isNaN(parsedValue) || parsedValue < 0) {
        setError('Please enter a valid, non-negative value.');
        return;
    }

    const leadToSave = {
        ...formData,
        value: parsedValue,
        id: isEditing ? lead.id : undefined,
    };
    onSave(leadToSave);
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
            <div>
              <label htmlFor="lead-title" className={labelClasses}>Lead Title / Opportunity</label>
              <input type="text" id="lead-title" name="title" className={inputClasses} value={formData.title} onChange={handleChange} placeholder="e.g., Q4 Website Project" disabled={!canWrite} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-company" className={labelClasses}>Company Name</label>
                  <input type="text" id="lead-company" name="company" className={inputClasses} value={formData.company} onChange={handleChange} placeholder="e.g., Acme Corp" disabled={!canWrite} />
                </div>
                <div>
                  <label htmlFor="lead-contact" className={labelClasses}>Contact Person</label>
                  <input type="text" id="lead-contact" name="contact" className={inputClasses} value={formData.contact} onChange={handleChange} placeholder="e.g., John Doe" disabled={!canWrite} />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-email" className={labelClasses}>Contact Email</label>
                  <input type="email" id="lead-email" name="email" className={inputClasses} value={formData.email} onChange={handleChange} placeholder="e.g., john.d@acme.corp" disabled={!canWrite} />
                </div>
                <div>
                  <label htmlFor="lead-phone" className={labelClasses}>Contact Phone</label>
                  <input type="tel" id="lead-phone" name="phone" className={inputClasses} value={formData.phone} onChange={handleChange} placeholder="e.g., +1 555-123-4567" disabled={!canWrite} />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-value" className={labelClasses}>Estimated Value (₹)</label>
                  <input type="number" id="lead-value" name="value" className={inputClasses} value={formData.value} onChange={handleChange} placeholder="e.g., 50000" disabled={!canWrite} />
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
                <label htmlFor="lead-notes" className={labelClasses}>Notes</label>
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
            disabled={!canWrite}
            className="ml-3 px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue disabled:bg-gray-400 dark:disabled:bg-gray-600"
          >
            {isEditing ? 'Save Changes' : 'Create Lead'}
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