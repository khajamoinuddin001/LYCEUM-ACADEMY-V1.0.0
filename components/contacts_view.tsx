import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Contact, User } from '../types';
import { Search, Filter } from './icons';
import ContactCard from './student_card';

interface ContactsViewProps {
    contacts: Contact[];
    onNewContactClick: () => void;
    onContactSelect: (contact: Contact) => void;
    user: User;
}

const ContactsView: React.FC<ContactsViewProps> = ({ contacts, onNewContactClick, onContactSelect, user }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All Departments');
    const [majorFilter, setMajorFilter] = useState('All Majors');
    const [fileStatusFilter, setFileStatusFilter] = useState('All Statuses');
    const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    const allDepartments = useMemo(() => {
        const departments = new Set(contacts.map(s => s.department));
        return ['All Departments', ...Array.from(departments).sort()];
    }, [contacts]);

    const allMajors = useMemo(() => {
        const majors = new Set(contacts.map(s => s.major));
        return ['All Majors', ...Array.from(majors).sort()];
    }, [contacts]);

    const allFileStatuses = ['All Statuses', 'In progress', 'Closed', 'On hold', 'Not Set'];

    const activeFilterCount = [
        departmentFilter !== 'All Departments',
        majorFilter !== 'All Majors',
        fileStatusFilter !== 'All Statuses'
    ].filter(Boolean).length;


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClearFilters = () => {
        setDepartmentFilter('All Departments');
        setMajorFilter('All Majors');
        setFileStatusFilter('All Statuses');
        setIsFilterOpen(false);
    };

    const filteredAndSortedContacts = useMemo(() => {
        let filteredContacts = [...contacts];

        if (departmentFilter !== 'All Departments') {
            filteredContacts = filteredContacts.filter(
                contact => contact.department === departmentFilter
            );
        }

        if (majorFilter !== 'All Majors') {
            filteredContacts = filteredContacts.filter(
                contact => contact.major === majorFilter
            );
        }

        if (fileStatusFilter !== 'All Statuses') {
            if (fileStatusFilter === 'Not Set') {
                filteredContacts = filteredContacts.filter(
                    contact => !contact.fileStatus
                );
            } else {
                filteredContacts = filteredContacts.filter(
                    contact => contact.fileStatus === fileStatusFilter
                );
            }
        }

        const query = searchQuery.toLowerCase();
        if (query) {
            filteredContacts = filteredContacts.filter(contact =>
                Object.values(contact).some(value =>
                    String(value).toLowerCase().includes(query)
                )
            );
        }

        filteredContacts.sort((a, b) => a.name.localeCompare(b.name));

        return filteredContacts;
    }, [searchQuery, departmentFilter, majorFilter, fileStatusFilter, contacts]);

    const handleToggleSelectContact = (contactId: number) => {
        const newSelection = new Set(selectedContacts);
        if (newSelection.has(contactId)) {
            newSelection.delete(contactId);
        } else {
            newSelection.add(contactId);
        }
        setSelectedContacts(newSelection);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedContacts(new Set(filteredAndSortedContacts.map(s => s.id)));
        } else {
            setSelectedContacts(new Set());
        }
    };

    const isAllSelected = selectedContacts.size > 0 && selectedContacts.size === filteredAndSortedContacts.length;


    return (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Contacts</h1>
                {(user.role === 'Admin' || user.permissions?.['Contacts']?.create) && (
                    <button
                        onClick={onNewContactClick}
                        className="w-full md:w-auto px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue transition-colors"
                    >
                        New Contact
                    </button>
                )}
            </div>

            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <Filter size={16} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="bg-lyceum-blue text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        {isFilterOpen && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10 p-4 space-y-4 animate-fade-in-fast">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                                    <select
                                        value={departmentFilter}
                                        onChange={(e) => setDepartmentFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm"
                                    >
                                        {allDepartments.map(department => <option key={department} value={department}>{department}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Major</label>
                                    <select
                                        value={majorFilter}
                                        onChange={(e) => setMajorFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm"
                                    >
                                        {allMajors.map(major => <option key={major} value={major}>{major}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File Status</label>
                                    <select
                                        value={fileStatusFilter}
                                        onChange={(e) => setFileStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm"
                                    >
                                        {allFileStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </div>
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <button onClick={handleClearFilters} className="w-full text-sm text-lyceum-blue hover:underline">Clear all filters</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center mb-4">
                <input
                    type="checkbox"
                    id="select-all"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-lyceum-blue focus:ring-lyceum-blue"
                />
                <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select All
                </label>
            </div>

            {filteredAndSortedContacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredAndSortedContacts.map(contact => (
                        <ContactCard
                            key={contact.id}
                            contact={contact}
                            onSelect={onContactSelect}
                            isSelected={selectedContacts.has(contact.id)}
                            onToggleSelect={handleToggleSelectContact}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400">No contacts found matching your criteria.</p>
                </div>
            )}

            <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
             @keyframes fade-in-fast {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in {
                animation: fade-in 0.3s ease-out forwards;
            }
            .animate-fade-in-fast {
                animation: fade-in-fast 0.2s ease-out forwards;
            }
        `}</style>
        </div>
    );
};

export default ContactsView;