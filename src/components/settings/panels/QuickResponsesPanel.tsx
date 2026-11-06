import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Bot, Zap, Plus, Search, Tag, Copy, Check, Edit2, Trash2,
  Loader2, AlertCircle, Sparkles, User, Building, Calendar, Info,
  Save, CheckCircle, ChevronDown, ChevronUp, X,
  FileText, Video, Upload, ArrowRight, ExternalLink,
  Image as ImageIcon, RefreshCw, Smartphone
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { apiFetch, getAuthToken, getTenantId } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const MAX_SLOTS = 6;
const MAX_WHATSAPP_TEXT_LENGTH = 1024;

function resolveMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface QuickResponseSlot {
  internalName: string;
  text: string;
  imageUrl?: string;
}

const makeEmptySlot = (index: number): QuickResponseSlot => ({
  internalName: `Quick Response ${index + 1}`,
  text: '',
  imageUrl: '',
});

interface WhatsAppConfigData {
  customMessagesJson?: string;
}

interface CannedResponse {
  id: string;
  title: string;
  shortcut: string;
  content: string;
  category: string;
  isShared: boolean;
  usageCount: number;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const CANNED_CATEGORIES = ['ALL', 'GREETINGS', 'SUPPORT', 'SALES', 'BILLING', 'GENERAL'];

// ----------------------------------------------------------------------------
// Main Panel with Enterprise Tab Switcher
// ----------------------------------------------------------------------------

export function QuickResponsesPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'agent-canned' ? 'agent-canned' : 'button-replies';
  const [activeTab, setActiveTab] = useState<'button-replies' | 'agent-canned'>(initialTab);

  const handleTabChange = (tab: 'button-replies' | 'agent-canned') => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Quick Responses & Snippets"
        desc="Manage WhatsApp Bot interactive button replies and live chat agent templates."
      />

      {/* Enterprise Segmented Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-c pb-3">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-ink-850 border border-base-c/80 shadow-xs">
          <button
            type="button"
            onClick={() => handleTabChange('button-replies')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'button-replies'
                ? 'bg-card-c text-primary-c shadow-sm border border-base-c/60'
                : 'text-muted-c hover:text-primary-c hover:bg-card-c/50'
            }`}
          >
            <Bot className={`h-4 w-4 ${activeTab === 'button-replies' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span>Bot Replies</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
              activeTab === 'button-replies'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-200/60 dark:bg-ink-800 text-muted-c'
            }`}>
              6 Slots
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('agent-canned')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'agent-canned'
                ? 'bg-card-c text-primary-c shadow-sm border border-base-c/60'
                : 'text-muted-c hover:text-primary-c hover:bg-card-c/50'
            }`}
          >
            <Zap className={`h-4 w-4 ${activeTab === 'agent-canned' ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span>Canned Snippets</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
              activeTab === 'agent-canned'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-200/60 dark:bg-ink-800 text-muted-c'
            }`}>
              /shortcuts
            </span>
          </button>
        </div>

        {/* Channel / Integration Hint */}
        <div className="flex items-center gap-2 text-xs text-muted-c">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {activeTab === 'button-replies'
              ? 'Linked to WhatsApp Menu & Buttons'
              : 'Available in Live Chat Message Composer'}
          </span>
        </div>
      </div>

      {/* Tab 1: WhatsApp Bot Replies */}
      {activeTab === 'button-replies' && <WhatsAppButtonRepliesSubPanel />}

