import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchEmailCampaigns } from '@/lib/emailsApi';
import { Campaign, CAMPAIGN_STATUS_META } from './emailData';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { CampaignDetailsPanel } from './CampaignDetailsPanel';
import { EmailTemplatesPanel } from './EmailTemplatesPanel';
import { SuppressionListPanel } from './SuppressionListPanel';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import {
  Mail,
  LayoutTemplate,
  Search,
  Filter,
  MousePointerClick,
  MailOpen,
  BarChart3,
  AlertCircle,
  Plus,
  ArrowRight,
  X,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Send,
  CheckCircle2,
  Inbox,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export function EmailsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL State mapping
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'templates' ? 'templates' : tabParam === 'suppressions' ? 'suppressions' : 'campaigns';
  const selectedCampaignId = searchParams.get('id');

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadData = async () => {
    if (activeTab !== 'campaigns') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchEmailCampaigns(0, 100);
      if (res.error) throw new Error(res.error);
      if (res.data) {
        const mapped: Campaign[] = (res.data.content as Record<string, unknown>[]).map((dto) => {
          let status: Campaign['status'] = 'draft';
          if (dto.status === 'SENT') status = 'sent';
          else if (dto.status === 'SCHEDULED') status = 'scheduled';
          else if (dto.status === 'SENDING') status = 'sending';
          else if (dto.status === 'PAUSED') status = 'paused';
          else if (dto.status === 'CANCELLED') status = 'cancelled';
          else if (dto.status === 'COMPLETED') status = 'completed';
          else if (dto.status === 'FAILED') status = 'failed';
          else if (dto.status === 'UNKNOWN') status = 'unknown';
          return {
            id: String(dto.id),
            name: String(dto.name || dto.subject || ''),
            subject: String(dto.subject || ''),
            status,
            recipients: Number(dto.totalRecipients || 0),
            totalRecipients: Number(dto.totalRecipients || 0),
            processedRecipients: Number(dto.processedRecipients || 0),
            totalSent: Number(dto.totalSent || 0),
            totalFailed: Number(dto.totalFailed || 0),
            openRate: Number(dto.openRate || 0),
            clickRate: Number(dto.clickRate || 0),
            uniqueOpens: Number(dto.uniqueOpens || 0),
            uniqueClicks: Number(dto.uniqueClicks || 0),
            bounces: Number(dto.bounces || 0),
            unsubscribes: Number(dto.unsubscribes || 0),
            createdAt: String(dto.createdAt || ''),
            sentAt: dto.sentAt ? String(dto.sentAt) : undefined,
            template: String(dto.recipientMode || 'Manual'),
          };
        });
        setCampaigns(mapped);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load email campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleTabChange = (tab: 'campaigns' | 'templates' | 'suppressions') => {
    setSearchParams(tab === 'campaigns' ? {} : { tab });
  };

  const metrics = useMemo(() => {
    const totalSent = campaigns.reduce((acc, c) => acc + (c.totalSent || 0), 0);
    const validRateCampaigns = campaigns.filter((c) => typeof c.openRate === 'number' && !isNaN(c.openRate));
    const avgOpenRate =
      validRateCampaigns.length > 0
        ? Math.round(validRateCampaigns.reduce((acc, c) => acc + (c.openRate || 0), 0) / validRateCampaigns.length)
        : 0;
    const avgClickRate =
      validRateCampaigns.length > 0
        ? Math.round(validRateCampaigns.reduce((acc, c) => acc + (c.clickRate || 0), 0) / validRateCampaigns.length)
        : 0;

    return { totalSent, avgOpenRate, avgClickRate, avgOpen: avgOpenRate, avgClick: avgClickRate };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.subject.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || c.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [campaigns, search, statusFilter]);

  if (selectedCampaignId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <CampaignDetailsPanel
          campaignId={selectedCampaignId}
          onBack={() => {
            searchParams.delete('id');
            setSearchParams(searchParams);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-600/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-md shadow-blue-500/5">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-primary-c">Email Center & Outbound Campaigns</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                SMTP / SES Ready
              </span>
            </div>
            <p className="mt-0.5 text-xs text-secondary-c">
              Design HTML templates, dispatch high-volume broadcasts & track deliverability engagement analytics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <TabSwitcher
            tabs={[
              { id: 'campaigns', label: `Campaigns (${campaigns.length})`, icon: <Mail className="h-4 w-4" /> },
              { id: 'templates', label: 'HTML Templates', icon: <LayoutTemplate className="h-4 w-4" /> },
              { id: 'suppressions', label: 'Suppression List', icon: <ShieldAlert className="h-4 w-4" /> },
            ]}
            activeTab={activeTab}
            onChange={(id) => handleTabChange(id as 'campaigns' | 'templates' | 'suppressions')}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 rounded-2xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}

      {/* Campaigns Tab Content */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Executive KPI Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-5 relative overflow-hidden group transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/15 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Total Emails Dispatched</p>
                    <p className="text-2xl font-bold tabular-nums text-primary-c tracking-tight mt-0.5">
                      {loading ? '-' : metrics.totalSent.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-blue-600 bg-blue-500/10">
                  {campaigns.length} Campaigns
                </span>
              </div>
            </GlassCard>

            <GlassCard className="p-5 relative overflow-hidden group transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/15 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <MailOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Average Open Rate</p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <p className="text-2xl font-bold tabular-nums text-primary-c tracking-tight">
                        {loading ? '-' : `${metrics.avgOpen}`}
                      </p>
                      <span className="text-sm font-bold text-muted-c">%</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-emerald-600 bg-emerald-500/10">
                  Benchmark: ~22%
                </span>
              </div>
            </GlassCard>

            <GlassCard className="p-5 relative overflow-hidden group transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/15 rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <MousePointerClick className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Average Click-Through Rate</p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <p className="text-2xl font-bold tabular-nums text-primary-c tracking-tight">
                        {loading ? '-' : `${metrics.avgClick}`}
                      </p>
                      <span className="text-sm font-bold text-muted-c">%</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md text-purple-600 bg-purple-500/10">
                  Link Engagements
                </span>
              </div>
            </GlassCard>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card-c p-3 rounded-2xl border border-base-c shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-c" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by campaign name or subject line..."
                className="w-full pl-10 pr-8 py-2 bg-transparent text-xs text-primary-c focus:outline-none placeholder:text-muted-c font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-c hover:text-primary-c"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-c shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-base-c bg-card-c px-3 py-1.5 text-xs text-secondary-c focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">All Statuses ({campaigns.length})</option>
                  <option value="sent">Sent / Completed</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sending">Sending</option>
                  <option value="paused">Paused</option>
                  <option value="draft">Draft</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="w-px h-6 bg-base-c hidden sm:block" />

              <button
                onClick={() => navigate('/emails/create')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-soft transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New Campaign</span>
              </button>
            </div>
          </div>

          {/* Campaigns List */}
          <div className="space-y-3">
            {loading ? (
              <GlassCard className="flex flex-col items-center justify-center py-20">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-3" />
                <p className="font-bold text-xs text-primary-c">Loading email campaigns...</p>
              </GlassCard>
            ) : filteredCampaigns.length === 0 ? (
              <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-ink-850 flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-base font-bold text-primary-c">No email campaigns found</h3>
                <p className="text-xs text-secondary-c mt-1 max-w-sm">
                  {search ? 'No campaigns match your search filters.' : 'Launch your first outbound email campaign and start tracking delivery analytics.'}
                </p>
                <button
                  onClick={() => navigate('/emails/create')}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-soft transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create First Campaign</span>
                </button>
              </GlassCard>
            ) : (
              filteredCampaigns.map((campaign) => {
                const meta = CAMPAIGN_STATUS_META[campaign.status] || CAMPAIGN_STATUS_META.draft;
                return (
                  <GlassCard
                    key={campaign.id}
                    className="p-4 sm:p-5 hover:border-blue-500/40 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden"
                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams.entries()), id: campaign.id })}
                  >
                    {/* Left: Icon & Title */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative shrink-0 h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-600/5 flex items-center justify-center ring-1 ring-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div className={cx('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card-c shadow-xs', meta.dot)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-primary-c text-sm group-hover:text-blue-600 transition-colors truncate">{campaign.name}</h3>
                          <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0', meta.color)}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-c mt-0.5 truncate max-w-md">{campaign.subject}</p>
                      </div>
                    </div>

                    {/* Middle: Stats Pillars */}
                    <div className="flex items-center gap-6 sm:gap-8 sm:px-8 sm:border-x border-base-c border-dashed shrink-0">
                      <div className="flex flex-col items-start sm:items-center">
                        <span className="text-[9px] uppercase font-bold text-muted-c tracking-wider mb-1">Delivered</span>
                        <span className="font-bold text-primary-c text-base tabular-nums leading-none">{campaign.totalSent || 0}</span>
                      </div>
                      <div className="flex flex-col items-start sm:items-center">
                        <span className="text-[9px] uppercase font-bold text-muted-c tracking-wider mb-1">Open Rate</span>
                        <div className="flex items-baseline gap-1 leading-none">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base tabular-nums">{campaign.openRate || 0}</span>
                          <span className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70">%</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-center">
                        <span className="text-[9px] uppercase font-bold text-muted-c tracking-wider mb-1">Clicks</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400 text-base tabular-nums leading-none">{campaign.uniqueClicks || 0}</span>
                      </div>
                    </div>

                    {/* Right: Action Arrow */}
                    <div className="flex items-center justify-end shrink-0">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-ink-800 flex items-center justify-center text-muted-c group-hover:bg-blue-50 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all transform group-hover:translate-x-0.5 border border-base-c group-hover:border-blue-500/30">
                        <ArrowRight className="h-4.5 w-4.5" />
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Templates Tab Content */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <EmailTemplatesPanel />
        </div>
      )}

      {/* Suppressions Tab Content */}
      {activeTab === 'suppressions' && (
        <div className="space-y-6">
          <SuppressionListPanel />
        </div>
      )}
    </div>
  );
}

export default EmailsView;
