import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Megaphone, 
    Plus, 
    Users, 
    Send, 
    Calendar, 
    Trash2, 
    Search,
    Filter,
    FileText,
    Paperclip,
    AlertCircle,
    CheckCircle2,
    X,
    ChevronRight,
    RefreshCw as Loader2
} from '@/components/common/icons';
import { 
    getAnnouncements, 
    createAnnouncement, 
    deleteAnnouncement, 
    getAnnouncementRecipientCount,
    getEmailTemplates 
} from '@/utils/api';
import type { User } from '@/types';

interface AnnouncementViewProps {
    user: User;
}

const AnnouncementView: React.FC<AnnouncementViewProps> = ({ user }) => {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        filters: {
            fileStatus: 'All',
            visaType: 'All',
            studentDegree: 'All',
            leadStatus: 'All'
        },
        attachments: [] as any[],
        scheduleDate: '',
        sendEmail: true
    });
    
    const [recipientCount, setRecipientCount] = useState<number | null>(null);
    const [isCounting, setIsCounting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const contentEditorRef = useRef<HTMLDivElement>(null);

    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setIsLoadingTemplates(true);
            const data = await getEmailTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const handleTemplateChange = (templateId: string) => {
        if (!templateId) return;
        const template = templates.find(t => String(t.id) === templateId);
        if (template) {
            const newContent = template.body || '';
            setFormData(prev => ({
                ...prev,
                title: template.subject || prev.title,
                content: newContent
            }));
            // Sync the contenteditable div immediately
            if (contentEditorRef.current) {
                contentEditorRef.current.innerHTML = newContent;
            }
        }
    };

    const handleEditorInput = useCallback(() => {
        if (contentEditorRef.current) {
            setFormData(prev => ({ ...prev, content: contentEditorRef.current!.innerHTML }));
        }
    }, []);

    const execFormat = (command: string, value?: string) => {
        contentEditorRef.current?.focus();
        document.execCommand(command, false, value);
        handleEditorInput();
    };

    // Update recipient count when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isCreateModalOpen) {
                updateRecipientCount();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.filters, isCreateModalOpen]);

    const fetchAnnouncements = async () => {
        try {
            setIsLoading(true);
            const data = await getAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateRecipientCount = async () => {
        try {
            setIsCounting(true);
            const { count } = await getAnnouncementRecipientCount(formData.filters);
            setRecipientCount(count);
        } catch (error) {
            console.error('Failed to count recipients:', error);
        } finally {
            setIsCounting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const { uploadAnnouncementAttachment } = await import('@/utils/api');
            const result = await uploadAnnouncementAttachment(file);
            setFormData(prev => ({
                ...prev,
                attachments: [...prev.attachments, result]
            }));
        } catch (error: any) {
            alert('Upload failed: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const removeAttachment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            await createAnnouncement(formData);
            setIsCreateModalOpen(false);
            setFormData({
                title: '',
                content: '',
                filters: {
                    fileStatus: 'All',
                    visaType: 'All',
                    studentDegree: 'All',
                    leadStatus: 'All'
                },
                attachments: [],
                scheduleDate: '',
                sendEmail: true
            });
            fetchAnnouncements();
        } catch (error: any) {
            alert('Failed to create announcement: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await deleteAnnouncement(id);
            fetchAnnouncements();
        } catch (error: any) {
            alert('Failed to delete: ' + error.message);
        }
    };

    if (isLoading && announcements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Announcements...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Megaphone className="text-amber-600 dark:text-amber-400" size={28} />
                        </div>
                        Announcements
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and send targeted announcements to students.</p>
                </div>
                
                {user.role === 'Admin' && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={20} />
                        New Announcement
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Send size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sent</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{announcements.length}</div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Users size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Reach</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {announcements.reduce((acc, curr) => acc + (parseInt(curr.recipient_count) || 0), 0)}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <Calendar size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {announcements.filter(a => a.scheduled_at && new Date(a.scheduled_at) > new Date()).length}
                    </div>
                </div>
            </div>

            {/* Announcements List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sent History</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search history..."
                            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-amber-500 text-sm w-64 transition-all"
                        />
                    </div>
                </div>

                {announcements.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex p-4 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 mb-4">
                            <Megaphone size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Announcements Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Start by creating your first targeted announcement to reach your students.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Announcement</th>
                                    <th className="px-6 py-4">Audience</th>
                                    <th className="px-6 py-4">Stats</th>
                                    <th className="px-6 py-4">Sent/Scheduled</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {announcements.map((ann) => (
                                    <tr key={ann.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 dark:text-white mb-1">{ann.title}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{ann.content.replace(/<[^>]*>/g, '')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(ann.filter_data || {}).map(([key, val]) => (
                                                    val !== 'All' && (
                                                        <span key={key} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-[10px] font-bold">
                                                            {val as string}
                                                        </span>
                                                    )
                                                ))}
                                                {Object.values(ann.filter_data || {}).every(v => v === 'All') && (
                                                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-bold">
                                                        All Students
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                                    <Users size={12} className="text-gray-400" />
                                                    <span>{ann.recipient_count || '0'} Recipients</span>
                                                </div>
                                                {ann.attachments?.length > 0 && (
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600">
                                                        <Paperclip size={10} />
                                                        <span>{ann.attachments.length} Attachment(s)</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {ann.sent_at ? new Date(ann.sent_at).toLocaleDateString() : 'Scheduled'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold">
                                                    {ann.scheduled_at && new Date(ann.scheduled_at) > new Date() ? 'Upcoming' : 'Delivered'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    className="p-2 text-gray-400 hover:text-amber-500 transition-colors"
                                                    title="View Details"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                                {user.role === 'Admin' && (
                                                    <button 
                                                        onClick={() => handleDelete(ann.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Announcement Modal */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsCreateModalOpen(false); }}
                >
                    <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300" style={{ maxHeight: '92vh' }}>
                        <div className="px-5 py-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-amber-50/50 dark:bg-amber-900/10 flex-shrink-0">
                            <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Megaphone className="text-amber-600" size={20} />
                                Create New Announcement
                            </h2>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    {templates.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Select from email Templates</label>
                                            <select 
                                                onChange={(e) => handleTemplateChange(e.target.value)}
                                                className="w-full px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl focus:ring-2 focus:ring-amber-500 transition-all font-medium text-blue-800 dark:text-blue-300"
                                            >
                                                <option value="">-- Choose a template to auto-fill --</option>
                                                {templates.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            placeholder="Enter announcement title..."
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Message Content</label>
                                        
                                        {/* Toolbar */}
                                        <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-t-xl border-b border-gray-200 dark:border-gray-600">
                                            {([
                                                { cmd: 'bold', label: <strong>B</strong>, title: 'Bold' },
                                                { cmd: 'italic', label: <em>I</em>, title: 'Italic' },
                                                { cmd: 'underline', label: <u>U</u>, title: 'Underline' },
                                            ] as const).map(({ cmd, label, title }) => (
                                                <button
                                                    key={cmd}
                                                    type="button"
                                                    title={title}
                                                    onMouseDown={(e) => { e.preventDefault(); execFormat(cmd); }}
                                                    className="px-2.5 py-1 text-sm rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors font-mono"
                                                >{label}</button>
                                            ))}
                                            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                                            {[
                                                { cmd: 'insertUnorderedList', label: '• List', title: 'Bullet List' },
                                                { cmd: 'insertOrderedList', label: '1. List', title: 'Ordered List' },
                                            ].map(({ cmd, label, title }) => (
                                                <button
                                                    key={cmd}
                                                    type="button"
                                                    title={title}
                                                    onMouseDown={(e) => { e.preventDefault(); execFormat(cmd); }}
                                                    className="px-2.5 py-1 text-xs rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                                                >{label}</button>
                                            ))}
                                            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                                            <select
                                                onChange={e => { e.preventDefault(); execFormat('formatBlock', e.target.value); e.target.value = ''; }}
                                                className="text-xs bg-transparent text-gray-600 dark:text-gray-300 focus:outline-none cursor-pointer"
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Heading</option>
                                                <option value="h2">H2</option>
                                                <option value="h3">H3</option>
                                                <option value="p">Paragraph</option>
                                            </select>
                                            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                                            <button
                                                type="button"
                                                title="Clear Formatting"
                                                onMouseDown={(e) => { e.preventDefault(); execFormat('removeFormat'); }}
                                                className="px-2 py-1 text-xs rounded-lg hover:bg-white dark:hover:bg-gray-800 text-red-500 transition-colors"
                                            >✕ Clear</button>
                                        </div>

                                        {/* Content-Editable Area */}
                                        <div
                                            ref={contentEditorRef}
                                            contentEditable
                                            suppressContentEditableWarning
                                            onInput={handleEditorInput}
                                            dangerouslySetInnerHTML={{ __html: formData.content }}
                                            data-placeholder="Write your announcement message here..."
                                            className="w-full min-h-[160px] px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all prose prose-sm dark:prose-invert max-w-none [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-gray-400 [&:empty:before]:pointer-events-none"
                                        />
                                    </div>
                                </div>

                                {/* Filters Section */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Filter size={18} className="text-amber-600" />
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Audience Targeting</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">File Status</label>
                                            <select 
                                                value={formData.filters.fileStatus}
                                                onChange={(e) => setFormData({...formData, filters: {...formData.filters, fileStatus: e.target.value}})}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-amber-500 font-medium"
                                            >
                                                <option value="All">All Statuses</option>
                                                <option value="In progress">In Progress</option>
                                                <option value="Closed">Closed</option>
                                                <option value="On hold">On Hold</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lead Status (CRM)</label>
                                            <select 
                                                value={formData.filters.leadStatus}
                                                onChange={(e) => setFormData({...formData, filters: {...formData.filters, leadStatus: e.target.value}})}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-amber-500 font-medium"
                                            >
                                                <option value="All">All Lead Statuses</option>
                                                <option value="New">New</option>
                                                <option value="Qualified">Qualified</option>
                                                <option value="Proposal">Proposal</option>
                                                <option value="Won">Won</option>
                                                <option value="Lost">Lost</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Visa Type</label>
                                            <select 
                                                value={formData.filters.visaType}
                                                onChange={(e) => setFormData({...formData, filters: {...formData.filters, visaType: e.target.value}})}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-amber-500 font-medium"
                                            >
                                                <option value="All">All Types</option>
                                                <option value="Student Visa">Student Visa</option>
                                                <option value="Visit Visa">Visit Visa</option>
                                            </select>
                                        </div>

                                        {formData.filters.visaType === 'Student Visa' && (
                                            <div className="animate-in slide-in-from-left-2 duration-300">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Degree Type</label>
                                                <select 
                                                    value={formData.filters.studentDegree}
                                                    onChange={(e) => setFormData({...formData, filters: {...formData.filters, studentDegree: e.target.value}})}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-amber-500 font-medium"
                                                >
                                                    <option value="All">All Degrees</option>
                                                    <option value="Bachelor's">Bachelor's</option>
                                                    <option value="Master's">Master's</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recipient Count Preview */}
                                    <div className="mt-6 flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                        <div className="flex items-center gap-2">
                                            <Users size={16} className="text-amber-600" />
                                            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-tighter">Target Audience Preview</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isCounting ? (
                                                <Loader2 size={14} className="animate-spin text-amber-600" />
                                            ) : (
                                                <span className="text-lg font-black text-amber-600">
                                                    {recipientCount !== null ? recipientCount : '0'} Students
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments & Scheduling */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Attachments</label>
                                        
                                        {formData.attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {formData.attachments.map((file, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg group animate-in zoom-in-95">
                                                        <FileText size={14} className="text-amber-600" />
                                                        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                                                            {file.name}
                                                        </span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeAttachment(idx)}
                                                            className="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-full text-red-500 transition-colors"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-all">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    {isUploading ? (
                                                        <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                                                    ) : (
                                                        <Paperclip className="w-6 h-6 text-gray-400 mb-1" />
                                                    )}
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                        {isUploading ? 'Uploading...' : 'Click to add PDF, Image, Video'}
                                                    </p>
                                                </div>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={handleFileUpload}
                                                    accept=".pdf,image/*,video/*"
                                                    disabled={isUploading}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Schedule (Optional)</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input 
                                                type="datetime-local" 
                                                value={formData.scheduleDate}
                                                onChange={(e) => setFormData({...formData, scheduleDate: e.target.value})}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-medium"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 italic">Leave empty to send immediately.</p>
                                    </div>
                                </div>

                                {/* Email Notification Toggle */}
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                            <Plus size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Email Notification</h4>
                                            <p className="text-[10px] text-gray-500 font-medium">Send automated emails to all recipients</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.sendEmail}
                                            onChange={(e) => setFormData({...formData, sendEmail: e.target.checked})}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-6 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting || (recipientCount === 0 && formData.filters.fileStatus !== 'All')}
                                    className="flex-[2] flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            {formData.scheduleDate ? 'Schedule Announcement' : 'Send Announcement Now'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementView;