      {/* Tab 2: Agent Canned Snippets */}
      {activeTab === 'agent-canned' && <AgentCannedResponsesSubPanel />}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Sub-Panel 1: Enterprise WhatsApp Button Replies
// ----------------------------------------------------------------------------

function WhatsAppButtonRepliesSubPanel() {
  const [slots, setSlots] = useState<QuickResponseSlot[]>(
    Array.from({ length: MAX_SLOTS }, (_, i) => makeEmptySlot(i)),
  );
  const [initialSlots, setInitialSlots] = useState<QuickResponseSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadSlots = async () => {
    setLoading(true);
    const res = await apiFetch<WhatsAppConfigData>('/api/v1/whatsapp-config');
    setLoading(false);
    if (res.data?.customMessagesJson) {
      try {
        const parsed = JSON.parse(res.data.customMessagesJson);
        if (Array.isArray(parsed)) {
          const migrated: QuickResponseSlot[] = Array.from({ length: MAX_SLOTS }, (_, i) => {
            const raw = parsed[i];
            if (!raw) return makeEmptySlot(i);
            return {
              internalName: raw.internalName ?? raw.shortcut ?? `Quick Response ${i + 1}`,
              text: raw.text ?? '',
              imageUrl: raw.imageUrl ?? '',
            };
          });
          setSlots(migrated);
          setInitialSlots(migrated);
          return;
        }
      } catch {
        /* ignore parse error */
      }
    }
    const empty = Array.from({ length: MAX_SLOTS }, (_, i) => makeEmptySlot(i));
    setSlots(empty);
    setInitialSlots(empty);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(slots) !== JSON.stringify(initialSlots);
  }, [slots, initialSlots]);

  const configuredCount = useMemo(() => {
    return slots.filter((s) => s.text.trim().length > 0 || !!s.imageUrl).length;
  }, [slots]);

  const mediaCount = useMemo(() => {
    return slots.filter((s) => !!s.imageUrl).length;
  }, [slots]);

  const saveAll = async (updated: QuickResponseSlot[]) => {
    setSaving(true);
    const res = await apiFetch('/api/v1/whatsapp-config', {
      method: 'POST',
      body: JSON.stringify({ customMessagesJson: JSON.stringify(updated) }),
    });
    setSaving(false);
    if (!res.error) {
      setInitialSlots(updated);
      showToast('All bot responses saved successfully!');
    } else {
      showToast(`Save failed: ${res.error}`, true);
    }
  };

