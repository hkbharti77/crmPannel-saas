import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/ui/primitives';
import {
  Paintbrush, Moon, Bell, Sun, Check, Upload, Smartphone, MessageSquare,
  Bot, Mail, Building2, Trash2, Eye, FileText,
  Palette, CheckCircle2, AlertCircle, Loader2, Monitor
} from 'lucide-react';
import { fetchSubscriptionStatus } from '@/lib/billingApi';
import { fetchCurrentUserProfile, updateCurrentUserProfile, uploadWidgetIcon, uploadCompanyLogo } from '@/lib/userApi';
import { PanelHeader, FieldRow, Toggle, SaveBar, SectionCard, PlanLockBanner } from './_shared';

/* ─── Unified Enterprise Brand & White-Labeling Suite ─── */
export function CustomBrandingPanel({ defaultTab = 'global' }: { defaultTab?: 'global' | 'widget' | 'email' | 'preview' } = {}) {
  const [activeTab, setActiveTab] = useState<'global' | 'widget' | 'email' | 'preview'>(defaultTab);
  const [botName, setBotName] = useState('GyanVani AI Assistant');
  const [businessName, setBusinessName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#1E293B');
  const [welcomeMsg, setWelcomeMsg] = useState('Hello! How can I help you today?');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [widgetIconUrl, setWidgetIconUrl] = useState<string>('');
  const [emailHeaderText, setEmailHeaderText] = useState('');
  const [emailFooterText, setEmailFooterText] = useState('');
  const [address, setAddress] = useState('');

  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingWidgetIcon, setUploadingWidgetIcon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSubscriptionStatus(),
      fetchCurrentUserProfile(),
    ]).then(([subRes, userRes]) => {
      setLoading(false);
      if (subRes.data) {
        if (!subRes.data.limits?.hasCustomWidget || subRes.data.planId === 'FREE') {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      }

      if (userRes.data) {
        const u = userRes.data;
        if (u.businessName) {
          setBusinessName(u.businessName);
          setBotName(u.businessName);
        }
        if (u.primaryColor) setPrimaryColor(u.primaryColor);
        if (u.secondaryColor) setSecondaryColor(u.secondaryColor);
        if (u.logoUrl) setLogoUrl(u.logoUrl);
        if (u.widgetIconUrl) setWidgetIconUrl(u.widgetIconUrl);
        if (u.emailHeaderText) setEmailHeaderText(u.emailHeaderText);
        if (u.emailFooterText) setEmailFooterText(u.emailFooterText);
        if (u.address) setAddress(u.address);
      }
    });
  }, []);

  const handleCompanyLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('❌ Company logo file size must not exceed 5MB.');
      return;
    }

    setUploadingLogo(true);
    const res = await uploadCompanyLogo(file);
    setUploadingLogo(false);

    if (res.error) {
      setErrorMsg(`❌ ${res.error}`);
    } else if (res.data) {
      console.log('✅ [Cloudinary Upload Success] Logo URL:', res.data.logoUrl);
      setLogoUrl(res.data.logoUrl);
      setSuccessMsg('✅ Master brand logo uploaded successfully! Click Save to apply across all channels.');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleWidgetIconSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
      setErrorMsg('❌ Only PNG image format (.png) is supported for the widget icon.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('❌ Widget icon file size must not exceed 2MB.');
      return;
    }

    setUploadingWidgetIcon(true);
    const res = await uploadWidgetIcon(file);
    setUploadingWidgetIcon(false);

    if (res.error) {
      setErrorMsg(`❌ ${res.error}`);
    } else if (res.data) {
      console.log('✅ [Cloudinary Upload Success] Widget Icon URL:', res.data.widgetIconUrl);
      setWidgetIconUrl(res.data.widgetIconUrl);
      setSuccessMsg('✅ Widget launcher icon uploaded successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateCurrentUserProfile({
      businessName: businessName.trim() || botName.trim(),
      primaryColor,
      secondaryColor,
      logoUrl: logoUrl.trim() || undefined,
      widgetIconUrl: widgetIconUrl.trim() || undefined,
      emailHeaderText: emailHeaderText.trim(),
      emailFooterText: emailFooterText.trim(),
    });

    setSaving(false);
    if (res.error) {
      setErrorMsg(`❌ Failed to save branding settings: ${res.error}`);
    } else {
      setSuccessMsg('✅ Brand & white-label settings updated across all channels (Webchat, Emails & Portal)!');
      setTimeout(() => setSuccessMsg(null), 4500);
    }
  };

  const PRESET_COLORS = ['#2563EB', '#0EA5E9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];

  const getFullImageUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getInitials = (str: string) => {
    const parts = (str || 'Business').trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (str || 'BZ').slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex items-center justify-center gap-2 py-16 text-muted-c">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
          <span className="text-sm font-medium">Loading Brand Identity & White-Label Suite…</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enterprise Suite Header */}
      <SectionCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-accent text-white shadow-sm">
                <Paintbrush className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-primary-c">Brand & White-Labeling</h2>
                  <Badge variant="gradient" className="text-[10px] tracking-wide uppercase font-semibold">Enterprise Suite</Badge>
                </div>
                <p className="text-xs text-muted-c">
                  Manage master brand logos, color themes, webchat widget, and outgoing email templates in one unified hub
                </p>
              </div>
            </div>
          </div>

          {/* Tab Switcher Pills */}
          <div className="flex items-center gap-1.5 rounded-xl border border-base-c bg-slate-100/80 p-1 dark:bg-ink-850 overflow-x-auto scrollbar-none flex-nowrap max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('global')}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 whitespace-nowrap btn-tactile',
                activeTab === 'global'
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-ink-700 dark:text-white'
                  : 'text-secondary-c hover:text-primary-c'
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Company Brand</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('widget')}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 whitespace-nowrap btn-tactile',
                activeTab === 'widget'
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-ink-700 dark:text-white'
                  : 'text-secondary-c hover:text-primary-c'
              )}
            >
              <Bot className="h-3.5 w-3.5" />
              <span>Chat Widget</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 whitespace-nowrap btn-tactile',
                activeTab === 'email'
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-ink-700 dark:text-white'
                  : 'text-secondary-c hover:text-primary-c'
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Outgoing Emails</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 whitespace-nowrap btn-tactile',
                activeTab === 'preview'
                  ? 'bg-white text-primary-700 shadow-sm dark:bg-ink-700 dark:text-white'
                  : 'text-secondary-c hover:text-primary-c'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Live Channels Preview</span>
            </button>
          </div>
        </div>

        {isLocked && (
          <div className="mt-4">
            <PlanLockBanner featureName="Custom Bot Branding & White-Labeling" requiredPlan="PRO" />
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl2 border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl2 border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </SectionCard>

      {/* ─── TAB 1: Company & Global Brand ─── */}
      {(activeTab === 'global' || activeTab === 'preview') && (
        <SectionCard>
          <PanelHeader
            title="Master Brand Identity"
            desc="Configure your primary organization assets. These automatically cascade to all customer channels."
            icon={<Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          />

          <div className="space-y-5">
            {/* Master Company Logo */}
            <div>
              <label className="mb-2 flex items-center justify-between text-xs font-semibold text-primary-c">
                <span className="flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-primary-500" /> Master Company Logo
                </span>
                <span className="text-[11px] font-normal text-muted-c">PNG, JPG, SVG, WebP (max 5MB)</span>
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl2 border border-base-c bg-slate-50/60 p-4 dark:bg-ink-850/40">
                {/* Logo Box */}
                <div className="grid h-16 w-32 shrink-0 place-items-center overflow-hidden rounded-xl border border-base-c bg-white p-2 shadow-sm dark:bg-ink-800">
                  {logoUrl ? (
                    <img
                      src={getFullImageUrl(logoUrl)}
                      alt="Company Logo"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center rounded-lg bg-gradient-accent text-white font-bold text-base shadow-inner">
                      {getInitials(businessName || botName)}
                    </div>
                  )}
                </div>

                {/* Upload & Controls */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary-500/30 bg-card-c px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/30 transition-all shrink-0">
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingLogo ? 'Uploading…' : 'Upload Master Logo'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                        onChange={handleCompanyLogoSelect}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <input
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="Or enter direct image URL (e.g. https://yourdomain.com/logo.png)"
                      className="form-input text-xs"
                    />
                    <p className="text-[10px] text-muted-c">
                      Used as the primary brand emblem for customer-facing portals, emails, and widget headers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business & Brand Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary-c">Organization / Business Name</label>
                <input
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (!botName || botName === businessName) setBotName(e.target.value);
                  }}
                  placeholder="Your Business Name"
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary-c">Business Physical Address (for Email Footer)</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 100 Innovation Way, Suite 400"
                  className="form-input text-xs"
                />
              </div>
            </div>

            {/* Primary & Accent Brand Colors */}
            <div className="grid gap-5 sm:grid-cols-2 pt-2 border-t border-base-c">
              <div>
                <label className="mb-2 flex items-center justify-between text-xs font-semibold text-primary-c">
                  <span className="flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-primary-500" /> Primary Brand Color
                  </span>
                  <span className="text-[11px] font-mono text-muted-c">{primaryColor}</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColor(c)}
                      className={cx(
                        'grid h-8 w-8 place-items-center rounded-lg ring-2 ring-offset-2 ring-offset-card-c transition-all',
                        primaryColor === c ? 'ring-primary-500 scale-105' : 'ring-transparent hover:ring-base-c'
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {primaryColor === c && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-lg border border-base-c bg-transparent p-0"
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-c">Applied to primary CTA buttons, email highlights & widget header.</p>
              </div>

              <div>
                <label className="mb-2 flex items-center justify-between text-xs font-semibold text-primary-c">
                  <span className="flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-secondary-500" /> Secondary Accent Color
                  </span>
                  <span className="text-[11px] font-mono text-muted-c">{secondaryColor}</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSecondaryColor(c)}
                      className={cx(
                        'grid h-8 w-8 place-items-center rounded-lg ring-2 ring-offset-2 ring-offset-card-c transition-all',
                        secondaryColor === c ? 'ring-secondary-500 scale-105' : 'ring-transparent hover:ring-base-c'
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {secondaryColor === c && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-lg border border-base-c bg-transparent p-0"
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-c">Applied to badges, borders, and sub-elements.</p>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ─── TAB 2: Chat Widget & Bot Branding ─── */}
      {(activeTab === 'widget' || activeTab === 'preview') && (
        <SectionCard>
          <PanelHeader
            title="Chat Widget & Bot Appearance"
            desc="Customize the floating chat launcher, bot profile, and conversation window on your website"
            icon={<Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          />

          <div className="space-y-5">
            {/* Widget Icons Row */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Widget Header Emblem */}
              <div className="flex items-center justify-between gap-3 rounded-xl2 border border-primary-500/20 bg-primary-500/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-primary-500/30 bg-card-c shadow-sm">
                    {logoUrl ? (
                      <img
                        src={getFullImageUrl(logoUrl)}
                        alt="Header Logo"
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-accent text-white font-bold text-sm">
                        {getInitials(botName)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary-c">Widget Header Emblem</p>
                    <p className="text-[11px] text-muted-c">Uses Master Company Logo</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('global')}
                  className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
                >
                  Change →
                </button>
              </div>

              {/* Dedicated PNG Floating Launcher Icon */}
              <div className="flex items-center justify-between gap-3 rounded-xl2 border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-emerald-500/30 bg-card-c shadow-sm">
                    {widgetIconUrl ? (
                      <img
                        src={getFullImageUrl(widgetIconUrl)}
                        alt="Launcher Icon"
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <Smartphone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-primary-c">Launcher Icon</p>
                      <Badge variant="success" className="text-[9px] py-0 px-1">PNG Only</Badge>
                    </div>
                    <p className="text-[11px] text-muted-c">Floating trigger button</p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-card-c px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30 transition-all shrink-0">
                  <Upload className="h-3 w-3" />
                  {uploadingWidgetIcon ? 'Uploading…' : 'Upload PNG'}
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleWidgetIconSelect}
                    className="hidden"
                    disabled={uploadingWidgetIcon}
                  />
                </label>
              </div>
            </div>

            {/* Bot Name & Welcome Greeting */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary-c">Bot / Assistant Display Name</label>
                <input
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g. GyanVaniAi Assistant"
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary-c">Initial Welcome Greeting</label>
                <textarea
                  value={welcomeMsg}
                  onChange={(e) => setWelcomeMsg(e.target.value)}
                  rows={2}
                  className="form-input text-xs resize-none"
                  placeholder="Hello! How can I assist you today?"
                />
              </div>
            </div>

            {/* Widget Live Simulator Preview */}
            <div className="rounded-2xl border border-base-c bg-slate-100/60 p-4 dark:bg-ink-900/60">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5 text-primary-500" />
                Live Chat Widget Simulator
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Opened Chat Screen */}
                <div className="md:col-span-2 rounded-2xl border border-base-c bg-white dark:bg-ink-800 p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-base-c pb-2">
                    <span className="text-xs font-bold text-secondary-c flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-primary-500" />
                      Opened Chat Window
                    </span>
                    <span className="text-[10px] text-muted-c">Real-time Header</span>
                  </div>

                  {/* Header Bar */}
                  <div
                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-white shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/40 bg-white/20 text-white font-bold text-xs shadow-sm">
                        {logoUrl ? (
                          <img src={getFullImageUrl(logoUrl)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span>{getInitials(botName)}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">{botName || 'AI Assistant'}</h4>
                        <span className="text-[9px] text-white/80 block">Online & ready to assist</span>
                      </div>
                    </div>
                    <div className="text-xs opacity-75">✕</div>
                  </div>

                  {/* Message Bubble */}
                  <div className="flex items-start gap-2 pt-1">
                    <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full text-white shadow-sm text-[10px] font-bold" style={{ backgroundColor: primaryColor }}>
                      {logoUrl ? (
                        <img src={getFullImageUrl(logoUrl)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        getInitials(botName)
                      )}
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-white shadow-sm max-w-[85%]" style={{ backgroundColor: primaryColor }}>
                      {welcomeMsg}
                    </div>
                  </div>
                </div>

                {/* Floating Launcher Button */}
                <div className="rounded-2xl border border-base-c bg-white dark:bg-ink-800 p-4 flex flex-col justify-between items-center text-center shadow-sm">
                  <div className="w-full flex items-center justify-between border-b border-base-c pb-2">
                    <span className="text-xs font-bold text-secondary-c flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
                      Floating Button
                    </span>
                    <span className="text-[10px] text-muted-c">Closed state</span>
                  </div>

                  <div className="my-auto py-3 flex flex-col items-center gap-2">
                    <div
                      className="grid h-14 w-14 place-items-center overflow-hidden rounded-full shadow-lg border-2 border-white dark:border-ink-800 transition-transform hover:scale-110"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {widgetIconUrl ? (
                        <img src={getFullImageUrl(widgetIconUrl)} alt="Launcher" className="h-full w-full object-cover" />
                      ) : (
                        <MessageSquare className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-primary-c">Website Bot Trigger</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ─── TAB 3: Outgoing Email Branding ─── */}
      {(activeTab === 'email' || activeTab === 'preview') && (
        <SectionCard>
          <PanelHeader
            title="Outgoing Email Branding"
            desc="Configure headers, CTA button styling, tagline, and legal footer for all customer-facing emails"
            icon={<Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          />

          <div className="space-y-5">
            {/* Email Header Tagline & Footer Notes */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-secondary-c">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary-500" /> Email Header Tagline (Optional)
                  </span>
                  <span className="text-[10px] text-muted-c">{emailHeaderText.length}/200</span>
                </label>
                <input
                  value={emailHeaderText}
                  onChange={(e) => setEmailHeaderText(e.target.value)}
                  placeholder="e.g. Your Trusted Real Estate & Property Partner"
                  className="form-input text-xs"
                  maxLength={200}
                />
                <p className="mt-1 text-[10px] text-muted-c">Appears directly below the header logo in all outgoing emails.</p>
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-secondary-c">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary-500" /> Email Footer Note & Disclaimer
                  </span>
                  <span className="text-[10px] text-muted-c">{emailFooterText.length}/500</span>
                </label>
                <textarea
                  value={emailFooterText}
                  onChange={(e) => setEmailFooterText(e.target.value)}
                  placeholder="e.g. Thank you for choosing us. For support, reply directly to this email."
                  rows={2}
                  className="form-input text-xs resize-none"
                  maxLength={500}
                />
                <p className="mt-1 text-[10px] text-muted-c">Appears in the email footer above the legal copyright notice.</p>
              </div>
            </div>

            {/* Email Simulator Live Preview */}
            <div className="rounded-2xl border border-base-c bg-slate-100/70 p-4 md:p-6 dark:bg-ink-900/60">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary-500" />
                Live Outgoing Email Template Preview
              </p>

              <div className="mx-auto max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-ink-700 dark:bg-ink-800">
                {/* Email Header */}
                <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5 text-center dark:border-ink-700/60 dark:bg-ink-850">
                  {logoUrl ? (
                    <img
                      src={getFullImageUrl(logoUrl)}
                      alt="Email Logo"
                      className="mx-auto max-h-12 max-w-[180px] object-contain"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-lg font-bold text-slate-800 dark:text-white">
                      {businessName || botName || 'Your Business Name'}
                    </span>
                  )}
                  {emailHeaderText && (
                    <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
                      {emailHeaderText}
                    </p>
                  )}
                </div>

                {/* Email Body */}
                <div className="px-6 py-6 space-y-3 text-xs leading-relaxed">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    Hi Alex,
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    This is an example notification demonstrating your company logo, primary CTA button styling, and footer note in outgoing transactional emails.
                  </p>

                  <div className="my-4 text-center">
                    <button
                      type="button"
                      className="inline-block rounded-lg px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Confirm Appointment Details →
                    </button>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400">
                    Warm regards,<br />
                    <strong>{businessName || botName || 'The Team'}</strong>
                  </p>
                </div>

                {/* Email Footer */}
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center dark:border-ink-700/60 dark:bg-ink-850/90">
                  {emailFooterText && (
                    <p className="mb-2 text-[11px] leading-normal text-slate-600 dark:text-slate-400">
                      {emailFooterText}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    © {new Date().getFullYear()} {businessName || 'Your Business'}. All rights reserved.
                  </p>
                  {address && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{address}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Save Bar */}
      <SectionCard>
        <SaveBar onSave={handleSave} saving={saving} />
      </SectionCard>
    </div>
  );
}

/* ─── Dark Mode ─── */
export function DarkModePanel() {
  const { theme, setTheme } = useTheme();

  return (
    <SectionCard>
      <PanelHeader title="Dark Mode" desc="Toggle between light and dark theme" icon={<Moon className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="grid gap-3 sm:grid-cols-2">
        <ThemeCard
          active={theme === 'light'}
          onClick={() => setTheme('light')}
          title="Light"
          desc="Bright background, ideal for daytime"
          icon={<Sun className="h-5 w-5" />}
          preview="bg-white border-slate-200"
          textPreview="text-slate-900"
        />
        <ThemeCard
          active={theme === 'dark'}
          onClick={() => setTheme('dark')}
          title="Dark"
          desc="Reduced glare, easier on the eyes at night"
          icon={<Moon className="h-5 w-5" />}
          preview="bg-ink-900 border-ink-700"
          textPreview="text-white"
        />
      </div>

      <div className="mt-4 rounded-xl2 bg-slate-50 p-4 text-xs text-secondary-c dark:bg-ink-850/60">
        <p className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-c" />
          Your theme preference is saved automatically and syncs across this device.
        </p>
      </div>
    </SectionCard>
  );
}

function ThemeCard({
  active, onClick, title, desc, icon, preview, textPreview,
}: {
  active: boolean; onClick: () => void; title: string; desc: string; icon: React.ReactNode; preview: string; textPreview: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-xl2 border-2 p-4 text-left transition-all',
        active ? 'border-primary-500/40 bg-primary-500/5' : 'border-base-c hover:border-primary-500/20',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary-c">{icon}</span>
          <span className="text-sm font-bold text-primary-c">{title}</span>
        </div>
        {active && <Badge variant="gradient">Active</Badge>}
      </div>
      <div className={cx('mt-3 rounded-lg border p-3', preview)}>
        <div className={cx('h-2 w-20 rounded-full', textPreview, 'opacity-80')} style={{ backgroundColor: 'currentColor' }} />
        <div className={cx('mt-1.5 h-2 w-32 rounded-full', textPreview, 'opacity-40')} style={{ backgroundColor: 'currentColor' }} />
      </div>
      <p className="mt-3 text-xs text-muted-c">{desc}</p>
    </button>
  );
}

/* ─── Notifications ─── */
export function NotificationsPanel() {
  const [prefs, setPrefs] = useState({
    newLead: true,
    newMessage: true,
    appointmentReminder: true,
    dealWon: true,
    dealLost: false,
    dailyDigest: true,
    weeklyReport: true,
    productUpdates: false,
    securityAlerts: true,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const GROUPS: { section: string; items: { key: keyof typeof prefs; label: string; desc: string }[] }[] = [
    {
      section: 'Lead & Deal Activity',
      items: [
        { key: 'newLead', label: 'New Lead Created', desc: 'When a new lead is added to the pipeline' },
        { key: 'newMessage', label: 'New Message Received', desc: 'When a customer sends a WhatsApp or email message' },
        { key: 'dealWon', label: 'Deal Won', desc: 'When a lead moves to the Won stage' },
        { key: 'dealLost', label: 'Deal Lost', desc: 'When a lead moves to the Lost stage' },
      ],
    },
    {
      section: 'Schedule',
      items: [
        { key: 'appointmentReminder', label: 'Appointment Reminders', desc: '15 minutes before scheduled appointments' },
      ],
    },
    {
      section: 'Reports & Digests',
      items: [
        { key: 'dailyDigest', label: 'Daily Digest', desc: 'A summary of activity each morning at 9 AM' },
        { key: 'weeklyReport', label: 'Weekly Performance Report', desc: 'Every Monday with last week\'s metrics' },
      ],
    },
    {
      section: 'System',
      items: [
        { key: 'productUpdates', label: 'Product Updates', desc: 'New features and improvements' },
        { key: 'securityAlerts', label: 'Security Alerts', desc: 'Suspicious activity on your account' },
      ],
    },
  ];

  return (
    <SectionCard>
      <PanelHeader title="Enable Notifications" desc="Choose what updates you want to receive" icon={<Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />} />

      <div className="space-y-5">
        {GROUPS.map((g) => (
          <div key={g.section}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-c">{g.section}</p>
            <div className="space-y-3">
              {g.items.map((item) => (
                <FieldRow key={item.key} label={item.label} desc={item.desc}>
                  <Toggle checked={prefs[item.key]} onChange={() => toggle(item.key)} />
                </FieldRow>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5"><SaveBar onSave={() => { }} /></div>
    </SectionCard>
  );
}
