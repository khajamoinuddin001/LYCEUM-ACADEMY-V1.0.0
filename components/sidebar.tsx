import React, { useState, useEffect } from 'react';
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
  UserCheck,
  Trash2
} from './icons';
import type { User, OdooApp } from '../types';
import { ODOO_APPS as ALL_ODOO_APPS } from './constants';

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

const NavItem: React.FC<NavItemProps & { draggable?: boolean; onDragStart?: (e: React.DragEvent) => void; onDragOver?: (e: React.DragEvent) => void; onDrop?: (e: React.DragEvent) => void; onDragEnd?: (e: React.DragEvent) => void }> = ({ icon, label, active, onClick, draggable, onDragStart, onDragOver, onDrop, onDragEnd }) => (
  <button
    onClick={onClick}
    draggable={draggable}
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDrop={onDrop}
    onDragEnd={onDragEnd}
    className={`flex items-center p-3 my-1 rounded-lg transition-colors w-full text-left cursor-pointer ${active ? 'bg-lyceum-blue text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      } ${draggable ? 'active:cursor-grabbing' : ''}`}
    aria-current={active ? 'page' : undefined}
  >
    <div className={`transition-transform ${active ? 'scale-110' : ''}`}>{icon}</div>
    <span className="ml-4 font-medium tracking-wide">{label}</span>
  </button>
);

const DEFAULT_STAFF_NAV = [
  { name: 'Apps', icon: <LayoutGrid size={20} /> },
  { name: 'dashboard', icon: <BarChart3 size={20} /> },
  { name: 'Discuss', icon: <MessagesSquare size={20} /> },
  { name: 'Calendar', icon: <Calendar size={20} /> },
  { name: 'Contacts', icon: <Contact size={20} /> },
  { name: 'CRM', icon: <Users size={20} /> },
  { name: 'Agents', icon: <UserCheck size={20} /> },
  { name: 'Accounting', icon: <FileText size={20} /> },
  { name: 'Tasks', icon: <ClipboardList size={20} /> },
  { name: 'Reception', icon: <ConciergeBell size={20} /> },
];

