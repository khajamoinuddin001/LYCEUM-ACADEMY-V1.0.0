import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Contact, User } from '../types';
import { Search, Filter, MoreHorizontal } from './icons';
import ContactCard from './student_card';
import * as api from '../utils/api';

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [primaryContact, setPrimaryContact] = useState<Contact | null>(null);
    const [targetContact, setTargetContact] = useState<Contact | null>(null);
    const [isMerging, setIsMerging] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

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
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
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

    const handleMergeClick = () => {
        setShowMergeModal(true);
        setIsMenuOpen(false);
    };

    const handleMergeConfirm = async () => {
        if (!primaryContact || !targetContact) {
            alert('Please select both primary and target contacts');
            return;
        }

        setIsMerging(true);
        try {
            const result = await api.mergeContacts(primaryContact.id, targetContact.id);
            alert(`Merge successful! Updated ${result.recordsUpdated.visitors} visitors, ${result.recordsUpdated.transactions} transactions, ${result.recordsUpdated.leads} leads.`);
            setShowMergeModal(false);
            setPrimaryContact(null);
            setTargetContact(null);
            window.location.reload(); // Refresh to show updated contacts
        } catch (error: any) {
            alert(`Merge failed: ${error.message}`);
        } finally {
            setIsMerging(false);
        }
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
                <div className="flex items-center gap-2">
                    {(user.role === 'Admin' || user.permissions?.['Contacts']?.create) && (
                        <button
                            onClick={onNewContactClick}
                            className="w-full md:w-auto px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue transition-colors"
                        >
                            New Contact
                        </button>
                    )}
                    {(user.role === 'Admin' || user.permissions?.['Contacts']?.update) && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                                <MoreHorizontal size={20} className="text-gray-600 dark:text-gray-300" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10 py-1">
                                    <button
                                        onClick={handleMergeClick}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Merge Contact
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
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

            {/* Merge Contact Modal */}
            {showMergeModal && (
                <div
                    className="fixed inset-0 flex items-center justify-center p-4"
                    style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={(e) => {
                        // Close modal if clicking on backdrop
                        if (e.target === e.currentTarget) {
                            setShowMergeModal(false);
                            setPrimaryContact(null);
                            setTargetContact(null);
                        }
                    }}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Merge Contacts</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                            Select two contacts to merge. The primary contact will be kept and the target contact will be deleted after merging all data.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Contact (Keep)</label>
                                <select
                                    value={primaryContact?.id || ''}
                                    onChange={(e) => setPrimaryContact(contacts.find(c => c.id === parseInt(e.target.value)) || null)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Select contact...</option>
                                    {contacts.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.email ? `(${c.email})` : c.phone ? `(${c.phone})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {primaryContact && (
                                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                        <p className="font-semibold">{primaryContact.name}</p>
                                        {primaryContact.email && <p>Email: {primaryContact.email}</p>}
                                        {primaryContact.phone && <p>Phone: {primaryContact.phone}</p>}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Contact (Merge & Delete)</label>
                                <select
                                    value={targetContact?.id || ''}
                                    onChange={(e) => setTargetContact(contacts.find(c => c.id === parseInt(e.target.value)) || null)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Select contact...</option>
                                    {contacts.filter(c => c.id !== primaryContact?.id).map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.email ? `(${c.email})` : c.phone ? `(${c.phone})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {targetContact && (
                                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                                        <p className="font-semibold">{targetContact.name}</p>
                                        {targetContact.email && <p>Email: {targetContact.email}</p>}
                                        {targetContact.phone && <p>Phone: {targetContact.phone}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4 mb-6">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                <strong>Warning:</strong> This action cannot be undone. All data from the target contact will be merged into the primary contact, and the target contact will be deleted.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowMergeModal(false);
                                    setPrimaryContact(null);
                                    setTargetContact(null);
                                }}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                disabled={isMerging}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMergeConfirm}
                                disabled={!primaryContact || !targetContact || isMerging}
                                className="px-4 py-2 bg-lyceum-blue text-white rounded hover:bg-lyceum-blue-dark transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isMerging ? 'Merging...' : 'Confirm Merge'}
                            </button>
                        </div>
                    </div>
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