import React from 'react';
import {
  MessagesSquare,
  Calendar,
  Contact,
  Cog,
  ChevronLeft,
  LayoutGrid,
  BarChart3,
  Users,
  FileText,
  UserCircle,
  LogOut,
  ClipboardList,
  ConciergeBell,
  BookOpen,
  UserCheck
} from './icons';
import type { User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeApp: string;
  onAppSelect: (appName: string) => void;
  isMobile: boolean;
  user: User;
  onLogout: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-lg transition-colors w-full text-left ${active ? 'bg-lyceum-blue text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    aria-current={active ? 'page' : undefined}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </button>
);

const allStaffNavItems = [
  { name: 'Apps', icon: <LayoutGrid size={20} /> },
  { name: 'dashboard', icon: <BarChart3 size={20} /> },
  { name: 'Discuss', icon: <MessagesSquare size={20} /> },
  { name: 'Calendar', icon: <Calendar size={20} /> },
  { name: 'Contacts', icon: <Contact size={20} /> },
  { name: 'CRM', icon: <Users size={20} /> },
  { name: 'Agents', icon: <UserCheck size={20} /> },
  { name: 'Accounting', icon: <FileText size={20} /> },
  { name: 'To-do', icon: <ClipboardList size={20} /> },
  { name: 'Reception', icon: <ConciergeBell size={20} /> },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activeApp, onAppSelect, isMobile, user, onLogout }) => {
  const sidebarClasses = `
    bg-white dark:bg-gray-900 shadow-lg z-50 h-full transition-all duration-300 ease-in-out print:hidden
    ${isMobile
      ? `fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}`
      : `relative flex-shrink-0 ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`
    }
  `;

  const renderNavItems = () => {
    if (user.role === 'Student') {
      return (
        <>
          <NavItem icon={<BarChart3 size={20} />} label="dashboard" active={activeApp === 'student_dashboard'} onClick={() => onAppSelect('student_dashboard')} />
          <NavItem icon={<BookOpen size={20} />} label="LMS" active={activeApp === 'LMS'} onClick={() => onAppSelect('LMS')} />
          <NavItem icon={<UserCircle size={20} />} label="My Profile" active={activeApp === 'Profile'} onClick={() => onAppSelect('Profile')} />
        </>
      );
    }

    const userPermissions = user.permissions || {};
    const visibleNavItems = allStaffNavItems.filter(item =>
      item.name === 'Apps' || user.role === 'Admin' || userPermissions[item.name]
    );

    return (
      <>
        {visibleNavItems.map(item => (
          <NavItem
            key={item.name}
            icon={item.icon}
            label={item.name}
            active={activeApp === item.name}
            onClick={() => onAppSelect(item.name)}
          />
        ))}
      </>
    );
  };

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      <div className={sidebarClasses} role="navigation">
        <div className="flex flex-col h-full p-2">
          <div className="flex items-center justify-between p-3 mb-4">
            <button onClick={() => onAppSelect(user.role === 'Student' ? 'student_dashboard' : 'Apps')} className="text-2xl font-bold text-lyceum-blue dark:text-lyceum-blue/90 focus:outline-none">lyceum</button>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-lyceum-blue dark:hover:text-lyceum-blue">
              <ChevronLeft size={24} />
            </button>
          </div>
          <nav className="flex-grow">
            {renderNavItems()}
          </nav>
          <div className="mt-auto p-2 border-t border-gray-200 dark:border-gray-700">
            {user.permissions?.['Settings'] && (
              <NavItem icon={<Cog size={20} />} label="Settings" active={activeApp === 'Settings'} onClick={() => onAppSelect('Settings')} />
            )}
            <NavItem icon={<LogOut size={20} />} label="Sign Out" onClick={onLogout} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;