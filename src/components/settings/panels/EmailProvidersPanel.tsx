import React, { useState, useEffect } from 'react';
import {
  Mail, Plus, Trash2, Edit2, Shield, CheckCircle2, AlertTriangle,
  Key, Server, Globe, ExternalLink, Loader2, Star, Eye, EyeOff,
  Send, Database, Lock, RefreshCw, Check, X, AlertCircle
} from 'lucide-react';
import { cx } from '@/lib/types';
import { PanelHeader, SectionCard } from './_shared';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Badge } from '@/components/ui/primitives';
import {
  fetchEmailProviders,
  saveEmailProvider,
  deleteEmailProvider,
  testEmailProvider,
  type EmailProviderDTO,
  type EmailProviderType,
} from '@/lib/emailsApi';

interface ProviderMeta {
  label: string;
  tagline: string;
  color: string;
  bgClass: string;
  borderClass: string;
  icon: React.ReactNode;
}

const PROVIDER_LOGOS: Record<EmailProviderType, ProviderMeta> = {
  AWS_SES: {
    label: 'AWS SES',
    tagline: 'Amazon Simple Email Service',
    color: 'text-amber-500 dark:text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    icon: <Server className="h-5 w-5" />,
  },
  BREVO: {
    label: 'Brevo',
    tagline: 'Formerly Sendinblue API v3',
    color: 'text-emerald-500 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    icon: <Mail className="h-5 w-5" />,
  },
  ZOHO: {
    label: 'Zoho Mail',
    tagline: 'Zoho Workspace SMTP',
    color: 'text-blue-500 dark:text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
    icon: <Globe className="h-5 w-5" />,
  },
  SMTP: {
    label: 'Custom SMTP',
    tagline: 'Standard SMTP / Relay Server',
    color: 'text-indigo-500 dark:text-indigo-400',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/20',
    icon: <Shield className="h-5 w-5" />,
  },
};

