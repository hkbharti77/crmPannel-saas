import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plug, Check, Copy, AlertCircle, CheckCircle2,
  ShieldCheck, Loader2, Key, Phone, Database, Server, Smartphone, Sparkles, LogOut, Info, ExternalLink, X, FileText, Eye, EyeOff,
  RefreshCw, Zap, MessageSquare, Shield, ArrowUpRight, Building2, Clock
} from 'lucide-react';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import { fetchSubscriptionStatus } from '@/lib/billingApi';
import { apiFetch, getAuthToken } from '@/lib/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { cx } from '@/lib/types';

interface WhatsAppConfigDto {
  id?: string;
  connectionType?: string;
  connectionStatus?: string;
  webhookSubscriptionStatus?: string;
  webhookSubscriptionError?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  phoneNumberId?: string;
  wabaId?: string;
  businessId?: string;
  accessToken?: string;
  verifyToken?: string;
  appSecret?: string;
  embeddedBusinessId?: string;
  embeddedWabaId?: string;
  embeddedPhoneId?: string;
  botCooldownMinutes?: number;
  // Meta Priority 1 Webhook Fields
  accountStatus?: string;
  accountStatusReason?: string;
  qualityRating?: string;
  messagingLimitRaw?: string;
  messagingLimitValue?: number;
  restrictionJson?: Record<string, any>;
  capabilityJson?: Record<string, any>;
  violationJson?: Record<string, any>;
  banInfoJson?: Record<string, any>;
}

interface FacebookSdk {
  init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
  login: (callback: (response: Record<string, unknown>) => void, options?: Record<string, unknown>) => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

const META_APP_ID = import.meta.env.VITE_META_APP_ID || '1573307991099476';
const META_CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID || '1052344107323702';

export function MetaConfigView() {
  const [activeTab, setActiveTab] = useState<'embedded' | 'legacy'>('embedded');
  const [config, setConfig] = useState<WhatsAppConfigDto | null>(null);

  // Legacy Cloud API state
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('CRM_TOKEN_2026');
  const [appSecret, setAppSecret] = useState('');

  // Meta Terms Modal State
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [planLocked, setPlanLocked] = useState(false);

  // Show/hide toggles for sensitive fields
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);

  // WhatsApp Coexistence Bot Cooldown State
  const [botCooldownMinutes, setBotCooldownMinutes] = useState<number>(15);
  const [customCooldownMinutes, setCustomCooldownMinutes] = useState<string>('');
  const [isCustomCooldown, setIsCustomCooldown] = useState(false);
  const [savingCooldown, setSavingCooldown] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load subscription plan & whatsapp configuration in parallel
    Promise.all([
      fetchSubscriptionStatus(),
      fetchConfig(),
    ]).then(([subRes]) => {
      if (subRes.data) {
        const isPaidPlan = subRes.data.planId === 'PRO' || subRes.data.planId === 'ENTERPRISE';
        const hasFeature = subRes.data.limits?.hasWhatsapp !== false;
        if (isPaidPlan || hasFeature) {
          setPlanLocked(false);
        } else {
          setPlanLocked(true);
        }
      }
    });

