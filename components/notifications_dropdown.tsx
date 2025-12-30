import React from 'react';
import type { Notification as NotificationType } from '../types';

const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationType[];
  onMarkAllAsRead: () => void;
  onNotificationClick: (link: { type: string, id: any }) => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ isOpen, onClose, notifications, onMarkAllAsRead, onNotificationClick }) => {
  if (!isOpen) return null;

  const handleNotificationClick = (notification: NotificationType) => {
    if (notification.linkTo) {
      onNotificationClick({ type: notification.linkTo.type, id: notification.linkTo.id });
    }
    onClose();
  };

  return (
    <div
      className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 ring-1 ring-black dark:ring-white/10 ring-opacity-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-title"
    >
        <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 id="notifications-title" className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
            <button onClick={onMarkAllAsRead} className="text-xs text-lyceum-blue hover:underline">Mark all as read</button>
        </div>
        <div className="py-1 max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
                notifications.map(notification => (
                    <button 
                        key={notification.id} 
                        onClick={() => handleNotificationClick(notification)}
                        className={`block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${!notification.read ? 'bg-lyceum-blue/5 dark:bg-lyceum-blue/10' : ''}`}
                    >
                        <div className="flex justify-between items-start">
                             <p className="font-medium">{notification.title}</p>
                             {!notification.read && <div className="w-2 h-2 rounded-full bg-lyceum-blue mt-1.5 flex-shrink-0 ml-2"></div>}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{notification.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatTimeAgo(notification.timestamp)}</p>
                    </button>
                ))
            ) : (
                <div className="p-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">You have no notifications.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default NotificationsDropdown;