export function EmailProvidersPanel() {
  const [providers, setProviders] = useState<EmailProviderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<EmailProviderType>('AWS_SES');

  // Form Fields
  const [name, setName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [awsRegion, setAwsRegion] = useState('us-east-1');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('587');
  const [encryption, setEncryption] = useState('TLS');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showSecretAccessKey, setShowSecretAccessKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Test Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [testingProvider, setTestingProvider] = useState<EmailProviderDTO | null>(null);
  const [testModalError, setTestModalError] = useState<string | null>(null);
  const [testModalSuccess, setTestModalSuccess] = useState<string | null>(null);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProvider, setDeletingProvider] = useState<EmailProviderDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    const { data, error } = await fetchEmailProviders();
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setProviders(data || []);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedType('AWS_SES');
    setName('');
    setFromEmail('');
    setIsDefault(false);
    setAwsRegion('us-east-1');
    setAccessKeyId('');
    setSecretAccessKey('');
    setApiKey('');
    setHost('');
    setPort('587');
    setEncryption('TLS');
    setUsername('');
    setPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleEdit = (p: EmailProviderDTO) => {
    resetForm();
    setEditingId(p.id || null);
    setSelectedType(p.providerType);
    setName(p.name);
    setFromEmail(p.fromEmail);
    setIsDefault(p.isDefault || false);

    try {
      if (p.credentialsPayload) {
        const creds = JSON.parse(p.credentialsPayload);
        if (p.providerType === 'AWS_SES') {
          setAwsRegion(creds.region || 'us-east-1');
          setAccessKeyId(creds.accessKeyId || '');
        } else if (p.providerType === 'BREVO') {
          setApiKey('');
        } else {
          setHost(creds.host || '');
          setPort(creds.port || '587');
          setEncryption(creds.encryption || 'TLS');
          setUsername(creds.username || '');
        }
      }
    } catch {
      // payload wasn't JSON or empty
    }

    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPayload = (): string => {
    if (selectedType === 'AWS_SES') {
      return JSON.stringify({
        region: awsRegion.trim(),
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      });
    }
    if (selectedType === 'BREVO') {
      return JSON.stringify({
        apiKey: apiKey.trim(),
      });
    }
    return JSON.stringify({
      host: host.trim(),
      port: port.trim(),
      encryption,
      username: username.trim(),
      password: password.trim(),
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Please enter a connection name.');
      return;
    }
    if (!fromEmail.trim() || !fromEmail.includes('@')) {
      setError('Please enter a valid From Email address.');
      return;
    }

    setSaving(true);
    const payload = buildPayload();
    const hasCredentials = editingId
      ? payload !== '{"region":"","accessKeyId":"","secretAccessKey":""}' &&
        payload !== '{"apiKey":""}' &&
        payload !== '{"host":"","port":"","encryption":"TLS","username":"","password":""}' &&
        payload !== '{"host":"","port":"","encryption":"SSL","username":"","password":""}'
      : true;

    const providerData: EmailProviderDTO = {
      id: editingId || undefined,
      providerType: selectedType,
      name: name.trim(),
      fromEmail: fromEmail.trim(),
      credentialsPayload: hasCredentials ? payload : '',
      isDefault,
    };

    const res = await saveEmailProvider(providerData);
    setSaving(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`Provider "${name}" saved successfully!`);
      setIsAdding(false);
      resetForm();
      loadProviders();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProvider?.id) return;
    setDeleting(true);
    setError(null);
    setSuccess(null);

    const res = await deleteEmailProvider(deletingProvider.id);
    setDeleting(false);
    setDeleteModalOpen(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`Provider "${deletingProvider.name}" removed successfully.`);
      setDeletingProvider(null);
      loadProviders();
    }
  };

  const handleOpenTestModal = (provider?: EmailProviderDTO) => {
    const target = provider || {
      id: editingId || undefined,
      providerType: selectedType,
      name: name.trim() || 'Active Form Provider',
      fromEmail: fromEmail.trim(),
      credentialsPayload: buildPayload(),
    };
    setTestingProvider(target);
    setTestRecipientEmail(target.fromEmail || fromEmail.trim() || '');
    setTestModalError(null);
    setTestModalSuccess(null);
    setTestModalOpen(true);
  };

  const handleExecuteTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testingProvider) return;
    if (!testRecipientEmail.trim() || !testRecipientEmail.includes('@')) {
      setTestModalError('Please enter a valid recipient email address.');
      return;
    }

    setTesting(true);
    setTestModalError(null);
    setTestModalSuccess(null);

    const res = await testEmailProvider(testingProvider, testRecipientEmail.trim());
    setTesting(false);

    if (res.error || !res.success) {
      setTestModalError(res.error || 'Failed to send test email. Please verify credentials and SMTP settings.');
    } else {
      setTestModalSuccess(`Test email sent successfully to ${testRecipientEmail}! Connection verified.`);
      // Refresh provider status in list
      loadProviders();
    }
  };

  const handleSetDefault = async (p: EmailProviderDTO) => {
    if (p.isDefault || !p.id) return;
    setError(null);
    setSuccess(null);
    const res = await saveEmailProvider({ ...p, isDefault: true });
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`"${p.name}" set as default sending provider.`);
      loadProviders();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      {/* ── Top Header ── */}
      <PanelHeader
        title="Email Providers (BYOP)"
        desc="Connect and manage your own email delivery services (AWS SES, Brevo, Zoho Mail, Custom SMTP) for high-deliverability marketing and transactional emails."
        icon={<Mail className="h-5 w-5 text-indigo-500" />}
      />

      {/* ── Architecture Pills ── */}
      <div className="flex flex-wrap items-center gap-2 -mt-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <Server className="w-3.5 h-3.5" /> Multi-Provider Delivery
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-ink-800 text-secondary-c border border-base-c">
          <Shield className="w-3.5 h-3.5 text-blue-500" /> AES-256 Encrypted
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-ink-800 text-secondary-c border border-base-c">
          <Lock className="w-3.5 h-3.5 text-emerald-500" /> Tenant Isolated
        </span>
      </div>

      {/* ── Global Alerts ── */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium animate-slide-down">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 text-xs font-semibold uppercase px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium animate-slide-down">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200 text-xs font-semibold uppercase px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main View: List or Add Form ── */}
      {!isAdding ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-primary-c">Connected Accounts</h4>
              <p className="text-xs text-secondary-c mt-0.5">
                {providers.length} {providers.length === 1 ? 'provider' : 'providers'} configured
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadProviders}
                className="btn-secondary text-xs h-9 px-3 flex items-center gap-1.5"
                title="Refresh list"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleOpenCreate}
                className="btn-primary text-xs h-9 px-4 flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Add Provider
              </button>
            </div>
          </div>

          {loading ? (
            <SectionCard>
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-primary-500" />
                <p className="mt-3 text-xs text-secondary-c">Loading configured email providers…</p>
              </div>
            </SectionCard>
          ) : providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-base-c bg-card-c p-12 text-center shadow-xs">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-3.5">
                <Mail className="h-6 w-6" />
              </div>
              <h5 className="text-sm font-bold text-primary-c">No Email Providers Connected</h5>
              <p className="text-xs text-secondary-c mt-1 mb-5 max-w-sm leading-relaxed">
                Connect AWS SES, Brevo, Zoho Mail, or custom SMTP to start delivering high-converting email campaigns and real-time lead alerts.
              </p>
              <button
                onClick={handleOpenCreate}
                className="btn-primary text-xs h-9 px-4 flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" /> Add Provider Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {providers.map((p) => {
                const conf = PROVIDER_LOGOS[p.providerType] || PROVIDER_LOGOS.SMTP;
                const isConnected = p.status === 'CONNECTED';

                return (
                  <div
                    key={p.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-base-c bg-card-c p-5 transition-all hover:shadow-md group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cx('grid h-12 w-12 place-items-center rounded-xl border shrink-0', conf.bgClass, conf.borderClass, conf.color)}>
                        {conf.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-sm text-primary-c truncate">{p.name}</h5>
                          {p.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                              <Star className="w-2.5 h-2.5 fill-indigo-500 text-indigo-500" />
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondary-c mt-1 truncate">
                          From: <span className="font-medium text-primary-c">{p.fromEmail}</span> • Type: <span className="font-medium">{conf.label}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-base-c">
                      <div className="flex items-center gap-1.5 mr-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isConnected ? 'Connected' : 'Unverified'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenTestModal(p)}
                        className="btn-secondary text-xs h-8 px-2.5 flex items-center gap-1.5"
                        title="Send a test email to verify credentials"
                      >
                        <Send className="w-3 h-3 text-indigo-500" />
                        <span>Test</span>
                      </button>

                      {!p.isDefault && (
                        <button
                          onClick={() => handleSetDefault(p)}
                          className="btn-secondary text-xs h-8 px-2.5 flex items-center gap-1.5 hover:text-amber-600 hover:border-amber-500/40"
                          title="Set as Default Sending Provider"
                        >
                          <Star className="w-3 h-3" />
                          <span>Make Default</span>
                        </button>
                      )}

                      <div className="h-6 w-px bg-base-c hidden sm:block mx-1"></div>

                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 rounded-lg text-secondary-c hover:text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors"
                        title="Edit Provider"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingProvider(p);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-secondary-c hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Remove Provider"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── Add / Edit Form ── */
        <form onSubmit={handleSave} className="rounded-2xl border border-base-c bg-card-c p-6 animate-fade-in shadow-xs">
          <div className="flex items-center justify-between border-b border-base-c pb-4 mb-6">
            <div>
              <h4 className="text-base font-bold text-primary-c">
                {editingId ? 'Edit Email Provider' : 'Add New Email Provider'}
              </h4>
              <p className="text-xs text-secondary-c mt-0.5">
                Configure API keys or SMTP credentials for your delivery service
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                resetForm();
              }}
              className="p-2 rounded-lg text-secondary-c hover:text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors"
              title="Close form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Provider Type Selection */}
            <div>
              <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-secondary-c">
                1. Select Service Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(PROVIDER_LOGOS) as EmailProviderType[]).map((type) => {
                  const meta = PROVIDER_LOGOS[type];
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedType(type);
                        if (type === 'ZOHO') {
                          setHost('smtp.zoho.com');
                          setPort('465');
                          setEncryption('SSL');
                        }
                      }}
                      className={cx(
                        'flex flex-col items-center justify-center text-center p-4 rounded-2xl border transition-all',
                        isSelected
                          ? 'border-primary-500 bg-primary-500/10 ring-2 ring-primary-500/20 shadow-sm'
                          : 'border-base-c bg-card-c hover:border-primary-500/40 hover:bg-slate-50 dark:hover:bg-ink-850'
                      )}
                    >
                      <div className={cx('grid h-11 w-11 place-items-center rounded-xl border mb-2', meta.bgClass, meta.borderClass, meta.color)}>
                        {meta.icon}
                      </div>
                      <span className={cx('text-xs font-bold', isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-primary-c')}>
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-muted-c mt-0.5 line-clamp-1">
                        {meta.tagline}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Provider Configuration Fields */}
            <div className="rounded-2xl border border-base-c bg-slate-50/50 dark:bg-ink-850/50 p-5 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary-c">
                2. Provider Credentials & Parameters
              </label>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary-c">Connection Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AWS Production Mailer"
                  className="form-input text-sm bg-card-c"
                />
              </div>

              {selectedType === 'AWS_SES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary-c">AWS Region *</label>
                    <input
                      type="text"
                      required
                      value={awsRegion}
                      onChange={(e) => setAwsRegion(e.target.value)}
                      placeholder="e.g. us-east-1"
                      className="form-input text-sm bg-card-c"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary-c">Access Key ID *</label>
                    <input
                      type="text"
                      required
                      value={accessKeyId}
                      onChange={(e) => setAccessKeyId(e.target.value)}
                      placeholder="AKIA..."
                      className="form-input text-sm bg-card-c"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-primary-c">Secret Access Key *</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-c" />
                      <input
                        type={showSecretAccessKey ? 'text' : 'password'}
                        required={!editingId}
                        value={secretAccessKey}
                        onChange={(e) => setSecretAccessKey(e.target.value)}
                        placeholder={editingId ? '•••••••••••••••••••• (leave blank to keep current)' : '••••••••••••••••••••••••'}
                        className="form-input pl-9 pr-10 text-sm bg-card-c"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretAccessKey(!showSecretAccessKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-c hover:text-primary-c transition-colors"
                      >
                        {showSecretAccessKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedType === 'BREVO' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary-c">Brevo API Key (v3) *</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-c" />
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        required={!editingId}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={editingId ? '•••••••• (leave blank to keep current)' : 'xkeysib-...'}
                        className="form-input pl-9 pr-10 text-sm bg-card-c"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-c hover:text-primary-c transition-colors"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-secondary-c flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5 text-primary-500" />
                    Obtain your API key from the Brevo SMTP & API console.
                  </p>
                </div>
              )}

              {(selectedType === 'SMTP' || selectedType === 'ZOHO') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-primary-c">SMTP Host *</label>
                    <input
                      type="text"
                      required
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder={selectedType === 'ZOHO' ? 'smtp.zoho.com' : 'smtp.example.com'}
                      className="form-input text-sm bg-card-c"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary-c">SMTP Port *</label>
                    <input
                      type="text"
                      required
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder={selectedType === 'ZOHO' ? '465' : '587'}
                      className="form-input text-sm bg-card-c"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary-c">Encryption *</label>
                    <select
                      value={encryption}
                      onChange={(e) => setEncryption(e.target.value)}
                      className="form-input text-sm bg-card-c"
                    >
                      <option value="TLS">TLS</option>
                      <option value="SSL">SSL</option>
                      <option value="NONE">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary-c">Username *</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="you@domain.com"
                      className="form-input text-sm bg-card-c"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary-c">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingId}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={editingId ? '•••••••• (leave blank to keep current)' : '••••••••'}
                        className="form-input pr-10 text-sm bg-card-c"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-c hover:text-primary-c transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-base-c space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary-c">From Email Address *</label>
                  <input
                    type="email"
                    required
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="notifications@yourcompany.com"
                    className="form-input text-sm bg-card-c"
                  />
                  <p className="text-[11px] text-muted-c mt-1">
                    This sender email must be verified on your provider domain to ensure SPF/DKIM delivery.
                  </p>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                  <span className="text-xs font-medium text-primary-c">Set as Default Sending Provider for campaigns</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-base-c">
              <button
                type="button"
                onClick={() => handleOpenTestModal()}
                disabled={testing}
                className="btn-secondary text-xs h-9 px-3.5 flex items-center gap-2 self-start"
              >
                <Send className="h-3.5 w-3.5 text-indigo-500" />
                <span>Test Connection</span>
              </button>
              <div className="flex items-center gap-2.5 self-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    resetForm();
                  }}
                  className="btn-secondary text-xs h-9 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs h-9 px-5 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>{editingId ? 'Update Provider' : 'Save Provider'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── Polished Enterprise Security Card ── */}
      <div className="rounded-2xl border border-base-c bg-card-c p-5 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-primary-c">Enterprise Security & Encryption</h5>
              <p className="text-xs text-secondary-c mt-1 max-w-2xl leading-relaxed">
                All provider credentials (AWS IAM secret keys, Brevo API tokens, and SMTP passwords) are encrypted at rest using AES-256 before persistence. Credentials are never written to audit logs or exposed in raw format.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" /> AES-256 Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* ── Test Connection Modal ── */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-base-c bg-card-c p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary-c">Test Connection</h4>
                  <p className="text-[11px] text-secondary-c">Send verification email via {testingProvider?.name || 'Provider'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="text-muted-c hover:text-primary-c p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {testModalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {testModalError}
              </div>
            )}

            {testModalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                {testModalSuccess}
              </div>
            )}

            <form onSubmit={handleExecuteTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary-c mb-1.5">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  value={testRecipientEmail}
                  onChange={(e) => setTestRecipientEmail(e.target.value)}
                  placeholder="test@yourcompany.com"
                  className="form-input text-sm bg-card-c"
                />
                <p className="text-[11px] text-muted-c mt-1">
                  A verification email will be dispatched to this inbox to validate authentication.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="btn-secondary text-xs h-9 px-4"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={testing}
                  className="btn-primary text-xs h-9 px-4 flex items-center gap-2"
                >
                  {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{testing ? 'Sending…' : 'Send Test'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Remove Provider Confirm Modal ── */}
      <ConfirmModal
        open={deleteModalOpen}
        title="Remove Email Provider"
        message={`Are you sure you want to remove provider "${deletingProvider?.name}"? Campaigns assigned to this provider will need to be reassigned.`}
        confirmLabel="Remove Provider"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeletingProvider(null);
        }}
      />
    </div>
  );
}
