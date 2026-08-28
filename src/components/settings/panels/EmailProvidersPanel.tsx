import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Edit2, Shield, CheckCircle2, AlertTriangle, Key, Server, Globe, ExternalLink, Loader2, Star } from 'lucide-react';
import { cx } from '@/lib/types';
import {
  fetchEmailProviders,
  saveEmailProvider,
  deleteEmailProvider,
  testEmailProvider,
  type EmailProviderDTO,
  type EmailProviderType,
} from '@/lib/emailsApi';

const PROVIDER_LOGOS: Record<EmailProviderType, { label: string; color: string; icon: React.ReactNode }> = {
  AWS_SES: {
    label: 'AWS SES',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    icon: <Server className="h-5 w-5" />,
  },
  BREVO: {
    label: 'Brevo',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    icon: <Mail className="h-5 w-5" />,
  },
  ZOHO: {
    label: 'Zoho Mail',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    icon: <Globe className="h-5 w-5" />,
  },
  SMTP: {
    label: 'Custom SMTP',
    color: 'text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
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
    setSelectedType(p.providerType || 'AWS_SES');
    setName(p.name || '');
    setFromEmail(p.fromEmail || '');
    setIsDefault(!!p.isDefault);

    try {
      const creds = JSON.parse(p.credentialsPayload || '{}');
      if (p.providerType === 'AWS_SES') {
        setAwsRegion(creds.region || 'us-east-1');
        setAccessKeyId(creds.accessKeyId || '');
        setSecretAccessKey(creds.secretAccessKey || '');
      } else if (p.providerType === 'BREVO') {
        setApiKey(creds.apiKey || '');
      } else {
        setHost(creds.host || (p.providerType === 'ZOHO' ? 'smtp.zoho.com' : ''));
        setPort(creds.port || (p.providerType === 'ZOHO' ? '465' : '587'));
        setEncryption(creds.encryption || 'TLS');
        setUsername(creds.username || '');
        setPassword(creds.password || '');
      }
    } catch {
      // Ignored
    }

    setIsAdding(true);
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
    const providerData: EmailProviderDTO = {
      id: editingId || undefined,
      providerType: selectedType,
      name: name.trim(),
      fromEmail: fromEmail.trim(),
      credentialsPayload: buildPayload(),
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

  const handleDelete = async (id: string, pName: string) => {
    if (!window.confirm(`Are you sure you want to remove provider "${pName}"?`)) {
      return;
    }
    setError(null);
    setSuccess(null);

    const res = await deleteEmailProvider(id);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`Provider "${pName}" removed.`);
      loadProviders();
    }
  };

  const handleTestConnection = async () => {
    setError(null);
    setSuccess(null);

    if (!fromEmail.trim() || !fromEmail.includes('@')) {
      setError('Please enter a valid From Email address to run the test.');
      return;
    }

    const testRecipient = window.prompt('Enter test recipient email address:', fromEmail.trim()) || fromEmail.trim();
    if (!testRecipient || !testRecipient.includes('@')) {
      return;
    }

    setTesting(true);
    const providerData: EmailProviderDTO = {
      id: editingId || undefined,
      providerType: selectedType,
      name: name.trim() || 'Test Connection',
      fromEmail: fromEmail.trim(),
      credentialsPayload: buildPayload(),
    };

    const res = await testEmailProvider(providerData, testRecipient);
    setTesting(false);

    if (res.error || !res.success) {
      setError(res.error || 'Failed to send test email. Please verify credentials and SMTP settings.');
    } else {
      setSuccess(`Test email sent successfully to ${testRecipient}! Connection verified.`);
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
      setSuccess(`"${p.name}" set as default provider.`);
      loadProviders();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-primary-c">Email Providers (BYOP)</h3>
        <p className="text-sm text-secondary-c mt-1">
          Connect your own email delivery services (AWS SES, Brevo, Zoho, Custom SMTP) for sending marketing campaigns and transactional emails.
        </p>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-4 text-xs font-medium text-danger-600 dark:text-danger-400 animate-slide-down">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-slide-down">
          {success}
        </div>
      )}

      {!isAdding ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-primary-c">Connected Accounts</h4>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Provider
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-base-c bg-card-c p-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 dark:bg-ink-800 mb-4">
                <Mail className="h-6 w-6 text-muted-c" />
              </div>
              <h5 className="text-sm font-bold text-primary-c">No providers connected</h5>
              <p className="text-xs text-secondary-c mt-1 mb-4 max-w-sm">
                Add an email provider like AWS SES, Brevo, Zoho, or standard SMTP to start sending email campaigns.
              </p>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Provider Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {providers.map((p) => {
                const conf = PROVIDER_LOGOS[p.providerType] || PROVIDER_LOGOS.SMTP;
                return (
                  <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-base-c bg-card-c p-4 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={cx('grid h-12 w-12 place-items-center rounded-lg border shrink-0', conf.color)}>
                        {conf.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-sm text-primary-c truncate">{p.name}</h5>
                          {p.isDefault && (
                            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-muted-c mt-0.5 truncate">
                          From: {p.fromEmail} • Type: {conf.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      {p.status === 'CONNECTED' ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" /> Connected
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-4 w-4" /> Unverified
                        </div>
                      )}

                      {!p.isDefault && (
                        <button
                          onClick={() => handleSetDefault(p)}
                          className="flex items-center gap-1 rounded-md border border-base-c px-2 py-1 text-[11px] font-semibold text-secondary-c hover:text-amber-500 hover:border-amber-500/30 transition-all"
                          title="Make Default Provider"
                        >
                          <Star className="h-3 w-3" /> Make Default
                        </button>
                      )}

                      <div className="h-8 w-px bg-base-c mx-1"></div>

                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 rounded-lg text-muted-c hover:text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors"
                        title="Edit Provider"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => p.id && handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg text-muted-c hover:text-danger-500 hover:bg-danger-500/10 transition-colors"
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
        <form onSubmit={handleSave} className="rounded-xl border border-base-c bg-card-c p-6 animate-fade-in shadow-sm">
          <div className="flex items-center justify-between border-b border-base-c pb-4 mb-6">
            <h4 className="text-base font-bold text-primary-c">
              {editingId ? 'Edit Email Provider' : 'Add New Email Provider'}
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                resetForm();
              }}
              className="text-sm font-semibold text-secondary-c hover:text-primary-c"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-6">
            {/* Provider Type Selection */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-primary-c">Select Service Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(PROVIDER_LOGOS) as EmailProviderType[]).map((type) => (
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
                      'flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all',
                      selectedType === type
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-500/10 shadow-sm'
                        : 'border-base-c hover:border-primary-300 hover:bg-slate-50 dark:hover:bg-ink-850',
                    )}
                  >
                    <div className={cx('grid h-10 w-10 place-items-center rounded-lg border', PROVIDER_LOGOS[type].color)}>
                      {PROVIDER_LOGOS[type].icon}
                    </div>
                    <span className={cx('text-xs font-bold', selectedType === type ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-c')}>
                      {PROVIDER_LOGOS[type].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Configuration Form */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-ink-700 dark:bg-ink-850 p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Connection Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AWS Production Mail"
                  className="form-input text-sm bg-white dark:bg-ink-900"
                />
              </div>

              {selectedType === 'AWS_SES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-secondary-c">AWS Region</label>
                    <input
                      type="text"
                      required
                      value={awsRegion}
                      onChange={(e) => setAwsRegion(e.target.value)}
                      placeholder="e.g. us-east-1"
                      className="form-input text-sm bg-white dark:bg-ink-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Access Key ID</label>
                    <input
                      type="text"
                      required
                      value={accessKeyId}
                      onChange={(e) => setAccessKeyId(e.target.value)}
                      placeholder="AKIA..."
                      className="form-input text-sm bg-white dark:bg-ink-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Secret Access Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-c" />
                      <input
                        type="password"
                        required
                        value={secretAccessKey}
                        onChange={(e) => setSecretAccessKey(e.target.value)}
                        placeholder="••••••••••••••••••••••••"
                        className="form-input pl-9 text-sm bg-white dark:bg-ink-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedType === 'BREVO' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-secondary-c">API Key (v3)</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-c" />
                      <input
                        type="password"
                        required
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="xkeysib-..."
                        className="form-input pl-9 text-sm bg-white dark:bg-ink-900"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-c flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Get your API key from the Brevo SMTP & API dashboard.
                  </p>
                </div>
              )}

              {(selectedType === 'SMTP' || selectedType === 'ZOHO') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-secondary-c">SMTP Host</label>
                    <input
                      type="text"
                      required
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder={selectedType === 'ZOHO' ? 'smtp.zoho.com' : 'smtp.example.com'}
                      className="form-input text-sm bg-white dark:bg-ink-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-secondary-c">SMTP Port</label>
                    <input
                      type="text"
                      required
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder={selectedType === 'ZOHO' ? '465' : '587'}
                      className="form-input text-sm bg-white dark:bg-ink-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Encryption</label>
                    <select
                      value={encryption}
                      onChange={(e) => setEncryption(e.target.value)}
                      className="form-input text-sm bg-white dark:bg-ink-900"
                    >
                      <option value="TLS">TLS</option>
                      <option value="SSL">SSL</option>
                      <option value="NONE">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="you@domain.com"
                      className="form-input text-sm bg-white dark:bg-ink-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-secondary-c">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-input text-sm bg-white dark:bg-ink-900"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-ink-700 space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-secondary-c">From Email Address</label>
                  <input
                    type="email"
                    required
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="marketing@yourcompany.com"
                    className="form-input text-sm bg-white dark:bg-ink-900"
                  />
                  <p className="text-[11px] text-muted-c mt-1">This email must be verified with your provider.</p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs font-medium text-primary-c">Set as Default Sending Provider</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-base-c">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 disabled:opacity-50"
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Test Connection
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    resetForm();
                  }}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-secondary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingId ? 'Update Provider' : 'Save Provider'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Security Note */}
      <div className="flex items-start gap-3 rounded-xl bg-blue-50/50 border border-blue-500/20 p-4 mt-6">
        <Shield className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <h5 className="text-sm font-bold text-blue-900 dark:text-blue-300">Enterprise Security</h5>
          <p className="text-xs font-medium text-blue-700/80 dark:text-blue-400/80 mt-1 leading-relaxed">
            All provider credentials (API Keys, Passwords) are encrypted at rest using AES-256 before being stored in our database. 
            They are never logged or exposed in raw format.
          </p>
        </div>
      </div>
    </div>
  );
}

