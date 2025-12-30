import React, { useState, useEffect, useRef } from 'react';
import type { Contact, Document as Doc } from '../types';
import { Paperclip, Upload, Download, ArrowLeft, Sparkles, Trash2 } from './icons';
import * as api from '../utils/api';

interface ContactDocumentsViewProps {
  contact: Contact;
  onNavigateBack: () => void;
  onAnalyze: (doc: Doc) => Promise<void>;
}

const ContactDocumentsView: React.FC<ContactDocumentsViewProps> = ({ contact, onNavigateBack, onAnalyze }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzingDocId, setAnalyzingDocId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [contact.id]);

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
      await api.uploadDocument(contact.id, file);
      await loadDocuments();
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

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm w-full mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
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
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-4 py-2 bg-lyceum-blue text-white rounded-md shadow-sm hover:bg-lyceum-blue-dark cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload size={16} className="mr-2" />
            {uploading ? 'Uploading...' : 'Upload Document'}
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lyceum-blue mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading documents...</p>
        </div>
      ) : documents.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {documents.map((doc) => (
            <li key={doc.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center">
                <Paperclip className="w-6 h-6 text-gray-400 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(doc.size / 1024).toFixed(1)} KB - Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}
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
                  onClick={() => handleDownload(doc)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Download size={14} className="mr-1.5" />
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No documents found for this contact.</p>
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