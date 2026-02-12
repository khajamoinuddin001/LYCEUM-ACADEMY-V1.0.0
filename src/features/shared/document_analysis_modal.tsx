import React, { useState, useEffect } from 'react';
import { X, Sparkles } from '@/components/common/icons';
import type { DocumentAnalysisResult } from '@/types';

interface DocumentAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (result: DocumentAnalysisResult) => void;
  result: DocumentAnalysisResult | null;
  documentName: string;
}

const DocumentAnalysisModal: React.FC<DocumentAnalysisModalProps> = ({ isOpen, onClose, onApply, result, documentName }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  };

  if (!isOpen) return null;

  const animationClass = isAnimatingOut ? 'animate-fade-out-fast' : 'animate-fade-in-fast';
  const modalAnimationClass = isAnimatingOut ? 'animate-scale-out' : 'animate-scale-in';

  return (
    <div
      className={`fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 ${animationClass}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="analysis-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Sparkles size={20} className="text-lyceum-blue mr-3" />
            <h2 id="analysis-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              AI Analysis Results
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Analysis for: <span className="font-medium text-gray-700 dark:text-gray-300">{documentName}</span></p>
            {result ? (
                <dl className="space-y-3">
                    {Object.entries(result).map(([key, value]) => (
                        <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <dt className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{key}</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                {Array.isArray(value) ? (
                                    <ul className="list-disc list-inside">
                                        {value.map((item, index) => <li key={index}>{item}</li>)}
                                    </ul>
                                ) : (
                                    value
                                )}
                            </dd>
                        </div>
                    ))}
                </dl>
            ) : (
                <p>No analysis results to display.</p>
            )}
        </div>
        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <button 
            type="button" 
            onClick={handleClose}
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Close
          </button>
          <button 
            type="button"
            onClick={() => result && onApply(result)}
            className="ml-3 px-4 py-2 bg-lyceum-blue border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-lyceum-blue-dark"
          >
            Apply to Notes
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-out-fast { from { opacity: 1; } to { opacity: 0; } }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
        .animate-fade-out-fast { animation: fade-out-fast 0.2s ease-in forwards; }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes scale-out { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
        .animate-scale-out { animation: scale-out 0.2s ease-in forwards; }
      `}</style>
    </div>
  );
};

export default DocumentAnalysisModal;