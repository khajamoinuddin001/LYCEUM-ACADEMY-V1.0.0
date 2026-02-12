import React, { useState, useEffect, useRef } from 'react';
import type { Contact, Document as Doc, User } from '@/types';
import { Paperclip, Upload, Download, ArrowLeft, Sparkles, Trash2, Eye } from '@/components/common/icons';
import * as api from '@/utils/api';

interface ContactDocumentsViewProps {
  contact: Contact;
  onNavigateBack: () => void;
  onAnalyze: (doc: Doc) => Promise<void>;
  user?: User | null;
}

const DocumentItem = ({ doc, analyzingDocId, handleAnalyzeClick, handleDownload, handleDelete, isStaffOrAdmin }: any) => (
  <li className="py-4 flex items-center justify-between">
    <div className="flex items-center">
      <Paperclip className="w-6 h-6 text-gray-400 mr-4" />
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {(doc.size / 1024).toFixed(1)} KB - Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}
          {doc.is_private && <span className="ml-2 text-xs text-red-500 font-bold border border-red-200 px-1 rounded">Private</span>}
        </p>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleAnalyzeClick(doc)}
        disabled={analyzingDocId === doc.id}
        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-lyceum-blue bg-lyceum-blue/10 rounded-md hover:bg-lyceum-blue/20 disabled:opacity-50 disabled:cursor-wait"
      >
        <Sparkles size={14} className={`mr-1.5 ${analyzingDocId === doc.id ? 'animate-pulse' : ''}`} />
        {analyzingDocId === doc.id ? 'Analyzing...' : 'Analyze with AI'}
      </button>
      <button
        onClick={() => {
          const tokenStr = api.getToken() || '';
          fetch(`${import.meta.env.VITE_API_URL}/documents/${doc.id}?preview=true`, {
            headers: { 'Authorization': `Bearer ${tokenStr}` }
          })
            .then(res => res.blob())
            .then(blob => {
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            });
        }}
        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-lyceum-blue bg-lyceum-blue/10 rounded-md hover:bg-lyceum-blue/20 mr-2"
      >
        <Eye size={14} className="mr-1.5" />
        Preview
      </button>
      <button
        onClick={() => handleDownload(doc)}
        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        <Download size={14} className="mr-1.5" />
        Download
      </button>
      {isStaffOrAdmin && (
        <button
          onClick={() => handleDelete(doc)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
        >
          <Trash2 size={14} className="mr-1.5" />
          Delete
        </button>
      )}
    </div>
  </li>
);

const ContactDocumentsView: React.FC<ContactDocumentsViewProps> = ({ contact, onNavigateBack, onAnalyze, user }) => {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzingDocId, setAnalyzingDocId] = useState<number | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Passport');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Passport',
    'Educational Documents',
    "Financial Document & Affidavit of Support / CA Report & ITR's",
    'Gap Justification',
    'Other'
  ];

  const privateCategories = [
    'Acceptance',
    'I20',
    'DS-160',
    'SEVIS confirmation',
    'Appointment Confirmation',
    'University Affidavit Forms',
    'Others'
  ];

  const isStaffOrAdmin = user?.role === 'Admin' || user?.role === 'Staff';

  // Separate documents
  const commonDocs = documents.filter(d => !d.is_private);
  const privateDocs = documents.filter(d => d.is_private);

  // Group common documents by category
  const groupedDocs = categories.reduce((acc, cat) => {
    if (cat === 'Other') {
      acc[cat] = commonDocs.filter(d => d.category === 'Other' || !d.category || !categories.includes(d.category));
    } else {
      acc[cat] = commonDocs.filter(d => d.category === cat);
    }
    return acc;
  }, {} as Record<string, Doc[]>);

  // Group private documents by category
  const groupedPrivateDocs = privateCategories.reduce((acc, cat) => {
    if (cat === 'Others') {
      acc[cat] = privateDocs.filter(d => d.category === 'Others' || !d.category || !privateCategories.includes(d.category));
    } else {
      acc[cat] = privateDocs.filter(d => d.category === cat);
    }
    return acc;
  }, {} as Record<string, Doc[]>);


  useEffect(() => {
    loadDocuments();
  }, [contact.id]);

  useEffect(() => {
    // Switch default category when toggling private mode
    if (isPrivate) {
      setSelectedCategory(privateCategories[0]);
    } else {
      setSelectedCategory(categories[0]);
    }
  }, [isPrivate]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.getContactDocuments(contact.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // Now passing selectedCategory even for private docs
      await api.uploadDocument(contact.id, file, isPrivate, selectedCategory);
      await loadDocuments();
      setIsPrivate(false); // Reset
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      await api.downloadDocument(doc.id, doc.name);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to download document.');
    }
  };

  const handleAnalyzeClick = async (doc: Doc) => {
    setAnalyzingDocId(doc.id);
    await onAnalyze(doc);
    setAnalyzingDocId(null);
  };

  const handleDelete = async (doc: Doc) => {
    if (!confirm(`Are you sure you want to delete "${doc.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteDocument(doc.id);
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm w-full mx-auto animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 gap-4">
        <div>
          <button
            onClick={onNavigateBack}
            className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-lyceum-blue mb-2"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Details
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Documents for {contact.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {isStaffOrAdmin && (
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded text-lyceum-blue focus:ring-lyceum-blue"
              />
              Private / Staff Only
            </label>
          )}

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md shadow-sm focus:border-lyceum-blue focus:ring-lyceum-blue h-10 px-3"
          >
            {(isPrivate ? privateCategories : categories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark cursor-pointer h-10 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload size={16} className="mr-2" />
            {uploading ? 'Uploading...' : `Upload ${isPrivate ? 'Private ' : ''}Document`}
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lyceum-blue mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading documents...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Categorized Common Documents */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 border-l-4 border-lyceum-blue pl-3">Common Documents</h3>
            {categories.map(category => (
              <div key={category} className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <span>{category}</span>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 flex-grow"></div>
                </h4>
                {groupedDocs[category] && groupedDocs[category].length > 0 ? (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-lg px-4 border border-gray-100 dark:border-gray-800">
                    {groupedDocs[category].map((doc) => (
                      <DocumentItem
                        key={doc.id}
                        doc={doc}
                        analyzingDocId={analyzingDocId}
                        handleAnalyzeClick={handleAnalyzeClick}
                        handleDownload={handleDownload}
                        handleDelete={handleDelete}
                        isStaffOrAdmin={isStaffOrAdmin}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic text-xs pl-4 pb-2">No documents in this category.</p>
                )}
              </div>
            ))}
          </div>

          {/* Private Section */}
          {isStaffOrAdmin && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Internal / Staff Only Documents
              </h3>

              {privateCategories.map(category => (
                <div key={category} className="space-y-3 mb-6">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <span>{category}</span>
                    <div className="h-px bg-red-100 dark:bg-red-900/30 flex-grow"></div>
                  </h4>
                  {groupedPrivateDocs[category] && groupedPrivateDocs[category].length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg px-4">
                      {groupedPrivateDocs[category].map((doc) => (
                        <DocumentItem
                          key={doc.id}
                          doc={doc}
                          analyzingDocId={analyzingDocId}
                          handleAnalyzeClick={handleAnalyzeClick}
                          handleDownload={handleDownload}
                          handleDelete={handleDelete}
                          isStaffOrAdmin={isStaffOrAdmin}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 italic text-xs pl-4 pb-2">No internal documents in this category.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ContactDocumentsView;