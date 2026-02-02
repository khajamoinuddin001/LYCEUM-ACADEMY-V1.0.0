import React, { useState } from 'react';
import { Calendar, IndianRupee, X, Download, Check, AlertCircle } from 'lucide-react';
import type { Contact, Quotation } from '../types';
import * as api from '../utils/api';

interface QuotationDetailsModalProps {
    quotation: Quotation;
    student?: Contact;
    onClose: () => void;
    onAccept?: () => void; // Optional callback after acceptance
}

const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({ quotation, student, onClose, onAccept }) => {
    const [isAccepting, setIsAccepting] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Review':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Accepted by Student':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Agreed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleAcceptQuotation = async () => {
        if (!window.confirm('Are you sure you want to accept this quotation?')) {
            return;
        }

        setIsAccepting(true);
        try {
            await api.acceptQuotation(quotation.id);
            if (onAccept) {
                onAccept();
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error accepting quotation:', error);
            alert('Failed to accept quotation. Please try again.');
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDownloadPDF = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow && student) {
            printWindow.document.write(generatePDFHTML(quotation, student));
            printWindow.document.close();
            printWindow.print();
        } else {
            alert('Student details required for PDF generation.');
        }
    };

    const generatePDFHTML = (quotation: Quotation, student: Contact) => {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation ${quotation.quotationNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 40px 50px;
            color: #111827;
            -webkit-print-color-adjust: exact;
          }
          
          .top-bar { height: 12px; background-color: #0084C7; width: 100%; margin-bottom: 40px; }
          
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px; }
          .logo-section { display: flex; flex-direction: column; }
          .logo { height: 96px; width: auto; margin-bottom: 16px; object-fit: contain; }
          .company-name { font-size: 20px; font-weight: 800; color: #0084C7; text-transform: uppercase; margin-bottom: 4px; letter-spacing: -0.025em; }
          .tagline { font-size: 14px; font-weight: 500; color: #6B7280; }
          
          .meta-section { text-align: right; }
          .doc-title { font-size: 36px; font-weight: 400; color: #1F2937; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 24px 0; }
          .meta-row { margin-bottom: 8px; }
          .meta-label { font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
          .meta-value { font-size: 16px; font-weight: 700; color: #111827; }
          
          .divider { border-bottom: 2px solid #F3F4F6; margin-bottom: 40px; }
          
          .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-bottom: 48px; border-top: 1px solid #F3F4F6; padding-top: 40px; }
          .address-label { font-size: 12px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
          .address-content { font-size: 14px; line-height: 1.6; color: #111827; }
          .address-name { font-size: 18px; font-weight: 700; color: #0084C7; margin-bottom: 8px; }
          .address-client-name { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 8px; }
          .contact-row { margin-top: 16px; display: flex; flex-direction: column; gap: 4px; color: #4B5563; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          th { background-color: #F9FAFB; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; }
          th.text-right { text-align: right; }
          td { padding: 20px 16px; font-size: 16px; color: #111827; border-bottom: 1px solid #F9FAFB; vertical-align: top; }
          td.font-bold { font-weight: 700; }
          td.text-right { text-align: right; }
          
          .totals-section { display: flex; justify-content: flex-end; margin-bottom: 60px; }
          .totals-box { width: 380px; background-color: rgba(249, 250, 251, 0.8); border: 1px solid #F3F4F6; border-radius: 8px; padding: 24px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #4B5563; border-bottom: 1px solid rgba(229, 231, 235, 0.5); padding-bottom: 8px; }
          .total-row.final { border-bottom: none; padding-top: 16px; margin-top: 8px; align-items: center; color: #111827; }
          .total-label { font-weight: 500; }
          .total-value { font-weight: 700; }
          .final .total-value { font-size: 30px; color: #0084C7; }
          .final .total-label { font-size: 18px; font-weight: 700; }
          
          .footer-layout { display: grid; grid-template-columns: 1fr 220px; gap: 32px; align-items: flex-end; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #F3F4F6; page-break-inside: avoid; }
          .terms-box { font-size: 12px; color: #6B7280; line-height: 1.6; }
          .terms-title { font-size: 12px; font-weight: 700; color: #111827; margin-bottom: 8px; text-transform: uppercase; }
          .privacy-title { font-size: 12px; font-weight: 700; color: #111827; margin: 16px 0 8px 0; text-transform: uppercase; }
          .italic { font-style: italic; color: #9CA3AF; margin-bottom: 16px; display: block; }
          
          .signature-box { text-align: center; }
          .signature-img { height: 64px; margin-bottom: 8px; display: flex; align-items: flex-end; justify-content: center; }
          .signature-text { font-family: 'Brush Script MT', cursive; font-size: 24px; color: rgba(0, 132, 199, 0.9); transform: rotate(-6deg); }
          .signature-line { border-top: 1px solid #D1D5DB; padding-top: 8px; }
          .signature-label { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.1em; }
          
          .page-footer { text-align: center; font-size: 12px; color: #9CA3AF; padding-top: 16px; }
          .footer-msg { font-weight: 700; color: #0084C7; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
          .footer-info { display: flex; justify-content: center; gap: 12px; margin-bottom: 4px; font-size: 11px; font-weight: 500; }
          .footer-link { color: #0084C7; font-weight: 500; font-size: 11px; text-decoration: none; }
          
          @media print {
            thead { display: table-header-group; }
            tr { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="top-bar"></div>
        
        <div class="header">
          <div class="logo-section">
            <img src="https://lyceum-academy-assets.s3.amazonaws.com/logo.png" alt="Lyceum Academy" class="logo" onerror="this.src='/logo.png'" />
            <div class="company-name">Lyceum Academy</div>
            <div class="tagline">Professional Education & Training Services</div>
          </div>
          
          <div class="meta-section">
            <h1 class="doc-title">Quotation</h1>
            <div class="meta-row">
              <span class="meta-label">Reference No.</span>
              <span class="meta-value">${quotation.quotationNumber || 'DRAFT'}</span>
            </div>
            <div class="meta-row" style="margin-top: 8px;">
              <span class="meta-label">Date</span>
              <span class="meta-value">${formatDate(quotation.date)}</span>
            </div>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="addresses">
          <div>
            <div class="address-label">From</div>
            <div class="address-content">
              <div class="address-name">Lyceum Academy</div>
              <div>Asif Nagar, Hyderabad</div>
              <div>Telangana, India 500028</div>
              <div class="contact-row">
                <div><span style="font-weight: 600;">Email:</span> omar@lyceumacademy.com</div>
                <div><span style="font-weight: 600;">Phone:</span> +91 7893078791</div>
              </div>
            </div>
          </div>
          
          <div>
             <div class="address-label">Quotation For</div>
             <div class="address-content">
               <div class="address-client-name">${student.name}</div>
               ${student.email ? `<div class="contact-row"><div><span style="font-weight: 600;">Email:</span> ${student.email}</div>` : ''}
               ${student.phone ? `<div><span style="font-weight: 600;">Phone:</span> ${student.phone}</div></div>` : ''}
             </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.lineItems.map(item => `
              <tr>
                <td class="font-bold">${item.description}</td>
                <td class="font-bold text-right">${formatCurrency(item.price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals-section">
          <div class="totals-box">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">${formatCurrency(quotation.subtotal || quotation.total + (quotation.discount || 0))}</span>
            </div>
            ${quotation.discount && quotation.discount > 0 ? `
            <div class="total-row" style="color: #059669;">
              <span class="total-label">Discount</span>
              <span class="total-value">- ${formatCurrency(quotation.discount)}</span>
            </div>` : ''}
            <div class="total-row">
              <span class="total-label">Tax (0%)</span>
              <span class="total-value">₹0.00</span>
            </div>
            <div class="total-row final">
              <span class="total-label">Total</span>
              <span class="total-value">${formatCurrency(quotation.total)}</span>
            </div>
          </div>
        </div>
        
        <div class="footer-layout">
           <div class="terms-box">
               <span class="italic">This is a computer-generated document. No signature is required.</span>
               
               <div class="terms-title">Terms & Conditions</div>
               <div>1. Valid for 30 days from issue.</div>
               <div>2. Payment: 50% advance.</div>
               <div>3. All disputes subject to Hyderabad jurisdiction.</div>
               
               <div class="privacy-title">Privacy Policy</div>
               <div>Your data is secure with us. We do not share personal information.</div>
               <div>For full policy, visit www.lyceumacademy.com/privacy</div>
           </div>
           
           <div class="signature-box">
               <div class="signature-img">
                   <span class="signature-text">Lyceum Academy</span>
               </div>
               <div class="signature-line">
                   <span class="signature-label">Authorized Signature</span>
               </div>
           </div>
        </div>
        
        <div class="page-footer">
            <div class="footer-msg">Thank you for your business!</div>
            <div class="footer-info">
                <span>Lyceum Academy Pvt Ltd</span> • 
                <span>Asif Nagar, Hyderabad, Telangana, India 500028</span> • 
                <span>+91 7893078791</span>
            </div>
            <a href="https://www.lyceumacademy.com" class="footer-link">www.lyceumacademy.com</a>
        </div>
      </body>
      </html>
    `;
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {quotation.quotationNumber || `Quotation #${quotation.id}`}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {quotation.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    {/* Status and Date */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <Calendar size={16} className="mr-2 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(quotation.date)}
                            </span>
                        </div>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                            {quotation.status}
                        </span>
                    </div>

                    {/* Description */}
                    {quotation.description && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {quotation.description}
                            </p>
                        </div>
                    )}

                    {/* Line Items */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Items
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Price
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {quotation.lineItems.map((item: any, index: number) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                {item.description}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(item.price)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Total */}
                    {/* Total Section with Breakdown */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                        <div className="flex justify-between text-sm mb-2 text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(quotation.subtotal || quotation.total + (quotation.discount || 0))}
                            </span>
                        </div>
                        {quotation.discount && quotation.discount > 0 && (
                            <div className="flex justify-between text-sm mb-2 text-green-600 dark:text-green-400">
                                <span>Discount</span>
                                <span className="font-bold">
                                    - {formatCurrency(quotation.discount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm mb-4 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span>Tax (0%)</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="flex items-center justify-between text-lyceum-blue">
                            <span className="text-lg font-semibold">Total Amount</span>
                            <span className="text-2xl font-bold flex items-center">
                                <IndianRupee size={24} className="mr-1" />
                                {quotation.total.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                        <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>This quotation is valid for 30 days from the date of issue</li>
                            <li>Payment terms as per agreement</li>
                            <li>All services subject to our standard terms and conditions</li>
                            <li>For full terms, visit: <a href="https://www.maverickoverseas.in/terms-conditions" className="text-lyceum-blue">Terms & Conditions</a></li>
                        </ul>
                        <h4 className="font-semibold mt-3 mb-2">Privacy Policy</h4>
                        <p>Your privacy is important to us. For details, visit: <a href="https://www.maverickoverseas.in/privacy-policy" className="text-lyceum-blue">Privacy Policy</a></p>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between z-10">
                    <button
                        onClick={handleDownloadPDF}
                        className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
                    >
                        <Download size={16} className="mr-2" />
                        Download PDF
                    </button>
                    <div className="flex space-x-2">
                        {quotation.status === 'In Review' && (
                            <button
                                onClick={handleAcceptQuotation}
                                disabled={isAccepting}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                            >
                                <Check size={16} className="mr-2" />
                                {isAccepting ? 'Accepting...' : 'Accept'}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuotationDetailsModal;
