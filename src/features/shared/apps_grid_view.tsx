import React from 'react';
import AppCard from '@/components/common/app_card';
import { ODOO_APPS } from '@/lib/constants';
import type { User } from '@/types';

interface AppsGridViewProps {
  onAppSelect: (appName: string) => void;
  user: User;
}

const AppsGridView: React.FC<AppsGridViewProps> = ({ onAppSelect, user }) => {
  const availableApps = ODOO_APPS.filter(app => user.role === 'Admin' || app.name in (user.permissions || {}));

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Applications</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-6">
        {availableApps.map((app, index) => (
          <AppCard key={index} app={app} onAppSelect={onAppSelect} />
        ))}
      </div>
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