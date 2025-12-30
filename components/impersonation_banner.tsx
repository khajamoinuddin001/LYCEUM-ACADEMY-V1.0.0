import React from 'react';
import { X } from './icons';

interface ImpersonationBannerProps {
  userName: string;
  onStop: () => void;
}

const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({ userName, onStop }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 px-4 py-2 flex items-center justify-center text-sm font-semibold z-[100]">
      <span>You are currently impersonating <strong>{userName}</strong>.</span>
      <button 
        onClick={onStop} 
        className="ml-4 flex items-center bg-yellow-500 hover:bg-yellow-600 text-yellow-900 px-3 py-1 rounded-md text-xs transition-colors"
        aria-label="Stop impersonating"
      >
        <X size={14} className="mr-1" />
        Stop Impersonating
      </button>
    </div>
  );
};

export default ImpersonationBanner;
