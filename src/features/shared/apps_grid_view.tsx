import React from 'react';
import AppCard from '@/components/common/app_card';
import type { User, OdooApp } from '@/types';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SensorContext, SensorDescriptor, SensorOptions } from '@dnd-kit/core';

interface AppsGridViewProps {
  onAppSelect: (appName: string) => void;
  user: User;
  apps: OdooApp[];
}

const AppsGridView: React.FC<AppsGridViewProps> = ({ onAppSelect, user, apps }) => {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Applications</h1>

      <SortableContext items={apps.map(app => app.name)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-6">
          {apps.map((app) => (
            <AppCard
              key={app.name}
              app={app}
              onAppSelect={onAppSelect}
            />
          ))}
        </div>
      </SortableContext>

      <style>{`
          @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
          }
      `}</style>
    </div>
  );
};

export default AppsGridView;