import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Clock, FileText, Eye, X, Download,
  AlertCircle, User, FolderOpen, Filter, RefreshCw
} from 'lucide-react';
import {
  getDocumentSubmissions,
  approveDocumentSubmission,
  rejectDocumentSubmission,
  downloadDocumentSubmission,
  API_BASE_URL,
  getToken,
} from '@/utils/api';

interface Submission {
  id: number;
  contact_id: number;
  filename: string;
  content_type: string;
  file_size: number;
  category: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  student_name: string;
  student_email: string;
  reviewed_by_name: string | null;
  contact_ref: string | null;
}

const statusConfig = {
  pending:  { label: 'Pending Review', icon: Clock,       bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-300',  border: 'border-amber-300 dark:border-amber-700' },
  approved: { label: 'Approved',       icon: CheckCircle, bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300',  border: 'border-green-300 dark:border-green-700' },
  rejected: { label: 'Rejected',       icon: XCircle,     bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-300',      border: 'border-red-300 dark:border-red-700' },
};

const formatSize = (bytes: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ——— Preview Modal ———
const PreviewModal: React.FC<{ submission: Submission; onClose: () => void }> = ({ submission, onClose }) => {
  const url = `${API_BASE_URL}/document-submissions/${submission.id}/file?preview=true`;
  const isImage = submission.content_type?.startsWith('image/');
  const isPdf = submission.content_type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{submission.filename}</p>
            <p className="text-xs text-gray-500">by {submission.student_name} · {formatSize(submission.file_size)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => downloadDocumentSubmission(submission.id, submission.filename)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              <Download size={14} /> Download
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 flex items-center justify-center min-h-64">
          {isImage ? (
            <img src={url} alt={submission.filename} className="max-w-full max-h-[70vh] object-contain" />
          ) : isPdf ? (
            <iframe src={url} className="w-full h-[70vh]" title={submission.filename} />
          ) : (
            <div className="text-center p-16">
              <FileText size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Preview not available for this file type</p>
              <button onClick={() => downloadDocumentSubmission(submission.id, submission.filename)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Download to view</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ——— Reject Modal ———
const RejectModal: React.FC<{
  submission: Submission;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}> = ({ submission, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Reject Document</h3>
        <p className="text-sm text-gray-500 mb-4">Provide a reason for rejecting <span className="font-medium text-gray-700 dark:text-gray-300">"{submission.filename}"</span></p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Document is unclear, please re-upload a higher quality scan."
          className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none h-28 focus:ring-2 focus:ring-red-400 focus:border-transparent"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle size={15} />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

// ——— Main Component ———
const StaffDocumentManagerView: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [previewSub, setPreviewSub] = useState<Submission | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Submission | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDocumentSubmissions();
      setSubmissions(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (sub: Submission) => {
    setActionLoading(sub.id);
    try {
      await approveDocumentSubmission(sub.id);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    try {
      await rejectDocumentSubmission(rejectTarget.id, reason);
      setRejectTarget(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = submissions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !s.filename.toLowerCase().includes(search.toLowerCase()) &&
        !s.student_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {previewSub && <PreviewModal submission={previewSub} onClose={() => setPreviewSub(null)} />}
      {rejectTarget && (
        <RejectModal
          submission={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          loading={actionLoading === rejectTarget.id}
        />
      )}

      {/* Header */}
      <div className="relative px-6 py-5 bg-gradient-to-r from-slate-700 via-slate-800 to-gray-900 text-white shrink-0">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
        <div className="relative flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Document Manager</h1>
            <p className="text-slate-400 text-sm">Review and approve student document submissions</p>
          </div>
          <button onClick={load} className="p-2 rounded-lg hover:bg-white/10 transition-colors mt-1" title="Refresh">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-white text-slate-800 shadow'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {f} <span className="ml-1 opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <input
          type="text"
          placeholder="Search by student name or filename…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="mx-6 mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Submissions List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading submissions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <FolderOpen size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No submissions found</h3>
            <p className="text-gray-500 text-sm">
              {filter !== 'all' ? `No ${filter} submissions match your search.` : 'Students have not submitted any documents yet.'}
            </p>
          </div>
        ) : (
          filtered.map(sub => {
            const cfg = statusConfig[sub.status];
            const Icon = cfg.icon;
            const isActing = actionLoading === sub.id;

            return (
              <div key={sub.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5 flex items-start gap-4">
                  {/* File icon */}
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <FileText size={24} className="text-blue-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{sub.filename}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <User size={11} /> {sub.student_name || '—'}
                          </span>
                          {sub.contact_ref && <span className="text-xs text-gray-400">({sub.contact_ref})</span>}
                          {sub.category && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                              {sub.category}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{formatSize(sub.file_size)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Submitted {formatDate(sub.created_at)}</p>
                        {sub.status === 'rejected' && sub.rejection_reason && (
                          <div className="mt-2 flex items-start gap-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                            <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-600 dark:text-red-400">Reason: {sub.rejection_reason}</p>
                          </div>
                        )}
                        {sub.reviewed_by_name && (
                          <p className="text-xs text-gray-400 mt-1">
                            Reviewed by {sub.reviewed_by_name} · {sub.reviewed_at && formatDate(sub.reviewed_at)}
                          </p>
                        )}
                      </div>

                      {/* Status + Actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <Icon size={11} /> {cfg.label}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewSub(sub)}
                            title="Preview"
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => downloadDocumentSubmission(sub.id, sub.filename)}
                            title="Download"
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                          >
                            <Download size={16} />
                          </button>

                          {sub.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(sub)}
                                disabled={isActing}
                                title="Approve"
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isActing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={13} />}
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectTarget(sub)}
                                disabled={isActing}
                                title="Reject"
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StaffDocumentManagerView;
