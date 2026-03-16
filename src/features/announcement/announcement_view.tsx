import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Mail, 
  Users, 
  Filter, 
  Eye, 
  Send, 
  Calendar,
  Paperclip,
  CheckCircle2,
  X,
  ChevronRight,
  Loader2
} from '@/components/common/icons';
import * as api from '@/utils/api';
import type { Announcement, User, EmailTemplate } from '@/types';

interface AnnouncementViewProps {
  user: User;
}

const AnnouncementView: React.FC<AnnouncementViewProps> = ({ user }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    sendViaEmail: false,
    scheduledAt: '',
    audienceFilters: {
      visaType: '',
      degree: '',
      fileStatus: ''
    }
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    setIsTemplatesLoading(true);
    try {
      const data = await api.getEmailTemplates();
      setEmailTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsTemplatesLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) loadTemplates();
  }, [isModalOpen]);

  useEffect(() => {
    const fetchPreviewCount = async () => {
      setIsPreviewLoading(true);
      try {
        const { count } = await api.getAnnouncementPreviewCount(formData.audienceFilters);
        setPreviewCount(count);
      } catch (error) {
        console.error('Failed to fetch preview count:', error);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    if (isModalOpen) {
      const timer = setTimeout(fetchPreviewCount, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.audienceFilters, isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('sendViaEmail', String(formData.sendViaEmail));
      if (formData.scheduledAt) formDataToSend.append('scheduledAt', formData.scheduledAt);
      formDataToSend.append('audienceFilters', JSON.stringify(formData.audienceFilters));
      
      selectedFiles.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      await api.createAnnouncement(formDataToSend);
      setIsModalOpen(false);
      loadAnnouncements();
      setFormData({
        title: '',
        content: '',
        sendViaEmail: false,
        scheduledAt: '',
        audienceFilters: {
          visaType: '',
          degree: '',
          fileStatus: ''
        }
      });
      setSelectedFiles([]);
    } catch (error) {
      alert('Failed to create announcement');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const applyTemplate = (templateId: string) => {
    const template = emailTemplates.find(t => String(t.id) === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.subject,
        content: template.body
      }));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(id);
      loadAnnouncements();
    } catch (error) {
      alert('Failed to delete announcement');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
            Announcements
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
            Broadcast messages and updates to targeted student groups.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all hover:scale-105 shadow-xl shadow-blue-500/20 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Create New
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-20 text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Megaphone className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Announcements Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Your primary channel for broadcasting critical information will appear here once created.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Announcement</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Recipients</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {announcements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{ann.title}</span>
                        <span className="text-sm text-gray-500 mt-1 line-clamp-1 italic">By {ann.creator_name || 'Admin'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{ann.read_count} read</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        ann.status === 'Delivered' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {ann.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400 tabular-nums font-medium">
                      {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => handleDelete(ann.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <Plus className="w-6 h-6 text-blue-600" />
                New Announcement
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-8 space-y-8 flex-grow custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 flex justify-between items-center">
                      <span>Pick from Template (Optional)</span>
                      {isTemplatesLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    </label>
                    <select
                      onChange={(e) => applyTemplate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    >
                      <option value="">-- Choose a template --</option>
                      {emailTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Announcement Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      placeholder="e.g. Important Update Regarding Visa Fees"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Message Content (HTML Supported)</label>
                    <textarea
                      required
                      rows={6}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                      placeholder="Compose your message here..."
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 select-none cursor-pointer group" onClick={() => setFormData({ ...formData, sendViaEmail: !formData.sendViaEmail })}>
                    <div className={`p-2 rounded-lg transition-all ${formData.sendViaEmail ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-grow">
                      <span className="block font-bold text-gray-900 dark:text-white">Send via Email</span>
                      <span className="text-xs text-gray-500">Also deliver this message to their inbox</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-all relative ${formData.sendViaEmail ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.sendViaEmail ? 'left-7' : 'left-1'}`} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Filter className="w-4 h-4" /> Audience Targeting
                    </label>
                    
                    <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Visa Type</label>
                        <select
                          value={formData.audienceFilters.visaType}
                          onChange={(e) => setFormData({ ...formData, audienceFilters: { ...formData.audienceFilters, visaType: e.target.value }})}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold"
                        >
                          <option value="">All Visa Types</option>
                          <option value="Student Visa">Student Visa</option>
                          <option value="Visit Visa">Visit Visa</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Degree Type</label>
                        <select
                          value={formData.audienceFilters.degree}
                          onChange={(e) => setFormData({ ...formData, audienceFilters: { ...formData.audienceFilters, degree: e.target.value }})}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold"
                        >
                          <option value="">All Degrees</option>
                          <option value="Bachelor's">Bachelor's</option>
                          <option value="Master's">Master's</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">File Status</label>
                        <select
                          value={formData.audienceFilters.fileStatus}
                          onChange={(e) => setFormData({ ...formData, audienceFilters: { ...formData.audienceFilters, fileStatus: e.target.value }})}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold"
                        >
                          <option value="">Any Status</option>
                          <option value="In progress">In progress</option>
                          <option value="On hold">On hold</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-500">Target Preview:</span>
                        {isPreviewLoading ? (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : (
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-black tracking-wider">
                            {previewCount !== null ? `${previewCount} Students` : '--'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Schedule Broadcast (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        Attachments
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                      >
                        Add Files
                      </button>
                    </label>
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {selectedFiles.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner custom-scrollbar">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 group">
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                              <span className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                      >
                        <Paperclip className="w-6 h-6 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        <span className="text-xs font-bold text-gray-400 group-hover:text-blue-600 transition-colors text-center">
                          Click to attach PDF, Images, or Video
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-4 bg-gray-50/50 dark:bg-gray-800/20 -mx-8 -mb-8 p-8 mt-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all hover:scale-105 shadow-xl shadow-blue-500/20"
                >
                  <Send className="w-5 h-5" />
                  {formData.scheduledAt ? 'Schedule' : 'Broadcast Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
      `}</style>
    </div>
  );
};

export default AnnouncementView;
