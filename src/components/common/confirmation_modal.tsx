import React from 'react';
import { X, Trash2, AlertTriangle } from '@/components/common/icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-[9999] flex justify-center items-center p-4 animate-fade-in-fast" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {isDestructive && <AlertTriangle className="text-amber-500" size={20} />}
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 gap-3">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            type="button"
            onClick={async () => {
              await onConfirm();
              onClose();
            }} 
            className={`px-4 py-2 rounded-md text-sm font-semibold text-white shadow-sm transition-all active:scale-95 ${
              isDestructive 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-lyceum-blue hover:bg-lyceum-blue-dark'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
