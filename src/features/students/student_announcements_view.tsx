import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Megaphone, 
  Search, 
  Calendar, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Filter,
  ChevronRight,
  Info,
  Paperclip,
  Loader2,
  X
} from '@/components/common/icons';
import * as api from '@/utils/api';
import type { Announcement, User } from '@/types';

interface StudentAnnouncementsViewProps {
  user: User;
}

const StudentAnnouncementsView: React.FC<StudentAnnouncementsViewProps> = ({ user }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStudentAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to load student announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAnnouncement = async (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setShowModal(true);
    if (!ann.isRead) {
      try {
        await api.markAnnouncementRead(ann.id);
        // Update local state to reflect read status
        setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, isRead: true } : a));
      } catch (e) {
        console.error('Failed to mark read');
      }
    }
  };

  const filteredAnnouncements = announcements.filter(ann => 
    ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ann.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
            Announcements
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
            Stay updated with the latest news and broadcasts from Lyceum Academy.
          </p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse">Fetching latest updates...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-[32px] p-20 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Megaphone className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No matches found' : 'All caught up!'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
            {searchTerm 
              ? `We couldn't find any announcements matching "${searchTerm}". Try a different term.`
              : 'There are no announcements for you at this time. Check back later for updates!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAnnouncements.map((ann) => (
            <div 
              key={ann.id}
              onClick={() => handleOpenAnnouncement(ann)}
              className={`group relative bg-white dark:bg-gray-900 p-6 rounded-[24px] border transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
                !ann.isRead 
                  ? 'border-indigo-600 dark:border-indigo-500 ring-4 ring-indigo-500/5' 
                  : 'border-gray-100 dark:border-gray-800 hover:border-indigo-200'
              }`}
            >
              {!ann.isRead && (
                <div className="absolute top-6 right-6 flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse shadow-lg shadow-indigo-500/30">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  New
                </div>
              )}
              
              <div className="flex items-start gap-6">
                <div className={`p-4 rounded-2xl shrink-0 transition-colors ${
                  !ann.isRead ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
                }`}>
                  <Megaphone className="w-6 h-6" />
                </div>
                
                <div className="flex-grow space-y-2 text-left">
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {ann.title}
                  </h2>
                  <div 
                    className="text-gray-500 dark:text-gray-400 font-medium line-clamp-2 italic"
                    dangerouslySetInnerHTML={{ __html: ann.content.replace(/<[^>]*>/g, ' ') }}
                  />
                </div>
                
                <div className="self-center hidden md:block">
                  <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedAnnouncement && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border border-white/10">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 flex justify-between items-start">
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest">
                  <Info className="w-4 h-4" />
                  Broadcast Information
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                  {selectedAnnouncement.title}
                </h2>
                <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedAnnouncement.created_at).toLocaleDateString(undefined, { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-bold"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto p-8 flex-grow custom-scrollbar text-left font-medium leading-relaxed">
              <div 
                className="prose prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}
              />
              
              {selectedAnnouncement.attachments_list && selectedAnnouncement.attachments_list.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Attachments</h4>
                  <div className="grid gap-3">
                    {selectedAnnouncement.attachments_list.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                            <Paperclip className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{file.filename}</span>
                        </div>
                        <button 
                          onClick={() => api.downloadAnnouncementAttachment(file.id, file.filename)}
                          className="text-indigo-600 font-bold text-sm hover:underline"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50 dark:bg-gray-800/50 flex justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="w-full max-w-xs py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3"
              >
                <CheckCircle2 className="w-6 h-6" />
                Understood
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
      `}</style>
    </div>
  );
};

export default StudentAnnouncementsView;
