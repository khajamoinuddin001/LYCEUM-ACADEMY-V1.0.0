import React, { useState, useEffect } from 'react';
import { X, Sparkles } from '@/components/common/icons';

interface AIEmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
  draft: string;
  contactName: string;
}

const AIEmailComposerModal: React.FC<AIEmailComposerModalProps> = ({ isOpen, onClose, onGenerate, draft, contactName }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    if (draft === 'Generating...') {
      setIsDrafting(true);
    } else {
      setIsDrafting(false);
    }
  }, [draft]);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  };

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(draft);
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
      aria-labelledby="ai-email-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all duration-200 ease-in-out ${modalAnimationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Sparkles size={20} className="text-lyceum-blue mr-3" />
            <h2 id="ai-email-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              AI Email Assistant
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
        <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {}
          <div>
            <label htmlFor="email-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              What should this email be about?
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              The AI will use context about <span className="font-semibold">{contactName}</span> to draft the email.
            </p>
            <textarea
              id="email-prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Remind them about their missing transcript"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isDrafting}
              className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark disabled:bg-gray-400"
            >
              <Sparkles size={16} className="mr-2" />
              {isDrafting ? 'Generating...' : 'Generate Draft'}
            </button>
          </div>
          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Generated Draft</label>
            <div className="h-48 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700 text-sm whitespace-pre-wrap overflow-y-auto">
              {isDrafting ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
              ) : (
                draft
              )}
            </div>
            <button
              onClick={handleCopyToClipboard}
              disabled={isDrafting || !draft || draft.startsWith('Error:')}
              className="mt-3 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <button type="button" onClick={handleClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIEmailComposerModal;