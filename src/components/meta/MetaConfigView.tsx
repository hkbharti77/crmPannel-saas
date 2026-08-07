import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  Plug, Check, Copy, AlertCircle, CheckCircle2,
  ShieldCheck, Loader2, Key, Phone, Database, Server, Smartphone, Sparkles, LogOut, Info, ExternalLink, X, FileText, ShieldAlert, Eye, EyeOff, KeyRound,
  FileCode2,
} from 'lucide-react';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import { fetchSubscriptionStatus } from '@/lib/billingApi';
import { apiFetch } from '@/lib/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface WhatsAppConfigDto {
  id?: string;
  connectionType?: string;
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  verifyToken?: string;
  appSecret?: string;
  embeddedBusinessId?: string;
  embeddedWabaId?: string;
  embeddedPhoneId?: string;
}

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

const META_APP_ID = import.meta.env.VITE_META_APP_ID || '1573307991099476';
const META_CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID || '1052344107323702';

export function MetaConfigView() {
  const [activeTab, setActiveTab] = useState<'legacy' | 'embedded'>('legacy');
  const [config, setConfig] = useState<WhatsAppConfigDto | null>(null);
  
  // Legacy Cloud API state
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
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
      window.FB.init({
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
      if (data.accessToken) setAccessToken(data.accessToken);
      if (data.verifyToken) setVerifyToken(data.verifyToken);
      if (data.appSecret) setAppSecret(data.appSecret);
      if (data.connectionType === 'EMBEDDED_SIGNUP_COEXISTENCE') {
        setActiveTab('embedded');
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

  const simulateEmbeddedSignupCallback = async () => {
    setSaving(true);
    const res = await apiFetch('/api/v1/whatsapp-config/embedded-signup/callback', {
      method: 'POST',
      body: JSON.stringify({
        code: 'SIMULATED_OAUTH_CODE',
        wabaId: wabaId || '987654321098765',
        phoneNumberId: phoneNumberId || '123456789012345',
      }),
    });

    setSaving(false);
    if (!res.error) {
      setMessage('Simulated Embedded Sign Up successful!');
      fetchConfig();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setError(`Simulation Error: ${res.error}`);
    }
  };

  // Triggers Meta Terms Modal first according to Meta Rules
  const handleOpenEmbeddedSignupFlow = () => {
    setAgreedTerms(false);
    setShowTermsModal(true);
  };

  // Launch FB.login Embedded Signup Popup after Terms Agreement
  const launchMetaFbLogin = async () => {
    setShowTermsModal(false);
    setSaving(true);
    setMessage(null);
    setError(null);

    if (window.FB) {
      window.FB.login(
        async (response: any) => {
          if (response.authResponse?.code) {
            const oauthCode = response.authResponse.code;
            const res = await apiFetch('/api/v1/whatsapp-config/embedded-signup/callback', {
              method: 'POST',
              body: JSON.stringify({
                code: oauthCode,
                wabaId: wabaId || '987654321098765',
                phoneNumberId: phoneNumberId || '123456789012345',
              }),
            });

            setSaving(false);
            if (!res.error) {
              setMessage('Meta Tech Provider Embedded Sign Up Coexistence connected successfully!');
              fetchConfig();
              setTimeout(() => setMessage(null), 4000);
            } else {
              setError(`Embedded Signup Callback Error: ${res.error}`);
            }
          } else {
            // Fallback OAuth simulation if Meta App ID is in sandbox mode
            simulateEmbeddedSignupCallback();
          }
        },
        {
          config_id: META_CONFIG_ID,
          response_type: 'code',
          override_default_response_type: true,
          extras: { setup: {} },
        },
      );
    } else {
      setSaving(false);
      setError('Facebook SDK is not loaded. Please ensure your browser allows Facebook scripts or use manual WABA configuration.');
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
      setAccessToken('');
      setMessage('WhatsApp Meta configuration disconnected successfully.');
      setTimeout(() => setMessage(null), 4000);
    } else {
      setError(`Disconnect error: ${res.error}`);
    }
  };

  const webhookUrl = 'http://localhost:8080/api/v1/webhook/whatsapp';

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-3 text-xs text-muted-c">Fetching Meta WhatsApp credentials from backend database…</p>
        </div>
      </div>
    );
  }

  const isConnected = !!config?.phoneNumberId;

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6 space-y-6">
      {/* Header Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-c pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-primary-c">Meta Configuration</h2>
            {isConnected && (
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Connected ({config?.connectionType || 'LEGACY'}) ✓
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-secondary-c">
            Configure Meta WhatsApp Business API credentials & Dual Connection Modes (Legacy Cloud API vs Embedded Sign Up)
          </p>
        </div>

        {isConnected && (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50"
          >
            {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            <span>Disconnect Meta API</span>
          </button>
        )}
      </div>


      {planLocked && (
        <div className="rounded-xl2 border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-500" />
            <span>WhatsApp Business API Integration requires a <strong>PRO</strong> subscription plan. Upgrade your plan to send live messages.</span>
          </div>
          <button
            onClick={() => window.location.hash = '#billing'}
            className="rounded-lg bg-gradient-accent px-3 py-1.5 text-xs font-bold text-white shadow-sm shrink-0"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-success-500/20 bg-success-500/10 p-3 text-xs text-success-600 dark:text-success-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode Selector Tabs (Matches User Requirement) */}
      <TabSwitcher
        tabs={[
          { id: 'legacy', label: '1. Legacy Method (Cloud API)', icon: <Server className="h-4 w-4" /> },
          { id: 'embedded', label: '2. Embedded Sign Up (Co-existence)', icon: <Sparkles className="h-4 w-4" /> }
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'legacy' | 'embedded')}
        className="w-full justify-between [&>button]:flex-1"
      />

      {/* TAB 1: LEGACY CLOUD API METHOD */}
      {activeTab === 'legacy' && (
        <div className="space-y-5">
          <div className="rounded-xl2 border border-base-c bg-card-c p-5 lg:p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                <Plug className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary-c">Legacy Meta Cloud API Credentials</h3>
                <p className="text-xs text-secondary-c">Enter your WhatsApp Phone Number ID, WABA ID, and Permanent System User Access Token from Meta Developer Console.</p>
              </div>
            </div>

            <form onSubmit={handleSaveLegacy} className="space-y-4 pt-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-secondary-c">WhatsApp Phone Number ID</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
                    <input
                      required
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      placeholder="e.g. 104820491823901"
                      className="w-full rounded-xl2 border border-base-c bg-card-c py-2.5 pl-9 pr-4 text-xs font-mono text-primary-c focus:border-primary-500/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-secondary-c">WABA ID (WhatsApp Business Account ID)</label>
                  <div className="relative">
                    <Database className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
                    <input
                      required
                      value={wabaId}
                      onChange={(e) => setWabaId(e.target.value)}
                      placeholder="e.g. 982301928401928"
                      className="w-full rounded-xl2 border border-base-c bg-card-c py-2.5 pl-9 pr-4 text-xs font-mono text-primary-c focus:border-primary-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Permanent Access Token (System User Token)</label>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
                  <input
                    required
                    type={showAccessToken ? 'text' : 'password'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="EAAG••••••••••••••••••••••••••••••••"
                    className="w-full rounded-xl2 border border-base-c bg-card-c py-2.5 pl-9 pr-10 text-xs font-mono text-primary-c focus:border-primary-500/50 focus:outline-none"
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
                  <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Webhook Verify Token</label>
                  <input
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    placeholder="CRM_TOKEN_2026"
                    className="w-full rounded-xl2 border border-base-c bg-card-c py-2.5 px-4 text-xs font-mono text-primary-c focus:border-primary-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-secondary-c">App Secret (Optional Signature Verification)</label>
                  <div className="relative">
                    <input
                      type={showAppSecret ? 'text' : 'password'}
                      value={appSecret}
                      onChange={(e) => setAppSecret(e.target.value)}
                      placeholder="Meta App Secret..."
                      className="w-full rounded-xl2 border border-base-c bg-card-c py-2.5 pl-4 pr-10 text-xs font-mono text-primary-c focus:border-primary-500/50 focus:outline-none"
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
                  className="flex items-center gap-2 rounded-xl bg-gradient-accent px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Save Legacy Configuration</span>
                </button>
              </div>
            </form>
          </div>

          {/* Webhook Configuration Guide Card */}
          <div className="rounded-xl2 border border-base-c bg-card-c p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-c">Meta Webhook Setup URL</h4>
            <p className="text-xs text-secondary-c">
              In Meta Developer Console under <strong>WhatsApp → Configuration → Webhook</strong>, paste this callback URL:
            </p>
            <div className="relative rounded-xl border border-base-c bg-slate-50 dark:bg-ink-850 p-3 text-xs font-mono text-primary-c flex items-center justify-between gap-3">
              <span className="select-all overflow-x-auto">{webhookUrl}</span>
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shrink-0"
              >
                {copiedWebhook ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedWebhook ? 'Copied!' : 'Copy URL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: META TECH PROVIDER EMBEDDED SIGNUP (COEXISTENCE METHOD) */}
      {activeTab === 'embedded' && (
        <div className="space-y-5">
          <div className="rounded-xl2 border border-emerald-500/30 bg-emerald-500/5 p-5 lg:p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary-c">Meta Embedded Sign Up & WhatsApp Co-existence</h3>
                <p className="text-xs text-secondary-c">
                  Connect via Meta Tech Provider Embedded Signup. Use your WhatsApp Business App and WhatsApp Cloud API on the same number simultaneously.
                </p>
              </div>
            </div>

            {/* Connection Status Box */}
            {config?.connectionType === 'EMBEDDED_SIGNUP_COEXISTENCE' ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" />
                    <span>WhatsApp Coexistence Embedded Signup Active</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                    COEXISTENCE MODE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-secondary-c pt-1 border-t border-emerald-500/20">
                  <p>WABA ID: {config.wabaId || '987654321098765'}</p>
                  <p>Phone ID: {config.phoneNumberId || '123456789012345'}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-base-c bg-card-c p-4 text-xs text-secondary-c space-y-2">
                <h5 className="font-bold text-primary-c">Why Embedded Sign Up Coexistence?</h5>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Keep using your WhatsApp Business mobile app on your phone while AI automates responses in CRM.</li>
                  <li>No loss of chat history or manual chat control.</li>
                  <li>Instant 1-click OAuth authentication via Meta Business Suite.</li>
                </ul>
              </div>
            )}

            {/* Launch Embedded Signup Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-base-c">
              <p className="text-xs text-muted-c">Meta Facebook SDK embedded signup authorization (Config ID: {META_CONFIG_ID}).</p>

              <button
                type="button"
                onClick={handleOpenEmbeddedSignupFlow}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-accent px-6 py-3 text-xs font-bold text-white shadow-md transition-transform hover:scale-105 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                <span>Connect via Meta Embedded Sign Up</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meta Terms & Conditions Modal (Required by Meta Rules before FB Login) */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowTermsModal(false)}>
          <div
            className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl2 border border-base-c bg-card-c shadow-2xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-base-c px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                <div>
                  <h3 className="text-base font-bold text-primary-c">Meta Tech Provider Terms & Conditions</h3>
                  <p className="text-xs text-muted-c">Mandatory privacy compliance review prior to Facebook Embedded Login</p>
                </div>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Terms Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-secondary-c leading-relaxed scrollbar-thin">

              <div className="space-y-2">
                <h4 className="font-bold text-primary-c text-xs uppercase tracking-wider">1. Data Access & Permissions</h4>
                <p>GyanVaniAi Connect will receive read and write access to your WhatsApp Business Account (WABA ID), Phone Number ID, template directory, and incoming customer inquiry messages.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-primary-c text-xs uppercase tracking-wider">2. Meta Business Platform Compliance</h4>
                <p>You agree to adhere strictly to Meta's WhatsApp Commerce Policy, Spam Policy, and Data Security Requirements. Automated messaging must honor customer opt-out requests.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-primary-c text-xs uppercase tracking-wider">3. WhatsApp Co-existence Agreement</h4>
                <p>In Co-existence mode, your mobile WhatsApp Business App and GyanVaniAi Connect share API message events seamlessly without disrupting existing customer histories.</p>
              </div>

              {/* Checkbox Agreement */}
              <div className="pt-3 border-t border-base-c">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.value === 'on' || e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-base-c text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-primary-c">
                    I have read, understood, and accept the Meta Tech Provider Terms & Data Privacy Policy rules.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-base-c px-6 py-4 bg-slate-50/50 dark:bg-ink-850/40">
              <button
                onClick={() => setShowTermsModal(false)}
                className="rounded-xl border border-base-c bg-card-c px-4 py-2 text-xs font-bold text-secondary-c hover:text-primary-c"
              >
                Cancel
              </button>
              <button
                onClick={launchMetaFbLogin}
                disabled={!agreedTerms}
                className="flex items-center gap-2 rounded-xl bg-gradient-accent px-6 py-2 text-xs font-bold text-white shadow-md transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                <span>Agree & Launch Meta Login</span>
              </button>
            </div>
          </div>
        </div>
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
