import React, { useState, useEffect, useRef } from 'react';
import type { Contact, Document as Doc, User } from '../types';
import { Paperclip, Upload, Download, ArrowLeft, Trash2, Eye, FileText, Clock, HardDrive } from './icons';
import * as api from '../utils/api';

interface StudentDocumentsViewProps {
    student: Contact;
    onNavigateBack: () => void;
    user: User;
}

const DocumentItem = ({ doc, handleDownload, handlePreview, isManualDeleteAllowed }: any) => (
    <div className="group bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-lyceum-blue dark:hover:border-lyceum-blue hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
                <div className="p-3 bg-lyceum-blue/10 rounded-lg text-lyceum-blue group-hover:bg-lyceum-blue group-hover:text-white transition-colors duration-300">
                    <FileText size={24} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate" title={doc.name}>
                        {doc.name}
                    </h3>
                    <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                            <HardDrive size={12} className="mr-1" />
                            {(doc.size / 1024).toFixed(1)} KB
                        </span>
                        <span className="flex items-center">
                            <Clock size={12} className="mr-1" />
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-4 flex items-center space-x-2">
            <button
                onClick={() => handlePreview(doc)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-lyceum-blue bg-lyceum-blue/5 rounded-lg hover:bg-lyceum-blue hover:text-white transition-all duration-200"
            >
                <Eye size={14} className="mr-1.5" />
                Preview
            </button>
            <button
                onClick={() => handleDownload(doc)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
                <Download size={14} className="mr-1.5" />
                Download
            </button>
        </div>
    </div>
);

const StudentDocumentsView: React.FC<StudentDocumentsViewProps> = ({ student, onNavigateBack, user }) => {
    const [documents, setDocuments] = useState<Doc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadDocuments();
    }, [student.id]);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const docs = await api.getContactDocuments(student.id);
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
            await api.uploadDocument(student.id, file, false);
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

    const handlePreview = (doc: Doc) => {
        const tokenStr = api.getToken() || '';
        fetch(`${import.meta.env.VITE_API_URL}/documents/${doc.id}?preview=true`, {
            headers: { 'Authorization': `Bearer ${tokenStr}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            });
    };

    return (
        <div className="h-full space-y-6 animate-fade-in">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={onNavigateBack}
                            className="flex items-center text-sm font-medium text-gray-500 hover:text-lyceum-blue transition-colors mb-2"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <HardDrive className="text-lyceum-blue" size={28} />
                            My Documents
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Access and manage your academic files and certificates
                        </p>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            id="student-doc-upload-view"
                        />
                        <label
                            htmlFor="student-doc-upload-view"
                            className={`inline-flex items-center px-6 py-3 bg-lyceum-blue text-white rounded-xl shadow-lg shadow-lyceum-blue/20 hover:bg-lyceum-blue-dark hover:shadow-xl hover:shadow-lyceum-blue/30 transition-all duration-300 cursor-pointer ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <Upload size={18} className="mr-2.5" />
                            <span className="font-bold">{uploading ? 'Uploading...' : 'Upload New Document'}</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Documents Grid */}
            {loading ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-lyceum-blue border-t-transparent"></div>
                    <p className="mt-4 text-gray-500 font-medium">Fetching your documents...</p>
                </div>
            ) : documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {documents.map((doc) => (
                        <DocumentItem
                            key={doc.id}
                            doc={doc}
                            handleDownload={handleDownload}
                            handlePreview={handlePreview}
                        />
                    ))}
                </div>
            ) : (
                <div className="min-h-[400px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 text-gray-300">
                        <FileText size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">No documents yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
                        You haven't uploaded any documents yet. Use the upload button above to add your first file.
                    </p>
                </div>
            )}

            <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

export default StudentDocumentsView;
