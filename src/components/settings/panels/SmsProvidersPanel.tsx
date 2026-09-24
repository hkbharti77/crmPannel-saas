import { useState } from 'react';
import { MessageSquare, CheckCircle2, AlertTriangle, Send, Loader2, Plus, Trash2, Edit3, Key, Shield } from 'lucide-react';
import { GlassCard } from '@/components/ui/primitives';
import { MaskedSmsProvider } from '@/types/sms';
import { useSmsProviders } from '@/hooks/useSmsProviders';
import { sendSmsMessage, saveSmsProvider, deleteSmsProvider, SaveSmsProviderRequest } from '@/lib/smsApi';

const SMS_PROVIDER_INFO: Record<string, { label: string; badgeColor: string; description: string }> = {
  TWILIO: {
    label: 'Twilio SMS',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    description: 'Global SMS dispatch, high deliverability, automated webhooks & DLR tracking.',
  },
  MSG91: {
    label: 'MSG91 (India DLT)',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    description: 'India DLT compliant SMS gateway, Flow API support, high-speed transactional SMS.',
  },
  FAST2SMS: {
    label: 'Fast2SMS',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    description: 'Direct DLT route, quick API integration for Indian mobile numbers.',
  },
  AWS_SNS: {
    label: 'AWS SNS SMS',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    description: 'Scalable cloud pub-sub SMS dispatch powered by Amazon Web Services.',
  },
};

