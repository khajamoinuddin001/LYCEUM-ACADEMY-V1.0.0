
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, isPositive, icon, iconBgColor, iconColor }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center space-x-4 h-full">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className="flex items-baseline space-x-2">
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
          {change && (
            <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {isPositive ? '▲' : '▼'} {change}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
