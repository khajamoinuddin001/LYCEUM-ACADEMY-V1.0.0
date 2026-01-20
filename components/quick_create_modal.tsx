
import React, { useState, useEffect } from 'react';
import { X } from './icons';

type RecordType = 'todo' | 'contact' | 'lead';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: RecordType, data: any) => void;
}

const recordTypes = [
  { id: 'todo', name: 'Task' },
  { id: 'contact', name: 'Contact' },
  { id: 'lead', name: 'Sales Lead' },
];

const QuickCreateModal: React.FC<QuickCreateModalProps> = ({ isOpen, onClose, onSave }) => {
  const [recordType, setRecordType] = useState<RecordType>('todo');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const [todoState, setTodoState] = useState({ summary: '', details: '' });
  const [contactState, setContactState] = useState({ name: '', email: '', phone: '' });
  const [leadState, setLeadState] = useState({ company: '', contact: '', value: '' });


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      setTodoState({ summary: '', details: '' });
      setContactState({ name: '', email: '', phone: '' });
      setLeadState({ company: '', contact: '', value: '' });
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  };

  const handleSave = () => {
    let dataToSave;
    switch (recordType) {
      case 'todo':
        if (!todoState.summary) return;
        dataToSave = todoState;
        break;
      case 'contact':
        if (!contactState.name || !contactState.email) return;
        dataToSave = contactState;
        break;
      case 'lead':
        if (!leadState.company || !leadState.contact || !leadState.value) return;
        dataToSave = { ...leadState, value: parseFloat(leadState.value) || 0 };
        break;
    }
    if (dataToSave) {
      onSave(recordType, dataToSave);
    }
    handleClose();
  };

  const renderFormFields = () => {
    const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    switch (recordType) {
      case 'todo':
        return (
          <>
            <div>
              <label htmlFor="todo-summary" className={labelClasses}>Summary</label>
              <input type="text" id="todo-summary" className={inputClasses} placeholder="e.g., Follow up with client" value={todoState.summary} onChange={e => setTodoState(s => ({ ...s, summary: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="todo-details" className={labelClasses}>Details (Optional)</label>
              <textarea id="todo-details" rows={3} className={inputClasses} placeholder="Add more details..." value={todoState.details} onChange={e => setTodoState(s => ({ ...s, details: e.target.value }))}></textarea>
            </div>
          </>
        );
      case 'contact':
        return (
          <>
            <div>
              <label htmlFor="contact-name" className={labelClasses}>Name</label>
              <input type="text" id="contact-name" className={inputClasses} placeholder="Jane Doe" value={contactState.name} onChange={e => setContactState(s => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="contact-email" className={labelClasses}>Email</label>
              <input type="email" id="contact-email" className={inputClasses} placeholder="jane.doe@example.com" value={contactState.email} onChange={e => setContactState(s => ({ ...s, email: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="contact-phone" className={labelClasses}>Phone</label>
              <input type="tel" id="contact-phone" className={inputClasses} placeholder="+1 (555) 123-4567" value={contactState.phone} onChange={e => setContactState(s => ({ ...s, phone: e.target.value }))} />
            </div>
          </>
        );
      case 'lead':
        return (
          <>
            <div>
              <label htmlFor="lead-company" className={labelClasses}>Company Name</label>
              <input type="text" id="lead-company" className={inputClasses} placeholder="Acme Corporation" value={leadState.company} onChange={e => setLeadState(s => ({ ...s, company: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="lead-contact" className={labelClasses}>Contact Name</label>
              <input type="text" id="lead-contact" className={inputClasses} placeholder="John Smith" value={leadState.contact} onChange={e => setLeadState(s => ({ ...s, contact: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="lead-value" className={labelClasses}>Estimated Value (₹)</label>
              <input type="number" id="lead-value" className={inputClasses} placeholder="5000" value={leadState.value} onChange={e => setLeadState(s => ({ ...s, value: e.target.value }))} />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const animationClass = isAnimatingOut ? 'animate-fade-out-fast' : 'animate-fade-in-fast';
  const modalAnimationClass = isAnimatingOut ? 'animate-scale-out' : 'animate-scale-in';

  return (
    <div
      className={`fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 ${animationClass}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-create-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="quick-create-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Quick Create
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <label htmlFor="record-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              What would you like to create?
            </label>
            <select
              id="record-type"
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as RecordType)}
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {recordTypes.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            {renderFormFields()}
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
            className="ml-3 px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue"
          >
            Create
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

export default QuickCreateModal;