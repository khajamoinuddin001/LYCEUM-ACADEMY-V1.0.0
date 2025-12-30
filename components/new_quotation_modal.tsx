
import React, { useState, useEffect } from 'react';
import { ArrowLeft, IndianRupee, Plus, Trash2, Edit, X } from './icons';
import type { Quotation, CrmLead, User, QuotationTemplate, QuotationLineItem } from '../types';
import QuotationTemplateModal from './quotation_template_modal';

interface NewQuotationPageProps {
  lead: CrmLead;
  onCancel: () => void;
  onSave: (quotation: Omit<Quotation, 'id' | 'status' | 'date'> | Quotation) => void;
  user: User;
  templates: QuotationTemplate[];
  quotationToEdit?: Quotation | null;
  onSaveTemplate: (template: QuotationTemplate) => void;
  onDeleteTemplate: (templateId: number) => void;
}

const BLANK_QUOTATION: Omit<Quotation, 'id' | 'status' | 'date'> = {
  title: 'New Quotation',
  description: '',
  lineItems: [{ description: '', price: 0 }],
  total: 0,
};

const NewQuotationPage: React.FC<NewQuotationPageProps> = ({ lead, onCancel, onSave, user, templates, quotationToEdit, onSaveTemplate, onDeleteTemplate }) => {
  const [quotation, setQuotation] = useState<Omit<Quotation, 'id' | 'status' | 'date'> | Quotation>(BLANK_QUOTATION);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [templateToEditInModal, setTemplateToEditInModal] = useState<QuotationTemplate | 'new' | null>(null);

  const isEditing = !!quotationToEdit;
  const canWrite = isEditing ? user.permissions?.['CRM']?.update : user.permissions?.['CRM']?.create;

  useEffect(() => {
    if (isEditing) {
      setQuotation(JSON.parse(JSON.stringify(quotationToEdit)));
    } else {
      setQuotation(BLANK_QUOTATION);
    }
  }, [quotationToEdit, isEditing]);

  useEffect(() => {
    console.log('NewQuotationPage mounted', {
      hasOnSave: !!onSave,
      canWrite,
      userRole: user.role,
      permissions: user.permissions
    });
  }, [onSave, canWrite, user]);

  useEffect(() => {
    const newTotal = quotation.lineItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    if (newTotal !== quotation.total) {
      setQuotation(q => ({ ...q, total: newTotal }));
    }
  }, [quotation.lineItems, quotation.total]);

  const handleSelectTemplate = (template: QuotationTemplate) => {
    setQuotation({
      title: template.title,
      description: template.description,
      lineItems: JSON.parse(JSON.stringify(template.lineItems)),
      total: template.total,
    });
  };

  const handleStartBlank = () => {
    setQuotation(BLANK_QUOTATION);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuotation(q => ({ ...q, [name]: value }));
  };

  const handleLineItemChange = (index: number, field: keyof QuotationLineItem, value: string | number) => {
    const newItems = [...quotation.lineItems];
    const item = { ...newItems[index], [field]: value };
    newItems[index] = item;
    setQuotation(q => ({ ...q, lineItems: newItems }));
  };

  const addLineItem = () => {
    setQuotation(q => ({ ...q, lineItems: [...q.lineItems, { description: '', price: 0 }] }));
  };

  const removeLineItem = (index: number) => {
    if (quotation.lineItems.length > 1) {
      const newItems = quotation.lineItems.filter((_, i) => i !== index);
      setQuotation(q => ({ ...q, lineItems: newItems }));
    }
  };

  const handleSaveQuotation = () => {
    console.log('Save quotation clicked', { quotation, canWrite });

    const finalLineItems = quotation.lineItems.filter(item => item.description.trim() && (Number(item.price) || 0) > 0);

    console.log('Filtered line items:', finalLineItems);

    if (!quotation.title.trim()) {
      console.error('Validation failed: Title is empty');
      alert('Please enter a quotation title');
      return;
    }

    if (finalLineItems.length === 0) {
      console.error('Validation failed: No valid line items');
      alert('Please add at least one line item with a description and price');
      return;
    }

    const finalTotal = finalLineItems.reduce((sum, item) => sum + item.price, 0);

    const quotationToSave = {
      ...quotation,
      lineItems: finalLineItems,
      total: finalTotal,
    };

    console.log('Saving quotation:', quotationToSave);
    onSave(quotationToSave);
  };

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";

  return (
    <div className="w-full mx-auto animate-fade-in">
      <div className="mb-6">
        <button onClick={onCancel} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-2">
          <ArrowLeft size={16} className="mr-2" />
          Back to CRM
        </button>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          {isEditing ? 'Edit Quotation for ' : 'New Quotation for '}
          <span className="text-lyceum-blue">{lead.title}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {isEditing ? 'Modify the details below and save your changes.' : 'Select a template or start from scratch to build a custom quotation.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        { }
        <div className={`lg:col-span-1 space-y-4 ${isEditing ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Templates</h2>
            {user.role === 'Admin' && (
              <button
                onClick={() => setIsManageModalOpen(true)}
                className="text-sm font-medium text-lyceum-blue hover:underline"
              >
                Manage Templates
              </button>
            )}
          </div>
          <button
            onClick={handleStartBlank}
            className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-dashed border-gray-400 dark:border-gray-600 hover:border-lyceum-blue hover:text-lyceum-blue transition-colors"
          >
            <div className="flex items-center">
              <Plus size={20} className="mr-3" />
              <span className="font-semibold">Start with a Blank Quotation</span>
            </div>
          </button>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="w-full text-left p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-lyceum-blue hover:ring-1 hover:ring-lyceum-blue transition-all"
              >
                <p className="font-semibold text-gray-800 dark:text-gray-200">{template.title}</p>
                <p className="text-sm text-lyceum-blue font-medium mt-1">₹{template.total.toLocaleString('en-IN')}</p>
              </button>
            ))}
          </div>
        </div>

        { }
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Quotation Editor</h2>
          </div>
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div>
              <label htmlFor="quote-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input type="text" id="quote-title" name="title" className={inputClasses} value={quotation.title} onChange={handleFieldChange} disabled={!canWrite} />
            </div>
            <div>
              <label htmlFor="quote-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea id="quote-description" name="description" rows={3} className={inputClasses} value={quotation.description} onChange={handleFieldChange} disabled={!canWrite}></textarea>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Line Items</h3>
              <div className="space-y-3">
                {quotation.lineItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      className={`${inputClasses} flex-grow`}
                      disabled={!canWrite}
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => handleLineItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                      className={`${inputClasses} w-32`}
                      disabled={!canWrite}
                    />
                    <button
                      onClick={() => removeLineItem(index)}
                      disabled={!canWrite || quotation.lineItems.length <= 1}
                      className="p-2 text-gray-500 hover:text-red-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addLineItem} disabled={!canWrite} className="mt-3 inline-flex items-center text-sm font-medium text-lyceum-blue hover:underline disabled:opacity-50">
                <Plus size={16} className="mr-1" /> Add Line Item
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
            <div>
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total:</span>
              <span className="text-2xl font-bold text-lyceum-blue flex items-center ml-2">
                <IndianRupee size={20} className="mr-1" />
                {quotation.total.toLocaleString('en-IN')}
              </span>
              {/* DEBUG INFO */}
              <div className="text-xs text-red-500 mt-2">
                Debug: canWrite={canWrite.toString()}, Title="{quotation.title}", Items={quotation.lineItems.length}
                <br />
                Permissions: {JSON.stringify(user.permissions?.['CRM'])}
              </div>
            </div>
            <div>
              <button type="button" onClick={onCancel} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium">Cancel</button>
              <button
                type="button"
                onClick={handleSaveQuotation}
                disabled={!canWrite || !quotation.title.trim()}
                className="ml-3 px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm text-sm font-medium hover:bg-lyceum-blue-dark disabled:bg-gray-400"
              >
                {isEditing ? 'Update Quotation' : 'Save Quotation'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isManageModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-fast">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col transform transition-all duration-200 ease-in-out" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Manage Quotation Templates</h2>
              <button onClick={() => setIsManageModalOpen(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '65vh' }}>
              <div className="flex justify-end mb-4">
                <button onClick={() => setTemplateToEditInModal('new')} className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-lyceum-blue rounded-md hover:bg-lyceum-blue-dark transition-colors">
                  <Plus size={14} className="mr-1.5" /> New Template
                </button>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {templates.map(template => (
                  <li key={template.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{template.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total: ₹{template.total.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="space-x-2">
                      <button onClick={() => setTemplateToEditInModal(template)} className="p-2 text-gray-500 hover:text-lyceum-blue rounded-md" aria-label={`Edit ${template.title}`}><Edit size={16} /></button>
                      <button onClick={() => { if (window.confirm(`Are you sure you want to delete "${template.title}"?`)) onDeleteTemplate(template.id); }} className="p-2 text-gray-500 hover:text-red-500 rounded-md" aria-label={`Delete ${template.title}`}><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-end p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
              <button type="button" onClick={() => setIsManageModalOpen(false)} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium">Done</button>
            </div>
          </div>
        </div>
      )}

      {templateToEditInModal && (
        <QuotationTemplateModal
          template={templateToEditInModal === 'new' ? null : templateToEditInModal}
          onClose={() => setTemplateToEditInModal(null)}
          onSave={(template) => {
            onSaveTemplate(template);
            setTemplateToEditInModal(null);
          }}
        />
      )}

      <style>{`
          @keyframes fade-in {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
              animation: fade-in 0.3s ease-out forwards;
          }
           @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default NewQuotationPage;
