import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  LayoutList, CheckCircle, AlertCircle, Save, Loader2,
  ChevronUp, ChevronDown, Trash2, Plus, ShoppingBag,
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { apiFetch } from '@/lib/api';

interface WhatsAppMenuConfig {
  customSubMenusJson?: string;
}

interface MenuBuilderButton {
  id: string;
  title: string;
  subtitle: string;
  actionType: 'CATALOG' | 'EXTERNAL_LINK' | 'ABOUT_US' | 'CUSTOM_RESPONSE' | 'CONTACT_SUPPORT';
  icon: string;
  url?: string;
}

const ACTION_TYPES = [
  { id: 'CATALOG', label: 'Catalog (Products/Services)' },
  { id: 'EXTERNAL_LINK', label: 'External Link' },
  { id: 'ABOUT_US', label: 'About Us Text' },
  { id: 'CUSTOM_RESPONSE', label: 'Custom Response' },
  { id: 'CONTACT_SUPPORT', label: 'Contact Support' },
] as const;

const ICON_OPTIONS = ['briefcase', 'tag', 'info', 'phone', 'shopping-bag', 'star', 'link'];

export function MenuBuilderPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [buttons, setButtons] = useState<MenuBuilderButton[]>([
    { id: 'btn_1', title: 'Our Services', subtitle: 'What we offer', actionType: 'CATALOG', icon: 'briefcase' },
    { id: 'btn_2', title: 'Special Offers', subtitle: 'View current deals', actionType: 'EXTERNAL_LINK', icon: 'tag', url: '#offers' },
    { id: 'btn_3', title: 'FAQs', subtitle: 'Common questions', actionType: 'EXTERNAL_LINK', icon: 'info', url: '#faqs' },
    { id: 'btn_4', title: 'About Us', subtitle: 'Learn more', actionType: 'ABOUT_US', icon: 'info' },
  ]);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setLoading(true);
    const res = await apiFetch<WhatsAppMenuConfig>('/api/v1/whatsapp-config');
    setLoading(false);
    if (res.data?.customSubMenusJson) {
      try {
        const parsed = JSON.parse(res.data.customSubMenusJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setButtons(parsed);
        }
      } catch { /* ignore */ }
    }
  };

  const saveMenu = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await apiFetch('/api/v1/whatsapp-config', {
      method: 'POST',
      body: JSON.stringify({ customSubMenusJson: JSON.stringify(buttons) }),
    });
    setSaving(false);
    if (!res.error) {
      setMessage('Chat widget menu saved successfully!');
      setTimeout(() => setMessage(null), 3000);
    } else {
      setError(`Save failed: ${res.error}`);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= buttons.length) return;
    const next = [...buttons];
    [next[index], next[newIdx]] = [next[newIdx], next[index]];
    setButtons(next);
  };

  const updateButton = (index: number, patch: Partial<MenuBuilderButton>) => {
    setButtons(prev => prev.map((b, i) => i === index ? { ...b, ...patch } : b));
  };

  const addButton = () => {
    setButtons(prev => [
      ...prev,
      {
        id: `btn_${Date.now()}`,
        title: '',
        subtitle: '',
        actionType: 'EXTERNAL_LINK',
        icon: 'link',
        url: '',
      },
    ]);
  };

  const removeButton = (index: number) => {
    setButtons(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-sm text-secondary-c">Loading Menu Builder…</span>
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
          title="Menu Builder"
          desc="Customize the buttons shown in the chat widget sidebar. If you leave this empty, the widget will automatically show default buttons based on your business type."
          icon={<LayoutList className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        {/* Notice banner matching reference UI */}
        <div className="mb-5 rounded-xl2 border border-slate-200 bg-slate-50 p-4 text-center text-xs font-medium text-secondary-c dark:border-ink-700 dark:bg-ink-850">
          You are currently previewing the menu cards for your chat widget. Edit them below and click Save Menu to update!
        </div>

        {/* Button cards */}
        <div className="space-y-4">
          {buttons.map((btn, idx) => (
            <div key={btn.id} className="rounded-xl2 border border-base-c bg-card-c p-5 shadow-sm space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Button {idx + 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-base-c text-secondary-c hover:text-primary-c disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === buttons.length - 1}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-base-c text-secondary-c hover:text-primary-c disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeButton(idx)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-danger-500 hover:bg-danger-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Title (e.g. View Products)</label>
                <input
                  value={btn.title}
                  onChange={e => updateButton(idx, { title: e.target.value })}
                  placeholder="e.g. View Products"
                  className="form-input"
                />
              </div>

              {/* Subtitle input */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Subtitle (optional)</label>
                <input
                  value={btn.subtitle}
                  onChange={e => updateButton(idx, { subtitle: e.target.value })}
                  placeholder="Subtitle (optional)"
                  className="form-input"
                />
              </div>

              {/* Action Type selector */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-secondary-c">Action Type:</label>
                <div className="flex flex-wrap gap-2">
                  {ACTION_TYPES.map(act => (
                    <button
                      key={act.id}
                      onClick={() => updateButton(idx, { actionType: act.id })}
                      className={cx(
                        'rounded-full px-3 py-1 text-xs font-semibold border transition-all',
                        btn.actionType === act.id
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-base-c text-secondary-c hover:border-emerald-500/20',
                      )}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon selector */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-secondary-c">Icon:</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => updateButton(idx, { icon: ic })}
                      className={cx(
                        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all',
                        btn.icon === ic
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-base-c text-secondary-c hover:border-emerald-500/20',
                      )}
                    >
                      <ShoppingBag className="h-3 w-3" /> {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL input (if External Link) */}
              {btn.actionType === 'EXTERNAL_LINK' && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-secondary-c">URL (https://...)</label>
                  <input
                    value={btn.url || ''}
                    onChange={e => updateButton(idx, { url: e.target.value })}
                    placeholder="https://yourwebsite.com or #section"
                    className="form-input"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add custom button */}
        <button
          onClick={addButton}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-emerald-500/40 bg-emerald-500/5 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
        >
          <Plus className="h-4 w-4" /> Add Custom Button
        </button>

        {/* Save button */}
        <div className="mt-5">
          <button
            onClick={saveMenu}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Menu
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
