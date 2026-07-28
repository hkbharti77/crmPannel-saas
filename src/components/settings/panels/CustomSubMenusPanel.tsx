import { useState, useEffect, useRef } from 'react';
import { cx } from '@/lib/types';
import {
  ListTree, CheckCircle, AlertCircle, Save, Loader2,
  ChevronUp, ChevronDown, Plus, Trash2, Image as ImageIcon, X, Upload,
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { apiFetch } from '@/lib/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface CustomItem {
  title: string;
  desc: string;
  response: string;
  imageUrl?: string;
}

interface CustomSubMenu {
  id: string;
  triggerLabel: string;
  headerTitle: string;
  bodyText: string;
  headerImageUrl?: string;
  items: CustomItem[];
}

interface WhatsAppMenuConfig {
  customSubMenusJson?: string;
}

/* ── Helper: upload image to backend ── */
async function uploadImage(file: File): Promise<string | null> {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API_BASE}/api/v1/whatsapp-config/upload-media`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      // NOTE: do NOT set Content-Type — browser sets it with boundary
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.url || null;
  } catch {
    return null;
  }
}

export function CustomSubMenusPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('custom_list_1');
  const [subMenus, setSubMenus] = useState<CustomSubMenu[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | 'header' | null>(null);

  // Ref for hidden file inputs (one per item + one for header)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { loadSubMenus(); }, []);

  const toast = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setMessage(null); }
    else { setMessage(msg); setError(null); }
    setTimeout(() => { setMessage(null); setError(null); }, 3500);
  };

  const ensure4Slots = (loaded: CustomSubMenu[]): CustomSubMenu[] => {
    const slots: CustomSubMenu[] = [];
    for (let i = 1; i <= 4; i++) {
      const id = `custom_list_${i}`;
      const existing = loaded.find((m) => m.id === id);
      slots.push(existing ?? {
        id,
        triggerLabel: `Custom Menu ${i}`,
        headerTitle: 'Our Options',
        bodyText: 'Please select an option below:',
        items: [{ title: 'Example Option 1', desc: 'Option description here', response: 'Thank you for selecting this option!' }],
      });
    }
    return slots;
  };

  const loadSubMenus = async () => {
    setLoading(true);
    const res = await apiFetch<WhatsAppMenuConfig>('/api/v1/whatsapp-config');
    setLoading(false);
    if (res.data?.customSubMenusJson) {
      try {
        const parsed = JSON.parse(res.data.customSubMenusJson);
        if (Array.isArray(parsed)) { setSubMenus(ensure4Slots(parsed)); return; }
      } catch { /* ignore */ }
    }
    setSubMenus(ensure4Slots([]));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await apiFetch('/api/v1/whatsapp-config', {
      method: 'POST',
      body: JSON.stringify({ customSubMenusJson: JSON.stringify(subMenus) }),
    });
    setSaving(false);
    if (!res.error) toast('Custom Sub-Menus saved successfully!');
    else toast(`Save failed: ${res.error}`, true);
  };

  const currentMenuIndex = subMenus.findIndex((m) => m.id === activeTab);
  const currentMenu = subMenus[currentMenuIndex] ?? subMenus[0];

  const updateCurrentMenu = (patch: Partial<CustomSubMenu>) => {
    setSubMenus((prev) => prev.map((m, idx) => (idx === currentMenuIndex ? { ...m, ...patch } : m)));
  };

  const addItem = () => {
    if (!currentMenu || currentMenu.items.length >= 10) return;
    updateCurrentMenu({ items: [...currentMenu.items, { title: '', desc: '', response: '' }] });
  };

  const removeItem = (itemIdx: number) => {
    if (!currentMenu) return;
    updateCurrentMenu({ items: currentMenu.items.filter((_, i) => i !== itemIdx) });
  };

  const updateItem = (itemIdx: number, field: keyof CustomItem, val: string) => {
    if (!currentMenu) return;
    updateCurrentMenu({ items: currentMenu.items.map((it, i) => (i === itemIdx ? { ...it, [field]: val } : it)) });
  };

  const moveItem = (itemIdx: number, dir: -1 | 1) => {
    if (!currentMenu) return;
    const newIdx = itemIdx + dir;
    if (newIdx < 0 || newIdx >= currentMenu.items.length) return;
    const next = [...currentMenu.items];
    [next[itemIdx], next[newIdx]] = [next[newIdx], next[itemIdx]];
    updateCurrentMenu({ items: next });
  };

  /* ── Image upload handlers ── */
  const handleHeaderImageUpload = async (file: File) => {
    setUploadingIdx('header');
    const url = await uploadImage(file);
    setUploadingIdx(null);
    if (url) {
      updateCurrentMenu({ headerImageUrl: url });
      toast('Header image uploaded!');
    } else {
      toast('Image upload failed. Max 5 MB, JPG/PNG/WebP.', true);
    }
  };

  const handleItemImageUpload = async (itemIdx: number, file: File) => {
    setUploadingIdx(itemIdx);
    const url = await uploadImage(file);
    setUploadingIdx(null);
    if (url) {
      updateItem(itemIdx, 'imageUrl', url);
      toast('Item image uploaded!');
    } else {
      toast('Image upload failed. Max 5 MB, JPG/PNG/WebP.', true);
    }
  };

  const triggerFileInput = (key: string) => {
    fileInputRefs.current[key]?.click();
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-sm text-secondary-c">Loading Custom Sub-Menus…</span>
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
          title="Custom Sub-Menus Builder"
          desc="Create up to 4 multi-option sub-lists with images. Each appears when customers tap its linked button."
          icon={<ListTree className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        {/* 4 Menu Selector Tabs */}
        <div className="mb-6 mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {subMenus.map((menu, idx) => {
            const isSelected = activeTab === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => setActiveTab(menu.id)}
                className={cx(
                  'rounded-xl2 border-2 p-3 text-left transition-all',
                  isSelected
                    ? 'border-emerald-500/40 bg-emerald-500/10 font-bold text-emerald-700 shadow-sm dark:text-emerald-400'
                    : 'border-base-c bg-card-c text-secondary-c hover:border-emerald-500/20',
                )}
              >
                <div className="truncate text-xs font-bold">
                  {menu.triggerLabel || `Custom Menu ${idx + 1}`}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-c">{menu.items.length} Options</div>
              </button>
            );
          })}
        </div>

        {currentMenu && (
          <div className="space-y-5">
            {/* Sub-Menu Header Config */}
            <div className="rounded-xl2 border border-base-c bg-card-c/50 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-c">Sub-Menu Header & Label</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Trigger Button Label</label>
                  <input value={currentMenu.triggerLabel} onChange={(e) => updateCurrentMenu({ triggerLabel: e.target.value })} placeholder="e.g. View Special Offers" className="form-input" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Header Title</label>
                  <input value={currentMenu.headerTitle} onChange={(e) => updateCurrentMenu({ headerTitle: e.target.value })} placeholder="e.g. Our Special Deals" className="form-input" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Body Message Text</label>
                <textarea value={currentMenu.bodyText} onChange={(e) => updateCurrentMenu({ bodyText: e.target.value })} rows={2} placeholder="Select an option below to learn more:" className="form-input resize-none" />
              </div>

              {/* Header Image Upload */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Sub-Menu Header Image (optional)</label>
                {currentMenu.headerImageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={currentMenu.headerImageUrl}
                      alt="Header"
                      className="h-24 w-auto rounded-xl2 border border-base-c object-cover shadow-sm"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <button
                      onClick={() => updateCurrentMenu({ headerImageUrl: undefined })}
                      className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-danger-500 text-white shadow hover:bg-danger-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => triggerFileInput(`header_${currentMenu.id}`)}
                    disabled={uploadingIdx === 'header'}
                    className="flex items-center gap-2 rounded-xl2 border-2 border-dashed border-base-c bg-slate-50/50 px-4 py-3 text-xs font-semibold text-secondary-c transition-colors hover:border-emerald-500/40 hover:text-emerald-700 disabled:opacity-60 dark:bg-ink-900/30 dark:hover:text-emerald-400"
                  >
                    {uploadingIdx === 'header'
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
                      : <><ImageIcon className="h-3.5 w-3.5" /> Add Header Image</>}
                  </button>
                )}
                <input
                  ref={(el) => { fileInputRefs.current[`header_${currentMenu.id}`] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleHeaderImageUpload(f);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            {/* List Options */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-c">
                  Menu Options ({currentMenu.items.length}/10)
                </span>
                <button
                  onClick={addItem}
                  disabled={currentMenu.items.length >= 10}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Menu Option
                </button>
              </div>

              <div className="space-y-3">
                {currentMenu.items.map((item, idx) => (
                  <div key={idx} className="rounded-xl2 border border-base-c bg-card-c p-4 space-y-3 shadow-sm">
                    {/* Option Header Row */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Option {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="grid h-6 w-6 place-items-center rounded border border-base-c text-secondary-c hover:text-primary-c disabled:opacity-30">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => moveItem(idx, 1)} disabled={idx === currentMenu.items.length - 1} className="grid h-6 w-6 place-items-center rounded border border-base-c text-secondary-c hover:text-primary-c disabled:opacity-30">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeItem(idx)} className="grid h-6 w-6 place-items-center rounded text-danger-500 hover:bg-danger-500/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Image Preview or Upload Button */}
                    <div>
                      {item.imageUrl ? (
                        <div className="relative inline-block">
                          <img
                            src={item.imageUrl}
                            alt={`Option ${idx + 1}`}
                            className="h-20 w-auto rounded-xl border border-base-c object-cover shadow-sm"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <button
                            onClick={() => updateItem(idx, 'imageUrl', '')}
                            className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-danger-500 text-white shadow hover:bg-danger-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => triggerFileInput(`item_${currentMenu.id}_${idx}`)}
                          disabled={uploadingIdx === idx}
                          className="flex items-center gap-2 rounded-lg border border-dashed border-base-c bg-slate-50/30 px-3 py-2 text-xs font-medium text-secondary-c transition-colors hover:border-emerald-500/40 hover:text-emerald-700 disabled:opacity-60 dark:bg-ink-900/20 dark:hover:text-emerald-400"
                        >
                          {uploadingIdx === idx
                            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
                            : <><Upload className="h-3.5 w-3.5" /> Add Item Image</>}
                        </button>
                      )}
                      <input
                        ref={(el) => { fileInputRefs.current[`item_${currentMenu.id}_${idx}`] = el; }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleItemImageUpload(idx, f);
                          e.target.value = '';
                        }}
                      />
                    </div>

                    {/* Title & Description */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Title (Max 24 chars)</label>
                        <input value={item.title} onChange={(e) => updateItem(idx, 'title', e.target.value)} maxLength={24} placeholder="e.g. 10% Off Coupon" className="form-input" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Description (Max 72 chars)</label>
                        <input value={item.desc} onChange={(e) => updateItem(idx, 'desc', e.target.value)} maxLength={72} placeholder="e.g. Valid on all bookings" className="form-input" />
                      </div>
                    </div>

                    {/* Auto-Reply */}
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Auto-Reply Text Message</label>
                      <textarea value={item.response} onChange={(e) => updateItem(idx, 'response', e.target.value)} rows={2} placeholder="Message sent to the lead when this option is selected..." className="form-input resize-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-base-c pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Custom Sub-Menus
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
