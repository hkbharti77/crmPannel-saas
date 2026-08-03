import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  LayoutList, CheckCircle, AlertCircle, Save, Loader2,
  ChevronUp, ChevronDown, Trash2, Plus, ShoppingBag,
  Briefcase, Tag, Info, Phone, Star, Link as LinkIcon, ExternalLink,
  Globe, X, ChevronRight, Sparkles, Send, MessageSquare,
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { apiFetch } from '@/lib/api';
import { fetchCurrentUserProfile } from '@/lib/userApi';

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

// ─── Live Web Chat Widget Preview Component ───────────────────────────────

function WebWidgetPreview({ buttons, businessId }: { buttons: MenuBuilderButton[]; businessId?: string }) {
  const [previewType, setPreviewType] = useState<'visual' | 'live'>('visual');
  const [isOpen, setIsOpen] = useState(true);
  const [activeActionMsg, setActiveActionMsg] = useState<string | null>(null);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'briefcase': return <Briefcase className="h-4 w-4" />;
      case 'tag': return <Tag className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'star': return <Star className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      default: return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const handleCardClick = (btn: MenuBuilderButton) => {
    let msg = `Tapped "${btn.title}"`;
    if (btn.actionType === 'CATALOG') msg = `🛍️ Opening Catalog...`;
    else if (btn.actionType === 'EXTERNAL_LINK') msg = `🔗 Navigating to ${btn.url || '#link'}...`;
    else if (btn.actionType === 'ABOUT_US') msg = `ℹ️ Showing About Us info...`;
    else if (btn.actionType === 'CONTACT_SUPPORT') msg = `📞 Connecting to Live Support...`;
    else msg = `💬 Triggered custom response...`;

    setActiveActionMsg(msg);
    setTimeout(() => setActiveActionMsg(null), 2500);
  };

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const embedWidgetUrl = businessId
    ? `${apiBaseUrl}/test.html?businessId=${encodeURIComponent(businessId)}&embed=true`
    : `${apiBaseUrl}/test.html?embed=true`;
  const fullPageUrl = businessId
    ? `${apiBaseUrl}/test.html?businessId=${encodeURIComponent(businessId)}`
    : `${apiBaseUrl}/test.html`;

  return (
    <div className="sticky top-6 flex flex-col items-center">
      {/* Header badge & mode tabs */}
      <div className="mb-3 flex items-center justify-between w-full max-w-[360px] gap-2">
        <div className="flex rounded-lg bg-slate-200 p-0.5 dark:bg-ink-800 border border-slate-300 dark:border-ink-700 w-full text-xs">
          <button
            type="button"
            onClick={() => setPreviewType('visual')}
            className={cx('flex-1 py-1.5 px-2.5 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1', previewType === 'visual' ? 'bg-white text-indigo-600 shadow dark:bg-ink-900 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400')}
          >
            <Sparkles className="h-3 w-3" /> Visual Mockup
          </button>
          <button
            type="button"
            onClick={() => setPreviewType('live')}
            className={cx('flex-1 py-1.5 px-2.5 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1', previewType === 'live' ? 'bg-[#00a884] text-white shadow' : 'text-slate-600 dark:text-slate-400')}
          >
            <Globe className="h-3 w-3" /> Live Bot (Auto ID)
          </button>
        </div>
      </div>

      {previewType === 'live' ? (
        /* Live Backend Static Resource iFrame with Auto Business ID */
        <div className="relative w-full max-w-[360px] rounded-2xl border border-emerald-500/40 bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-[580px]">
          <div className="bg-[#075e54] px-3 py-2 flex items-center justify-between text-white text-xs">
            <div className="leading-tight">
              <span className="font-bold flex items-center gap-1 text-[11px]">
                <Globe className="h-3 w-3 text-emerald-300" /> Auto Business Bot
              </span>
              <span className="text-[9px] text-emerald-200/80 font-mono">
                ID: {businessId ? `${businessId.substring(0, 12)}…` : 'Auto-Fetching'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => window.open(fullPageUrl, '_blank')}
              className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded font-semibold transition-colors flex items-center gap-1 shrink-0"
            >
              <ExternalLink className="h-3 w-3" /> Open Test Page
            </button>
          </div>
          <iframe
            src={embedWidgetUrl}
            title="Live Web Widget Test Page"
            className="flex-1 w-full border-0 bg-white"
          />
        </div>
      ) : (
        /* Mock Browser Container */
        <div className="relative w-full max-w-[360px] rounded-2xl border border-slate-300 dark:border-ink-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-[580px]">
          {/* Browser Top Bar */}
          <div className="bg-slate-800 px-3 py-2 flex items-center justify-between border-b border-slate-700 text-slate-300">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-slate-400 border border-slate-700 max-w-[170px] truncate">
              <Globe className="h-2.5 w-2.5 text-indigo-400 shrink-0" />
              <span className="truncate">yourwebsite.com</span>
            </div>
            <div className="w-8" />
          </div>

        {/* Mock Website Body */}
        <div className="flex-1 bg-slate-50 dark:bg-ink-950 p-4 relative overflow-hidden flex flex-col justify-between select-none">
          {/* Skeleton Website Content */}
          <div className="space-y-3 opacity-40">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-ink-800 pb-2">
              <div className="h-4 w-24 bg-slate-300 dark:bg-ink-700 rounded" />
              <div className="flex gap-2">
                <div className="h-3 w-12 bg-slate-300 dark:bg-ink-700 rounded" />
                <div className="h-3 w-12 bg-slate-300 dark:bg-ink-700 rounded" />
              </div>
            </div>
            <div className="h-16 w-full bg-indigo-500/10 rounded-lg p-2 flex items-center justify-center text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
              Your Business Website Hero Banner
            </div>
          </div>

          {/* Toast feedback in widget preview */}
          {activeActionMsg && (
            <div className="absolute top-12 left-4 right-4 z-40 bg-slate-900 text-white text-[11px] font-semibold p-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span>{activeActionMsg}</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            </div>
          )}

          {/* Floating Web Chat Widget Window */}
          {isOpen && (
            <div className="absolute right-3 bottom-14 left-3 z-30 bg-white dark:bg-ink-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-ink-700 overflow-hidden flex flex-col h-[430px] animate-in fade-in slide-in-from-bottom-3">
              {/* Widget Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white font-bold text-xs">
                    <MessageSquare className="h-4 w-4" />
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">Live Web Support</p>
                    <p className="text-[10px] text-indigo-100/80">Powered by GyanVani AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-white/80 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Widget Body & Cards */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-ink-950/50">
                {/* Greeting Bubble */}
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-3 text-xs text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/50">
                  <p className="font-bold mb-1 flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="h-3 w-3" /> Welcome!
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Select any button below to explore our services or chat with an agent:
                  </p>
                </div>

                {/* Live Menu Cards List */}
                <div className="space-y-2">
                  {buttons.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 italic">
                      No custom buttons added. Click &quot;Add Custom Button&quot; to configure.
                    </div>
                  ) : (
                    buttons.map((btn, idx) => (
                      <button
                        key={btn.id || idx}
                        type="button"
                        onClick={() => handleCardClick(btn)}
                        className="w-full text-left rounded-xl bg-white dark:bg-ink-800 p-3 border border-slate-200/80 dark:border-ink-700 shadow-sm hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group relative overflow-hidden"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            {renderIcon(btn.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {btn.title || `Button ${idx + 1}`}
                              </p>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            {btn.subtitle && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {btn.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Widget Input Footer */}
              <div className="p-2 border-t border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  disabled
                  className="flex-1 rounded-full bg-slate-100 dark:bg-ink-800 px-3 py-1.5 text-xs text-slate-400 disabled:opacity-70"
                />
                <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Send className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          )}

          {/* Floating Launcher Button */}
          <div className="absolute right-3 bottom-3 z-20 flex items-center gap-2">
            {!isOpen && (
              <span className="bg-slate-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-lg animate-bounce">
                Click to open preview 💬
              </span>
            )}
            <button
              onClick={() => setIsOpen(prev => !prev)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-slate-900">
                {buttons.length}
              </span>
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

export function MenuBuilderPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string>('');

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
    const [res, profRes] = await Promise.all([
      apiFetch<WhatsAppMenuConfig>('/api/v1/whatsapp-config'),
      fetchCurrentUserProfile(),
    ]);
    setLoading(false);

    if (profRes.data?.id || profRes.data?.tenantId) {
      setBusinessId(profRes.data.id || profRes.data.tenantId || '');
    }

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

      {/* Menu Builder Editor — Full Width */}
      <SectionCard>
        <PanelHeader
          title="Web Widget Menu Builder"
          desc="Customize the interactive button cards shown in your Website Chat Widget. If you leave this empty, the widget will automatically show default buttons based on your business type."
          icon={<LayoutList className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        {/* Button cards */}
        <div className="space-y-4">
          {buttons.map((btn, idx) => (
                <div key={btn.id} className="rounded-xl2 border border-base-c bg-card-c p-5 shadow-sm space-y-3">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Button {idx + 1}</span>
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
                              ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                              : 'border-base-c text-secondary-c hover:border-indigo-500/20',
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
                              ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                              : 'border-base-c text-secondary-c hover:border-indigo-500/20',
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
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-indigo-500/40 bg-indigo-500/5 py-3 text-xs font-bold text-indigo-700 hover:bg-indigo-500/10 dark:text-indigo-400"
            >
              <Plus className="h-4 w-4" /> Add Custom Button
            </button>

            {/* Save button */}
            <div className="mt-5">
              <button
                onClick={saveMenu}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Menu
              </button>
            </div>
          </SectionCard>
    </div>
  );
}
