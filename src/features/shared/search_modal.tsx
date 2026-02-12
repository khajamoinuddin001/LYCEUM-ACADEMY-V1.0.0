

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Contact as ContactIcon, Users as CrmIcon } from '@/components/common/icons';
import { ODOO_APPS } from '@/lib/constants';
import type { OdooApp, Contact, CrmLead } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  leads: CrmLead[];
  onResultSelect: (result: { type: string; id: any }) => void;
}

const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query.trim() || !text) {
    return text;
  }
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.filter(part => part).map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <strong key={i} className="font-semibold bg-lyceum-blue/10 dark:bg-lyceum-blue/20 rounded-sm text-lyceum-blue dark:text-lyceum-blue/90">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </span>
  );
};

interface CategorizedResults {
  apps: OdooApp[];
  contacts: Contact[];
  leads: CrmLead[];
}


const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, contacts, leads, onResultSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CategorizedResults>({ apps: [], contacts: [], leads: [] });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults({ apps: [], contacts: [], leads: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults({ apps: [], contacts: [], leads: [] });
    } else {
      const lowerQuery = query.toLowerCase();

      const filteredApps = ODOO_APPS.filter(app =>
        app.name.toLowerCase().includes(lowerQuery)
      );

      const filteredContacts = contacts.filter(contact =>
        (contact.name?.toLowerCase() || '').includes(lowerQuery) ||
        (contact.email?.toLowerCase() || '').includes(lowerQuery) ||
        (contact.contactId?.toLowerCase() || '').includes(lowerQuery)
      );

      const filteredLeads = leads.filter(lead =>
        (lead.title?.toLowerCase() || '').includes(lowerQuery) ||
        (lead.company?.toLowerCase() || '').includes(lowerQuery) ||
        (lead.contact?.toLowerCase() || '').includes(lowerQuery)
      );

      setResults({
        apps: filteredApps,
        contacts: filteredContacts,
        leads: filteredLeads
      });
    }
  }, [query, contacts, leads]);

  if (!isOpen) return null;

  const hasResults = results.apps.length > 0 || results.contacts.length > 0 || results.leads.length > 0;

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-start pt-20 animate-fade-in-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 transform transition-all duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            id="search-modal-title"
            type="text"
            placeholder="Search apps, contacts, leads..."
            className="w-full py-4 pl-12 pr-4 text-lg text-gray-800 dark:text-gray-100 bg-transparent border-0 rounded-t-lg focus:outline-none focus:ring-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label="Close search"
        >
          <X size={24} />
        </button>
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 max-h-[60vh] overflow-y-auto">
          {query.trim() === '' ? (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Search for applications, contacts, leads and more.</p>
          ) : hasResults ? (
            <ul>
              {results.apps.length > 0 && (
                <>
                  <li className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applications</li>
                  {results.apps.map(app => (
                    <li key={app.name}>
                      <button onClick={() => onResultSelect({ type: 'app', id: app.name })} className="flex items-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors w-full text-left">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${app.bgColor} dark:bg-opacity-20 mr-4 flex-shrink-0`}>
                          <span className={`${app.iconColor} w-6 h-6`}>{React.cloneElement(app.icon, { size: 24 })}</span>
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{highlightMatch(app.name, query)}</span>
                      </button>
                    </li>
                  ))}
                </>
              )}
              {results.contacts.length > 0 && (
                <>
                  <li className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contacts</li>
                  {results.contacts.map(contact => (
                    <li key={`contact-${contact.id}`}>
                      <button onClick={() => onResultSelect({ type: 'contact', id: contact.id })} className="flex items-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors w-full text-left">
                        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/50 mr-4 flex-shrink-0">
                          <ContactIcon size={24} className="text-yellow-600 dark:text-yellow-300" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{highlightMatch(contact.name, query)}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{highlightMatch(contact.email, query)}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </>
              )}
              {results.leads.length > 0 && (
                <>
                  <li className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leads</li>
                  {results.leads.map(lead => (
                    <li key={`lead-${lead.id}`}>
                      <button onClick={() => onResultSelect({ type: 'lead', id: lead.id })} className="flex items-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors w-full text-left">
                        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 mr-4 flex-shrink-0">
                          <CrmIcon size={24} className="text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{highlightMatch(lead.title, query)}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{highlightMatch(lead.company, query)}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </>
              )}
            </ul>
          ) : (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fade-in-fast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-fast {
          animation: fade-in-fast 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SearchModal;