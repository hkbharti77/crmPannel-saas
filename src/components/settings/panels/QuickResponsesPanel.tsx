import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Save, Loader2,
  CheckCircle, AlertCircle, ChevronDown, ChevronUp, X,
  FileText, Video, Upload,
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { apiFetch, getAuthToken, getTenantId } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const MAX_SLOTS = 6;

function resolveMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

interface QuickResponseSlot {
  internalName: string;
  text: string;
  imageUrl?: string;
}

const makeEmpty = (index: number): QuickResponseSlot => ({
  internalName: `Quick Response ${index + 1}`,
  text: '',
  imageUrl: '',
});

interface WhatsAppConfigData {
  customMessagesJson?: string;
}

export function QuickResponsesPanel() {
  const [slots, setSlots] = useState<QuickResponseSlot[]>(
    Array.from({ length: MAX_SLOTS }, (_, i) => makeEmpty(i)),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const toast = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setMessage(null); }
    else { setMessage(msg); setError(null); }
    setTimeout(() => { setMessage(null); setError(null); }, 3500);
  };

  useEffect(() => { loadSlots(); }, []);

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
            if (!raw) return makeEmpty(i);
            return {
              internalName: raw.internalName ?? raw.shortcut ?? `Quick Response ${i + 1}`,
              text: raw.text ?? '',
              imageUrl: raw.imageUrl ?? '',
            };
          });
          setSlots(migrated);
          return;
        }
      } catch { /* ignore */ }
    }
    setSlots(Array.from({ length: MAX_SLOTS }, (_, i) => makeEmpty(i)));
  };

  const saveAll = async (updated: QuickResponseSlot[]) => {
    setSaving(true);
    const res = await apiFetch('/api/v1/whatsapp-config', {
      method: 'POST',
      body: JSON.stringify({ customMessagesJson: JSON.stringify(updated) }),
    });
    setSaving(false);
    if (!res.error) toast('Quick responses saved!');
    else toast(`Save failed: ${res.error}`, true);
  };

  const updateSlot = (idx: number, field: keyof QuickResponseSlot, value: string) => {
    setSlots((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleMediaUpload = async (idx: number, file: File) => {
    if (file.size > 50 * 1024 * 1024) { toast('Media/Document file must be under 50 MB', true); return; }
    setUploadingIdx(idx);
    const token = getAuthToken();
    const tenantId = getTenantId();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'quick-responses');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantId) headers['X-Tenant-ID'] = tenantId;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/upload`, { method: 'POST', headers, body: formData });
      if (!res.ok) {
        const localUrl = URL.createObjectURL(file);
        const next = slots.map((s, i) => i === idx ? { ...s, imageUrl: localUrl } : s);
        setSlots(next);
        setUploadingIdx(null);
        toast('Media previewed locally (upload endpoint error)', true);
        return;
      }
      const data = await res.json();
      const url: string = data.url || data.imageUrl || data.fileUrl || '';
      console.log('✅ [Cloudinary Upload Success] Quick Response Media URL:', url);
      const next = slots.map((s, i) => i === idx ? { ...s, imageUrl: url } : s);
      setSlots(next);
      await saveAll(next);
      toast('Media uploaded and saved!');
    } catch {
      const localUrl = URL.createObjectURL(file);
      const next = slots.map((s, i) => i === idx ? { ...s, imageUrl: localUrl } : s);
      setSlots(next);
      toast('Media previewed locally (network error)', true);
    }
    setUploadingIdx(null);
  };

  const removeImage = (idx: number) => {
    const next = slots.map((s, i) => i === idx ? { ...s, imageUrl: '' } : s);
    setSlots(next);
    saveAll(next);
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-sm text-secondary-c">Loading quick responses...</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="flex items-center gap-2 rounded-xl2 border border-success-500/20 bg-success-500/10 px-4 py-3 text-sm font-medium text-success-700 dark:text-success-400">
          <CheckCircle className="h-4 w-4 shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl2 border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-700 dark:text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <SectionCard>
        <PanelHeader
          title="Quick Responses"
          desc="Define up to 6 direct text responses. Link buttons to these messages in the button editor."
          icon={<MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        <div className="mt-5 space-y-3">
          {slots.map((slot, idx) => {
            const isOpen = openIdx === idx;
            const hasContent = slot.text.trim().length > 0;
            return (
              <div key={idx} className="rounded-xl2 border border-base-c bg-card-c overflow-hidden">
                {/* Accordion header */}
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-ink-850 transition-colors"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-500/10">
                    <MessageSquare className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary-c">
                      {slot.internalName || `Quick Response ${idx + 1}`}
                    </p>
                    {!isOpen && hasContent && (
                      <p className="truncate text-[11px] text-muted-c mt-0.5">{slot.text}</p>
                    )}
                  </div>
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-c" />
                    : <ChevronDown className="h-4 w-4 shrink-0 text-muted-c" />}
                </button>

                {/* Accordion body */}
                {isOpen && (
                  <div className="border-t border-base-c px-4 pb-4 pt-4 space-y-4">
                    {/* Internal Name */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-secondary-c">
                        Internal Name <span className="normal-case font-normal text-muted-c">(Label for you)</span>
                      </label>
                      <input
                        value={slot.internalName}
                        onChange={(e) => updateSlot(idx, 'internalName', e.target.value)}
                        placeholder={`Quick Response ${idx + 1}`}
                        className="form-input"
                      />
                    </div>

                    {/* Response Text */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-secondary-c">
                        Response Text <span className="normal-case font-normal text-muted-c">(Sent to customer)</span>
                      </label>
                      <textarea
                        value={slot.text}
                        onChange={(e) => updateSlot(idx, 'text', e.target.value)}
                        rows={4}
                        placeholder="Type the message that will be sent to the customer..."
                        className="form-input resize-none"
                      />
                    </div>

                    {/* Optional Media / Document Attachment */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-secondary-c">
                        Media / Document Attachment (Images, Videos, PDF, Docs)
                      </label>
                      {slot.imageUrl ? (
                        <div className="relative inline-flex items-center gap-2 p-2 rounded-xl2 border border-base-c bg-card-c shadow-sm">
                          {slot.imageUrl.match(/\.(mp4|webm|mov|avi|3gp)($|\?)/i) ? (
                            <div className="grid h-16 w-16 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
                              <Video className="h-8 w-8" />
                            </div>
                          ) : slot.imageUrl.match(/\.(pdf|doc|docx|xls|xlsx|txt)($|\?)/i) ? (
                            <div className="grid h-16 w-16 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                              <FileText className="h-8 w-8" />
                            </div>
                          ) : (
                            <img
                              src={resolveMediaUrl(slot.imageUrl)}
                              alt="Attached"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              className="h-20 w-auto rounded-xl object-cover border border-base-c"
                            />
                          )}
                          <span className="text-[11px] font-mono text-secondary-c max-w-[200px] truncate">{slot.imageUrl}</span>
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-danger-500 text-white shadow-md hover:bg-danger-600 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-base-c bg-slate-50 dark:bg-ink-900 px-4 py-5 text-sm text-muted-c hover:border-primary-400 hover:text-primary-600 transition-colors">
                          {uploadingIdx === idx
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                            : <><Upload className="h-4 w-4" /> Upload Media / Document (Max 50MB)</>}
                          <input
                            ref={(el) => { fileRefs.current[idx] = el; }}
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

                    {/* Save */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => saveAll(slots)}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-bold text-white hover:scale-105 disabled:opacity-60 transition-transform"
                      >
                        {saving
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Save className="h-3.5 w-3.5" />}
                        Save Response
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-muted-c">
          Changes auto-save to backend. Link responses to buttons via the Menu &amp; Buttons editor.
        </p>
      </SectionCard>
    </div>
  );
}
