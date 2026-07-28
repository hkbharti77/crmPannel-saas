import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  MessageSquare, LayoutList, CheckCircle, AlertCircle, PencilLine,
  Save, Loader2, Lock, ShoppingBag, ListTree, X,
} from 'lucide-react';
import { PanelHeader, Toggle, SectionCard } from './_shared';
import { apiFetch } from '@/lib/api';
import { fetchCurrentUserProfile, updateCurrentUserProfile } from '@/lib/userApi';

interface WhatsAppMenuConfig {
  welcomeMessage?: string;
  returningMessage?: string;
  showAboutContact?: boolean;
  showSosButton?: boolean;
  showSupportFormButton?: boolean;
  sosNote?: string;
  interactiveMenuJson?: string;
  menuType?: string;
}

interface TriggerLabels {
  subCategory?: string;
  triggerButtonLabel?: string;
  triggerListLabel?: string;
  servicesLabel?: string;
}

interface FeatureLabels {
  SOS?: string;
  ABOUT?: string;
  SUPPORT_FORM?: string;
}

interface MenuItem {
  id: string;
  title: string;
  desc: string;
  isCatalog?: boolean;
  customListId?: string;
}

const SLOT_PLACEHOLDERS = ['View Services', 'Contact Us', 'Pricing', 'Location', 'Follow Up', 'Our Work', 'Reviews', 'Gallery'];

