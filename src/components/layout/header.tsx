

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Plus, MessageSquare, Activity, User, ChevronDown } from '@/components/common/icons';
import ProfileDropdown from './profile_dropdown';
import NotificationsDropdown from './notifications_dropdown';
import type { User as UserType, Notification as NotificationType } from '@/types';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeApp: string;
  onAppSelect: (appName: string) => void;
  onSearchClick: () => void;
  onQuickCreateClick: () => void;
  user: UserType;
  onLogout: () => void;
  notifications: NotificationType[];
  onMarkAllNotificationsAsRead: () => void;
  onNotificationClick: (link: { type: string, id: any }) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, activeApp, onAppSelect, onSearchClick, onQuickCreateClick, user, onLogout, notifications, onMarkAllNotificationsAsRead, onNotificationClick, notificationsOpen, setNotificationsOpen, darkMode, setDarkMode }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
    setNotificationsOpen(false);
  }

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    setProfileOpen(false);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-sm z-30 print:hidden">
      <div className="flex items-center justify-between p-2 md:p-3 h-14 md:h-16">
        <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
          {/* Hamburger menu - always visible, toggles sidebar */}
          <button
            onClick={() => {
              console.log('[Header] Hamburger clicked! sidebarOpen:', sidebarOpen, '-> will become:', !sidebarOpen);
              setSidebarOpen(!sidebarOpen);
            }}
            className="p-2 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring touch-manipulation flex-shrink-0"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>

          {/* Logo in Header */}
          {!sidebarOpen && (
            <div className="flex-shrink-0 w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm ml-1">
              <img src="/academy logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
          )}

          {/* App name - clickable to go back to Apps */}
          <button
            onClick={() => onAppSelect(user.role === 'Student' ? 'student_dashboard' : 'Apps')}
            className="px-2 py-1.5 md:px-3 md:py-2 text-sm md:text-base font-black text-lyceum-blue dark:text-lyceum-blue-light hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors truncate touch-manipulation tracking-tighter"
            title="Back to Apps"
          >
            {activeApp === 'student_dashboard' ? 'Student Portal' : (activeApp === 'Apps' ? 'lyceum' : activeApp)}
          </button>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user.role !== 'Student' && (
              <>
                <button onClick={onSearchClick} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring" aria-label="Search">
                  <Search size={20} />
                </button>

                <button onClick={onQuickCreateClick} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring" aria-label="Quick Create">
                  <Plus size={20} />
                </button>

                <button className="hidden sm:inline-flex p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring" aria-label="Messages">
                  <MessageSquare size={20} />
                </button>
              </>
            )}

            <div className="relative" ref={notificationsRef}>
              <button onClick={toggleNotifications} className="p-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring" aria-label="Notifications">
                <Activity size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>
              <NotificationsDropdown
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                notifications={notifications}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                onNotificationClick={onNotificationClick}
              />
            </div>
          </div>

          <div className="relative" ref={profileRef}>
            <button onClick={toggleProfile} className="flex items-center space-x-2 focus:outline-none focus:ring-2 ring-offset-2 ring-transparent ring-lyceum-blue rounded-full p-1" aria-label="User menu">
              <User size={28} className="text-gray-600 dark:text-gray-300 rounded-full bg-gray-200 dark:bg-gray-600 p-1" />
              <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">{user.name}</span>
              <ChevronDown size={16} className="hidden md:inline text-gray-500" />
            </button>
            <ProfileDropdown
              isOpen={profileOpen}
              onClose={() => setProfileOpen(false)}
              onNavigate={onAppSelect}
              onLogout={onLogout}
              user={user}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;