import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, IndianRupee } from '@/components/common/icons';
import type { QuotationTemplate, QuotationLineItem } from '@/types';

interface QuotationTemplateModalProps {
  template: QuotationTemplate | null;
  onClose: () => void;
  onSave: (template: QuotationTemplate) => void;
}

const QuotationTemplateModal: React.FC<QuotationTemplateModalProps> = ({ template, onClose, onSave }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lineItems, setLineItems] = useState<Partial<QuotationLineItem>[]>([{ description: '', price: 0 }]);
  const [error, setError] = useState('');

  const isNew = !template;

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description);
      setLineItems(template.lineItems.length > 0 ? [...template.lineItems] : [{ description: '', price: 0 }]);
    } else {
      setTitle('');
      setDescription('');
      setLineItems([{ description: '', price: 0 }]);
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

  const handleLineItemChange = (index: number, field: keyof QuotationLineItem, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', price: 0 }]);
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
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
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
                  <button
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length <= 1}
                    className="p-2 text-gray-500 hover:text-red-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
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