import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, IndianRupee, Cog } from '@/components/common/icons';
import type { QuotationTemplate, QuotationLineItem } from '@/types';

interface QuotationTemplateModalProps {
  template: QuotationTemplate | null;
  onClose: () => void;
  onSave: (template: QuotationTemplate) => void;
  userRole?: string;
}

const DOCUMENT_CATEGORIES = [
  'Passport', 'Educational Documents', 'Financial Document & Affidavit of Support / CA Report & ITR\'s',
  'Gap Justification', 'Acceptance', 'I20', 'DS-160', 'SEVIS confirmation', 'Appointment Confirmation', 'University Affidavit Forms', 'Other'
];

const QuotationTemplateModal: React.FC<QuotationTemplateModalProps> = ({ template, onClose, onSave, userRole }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lineItems, setLineItems] = useState<Partial<QuotationLineItem>[]>([{
    description: '', price: 0, linkedDocumentCategories: [], unlockThresholdType: 'Full', unlockThresholdAmount: 0
  }]);
  const [error, setError] = useState('');
  const [expandedSettingsIndex, setExpandedSettingsIndex] = useState<number | null>(null);

  const isNew = !template;

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description);
      setLineItems(template.lineItems.length > 0 ? template.lineItems.map(item => ({
        ...item,
        linkedDocumentCategories: item.linkedDocumentCategories || [],
        unlockThresholdType: item.unlockThresholdType || 'Full',
        unlockThresholdAmount: item.unlockThresholdAmount || 0
      })) : [{ description: '', price: 0, linkedDocumentCategories: [], unlockThresholdType: 'Full', unlockThresholdAmount: 0 }]);
    } else {
      setTitle('');
      setDescription('');
      setLineItems([{ description: '', price: 0, linkedDocumentCategories: [], unlockThresholdType: 'Full', unlockThresholdAmount: 0 }]);
    }
    setError('');
  }, [template]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  };

  const handleLineItemChange = (index: number, field: keyof QuotationLineItem, value: string | number | string[] | boolean) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value } as Partial<QuotationLineItem>;
    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', price: 0, isDocumentUnlockEnabled: false, linkedDocumentCategories: [], unlockThresholdType: 'Full', unlockThresholdAmount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      const newItems = lineItems.filter((_, i) => i !== index);
      setLineItems(newItems);
    }
  };

  const calculateTotal = () => {
    return lineItems.reduce((total, item) => total + (Number(item.price) || 0), 0);
  };

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    const finalLineItems = lineItems
      .filter(item => item.description?.trim() && (Number(item.price) || 0) > 0)
      .map(item => ({
        description: item.description!,
        price: Number(item.price),
        isDocumentUnlockEnabled: item.isDocumentUnlockEnabled || false,
        linkedDocumentCategories: item.linkedDocumentCategories || [],
        unlockThresholdType: item.unlockThresholdType || 'Full',
        unlockThresholdAmount: item.unlockThresholdAmount || 0
      }));

    if (finalLineItems.length === 0) {
      setError('At least one valid line item is required.');
      return;
    }

    const total = finalLineItems.reduce((sum, item) => sum + item.price, 0);

    const templateToSave: QuotationTemplate = {
      id: template?.id || 0,
      title,
      description,
      lineItems: finalLineItems,
      total,
    };
    onSave(templateToSave);
  };

  if (!isAnimatingOut && !template && !isNew) return null;

  const animationClass = isAnimatingOut ? 'animate-fade-out-fast' : 'animate-fade-in-fast';
  const modalAnimationClass = isAnimatingOut ? 'animate-scale-out' : 'animate-scale-in';

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div
      className={`fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 ${animationClass}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all duration-200 ease-in-out flex flex-col ${modalAnimationClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="template-modal-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {isNew ? 'New Quotation Template' : 'Edit Quotation Template'}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label htmlFor="template-title" className={labelClasses}>Template Title</label>
            <input type="text" id="template-title" className={inputClasses} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label htmlFor="template-description" className={labelClasses}>Description</label>
            <textarea id="template-description" rows={3} className={inputClasses} value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>

          <div className="pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Line Items</h3>
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={item.description || ''}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      className={`${inputClasses} flex-grow`}
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.price || ''}
                      onChange={(e) => handleLineItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                      className={`${inputClasses} w-32`}
                    />
                    {userRole === 'Admin' && (
                      <button
                        onClick={() => setExpandedSettingsIndex(expandedSettingsIndex === index ? null : index)}
                        className={`p-2 rounded-md transition-colors ${expandedSettingsIndex === index ? 'text-lyceum-blue bg-lyceum-blue/10' : 'text-gray-400 hover:text-lyceum-blue'}`}
                        title="Item Settings"
                      >
                        <Cog size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length <= 1}
                      className="p-2 text-gray-500 hover:text-red-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Document Unlock Settings Panel */}
                  {expandedSettingsIndex === index && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md shadow-sm space-y-3 animate-fade-in-fast">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Document Requirements</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => userRole === 'Admin' && handleLineItemChange(index, 'isDocumentUnlockEnabled', !item.isDocumentUnlockEnabled)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${item.isDocumentUnlockEnabled ? 'bg-lyceum-blue' : 'bg-gray-200 dark:bg-gray-700'} ${userRole !== 'Admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.isDocumentUnlockEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                          <span className="text-[10px] font-bold text-gray-500">{item.isDocumentUnlockEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>

                      {item.isDocumentUnlockEnabled && (
                        <div className="space-y-3 animate-fade-in-fast">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Unlock Document Categories
                            </label>
                            <div className={`grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto ${userRole !== 'Admin' ? 'opacity-70 pointer-events-none' : ''}`}>
                              {DOCUMENT_CATEGORIES.map(cat => {
                                const isChecked = (item.linkedDocumentCategories || []).includes(cat);
                                return (
                                  <label key={cat} className={`flex items-center gap-2 cursor-pointer group ${userRole !== 'Admin' ? 'cursor-not-allowed' : ''}`}>
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300 text-lyceum-blue focus:ring-lyceum-blue w-3.5 h-3.5 disabled:opacity-50"
                                      checked={isChecked}
                                      disabled={userRole !== 'Admin'}
                                      onChange={() => {
                                        const current = item.linkedDocumentCategories || [];
                                        const next = isChecked
                                          ? current.filter(c => c !== cat)
                                          : [...current, cat];
                                        handleLineItemChange(index, 'linkedDocumentCategories', next);
                                      }}
                                    />
                                    <span className={`text-[11px] transition-colors ${isChecked ? 'text-lyceum-blue font-bold' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}>
                                      {cat}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Unlock Condition
                              </label>
                              <select
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-lyceum-blue text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-70"
                                value={item.unlockThresholdType || 'Full'}
                                onChange={(e) => handleLineItemChange(index, 'unlockThresholdType', e.target.value)}
                                disabled={userRole !== 'Admin'}
                              >
                                <option value="Full">Full Payment (₹{(item.price || 0).toLocaleString('en-IN')})</option>
                                <option value="Custom">Custom Amount Paid</option>
                              </select>
                            </div>

                            {item.unlockThresholdType === 'Custom' && (
                              <div className="flex-1 animate-fade-in-fast">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  Custom Target Amount (₹)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={item.price || 0}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-lyceum-blue text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-70"
                                  value={item.unlockThresholdAmount || 0}
                                  onChange={(e) => handleLineItemChange(index, 'unlockThresholdAmount', parseFloat(e.target.value) || 0)}
                                  disabled={userRole !== 'Admin'}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addLineItem} className="mt-3 inline-flex items-center text-sm font-medium text-lyceum-blue hover:underline">
              <Plus size={16} className="mr-1" /> Add Line Item
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 flex justify-end items-center">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total:</span>
            <span className="text-2xl font-bold text-lyceum-blue flex items-center ml-2">
              <IndianRupee size={20} className="mr-1" />
              {calculateTotal().toLocaleString('en-IN')}
            </span>
          </div>

          {error && <p className="text-sm text-center text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <button type="button" onClick={handleClose} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium">Cancel</button>
          <button type="button" onClick={handleSave} className="ml-3 px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm text-sm font-medium hover:bg-lyceum-blue-dark">Save Template</button>
        </div>
      </div>
    </div>
  );
};

export default QuotationTemplateModal;