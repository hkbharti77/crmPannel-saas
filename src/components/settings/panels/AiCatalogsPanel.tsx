import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText, Upload, Trash2, CheckCircle2, AlertCircle,
  Sparkles, ExternalLink, Play, Loader2, RefreshCw,
  Copy, Check, Search, Bot, Zap, Cloud, ShieldCheck,
  ArrowUpRight, X, SlidersHorizontal, CheckCircle, Download
} from 'lucide-react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { cx } from '@/lib/types';
import { apiFetch, getAuthToken, getTenantId } from '@/lib/api';

interface CatalogItem {
  id: string;
  title: string;
  description: string;
  aiTriggerInstruction: string;
  mediaType: string;
  mimeType: string;
  fileName: string;
  fileSizeBytes: number;
  cloudinaryUrl: string;
  status: 'ACTIVE' | 'DISABLED' | 'PROCESSING' | 'DELETING' | 'DELETED' | 'FAILED';
  createdAt: string;
}

interface TestTriggerResult {
  decision: 'SEND_CATALOG' | 'CLARIFY' | 'NONE';
  catalogId?: string;
  catalogTitle?: string;
  reason?: string;
  caption?: string;
  candidates?: Array<{
    catalogId: string;
    title: string;
    relevanceScore: number;
  }>;
  wouldSend: boolean;
}

const QUICK_TRIGGER_SUGGESTIONS = [
  'Pricing & Plans',
  'Product Brochure',
  'Rate Card',
  'Floor Plans & Specs',
  'Enterprise Quotation',
  'Menu & Catalog'
];

