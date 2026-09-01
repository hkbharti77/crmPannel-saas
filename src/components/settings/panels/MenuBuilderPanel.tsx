import { useState, useEffect, useMemo } from 'react';
import { cx } from '@/lib/types';
import {
  LayoutList, CheckCircle, AlertCircle, Save, Loader2,
  ChevronUp, ChevronDown, Trash2, Plus, ShoppingBag,
  Briefcase, Tag, Info, Phone, Star, Link as LinkIcon, ExternalLink,
  Globe, X, Sparkles, Settings, Calendar, Home, User, FileText,
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { apiFetch } from '@/lib/api';
import { fetchCurrentUserProfile } from '@/lib/userApi';

type WidgetActionType = 'CATALOG' | 'FLOW' | 'LINK' | 'ABOUT' | 'SUPPORT';

interface MenuBuilderButton {
  id: string;
  title: string;
  subtitle: string;
  actionType: WidgetActionType;
  icon: string;
  url?: string;
  flowPayload?: string;
}

interface MenuSection {
  title: string;
  cards: {
    title: string;
    subtitle?: string;
    icon?: string;
    actionType?: string;
    actionPayload?: string;
  }[];
}

const ACTION_TYPES = [
  { id: 'CATALOG' as const, label: 'Catalog (Products/Services)' },
  { id: 'FLOW' as const, label: 'Flow (Appt/Booking/Quote)' },
  { id: 'LINK' as const, label: 'External Link' },
  { id: 'ABOUT' as const, label: 'About Us Text' },
  { id: 'SUPPORT' as const, label: 'Contact Support' },
];

const FLOW_PAYLOADS = [
  { id: 'appointment', label: 'Appointment' },
  { id: 'booking', label: 'Booking' },
  { id: 'lead', label: 'Lead / Quote' },
];

const ICON_OPTIONS = ['briefcase', 'tag', 'info', 'phone', 'shopping-bag', 'star', 'link', 'calendar', 'home', 'settings', 'doc'];

interface ApiMenuCard {
  section?: string;
  title: string;
  subtitle?: string;
  icon?: string;
  actionType?: string;
  actionPayload?: string;
}

function apiCardToButton(c: ApiMenuCard, id: string): MenuBuilderButton {
  const actionType = normalizeActionType(c.actionType);
  return {
    id,
    title: c.title,
    subtitle: c.subtitle || '',
    actionType,
    icon: c.icon || 'briefcase',
    url: actionType === 'FLOW' ? undefined : (c.actionPayload || ''),
    flowPayload: actionType === 'FLOW' ? (c.actionPayload || 'lead') : undefined,
  };
}

function buttonsToPayload(buttons: MenuBuilderButton[], section: 'SERVICES' | 'RESOURCES') {
  return buttons.map((b, index) => ({
    section,
    title: b.title.trim() || 'Untitled Option',
    subtitle: b.subtitle || '',
    icon: b.icon || 'briefcase',
    actionType: b.actionType,
    actionPayload: b.actionType === 'FLOW' ? (b.flowPayload || 'lead') : (b.url || ''),
    displayOrder: index,
  }));
}

function normalizeActionType(raw: string | undefined): WidgetActionType {
  switch ((raw || '').toUpperCase()) {
    case 'EXTERNAL_LINK':
    case 'CUSTOM_RESPONSE':
      return 'LINK';
    case 'ABOUT_US':
      return 'ABOUT';
    case 'CONTACT_SUPPORT':
      return 'SUPPORT';
    case 'FLOW':
      return 'FLOW';
    case 'LINK':
    case 'ABOUT':
    case 'SUPPORT':
    case 'CATALOG':
      return raw!.toUpperCase() as WidgetActionType;
    default:
      return 'CATALOG';
  }
}

function renderIcon(iconName: string, className = 'h-4 w-4') {
  switch (iconName) {
    case 'briefcase': return <Briefcase className={className} />;
    case 'tag': return <Tag className={className} />;
    case 'info': return <Info className={className} />;
    case 'phone': return <Phone className={className} />;
    case 'star': return <Star className={className} />;
    case 'link': return <LinkIcon className={className} />;
    case 'calendar': return <Calendar className={className} />;
    case 'home': return <Home className={className} />;
    case 'settings': return <Settings className={className} />;
    case 'user': return <User className={className} />;
    case 'doc': return <FileText className={className} />;
    default: return <ShoppingBag className={className} />;
  }
}

function buildDraftSections(
  liveSections: MenuSection[],
  servicesButtons: MenuBuilderButton[],
  resourcesButtons: MenuBuilderButton[],
): MenuSection[] {
  const toCards = (buttons: MenuBuilderButton[]) => buttons.map(b => ({
    title: b.title || 'Untitled',
    subtitle: b.subtitle || '',
    icon: b.icon || 'briefcase',
    actionType: b.actionType,
    actionPayload: b.actionType === 'FLOW' ? (b.flowPayload || 'lead') : (b.url || ''),
  }));

  const draftServices = toCards(servicesButtons);
  const draftResources = toCards(resourcesButtons);

  if (!liveSections.length) {
    const sections: MenuSection[] = [{ title: 'SERVICES', cards: draftServices }];
    if (draftResources.length > 0) {
      sections.push({ title: 'RESOURCES', cards: draftResources });
    }
    return sections;
  }

  return liveSections.map(section => {
    if (section.title === 'SERVICES') return { ...section, cards: draftServices };
    if (section.title === 'RESOURCES') return { ...section, cards: draftResources };
    return section;
  }).filter(section => section.title !== 'RESOURCES' || (section.cards && section.cards.length > 0));
}

function ButtonSectionEditor({
  sectionLabel,
  sectionHint,
  buttons,
  onChange,
}: {
  sectionLabel: string;
  sectionHint: string;
  buttons: MenuBuilderButton[];
  onChange: (next: MenuBuilderButton[]) => void;
}) {
  const move = (index: number, dir: -1 | 1) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= buttons.length) return;
    const next = [...buttons];
    [next[index], next[newIdx]] = [next[newIdx], next[index]];
    onChange(next);
  };

  const updateButton = (index: number, patch: Partial<MenuBuilderButton>) => {
    onChange(buttons.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const addButton = () => {
    if (buttons.length >= 10) return;
    onChange([
      ...buttons,
      { id: `btn_${Date.now()}`, title: '', subtitle: '', actionType: 'LINK', icon: 'link', url: '' },
    ]);
  };

  const removeButton = (index: number) => {
    onChange(buttons.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-primary-c">{sectionLabel}</h3>
        <p className="text-[11px] text-secondary-c mt-0.5">{sectionHint}</p>
      </div>

      {buttons.length === 0 ? (
        <p className="text-xs text-secondary-c italic py-2">No cards in this section. Add one below or leave empty to hide the section.</p>
      ) : (
        buttons.map((btn, idx) => (
          <div key={btn.id} className="rounded-xl2 border border-base-c bg-card-c p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Card {idx + 1}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="grid h-7 w-7 place-items-center rounded-lg border border-base-c text-secondary-c hover:text-primary-c disabled:opacity-30">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === buttons.length - 1} className="grid h-7 w-7 place-items-center rounded-lg border border-base-c text-secondary-c hover:text-primary-c disabled:opacity-30">
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => removeButton(idx)} className="grid h-7 w-7 place-items-center rounded-lg text-danger-500 hover:bg-danger-500/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Title</label>
              <input value={btn.title} onChange={e => updateButton(idx, { title: e.target.value })} placeholder="e.g. Careers" className="form-input" />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Subtitle (optional)</label>
              <input value={btn.subtitle} onChange={e => updateButton(idx, { subtitle: e.target.value })} placeholder="Subtitle (optional)" className="form-input" />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-secondary-c">Action Type</label>
              <div className="flex flex-wrap gap-2">
                {ACTION_TYPES.map(act => (
                  <button
                    key={act.id}
                    type="button"
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

            {btn.actionType === 'FLOW' && (
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-secondary-c">Flow Type</label>
                <div className="flex flex-wrap gap-2">
                  {FLOW_PAYLOADS.map(fp => (
                    <button
                      key={fp.id}
                      type="button"
                      onClick={() => updateButton(idx, { flowPayload: fp.id })}
                      className={cx(
                        'rounded-full px-3 py-1 text-xs font-semibold border transition-all',
                        (btn.flowPayload || 'lead') === fp.id
                          ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                          : 'border-base-c text-secondary-c hover:border-indigo-500/20',
                      )}
                    >
                      {fp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {btn.actionType === 'LINK' && (
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-secondary-c">URL (https://… or #section)</label>
                <input value={btn.url || ''} onChange={e => updateButton(idx, { url: e.target.value })} placeholder="https://yourwebsite.com/careers" className="form-input" />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-secondary-c">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => updateButton(idx, { icon: ic })}
                    className={cx(
                      'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all',
                      btn.icon === ic
                        ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                        : 'border-base-c text-secondary-c hover:border-indigo-500/20',
                    )}
                  >
                    {renderIcon(ic, 'h-3 w-3')} {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={addButton}
        disabled={buttons.length >= 10}
        className="flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-indigo-500/40 bg-indigo-500/5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-500/10 dark:text-indigo-400 disabled:opacity-40"
      >
        <Plus className="h-4 w-4" /> Add {sectionLabel} Card
      </button>
    </div>
  );
}

function WebWidgetPreview({
  menuSections,
  businessId,
  businessName,
}: {
  menuSections: MenuSection[];
  businessId?: string;
  businessName?: string;
}) {
  const [previewType, setPreviewType] = useState<'visual' | 'live'>('visual');

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const embedWidgetUrl = businessId
    ? `${apiBaseUrl}/test.html?businessId=${encodeURIComponent(businessId)}&embed=true`
    : `${apiBaseUrl}/test.html?embed=true`;
  const fullPageUrl = businessId
    ? `${apiBaseUrl}/test.html?businessId=${encodeURIComponent(businessId)}`
    : `${apiBaseUrl}/test.html`;

  return (
    <div className="sticky top-6 flex flex-col">
      <div className="mb-3 flex rounded-lg bg-slate-200 p-0.5 dark:bg-ink-800 border border-slate-300 dark:border-ink-700 w-full text-xs">
        <button
          type="button"
          onClick={() => setPreviewType('visual')}
          className={cx(
            'flex-1 py-1.5 px-2.5 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1',
            previewType === 'visual'
              ? 'bg-white text-indigo-600 shadow dark:bg-ink-900 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400',
          )}
        >
          <Sparkles className="h-3 w-3" /> Visual Mockup
        </button>
        <button
          type="button"
          onClick={() => setPreviewType('live')}
          className={cx(
            'flex-1 py-1.5 px-2.5 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1',
            previewType === 'live'
              ? 'bg-[#00a884] text-white shadow'
              : 'text-slate-600 dark:text-slate-400',
          )}
        >
          <Globe className="h-3 w-3" /> Live Bot
        </button>
      </div>

      {previewType === 'live' ? (
        <div className="relative w-full rounded-2xl border border-emerald-500/40 bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-[580px]">
          <div className="bg-[#075e54] px-3 py-2 flex items-center justify-between text-white text-xs">
            <div className="leading-tight">
              <span className="font-bold flex items-center gap-1 text-[11px]">
                <Globe className="h-3 w-3 text-emerald-300" /> Live Widget
              </span>
              <span className="text-[9px] text-emerald-200/80 font-mono">
                ID: {businessId ? `${businessId.substring(0, 12)}…` : 'Loading…'}
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
            title="Live Web Widget"
            allow="microphone *; camera *; display-capture *; autoplay *; clipboard-write *"
            className="flex-1 w-full border-0 bg-white"
          />
        </div>
      ) : (
        <div className="w-full rounded-2xl border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-2xl overflow-hidden flex flex-col h-[580px]">
          {/* Widget menu overlay header — matches real widget */}
          <div className="bg-[#0f172a] px-4 py-3 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold">
                {(businessName || 'A').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{businessName || 'Your Business'}</p>
                <p className="text-[11px] text-slate-300">Select an option</p>
              </div>
            </div>
            <X className="h-4 w-4 text-white/70 shrink-0" />
          </div>

          {/* Sectioned menu body — matches widget renderMenuOverlay */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50 dark:bg-ink-950">
            {menuSections.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8 italic">
                Add buttons and save to preview your widget menu.
              </p>
            ) : (
              menuSections.map(section => (
                <div key={section.title}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(section.cards || []).map((card, idx) => (
                      <div
                        key={`${section.title}-${idx}`}
                        className="rounded-xl border border-slate-200 dark:border-ink-700 bg-white dark:bg-ink-800 p-3 flex flex-col items-center text-center gap-1.5"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                          {renderIcon(card.icon || 'briefcase', 'h-4 w-4')}
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">
                          {card.title}
                        </p>
                        {card.subtitle && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                            {card.subtitle}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-3 py-2 border-t border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 text-[10px] text-slate-400 text-center">
            Preview shows CONNECT from flows · SERVICES & RESOURCES update as you edit
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
  const [businessName, setBusinessName] = useState<string>('');
  const [liveMenuSections, setLiveMenuSections] = useState<MenuSection[]>([]);

  const [servicesButtons, setServicesButtons] = useState<MenuBuilderButton[]>([
    { id: 'svc_1', title: 'Our Services', subtitle: 'What we offer', actionType: 'CATALOG', icon: 'briefcase' },
    { id: 'svc_2', title: 'Special Offers', subtitle: 'View current deals', actionType: 'LINK', icon: 'tag', url: '#offers' },
    { id: 'svc_3', title: 'FAQs', subtitle: 'Common questions', actionType: 'LINK', icon: 'info', url: '#faqs' },
    { id: 'svc_4', title: 'About Us', subtitle: 'Learn more', actionType: 'ABOUT', icon: 'info' },
  ]);

  const [resourcesButtons, setResourcesButtons] = useState<MenuBuilderButton[]>([
    { id: 'res_1', title: 'Careers', subtitle: 'Join our team', actionType: 'LINK', icon: 'doc', url: '#careers' },
    { id: 'res_2', title: 'Blog', subtitle: 'Read our articles', actionType: 'LINK', icon: 'doc', url: '#blog' },
  ]);

  const previewSections = useMemo(
    () => buildDraftSections(liveMenuSections, servicesButtons, resourcesButtons),
    [liveMenuSections, servicesButtons, resourcesButtons],
  );

  const fetchLiveMenu = async (bizId: string) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    try {
      const res = await fetch(`${apiBase}/api/v1/public/config/${bizId}`);
      if (res.ok) {
        const data = await res.json();
        setLiveMenuSections(data.menuSections || []);
        if (data.businessName) setBusinessName(data.businessName);
      }
    } catch {
      /* preview falls back to draft-only sections */
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setLoading(true);
    const [res, profRes] = await Promise.all([
      apiFetch<{
        cards?: ApiMenuCard[];
        servicesCards?: ApiMenuCard[];
        resourcesCards?: ApiMenuCard[];
        isCustom?: boolean;
      }>('/api/v1/tenant/menu-builder'),
      fetchCurrentUserProfile(),
    ]);
    setLoading(false);

    const bizId = profRes.data?.id || profRes.data?.tenantId || '';
    if (bizId) {
      setBusinessId(bizId);
      if (profRes.data?.businessName) setBusinessName(profRes.data.businessName);
      fetchLiveMenu(bizId);
    }

    if (res.data) {
      const svc = res.data.servicesCards?.length
        ? res.data.servicesCards
        : (res.data.cards || []).filter(c => (c.section || 'SERVICES') === 'SERVICES');
      const resCards = res.data.resourcesCards?.length
        ? res.data.resourcesCards
        : (res.data.cards || []).filter(c => c.section === 'RESOURCES');

      if (svc.length > 0) {
        setServicesButtons(svc.map((c, i) => apiCardToButton(c, `svc_${i + 1}`)));
      }
      setResourcesButtons(
        resCards.length > 0
          ? resCards.map((c, i) => apiCardToButton(c, `res_${i + 1}`))
          : [],
      );
    }
  };

  const saveMenu = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    const payload = [
      ...buttonsToPayload(servicesButtons, 'SERVICES'),
      ...buttonsToPayload(resourcesButtons, 'RESOURCES'),
    ];

    if (payload.length === 0) {
      setSaving(false);
      setError('Add at least one card in Services or Resources before saving.');
      return;
    }

    const res = await apiFetch('/api/v1/tenant/menu-builder', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.error) {
      setMessage('Chat widget menu cards saved successfully!');
      if (businessId) fetchLiveMenu(businessId);
      setTimeout(() => setMessage(null), 3000);
    } else {
      setError(`Save failed: ${res.error}`);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Remove all custom cards and revert to niche defaults?')) return;
    setSaving(true);
    const res = await apiFetch('/api/v1/tenant/menu-builder', { method: 'DELETE' });
    setSaving(false);
    if (!res.error) {
      setMessage('Reverted to default menu cards.');
      await loadMenu();
      setTimeout(() => setMessage(null), 3000);
    } else {
      setError(`Reset failed: ${res.error}`);
    }
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
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4 min-w-0">
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
            title="Web Widget Menu Builder"
            desc="Customize SERVICES and RESOURCES cards in your chat widget menu. CONNECT is auto-generated from your enabled flows."
            icon={<LayoutList className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          />

          <div className="space-y-8">
            <ButtonSectionEditor
              sectionLabel="Services Section"
              sectionHint="Main catalog, offers, FAQs, and about cards shown under SERVICES."
              buttons={servicesButtons}
              onChange={setServicesButtons}
            />

            <div className="border-t border-base-c pt-6">
              <ButtonSectionEditor
                sectionLabel="Resources Section"
                sectionHint="Secondary links like Careers and Blog. Remove all cards to hide this section entirely."
                buttons={resourcesButtons}
                onChange={setResourcesButtons}
              />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={saveMenu}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl2 bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Menu
            </button>
            <button
              type="button"
              onClick={resetToDefaults}
              disabled={saving}
              className="rounded-xl2 border border-base-c px-4 py-3 text-sm font-semibold text-secondary-c hover:bg-slate-50 dark:hover:bg-ink-850 disabled:opacity-60"
            >
              Reset Defaults
            </button>
          </div>
        </SectionCard>
      </div>

      <WebWidgetPreview
        menuSections={previewSections}
        businessId={businessId}
        businessName={businessName}
      />
    </div>
  );
}
