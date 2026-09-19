import { useState, useEffect } from 'react';
import { cx } from '@/lib/types';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Save,
  ShieldCheck,
  Zap,
  Globe,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import {
  fetchPaymentConfigs,
  savePaymentConfig,
  regenerateWebhookKey,
  type TenantPaymentConfigDto,
  type PaymentIntegrationType,
} from '@/lib/paymentApi';

export function PaymentGatewaySettingsPanel() {
  const [configs, setConfigs] = useState<TenantPaymentConfigDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for Direct Gateways
  const [selectedGateway, setSelectedGateway] = useState<PaymentIntegrationType>('RAZORPAY_DIRECT');
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Form state for Meta Native
  const [metaConfigName, setMetaConfigName] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await fetchPaymentConfigs();
      setConfigs(data);

      const meta = data.find((c) => c.integrationType === 'META_WHATSAPP');
      if (meta && meta.metaPaymentConfigurationName) {
        setMetaConfigName(meta.metaPaymentConfigurationName);
      }

      const activeDirect = data.find((c) => c.integrationType === selectedGateway);
      if (activeDirect) {
        setKeyId(activeDirect.keyId || '');
        setKeySecret(activeDirect.keySecret || '');
        setWebhookSecret(activeDirect.webhookSecret || '');
        setIsActive(activeDirect.isActive !== false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load configs';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleGatewayTabChange = (type: PaymentIntegrationType) => {
    setSelectedGateway(type);
    const existing = configs.find((c) => c.integrationType === type);
    if (existing) {
      setKeyId(existing.keyId || '');
      setKeySecret(existing.keySecret || '');
      setWebhookSecret(existing.webhookSecret || '');
      setIsActive(existing.isActive !== false);
    } else {
      setKeyId('');
      setKeySecret('');
      setWebhookSecret('');
      setIsActive(true);
    }
  };

  const handleSaveDirectGateway = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const saved = await savePaymentConfig({
        integrationType: selectedGateway,
        keyId,
        keySecret,
        webhookSecret,
        isActive,
      });

      setMessage({ type: 'success', text: `${selectedGateway.replace('_DIRECT', '')} configuration saved successfully!` });
      await loadConfigs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save configuration';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMetaNative = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await savePaymentConfig({
        integrationType: 'META_WHATSAPP',
        metaPaymentConfigurationName: metaConfigName,
        isActive: true,
      });
      setMessage({ type: 'success', text: 'Meta Native WhatsApp Pay configuration saved!' });
      await loadConfigs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save Meta configuration';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const currentConfig = configs.find((c) => c.integrationType === selectedGateway);

  return (
    <div className="space-y-6">
      <PanelHeader
        title="WhatsApp Payments & Direct Gateways"
        desc="Configure in-chat native WhatsApp Pay (India UPI) and direct checkout fallback gateways (Razorpay, PayU, Stripe)."
        icon={<CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
      />

      {message && (
        <div
          className={cx(
            'flex items-center gap-2 p-3 rounded-lg text-sm border',
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          )}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Tier 1: Meta Native WhatsApp Pay (In-Chat UPI) ── */}
      <SectionCard title="1. Meta Native WhatsApp Pay (In-Chat UPI)">
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-medium text-emerald-900 dark:text-emerald-300 text-sm">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>In-Chat Native WhatsApp Checkout</span>
            </div>
            <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90 leading-relaxed">
              Enables customers in India to review itemized bills and pay directly within WhatsApp using Google Pay, PhonePe, Paytm, or BHIM UPI without opening a browser window.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveMetaNative();
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Meta Payment Configuration Name
              </label>
              <input
                type="text"
                value={metaConfigName}
                onChange={(e) => setMetaConfigName(e.target.value)}
                placeholder="e.g. razorpay_meta_config_1"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                The configuration name registered in your Meta Business Manager under WhatsApp Accounts &gt; Payment Configurations.
              </span>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 h-[38px]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Meta Pay Config
              </button>
            </div>
          </form>
        </div>
      </SectionCard>

      {/* ── Tier 2: Direct Payment Gateways ── */}
      <SectionCard title="2. Direct Payment Gateways (Fallback & Dynamic Links)">
        <div className="space-y-4">
          {/* Provider Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            {(['RAZORPAY_DIRECT', 'PAYU_DIRECT', 'STRIPE_DIRECT'] as PaymentIntegrationType[]).map((type) => {
              const label = type.replace('_DIRECT', '');
              const isSelected = selectedGateway === type;
              const hasConfig = configs.some((c) => c.integrationType === type && c.isActive);

              return (
                <button
                  key={type}
                  onClick={() => handleGatewayTabChange(type)}
                  className={cx(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition',
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {hasConfig && <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" title="Active" />}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveDirectGateway();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {selectedGateway === 'STRIPE_DIRECT' ? 'Publishable Key' : 'Key ID / Merchant Key'}
                </label>
                <input
                  type="text"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder={selectedGateway === 'RAZORPAY_DIRECT' ? 'rzp_live_...' : 'Merchant Key'}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {selectedGateway === 'STRIPE_DIRECT' ? 'Secret Key' : 'Key Secret / Merchant Salt'}
                </label>
                <input
                  type="password"
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Webhook Signing Secret
                </label>
                <input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Webhook HMAC Secret"
                  autoComplete="off"
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Enable Gateway
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Gateway Settings
              </button>
            </div>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}
