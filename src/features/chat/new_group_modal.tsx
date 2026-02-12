import React, { useState, useMemo, useEffect } from 'react';
import { X, Search } from '@/components/common/icons';
import type { User } from '@/types';
const avatarColors = [
    'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300', 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300', 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', 'bg-pink-200 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
    'bg-indigo-200 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300', 'bg-teal-200 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
];

const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash % avatarColors.length)];
};

const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

const UserAvatar: React.FC<{ name: string; size?: string }> = ({ name, size = "w-8 h-8" }) => {
    return <div className={`${size} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${getAvatarColor(name)}`}>{getInitials(name)}</div>;
};

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onCreateGroup: (name: string, memberIds: number[]) => void;
}

const NewGroupModal: React.FC<NewGroupModalProps> = ({ isOpen, onClose, users, currentUser, onCreateGroup }) => {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setGroupName('');
            setSelectedUserIds(new Set());
            setSearchTerm('');
            setError('');
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsAnimatingOut(false);
            onClose();
        }, 200);
    };

    const handleToggleUser = (userId: number) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleCreate = () => {
        setError('');
        if (!groupName.trim()) {
            setError('Group name is required.');
            return;
        }
        if (selectedUserIds.size < 1) {
            setError('You must select at least one other member for the group.');
            return;
        }
        onCreateGroup(groupName.trim(), Array.from(selectedUserIds));
        handleClose();
    };

    const availableUsers = useMemo(() =>
        users.filter(u =>
            u.id !== currentUser.id && u.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [users, currentUser.id, searchTerm]
    );
    
    if (!isOpen) return null;

    const animationClass = isAnimatingOut ? 'animate-fade-out-fast' : 'animate-fade-in-fast';
    const modalAnimationClass = isAnimatingOut ? 'animate-scale-out' : 'animate-scale-in';

    return (
        <div
            className={`fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 ${animationClass}`}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-group-title"
        >
            <div
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-200 ease-in-out flex flex-col ${modalAnimationClass}`}
                style={{ maxHeight: '80vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="new-group-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        Create New Group
                    </h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                        <input
                            type="text"
                            id="group-name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                            placeholder="e.g., Project Team"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Members ({selectedUserIds.size})</label>
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                        {availableUsers.length > 0 ? availableUsers.map(user => (
                            <label key={user.id} htmlFor={`user-${user.id}`} className="flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b dark:border-gray-700 last:border-b-0">
                                <input
                                    id={`user-${user.id}`}
                                    type="checkbox"
                                    checked={selectedUserIds.has(user.id)}
                                    onChange={() => handleToggleUser(user.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-lyceum-blue focus:ring-lyceum-blue"
                                />
                                <UserAvatar name={user.name} />
                                <span className="ml-3 text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</span>
                            </label>
                        )) : <p className="p-4 text-sm text-center text-gray-500">No users found.</p>}
                    </div>
                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>
                <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                    <button type="button" onClick={handleClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium">Cancel</button>
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedUserIds.size === 0}
                        className="ml-3 px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark disabled:bg-gray-400"
                    >
                        Create Group
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

export default NewGroupModal;