import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { GlassCard, Badge } from '@/components/ui/primitives';
import {
  Globe, Mail, Users, CheckSquare, Video, HardDrive, FileSpreadsheet,
  CheckCircle2, AlertCircle, LogOut, ExternalLink, ShieldCheck, RefreshCw,
  LayoutDashboard, ArrowRight, Lock, Database, Sparkles, Check, ChevronRight,
  Loader2
} from 'lucide-react';
import { PanelHeader, SectionCard } from './_shared';
import {
  fetchGoogleIntegrationStatus,
  fetchGmailStatus,
  fetchGoogleAuthUrl,
  disconnectGoogleIntegration,
  GoogleFeature,
  GoogleStatusMap
} from '@/lib/integrationsApi';

// Sub-panels (rendered with embedded=true to suppress duplicate headers)
import { GmailIntegrationPanel } from './GmailIntegrationPanel';
import { GoogleContactsPanel } from './GoogleContactsPanel';
import { GoogleTasksPanel } from './GoogleTasksPanel';
import { GoogleCalendarPanel } from './GoogleCalendarPanel';
import { GoogleDrivePanel } from './GoogleDrivePanel';
import { GoogleSheetsPanel } from './GoogleSheetsPanel';

export type WorkspaceTabId = 'overview' | 'gmail' | 'contacts' | 'tasks' | 'meet' | 'drive' | 'sheets';

interface ServiceDefinition {
  id: WorkspaceTabId;
  featureKey: GoogleFeature;
  name: string;
  tagline: string;
  description: string;
  icon: typeof Globe;
  colorClass: string;
  bgLightClass: string;
  borderClass: string;
}

const SERVICES: ServiceDefinition[] = [
  {
    id: 'gmail',
    featureKey: 'GMAIL',
    name: 'Gmail',
    tagline: 'Direct lead emailing via Gmail',
    description: 'Send direct emails, manage sales conversations, and track correspondence with lead context.',
    icon: Mail,
    colorClass: 'text-rose-500 dark:text-rose-400',
    bgLightClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/20',
  },
  {
    id: 'contacts',
    featureKey: 'CONTACTS',
    name: 'Google Contacts',
    tagline: 'Sync contacts and leads',
    description: 'Bi-directionally import and link phone numbers, emails, and address book entries directly into CRM leads.',
    icon: Users,
    colorClass: 'text-sky-500 dark:text-sky-400',
    bgLightClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/20',
  },
  {
    id: 'tasks',
    featureKey: 'TASKS',
    name: 'Google Tasks',
    tagline: 'Reminders and follow-ups',
    description: 'Auto-sync scheduled reminders, inspection tasks, and deal deadlines directly with Google Tasks.',
    icon: CheckSquare,
    colorClass: 'text-amber-500 dark:text-amber-400',
    bgLightClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
  },
  {
    id: 'meet',
    featureKey: 'CALENDAR',
    name: 'Google Meet',
    tagline: 'Link and manage Google Meetings',
    description: 'Schedule video calls, generate 1-click Google Meet conferencing links, and sync calendar appointments.',
    icon: Video,
    colorClass: 'text-indigo-500 dark:text-indigo-400',
    bgLightClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/20',
  },
  {
    id: 'drive',
    featureKey: 'DRIVE',
    name: 'Google Drive',
    tagline: 'Agreements and file storage',
    description: 'Sandboxed cloud storage for customer KYC, agreements, inspection photos, and quotes.',
    icon: HardDrive,
    colorClass: 'text-blue-500 dark:text-blue-400',
    bgLightClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
  },
  {
    id: 'sheets',
    featureKey: 'SHEETS',
    name: 'Google Sheets',
    tagline: 'Import and export leads',
    description: '1-click export of CRM leads with formatted headers and schemas, or batch import leads from spreadsheets.',
    icon: FileSpreadsheet,
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    bgLightClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
  },
];

