import React, { useState, useEffect } from 'react';
import { 
    Megaphone, 
    Search, 
    Calendar, 
    Clock, 
    Paperclip, 
    FileText, 
    Download, 
    CheckCircle2, 
    ChevronRight,
    SearchX,
    Inbox,
    RefreshCw as Loader2,
    X
} from '@/components/common/icons';
import * as api from '@/utils/api';

const StudentAnnouncementsView: React.FC = () => {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'All' | 'Unread' | 'Read'>('All');
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);

    const stripHtml = (html: string) => (html || '').replace(/<[^>]*>/g, '');

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Prevent body scroll when modal open
    useEffect(() => {
        if (selectedAnnouncement) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [selectedAnnouncement]);

    const fetchAnnouncements = async () => {
        try {
            setIsLoading(true);
            const data = await api.getMyAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.markAnnouncementAsRead(id);
            setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
            if (selectedAnnouncement?.id === id) {
                setSelectedAnnouncement((prev: any) => ({ ...prev, is_read: true }));
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleOpenAnnouncement = (ann: any) => {
        setSelectedAnnouncement(ann);
        if (!ann.is_read) {
            handleMarkAsRead(ann.id);
        }
    };

    const filteredAnnouncements = announcements.filter(a => {
        const text = stripHtml(a.content || '');
        const matchesSearch = (a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             text.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'All' ||
                             (filter === 'Unread' && !a.is_read) ||
                             (filter === 'Read' && a.is_read);
        return matchesSearch && matchesFilter;
    });

    const handleDownloadAttachment = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        } catch (error) {
            console.error('Failed to download attachment:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-lyceum-blue mb-4" size={48} />
                <p className="text-gray-500 font-medium animate-pulse">Loading your announcements...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">

            {/* ── Header ── */}
            <div className="p-6 md:p-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Megaphone className="text-lyceum-blue" size={28} />
                            Announcements
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
                            Stay updated with the latest notices from Lyceum Academy
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search notices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl w-full sm:w-56 focus:ring-2 focus:ring-lyceum-blue/20 focus:border-lyceum-blue outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                            {(['All', 'Unread', 'Read'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        filter === f
                                        ? 'bg-lyceum-blue text-white shadow'
                                        : 'text-gray-500 hover:text-lyceum-blue'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── List ── */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar">
                {filteredAnnouncements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-12 bg-white dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4">
                            {searchQuery ? <SearchX size={40} className="text-gray-300" /> : <Inbox size={40} className="text-gray-300" />}
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white">No announcements found</h3>
                        <p className="text-gray-400 mt-2 text-sm">
                            {searchQuery ? 'Try different search terms' : "You're all caught up!"}
                        </p>
                    </div>
                ) : (
                    filteredAnnouncements.map((ann) => (
                        <button
                            key={ann.id}
                            onClick={() => handleOpenAnnouncement(ann)}
                            className={`w-full text-left p-5 rounded-2xl transition-all border group relative ${
                                ann.is_read
                                ? 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 hover:border-lyceum-blue/30'
                                : 'bg-white dark:bg-gray-800 border-lyceum-blue/30 shadow-sm shadow-lyceum-blue/10 hover:shadow-md hover:border-lyceum-blue/50'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                                    ann.is_read
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                    : 'bg-lyceum-blue/10 text-lyceum-blue'
                                }`}>
                                    <Megaphone size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className={`font-bold text-base truncate ${
                                            ann.is_read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                                        }`}>
                                            {ann.title}
                                        </h3>
                                        {!ann.is_read && (
                                            <span className="flex-shrink-0 px-2 py-0.5 bg-lyceum-blue text-white text-[10px] font-black uppercase rounded-full">New</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                        {stripHtml(ann.content)}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-[11px] font-semibold text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={11} />
                                            {new Date(ann.sent_at || ann.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        {ann.attachments?.length > 0 && (
                                            <span className="flex items-center gap-1 text-lyceum-blue">
                                                <Paperclip size={11} />
                                                {ann.attachments.length} file(s)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-300 group-hover:text-lyceum-blue transition-colors flex-shrink-0" size={18} />
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* ── Overlay Modal ── */}
            {selectedAnnouncement && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedAnnouncement(null); }}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col"
                        style={{ width: '100%', maxWidth: '680px', height: '80vh', maxHeight: '80vh' }}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start gap-4 p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                            <div className="p-2.5 bg-lyceum-blue/10 text-lyceum-blue rounded-xl flex-shrink-0">
                                <Megaphone size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight line-clamp-2">
                                    {selectedAnnouncement.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock size={11} />
                                        {new Date(selectedAnnouncement.sent_at || selectedAnnouncement.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    {selectedAnnouncement.is_read ? (
                                        <span className="flex items-center gap-1 text-green-500">
                                            <CheckCircle2 size={11} /> Read
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-lyceum-blue text-white text-[10px] font-bold rounded-full">New</span>
                                    )}
                                </div>
                            </div>
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 rounded-xl text-gray-500 transition-colors"
                                title="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body — scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div
                                className="announcement-content text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content || '<p>No content</p>' }}
                            />

                            {selectedAnnouncement.attachments?.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <h4 className="text-xs font-black text-gray-700 dark:text-white flex items-center gap-2 uppercase tracking-widest mb-4">
                                        <Paperclip size={14} className="text-lyceum-blue" />
                                        Attachments
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedAnnouncement.attachments.map((file: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-transparent hover:border-lyceum-blue/20 transition-all"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="p-2 bg-white dark:bg-gray-700 rounded-lg text-lyceum-blue shadow-sm">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{file.name}</p>
                                                        <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadAttachment(file.url, file.name)}
                                                    className="p-2 text-lyceum-blue hover:bg-lyceum-blue hover:text-white rounded-lg transition-all"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {!selectedAnnouncement.is_read && (
                            <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => handleMarkAsRead(selectedAnnouncement.id)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-lyceum-blue text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-all"
                                >
                                    <CheckCircle2 size={15} />
                                    Mark as Read
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
                .announcement-content h1, .announcement-content h2, .announcement-content h3 { font-weight: 700; margin-bottom: 0.5rem; margin-top: 1rem; }
                .announcement-content h1 { font-size: 1.25rem; }
                .announcement-content h2 { font-size: 1.1rem; }
                .announcement-content h3 { font-size: 1rem; }
                .announcement-content p { margin-bottom: 0.75rem; }
                .announcement-content ul, .announcement-content ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
                .announcement-content li { margin-bottom: 0.25rem; }
                .announcement-content table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: 0.85rem; }
                .announcement-content td, .announcement-content th { padding: 8px 10px; border: 1px solid #e2e8f0; }
                .dark .announcement-content td, .dark .announcement-content th { border-color: #374151; }
                .announcement-content a { color: #3b82f6; text-decoration: underline; }
                .announcement-content strong, .announcement-content b { font-weight: 700; }
                .announcement-content em, .announcement-content i { font-style: italic; }
                .announcement-content u { text-decoration: underline; }
                .announcement-content br { display: block; margin-bottom: 0.25rem; }
            `}</style>
        </div>
    );
};

export default StudentAnnouncementsView;