export function MenuButtonsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Greeting state
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [returningMessage, setReturningMessage] = useState('');
  const [editingGreetings, setEditingGreetings] = useState(false);

  // Feature toggles
  const [showAboutContact, setShowAboutContact] = useState(false);
  const [showSosButton, setShowSosButton] = useState(false);
  const [showSupportFormButton, setShowSupportFormButton] = useState(false);
  const [sosNote, setSosNote] = useState('');
  const [thirdButtonType, setThirdButtonType] = useState<'ABOUT' | 'SOS' | 'SUPPORT_FORM'>('ABOUT');
  const [menuType, setMenuType] = useState<'list' | 'button'>('list');
  const [editingFeatures, setEditingFeatures] = useState(false);

  // Menu layout state
  const [menuItems, setMenuItems] = useState<MenuItem[]>(
    Array.from({ length: 5 }, (_, i) => ({ id: `slot_${i}`, title: '', desc: '' }))
  );
  const [editingLayout, setEditingLayout] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);

  // Labels from backend (read-only)
  const [triggerLabels, setTriggerLabels] = useState<TriggerLabels>({});
  const [featureLabels, setFeatureLabels] = useState<FeatureLabels>({
    SOS: '🆘 Human Support',
    ABOUT: '📂 About & Contact',
    SUPPORT_FORM: '🎫 Get Support',
  });

  const [showAppointmentFlow, setShowAppointmentFlow] = useState(true);
  const [showBookingFlow, setShowBookingFlow] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [configRes, triggerRes, featureRes, profileRes] = await Promise.all([
      apiFetch<WhatsAppMenuConfig>('/api/v1/whatsapp-config'),
      apiFetch<TriggerLabels>('/api/v1/flow-config/trigger-labels'),
      apiFetch<FeatureLabels>('/api/v1/whatsapp-config/feature-labels'),
      fetchCurrentUserProfile(),
    ]);
    setLoading(false);

    if (profileRes.data) {
      setShowAppointmentFlow(profileRes.data.forceShowAppointment ?? true);
      setShowBookingFlow(profileRes.data.forceShowBooking ?? true);
    }

    if (configRes.data) {
      const d = configRes.data;
      setWelcomeMessage(d.welcomeMessage || '');
      setReturningMessage(d.returningMessage || '');
      setShowAboutContact(d.showAboutContact ?? false);
      setShowSosButton(d.showSosButton ?? false);
      setShowSupportFormButton(d.showSupportFormButton ?? false);
      setSosNote(d.sosNote || '');
      if (d.menuType === 'button' || d.menuType === 'list') setMenuType(d.menuType);
      if (d.interactiveMenuJson) {
        try {
          const parsed = JSON.parse(d.interactiveMenuJson);
          const rows: any[] = parsed?.action?.sections?.[0]?.rows || parsed?.action?.buttons || [];
          if (rows.length > 0) {
            setMenuItems(rows.map((r: any, i: number) => ({
              id: r.id || `slot_${i}`,
              title: r.title || r.reply?.title || '',
              desc: r.description || '',
              isCatalog: false,
              customListId: r.customListId || '',
            })));
          }
        } catch { /* ignore */ }
      }
    }
    if (triggerRes.data) setTriggerLabels(triggerRes.data);
    if (featureRes.data) setFeatureLabels(featureRes.data);
  };

  // Derived slot capacity & active trigger flows
  const activeFlows: string[] = [];
  activeFlows.push('💻 Enquire Now');
  if (showAppointmentFlow) activeFlows.push(triggerLabels.triggerListLabel || '🗓️ Book Appointment');
  if (showBookingFlow) activeFlows.push(triggerLabels.triggerButtonLabel || '✂️ Book Service');

  const reservedFeatures: string[] = [
    ...(showSupportFormButton ? [featureLabels.SUPPORT_FORM || '🎫 Get Support'] : []),
    ...(showAboutContact ? [featureLabels.ABOUT || '📂 About & Contact'] : []),
    ...(showSosButton ? [featureLabels.SOS || '🆘 Human Support'] : []),
  ];

  const maxManualSlots = menuType === 'button'
    ? Math.max(0, 3 - activeFlows.length - 1)
    : Math.max(0, 10 - activeFlows.length - reservedFeatures.length);

  const handleSaveGreetings = async () => {
    setSaving(true); setMessage(null); setError(null);
    const res = await apiFetch('/api/v1/whatsapp-config', {
      method: 'POST',
      body: JSON.stringify({ welcomeMessage, returningMessage }),
    });
    setSaving(false);
    if (!res.error) { setMessage('Greeting messages saved!'); setEditingGreetings(false); setTimeout(() => setMessage(null), 3000); }
    else setError(`Save failed: ${res.error}`);
  };

  const handleSaveFeatures = async () => {
    setSaving(true); setMessage(null); setError(null);
    const [res] = await Promise.all([
      apiFetch('/api/v1/whatsapp-config', {
        method: 'POST',
        body: JSON.stringify({ showAboutContact, showSosButton, showSupportFormButton, sosNote, thirdButtonType }),
      }),
      updateCurrentUserProfile({
        forceShowAppointment: showAppointmentFlow,
        forceShowBooking: showBookingFlow,
      }),
    ]);
    setSaving(false);
    if (!res.error) { setMessage('Feature buttons & module settings saved!'); setEditingFeatures(false); setTimeout(() => setMessage(null), 3000); }
    else setError(`Save failed: ${res.error}`);
  };

  const buildMenuJson = () => {
    const visible = menuItems.slice(0, maxManualSlots).filter(it => it.title.trim());
    if (menuType === 'button') {
      return JSON.stringify({
        type: 'button',
        action: {
          buttons: [
            ...activeFlows.map((f, i) => ({ type: 'reply', reply: { id: `trigger_${i}`, title: f.substring(0, 20) } })),
            ...visible.map(it => ({ type: 'reply', reply: { id: it.id, title: it.title.substring(0, 20) } })),
          ],
        },
      });
    }
    return JSON.stringify({
      type: 'list',
      action: {
        button: 'View Options',
        sections: [{
          title: 'Menu',
          rows: [
            ...activeFlows.map((f, i) => ({ id: `trigger_${i}`, title: f.substring(0, 24), description: 'Start booking/enquiry flow' })),
            ...visible.map(it => ({
              id: it.id,
              title: it.title.substring(0, 24),
              description: (it.desc || '').substring(0, 72),
              ...(it.customListId ? { customListId: it.customListId } : {}),
            })),
          ],
        }],
      },
    });
  };

  const handleSaveLayout = async () => {
    setSaving(true); setMessage(null); setError(null);
    const res = await apiFetch('/api/v1/whatsapp-config', {
      method: 'POST',
      body: JSON.stringify({ interactiveMenuJson: buildMenuJson(), menuType }),
    });
    setSaving(false);
    if (!res.error) { setMessage('Menu layout saved!'); setEditingLayout(false); setTimeout(() => setMessage(null), 3000); }
    else setError(`Save failed: ${res.error}`);
  };

  const updateItem = (idx: number, patch: Partial<MenuItem>) =>
    setMenuItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));

  if (loading) {
    return (
      <SectionCard>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-sm text-secondary-c">Loading menu configuration…</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status feedback */}
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

      {/* ─── Automated Greetings ─── */}
      <SectionCard>
        <div className="mb-4 flex items-center justify-between">
          <PanelHeader
            title="Automated Greetings"
            desc="Messages sent right before your menu buttons appear"
            icon={<MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          />
          {!editingGreetings && (
            <button
              onClick={() => setEditingGreetings(true)}
              className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-1.5 text-xs font-medium text-secondary-c hover:text-primary-c"
            >
              <PencilLine className="h-3.5 w-3.5" /> Edit Greetings
            </button>
          )}
        </div>
        <div className="space-y-3 rounded-lg border border-amber-300/40 bg-amber-50/50 p-4 dark:bg-amber-900/10">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">First-Time Welcome Message</label>
            <textarea
              value={welcomeMessage}
              onChange={e => setWelcomeMessage(e.target.value)}
              disabled={!editingGreetings}
              rows={3}
              placeholder="Sent to NEW leads only. Use {{name}} for customer name."
              className="form-input resize-none disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Returning Customer Greeting</label>
            <textarea
              value={returningMessage}
              onChange={e => setReturningMessage(e.target.value)}
              disabled={!editingGreetings}
              rows={2}
              placeholder="Sent to repeat customers. Use {{name}} for customer name."
              className="form-input resize-none disabled:opacity-60"
            />
          </div>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            💡 Use <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/30">{'{{name}}'}</code> for customer name,{' '}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/30">{'{{business}}'}</code> for business name.
          </p>
        </div>
        {editingGreetings && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { setEditingGreetings(false); loadAll(); }}
              className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c hover:text-primary-c"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGreetings}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white hover:scale-105 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Greetings
            </button>
          </div>
        )}
      </SectionCard>

      {/* ─── Dynamic Feature Buttons ─── */}
      <SectionCard>
        <div className="mb-4 flex items-center justify-between">
          <PanelHeader
            title="Dynamic Feature Buttons"
            desc="Manage special reserved buttons in the WhatsApp menu"
            icon={<LayoutList className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          />
          {!editingFeatures && (
            <button
              onClick={() => setEditingFeatures(true)}
              className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-1.5 text-xs font-medium text-secondary-c hover:text-primary-c"
            >
              <PencilLine className="h-3.5 w-3.5" /> Edit Dynamic Content
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* SOS */}
          <div className="rounded-xl2 border border-base-c p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-primary-c">{featureLabels.SOS}</p>
                <p className="text-xs text-muted-c">Allows customers to request direct assistance from a support agent.</p>
              </div>
              <Toggle checked={showSosButton} onChange={v => { setShowSosButton(v); setEditingFeatures(true); }} />
            </div>
            {showSosButton && (
              <input
                value={sosNote}
                onChange={e => { setSosNote(e.target.value); setEditingFeatures(true); }}
                placeholder="e.g. Call us at +91 98765 43210"
                className="mt-2 form-input"
              />
            )}
          </div>

          {/* Support Form */}
          <div className="rounded-xl2 border border-base-c p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-primary-c">{featureLabels.SUPPORT_FORM}</p>
                <p className="text-xs text-muted-c">Allows customers to submit structured tickets via the Support Form flow on WhatsApp.</p>
              </div>
              <Toggle checked={showSupportFormButton} onChange={v => { setShowSupportFormButton(v); setEditingFeatures(true); }} />
            </div>
          </div>

          {/* Appointment Flow Toggle */}
          <div className="rounded-xl2 border border-base-c p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-primary-c">🗓️ Appointment Booking Flow</p>
                <p className="text-xs text-muted-c">Auto-reserves Fixed Trigger Slot for scheduling appointments on WhatsApp.</p>
              </div>
              <Toggle checked={showAppointmentFlow} onChange={v => { setShowAppointmentFlow(v); setEditingFeatures(true); }} />
            </div>
          </div>

          {/* Service Booking Flow Toggle */}
          <div className="rounded-xl2 border border-base-c p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-primary-c">✂️ Service Booking Flow</p>
                <p className="text-xs text-muted-c">Auto-reserves Fixed Trigger Slot for booking catalog services on WhatsApp.</p>
              </div>
              <Toggle checked={showBookingFlow} onChange={v => { setShowBookingFlow(v); setEditingFeatures(true); }} />
            </div>
          </div>

          {/* About & Contact */}
          <div className="rounded-xl2 border border-base-c p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-primary-c">{featureLabels.ABOUT}</p>
                <p className="text-xs text-muted-c">Shows your business info and maps location.</p>
              </div>
              <Toggle checked={showAboutContact} onChange={v => { setShowAboutContact(v); setEditingFeatures(true); }} />
            </div>
          </div>

          {/* 3rd button picker — button mode only */}
          {menuType === 'button' && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-c">Main Menu: Choose 3rd Button</p>
              <div className="grid grid-cols-3 gap-2">
                {(['ABOUT', 'SOS', 'SUPPORT_FORM'] as const).map(key => (
                  <button
                    key={key}
                    onClick={() => { setThirdButtonType(key); setEditingFeatures(true); }}
                    className={cx(
                      'rounded-lg border-2 px-3 py-2 text-xs font-semibold transition-all',
                      thirdButtonType === key
                        ? 'border-primary-500/40 bg-primary-500/10 text-primary-600 dark:text-primary-400'
                        : 'border-base-c text-secondary-c hover:border-primary-500/20',
                    )}
                  >
                    {key === 'ABOUT' ? 'About' : key === 'SOS' ? 'SOS' : 'Support Form'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {editingFeatures && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { setEditingFeatures(false); loadAll(); }}
              className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c hover:text-primary-c"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFeatures}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white hover:scale-105 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Features
            </button>
          </div>
        )}
      </SectionCard>

      {/* ─── Interactive Button Layout ─── */}
      <SectionCard>
        <PanelHeader
          title="Interactive Button Layout"
          desc="Configure the quick buttons or list items that customers see"
          icon={<LayoutList className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
        />

        {/* Format selector */}
        <div className="mb-5 mt-1">
          <p className="mb-2 text-xs font-medium text-secondary-c">Choose Formatting Style</p>
          <div className="grid grid-cols-2 gap-2">
            {(['list', 'button'] as const).map(t => (
              <button
                key={t}
                onClick={() => editingLayout && setMenuType(t)}
                disabled={!editingLayout}
                className={cx(
                  'rounded-xl2 border-2 px-4 py-2.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60',
                  menuType === t
                    ? 'border-primary-500/40 bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'border-base-c text-secondary-c',
                )}
              >
                {t === 'list' ? '≡ List (Up to 10)' : '⊡ Quick Buttons (Up to 3)'}
              </button>
            ))}
          </div>
        </div>

        {/* Fixed Flow Triggers */}
        <div className="mb-5 rounded-xl2 border-2 border-primary-500/40 bg-primary-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">🔒 Fixed Flow Trigger(s)</span>
            <span className="text-[11px] italic text-muted-c">Auto-set · Cannot be changed</span>
          </div>
          {activeFlows.map((flowLabel, idx) => (
            <div key={idx} className="mb-2 last:mb-0">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-c">
                Trigger Option {idx + 1} (Fixed)
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-primary-500/30 bg-white px-3 py-2.5 dark:bg-ink-900">
                <Lock className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                <span className="text-sm font-medium text-primary-c">{flowLabel}</span>
              </div>
            </div>
          ))}
          <p className="mt-3 text-[11px] italic text-muted-c">
            When a customer taps this, the automated {menuType === 'button' ? 'button' : 'list option'} will guide them through the booking/enquiry chat flow.
          </p>
        </div>

        {/* Customizable Options label */}
        <p className="mb-3 text-sm font-semibold text-primary-c">Customizable Options</p>

        {maxManualSlots === 0 && (
          <div className="mb-4 rounded-lg border border-amber-300/40 bg-amber-50/50 px-4 py-3 dark:bg-amber-900/10">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">ℹ️ Capacity Reached</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
              No manual options can be added because all available slots in the button menu are occupied by your enabled App Modules.
            </p>
          </div>
        )}

        {/* Manual option slots */}
        <div className="space-y-3">
          {menuItems.map((item, idx) => {
            if (idx >= maxManualSlots) return null;
            return (
              <div
                key={item.id}
                className={cx(
                  'rounded-xl2 border p-4 transition-all',
                  item.isCatalog ? 'border-primary-500/30 bg-primary-500/5' : 'border-base-c bg-card-c/50',
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">Manual Option {idx + 2}</span>
                  {item.isCatalog && (
                    <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[10px] font-bold text-primary-600 dark:text-primary-400">
                      🛍️ Catalog Link
                    </span>
                  )}
                </div>

                <input
                  value={item.title}
                  onChange={e => updateItem(idx, { title: e.target.value })}
                  disabled={!editingLayout}
                  maxLength={24}
                  placeholder={`Title (e.g. ${SLOT_PLACEHOLDERS[idx] ?? 'Option'})`}
                  className="mb-2 form-input disabled:opacity-60"
                />

                {menuType === 'list' && (
                  <input
                    value={item.desc}
                    onChange={e => updateItem(idx, { desc: e.target.value })}
                    disabled={!editingLayout}
                    maxLength={72}
                    placeholder="Description (Optional)"
                    className="mb-3 form-input disabled:opacity-60"
                  />
                )}

                <div className="grid grid-cols-2 gap-2">
                  {/* Link Catalog */}
                  <button
                    onClick={() => editingLayout && updateItem(idx, { isCatalog: !item.isCatalog, customListId: '' })}
                    disabled={!editingLayout}
                    className={cx(
                      'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all disabled:opacity-50',
                      item.isCatalog
                        ? 'border-primary-500/40 bg-primary-500/10 text-primary-600 dark:text-primary-400'
                        : 'border-base-c text-secondary-c hover:border-primary-500/20',
                    )}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    {item.isCatalog ? 'Catalog' : 'Link Catalog'}
                  </button>

                  {/* Link Action dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => editingLayout && setActionMenuOpen(actionMenuOpen === idx ? null : idx)}
                      disabled={!editingLayout}
                      className={cx(
                        'flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all disabled:opacity-50',
                        item.customListId
                          ? 'border-primary-500/40 bg-primary-500/10 text-primary-600 dark:text-primary-400'
                          : 'border-base-c text-secondary-c hover:border-primary-500/20',
                      )}
                    >
                      <ListTree className="h-3.5 w-3.5" />
                      {item.customListId
                        ? item.customListId.startsWith('custom_list') ? 'Linked List' : 'Quick Response'
                        : 'Link Action'}
                    </button>

                    {actionMenuOpen === idx && (
                      <div className="absolute left-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl2 border border-base-c bg-card-c shadow-soft-lg">
                        <div className="p-1">
                          <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-c">Custom Lists</p>
                          {[1, 2, 3, 4].map(n => (
                            <button
                              key={n}
                              onClick={() => { updateItem(idx, { isCatalog: false, customListId: `custom_list_${n}` }); setActionMenuOpen(null); }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-primary-c hover:bg-slate-50 dark:hover:bg-ink-800"
                            >
                              <ListTree className="h-3.5 w-3.5 text-muted-c" /> Custom Menu {n}
                            </button>
                          ))}
                          <div className="my-1 border-t border-base-c" />
                          <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-c">Quick Responses</p>
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <button
                              key={n}
                              onClick={() => { updateItem(idx, { isCatalog: false, customListId: `custom_msg_${n}` }); setActionMenuOpen(null); }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-primary-c hover:bg-slate-50 dark:hover:bg-ink-800"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-muted-c" /> Quick Response {n}
                            </button>
                          ))}
                          <div className="my-1 border-t border-base-c" />
                          <button
                            onClick={() => { updateItem(idx, { customListId: '' }); setActionMenuOpen(null); }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-danger-600 hover:bg-danger-500/10"
                          >
                            <X className="h-3.5 w-3.5" /> None
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reserved / Occupied slots */}
        {menuType === 'button' ? (
          <div className="mt-3 rounded-xl2 border border-dashed border-red-400/50 bg-red-50/50 p-3 dark:bg-red-900/10">
            <p className="mb-1 text-[11px] font-bold text-red-600">Option 3 (Reserved)</p>
            <p className="text-xs italic text-red-400">🔒 Occupied by: {featureLabels[thirdButtonType] || thirdButtonType}</p>
          </div>
        ) : (
          reservedFeatures.map((feat, i) => (
            <div key={i} className="mt-3 rounded-xl2 border border-dashed border-red-400/50 bg-red-50/50 p-3 dark:bg-red-900/10">
              <p className="mb-1 text-[11px] font-bold text-red-600">Option {maxManualSlots + i + 2} (Reserved)</p>
              <p className="text-xs italic text-red-400">🔒 Occupied by: {feat}</p>
            </div>
          ))
        )}

        {reservedFeatures.length + maxManualSlots < 9 && menuType === 'list' && (
          <p className="mt-3 text-center text-[11px] text-muted-c">Additional slots are hidden to respect WhatsApp's 10-item limit.</p>
        )}

        {/* Edit / Save Layout */}
        <div className="mt-5">
          {editingLayout ? (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingLayout(false); loadAll(); }}
                className="flex-1 rounded-lg border border-base-c px-4 py-2.5 text-xs font-medium text-secondary-c hover:text-primary-c"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLayout}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2.5 text-xs font-semibold text-white hover:scale-105 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Layout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingLayout(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-gradient-accent px-4 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01]"
            >
              <PencilLine className="h-4 w-4" /> Edit Menu Layout
            </button>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
