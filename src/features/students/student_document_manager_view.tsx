import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UploadCloud, Trash2, Eye, X, CheckCircle, XCircle, Clock, FileText,
  FolderOpen, AlertCircle, Download, ChevronDown, ChevronRight,
  Shield, Lock, Sparkles, TrendingUp, RefreshCw, FileUp
} from 'lucide-react';
import {
  getDocumentSubmissions,
  uploadDocumentSubmission,
  deleteDocumentSubmission,
  downloadDocumentSubmission,
} from '@/utils/api';
import { API_BASE_URL } from '@/utils/api';
import { getStudentUploadCategories, STAFF_ONLY_DOCUMENT_CATEGORIES } from '@/lib/constants';
import type { Contact } from '@/types';

interface Props { contact: Contact | null; }

interface Submission {
  id: number;
  filename: string;
  content_type: string;
  file_size: number;
  category: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

/* ─ helpers ─────────────────────────────────────────────────────────────── */
const fmt = (b: number) => {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const fileEmoji = (ct: string) => {
  if (!ct) return '📎';
  if (ct.startsWith('image/')) return '🖼️';
  if (ct === 'application/pdf') return '📄';
  if (ct.includes('word')) return '📝';
  if (ct.includes('sheet') || ct.includes('excel')) return '📊';
  if (ct.includes('zip') || ct.includes('rar')) return '📦';
  return '📎';
};

const STATUS = {
  pending:  { label: 'Under Review', Icon: Clock,       cls: 'bg-amber-50  dark:bg-amber-900/20  text-amber-700  dark:text-amber-300  border border-amber-200  dark:border-amber-700/50' },
  approved: { label: 'Approved',     Icon: CheckCircle, cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50' },
  rejected: { label: 'Rejected',     Icon: XCircle,     cls: 'bg-red-50    dark:bg-red-900/20    text-red-700    dark:text-red-300    border border-red-200    dark:border-red-700/50' },
} as const;

/* ─ Preview Modal ─────────────────────────────────────────────────────────── */
const PreviewModal: React.FC<{ sub: Submission; onClose: () => void }> = ({ sub, onClose }) => {
  const url = `${API_BASE_URL}/document-submissions/${sub.id}/file?preview=true`;
  const isImg = sub.content_type?.startsWith('image/');
  const isPdf = sub.content_type === 'application/pdf';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-5xl flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700"
        style={{ maxHeight: '94vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* header */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 shrink-0">
            {fileEmoji(sub.content_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{sub.filename}</p>
            <p className="text-xs text-gray-400 mt-0.5">{fmt(sub.file_size)}</p>
          </div>
          <button
            onClick={() => downloadDocumentSubmission(sub.id, sub.filename)}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Download size={13} /> Download
          </button>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950 min-h-[40vh]">
          {isImg
            ? <img src={url} alt={sub.filename} className="max-w-full object-contain rounded-2xl shadow-lg" style={{ maxHeight: '65vh' }} />
            : isPdf
              ? <iframe src={url} className="w-full rounded-xl" style={{ height: 'min(65vh,700px)' }} title={sub.filename} />
              : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">{fileEmoji(sub.content_type)}</div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Preview not available</p>
                  <p className="text-gray-400 text-sm mb-5">{sub.content_type}</p>
                  <button
                    onClick={() => downloadDocumentSubmission(sub.id, sub.filename)}
                    className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >Download file</button>
                </div>
              )
          }
        </div>

        {/* mobile download bar */}
        <div className="sm:hidden px-4 pb-6 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => downloadDocumentSubmission(sub.id, sub.filename)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Download size={15} /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─ Progress bar ──────────────────────────────────────────────────────────── */
const ProgressBar: React.FC<{ approved: number; pending: number; rejected: number; total: number }> = ({ approved, pending, rejected, total }) => {
  if (total === 0) return null;
  return (
    <div className="w-full h-1 rounded-full overflow-hidden mt-1.5 bg-gray-100 dark:bg-gray-700/50">
      <div className="h-full flex">
        {approved > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(approved / total) * 100}%`, transition: 'width .6s ease' }} />}
        {pending  > 0 && <div className="h-full bg-amber-400"   style={{ width: `${(pending  / total) * 100}%`, transition: 'width .6s ease' }} />}
        {rejected > 0 && <div className="h-full bg-red-500"     style={{ width: `${(rejected / total) * 100}%`, transition: 'width .6s ease' }} />}
      </div>
    </div>
  );
};

/* ─ Main ──────────────────────────────────────────────────────────────────── */
const StudentDocumentManagerView: React.FC<Props> = ({ contact }) => {
  const [submissions, setSubmissions]   = useState<Submission[]>([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [selectedCategory, setSelected] = useState('');
  const [expanded, setExpanded]         = useState<Set<string>>(new Set());
  const [previewSub, setPreviewSub]     = useState<Submission | null>(null);
  const [deletingId, setDeletingId]     = useState<number | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [dragOver, setDragOver]         = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadCategories = getStudentUploadCategories(contact?.visaType, contact?.degree);

  const load = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try { const data = await getDocumentSubmissions(); setSubmissions(data); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const doUpload = async (file: File) => {
    if (!file || !selectedCategory) return;
    setUploading(true); setError(null);
    try {
      await uploadDocumentSubmission(file, selectedCategory);
      setSelected('');
      if (fileRef.current) fileRef.current.value = '';
      await load(true);
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try { await deleteDocumentSubmission(id); setSubmissions(p => p.filter(s => s.id !== id)); }
    catch (e: any) { setError(e.message); }
    finally { setDeletingId(null); }
  };

  const toggle = (cat: string) =>
    setExpanded(p => { const n = new Set(p); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });

  const byCategory = useMemo(() =>
    (submissions as Submission[]).reduce<Record<string, Submission[]>>((acc, s) => {
      const k = s.category || 'Uncategorized';
      (acc[k] ??= []).push(s);
      return acc;
    }, {}), [submissions]);

  const pending  = submissions.filter(s => s.status === 'pending').length;
  const approved = submissions.filter(s => s.status === 'approved').length;
  const rejected = submissions.filter(s => s.status === 'rejected').length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-950">
      {previewSub && <PreviewModal sub={previewSub} onClose={() => setPreviewSub(null)} />}

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="relative shrink-0 px-4 sm:px-6 pt-5 pb-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        {/* top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-500/30">
              <FileUp size={18} className="text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                Document Manager
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block mt-0.5">
                Upload documents for staff review &amp; approval
              </p>
            </div>
          </div>
          <button
            onClick={() => load(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mt-1"
            title="Refresh"
          >
            <RefreshCw size={14} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* stats row */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { label: 'Total',    value: submissions.length, light: 'bg-indigo-50  text-indigo-700  border-indigo-200',  dark: 'dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800' },
            { label: 'Pending',  value: pending,            light: 'bg-amber-50   text-amber-700   border-amber-200',   dark: 'dark:bg-amber-900/20  dark:text-amber-300  dark:border-amber-800'  },
            { label: 'Approved', value: approved,           light: 'bg-emerald-50 text-emerald-700 border-emerald-200', dark: 'dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' },
            { label: 'Rejected', value: rejected,           light: 'bg-red-50     text-red-700     border-red-200',     dark: 'dark:bg-red-900/20    dark:text-red-300    dark:border-red-800'    },
          ].map(s => (
            <div key={s.label} className={`flex flex-col items-center px-3 sm:px-4 py-2 rounded-2xl border shrink-0 min-w-[62px] sm:min-w-[72px] ${s.light} ${s.dark}`}>
              <span className="text-lg sm:text-2xl font-bold tabular-nums">{s.value}</span>
              <span className="text-[10px] sm:text-xs mt-0.5 opacity-75">{s.label}</span>
            </div>
          ))}
          {submissions.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 ml-auto shrink-0">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className={`text-xs font-medium ${approved > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                {approved > 0 ? `${Math.round((approved / submissions.length) * 100)}% approved` : 'No approvals yet'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ══ UPLOAD ZONE ═════════════════════════════════════════════════════ */}
      <div className="shrink-0 px-4 sm:px-6 py-3">
        <div
          className={`rounded-2xl border-2 transition-all duration-200 ${
            dragOver
              ? 'border-dashed border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) doUpload(f); }}
        >
          <div className="px-4 sm:px-5 py-3.5 sm:py-4">
            {/* label */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                <UploadCloud size={12} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Upload Document</span>
              <span className="text-xs text-gray-400 hidden sm:inline">· drag &amp; drop or browse</span>
            </div>

            {/* controls */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <select
                  value={selectedCategory}
                  onChange={e => setSelected(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none border appearance-none transition-colors bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:border-emerald-400 dark:focus:border-emerald-600"
                >
                  <option value="">— Select category —</option>
                  {uploadCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>

              <label
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  selectedCategory
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/40 cursor-pointer hover:scale-[1.02] active:scale-95'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                }`}
              >
                {uploading
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Uploading…</span></>
                  : <><UploadCloud size={14} /><span>Choose File</span></>
                }
                <input ref={fileRef} type="file" className="sr-only" disabled={!selectedCategory || uploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); }} />
              </label>
            </div>

            {/* hints */}
            {dragOver && (
              <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5">
                <UploadCloud size={11} /> {selectedCategory ? `Drop to upload to "${selectedCategory}"` : 'Select a category first'}
              </p>
            )}
            {error && (
              <div className="mt-2.5 px-3 py-2 rounded-xl flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400 leading-snug">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ CATEGORY LIST ═══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-2">

        {loading ? (
          /* skeleton */
          <div className="space-y-2 pt-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse bg-gray-200 dark:bg-gray-800" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>

        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mb-5 rounded-3xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <FolderOpen size={38} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">No documents yet</h3>
            <p className="text-sm leading-relaxed max-w-xs text-gray-500 dark:text-gray-400">
              Select a category above and upload your first document — staff will review and approve it.
            </p>
          </div>

        ) : (
          (Object.entries(byCategory) as [string, Submission[]][]).map(([cat, subs]) => {
            const isOpen  = expanded.has(cat);
            const isStaff = STAFF_ONLY_DOCUMENT_CATEGORIES.has(cat);
            const app = subs.filter(s => s.status === 'approved').length;
            const pen = subs.filter(s => s.status === 'pending').length;
            const rej = subs.filter(s => s.status === 'rejected').length;

            return (
              <div
                key={cat}
                className={`rounded-2xl overflow-hidden border transition-all duration-200 ${
                  isOpen
                    ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-md dark:shadow-black/20'
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                }`}
              >
                {/* category header */}
                <button
                  onClick={() => toggle(cat)}
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group text-left"
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 border ${
                    isStaff
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                      : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {isStaff
                      ? <Shield size={15} className="text-indigo-500 dark:text-indigo-400" />
                      : <FolderOpen size={15} className="text-emerald-600 dark:text-emerald-400" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{cat}</span>
                      {isStaff && (
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                          <Lock size={8} /> Staff managed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {app > 0 && <span className="text-[11px] text-emerald-600 dark:text-emerald-400">{app} approved</span>}
                      {pen > 0 && <span className="text-[11px] text-amber-600 dark:text-amber-400">{pen} pending</span>}
                      {rej > 0 && <span className="text-[11px] text-red-600 dark:text-red-400">{rej} rejected</span>}
                      {app === 0 && pen === 0 && rej === 0 && <span className="text-[11px] text-gray-400">{subs.length} file{subs.length !== 1 ? 's' : ''}</span>}
                    </div>
                    <ProgressBar approved={app} pending={pen} rejected={rej} total={subs.length} />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 tabular-nums">{subs.length}</span>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      {isOpen
                        ? <ChevronDown size={13} className="text-gray-400" />
                        : <ChevronRight size={13} className="text-gray-400" />
                      }
                    </div>
                  </div>
                </button>

                {/* rows */}
                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-gray-800">
                    {(subs as Submission[]).map((s, idx) => {
                      const cfg = STATUS[s.status];
                      const IconC = cfg.Icon;
                      const isDel = deletingId === s.id;

                      return (
                        <div
                          key={s.id}
                          className={`flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group ${
                            idx > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 mt-0.5 sm:mt-0 transition-transform group-hover:scale-110">
                            {fileEmoji(s.content_type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.filename}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{fmt(s.file_size)} · {fmtDate(s.created_at)}</p>

                            {/* status on mobile */}
                            <div className="sm:hidden mt-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
                                <IconC size={9} /> {cfg.label}
                              </span>
                            </div>

                            {s.status === 'rejected' && s.rejection_reason && (
                              <div className="mt-1.5 flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                                <AlertCircle size={10} className="text-red-500 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-red-600 dark:text-red-400 leading-snug">{s.rejection_reason}</p>
                              </div>
                            )}
                          </div>

                          {/* status on desktop */}
                          <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${cfg.cls}`}>
                            <IconC size={10} /> {cfg.label}
                          </span>

                          {/* actions */}
                          <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                            <button onClick={() => setPreviewSub(s)} title="Preview"
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 hover:scale-110 transition-transform">
                              <Eye size={13} className="text-indigo-600 dark:text-indigo-400" />
                            </button>
                            <button onClick={() => downloadDocumentSubmission(s.id, s.filename)} title="Download"
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform">
                              <Download size={13} className="text-gray-500 dark:text-gray-400" />
                            </button>
                            {s.status === 'pending' && (
                              <button onClick={() => handleDelete(s.id)} disabled={isDel} title="Delete"
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 hover:scale-110 transition-transform disabled:opacity-40">
                                {isDel
                                  ? <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-500 rounded-full animate-spin" />
                                  : <Trash2 size={13} className="text-red-500 dark:text-red-400" />
                                }
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
};

export default StudentDocumentManagerView;
