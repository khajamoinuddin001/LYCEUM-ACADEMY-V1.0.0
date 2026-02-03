
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ArrowLeft, IndianRupee, Plus, Trash2, Edit, X, Printer, Download } from './icons';
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
  lineItems: [{ description: '', price: 0, quantity: 1 }],
  total: 0,
  discount: 0,
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to portal print content to body
const PrintPortal = ({ children }: { children: React.ReactNode }) => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create print container
    const div = document.createElement('div');
    div.id = 'print-root';
    div.className = 'print-portal-container';
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.zIndex = '99999';
    document.body.appendChild(div);
    setMountNode(div);

    // Add print class to body 
    document.body.classList.add('printing-mode');

    return () => {
      document.body.removeChild(div);
      document.body.classList.remove('printing-mode');
    };
  }, []);

  if (!mountNode) return null;

  return ReactDOM.createPortal(children, mountNode);
};

const NewQuotationPage: React.FC<NewQuotationPageProps> = ({ lead, onCancel, onSave, user, templates, quotationToEdit, onSaveTemplate, onDeleteTemplate }) => {
  const [quotation, setQuotation] = useState<Omit<Quotation, 'id' | 'status' | 'date'> | Quotation>(BLANK_QUOTATION);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [templateToEditInModal, setTemplateToEditInModal] = useState<QuotationTemplate | 'new' | null>(null);

  const isEditing = !!quotationToEdit;
  const canWrite = user.role === 'Admin' || user.permissions?.['CRM']?.update || user.permissions?.['CRM']?.create;

  console.log('DEBUG Quotation Modal:', {
    userRole: user.role,
    crmPerms: user.permissions?.['CRM'],
    canWrite,
    title: quotation.title,
    isTitleEmpty: !quotation.title?.trim(),
    buttonDisabled: !canWrite || !quotation.title?.trim()
  });

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
    const subtotal = quotation.lineItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const discount = Number(quotation.discount) || 0;
    const newTotal = Math.max(0, subtotal - discount);

    if (newTotal !== quotation.total || subtotal !== (quotation.subtotal || 0)) {
      setQuotation(q => ({ ...q, total: newTotal, subtotal }));
    }
  }, [quotation.lineItems, quotation.discount, quotation.total, quotation.subtotal]);

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
    setQuotation(q => ({ ...q, lineItems: [...q.lineItems, { description: '', price: 0, quantity: 1 }] }));
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

    const subtotal = finalLineItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    const discount = Number(quotation.discount) || 0;
    const finalTotal = Math.max(0, subtotal - discount);

    // Generate ID if new
    let quotationToSave = {
      ...quotation,
      lineItems: finalLineItems,
      total: finalTotal,
      subtotal: subtotal,
      discount: discount,
    };

    if (!isEditing && !quotationToSave.quotationNumber) {
      // Generate unique 6-digit reference number
      const randomDigits = Math.floor(100000 + Math.random() * 900000); // 100000-999999
      quotationToSave.quotationNumber = `QUO-${randomDigits}`;
    }

    console.log('Saving quotation:', quotationToSave);
    onSave(quotationToSave);
  };

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-lyceum-blue focus:border-lyceum-blue sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white";

  return (
    <div className="w-full mx-auto animate-fade-in">
      <div className="mb-6 flex justify-between items-start print:hidden">
        <div>
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
        {isEditing && (
          <>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-2"
            >
              <Printer size={18} className="mr-2" />
              Print Quotation
            </button>
          </>
        )}
      </div>

      {/* Print View - Visible only when printing */}
      <div className="hidden print:flex flex-col absolute top-0 left-0 bg-white z-50 p-0 text-gray-900 font-sans w-full min-h-screen">
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { margin: 0; size: auto; }
            html, body { 
              height: auto !important; 
              overflow: visible !important; 
              margin: 0 !important; 
              -webkit-print-color-adjust: exact !important; 
            }
            body * { 
              visibility: hidden; 
            }
            /* Hide all other fixed elements that might interfere */
            nav, header, aside, .sidebar, .no-print, [role="dialog"] > div:not(.print\\:flex) { 
              display: none !important; 
            }
            .print\\:flex, .print\\:flex * { 
              visibility: visible; 
            }
            .print\\:flex {
              position: absolute;
              left: 0;
              top: 0;
              width: 100vw;
              min-height: 100vh;
              height: auto;
              margin: 0;
              padding: 40px 50px;
              display: flex !important;
              flex-direction: column;
              background: white;
              z-index: 9999;
            }
            /* Reset Modal Constraints */
            .fixed, .absolute, .inset-0, .z-50 {
              position: static !important;
              width: auto !important;
              height: auto !important;
              overflow: visible !important;
            }

            /* Table Optimizations for Print */
            thead { display: table-header-group; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            td, th { padding-top: 8px; padding-bottom: 8px; }
          }
        `}} />
      </div>

      {/* Print View - Rendered in Portal to escape modal constraints */}
      <PrintPortal>
        <div className={`print-content-wrapper bg-white p-[16px] min-h-screen w-full absolute top-0 left-0 z-[99999] text-[12px]`}>
          {/* Header */}
          <div className="h-1.5 bg-lyceum-blue w-full mb-3 print:mb-3"></div>

          {/* Top Header Section */}
          <div className="flex justify-between items-start mb-2 shrink-0">
            {/* Company Logo & Name */}
            <div className="flex flex-col items-start">
              <div className="mb-1">
                <img src="/logo.png" alt="Lyceum Academy" className="h-12 w-auto object-contain select-none" />
              </div>
              <h1 className="text-lg font-extrabold text-lyceum-blue uppercase tracking-tight mb-0.5">Lyceum Academy</h1>
              <p className="text-xs text-gray-500 font-medium">Creative Learning</p>
            </div>

            {/* Quotation Meta - Right Aligned */}
            <div className="text-right">
              <h2 className="text-4xl font-normal text-gray-800 uppercase tracking-widest mb-6">
                QUOTATION
              </h2>
              <div className="space-y-2">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Reference No.</span>
                  <span className="text-base font-bold text-gray-900">{quotation.quotationNumber || 'DRAFT'}</span>
                </div>
                <div className="flex flex-col items-end pt-2">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Date</span>
                  <span className="text-base font-bold text-gray-900">{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-b border-gray-100 mb-2 shrink-0"></div>

          {/* Addresses Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4 shrink-0 border-t border-gray-100 pt-2">
            {/* From */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">FROM</h3>
              <div className="text-gray-900 text-sm leading-relaxed">
                <p className="text-lg font-bold text-lyceum-blue mb-2">Lyceum Academy</p>
                <p>Opp. HP petrol pump, Falaknuma,</p>
                <p>Hyderabad 500053</p>
                <div className="mt-4 space-y-1">
                  <p><span className="font-semibold text-gray-600">Email:</span> omar@lyceumacad.com </p>
                  <p><span className="font-semibold text-gray-600">Phone:</span> +91 7893078791</p>
                </div>
              </div>
            </div>

            {/* To */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                QUOTATION FOR
              </h3>
              <div className="text-gray-900 text-xs leading-relaxed">
                <p className="text-base font-bold text-gray-900 mb-1">{lead.contact || lead.title}</p>
                {lead.company && <p className="font-medium mb-1">{lead.company}</p>}
                <div className="mt-4 space-y-1">
                  {lead.email && <p><span className="font-semibold text-gray-600">Email:</span> {lead.email}</p>}
                  {lead.phone && <p><span className="font-semibold text-gray-600">Phone:</span> {lead.phone}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-4 shrink-0">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="py-2 px-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">DESCRIPTION</th>
                  <th className="py-2 px-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider w-16">QTY</th>
                  <th className="py-2 px-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider w-24">UNIT PRICE</th>
                  <th className="py-2 px-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider w-32">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {quotation.lineItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-50">
                    <td className="py-1.5 px-3 align-top">
                      <p className="font-bold text-sm text-gray-900 mb-0.5">
                        {item.description}
                      </p>
                    </td>
                    <td className="py-1.5 px-3 text-right align-top text-sm text-gray-900">
                      {item.quantity || 1}
                    </td>
                    <td className="py-1.5 px-3 text-right align-top text-sm text-gray-900">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-1.5 px-3 text-right align-top font-bold text-sm text-gray-900">
                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-2 shrink-0">
            <div className="w-80 bg-gray-50/80 rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200/50">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold text-gray-900">{formatCurrency(quotation.subtotal || quotation.total + (quotation.discount || 0))}</span>
              </div>
              {quotation.discount && quotation.discount > 0 ? (
                <div className="flex justify-between py-2 text-sm text-green-600 border-b border-gray-200/50">
                  <span className="font-medium">Discount</span>
                  <span className="font-bold">- {formatCurrency(quotation.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200/50">
                <span className="font-medium">Tax (0%)</span>
                <span className="font-bold text-gray-900">₹0.00</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-2">
                <span className="font-bold text-gray-900 text-lg">Total</span>
                <span className="font-bold text-3xl text-lyceum-blue">
                  {formatCurrency(quotation.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Signature & Footer */}
          <div className="mt-2 shrink-0 break-inside-avoid">
            <div className="grid grid-cols-2 gap-4 items-end mb-2 pb-2 border-b border-gray-100">
              <div className="text-[10px] text-gray-500 leading-relaxed">
                <div className="border border-red-500 text-red-500 bg-red-50 px-3 py-1.5 rounded mb-3 text-[10px] font-medium leading-relaxed">
                  <p className="font-bold mb-1">TERMS & CONDITIONS:</p>
                  <p className="mb-1">1. All the payments made to Lyceum Academy are non-refundable under any circumstances.</p>
                  <p className="mb-1">2. By purchasing services, you agree to be bound by the current terms and conditions available at lyceumacad.com/terms-conditions.</p>
                  <p>3. Lyceum Academy may cancel services if payments are delayed or terms are violated.</p>
                </div>
                <p className="text-gray-400 mb-2 block italic">This is a computer-generated document. No signature is required.</p>

                <div className="mb-2">
                  <p className="font-bold text-gray-900 mb-1 text-xs">TERMS & CONDITIONS</p>
                  <p>For complete terms and conditions, please visit our website: <span className="font-semibold text-lyceum-blue">www.lyceumacademy.com</span></p>
                </div>

                <div>
                  <p className="font-bold text-gray-900 mb-1 text-xs">PRIVACY POLICY</p>
                  <p>Your data is secure with us. We do not share perosnal information.</p>
                </div>
              </div>
              <div className="text-center ml-auto">
                <div className="h-16 mb-2 flex items-end justify-center pb-2 relative">
                  <span className="font-handwriting text-2xl text-lyceum-blue/90 block">Lyceum Academy</span>
                </div>
                <div className="border-t border-gray-300 pt-2 w-56">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorized Signature</p>
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="flex flex-col items-center justify-center text-center text-xs text-gray-400 space-y-2 py-4">
              <p className="font-bold text-lyceum-blue text-sm">Thank you for your business!</p>
              <div className="flex gap-3 text-gray-500 text-[11px] font-medium">
                <span>Lyceum Academy</span>
                <span>•</span>
                <span>Opp. HP petrol pump, Falaknuma, Hyderabad 500053</span>
                <span>•</span>
                <span>+91 7893078791</span>
              </div>
              <p className="text-lyceum-blue font-medium text-[11px]">www.lyceumacademy.com</p>
            </div>
          </div>
        </div>
      </PrintPortal>

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
                      placeholder="Qty"
                      value={item.quantity || 1}
                      onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className={inputClasses.replace('w-full', 'w-24')}
                      min="1"
                      disabled={!canWrite}
                    />
                    <input
                      type="number"
                      placeholder="Unit Price"
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

          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">

            <div className="flex justify-between mb-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount (Amount)</label>
                <div className="relative rounded-md shadow-sm max-w-[150px]">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    name="discount"
                    value={quotation.discount || 0}
                    onChange={(e) => setQuotation(q => ({ ...q, discount: parseFloat(e.target.value) || 0 }))}
                    className="block w-full rounded-md border-gray-300 pl-7 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm focus:border-lyceum-blue focus:ring-lyceum-blue py-2"
                    placeholder="0.00"
                    min="0"
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Subtotal: {formatCurrency(quotation.subtotal || 0)}</div>
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total:</div>
                <span className="text-2xl font-bold text-lyceum-blue flex items-center justify-end ml-2">
                  <IndianRupee size={20} className="mr-1" />
                  {quotation.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>


            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
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

      {
        isManageModalOpen && (
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
        )
      }

      {
        templateToEditInModal && (
          <QuotationTemplateModal
            template={templateToEditInModal === 'new' ? null : templateToEditInModal}
            onClose={() => setTemplateToEditInModal(null)}
            onSave={(template) => {
              onSaveTemplate(template);
              setTemplateToEditInModal(null);
            }}
          />
        )
      }

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
    </div >
  );
};


export default NewQuotationPage;