export function SmsProvidersPanel() {
  const { providers, loading, error, refetch } = useSmsProviders();
  const safeProviders = Array.isArray(providers) ? providers : [];

  // Add/Edit Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<MaskedSmsProvider | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [providerType, setProviderType] = useState<'TWILIO' | 'MSG91' | 'FAST2SMS' | 'AWS_SNS'>('TWILIO');
  const [name, setName] = useState('');
  const [senderId, setSenderId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  // Test Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<MaskedSmsProvider | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from CRMLite SMS Module.');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleOpenAdd = () => {
    setEditingProvider(null);
    setProviderType('TWILIO');
    setName('Primary Twilio Gateway');
    setSenderId('+12025550143');
    setIsDefault(safeProviders.length === 0);
    setAccountSid('');
    setAuthToken('');
    setApiKey('');
    setApiSecret('');
    setAddModalOpen(true);
  };

  const handleEdit = (prov: MaskedSmsProvider) => {
    setEditingProvider(prov);
    setProviderType(prov.providerType);
    setName(prov.name);
    setSenderId(prov.senderId);
    setIsDefault(prov.isDefault);
    setAccountSid(prov.maskedCredentials?.accountSid || '');
    setAuthToken('');
    setApiKey(prov.maskedCredentials?.apiKey || '');
    setApiSecret('');
    setAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this SMS gateway provider?')) return;
    try {
      await deleteSmsProvider(id);
      refetch();
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to delete provider');
    }
  };

  const handleSaveProvider = async () => {
    if (!name || !senderId) return;
    setSaving(true);
    try {
      const payload: SaveSmsProviderRequest = {
        id: editingProvider?.id,
        providerType,
        name,
        senderId,
        isDefault,
        accountSid,
        authToken,
        apiKey,
        apiSecret,
      };

      await saveSmsProvider(payload);
      setAddModalOpen(false);
      refetch();
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Failed to save SMS provider credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleTestClick = (prov: MaskedSmsProvider) => {
    setSelectedProvider(prov);
    setTestResult(null);
    setTestModalOpen(true);
  };

  const handleSendTestSms = async () => {
    if (!testPhone) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await sendSmsMessage({
        phoneNumber: testPhone,
        messageContent: testMessage,
        senderId: selectedProvider?.senderId,
      });

      if (res.success) {
        setTestResult({
          success: true,
          message: `SMS dispatched successfully! Segments: ${res.segments}, MsgId: ${res.providerMessageId || 'N/A'}`,
        });
      } else {
        setTestResult({
          success: false,
          message: `Dispatch failed: ${res.errorMessage || res.errorCode || 'Unknown error'}`,
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: (err as Error)?.message || 'Failed to send test SMS',
      });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-header with Add Provider Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-base-c pb-5">
        <div>
          <h2 className="text-lg font-bold text-primary-c flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            Configured SMS Gateways & Providers
          </h2>
          <p className="text-xs text-secondary-c mt-0.5">
            Configure multi-provider SMS dispatchers (Twilio, MSG91, Fast2SMS) with masked credential security & DLT compliance.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add SMS Provider
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : safeProviders.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-base-c rounded-2xl bg-card-c/50">
          <MessageSquare className="h-10 w-10 text-muted-c mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-primary-c">No SMS Providers Connected</h3>
          <p className="text-xs text-secondary-c mt-1 max-w-sm mx-auto mb-4">
            Add your primary SMS provider credentials (Twilio Account SID, MSG91 Auth Key) to start sending SMS.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Connect SMS Gateway
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeProviders.map((prov) => {
            const info = SMS_PROVIDER_INFO[prov.providerType] || {
              label: prov.providerType,
              badgeColor: 'bg-muted-c/10 text-muted-c border-base-c',
              description: 'Custom SMS Gateway Provider',
            };

            return (
              <GlassCard
                key={prov.id}
                className="p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${info.badgeColor}`}>
                      {info.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {prov.isDefault && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          DEFAULT PROVIDER
                        </span>
                      )}
                      <button
                        onClick={() => handleEdit(prov)}
                        className="p-1 rounded-lg text-muted-c hover:text-indigo-500 hover:bg-base-c transition-colors"
                        title="Edit Provider Credentials"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prov.id)}
                        className="p-1 rounded-lg text-muted-c hover:text-rose-500 hover:bg-base-c transition-colors"
                        title="Delete Provider"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-primary-c mb-1">{prov.name}</h4>
                  <p className="text-xs text-secondary-c mb-4">{info.description}</p>

                  <div className="space-y-2 text-xs text-secondary-c bg-base-c/40 border border-base-c p-3 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-muted-c">Sender ID / Header:</span>
                      <span className="font-mono font-bold text-primary-c">{prov.senderId}</span>
                    </div>
                    {prov.maskedCredentials?.accountSid && (
                      <div className="flex justify-between">
                        <span className="text-muted-c">Account SID:</span>
                        <span className="font-mono font-medium text-primary-c">{prov.maskedCredentials.accountSid}</span>
                      </div>
                    )}
                    {prov.maskedCredentials?.apiKey && (
                      <div className="flex justify-between">
                        <span className="text-muted-c">API Key:</span>
                        <span className="font-mono font-medium text-primary-c">{prov.maskedCredentials.apiKey}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-base-c flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-semibold">{prov.status}</span>
                  </div>
                  <button
                    onClick={() => handleTestClick(prov)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Test Dispatch
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add / Edit Provider Credentials Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card-c border border-base-c rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-primary-c flex items-center gap-2">
              <Key className="h-5 w-5 text-indigo-500" />
              {editingProvider ? 'Edit SMS Provider Credentials' : 'Connect New SMS Gateway'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-primary-c mb-1">Gateway Type:</label>
                <select
                  value={providerType}
                  onChange={(e) => setProviderType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="TWILIO">Twilio SMS (Global / US)</option>
                  <option value="MSG91">MSG91 (India DLT Flow API)</option>
                  <option value="FAST2SMS">Fast2SMS (India DLT Route)</option>
                  <option value="AWS_SNS">AWS SNS SMS (Cloud Global)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primary-c mb-1">Provider Display Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Primary Twilio Gateway"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary-c mb-1">Sender ID / Header / Phone:</label>
                <input
                  type="text"
                  placeholder="e.g. +12025550143 or 6-char Header (CHATCR)"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {providerType === 'TWILIO' && (
                <>
                  <div>
                    <label className="block font-semibold text-primary-c mb-1">Twilio Account SID:</label>
                    <input
                      type="text"
                      placeholder="AC..."
                      value={accountSid}
                      onChange={(e) => setAccountSid(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-primary-c mb-1">Twilio Auth Token:</label>
                    <input
                      type="password"
                      placeholder={editingProvider ? '•••••••••••• (Leave blank to keep unchanged)' : 'Enter Twilio Auth Token'}
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </>
              )}

              {(providerType === 'MSG91' || providerType === 'FAST2SMS') && (
                <div>
                  <label className="block font-semibold text-primary-c mb-1">API Key / Auth Key:</label>
                  <input
                    type="password"
                    placeholder={editingProvider ? '•••••••••••• (Leave blank to keep unchanged)' : 'Enter API / Auth Key'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              {providerType === 'AWS_SNS' && (
                <>
                  <div>
                    <label className="block font-semibold text-primary-c mb-1">AWS Access Key ID:</label>
                    <input
                      type="text"
                      placeholder="AKIA..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-primary-c mb-1">AWS Secret Access Key:</label>
                    <input
                      type="password"
                      placeholder="Enter Secret Key"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultSms"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="isDefaultSms" className="text-xs font-semibold text-primary-c cursor-pointer">
                  Set as Default SMS Provider for Business
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-base-c">
              <button
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-secondary-c hover:text-primary-c"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProvider}
                disabled={saving || !name || !senderId}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Send Modal */}
      {testModalOpen && selectedProvider && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card-c border border-base-c rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-primary-c flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-500" />
              Test SMS Dispatch ({selectedProvider.name})
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-primary-c mb-1">
                  Recipient Phone Number (E.164 format):
                </label>
                <input
                  type="text"
                  placeholder="+919876543210 or +12025550143"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary-c mb-1">
                  Message Body:
                </label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-base-c border border-base-c text-sm text-primary-c focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-base-c">
              <button
                onClick={() => setTestModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-secondary-c hover:text-primary-c"
              >
                Close
              </button>
              <button
                onClick={handleSendTestSms}
                disabled={testSending || !testPhone}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Test SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
