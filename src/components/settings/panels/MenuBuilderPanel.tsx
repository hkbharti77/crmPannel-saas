import { useState, useEffect, useMemo } from 'react';
import { cx } from '@/lib/types';
import {
  LayoutList, CheckCircle, AlertCircle, Save, Loader2,
  ChevronUp, ChevronDown, Trash2, Plus, ShoppingBag,
  Briefcase, Tag, Info, Phone, Star, Link as LinkIcon, ExternalLink,
  Globe, X, Sparkles, Settings, Calendar, Home, User, FileText,
  MessageSquare, Bot, Send, RotateCcw, Check, Eye, HelpCircle,
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import { Badge, GlassCard } from '@/components/ui/primitives';
import { apiFetch } from '@/lib/api';
import { fetchCurrentUserProfile, updateCurrentUserProfile } from '@/lib/userApi';

type WidgetActionType = 'CATALOG' | 'FLOW' | 'LINK' | 'ABOUT' | 'SUPPORT';

export type CtaActionType = 'APPOINTMENT' | 'BOOKING' | 'LEAD' | 'SUPPORT' | 'CATALOG' | 'LINK';

export interface WebGreetingButton {
  id: string;
  label: string;
  action: CtaActionType;
  payload?: string;
  url?: string;
}

export const CTA_ACTION_TYPES: { id: CtaActionType; label: string; icon: string; desc: string }[] = [
  { id: 'APPOINTMENT', label: 'Appointment', icon: 'calendar', desc: 'Schedule an appointment slot' },
  { id: 'BOOKING', label: 'Booking', icon: 'briefcase', desc: 'Complete service reservation form' },
  { id: 'LEAD', label: 'Lead / Quote', icon: 'doc', desc: 'Collect callback or quotation request' },
  { id: 'SUPPORT', label: 'Live Support', icon: 'phone', desc: 'Connect with support team or agent' },
  { id: 'CATALOG', label: 'Catalog', icon: 'shopping-bag', desc: 'Browse products & services list' },
  { id: 'LINK', label: 'External Link', icon: 'link', desc: 'Open custom URL in new tab' },
];

export const RECOMMENDED_GREETING_BUTTONS: WebGreetingButton[] = [
  { id: 'cta_1', label: '📅 Book Appointment', action: 'APPOINTMENT', payload: 'appointment' },
  { id: 'cta_2', label: '⚡ Request Quote', action: 'LEAD', payload: 'lead' },
  { id: 'cta_3', label: '🎫 Live Support', action: 'SUPPORT', payload: 'support' },
];

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
  { id: 'CATALOG' as const, label: 'Catalog', icon: 'shopping-bag' },
  { id: 'FLOW' as const, label: 'Flow', icon: 'calendar' },
  { id: 'LINK' as const, label: 'Link', icon: 'link' },
  { id: 'ABOUT' as const, label: 'About Us', icon: 'info' },
  { id: 'SUPPORT' as const, label: 'Support', icon: 'phone' },
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

function WebChatGreetingsEditor({
  webWelcomeMessage,
  setWebWelcomeMessage,
  webReturningMessage,
  setWebReturningMessage,
  webGreetingButtons,
  setWebGreetingButtons,
  businessName,
}: {
  webWelcomeMessage: string;
  setWebWelcomeMessage: (v: string) => void;
  webReturningMessage: string;
  setWebReturningMessage: (v: string) => void;
  webGreetingButtons: WebGreetingButton[];
  setWebGreetingButtons: (b: WebGreetingButton[]) => void;
  businessName: string;
}) {
  const move = (index: number, dir: -1 | 1) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= webGreetingButtons.length) return;
    const next = [...webGreetingButtons];
    [next[index], next[newIdx]] = [next[newIdx], next[index]];
    setWebGreetingButtons(next);
  };

  const updateButton = (index: number, patch: Partial<WebGreetingButton>) => {
    setWebGreetingButtons(webGreetingButtons.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const addButton = () => {
    if (webGreetingButtons.length >= 6) return;
    setWebGreetingButtons([
      ...webGreetingButtons,
      {
        id: `cta_${Date.now()}`,
        label: '✨ Explore Services',
        action: 'CATALOG',
        payload: 'catalog',
      },
    ]);
  };

  const removeButton = (index: number) => {
    setWebGreetingButtons(webGreetingButtons.filter((_, i) => i !== index));
  };

  const resetToRecommended = () => {
    setWebGreetingButtons([...RECOMMENDED_GREETING_BUTTONS]);
  };

  const resolvedWelcomePreview = (webWelcomeMessage || '👋 Hello! Welcome to {{business}}. How can we help you today?')
    .replace(/\{\{business\}\}/g, businessName || 'our business');

  const resolvedReturningPreview = (webReturningMessage || '👋 Welcome back to {{business}}! How can we assist you today?')
    .replace(/\{\{business\}\}/g, businessName || 'our business');

  return (
    <div className="space-y-6">
      {/* 1. Greeting Sequences Box */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-primary-c flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary-500" /> WebChat Greeting Sequences
            </h4>
            <p className="text-xs text-muted-c mt-0.5">
              Dedicated greetings separate from WhatsApp & Telegram. Use tag token to inject your business name.
            </p>
          </div>
        </div>

        {/* First-time visitor greeting */}
        <div className="rounded-xl2 border border-base-c bg-card-c p-4 sm:p-5 shadow-xs space-y-3 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-primary-c">First-Time Visitor (Welcome) Greeting</p>
                <p className="text-[11px] text-muted-c">Sent when a new prospect visits your website</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!webWelcomeMessage.includes('{{business}}')) {
                  setWebWelcomeMessage(webWelcomeMessage ? `${webWelcomeMessage.trim()} {{business}}` : 'Welcome to {{business}}!');
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-[11px] font-semibold text-primary-600 hover:bg-primary-500/20 dark:text-primary-400 transition-colors btn-tactile"
              title="Click to insert {{business}} token into text"
            >
              <Plus className="h-3 w-3" />
              <span>Insert {'{{business}}'}</span>
            </button>
          </div>

          <textarea
            rows={2}
            value={webWelcomeMessage}
            onChange={(e) => setWebWelcomeMessage(e.target.value)}
            placeholder="👋 Hello! Welcome to {{business}}. How can we help you today?"
            className="form-input resize-none text-xs sm:text-sm leading-relaxed"
          />

          <div className="flex items-start gap-1.5 rounded-lg border border-subtle-c bg-subtle-c/60 px-3 py-2 text-[11px] text-muted-c">
            <Eye className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary-500" />
            <span className="italic line-clamp-2">Preview: "{resolvedWelcomePreview}"</span>
          </div>
        </div>

        {/* Returning visitor greeting */}
        <div className="rounded-xl2 border border-base-c bg-card-c p-4 sm:p-5 shadow-xs space-y-3 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-success-500/10 text-success-600 dark:text-success-400">
                <RotateCcw className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-primary-c">Returning Visitor (Normal) Greeting</p>
                <p className="text-[11px] text-muted-c">Sent when an existing contact visits again</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!webReturningMessage.includes('{{business}}')) {
                  setWebReturningMessage(webReturningMessage ? `${webReturningMessage.trim()} {{business}}` : 'Welcome back to {{business}}!');
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-success-500/30 bg-success-500/10 px-2.5 py-1 text-[11px] font-semibold text-success-700 hover:bg-success-500/20 dark:text-success-400 transition-colors btn-tactile"
              title="Click to insert {{business}} token into text"
            >
              <Plus className="h-3 w-3" />
              <span>Insert {'{{business}}'}</span>
            </button>
          </div>

          <textarea
            rows={2}
            value={webReturningMessage}
            onChange={(e) => setWebReturningMessage(e.target.value)}
            placeholder="👋 Welcome back to {{business}}! How can we assist you today?"
            className="form-input resize-none text-xs sm:text-sm leading-relaxed"
          />

          <div className="flex items-start gap-1.5 rounded-lg border border-subtle-c bg-subtle-c/60 px-3 py-2 text-[11px] text-muted-c">
            <Eye className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success-500" />
            <span className="italic line-clamp-2">Preview: "{resolvedReturningPreview}"</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive CTA Action Buttons Section */}
      <div className="space-y-4 pt-4 border-t border-base-c">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-primary-c flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Interactive Greeting CTA Buttons
            </h4>
            <p className="text-xs text-muted-c mt-0.5">
              Pinned action buttons under the greeting message. Tap to trigger appointments, bookings, or catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={resetToRecommended}
            className="inline-flex items-center gap-1.5 rounded-lg border border-base-c bg-subtle-c/70 px-3 py-1.5 text-xs font-semibold text-secondary-c hover:text-primary-c hover:bg-card-c transition-all btn-tactile shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-c" />
            <span>Recommended 3 Presets</span>
          </button>
        </div>

        {webGreetingButtons.length === 0 ? (
          <div className="p-6 text-center rounded-xl2 border border-dashed border-base-c bg-subtle-c/30">
            <p className="text-xs text-muted-c italic">No CTA buttons defined. Add at least 2 buttons below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webGreetingButtons.map((btn, idx) => (
              <div
                key={btn.id}
                className="rounded-xl2 border border-base-c bg-card-c p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="primary" className="text-[10px] font-mono px-2 py-0.5 shrink-0">
                      #{idx + 1}
                    </Badge>
                    <span className="text-xs font-bold text-primary-c truncate">
                      {btn.label || `CTA Button ${idx + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-base-c text-secondary-c hover:text-primary-c hover:bg-subtle-c disabled:opacity-30 transition-colors btn-tactile"
                      title="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === webGreetingButtons.length - 1}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-base-c text-secondary-c hover:text-primary-c hover:bg-subtle-c disabled:opacity-30 transition-colors btn-tactile"
                      title="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeButton(idx)}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-transparent text-danger-500 hover:bg-danger-500/10 transition-colors btn-tactile"
                      title="Delete button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-secondary-c">
                      Button Text (with Emoji)
                    </label>
                    <input
                      value={btn.label}
                      onChange={(e) => updateButton(idx, { label: e.target.value })}
                      placeholder="e.g. 📅 Book Appointment"
                      className="form-input text-xs sm:text-sm font-medium"
                    />
                  </div>

                  <div>
                    {btn.action === 'LINK' ? (
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-secondary-c">
                          Destination URL
                        </label>
                        <input
                          value={btn.url || ''}
                          onChange={(e) => updateButton(idx, { url: e.target.value })}
                          placeholder="https://yourwebsite.com/demo"
                          className="form-input text-xs sm:text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-secondary-c">
                          Flow Identifier (optional)
                        </label>
                        <input
                          value={btn.payload || ''}
                          onChange={(e) => updateButton(idx, { payload: e.target.value })}
                          placeholder={btn.action.toLowerCase()}
                          className="form-input text-xs sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-secondary-c">
                    Action Type
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CTA_ACTION_TYPES.map((act) => {
                      const isSelected = btn.action === act.id;
                      return (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => {
                            const defaultPayload = act.id === 'LINK' ? undefined : act.id.toLowerCase();
                            updateButton(idx, { action: act.id, payload: defaultPayload });
                          }}
                          className={cx(
                            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-all btn-tactile',
                            isSelected
                              ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-2xs'
                              : 'border-base-c bg-subtle-c/50 text-secondary-c hover:border-base-c hover:bg-card-c'
                          )}
                          title={act.desc}
                        >
                          {renderIcon(act.icon, 'h-3.5 w-3.5 shrink-0')}
                          <span>{act.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addButton}
          disabled={webGreetingButtons.length >= 6}
          className="flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-primary-500/40 bg-primary-500/5 py-2.5 text-xs font-bold text-primary-600 hover:bg-primary-500/10 dark:text-primary-400 disabled:opacity-40 transition-colors btn-tactile"
        >
          <Plus className="h-4 w-4" /> Add Greeting CTA Button ({webGreetingButtons.length}/6)
        </button>
      </div>
    </div>
  );
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
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-primary-c">{sectionLabel}</h4>
        <p className="text-xs text-muted-c mt-0.5">{sectionHint}</p>
      </div>

      {buttons.length === 0 ? (
        <div className="p-5 text-center rounded-xl2 border border-dashed border-base-c bg-subtle-c/30">
          <p className="text-xs text-muted-c italic">No cards in this section. Add one below or leave empty to hide.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buttons.map((btn, idx) => (
            <div key={btn.id} className="rounded-xl2 border border-base-c bg-card-c p-4 sm:p-5 shadow-xs space-y-3.5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="neutral" className="text-[10px] font-mono px-2 py-0.5 shrink-0">
                    Card {idx + 1}
                  </Badge>
                  <span className="text-xs font-bold text-primary-c truncate">
                    {btn.title || 'Untitled Card'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-base-c text-secondary-c hover:text-primary-c hover:bg-subtle-c disabled:opacity-30 transition-colors btn-tactile"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === buttons.length - 1}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-base-c text-secondary-c hover:text-primary-c hover:bg-subtle-c disabled:opacity-30 transition-colors btn-tactile"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeButton(idx)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-danger-500 hover:bg-danger-500/10 transition-colors btn-tactile"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Card Title</label>
                  <input
                    value={btn.title}
                    onChange={e => updateButton(idx, { title: e.target.value })}
                    placeholder="e.g. Careers"
                    className="form-input text-xs sm:text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Subtitle (optional)</label>
                  <input
                    value={btn.subtitle}
                    onChange={e => updateButton(idx, { subtitle: e.target.value })}
                    placeholder="Brief description"
                    className="form-input text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-secondary-c">Action Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {ACTION_TYPES.map(act => {
                    const isSelected = btn.actionType === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => updateButton(idx, { actionType: act.id })}
                        className={cx(
                          'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-all btn-tactile',
                          isSelected
                            ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-2xs'
                            : 'border-base-c bg-subtle-c/50 text-secondary-c hover:border-base-c hover:bg-card-c'
                        )}
                      >
                        {renderIcon(act.icon, 'h-3.5 w-3.5 shrink-0')}
                        <span>{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {btn.actionType === 'FLOW' && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-secondary-c">Flow Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {FLOW_PAYLOADS.map(fp => {
                      const isSelected = (btn.flowPayload || 'lead') === fp.id;
                      return (
                        <button
                          key={fp.id}
                          type="button"
                          onClick={() => updateButton(idx, { flowPayload: fp.id })}
                          className={cx(
                            'rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all btn-tactile',
                            isSelected
                              ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400'
                              : 'border-base-c bg-subtle-c/50 text-secondary-c hover:border-base-c hover:bg-card-c'
                          )}
                        >
                          {fp.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {btn.actionType === 'LINK' && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Destination URL</label>
                  <input
                    value={btn.url || ''}
                    onChange={e => updateButton(idx, { url: e.target.value })}
                    placeholder="https://yourwebsite.com/careers"
                    className="form-input text-xs sm:text-sm"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-secondary-c">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_OPTIONS.map(ic => {
                    const isSelected = btn.icon === ic;
                    return (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => updateButton(idx, { icon: ic })}
                        className={cx(
                          'grid h-8 w-8 place-items-center rounded-lg border transition-all btn-tactile',
                          isSelected
                            ? 'border-primary-500 bg-primary-500/15 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500/20 shadow-2xs'
                            : 'border-base-c bg-subtle-c/50 text-secondary-c hover:border-base-c hover:bg-card-c hover:text-primary-c'
                        )}
                        title={ic}
                      >
                        {renderIcon(ic, 'h-4 w-4')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addButton}
        disabled={buttons.length >= 10}
        className="flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-primary-500/40 bg-primary-500/5 py-2.5 text-xs font-bold text-primary-600 hover:bg-primary-500/10 dark:text-primary-400 disabled:opacity-40 transition-colors btn-tactile"
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
  webWelcomeMessage,
  webReturningMessage,
  webGreetingButtons,
  primaryColor = '#4f46e5',
}: {
  menuSections: MenuSection[];
  businessId?: string;
  businessName?: string;
  webWelcomeMessage?: string;
  webReturningMessage?: string;
  webGreetingButtons?: WebGreetingButton[];
  primaryColor?: string;
}) {
  const [previewType, setPreviewType] = useState<'chat' | 'menu' | 'live'>('chat');
  const [simulatedVisitorType, setSimulatedVisitorType] = useState<'first' | 'returning'>('first');
  const [clickedNotice, setClickedNotice] = useState<string | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const embedWidgetUrl = businessId
    ? `${apiBaseUrl}/test.html?businessId=${encodeURIComponent(businessId)}&embed=true`
    : `${apiBaseUrl}/test.html?embed=true`;
  const fullPageUrl = businessId
    ? `${apiBaseUrl}/test.html?businessId=${encodeURIComponent(businessId)}`
    : `${apiBaseUrl}/test.html`;

  const handleCtaClick = (btn: WebGreetingButton) => {
    setClickedNotice(`Triggered: "${btn.label}" [${btn.action}]`);
    setTimeout(() => setClickedNotice(null), 2500);
  };

  const activeGreetingText = (
    simulatedVisitorType === 'returning'
      ? (webReturningMessage || '👋 Welcome back to {{business}}! How can we assist you today?')
      : (webWelcomeMessage || '👋 Hello! Welcome to {{business}}. How can we help you today?')
  ).replace(/\{\{business\}\}/g, businessName || 'our business');

  return (
    <div className="sticky top-6 flex flex-col">
      {/* Preview Tab Pills */}
      <div className="mb-3 flex rounded-xl border border-base-c bg-subtle-c/80 p-1 w-full text-xs">
        <button
          type="button"
          onClick={() => setPreviewType('chat')}
          className={cx(
            'flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 btn-tactile',
            previewType === 'chat'
              ? 'bg-card-c text-primary-c shadow-xs'
              : 'text-secondary-c hover:text-primary-c'
          )}
        >
          <MessageSquare className="h-3 w-3 text-primary-500" />
          <span>Chat Greeting</span>
        </button>
        <button
          type="button"
          onClick={() => setPreviewType('menu')}
          className={cx(
            'flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 btn-tactile',
            previewType === 'menu'
              ? 'bg-card-c text-primary-c shadow-xs'
              : 'text-secondary-c hover:text-primary-c'
          )}
        >
          <LayoutList className="h-3 w-3 text-primary-500" />
          <span>Menu Cards</span>
        </button>
        <button
          type="button"
          onClick={() => setPreviewType('live')}
          className={cx(
            'flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 btn-tactile',
            previewType === 'live'
              ? 'bg-card-c text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-secondary-c hover:text-primary-c'
          )}
        >
          <Globe className="h-3 w-3 text-emerald-500" />
          <span>Live Bot</span>
        </button>
      </div>

      {previewType === 'live' ? (
        <div className="relative w-full rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-[580px]">
          <div className="bg-[#075e54] px-3.5 py-2.5 flex items-center justify-between text-white text-xs">
            <div className="leading-tight">
              <span className="font-bold flex items-center gap-1.5 text-xs">
                <Globe className="h-3.5 w-3.5 text-emerald-300" /> Live Web Widget
              </span>
              <span className="text-[10px] text-emerald-200/80 font-mono">
                ID: {businessId ? `${businessId.substring(0, 12)}…` : 'Demo'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => window.open(fullPageUrl, '_blank')}
              className="text-[11px] bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 shrink-0"
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
      ) : previewType === 'chat' ? (
        <div className="w-full rounded-2xl border border-base-c bg-card-c shadow-xl overflow-hidden flex flex-col h-[580px]">
          {/* Widget Simulated Header */}
          <div className="bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm truncate leading-tight text-white">
                  {businessName || 'Your Business'}
                </p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online • AI Assistant
                </p>
              </div>
            </div>
            <X className="h-4 w-4 text-white/70 shrink-0" />
          </div>

          {/* Visitor Mode Switcher Bar */}
          <div className="px-3.5 py-2 bg-subtle-c/90 border-b border-base-c flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-c">
              Simulator:
            </span>
            <div className="flex rounded-lg border border-base-c bg-card-c p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setSimulatedVisitorType('first')}
                className={cx(
                  'px-2.5 py-1 rounded-md font-bold transition-all btn-tactile',
                  simulatedVisitorType === 'first'
                    ? 'bg-primary-500 text-white shadow-2xs'
                    : 'text-secondary-c hover:text-primary-c'
                )}
              >
                👋 New Visitor
              </button>
              <button
                type="button"
                onClick={() => setSimulatedVisitorType('returning')}
                className={cx(
                  'px-2.5 py-1 rounded-md font-bold transition-all btn-tactile',
                  simulatedVisitorType === 'returning'
                    ? 'bg-primary-500 text-white shadow-2xs'
                    : 'text-secondary-c hover:text-primary-c'
                )}
              >
                🔄 Returning
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-subtle-c/40 dark:bg-ink-950">
            {clickedNotice && (
              <div className="text-center animate-fade-in">
                <span className="inline-block rounded-full bg-slate-900 text-white text-[10px] font-bold px-3 py-1 shadow-md">
                  {clickedNotice}
                </span>
              </div>
            )}

            {/* Bot message bubble */}
            <div className="flex items-start gap-2.5">
              <div
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white text-[10px] font-bold shadow-xs mt-0.5"
                style={{ backgroundColor: primaryColor }}
              >
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 max-w-[88%] space-y-2">
                <div className="rounded-2xl rounded-tl-xs bg-card-c border border-base-c p-3.5 text-xs sm:text-[13px] text-primary-c shadow-xs leading-relaxed break-words whitespace-pre-wrap">
                  {activeGreetingText}
                </div>

                {/* Attached Greeting CTA Buttons */}
                {webGreetingButtons && webGreetingButtons.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold text-muted-c uppercase tracking-wider px-1">
                      Quick Action Options:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {webGreetingButtons.map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => handleCtaClick(btn)}
                          className="flex items-center justify-between gap-2 rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs font-semibold text-primary-c shadow-2xs hover:border-primary-400 hover:bg-primary-500/5 transition-all text-left group btn-tactile"
                        >
                          <span className="flex items-center gap-2 truncate">
                            {renderIcon(
                              btn.action === 'APPOINTMENT' ? 'calendar' :
                              btn.action === 'BOOKING' ? 'briefcase' :
                              btn.action === 'LEAD' ? 'doc' :
                              btn.action === 'SUPPORT' ? 'phone' :
                              btn.action === 'CATALOG' ? 'shopping-bag' : 'link',
                              'h-3.5 w-3.5 text-primary-500 shrink-0'
                            )}
                            <span className="truncate">{btn.label || 'Action'}</span>
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 uppercase tracking-wider shrink-0">
                            {btn.action}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Composer Mock */}
          <div className="p-3 border-t border-base-c bg-card-c flex items-center gap-2">
            <input
              type="text"
              readOnly
              placeholder="Ask me anything…"
              className="flex-1 rounded-lg border border-base-c bg-subtle-c/70 px-3 py-1.5 text-xs text-muted-c placeholder:text-muted-c focus:outline-none cursor-default"
            />
            <div
              className="grid h-7 w-7 place-items-center rounded-lg text-white shadow-xs opacity-80"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      ) : (
        /* Visual Menu Overlay Mockup */
        <div className="w-full rounded-2xl border border-base-c bg-card-c shadow-xl overflow-hidden flex flex-col h-[580px]">
          <div className="bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {(businessName || 'A').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm truncate text-white leading-tight">
                  {businessName || 'Your Business'}
                </p>
                <p className="text-[10px] text-slate-300">Select an option</p>
              </div>
            </div>
            <X className="h-4 w-4 text-white/70 shrink-0" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-subtle-c/40 dark:bg-ink-950">
            {menuSections.length === 0 ? (
              <p className="text-center text-xs text-muted-c py-12 italic">
                Add cards and save to preview your widget drawer menu.
              </p>
            ) : (
              menuSections.map(section => (
                <div key={section.title} className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c px-0.5">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(section.cards || []).map((card, idx) => (
                      <div
                        key={`${section.title}-${idx}`}
                        className="rounded-xl border border-base-c bg-card-c p-2.5 flex flex-col items-center text-center gap-1 min-h-[96px] justify-center transition-all hover:border-primary-400/50 shadow-2xs"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 shrink-0">
                          {renderIcon(card.icon || 'briefcase', 'h-4 w-4')}
                        </div>
                        <p className="text-[11px] font-bold text-primary-c line-clamp-2 leading-tight max-w-full px-0.5">
                          {card.title}
                        </p>
                        {card.subtitle && (
                          <p className="text-[10px] text-muted-c line-clamp-1 leading-snug max-w-full">
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

          <div className="px-3 py-2 border-t border-base-c bg-card-c text-[10px] text-muted-c text-center">
            Preview shows CONNECT from flows · SERVICES & RESOURCES live update
          </div>
        </div>
      )}
    </div>
  );
}

export function MenuBuilderPanel() {
  const [activeTab, setActiveTab] = useState<'greetings' | 'cards'>('greetings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#4f46e5');
  const [liveMenuSections, setLiveMenuSections] = useState<MenuSection[]>([]);

  // WebChat Greetings & Interactive CTA Buttons
  const [webWelcomeMessage, setWebWelcomeMessage] = useState<string>(
    '👋 Hello! Welcome to {{business}}. How can we help you today?'
  );
  const [webReturningMessage, setWebReturningMessage] = useState<string>(
    '👋 Welcome back to {{business}}! How can we assist you today?'
  );
  const [webGreetingButtons, setWebGreetingButtons] = useState<WebGreetingButton[]>([
    ...RECOMMENDED_GREETING_BUTTONS,
  ]);

  // Sidebar Menu Cards (SERVICES & RESOURCES)
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
      if (profRes.data?.primaryColor) setPrimaryColor(profRes.data.primaryColor);
      fetchLiveMenu(bizId);
    }

    if (profRes.data) {
      if (profRes.data.webWelcomeMessage) {
        setWebWelcomeMessage(profRes.data.webWelcomeMessage);
      }
      if (profRes.data.webReturningMessage) {
        setWebReturningMessage(profRes.data.webReturningMessage);
      }
      if (profRes.data.webGreetingButtonsJson) {
        try {
          const parsed = JSON.parse(profRes.data.webGreetingButtonsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWebGreetingButtons(parsed);
          }
        } catch (e) {
          console.warn('Failed to parse webGreetingButtonsJson', e);
        }
      }
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

    // Concurrently save both menu-builder cards and webchat greeting/CTA buttons
    const promises: Promise<any>[] = [
      updateCurrentUserProfile({
        webWelcomeMessage: webWelcomeMessage.trim(),
        webReturningMessage: webReturningMessage.trim(),
        webGreetingButtonsJson: JSON.stringify(webGreetingButtons),
      }),
    ];

    if (payload.length > 0) {
      promises.push(
        apiFetch('/api/v1/tenant/menu-builder', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      );
    }

    const [profRes, menuRes] = await Promise.all(promises);
    setSaving(false);

    const hasProfileError = profRes && profRes.error;
    const hasMenuError = menuRes && menuRes.error;

    if (!hasProfileError && !hasMenuError) {
      setMessage('WebChat greetings, CTA action buttons, and menu cards saved successfully!');
      if (businessId) fetchLiveMenu(businessId);
      setTimeout(() => setMessage(null), 3500);
    } else {
      const err = [hasProfileError ? profRes.error : null, hasMenuError ? menuRes.error : null]
        .filter(Boolean)
        .join('; ');
      setError(`Save failed: ${err}`);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Revert WebChat greetings, CTA buttons, and cards to default templates?')) return;
    setSaving(true);
    const res = await apiFetch('/api/v1/tenant/menu-builder', { method: 'DELETE' });
    setWebWelcomeMessage('👋 Hello! Welcome to {{business}}. How can we help you today?');
    setWebReturningMessage('👋 Welcome back to {{business}}! How can we assist you today?');
    setWebGreetingButtons([...RECOMMENDED_GREETING_BUTTONS]);

    await updateCurrentUserProfile({
      webWelcomeMessage: '👋 Hello! Welcome to {{business}}. How can we help you today?',
      webReturningMessage: '👋 Welcome back to {{business}}! How can we assist you today?',
      webGreetingButtonsJson: JSON.stringify(RECOMMENDED_GREETING_BUTTONS),
    });

    setSaving(false);
    if (!res.error) {
      setMessage('Reverted to default configuration.');
      await loadMenu();
      setTimeout(() => setMessage(null), 3000);
    } else {
      setError(`Reset failed: ${res.error}`);
    }
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-sm text-secondary-c font-medium">Loading Menu & Bot Builder…</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4 min-w-0">
        {message && (
          <div className="flex items-center gap-2 rounded-xl2 border border-success-500/20 bg-success-500/10 px-4 py-3 text-sm font-medium text-success-700 dark:text-success-400 animate-fade-in">
            <CheckCircle className="h-4 w-4 shrink-0" /> {message}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl2 border border-danger-500/20 bg-danger-500/10 px-4 py-3 text-sm font-medium text-danger-700 dark:text-danger-400 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <SectionCard>
          <PanelHeader
            title="Web Widget Menu & Bot Builder"
            desc="Configure your WebChat bot greetings, interactive CTA action buttons, and drawer menu cards."
            icon={<Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          />

          {/* Sub-Tab Switcher Pills */}
          <div className="mt-4 mb-6 flex items-center gap-1.5 rounded-xl border border-base-c bg-subtle-c/80 p-1 dark:bg-ink-850 overflow-x-auto scrollbar-none flex-nowrap max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('greetings')}
              className={cx(
                'flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all shrink-0 whitespace-nowrap btn-tactile',
                activeTab === 'greetings'
                  ? 'bg-card-c text-primary-c shadow-sm font-bold'
                  : 'text-secondary-c hover:text-primary-c'
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary-500" />
              <span>WebChat Greetings & CTAs</span>
              <Badge variant="primary" className="ml-1 text-[10px] px-1.5 py-0">
                {webGreetingButtons.length}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cards')}
              className={cx(
                'flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all shrink-0 whitespace-nowrap btn-tactile',
                activeTab === 'cards'
                  ? 'bg-card-c text-primary-c shadow-sm font-bold'
                  : 'text-secondary-c hover:text-primary-c'
              )}
            >
              <LayoutList className="h-3.5 w-3.5 text-primary-500" />
              <span>Sidebar Menu Cards</span>
              <Badge variant="neutral" className="ml-1 text-[10px] px-1.5 py-0">
                {servicesButtons.length + resourcesButtons.length}
              </Badge>
            </button>
          </div>

          {activeTab === 'greetings' ? (
            <WebChatGreetingsEditor
              webWelcomeMessage={webWelcomeMessage}
              setWebWelcomeMessage={setWebWelcomeMessage}
              webReturningMessage={webReturningMessage}
              setWebReturningMessage={setWebReturningMessage}
              webGreetingButtons={webGreetingButtons}
              setWebGreetingButtons={setWebGreetingButtons}
              businessName={businessName}
            />
          ) : (
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
          )}

          {/* Action Footer */}
          <div className="mt-8 pt-5 border-t border-base-c flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveMenu}
              disabled={saving}
              className="flex-1 min-w-[160px] flex items-center justify-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-soft hover:shadow-soft-lg transition-transform hover:scale-[1.01] disabled:opacity-50 btn-tactile"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{saving ? 'Saving Changes…' : 'Save All Changes'}</span>
            </button>
            <button
              type="button"
              onClick={resetToDefaults}
              disabled={saving}
              className="rounded-xl border border-base-c bg-card-c px-4 py-2.5 text-xs sm:text-sm font-semibold text-secondary-c hover:bg-subtle-c hover:text-primary-c transition-colors disabled:opacity-50 btn-tactile"
            >
              Reset Defaults
            </button>
          </div>
        </SectionCard>
      </div>

      {/* Right Column: Live Mockup & Preview */}
      <WebWidgetPreview
        menuSections={previewSections}
        businessId={businessId}
        businessName={businessName}
        webWelcomeMessage={webWelcomeMessage}
        webReturningMessage={webReturningMessage}
        webGreetingButtons={webGreetingButtons}
        primaryColor={primaryColor}
      />
    </div>
  );
}