    // Dynamically load Meta Facebook SDK
    loadFacebookSdk();
  }, []);

  const loadFacebookSdk = () => {
    if (window.FB) return;

    window.fbAsyncInit = function () {
      window.FB?.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v20.0',
      });
    };

    (function (d, s, id) {
      if (d.getElementById(id)) return;
      const fjs = d.getElementsByTagName(s)[0];
      const js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      fjs.parentNode?.insertBefore(js, fjs);
    })(document, 'script', 'facebook-jssdk');
  };

  const fetchConfig = async () => {
    setLoading(true);
    const res = await apiFetch<WhatsAppConfigDto>('/api/v1/whatsapp-config');
    setLoading(false);

    if (res.data) {
      const data = res.data;
      setConfig(data);
      if (data.phoneNumberId) setPhoneNumberId(data.phoneNumberId);
      if (data.wabaId) setWabaId(data.wabaId);
      if (data.businessId) setBusinessId(data.businessId);
      if (data.accessToken) setAccessToken(data.accessToken);
      if (data.verifyToken) setVerifyToken(data.verifyToken);
      if (data.appSecret) setAppSecret(data.appSecret);
      if (data.connectionType === 'LEGACY') {
        setActiveTab('legacy');
      } else {
        setActiveTab('embedded');
      }
      if (data.botCooldownMinutes) {
        setBotCooldownMinutes(data.botCooldownMinutes);
        if (![5, 10, 15, 30, 60].includes(data.botCooldownMinutes)) {
          setIsCustomCooldown(true);
          setCustomCooldownMinutes(String(data.botCooldownMinutes));
        }
      }
    }
  };

  const handleSaveLegacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await apiFetch('/api/v1/whatsapp-config', {
      method: 'POST',
      body: JSON.stringify({
        connectionType: 'LEGACY',
        phoneNumberId: phoneNumberId.trim(),
        wabaId: wabaId.trim(),
        businessId: businessId.trim(),
        accessToken: accessToken.trim(),
        verifyToken: verifyToken.trim(),
        appSecret: appSecret.trim(),
      }),
    });

    setSaving(false);
    if (!res.error) {
      setMessage('Legacy Meta Cloud API configuration saved successfully to backend database!');
      fetchConfig();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setError(`Failed to save: ${res.error}`);
    }
  };

  const handleUpdateCooldown = async (minutes: number) => {
    if (minutes < 1) return;
    setSavingCooldown(true);
    setCooldownMessage(null);
    setError(null);

    const res = await apiFetch<any>('/api/v1/whatsapp-config', {
      method: 'POST',
      body: JSON.stringify({
        botCooldownMinutes: minutes,
      }),
    });

    setSavingCooldown(false);
    if (!res.error) {
      setBotCooldownMinutes(minutes);
      if (config) setConfig({ ...config, botCooldownMinutes: minutes });
      setCooldownMessage(`AI Bot Cooldown updated to ${minutes} minutes successfully!`);
      setTimeout(() => setCooldownMessage(null), 4000);
    } else {
      setError(`Failed to update cooldown timer: ${res.error}`);
    }
  };

  // Triggers Meta Terms Modal first according to Meta Rules
  const handleOpenEmbeddedSignupFlow = () => {
    setAgreedTerms(false);
    setShowTermsModal(true);
  };

  // Launch Secure Backend Gateway Embedded Signup Popup after Terms Agreement
  const launchMetaFbLogin = async () => {
    setShowTermsModal(false);
    setSaving(true);
    setMessage(null);
    setError(null);

    const token = getAuthToken() || localStorage.getItem('crmlite_token') || localStorage.getItem('authToken') || '';

    try {
      const sessionRes = await apiFetch<{ launcherUrl?: string; appId?: string; configId?: string; sessionId?: string }>(
        '/api/v1/integrations/meta/gateway/session',
      );

      let targetUrl = '';
      if (sessionRes.data?.launcherUrl && sessionRes.data.launcherUrl.startsWith('http')) {
        targetUrl = sessionRes.data.launcherUrl;
      } else {
        const backendBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
        targetUrl = `${backendBase}/api/v1/integrations/meta/gateway/launch`;
      }

      const sessionIdParam = sessionRes.data?.sessionId ? `&sessionId=${encodeURIComponent(sessionRes.data.sessionId)}` : '';
      const fullLaunchUrl = `${targetUrl}?token=${encodeURIComponent(token)}&origin=${encodeURIComponent(window.location.origin)}${sessionIdParam}`;

      const width = 640;
      const height = 780;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        fullLaunchUrl,
        'MetaWhatsAppEmbeddedSignup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`,
      );

      const handleMessage = (event: MessageEvent) => {
        if (event.data && (event.data.type === 'META_WHATSAPP_CONNECTED' || event.data.type === 'META_GATEWAY_SUCCESS')) {
          window.removeEventListener('message', handleMessage);
          setSaving(false);
          setMessage('✓ Meta WhatsApp Embedded Sign Up (Coexistence) connected successfully!');
          fetchConfig();
          setTimeout(() => setMessage(null), 5000);
        } else if (event.data && event.data.type === 'META_GATEWAY_ERROR') {
          window.removeEventListener('message', handleMessage);
          setSaving(false);
          setError(`Embedded Signup Error: ${event.data.error || 'Connection failed'}`);
        }
      };

      window.addEventListener('message', handleMessage);

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setSaving(false);
        setError('Popup was blocked by your browser. Please allow popups for this site to complete Meta connection.');
      }
    } catch (err) {
      setSaving(false);
      setError(`Failed to initiate gateway session: ${(err as Error).message}`);
    }
  };

  const [retryingWebhook, setRetryingWebhook] = useState(false);

  const handleRetryWebhook = async () => {
    setRetryingWebhook(true);
    setError(null);
    setMessage(null);

    const res = await apiFetch<{ success: boolean; webhookSubscriptionStatus: string; webhookSubscriptionError?: string }>(
      '/api/v1/integrations/meta/gateway/retry-webhook',
      { method: 'POST' }
    );

    setRetryingWebhook(false);
    if (!res.error && res.data?.success) {
      setMessage('✓ Webhook subscription registered successfully with Meta!');
      fetchConfig();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setError(`Webhook subscription retry failed: ${res.data?.webhookSubscriptionError || res.error || 'Unknown error'}`);
      fetchConfig();
    }
  };

  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);

  const handleDisconnect = () => {
    setDisconnectModalOpen(true);
  };

  const confirmDisconnect = async () => {
    setDisconnectModalOpen(false);
    setDisconnecting(true);
    setError(null);

    const res = await apiFetch('/api/v1/whatsapp-config', {
      method: 'DELETE',
    });

    setDisconnecting(false);
    if (!res.error) {
      setConfig(null);
      setPhoneNumberId('');
      setWabaId('');
      setBusinessId('');
      setAccessToken('');
      setMessage('WhatsApp Meta configuration disconnected successfully.');
      setTimeout(() => setMessage(null), 4000);
    } else {
      setError(`Disconnect error: ${res.error}`);
    }
  };

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const webhookUrl = `${apiBaseUrl}/api/v1/webhook/whatsapp`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-3" />
          <p className="text-xs font-bold text-primary-c">Fetching Meta WhatsApp credentials from database…</p>
          <p className="text-[11px] text-muted-c mt-1">Verifying WABA session &amp; webhook subscriptions</p>
        </div>
      </div>
    );
  }

  const isConnected = !!config?.phoneNumberId;

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-6 lg:p-8 space-y-6">
      {/* ── TOP PAGE HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-c/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-soft">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-primary-c">
                  Meta WhatsApp API Gateway
                </h1>
                {isConnected ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Connected ({config?.connectionType === 'EMBEDDED_SIGNUP_COEXISTENCE' ? 'Embedded Coexistence' : 'Legacy Cloud API'})
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Not Connected
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-c">
                Configure Meta WhatsApp Business API credentials &amp; Dual Connection Modes (Embedded Sign Up Coexistence vs Legacy Cloud API).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchConfig}
            className="flex items-center gap-1.5 rounded-xl border border-base-c/80 bg-card-c px-3.5 py-2 text-xs font-semibold text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-all shadow-xs"
          >
            <RefreshCw className={cx('h-3.5 w-3.5 text-muted-c', loading && 'animate-spin')} />
            Sync Session
          </button>

          {isConnected && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-all shadow-xs"
            >
              {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              <span>Disconnect Gateway</span>
            </button>
          )}
        </div>
      </div>

      {/* ── META API KPI STATS HEADER CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Connection Mode */}
        <div className="relative overflow-hidden rounded-2xl border border-base-c/80 bg-card-c p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
            <span>Connection Mode</span>
            <div className={cx(
              "grid h-8 w-8 place-items-center rounded-xl",
              isConnected ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}>
              <Plug className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-black text-primary-c truncate max-w-[170px]">
              {isConnected ? (config?.connectionType === 'EMBEDDED_SIGNUP_COEXISTENCE' ? 'Embedded Coexistence' : 'Legacy Cloud API') : 'Disconnected'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-c">
            {isConnected ? 'Active Meta WhatsApp Integration' : 'Connect Meta API to start messaging'}
          </p>
        </div>

        {/* Card 2: Webhook Sync Status */}
        <div className="relative overflow-hidden rounded-2xl border border-base-c/80 bg-card-c p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
            <span>Webhook Delivery</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-black text-primary-c truncate">
              {config?.webhookSubscriptionStatus === 'ACTIVE' ? 'Subscribed (200 OK)' : (isConnected ? 'Pending Sync' : 'Inactive')}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-c">Real-time incoming WhatsApp events</p>
        </div>

        {/* Card 3: Business Portfolio ID */}
        <div className="relative overflow-hidden rounded-2xl border border-base-c/80 bg-card-c p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
            <span>Business Portfolio ID</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-black font-mono text-primary-c truncate max-w-[180px]">
              {config?.businessId || 'Not Configured'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-c">
            {config?.businessId ? (
              <a
                href={`https://business.facebook.com/settings/info?business_id=${config.businessId}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
              >
                Meta Portfolio ↗
              </a>
            ) : (
              'Meta Business Portfolio'
            )}
          </p>
        </div>

        {/* Card 4: WABA Account ID */}
        <div className="relative overflow-hidden rounded-2xl border border-base-c/80 bg-card-c p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
            <span>WABA Account ID</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-black font-mono text-primary-c truncate max-w-[180px]">
              {config?.wabaId || 'Not Configured'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-c">WhatsApp Business Account ID</p>
        </div>

        {/* Card 5: WhatsApp Phone ID */}
        <div className="relative overflow-hidden rounded-2xl border border-base-c/80 bg-card-c p-4 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between text-muted-c text-xs font-semibold">
            <span>Phone Number ID</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Phone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-black font-mono text-primary-c truncate max-w-[180px]">
              {config?.displayPhoneNumber || config?.phoneNumberId || 'Not Configured'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-c">Verified Meta Phone Sender</p>
        </div>
      </div>

      {/* ── META ACCOUNT HEALTH, QUALITY & LIMITS CARD ── */}
      {isConnected && (
        <div className="rounded-2xl border border-base-c/80 bg-card-c p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-c/50 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-primary-c">Meta Account Health &amp; Operational Limits</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={cx(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase",
                config?.accountStatus === 'ACTIVE' || !config?.accountStatus ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" :
                config?.accountStatus?.includes('RESTRICT') || config?.accountStatus?.includes('WARN') ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30" :
                "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              )}>
                <span className={cx("h-1.5 w-1.5 rounded-full",
                  config?.accountStatus === 'ACTIVE' || !config?.accountStatus ? "bg-emerald-500" :
                  config?.accountStatus?.includes('RESTRICT') ? "bg-amber-500" : "bg-rose-500"
                )} />
                {config?.accountStatus || 'ACTIVE'}
              </span>
              <span className={cx(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase",
                config?.qualityRating === 'GREEN' || !config?.qualityRating || config?.qualityRating === 'UNKNOWN' ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" :
                config?.qualityRating === 'YELLOW' ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30" :
                config?.qualityRating === 'RED' ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30" :
                "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30"
              )}>
                Quality: {config?.qualityRating || 'GREEN'}
              </span>
            </div>
          </div>

          {/* Active Restrictions Banner if any */}
          {((config?.restrictionJson && Object.keys(config.restrictionJson).length > 0) ||
            (config?.accountStatus && ['RESTRICTED', 'DISABLED', 'BANNED', 'SUSPENDED'].includes(config.accountStatus))) && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-800 dark:text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                <span>Meta Policy Restriction Active: {config?.accountStatusReason || config?.accountStatus}</span>
              </div>
              {config?.restrictionJson && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-rose-500/20">
                  {Object.entries(config.restrictionJson).map(([key, val]: [string, any]) => (
                    <div key={key} className="bg-white/60 dark:bg-ink-900/60 p-2 rounded-lg text-[11px]">
                      <span className="font-semibold text-rose-700 dark:text-rose-400 capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                      <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Limits & Capabilities Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-ink-900/50 border border-base-c/60">
              <span className="text-muted-c block text-[11px]">Tier Messaging Limit</span>
              <span className="font-bold text-primary-c text-sm mt-0.5 block">{config?.messagingLimitRaw || 'TIER_1K (Standard)'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-ink-900/50 border border-base-c/60">
              <span className="text-muted-c block text-[11px]">Outbound Campaigns</span>
              <span className={cx("font-bold text-sm mt-0.5 block",
                config?.accountStatus === 'ACTIVE' && config?.qualityRating !== 'RED' ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              )}>
                {config?.accountStatus === 'ACTIVE' && config?.qualityRating !== 'RED' ? 'Permitted' : 'Limited / Paused'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-ink-900/50 border border-base-c/60">
              <span className="text-muted-c block text-[11px]">Customer Care Replies</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">24h Window Active</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-ink-900/50 border border-base-c/60">
              <span className="text-muted-c block text-[11px]">Security Two-Factor</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5 block">PIN Protected (2FA)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTION WARNING BANNER ── */}
      {planLocked && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Info className="h-5 w-5 shrink-0 text-amber-500" />
            <span>WhatsApp Business API Integration requires a <strong>PRO</strong> subscription plan. Upgrade your plan to send live messages.</span>
          </div>
          <button
            onClick={() => window.location.hash = '#billing'}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-soft hover:brightness-110 shrink-0 transition-all"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {message && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-xs animate-fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-semibold text-rose-700 dark:text-rose-400 shadow-xs animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── MODE SELECTOR TABS ── */}
      <TabSwitcher
        tabs={[
          { id: 'embedded', label: '1. Embedded Sign Up (Co-existence Mode)', icon: <Sparkles className="h-4 w-4 text-emerald-500" /> },
          { id: 'legacy', label: '2. Legacy Method (Cloud API Credentials)', icon: <Server className="h-4 w-4" /> }
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'embedded' | 'legacy')}
        className="w-full justify-between [&>button]:flex-1 bg-slate-100/80 dark:bg-ink-900/60 p-1 rounded-xl"
      />

      {/* ── TAB 1: META TECH PROVIDER EMBEDDED SIGNUP (COEXISTENCE METHOD) ── */}
      {activeTab === 'embedded' && (
        <div className="space-y-5 animate-fade-in">
          <div className="rounded-2xl border border-emerald-500/30 bg-card-c p-6 space-y-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-soft">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-c">Meta Embedded Sign Up &amp; WhatsApp Coexistence</h3>
                <p className="text-xs text-muted-c">
                  Connect via Meta Tech Provider Embedded Signup. Use your WhatsApp Business App on phone and WhatsApp Cloud API on CRM simultaneously.
                </p>
              </div>
            </div>

            {/* Connection Status Box */}
            {config?.connectionType === 'EMBEDDED_SIGNUP_COEXISTENCE' ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <ShieldCheck className="h-5 w-5" />
                    <span>WhatsApp Coexistence Embedded Signup Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
                      COEXISTENCE MODE
                    </span>
                    {config.webhookSubscriptionStatus === 'ACTIVE' ? (
                      <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Webhook Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> Webhook {config.webhookSubscriptionStatus || 'PENDING'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-primary-c pt-3 border-t border-emerald-500/20">
                  <div className="rounded-xl bg-card-c/60 p-3 border border-emerald-500/20">
                    <span className="text-[10px] text-muted-c uppercase font-sans font-bold block mb-0.5">Business Portfolio ID</span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{config.businessId || 'Not Configured'}</span>
                      {config.businessId && (
                        <a
                          href={`https://business.facebook.com/settings/info?business_id=${config.businessId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-sans font-medium inline-flex items-center gap-0.5"
                        >
                          Meta ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl bg-card-c/60 p-3 border border-emerald-500/20">
                    <span className="text-[10px] text-muted-c uppercase font-sans font-bold block mb-0.5">WABA ID</span>
                    <span className="font-bold">{config.wabaId || '987654321098765'}</span>
                  </div>
                  <div className="rounded-xl bg-card-c/60 p-3 border border-emerald-500/20">
                    <span className="text-[10px] text-muted-c uppercase font-sans font-bold block mb-0.5">Phone Number ID</span>
                    <span className="font-bold">{config.phoneNumberId || '123456789012345'}</span>
                  </div>
                  {config.verifiedName && (
                    <div className="col-span-1 sm:col-span-3 rounded-xl bg-card-c/60 p-3 border border-emerald-500/20 flex items-center justify-between">
                      <span className="text-[10px] text-muted-c uppercase font-sans font-bold">Verified Meta Name</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{config.verifiedName}</span>
                    </div>
                  )}
                </div>

                {config.webhookSubscriptionStatus === 'FAILED' && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-700 dark:text-amber-300">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>Webhook subscription failed: {config.webhookSubscriptionError || 'Could not subscribe to Meta webhooks'}.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetryWebhook}
                      disabled={retryingWebhook}
                      className="rounded-xl bg-amber-600 text-white font-bold px-3.5 py-1.5 text-xs hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-xs"
                    >
                      {retryingWebhook && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Retry Webhook Subscription</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-base-c/80 bg-card-c/60 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile App Coexistence</span>
                  </div>
                  <p className="text-[11px] text-muted-c leading-relaxed">
                    Keep using your mobile WhatsApp Business App on your phone while CRM AI auto-replies simultaneously.
                  </p>
                </div>

                <div className="rounded-2xl border border-base-c/80 bg-card-c/60 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <Shield className="h-4 w-4" />
                    <span>Zero History Loss</span>
                  </div>
                  <p className="text-[11px] text-muted-c leading-relaxed">
                    All existing chat history, media, and customer contacts remain 100% intact without needing formatting.
                  </p>
                </div>

                <div className="rounded-2xl border border-base-c/80 bg-card-c/60 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                    <Sparkles className="h-4 w-4" />
                    <span>1-Click OAuth Connect</span>
                  </div>
                  <p className="text-[11px] text-muted-c leading-relaxed">
                    Authenticate directly through Meta Business Suite popup in under 60 seconds with zero API keys.
                  </p>
                </div>
              </div>
            )}

            {/* Launch Embedded Signup Action Button */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-base-c/80">
              <p className="text-xs text-muted-c">Meta Facebook SDK embedded signup authorization (Config ID: {META_CONFIG_ID}).</p>

              <button
                type="button"
                onClick={handleOpenEmbeddedSignupFlow}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-3 text-xs font-bold text-white shadow-soft transition-all transform hover:scale-[1.02] disabled:opacity-50 shrink-0"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                <span>Connect via Meta Embedded Sign Up</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LEGACY CLOUD API METHOD ── */}
      {activeTab === 'legacy' && (
        <div className="space-y-5 animate-fade-in">
          <div className="rounded-2xl border border-base-c/80 bg-card-c p-6 space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-soft">
                <Plug className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-c">Legacy Meta Cloud API Credentials</h3>
                <p className="text-xs text-muted-c">Enter your WhatsApp Phone Number ID, WABA ID, and Permanent System User Access Token from Meta Developer Console.</p>
              </div>
            </div>

            <form onSubmit={handleSaveLegacy} className="space-y-4 pt-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary-c">WhatsApp Phone Number ID</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
                    <input
                      required
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      placeholder="e.g. 104820491823901"
                      className="w-full rounded-xl border border-base-c bg-card-c py-2.5 pl-9 pr-4 text-xs font-mono text-primary-c focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary-c">Business Manager ID</label>
                  <div className="relative">
                    <Database className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
                    <input
                      required
                      value={businessId}
                      onChange={(e) => setBusinessId(e.target.value)}
                      placeholder="e.g. 1412570260808930"
                      className="w-full rounded-xl border border-base-c bg-card-c py-2.5 pl-9 pr-4 text-xs font-mono text-primary-c focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary-c">WABA ID (WhatsApp Business Account ID)</label>
                  <div className="relative">
                    <Database className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
                    <input
                      required
                      value={wabaId}
                      onChange={(e) => setWabaId(e.target.value)}
                      placeholder="e.g. 982301928401928"
                      className="w-full rounded-xl border border-base-c bg-card-c py-2.5 pl-9 pr-4 text-xs font-mono text-primary-c focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary-c">Permanent Access Token (System User Token)</label>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
                  <input
                    required
                    type={showAccessToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="EAAG••••••••••••••••••••••••••••••••"
                    className="w-full rounded-xl border border-base-c bg-card-c py-2.5 pl-9 pr-10 text-xs font-mono text-primary-c focus:border-emerald-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessToken((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-c hover:text-primary-c transition-colors"
                    tabIndex={-1}
                    aria-label={showAccessToken ? 'Hide access token' : 'Show access token'}
                  >
                    {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary-c">Webhook Verify Token</label>
                  <input
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    placeholder="CRM_TOKEN_2026"
                    className="w-full rounded-xl border border-base-c bg-card-c py-2.5 px-4 text-xs font-mono text-primary-c focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary-c">App Secret (Optional Signature Verification)</label>
                  <div className="relative">
                    <input
                      type={showAppSecret ? 'text' : 'password'}
                      value={appSecret}
                      onChange={(e) => setAppSecret(e.target.value)}
                      placeholder="Meta App Secret..."
                      className="w-full rounded-xl border border-base-c bg-card-c py-2.5 pl-4 pr-10 text-xs font-mono text-primary-c focus:border-emerald-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAppSecret((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-c hover:text-primary-c transition-colors"
                      tabIndex={-1}
                      aria-label={showAppSecret ? 'Hide app secret' : 'Show app secret'}
                    >
                      {showAppSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-soft transition-all hover:scale-105 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Legacy Configuration</span>
                </button>
              </div>
            </form>
          </div>

          {/* Webhook Configuration Guide Card */}
          <div className="rounded-2xl border border-base-c/80 bg-card-c p-6 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-c">Meta Webhook Callback URL</h4>
            <p className="text-xs text-muted-c">
              In Meta Developer Console under <strong>WhatsApp → Configuration → Webhook</strong>, paste this callback URL:
            </p>
            <div className="relative rounded-xl border border-base-c bg-slate-100/70 dark:bg-ink-850 p-3 text-xs font-mono text-primary-c flex items-center justify-between gap-3">
              <span className="select-all overflow-x-auto truncate">{webhookUrl}</span>
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shrink-0 transition-all"
              >
                {copiedWebhook ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedWebhook ? 'Copied!' : 'Copy Callback URL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COEXISTENCE & HUMAN AGENT BOT COOLDOWN TIMER CARD ── */}
      <div className="rounded-2xl border border-base-c/80 bg-card-c p-6 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-soft">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-primary-c">WhatsApp Coexistence AI Bot Cooldown Timer</h3>
                <span className="text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  Admin Control
                </span>
              </div>
              <p className="text-xs text-muted-c mt-0.5">
                Automatically pauses automated AI replies when an agent or business owner replies from the WhatsApp mobile app or CRM Live Chat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-c font-medium">Current Timer:</span>
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
              {botCooldownMinutes} Minutes
            </span>
          </div>
        </div>

        {cooldownMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{cooldownMessage}</span>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 dark:bg-ink-850/60 border border-base-c/60 p-4 space-y-3">
          <p className="text-xs text-secondary-c leading-relaxed">
            <strong>How it works:</strong> When you or your team send a message to a customer directly from the physical WhatsApp Business app on your phone, Meta sends a message echo. The CRM detects human intervention and immediately puts the AI Bot on cooldown for this customer so the bot will not talk over the human agent. When the timer expires, automated AI workflows resume automatically.
          </p>

          <div className="pt-2">
            <label className="block text-xs font-bold text-primary-c uppercase tracking-wider mb-2">
              Select Bot Pause Duration:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[5, 10, 15, 30, 60].map((mins) => {
                const active = botCooldownMinutes === mins && !isCustomCooldown;
                return (
                  <button
                    key={mins}
                    type="button"
                    disabled={savingCooldown}
                    onClick={() => {
                      setIsCustomCooldown(false);
                      handleUpdateCooldown(mins);
                    }}
                    className={cx(
                      'rounded-xl px-4 py-2 text-xs font-bold transition-all border shadow-xs',
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/20'
                        : 'bg-card-c text-primary-c border-base-c hover:border-emerald-500/50 hover:bg-emerald-500/5'
                    )}
                  >
                    {mins} Min {mins === 15 ? '(Default)' : ''}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={savingCooldown}
                onClick={() => {
                  setIsCustomCooldown(true);
                  if (!customCooldownMinutes) setCustomCooldownMinutes(String(botCooldownMinutes));
                }}
                className={cx(
                  'rounded-xl px-4 py-2 text-xs font-bold transition-all border shadow-xs',
                  isCustomCooldown
                    ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/20'
                    : 'bg-card-c text-primary-c border-base-c hover:border-emerald-500/50 hover:bg-emerald-500/5'
                )}
              >
                Custom
              </button>
            </div>

            {isCustomCooldown && (
              <div className="mt-3 flex items-center gap-2 animate-fade-in max-w-sm">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customCooldownMinutes}
                  onChange={(e) => setCustomCooldownMinutes(e.target.value)}
                  placeholder="Minutes (e.g. 20, 45, 120)"
                  className="w-full rounded-xl border border-base-c bg-card-c px-3 py-2 text-xs font-mono text-primary-c focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={savingCooldown || !customCooldownMinutes || parseInt(customCooldownMinutes, 10) < 1}
                  onClick={() => handleUpdateCooldown(parseInt(customCooldownMinutes, 10))}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-soft disabled:opacity-50 shrink-0"
                >
                  {savingCooldown ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meta Terms & Conditions Modal */}
      {showTermsModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowTermsModal(false)}>
          <div
            className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-base-c/80 bg-card-c shadow-2xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-base-c/80 px-6 py-4 bg-card-c/90">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary-c">Meta Tech Provider Terms &amp; Conditions</h3>
                  <p className="text-xs text-muted-c">Mandatory privacy compliance review prior to Facebook Embedded Login</p>
                </div>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Terms Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-primary-c/80 leading-relaxed scrollbar-thin">
              <div className="space-y-1.5">
                <h4 className="font-bold text-primary-c text-xs uppercase tracking-wider">1. Data Access &amp; Permissions</h4>
                <p className="text-muted-c">GyanVaniAi Connect will receive read and write access to your WhatsApp Business Account (WABA ID), Phone Number ID, template directory, and incoming customer inquiry messages.</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-primary-c text-xs uppercase tracking-wider">2. Meta Business Platform Compliance</h4>
                <p className="text-muted-c">You agree to adhere strictly to Meta's WhatsApp Commerce Policy, Spam Policy, and Data Security Requirements. Automated messaging must honor customer opt-out requests.</p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-primary-c text-xs uppercase tracking-wider">3. WhatsApp Coexistence Agreement</h4>
                <p className="text-muted-c">In Coexistence mode, your mobile WhatsApp Business App and GyanVaniAi Connect share API message events seamlessly without disrupting existing customer histories.</p>
              </div>

              {/* Checkbox Agreement */}
              <div className="pt-4 border-t border-base-c/80">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.value === 'on' || e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-base-c text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-primary-c">
                    I have read, understood, and accept the Meta Tech Provider Terms &amp; Data Privacy Policy rules.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-base-c/80 px-6 py-4 bg-slate-50/50 dark:bg-ink-900/40">
              <button
                onClick={() => setShowTermsModal(false)}
                className="rounded-xl border border-base-c bg-card-c px-4 py-2 text-xs font-bold text-muted-c hover:text-primary-c"
              >
                Cancel
              </button>
              <button
                onClick={launchMetaFbLogin}
                disabled={!agreedTerms}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-soft transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                <span>Agree &amp; Launch Meta Login</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        isOpen={disconnectModalOpen}
        title="Disconnect Meta WhatsApp API"
        message="Are you sure you want to disconnect your Meta WhatsApp configuration? Automated WhatsApp AI auto-reply services will be stopped."
        confirmText="Disconnect Meta API"
        variant="danger"
        onConfirm={confirmDisconnect}
        onCancel={() => setDisconnectModalOpen(false)}
      />
    </div>
  );
}

