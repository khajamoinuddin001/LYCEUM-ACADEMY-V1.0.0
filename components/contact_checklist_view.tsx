import React from 'react';
import type { Contact, ChecklistItem, User } from '../types';
import { ArrowLeft, CheckCircle2, Circle } from './icons';

interface ContactChecklistViewProps {
  contact: Contact;
  user: User;
  onNavigateBack: () => void;
  onUpdateChecklistItem: (contactId: number, itemId: number, completed: boolean) => void;
}

const ContactChecklistView: React.FC<ContactChecklistViewProps> = ({ contact, user, onNavigateBack, onUpdateChecklistItem }) => {
  const checklist = contact.checklist || [];
  const canUpdate = user.permissions['Contacts']?.update;
  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm w-full mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <button
            onClick={onNavigateBack}
            className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-2"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Details
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Application Checklist for {contact.name}
          </h1>
        </div>
      </div>

      {checklist.length > 0 ? (
        <div>
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-base font-medium text-lyceum-blue">Progress</span>
              <span className="text-sm font-medium text-lyceum-blue">{completedCount} of {totalCount} complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-lyceum-blue h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {checklist.map((item) => (
              <li key={item.id} className="py-4 flex items-center">
                <input
                  type="checkbox"
                  id={`item-${item.id}`}
                  checked={item.completed}
                  disabled={!canUpdate}
                  onChange={(e) => onUpdateChecklistItem(contact.id, item.id, e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-lyceum-blue focus:ring-lyceum-blue disabled:opacity-50"
                />
                <label
                  htmlFor={`item-${item.id}`}
                  className={`ml-3 text-sm font-medium ${item.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}
                >
                  {item.text}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No checklist items have been set up for this contact.</p>
        </div>
      )}

    </div>
  );
};

export default ContactChecklistView;