  const updateSlot = (idx: number, field: keyof QuickResponseSlot, value: string) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const handleMediaUpload = async (idx: number, file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      showToast('Media file must be under 50 MB', true);
      return;
    }
    setUploadingIdx(idx);
    const token = getAuthToken() || localStorage.getItem('token');
    const tenantId = getTenantId();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'quick-responses');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantId) headers['X-Tenant-ID'] = tenantId;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const localUrl = URL.createObjectURL(file);
        const next = slots.map((s, i) => (i === idx ? { ...s, imageUrl: localUrl } : s));
        setSlots(next);
        setUploadingIdx(null);
        showToast('Media previewed locally (upload endpoint error)', true);
        return;
      }
      const data = await res.json();
      const url: string = data.url || data.imageUrl || data.fileUrl || '';
      const next = slots.map((s, i) => (i === idx ? { ...s, imageUrl: url } : s));
      setSlots(next);
      await saveAll(next);
      showToast('Media attached and saved!');
    } catch {
      const localUrl = URL.createObjectURL(file);
      const next = slots.map((s, i) => (i === idx ? { ...s, imageUrl: localUrl } : s));
      setSlots(next);
      showToast('Media previewed locally (network error)', true);
    }
    setUploadingIdx(null);
  };

  const removeImage = (idx: number) => {
    const next = slots.map((s, i) => (i === idx ? { ...s, imageUrl: '' } : s));
    setSlots(next);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-c text-sm">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
        <span>Loading bot response slots…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${
            toastMsg.isError
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {toastMsg.isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Enterprise KPI Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-base-c bg-card-c p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-c">Configured Slots</p>
            <p className="text-xl font-bold text-primary-c mt-0.5">
              {configuredCount} <span className="text-xs font-medium text-muted-c">/ {MAX_SLOTS} active</span>
            </p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Bot className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-base-c bg-card-c p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-c">Media Attachments</p>
            <p className="text-xl font-bold text-primary-c mt-0.5">
              {mediaCount} <span className="text-xs font-medium text-muted-c">files attached</span>
            </p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <ImageIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-base-c bg-card-c p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-c">Link in WhatsApp Menu</p>
            <Link
              to="/settings/menu-buttons"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-1"
            >
              <span>Menu &amp; Buttons</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Smartphone className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Action Header with Global Save */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h3 className="text-sm font-bold text-primary-c">WhatsApp Bot Button Slots</h3>
          <p className="text-xs text-muted-c mt-0.5">
            Configure up to 6 custom automated responses with text and optional media attachments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            onClick={() => saveAll(slots)}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Save All Slots</span>
          </button>
        </div>
      </div>

      {/* Slots List */}
      <div className="space-y-3">
        {slots.map((slot, idx) => {
          const isOpen = openIdx === idx;
          const isConfigured = slot.text.trim().length > 0 || !!slot.imageUrl;
          const charCount = slot.text.length;
          const isOverLimit = charCount > MAX_WHATSAPP_TEXT_LENGTH;

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all overflow-hidden ${
                isOpen
                  ? 'border-emerald-500/40 bg-card-c shadow-sm ring-1 ring-emerald-500/20'
                  : 'border-base-c bg-card-c hover:border-base-c/90'
              }`}
            >
              {/* Accordion Card Header */}
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold ${
                    isConfigured
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 dark:bg-ink-800 text-muted-c border border-base-c/60'
                  }`}>
                    #{idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-primary-c truncate">
                        {slot.internalName || `Quick Response ${idx + 1}`}
                      </span>
                      <span className="font-mono text-[10px] text-muted-c bg-slate-100 dark:bg-ink-800 px-1.5 py-0.5 rounded border border-base-c/60">
                        custom_msg_{idx + 1}
                      </span>
                      {isConfigured ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Configured
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-muted-c bg-slate-100 dark:bg-ink-800 px-2 py-0.5 rounded-full">
                          Empty
                        </span>
                      )}
                      {slot.imageUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          <ImageIcon className="h-2.5 w-2.5" />
                          Media Attached
                        </span>
                      )}
                    </div>
                    {!isOpen && slot.text && (
                      <p className="truncate text-xs text-muted-c mt-1 leading-relaxed max-w-xl">
                        {slot.text}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-c font-medium hidden sm:inline">
                    {isOpen ? 'Collapse' : 'Edit slot'}
                  </span>
                  <div className="grid h-7 w-7 place-items-center rounded-lg border border-base-c text-muted-c">
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </button>

              {/* Accordion Card Body */}
              {isOpen && (
                <div className="border-t border-base-c/80 p-5 bg-slate-50/40 dark:bg-ink-900/30 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left Column: Form Controls (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                      {/* Internal Label */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-primary-c">
                            Internal Label
                          </label>
                          <span className="text-[11px] text-muted-c">
                            ID: <strong className="font-mono text-emerald-600 dark:text-emerald-400">custom_msg_{idx + 1}</strong>
                          </span>
                        </div>
                        <input
                          type="text"
                          value={slot.internalName}
                          onChange={(e) => updateSlot(idx, 'internalName', e.target.value)}
                          placeholder={`Quick Response ${idx + 1}`}
                          className="w-full rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs font-semibold text-primary-c placeholder:text-muted-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                        <p className="text-[11px] text-muted-c mt-1">
                          Visible to your team in the Menu &amp; Buttons dropdown list.
                        </p>
                      </div>

                      {/* Response Message */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-primary-c">
                            Response Message <span className="text-rose-500">*</span>
                          </label>
                          <span className={`text-[11px] font-mono ${
                            isOverLimit
                              ? 'text-rose-600 font-bold'
                              : charCount > 900
                              ? 'text-amber-500'
                              : 'text-muted-c'
                          }`}>
                            {charCount} / {MAX_WHATSAPP_TEXT_LENGTH} chars
                          </span>
                        </div>
                        <textarea
                          value={slot.text}
                          onChange={(e) => updateSlot(idx, 'text', e.target.value)}
                          rows={4}
                          placeholder="Type the message that will be automatically sent when this WhatsApp menu button is clicked..."
                          className="w-full rounded-xl border border-base-c bg-card-c p-3 text-xs leading-relaxed text-primary-c placeholder:text-muted-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                        />
                        {isOverLimit && (
                          <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                            <AlertCircle className="h-3 w-3" />
                            Message exceeds WhatsApp interactive button limit of 1024 characters.
                          </p>
                        )}
                      </div>

                      {/* Media Uploader Hub */}
                      <div>
                        <label className="block text-xs font-bold text-primary-c mb-1.5">
                          Media / Document Attachment (Optional)
                        </label>
                        {slot.imageUrl ? (
                          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-base-c bg-card-c shadow-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              {slot.imageUrl.match(/\.(mp4|webm|mov|avi|3gp)($|\?)/i) ? (
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                                  <Video className="h-6 w-6" />
                                </div>
                              ) : slot.imageUrl.match(/\.(pdf|doc|docx|xls|xlsx|txt)($|\?)/i) ? (
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                                  <FileText className="h-6 w-6" />
                                </div>
                              ) : (
                                <img
                                  src={resolveMediaUrl(slot.imageUrl)}
                                  alt="Attached"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                  className="h-12 w-12 rounded-lg object-cover border border-base-c shrink-0"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-primary-c truncate">
                                  {slot.imageUrl.split('/').pop() || 'Attached File'}
                                </p>
                                <p className="text-[10px] font-mono text-muted-c truncate">
                                  {slot.imageUrl}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-base-c bg-card-c hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer">
                            {uploadingIdx === idx ? (
                              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Uploading media file…</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-1" />
                                <span className="text-xs font-bold text-primary-c">
                                  Upload Photo, Video or PDF Document
                                </span>
                                <span className="text-[10px] text-muted-c mt-0.5">
                                  Supports JPG, PNG, MP4, PDF, Catalogs (Max 50MB)
                                </span>
                              </>
                            )}
                            <input
                              ref={(el) => {
                                fileRefs.current[idx] = el;
                              }}
                              type="file"
                              accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                              className="sr-only"
                              disabled={uploadingIdx !== null}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleMediaUpload(idx, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Live WhatsApp Interactive Simulator (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-c mb-2">
                          <Sparkles className="h-3 w-3 text-emerald-500" />
                          <span>WhatsApp Customer Simulator</span>
                        </div>

                        {/* WhatsApp Message Bubble */}
                        <div className="rounded-2xl bg-[#005c4b] text-white p-3 text-xs shadow-md space-y-2 max-w-sm">
                          {slot.imageUrl && (
                            <div className="rounded-xl overflow-hidden bg-black/20 border border-white/10 max-h-36 flex items-center justify-center">
                              {slot.imageUrl.match(/\.(mp4|webm|mov|avi|3gp)($|\?)/i) ? (
                                <div className="py-6 flex flex-col items-center gap-1 text-white/80">
                                  <Video className="h-8 w-8" />
                                  <span className="text-[10px] font-semibold">Video Header</span>
                                </div>
                              ) : slot.imageUrl.match(/\.(pdf|doc|docx|xls|xlsx|txt)($|\?)/i) ? (
                                <div className="py-6 flex flex-col items-center gap-1 text-white/80">
                                  <FileText className="h-8 w-8" />
                                  <span className="text-[10px] font-semibold">Document Header</span>
                                </div>
                              ) : (
                                <img
                                  src={resolveMediaUrl(slot.imageUrl)}
                                  alt="Preview"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                  className="w-full h-36 object-cover"
                                />
                              )}
                            </div>
                          )}

                          <p className="leading-relaxed whitespace-pre-wrap break-words text-[11px]">
                            {slot.text || (
                              <span className="italic opacity-60">Enter response message above to see preview…</span>
                            )}
                          </p>

                          {/* Simulated CTA button */}
                          {slot.imageUrl && (
                            <div className="pt-1 border-t border-white/15">
                              <div className="rounded-lg bg-black/20 hover:bg-black/30 py-1.5 text-center text-[10px] font-bold text-white tracking-wide">
                                📩 Enquire Now
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Save Button */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-base-c/60">
                        <span className="text-[11px] text-muted-c">
                          Changes update instantly on save
                        </span>
                        <button
                          type="button"
                          onClick={() => saveAll(slots)}
                          disabled={saving}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          <span>Save Slot #{idx + 1}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Linking Guide */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-base-c bg-card-c text-xs text-muted-c">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Link these 6 automated responses to your interactive buttons in the{' '}
            <strong className="text-primary-c">Menu &amp; Buttons</strong> panel.
          </span>
        </div>
        <Link
          to="/settings/menu-buttons"
          className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
        >
          <span>Open Menu &amp; Buttons</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Sub-Panel 2: Enterprise Agent Canned Responses
// ----------------------------------------------------------------------------

function AgentCannedResponsesSubPanel() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalShortcut, setModalShortcut] = useState('');
  const [modalCategory, setModalCategory] = useState('GENERAL');
  const [modalContent, setModalContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const token = getAuthToken() || localStorage.getItem('token');
      const res = await fetch('/api/v1/canned-responses', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setResponses(data || []);
      } else {
        showToast('Failed to load canned responses', true);
      }
    } catch {
      showToast('Network error loading canned responses', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      const matchesCat = selectedCategory === 'ALL' || r.category.toUpperCase() === selectedCategory.toUpperCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        r.shortcut.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [responses, selectedCategory, searchQuery]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setModalTitle('');
    setModalShortcut('');
    setModalCategory('GENERAL');
    setModalContent('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: CannedResponse) => {
    setIsEditing(true);
    setEditingId(r.id);
    setModalTitle(r.title);
    setModalShortcut(r.shortcut);
    setModalCategory(r.category || 'GENERAL');
    setModalContent(r.content);
    setIsModalOpen(true);
  };

  const handleInsertVariable = (variable: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = modalContent;
    const newText = text.substring(0, start) + variable + text.substring(end);
    setModalContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 50);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalShortcut.trim() || !modalContent.trim()) {
      showToast('Please fill out all required fields', true);
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken() || localStorage.getItem('token');
      const cleanShortcut = modalShortcut.trim().replace(/^\//, '');
      const payload = {
        title: modalTitle.trim(),
        shortcut: cleanShortcut,
        category: modalCategory,
        content: modalContent.trim(),
        isShared: true,
      };

      const url = isEditing && editingId
        ? `/api/v1/canned-responses/${editingId}`
        : '/api/v1/canned-responses';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save canned response');
      }

      showToast(isEditing ? 'Canned response updated!' : 'Canned response created!');
      setIsModalOpen(false);
      fetchResponses();
    } catch (err: unknown) {
      showToast((err as Error).message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = getAuthToken() || localStorage.getItem('token');
      const res = await fetch(`/api/v1/canned-responses/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete canned response');
      showToast('Canned response deleted');
      setDeleteConfirmId(null);
      fetchResponses();
    } catch (err: unknown) {
      showToast((err as Error).message, true);
    }
  };

  const copyShortcut = (shortcut: string, id: string) => {
    navigator.clipboard.writeText(`/${shortcut}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const previewText = useMemo(() => {
    return modalContent
      .replace(/\{\{contact\.name\}\}/g, 'John Doe')
      .replace(/\{\{contact_name\}\}/g, 'John Doe')
      .replace(/\{\{agent\.name\}\}/g, 'Sarah Agent')
      .replace(/\{\{agent_name\}\}/g, 'Sarah Agent')
      .replace(/\{\{company\.name\}\}/g, 'Acme Corp')
      .replace(/\{\{company_name\}\}/g, 'Acme Corp')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
      .replace(/\{\{today\}\}/g, new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  }, [modalContent]);

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-sm font-medium transition-all ${
            toastMsg.isError
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {toastMsg.isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-c" />
          <input
            type="text"
            placeholder="Search by shortcut, title, or message…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-base-c bg-card-c pl-10 pr-4 py-2 text-sm text-primary-c placeholder:text-muted-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Canned Snippet</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CANNED_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-card-c border border-base-c text-muted-c hover:text-primary-c'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Canned Responses List */}
      <SectionCard title="Live Chat Snippets" desc="All canned responses available to support agents during live chats. Type '/' in chat to insert.">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-c text-sm">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-emerald-500" />
            Loading canned responses…
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-primary-c">No canned responses found</h3>
            <p className="text-xs text-muted-c max-w-sm mt-1 mb-4">
              {searchQuery
                ? `No snippets matched "${searchQuery}". Try a different keyword.`
                : 'Create your first canned response so your support agents can reply to customers with lightning speed.'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Canned Response</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-base-c/40 -mx-6">
            {filteredResponses.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-ink-850/50 transition-colors"
              >
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => copyShortcut(item.shortcut, item.id)}
                      className="group flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                      title="Click to copy shortcut"
                    >
                      <span>/{item.shortcut}</span>
                      {copiedId === item.id ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                    <span className="font-semibold text-sm text-primary-c truncate">{item.title}</span>
                    {item.category && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-c bg-slate-100 dark:bg-ink-800 px-2 py-0.5 rounded-md border border-base-c/60">
                        <Tag className="h-2.5 w-2.5" />
                        {item.category}
                      </span>
                    )}
                    {item.usageCount > 0 && (
                      <span className="text-[10px] font-medium text-muted-c opacity-75">
                        • {item.usageCount} {item.usageCount === 1 ? 'use' : 'uses'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-c line-clamp-2 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-base-c text-muted-c hover:text-primary-c hover:border-emerald-500/40 hover:bg-card-c transition-all cursor-pointer"
                    title="Edit snippet"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-base-c text-muted-c hover:text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Delete snippet"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-base-c bg-card-c shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-primary-c">
                  {isEditing ? 'Edit Canned Snippet' : 'New Canned Snippet'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-semibold text-muted-c hover:text-primary-c cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-primary-c mb-1">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Greeting"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs text-primary-c placeholder:text-muted-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Shortcut */}
                <div>
                  <label className="block text-xs font-semibold text-primary-c mb-1">
                    Slash Shortcut <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-emerald-500">
                      /
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="greet"
                      value={modalShortcut}
                      onChange={(e) => setModalShortcut(e.target.value)}
                      className="w-full rounded-xl border border-base-c bg-card-c pl-6 pr-3 py-2 font-mono text-xs text-primary-c placeholder:text-muted-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-primary-c mb-1">Category</label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs text-primary-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                >
                  <option value="GENERAL">General</option>
                  <option value="GREETINGS">Greetings</option>
                  <option value="SUPPORT">Support</option>
                  <option value="SALES">Sales</option>
                  <option value="BILLING">Billing</option>
                </select>
              </div>

              {/* Variable Helper Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-primary-c">
                    Message Template <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-muted-c flex items-center gap-1">
                    <Info className="h-3 w-3" /> Click pill to insert variable
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { label: 'Customer Name', variable: '{{contact.name}}', icon: User },
                    { label: 'Agent Name', variable: '{{agent.name}}', icon: User },
                    { label: 'Company Name', variable: '{{company.name}}', icon: Building },
                    { label: 'Current Date', variable: '{{date}}', icon: Calendar },
                  ].map((v) => {
                    const Icon = v.icon;
                    return (
                      <button
                        key={v.variable}
                        type="button"
                        onClick={() => handleInsertVariable(v.variable)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Icon className="h-3 w-3" />
                        <span>+ {v.label}</span>
                      </button>
                    );
                  })}
                </div>

                <textarea
                  ref={textareaRef}
                  required
                  rows={4}
                  placeholder="Hello {{contact.name}}, thank you for reaching out to {{company.name}}! My name is {{agent.name}}, how may I assist you today?"
                  value={modalContent}
                  onChange={(e) => setModalContent(e.target.value)}
                  className="w-full rounded-xl border border-base-c bg-card-c p-3 text-xs leading-relaxed text-primary-c placeholder:text-muted-c focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Live Preview Card */}
              {modalContent.trim() && (
                <div className="rounded-xl border border-base-c/80 bg-slate-50 dark:bg-ink-850 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-c">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>Customer Preview</span>
                  </div>
                  <div className="rounded-xl bg-[#005c4b] text-white p-3 text-xs leading-relaxed shadow-xs max-w-sm ml-auto">
                    {previewText}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-c">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-base-c px-4 py-2 text-xs font-semibold text-muted-c hover:text-primary-c cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isEditing ? 'Save Changes' : 'Create Snippet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-base-c bg-card-c p-5 shadow-xl flex flex-col gap-3">
            <h4 className="text-sm font-bold text-primary-c">Delete Canned Snippet?</h4>
            <p className="text-xs text-muted-c leading-relaxed">
              Are you sure you want to delete this canned snippet? Agents will no longer be able to expand its shortcut in chat.
            </p>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-base-c px-3 py-1.5 text-xs font-semibold text-muted-c hover:text-primary-c cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
