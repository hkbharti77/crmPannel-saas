import { useState, useEffect } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  Users, Loader2, CheckCircle2, AlertCircle, LogOut,
  RefreshCw, ShieldCheck, ArrowDownCircle, Check, Sparkles, UserPlus
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import {
  fetchContactsStatus,
  importGoogleContacts,
  fetchGoogleAuthUrl,
  disconnectGoogleIntegration,
  ContactsImportStats
} from '@/lib/integrationsApi';

/* ─── Google Contacts Sync & Import Panel ─── */
export function GoogleContactsPanel({ embedded = false }: { embedded?: boolean } = {}) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync state
  const [importing, setImporting] = useState(false);
  const [importLimit, setImportLimit] = useState(100);
  const [stats, setStats] = useState<ContactsImportStats | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedFeature = params.get('connected');
    const statusParam = params.get('status');
    const errorParam = params.get('error') || params.get('googleError');

    if (connectedFeature === 'contacts') {
      if (statusParam === 'partial') {
        setMessage('Google Contacts connected with limited permissions.');
      } else {
        setMessage('Google Contacts connected successfully! You can now import and sync client phonebooks.');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      setError(`Google Contacts authorization failed: ${decodeURIComponent(errorParam)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const res = await fetchContactsStatus();
    setLoading(false);
    if (res.data) {
      setConnected(res.data.connected);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    const res = await fetchGoogleAuthUrl('CONTACTS');
    setConnecting(false);

    if (res.error) {
      setError(`Failed to initiate Contacts OAuth: ${res.error}`);
    } else if (res.data?.url) {
      window.location.href = res.data.url;
    }
  };

  const handleDisconnect = () => {
    setDisconnectModalOpen(true);
  };

  const confirmDisconnect = async () => {
    setDisconnectModalOpen(false);
    setDisconnecting(true);
    setError(null);
    const res = await disconnectGoogleIntegration('CONTACTS');
    setDisconnecting(false);

    if (res.error) {
      setError(`Failed to disconnect: ${res.error}`);
    } else {
      setConnected(false);
      setMessage('Google Contacts disconnected successfully.');
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleImportContacts = async () => {
    setImporting(true);
    setError(null);
    setStats(null);

    const res = await importGoogleContacts(importLimit);
    setImporting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setStats(res.data);
      setMessage(`Successfully imported ${res.data.importedCount} new contacts and updated ${res.data.updatedCount} existing contacts!`);
    }
  };

  if (loading) {
    return (
      <SectionCard>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-primary-500" />
          <p className="mt-3 text-xs text-muted-c">Checking Google Contacts integration status…</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      <SectionCard>
        {!embedded && (
          <PanelHeader
            title="Google Contacts Import & Sync"
            desc="Seamlessly import client contacts and phone numbers from Google People API with automatic deduplication"
            icon={<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          />
        )}

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-success-500/20 bg-success-500/10 p-3 text-xs text-success-600 dark:text-success-400 mb-4 animate-slide-down">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400 mb-4 animate-slide-down">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Status Card */}
        <div className="rounded-2xl border border-base-c bg-card-c p-5 mb-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-primary-c">Google People API</h3>
                  {connected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      CONNECTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-500/20">
                      NOT CONNECTED
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-secondary-c max-w-xl leading-relaxed">
                  {connected
                    ? 'Connected with read-only contacts access. You can safely sync Google Contacts without overwriting personal notes on Google.'
                    : 'Authorize GyanVaniAi CRM to read your Google Contacts so you can import phone numbers and lead names with one click.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              {connected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="inline-flex items-center gap-2 rounded-xl border border-danger-500/30 bg-danger-500/10 hover:bg-danger-500/20 px-4 py-2 text-xs font-semibold text-danger-600 dark:text-danger-400 transition-all cursor-pointer disabled:opacity-50"
                >
                  {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-all cursor-pointer disabled:opacity-50"
                >
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                  <span>Connect Google Contacts</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-c mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Smart Deduplication</span>
            </div>
            <p className="text-[11px] text-secondary-c leading-relaxed">
              Automatically matches existing contacts by mobile number or email — never creates duplicate lead cards.
            </p>
          </div>
          <div className="rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-c mb-1">
              <ArrowDownCircle className="h-4 w-4 text-blue-500" />
              <span>Indian Mobile Format</span>
            </div>
            <p className="text-[11px] text-secondary-c leading-relaxed">
              Standardizes phone numbers with country code (91XXXXXXXXXX) so WhatsApp messaging works instantly.
            </p>
          </div>
          <div className="rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-900/40 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-c mb-1">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Idempotent Sync</span>
            </div>
            <p className="text-[11px] text-secondary-c leading-relaxed">
              Tracks Google resource names in the backend sync registry, allowing repeated syncs without clutter.
            </p>
          </div>
        </div>

        {/* Import Action Card */}
        {connected ? (
          <div className="rounded-2xl border border-base-c bg-card-c p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-c pb-4 mb-4">
              <div>
                <h4 className="text-sm font-bold text-primary-c flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary-500" />
                  <span>Sync & Import Contacts to CRM</span>
                </h4>
                <p className="text-xs text-secondary-c mt-0.5">
                  Fetch phone contacts from Google People API into your CRM database
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={importLimit}
                  onChange={(e) => setImportLimit(Number(e.target.value))}
                  className="form-input text-xs py-1.5 px-3 rounded-lg"
                  disabled={importing}
                >
                  <option value={50}>Import up to 50 contacts</option>
                  <option value={100}>Import up to 100 contacts</option>
                  <option value={250}>Import up to 250 contacts</option>
                  <option value={500}>Import up to 500 contacts</option>
                </select>

                <button
                  type="button"
                  onClick={handleImportContacts}
                  disabled={importing}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-accent px-5 py-2 text-xs font-bold text-white shadow-soft transition-all hover:shadow-glow-blue disabled:opacity-50 cursor-pointer"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span>{importing ? 'Syncing...' : 'Sync Contacts Now'}</span>
                </button>
              </div>
            </div>

            {/* Sync Results Stats */}
            {stats && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs animate-slide-down">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-3">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Contacts Sync Completed!</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="rounded-lg bg-card-c p-2 border border-base-c">
                    <span className="text-[10px] text-muted-c block uppercase">Total Fetched</span>
                    <span className="text-lg font-bold text-primary-c">{stats.totalFetched}</span>
                  </div>
                  <div className="rounded-lg bg-card-c p-2 border border-base-c">
                    <span className="text-[10px] text-muted-c block uppercase">New Contacts Added</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{stats.importedCount}</span>
                  </div>
                  <div className="rounded-lg bg-card-c p-2 border border-base-c">
                    <span className="text-[10px] text-muted-c block uppercase">Updated Existing</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.updatedCount}</span>
                  </div>
                  <div className="rounded-lg bg-card-c p-2 border border-base-c">
                    <span className="text-[10px] text-muted-c block uppercase">Skipped / Empty</span>
                    <span className="text-lg font-bold text-slate-500">{stats.skippedCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-base-c bg-slate-50/50 dark:bg-ink-900/30 p-8 text-center">
            <Users className="h-10 w-10 text-muted-c mx-auto mb-3 opacity-60" />
            <h4 className="text-sm font-bold text-primary-c">Connect Google Contacts to import leads</h4>
            <p className="mt-1 text-xs text-secondary-c max-w-md mx-auto">
              Quickly populate your CRM address book with your existing clients, brokers, and partners from Google Contacts.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-all cursor-pointer"
            >
              {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
              <span>Connect Google Contacts Now</span>
            </button>
          </div>
        )}
      </SectionCard>

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        open={disconnectModalOpen}
        title="Disconnect Google Contacts?"
        message="Are you sure you want to disconnect Google Contacts? Already imported contacts will remain safely preserved in your CRM database."
        confirmLabel="Disconnect"
        variant="danger"
        onConfirm={confirmDisconnect}
        onCancel={() => setDisconnectModalOpen(false)}
      />
    </div>
  );
}