export function AiCatalogsPanel() {
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(300);
  const [relevanceThreshold, setRelevanceThreshold] = useState(0.65);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiTriggerInstruction, setAiTriggerInstruction] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test Sandbox states
  const [simQuery, setSimQuery] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<TestTriggerResult | null>(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: ''
  });
  const [deleting, setDeleting] = useState(false);

  // Copied URL state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadCatalogs();
    loadSettings();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadSettings = async () => {
    try {
      const res = await apiFetch<{ enabled: boolean; cooldownSeconds: number; relevanceThreshold: number }>('/api/ai-catalogs/settings');
      const settingsData = res?.data || (res as any);
      if (settingsData) {
        if (typeof settingsData.enabled === 'boolean') setEnabled(settingsData.enabled);
        if (settingsData.cooldownSeconds) setCooldownSeconds(settingsData.cooldownSeconds);
        if (settingsData.relevanceThreshold) setRelevanceThreshold(settingsData.relevanceThreshold);
      }
    } catch {
      // Fallback to default
    }
  };

  const loadCatalogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<CatalogItem[]>('/api/ai-catalogs');
      const items = res?.data || (Array.isArray(res) ? res : null);
      if (items && Array.isArray(items)) {
        setCatalogs(items);
      } else if (res?.error) {
        setError(res.error);
      }
    } catch (e: any) {
      console.error('Failed to load catalogs', e);
      setError(e.message || 'Failed to load catalogs');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaster = async (val: boolean) => {
    setEnabled(val);
    try {
      await apiFetch('/api/ai-catalogs/settings', {
        method: 'PATCH',
        body: JSON.stringify({ enabled: val })
      });
      showToast(val ? 'AI Document Auto-Dispatch Activated' : 'AI Document Auto-Dispatch Paused');
    } catch {
      setEnabled(!val);
      setError('Failed to update catalog settings.');
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50 MB maximum limit.');
      return;
    }
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      setError('Unsupported file type. Please select a PDF or Image (PNG, JPG, WEBP).');
      return;
    }
    setSelectedFile(file);
    setError(null);
    if (!title.trim()) {
      const suggestedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(suggestedTitle.charAt(0).toUpperCase() + suggestedTitle.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a PDF brochure or media document to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }
    if (!aiTriggerInstruction.trim()) {
      setError('AI trigger instruction is required so the assistant knows when to dispatch this document.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('aiTriggerInstruction', aiTriggerInstruction.trim());

    try {
      const res = await apiFetch<CatalogItem>('/api/ai-catalogs', {
        method: 'POST',
        body: formData,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      showToast('Catalog document uploaded & published successfully!');
      setTitle('');
      setDescription('');
      setAiTriggerInstruction('');
      setSelectedFile(null);
      await loadCatalogs();
    } catch (e: any) {
      setError(e.message || 'Upload failed. Please ensure file signature is valid.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const res = await apiFetch(`/api/ai-catalogs/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.error) throw new Error(res.error);
      setCatalogs(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
      showToast(`Document status updated to ${newStatus}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/ai-catalogs/${deleteModal.id}`, { method: 'DELETE' });
      if (res.error) throw new Error(res.error);
      setCatalogs(prev => prev.filter(c => c.id !== deleteModal.id));
      showToast('Catalog document permanently removed.');
      setDeleteModal({ isOpen: false, id: '', title: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to delete catalog from Cloudinary storage.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRunSimulation = async (sampleQuery?: string) => {
    const q = sampleQuery || simQuery;
    if (!q.trim()) return;
    if (sampleQuery) setSimQuery(sampleQuery);
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await apiFetch<TestTriggerResult>('/api/ai-catalogs/test-trigger', {
        method: 'POST',
        body: JSON.stringify({ query: q.trim() })
      });
      if (res.data) {
        setSimResult(res.data);
      } else if (res.error) {
        setError('Simulation error: ' + res.error);
      } else {
        setSimResult(res as any);
      }
    } catch (e: any) {
      setError('Simulation failed: ' + (e.message || 'Unknown error'));
    } finally {
      setSimLoading(false);
    }
  };

  const copyUrl = (id: string, url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Direct document link copied to clipboard');
  };

  // Filtered list
  const filteredCatalogs = useMemo(() => {
    return catalogs.filter(cat => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cat.title.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q)) ||
        (cat.aiTriggerInstruction && cat.aiTriggerInstruction.toLowerCase().includes(q)) ||
        (cat.fileName && cat.fileName.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (statusFilter === 'ACTIVE') return cat.status === 'ACTIVE';
      if (statusFilter === 'DISABLED') return cat.status === 'DISABLED';
      return true;
    });
  }, [catalogs, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = catalogs.length;
    const active = catalogs.filter(c => c.status === 'ACTIVE').length;
    const totalBytes = catalogs.reduce((acc, c) => acc + (c.fileSizeBytes || 0), 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
    return { total, active, totalMB };
  }, [catalogs]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs underline hover:no-underline">Dismiss</button>
        </div>
      )}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-c">Active Documents</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-primary-c">{stats.active}</span>
            <span className="text-xs text-muted-c">/ {stats.total} total</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-c">Cloud Storage</span>
            <Cloud className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-primary-c">{stats.totalMB}</span>
            <span className="text-xs text-muted-c">MB stored</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-c">Auto-Dispatch</span>
            <Zap className={cx('h-4 w-4', enabled ? 'text-amber-500' : 'text-muted-c')} />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={cx(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              enabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-surface-subtle text-muted-c'
            )}>
              {enabled ? 'LIVE AUTOMATION' : 'PAUSED'}
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-c">Safety Guardrails</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xs font-semibold text-primary-c">
            24h Window & {cooldownSeconds}s Lock
          </div>
        </GlassCard>
      </div>

      {/* Master Control Banner */}
      <GlassCard className="relative overflow-hidden border border-base-c p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-primary-c">Dynamic AI Intent Auto-Dispatch</h3>
                <span className={cx(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  enabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-surface-subtle text-muted-c'
                )}>
                  {enabled ? 'Active Engine' : 'Disabled'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-secondary-c max-w-2xl">
                When customers on WhatsApp or WebBot enquire about pricing, brochures, specifications, or menus, the AI evaluates intent relevance against your uploaded documents and auto-dispatches the exact PDF or media asset.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <span className="text-xs font-medium text-secondary-c">
              {enabled ? 'Dispatches Enabled' : 'Dispatches Paused'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => handleToggleMaster(!enabled)}
              className={cx(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
                enabled ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-slate-300 dark:bg-slate-700'
              )}
            >
              <span
                className={cx(
                  'absolute top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white shadow-soft transition-all duration-200',
                  enabled ? 'left-[22px]' : 'left-0.5'
                )}
              >
                {enabled && <Check className="h-3 w-3 text-emerald-600" />}
              </span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Two-Column Studio: Upload Studio + Interactive Sandbox */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Upload New Document Studio */}
        <div className="lg:col-span-7">
          <GlassCard className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <div>
                <h3 className="text-sm font-bold text-primary-c flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  Document Publishing Studio
                </h3>
                <p className="text-xs text-muted-c mt-0.5">
                  Upload brochures, pricing guides, menus, or floor plans. Magic bytes & Cloudinary verified.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-muted-c bg-surface-subtle px-2 py-0.5 rounded-md border border-base-c">
                Max 50MB
              </span>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 pt-1">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cx(
                  'group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition-all text-center',
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-surface-subtle/70'
                    : 'border-base-c bg-surface-subtle/30 hover:border-primary-500/50 hover:bg-surface-subtle/60'
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold text-primary-c truncate max-w-[260px] sm:max-w-[340px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-muted-c">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to publish
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      className="ml-2 p-1.5 text-muted-c hover:text-rose-500 rounded-lg hover:bg-surface-muted transition-colors"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 group-hover:scale-105 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary-c">
                        Drag and drop your document here, or <span className="text-primary-600 dark:text-primary-400 underline">browse</span>
                      </p>
                      <p className="text-[11px] text-muted-c mt-0.5">
                        Supported: Adobe PDF (.pdf) or High-Res Images (.png, .jpg, .webp)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-primary-c mb-1">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026 Enterprise ERP Solution Pricing Guide"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-base-c bg-surface-subtle px-3.5 py-2.5 text-sm text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-semibold text-primary-c mb-1">
                  Description / Caption Note <span className="text-muted-c font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Brief summary sent as WhatsApp media caption…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-base-c bg-surface-subtle px-3.5 py-2 text-sm text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                />
              </div>

              {/* AI Trigger Instructions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-primary-c">
                    AI Trigger Instructions & Keywords <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-muted-c">Tells AI when to select this file</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Send when customer asks for pricing list, monthly rates, package quotation, or ERP brochure."
                  value={aiTriggerInstruction}
                  onChange={e => setAiTriggerInstruction(e.target.value)}
                  className="w-full rounded-xl border border-base-c bg-surface-subtle px-3.5 py-2 text-sm text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                />

                {/* Quick Tag Suggestions */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-muted-c uppercase tracking-wider mr-1">Quick Add:</span>
                  {QUICK_TRIGGER_SUGGESTIONS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const trimmed = aiTriggerInstruction.trim();
                        if (!trimmed) {
                          setAiTriggerInstruction(`Send when customer asks for ${tag.toLowerCase()}`);
                        } else if (!trimmed.toLowerCase().includes(tag.toLowerCase())) {
                          setAiTriggerInstruction(`${trimmed}, ${tag.toLowerCase()}`);
                        }
                      }}
                      className="rounded-lg border border-base-c bg-card-c px-2 py-0.5 text-[11px] text-secondary-c transition-colors hover:bg-surface-subtle hover:text-primary-c"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2 border-t border-base-c">
                <div className="flex items-center gap-1 text-[11px] text-muted-c">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Magic byte inspection & Cloudinary verified</span>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-semibold text-white shadow-soft transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Validating & Uploading…</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload & Publish Catalog</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Right Column: Interactive AI Sandbox Simulator */}
        <div className="lg:col-span-5">
          <GlassCard className="p-5 sm:p-6 space-y-4 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <div>
                <h3 className="text-sm font-bold text-primary-c flex items-center gap-2">
                  <Bot className="h-4 w-4 text-emerald-500" />
                  AI Simulation Sandbox
                </h3>
                <p className="text-xs text-muted-c mt-0.5">
                  Test prompt matching without sending live WhatsApp messages.
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Safe Testing
              </span>
            </div>

            <div className="space-y-3 flex-1">
              <p className="text-xs text-secondary-c">
                Type what a customer might say to test semantic scoring against your active documents:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Bhai pricing brochure bhejo software ka"
                  value={simQuery}
                  onChange={e => setSimQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRunSimulation()}
                  className="flex-1 rounded-xl border border-base-c bg-surface-subtle px-3.5 py-2 text-xs text-primary-c placeholder:text-muted-c focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  disabled={simLoading || !simQuery.trim()}
                  onClick={() => handleRunSimulation()}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {simLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  <span>Test</span>
                </button>
              </div>

              {/* Sample Queries */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-muted-c">Try sample:</span>
                {[
                  'Can you share pricing details?',
                  'Send brochure for luxury villas',
                  'What are the monthly rates?'
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handleRunSimulation(sample)}
                    className="rounded-md border border-base-c bg-surface-subtle px-2 py-0.5 text-[10px] text-secondary-c hover:text-primary-c hover:border-emerald-500/50 transition-colors"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>

              {/* Simulation Result Presentation */}
              {simResult && (
                <div className="mt-4 rounded-xl border border-base-c bg-surface-subtle/50 p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-secondary-c">Decision Engine Action:</span>
                    <span className={cx(
                      'rounded-full px-2.5 py-0.5 text-xs font-bold',
                      simResult.decision === 'SEND_CATALOG'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : simResult.decision === 'CLARIFY'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-surface-subtle text-muted-c border border-base-c'
                    )}>
                      {simResult.decision === 'SEND_CATALOG' && '✓ SEND_CATALOG'}
                      {simResult.decision === 'CLARIFY' && '⚡ CLARIFY (MULTIPLE MATCHES)'}
                      {simResult.decision === 'NONE' && '✗ NO ACTION (NORMAL RAG)'}
                    </span>
                  </div>

                  {simResult.decision === 'SEND_CATALOG' && simResult.catalogTitle && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-primary-c">{simResult.catalogTitle}</span>
                      </div>
                      {simResult.caption && (
                        <p className="text-xs text-secondary-c italic bg-card-c/70 p-2 rounded border border-base-c">
                          "{simResult.caption}"
                        </p>
                      )}
                    </div>
                  )}

                  {simResult.candidates && simResult.candidates.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-base-c">
                      <span className="text-[11px] font-semibold text-secondary-c">Candidate Relevance Scores:</span>
                      {simResult.candidates.map((cand) => (
                        <div key={cand.catalogId} className="flex items-center justify-between text-xs">
                          <span className="truncate max-w-[200px] text-secondary-c">{cand.title}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={cx(
                                  'h-full rounded-full',
                                  cand.relevanceScore >= 0.65 ? 'bg-emerald-500' : 'bg-amber-500'
                                )}
                                style={{ width: `${Math.min(100, Math.round(cand.relevanceScore * 100))}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-bold text-primary-c">
                              {Math.round(cand.relevanceScore * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Catalog Documents Explorer Table / Grid */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-base-c pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-primary-c">Active Document Repository</h3>
              <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-xs font-semibold text-secondary-c">
                {filteredCatalogs.length} of {catalogs.length}
              </span>
            </div>
            <p className="text-xs text-muted-c mt-0.5">
              Manage your published brochures and configure AI trigger rules for dynamic WhatsApp delivery.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-c" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search documents or triggers…"
                className="w-48 sm:w-64 rounded-lg border border-base-c bg-surface-subtle pl-8 pr-3 py-1.5 text-xs text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex rounded-lg border border-base-c bg-surface-subtle p-0.5 text-xs">
              {(['ALL', 'ACTIVE', 'DISABLED'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={cx(
                    'px-2.5 py-1 rounded-md font-medium transition-colors text-[11px]',
                    statusFilter === tab
                      ? 'bg-card-c text-primary-c shadow-soft font-semibold'
                      : 'text-muted-c hover:text-primary-c'
                  )}
                >
                  {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'Active' : 'Disabled'}
                </button>
              ))}
            </div>

            <button
              onClick={loadCatalogs}
              disabled={loading}
              className="p-1.5 rounded-lg border border-base-c bg-card-c text-secondary-c hover:text-primary-c transition-colors disabled:opacity-50"
              title="Refresh list"
            >
              <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Catalog Items Presentation */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-c">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-500 mb-2" />
            <p className="text-xs">Loading AI catalogs from repository…</p>
          </div>
        ) : filteredCatalogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-subtle text-muted-c mb-3 border border-base-c">
              <FileText className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm font-semibold text-primary-c">
              {searchQuery ? 'No matching documents found' : 'No catalog documents published yet'}
            </p>
            <p className="text-xs text-muted-c mt-1 max-w-sm">
              {searchQuery
                ? 'Try adjusting your search keywords or clearing the filter.'
                : 'Upload your first PDF pricing brochure or media catalog using the studio above.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCatalogs.map(cat => {
              const isPdf = cat.fileName?.toLowerCase().endsWith('.pdf') || cat.mimeType?.includes('pdf');
              const isCopied = copiedId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="flex flex-col justify-between rounded-xl border border-base-c bg-card-c p-4 shadow-soft transition-all duration-200 hover:border-emerald-500/40 hover:shadow-soft-lg group"
                >
                  <div className="space-y-3">
                    {/* Card Top: Format Badge, Status, and Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cx(
                          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          isPdf
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        )}>
                          <FileText className="h-3 w-3" />
                          {isPdf ? 'PDF Document' : 'Media Asset'}
                        </span>

                        <span className="text-[11px] text-muted-c">
                          {(cat.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>

                      {/* Active Status Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cat.id, cat.status)}
                        className={cx(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors',
                          cat.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                            : 'bg-surface-subtle text-muted-c border border-base-c'
                        )}
                        title="Click to toggle status"
                      >
                        <span className={cx(
                          'h-1.5 w-1.5 rounded-full',
                          cat.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                        )} />
                        {cat.status === 'ACTIVE' ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="text-sm font-bold text-primary-c group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {cat.title}
                      </h4>
                      {cat.description && (
                        <p className="mt-1 text-xs text-secondary-c line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {/* Trigger Instruction Badge */}
                    <div className="rounded-lg bg-surface-subtle/70 p-2.5 border border-base-c/60 space-y-1">
                      <span className="text-[10px] font-semibold text-muted-c uppercase tracking-wider block">
                        AI Intent Trigger:
                      </span>
                      <p className="text-xs text-primary-c font-medium line-clamp-2">
                        "{cat.aiTriggerInstruction}"
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Action Links */}
                  <div className="mt-4 flex items-center justify-between border-t border-base-c pt-3">
                    <span className="text-[10px] text-muted-c truncate max-w-[110px]" title={cat.fileName}>
                      {cat.fileName}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Copy Link Button */}
                      <button
                        onClick={() => copyUrl(cat.id, `/api/v1/public/catalogs/${cat.id}/file`)}
                        className="rounded-lg border border-base-c p-1.5 text-secondary-c hover:text-primary-c hover:bg-surface-subtle transition-colors"
                        title="Copy document URL"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>

                      {/* Download Button (forces attachment with original filename) */}
                      <a
                        href={`/api/v1/public/catalogs/${cat.id}/file?download=true`}
                        download={cat.fileName || 'catalog.pdf'}
                        className="rounded-lg border border-base-c p-1.5 text-secondary-c hover:text-primary-c hover:bg-surface-subtle transition-colors"
                        title="Download file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>

                      {/* View / Preview Document in Browser */}
                      <a
                        href={`/api/v1/public/catalogs/${cat.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-base-c px-2 py-1 text-xs font-medium text-secondary-c hover:text-primary-c hover:bg-surface-subtle transition-colors"
                        title="Open preview in new tab"
                      >
                        <span>Preview</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, id: cat.id, title: cat.title })}
                        className="rounded-lg border border-rose-500/20 p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                        title="Delete catalog"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete AI Catalog Document"
        message={`Are you sure you want to delete "${deleteModal.title}"? This will remove the file from Cloudinary storage and disable automated WhatsApp and WebBot dispatch for this document.`}
        confirmText="Delete Document"
        confirmVariant="danger"
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: '', title: '' })}
      />
    </div>
  );
}
