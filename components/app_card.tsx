

import React from 'react';
import type { OdooApp } from '../types';

interface AppCardProps {
  app: OdooApp;
  onAppSelect: (appName: string) => void;
}

const AppCard: React.FC<AppCardProps> = ({ app, onAppSelect }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ name: app.name, type: 'APP_GRID_ITEM' }));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
    <button
      onClick={() => onAppSelect(app.name)}
      draggable
      onDragStart={handleDragStart}
      className="group flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg dark:hover:bg-gray-700/60 transition-shadow duration-300 transform hover:-translate-y-1 w-full h-full text-left cursor-grab active:cursor-grabbing"
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${app.bgColor} dark:bg-opacity-20 mb-3 transition-transform duration-300 group-hover:scale-110`}>
        <span className={app.iconColor}>{app.icon}</span>
      </div>
      <p className="text-gray-700 dark:text-gray-300 font-medium text-center text-sm">{app.name}</p>
    </button>
  );
};

export default AppCard;