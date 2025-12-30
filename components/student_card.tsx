import React from 'react';
import type { Contact } from '../types';
import { Mail, Phone, Building2, FileBadge } from './icons';

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

interface ContactCardProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
  isSelected: boolean;
  onToggleSelect: (contactId: number) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onSelect, isSelected, onToggleSelect }) => {
  return (
    <div
      onClick={() => onToggleSelect(contact.id)}
      className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${isSelected ? 'border-lyceum-blue ring-2 ring-lyceum-blue/50' : 'border-gray-200 dark:border-gray-700'} p-5 flex flex-col transition-all duration-200 hover:shadow-lg dark:hover:shadow-black/20 cursor-pointer`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        readOnly
        className="absolute top-4 right-4 h-5 w-5 rounded text-lyceum-blue focus:ring-lyceum-blue border-gray-300 dark:border-gray-600 pointer-events-none"
        aria-label={`Select contact ${contact.name}`}
      />
      
      <div className="flex items-start mb-4">
        {contact.avatarUrl ? (
          <img src={contact.avatarUrl} alt={contact.name} className="w-16 h-16 rounded-full mr-4" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-lyceum-blue flex items-center justify-center text-white text-2xl font-bold mr-4 flex-shrink-0">
            {getInitials(contact.name)}
          </div>
        )}
        <div className="flex-grow">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(contact); }}
            className="font-bold text-gray-800 dark:text-gray-100 text-xl hover:text-lyceum-blue hover:underline text-left"
          >
            {contact.name}
          </button>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{contact.major}</p>
        </div>
      </div>
      
      <div className="space-y-3 text-sm flex-grow">
        <div className="flex items-center text-gray-700 dark:text-gray-200">
          <Building2 size={16} className="mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span>{contact.department}</span>
        </div>
        <div className="flex items-center text-gray-700 dark:text-gray-200">
          <FileBadge size={16} className="mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span>{contact.contactId}</span>
        </div>
        <div className="flex items-center text-gray-700 dark:text-gray-200">
          <Mail size={16} className="mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()} className="hover:text-lyceum-blue hover:underline truncate">{contact.email}</a>
        </div>
        <div className="flex items-center text-gray-700 dark:text-gray-200">
          <Phone size={16} className="mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <a href={`tel:${contact.phone}`} onClick={(e) => e.stopPropagation()} className="hover:text-lyceum-blue">{contact.phone}</a>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 mt-5 border-t dark:border-gray-700 pt-4">
        <button className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Transcript</button>
        <button onClick={(e) => { e.stopPropagation(); onSelect(contact); }} className="px-3 py-1.5 text-xs font-semibold text-white bg-lyceum-blue rounded-md hover:bg-lyceum-blue-dark transition-colors">Profile</button>
      </div>
    </div>
  );
};

export default ContactCard;