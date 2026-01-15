
import React from 'react';
import type { User } from '../types';

interface WelcomeHeaderProps {
    yes
    user: User;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ user }) => {
    const [date] = React.useState(new Date());

    const getGreeting = () => {
        const hour = date.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{getGreeting()}, {user.name}!</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
                Here's what's happening with your academy today.
            </p>
        </div>
    );
};

export default WelcomeHeader;
