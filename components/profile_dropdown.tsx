import React from 'react';
import type { User } from '../types';
import { Sun, Moon } from './icons';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (appName: string) => void;
  onLogout: () => void;
  user: User;
  darkMode: boolean;
  setDarkMode: (value: boolean | ((val: boolean) => boolean)) => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, onNavigate, onLogout, user, darkMode, setDarkMode }) => {
  if (!isOpen) return null;

  const handleNavigate = (appName: string) => {
    onNavigate(appName);
    onClose();
  };
  
  const handleDarkModeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDarkMode(prev => !prev);
  };

  return (
    <div
      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 ring-1 ring-black dark:ring-white/10 ring-opacity-5"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button"
    >
      <div className="px-4 py-2">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
      <button onClick={() => handleNavigate('Profile')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
        My Profile
      </button>
      {user.permissions?.['Settings'] && (
        <button onClick={() => handleNavigate('Settings')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
          Settings
        </button>
      )}
      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
      <div className="px-4 py-2" role="menuitem">
        <div className="flex items-center justify-between">
            <label htmlFor="dark-mode-toggle" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Dark Mode
            </label>
            <button
                id="dark-mode-toggle"
                onClick={handleDarkModeToggle}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-lyceum-blue ${
                    darkMode ? 'bg-lyceum-blue' : 'bg-gray-200 dark:bg-gray-600'
                }`}
                aria-pressed={darkMode}
                aria-label="Toggle dark mode"
            >
                <span className="sr-only">Enable dark mode</span>
                <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
      <button onClick={onLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
        Log out
      </button>
    </div>
  );
};

export default ProfileDropdown;