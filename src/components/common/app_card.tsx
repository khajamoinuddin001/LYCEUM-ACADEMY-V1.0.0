import React from 'react';
import type { OdooApp } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AppCardProps {
  app: OdooApp;
  onAppSelect: (appName: string) => void;
}

const AppCard: React.FC<AppCardProps> = ({ app, onAppSelect }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1, // Lower opacity when dnd-kit is dragging
  };

  const handleNativeDragStart = (e: React.DragEvent) => {
    // This allows the Sidebar (which uses native DnD) to receive the app data
    const data = JSON.stringify({ name: app.name, type: 'APP_GRID_ITEM' });
    e.dataTransfer.setData('application/json', data);
    e.dataTransfer.setData('text/plain', app.name); // Fallback
    e.dataTransfer.effectAllowed = 'copyMove';

    // Create a custom drag preview
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    e.dataTransfer.setDragImage(canvas, 32, 32);
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      draggable
      onDragStart={handleNativeDragStart}
      onClick={() => !isDragging && onAppSelect(app.name)}
      className={`group flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg dark:hover:bg-gray-700/60 transition-shadow duration-300 transform w-full h-full text-left cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-2xl scale-105 ring-2 ring-blue-500' : ''}`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${app.bgColor} dark:bg-opacity-20 mb-3 transition-transform duration-300 group-hover:scale-110`}>
        <span className={app.iconColor}>{app.icon}</span>
      </div>
      <p className="text-gray-700 dark:text-gray-300 font-medium text-center text-sm">{app.name}</p>
    </button>
  );
};

export default AppCard;