const DEFAULT_STUDENT_NAV = [
  { name: 'student_dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
  { name: 'Apps', label: 'Apps', icon: <LayoutGrid size={20} /> },
  { name: 'LMS', label: 'LMS', icon: <BookOpen size={20} /> },
  { name: 'Tickets', label: 'Tickets', icon: <FileText size={20} /> },
  { name: 'My Profile', label: 'My Profile', icon: <UserCircle size={20} /> },
];

const getAppMetadata = (name: string): OdooApp | undefined => {
  return ALL_ODOO_APPS.find(app => app.name === name);
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activeApp, onAppSelect, isMobile, user, onLogout }) => {
  const [navItems, setNavItems] = useState<any[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [isOverSidebar, setIsOverSidebar] = useState(false);

  // Apps that cannot be removed from sidebar
  const PROTECTED_APPS = [
    'Apps', 'dashboard', 'student_dashboard', 'My Profile'
  ];

  useEffect(() => {
    const storageKey = `sidebar_order_${user.id}`;
    const savedOrder = localStorage.getItem(storageKey);
    const defaults = user.role === 'Student' ? DEFAULT_STUDENT_NAV : DEFAULT_STAFF_NAV;

    if (savedOrder) {
      try {
        const orderNames = JSON.parse(savedOrder);
        const reordered = orderNames.map((name: string) => {
          // Find in defaults first to get custom labels if any
          const inDefault = defaults.find(item => (item.name || (item as any).label) === name);
          if (inDefault) return inDefault;

          // Otherwise look in ODOO_APPS
          const meta = getAppMetadata(name);
          if (meta) {
            return {
              name: meta.name,
              icon: React.cloneElement(meta.icon as React.ReactElement, { size: 20 })
            };
          }
          return null;
        }).filter(Boolean);

        // Add any missing "permanent" items if they were accidentally removed
        const missingPermanent = defaults.filter(item =>
          PROTECTED_APPS.includes(item.name || (item as any).label) &&
          !orderNames.includes(item.name || (item as any).label)
        );

        setNavItems([...reordered, ...missingPermanent]);
      } catch (e) {
        setNavItems(defaults);
      }
    } else {
      setNavItems(defaults);
    }
  }, [user.id, user.role]);

  const saveOrder = (items: any[]) => {
    const storageKey = `sidebar_order_${user.id}`;
    const orderNames = items.map(item => item.name || item.label);
    localStorage.setItem(storageKey, JSON.stringify(orderNames));
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
    setIsDraggingAny(true);
  };

  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    setIsOverSidebar(true);
    if (draggedItem === null || index === undefined || draggedItem === index) return;

    const items = [...navItems];
    const item = items[draggedItem];
    items.splice(draggedItem, 1);
    items.splice(index, 0, item);
    setNavItems(items);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setIsDraggingAny(false);
    setIsOverTrash(false);
    setIsOverSidebar(false);
    saveOrder(navItems);
  };

  const handleSidebarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverSidebar(false);
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    try {
      const { name, type } = JSON.parse(dataStr);
      if (type === 'APP_GRID_ITEM') {
        // Check if already in sidebar
        if (navItems.find(item => (item.name || item.label) === name)) return;

        const meta = getAppMetadata(name);
        if (meta) {
          const newItem = {
            name: meta.name,
            icon: React.cloneElement(meta.icon as React.ReactElement, { size: 20 })
          };
          const updatedItems = [...navItems, newItem];
          setNavItems(updatedItems);
          saveOrder(updatedItems);
        }
      }
    } catch (err) {
      console.error('Failed to handle drop:', err);
    }
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem !== null) {
      const items = [...navItems];
      const removedItem = items[draggedItem];

      // Prevent removing core apps
      if (PROTECTED_APPS.includes(removedItem.name || removedItem.label)) {
        return;
      }

      items.splice(draggedItem, 1);
      setNavItems(items);
      saveOrder(items);
    }
    setIsOverTrash(false);
    setIsDraggingAny(false);
  };

  const sidebarClasses = `
    bg-white dark:bg-gray-900 shadow-xl z-50 h-full transition-all duration-300 ease-in-out print:hidden border-r border-gray-200 dark:border-gray-800
    ${isMobile
      ? `fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}`
      : `relative flex-shrink-0 min-w-0 ${isOpen ? 'w-64' : 'w-0'}`
    }
    ${isOverSidebar ? 'ring-2 ring-inset ring-lyceum-blue/30' : ''}
  `;
  console.log('[Sidebar] isOpen:', isOpen, 'isMobile:', isMobile, 'classes:', isOpen ? 'w-64' : 'w-0');

  const renderNavItems = () => {
    if (user.role === 'Student') {
      return navItems.map((item, index) => (
        <NavItem
          key={item.name || item.label}
          icon={item.icon}
          label={item.label || item.name}
          active={activeApp === item.name}
          onClick={() => onAppSelect(item.name)}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
        />
      ));
    }

    const userPermissions = user.permissions || {};
    const visibleNavItems = navItems.filter(item =>
      item.name === 'Apps' || user.role === 'Admin' || userPermissions[item.name]
    );

    return visibleNavItems.map((item, index) => (
      <NavItem
        key={item.name}
        icon={item.icon}
        label={item.name}
        active={activeApp === item.name}
        onClick={() => onAppSelect(item.name)}
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
      />
    ));
  };

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        ></div>
      )}
      <div
        className={sidebarClasses}
        role="navigation"
        onDragOver={(e) => { e.preventDefault(); setIsOverSidebar(true); }}
        onDragLeave={() => setIsOverSidebar(false)}
        onDrop={handleSidebarDrop}
        style={{ overflow: isOpen ? 'visible' : 'hidden' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 mb-2">
            <button
              onClick={() => onAppSelect(user.role === 'Student' ? 'student_dashboard' : 'Apps')}
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm group-hover:rotate-6 transition-transform">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-lyceum-blue to-blue-600 tracking-tighter">
                lyceum
              </span>
            </button>
            <button
              onClick={() => {
                console.log('[Sidebar] Arrow clicked! isOpen:', isOpen, '-> will become:', !isOpen);
                setIsOpen(!isOpen);
              }}
              className="text-gray-400 hover:text-lyceum-blue transition-all duration-300 rounded-lg p-1 hover:scale-110"
              aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <ChevronLeft size={24} className={`transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <nav className="flex-grow px-3 overflow-y-auto custom-scrollbar">
            {renderNavItems()}

            {isDraggingAny && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsOverTrash(true); }}
                onDragLeave={() => setIsOverTrash(false)}
                onDrop={handleTrashDrop}
                className={`mt-4 p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${isOverTrash
                  ? 'bg-red-50 border-red-500 text-red-600 scale-105'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 text-gray-400'
                  }`}
              >
                <Trash2 size={24} className={isOverTrash ? 'animate-bounce' : ''} />
                <span className="mt-2 text-xs font-semibold uppercase tracking-wider">Drop to Remove</span>
              </div>
            )}
          </nav>
          <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            {(user.role === 'Admin' || user.permissions?.['Settings']) && (
              <NavItem icon={<Cog size={20} />} label="Settings" active={activeApp === 'Settings'} onClick={() => onAppSelect('Settings')} />
            )}
            <NavItem icon={<LogOut size={20} />} label="Sign Out" onClick={onLogout} />
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </>
  );
};

export default Sidebar;