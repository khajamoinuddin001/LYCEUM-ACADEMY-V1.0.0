import React, { useState, useEffect, useRef } from 'react';
import type { Contact, Document as Doc, User } from '@/types';
import { Paperclip, Upload, Download, ArrowLeft, Trash2, Eye, FileText, Clock, HardDrive, GraduationCap, Banknote, CalendarClock, MoreHorizontal, Plus } from '@/components/common/icons';
import * as api from '@/utils/api';

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
    const [selectedCategory, setSelectedCategory] = useState<string>('Passport');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = [
        { name: 'Passport', icon: <FileText size={18} /> },
        { name: 'Educational Documents', icon: <GraduationCap size={18} /> },
        { name: "Financial Document & Affidavit of Support / CA Report & ITR's", icon: <Banknote size={18} />, shortName: 'Financial' },
        { name: 'Gap Justification', icon: <CalendarClock size={18} /> },
        { name: 'Other', icon: <MoreHorizontal size={18} /> }
    ];

    // Group documents by category
    const groupedDocs = categories.reduce((acc, cat) => {
        acc[cat.name] = documents.filter(d => d.category === cat.name || (!d.category && cat.name === 'Other'));
        return acc;
    }, {} as Record<string, Doc[]>);

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
            await api.uploadDocument(student.id, file, false, selectedCategory);
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
        <div className="h-full space-y-8 animate-fade-in pb-12">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-lyceum-blue/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-lyceum-blue/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="flex-1">
                        <button
                            onClick={onNavigateBack}
                            className="group flex items-center text-sm font-bold text-gray-500 hover:text-lyceum-blue transition-all mb-4"
                        >
                            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-4">
                            <span className="p-3 bg-lyceum-blue rounded-2xl text-white shadow-lg shadow-lyceum-blue/30">
                                <HardDrive size={32} />
                            </span>
                            My Documents
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 mt-4 max-w-2xl font-medium">
                            Upload and manage your academic certificates, passport copies, and financial records in one secure place.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-4 min-w-[300px]">
                        <div className="w-full text-center">
                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Upload Category</p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-wrap gap-1 justify-center">
                                {categories.map(cat => (
                                    <button
                                        key={cat.name}
                                        onClick={() => setSelectedCategory(cat.name)}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${selectedCategory === cat.name
                                            ? 'bg-lyceum-blue text-white shadow-md shadow-lyceum-blue/20 scale-105'
                                            : 'text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-lyceum-blue'
                                            }`}
                                        title={cat.name}
                                    >
                                        {cat.icon}
                                        <span className={cat.shortName ? 'hidden xl:inline' : ''}>{cat.shortName || cat.name.split(' ')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            id="student-doc-upload-view"
                        />
                        <label
                            htmlFor="student-doc-upload-view"
                            className={`w-full inline-flex items-center justify-center px-8 py-4 bg-lyceum-blue text-white rounded-2xl shadow-xl shadow-lyceum-blue/30 hover:bg-lyceum-blue-dark hover:shadow-2xl hover:shadow-lyceum-blue/40 transition-all duration-300 cursor-pointer active:scale-95 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <Upload size={22} className="mr-3" />
                            <span className="text-lg font-black">{uploading ? 'Uploading...' : `Upload to ${selectedCategory.split(' ')[0]}`}</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Documents Grid Categorized */}
            {loading ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-lyceum-blue/20 border-t-lyceum-blue"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FileText size={24} className="text-lyceum-blue animate-pulse" />
                        </div>
                    </div>
                    <p className="mt-6 text-gray-500 font-bold text-lg">Organizing your library...</p>
                </div>
            ) : documents.length > 0 ? (
                <div className="space-y-16">
                    {categories.map(cat => (
                        <div key={cat.name} className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className={`p-4 rounded-2xl shadow-sm border ${groupedDocs[cat.name].length > 0
                                    ? 'bg-lyceum-blue text-white border-lyceum-blue/20 shadow-lyceum-blue/10'
                                    : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'
                                    }`}>
                                    {cat.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                                            {cat.name}
                                        </h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${groupedDocs[cat.name].length > 0
                                            ? 'bg-lyceum-blue/10 text-lyceum-blue'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                            }`}>
                                            {groupedDocs[cat.name].length} Files
                                        </span>
                                    </div>
                                    <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
                                        {groupedDocs[cat.name].length > 0 && (
                                            <div className="h-full bg-lyceum-blue w-24"></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {groupedDocs[cat.name].length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {groupedDocs[cat.name].map((doc) => (
                                        <DocumentItem
                                            key={doc.id}
                                            doc={doc}
                                            handleDownload={handleDownload}
                                            handlePreview={handlePreview}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-200 dark:text-gray-700 mb-4 shadow-sm">
                                        {cat.icon}
                                    </div>
                                    <p className="text-gray-400 font-bold">No documents in this category yet</p>
                                    <button
                                        onClick={() => {
                                            setSelectedCategory(cat.name);
                                            fileInputRef.current?.click();
                                        }}
                                        className="mt-4 text-sm font-black text-lyceum-blue hover:underline p-2"
                                    >
                                        Click to upload
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="min-h-[500px] flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 text-center shadow-sm">
                    <div className="relative mb-8">
                        <div className="w-32 h-32 bg-lyceum-blue/5 rounded-full flex items-center justify-center animate-pulse">
                            <FileText size={64} className="text-lyceum-blue/20" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-lyceum-blue rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <Plus size={24} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100">Your library is empty</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-sm mx-auto text-lg font-medium">
                        Start building your profile by uploading your documents. Select a category above to get started.
                    </p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-10 px-10 py-4 bg-lyceum-blue text-white rounded-2xl font-black shadow-xl shadow-lyceum-blue/30 hover:bg-lyceum-blue-dark transition-all transform hover:scale-105 active:scale-95"
                    >
                        Upload My First Document
                    </button>
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