export function GoogleWorkspacePanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('overview');

  // Overall status
  const [statusMap, setStatusMap] = useState<GoogleStatusMap>({});
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync active tab with search parameters if provided
  useEffect(() => {
    const tabParam = searchParams.get('tab')?.toLowerCase();
    const connectedParam = searchParams.get('connected')?.toLowerCase();
    const statusParam = searchParams.get('status');
    const errorParam = searchParams.get('error') || searchParams.get('googleError');

    if (errorParam) {
      setError(`Google authorization error: ${decodeURIComponent(errorParam)}`);
    }

    if (connectedParam) {
      setMessage(`Successfully linked Google ${connectedParam.toUpperCase()}${statusParam === 'partial' ? ' (partial permissions)' : ''}.`);
    }

    // Determine target tab from parameters
    const target = tabParam || (connectedParam === 'calendar' ? 'meet' : connectedParam);
    if (target && ['overview', 'gmail', 'contacts', 'tasks', 'meet', 'drive', 'sheets'].includes(target)) {
      setActiveTab(target as WorkspaceTabId);
    }
  }, [searchParams]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const [allStatusRes, gmailRes] = await Promise.all([
        fetchGoogleIntegrationStatus(),
        fetchGmailStatus(),
      ]);

      if (allStatusRes.data) {
        setStatusMap(allStatusRes.data);
      }
      if (gmailRes.data?.connected && gmailRes.data.email) {
        setConnectedEmail(gmailRes.data.email);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // Determine if at least one service is connected
  const isAnyConnected = useMemo(() => {
    return Object.values(statusMap).some(s => s === 'CONNECTED');
  }, [statusMap]);

  // Count active services
  const connectedCount = useMemo(() => {
    return Object.values(statusMap).filter(s => s === 'CONNECTED').length;
  }, [statusMap]);

  const handleConnectMaster = async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetchGoogleAuthUrl('GMAIL');
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError(res.error || 'Failed to initiate Google authorization.');
        setConnecting(false);
      }
    } catch (e: any) {
      setError(e?.message || 'Error redirecting to Google.');
      setConnecting(false);
    }
  };

  const handleDisconnectAll = async () => {
    setDisconnecting(true);
    setDisconnectModalOpen(false);
    setError(null);
    try {
      const features: GoogleFeature[] = ['CALENDAR', 'GMAIL', 'CONTACTS', 'TASKS', 'DRIVE', 'SHEETS'];
      for (const f of features) {
        if (statusMap[f] === 'CONNECTED') {
          await disconnectGoogleIntegration(f);
        }
      }
      setMessage('Google Workspace disconnected successfully.');
      setConnectedEmail(null);
      await loadStatus();
    } catch (e: any) {
      setError(e?.message || 'Failed to disconnect Google Workspace.');
    } finally {
      setDisconnecting(false);
    }
  };

  const selectTab = (tab: WorkspaceTabId) => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.set('tab', tab);
      return n;
    });
  };

  const isServiceConnected = (featureKey: GoogleFeature) => {
    return statusMap[featureKey] === 'CONNECTED';
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Top Header ── */}
      <PanelHeader
        title="Google Workspace"
        description="Connect and manage all Google services from one place with centralized OAuth security and per-tenant isolation."
        icon={<Globe className="w-5 h-5 text-primary-500" />}
      />

      {/* ── Security / Architecture Pills ── */}
      <div className="flex flex-wrap items-center gap-2 -mt-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
          <Database className="w-3.5 h-3.5" /> Unified Google Suite
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-ink-800 text-secondary-c border border-base-c">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> OAuth 2.0 PKCE
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-ink-800 text-secondary-c border border-base-c">
          <Lock className="w-3.5 h-3.5 text-blue-500" /> AES-256-GCM Tokens
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-ink-800 text-secondary-c border border-base-c">
          Tenant Isolated
        </span>
      </div>

      {/* ── Notifications ── */}
      {message && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <span className="font-medium">{message}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200 text-xs font-semibold uppercase px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 text-xs font-semibold uppercase px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Connected Google Account Header Banner ── */}
      <GlassCard className="p-6 border border-base-c relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-3 text-sm text-secondary-c">Checking Google Workspace connection...</span>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary-500/20 via-primary-500/10 to-transparent border border-primary-500/30 text-primary-600 dark:text-primary-400 shadow-sm">
                  <Globe className="w-7 h-7" />
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-ink-900 ${
                    isAnyConnected ? 'bg-emerald-500 shadow-sm' : 'bg-slate-400'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-primary-c">Connected Google Account</h3>
                  <Badge variant={isAnyConnected ? 'success' : 'neutral'}>
                    {isAnyConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-primary-c mt-0.5">
                  {connectedEmail ? connectedEmail : isAnyConnected ? 'Google Workspace Account Active' : 'No account linked yet'}
                </p>
                <p className="text-xs text-secondary-c mt-1 max-w-xl leading-relaxed">
                  {isAnyConnected
                    ? `${connectedCount} of 6 Google services connected. All sync actions and file transfers use sandboxed OAuth tokens with auto-refresh.`
                    : 'Connect your Google account once to unlock Gmail, Contacts sync, Tasks, Google Meet, Drive storage, and Sheets exports.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={loadStatus}
                className="btn-secondary text-xs h-9 px-3 flex items-center gap-1.5"
                title="Refresh Google status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>

              {isAnyConnected ? (
                <button
                  type="button"
                  onClick={() => setDisconnectModalOpen(true)}
                  disabled={disconnecting}
                  className="btn-secondary text-xs h-9 px-3.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30 flex items-center gap-1.5"
                >
                  {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                  <span>Disconnect Google</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectMaster}
                  disabled={connecting}
                  className="btn-primary text-xs h-9 px-4 flex items-center gap-2"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  <span>Connect Google Account</span>
                </button>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── Responsive Tab Navigation ── */}
      <div className="border-b border-base-c overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1 min-w-max pb-1" aria-label="Google Workspace Tabs">
          {/* Overview Tab */}
          <button
            onClick={() => selectTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20'
                : 'text-secondary-c hover:text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          {/* Individual Service Tabs */}
          {SERVICES.map(service => {
            const Icon = service.icon;
            const connected = isServiceConnected(service.featureKey);
            const isActive = activeTab === service.id;

            return (
              <button
                key={service.id}
                onClick={() => selectTab(service.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20'
                    : 'text-secondary-c hover:text-primary-c hover:bg-slate-100 dark:hover:bg-ink-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-500' : ''}`} />
                <span>{service.name.replace('Google ', '')}</span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    connected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-ink-600'
                  }`}
                  title={connected ? 'Connected' : 'Not Connected'}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── TAB 1: OVERVIEW DASHBOARD ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h4 className="text-sm font-bold text-primary-c">Services</h4>
            <p className="text-xs text-secondary-c mt-0.5">
              Available Google Workspace services and real-time connection status
            </p>
          </div>

          {/* 6 Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map(service => {
              const Icon = service.icon;
              const connected = isServiceConnected(service.featureKey);

              return (
                <div
                  key={service.id}
                  className="rounded-2xl border border-base-c bg-card-c p-5 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className={`p-2.5 rounded-xl ${service.bgLightClass} ${service.borderClass} border`}>
                        <Icon className={`w-5 h-5 ${service.colorClass}`} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-c'
                          }`}
                        >
                          {connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    </div>

                    <h5 className="text-sm font-bold text-primary-c">{service.name}</h5>
                    <p className="text-xs font-medium text-secondary-c mt-0.5">{service.tagline}</p>
                    <p className="text-xs text-muted-c mt-2 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-base-c flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted-c uppercase">
                      {service.featureKey}
                    </span>
                    <button
                      type="button"
                      onClick={() => selectTab(service.id)}
                      className="btn-secondary text-xs h-8 px-3 flex items-center gap-1.5 group-hover:border-primary-500/40 group-hover:text-primary-600 transition-colors"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Security & Architecture Box */}
          <SectionCard>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-1">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-primary-c">Enterprise Security Architecture</h5>
                  <p className="text-xs text-secondary-c mt-0.5 max-w-2xl leading-relaxed">
                    All Google Workspace OAuth tokens are encrypted using AES-256-GCM authenticated encryption before persistence. Each tenant operates in complete sandbox isolation, preventing cross-tenant access. Scope access is bounded to minimum operational requirements.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5" /> Tokens Encrypted
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                  <Check className="w-3.5 h-3.5" /> Auto-Refresh Active
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── TAB 2: GMAIL ── */}
      {activeTab === 'gmail' && (
        <div className="animate-in fade-in duration-200">
          <GmailIntegrationPanel embedded />
        </div>
      )}

      {/* ── TAB 3: CONTACTS ── */}
      {activeTab === 'contacts' && (
        <div className="animate-in fade-in duration-200">
          <GoogleContactsPanel embedded />
        </div>
      )}

      {/* ── TAB 4: TASKS ── */}
      {activeTab === 'tasks' && (
        <div className="animate-in fade-in duration-200">
          <GoogleTasksPanel embedded />
        </div>
      )}

      {/* ── TAB 5: MEET (CALENDAR) ── */}
      {activeTab === 'meet' && (
        <div className="animate-in fade-in duration-200">
          <GoogleCalendarPanel embedded />
        </div>
      )}

      {/* ── TAB 6: DRIVE ── */}
      {activeTab === 'drive' && (
        <div className="animate-in fade-in duration-200">
          <GoogleDrivePanel embedded />
        </div>
      )}

      {/* ── TAB 7: SHEETS ── */}
      {activeTab === 'sheets' && (
        <div className="animate-in fade-in duration-200">
          <GoogleSheetsPanel embedded />
        </div>
      )}

      {/* Disconnect Google Confirmation Modal */}
      <ConfirmModal
        open={disconnectModalOpen}
        title="Disconnect Google Workspace"
        message="Are you sure you want to disconnect Google Workspace? This will revoke active OAuth credentials across all connected Google features (Gmail, Contacts, Tasks, Meet, Drive, Sheets). Existing CRM data and logs will remain preserved."
        confirmLabel="Disconnect All"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDisconnectAll}
        onCancel={() => setDisconnectModalOpen(false)}
      />
    </div>
  );
}
