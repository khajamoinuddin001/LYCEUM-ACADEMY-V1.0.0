import { useState } from 'react';
import type { Notification, User } from '../types';
export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    };

    const markAllAsRead = (currentUser: User) => {
    };

    return { notifications, setNotifications, addNotification, markAllAsRead };
};
