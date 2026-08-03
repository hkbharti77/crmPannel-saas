import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  CAMPAIGN_STATUS_META,
  type Campaign,
} from './emailData';
import {
  fetchEmailCampaigns,
  type CustomEmailDTO,
} from '@/lib/emailsApi';
import { CampaignDetailsPanel } from './CampaignDetailsPanel';
import { EmailTemplatesPanel } from '@/components/settings/panels/EmailTemplatesPanel';
import {
  Mail,
  Plus,
  Search,
  Clock,
  Users,
  MailOpen,
  MousePointerClick,
  Inbox,
  Loader2,
  AlertTriangle,
  Megaphone,
  FileText,
} from 'lucide-react';

type Tab = 'campaigns' | 'compose';

function mapDtoToCampaign(dto: CustomEmailDTO): Campaign {
  let status: Campaign['status'] = 'sent';
  if (dto.status === 'DRAFT') status = 'draft';
  else if (dto.status === 'SCHEDULED') status = 'scheduled';
  else if (dto.status === 'SENDING') status = 'sending';
  else if (dto.status === 'PAUSED') status = 'paused';
  else if (dto.status === 'CANCELLED') status = 'cancelled';
  else if (dto.status === 'COMPLETED') status = 'completed';
  else if (dto.status === 'FAILED') status = 'failed';
  else if (dto.status === 'SENT') status = 'sent';

  const formatDate = (dStr?: string) => dStr ? new Date(dStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : undefined;

  return {
    id: dto.id,
    name: dto.subject,
    subject: dto.subject,
    status,
    recipients: dto.totalRecipients || dto.totalSent || 0,
    totalRecipients: dto.totalRecipients,
    processedRecipients: dto.processedRecipients,
    totalSent: dto.totalSent,
    totalFailed: dto.totalFailed,
    openRate: dto.openRate || 0,
    clickRate: dto.clickRate || 0,
    uniqueOpens: dto.uniqueOpens || 0,
    uniqueClicks: dto.uniqueClicks || 0,
    bounces: dto.bounces || 0,
    unsubscribes: dto.unsubscribes || 0,
    clickToOpenRate: dto.clickToOpenRate || 0,
    bounceRate: dto.bounceRate || 0,
    unsubscribeRate: dto.unsubscribeRate || 0,
    createdAt: dto.createdAt,
    sentAt: formatDate(dto.sentAt) || formatDate(dto.createdAt) || 'Just now',
    scheduledAt: formatDate(dto.scheduledAt),
    startedAt: formatDate(dto.startedAt),
    completedAt: formatDate(dto.completedAt),
    pausedAt: formatDate(dto.pausedAt),
    cancelledAt: formatDate(dto.cancelledAt),
    template: dto.recipientMode ? `Mode: ${dto.recipientMode}` : 'Custom Email',
  };
}

export function EmailsView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlTab = searchParams.get('tab');
  const initialTab: Tab = urlTab === 'templates' || urlTab === 'compose' ? 'compose' : 'campaigns';

  const [tab, setTabState] = useState<Tab>(initialTab);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [createTemplateTrigger, setCreateTemplateTrigger] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    if (urlTab === 'templates' || urlTab === 'compose') {
      setTabState('compose');
    } else if (!urlTab) {
      setTabState('campaigns');
    }
  }, [urlTab]);

  const setTab = (newTab: Tab) => {
    setTabState(newTab);
    if (newTab === 'compose') {
      setSearchParams({ tab: 'templates' });
    } else {
      setSearchParams({});
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    const cmpRes = await fetchEmailCampaigns(0, 100);

    if (cmpRes.error) {
      setApiError(cmpRes.error);
      setCampaigns([]);
    } else if (cmpRes.data) {
      setCampaigns(cmpRes.data.content.map(mapDtoToCampaign));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return campaigns.filter(
      (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase()),
    );
  }, [campaigns, search]);

  const totalSent = campaigns.reduce((s, c) => s + (c.totalSent || 0), 0);
  const totalRecipients = campaigns.reduce((s, c) => s + (c.totalRecipients || c.totalSent || c.recipients || 0), 0);
  
  const sentCampaigns = campaigns.filter(c => c.status === 'sent' || c.status === 'completed');
  const avgOpen = sentCampaigns.length > 0 
    ? Math.round(sentCampaigns.reduce((s, c) => s + c.openRate, 0) / sentCampaigns.length)
    : 0;
  
  const scheduled = campaigns.filter((c) => c.status === 'scheduled').length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
      {selectedCampaignId ? (
        <CampaignDetailsPanel 
          campaignId={selectedCampaignId} 
          onBack={() => {
            setSelectedCampaignId(null);
            loadData();
          }} 
        />
      ) : (
        <>
          {/* Header - Only render when not in full editor mode */}
          {!isEditorOpen && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary-c">
                  {tab === 'campaigns' ? 'Email Marketing' : 'Email Templates'}
                </h1>
                <p className="text-sm text-secondary-c">
                  {tab === 'campaigns'
                    ? 'Create, send, and track email campaigns & custom HTML templates.'
                    : 'Create, manage, preview, and reuse templates across your email campaigns.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin text-primary-500" />}
                {tab === 'campaigns' ? (
                  <button
                    onClick={() => navigate('/emails/create')}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-accent px-4 py-2.5 text-xs font-bold text-white transition-transform hover:scale-105 shadow-md"
                  >
                    <Plus className="h-4 w-4" /> New Campaign
                  </button>
                ) : (
                  <button
                    onClick={() => setCreateTemplateTrigger((prev) => prev + 1)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-accent px-4 py-2.5 text-xs font-bold text-white transition-transform hover:scale-105 shadow-md"
                  >
                    <Plus className="h-4 w-4" /> Create Template
                  </button>
                )}
              </div>
            </div>
          )}

          {apiError && (
            <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Backend Connection Error: {apiError}. Make sure backend is running and authenticated.</span>
            </div>
          )}

          {/* Stats - Shown exclusively on Campaigns tab */}
          {tab === 'campaigns' && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Megaphone} label="Total Emails Sent" value={String(totalSent)} color="#2563EB" bg="rgba(37,99,235,0.10)" sub="All time" />
              <StatCard icon={Users} label="Total Recipients" value={totalRecipients.toLocaleString()} color="#7C3AED" bg="rgba(124,58,237,0.10)" sub="Reached" />
              <div title="Open tracking may be affected by privacy proxies and image blocking">
                <StatCard icon={MailOpen} label="Avg Open Rate" value={`${avgOpen}%`} color="#10B981" bg="rgba(16,185,129,0.10)" sub="Estimated engagement" />
              </div>
              <StatCard icon={Clock} label="Scheduled" value={String(scheduled)} color="#F59E0B" bg="rgba(245,158,11,0.10)" sub="Pending send" />
            </div>
          )}

          {/* Tabs - Only show when not in editor mode */}
          {!isEditorOpen && (
            <div className="flex items-center gap-1 rounded-2xl border border-base-c bg-card-c p-1.5 shadow-xs">
              <TabButton active={tab === 'campaigns'} onClick={() => setTab('campaigns')} icon={Inbox} label="Campaigns" count={campaigns.length} />
              <TabButton active={tab === 'compose'} onClick={() => setTab('compose')} icon={FileText} label="Email Templates" />
            </div>
          )}

          {/* Content */}
          {tab === 'campaigns' ? (
            <CampaignList campaigns={filtered} search={search} setSearch={setSearch} loading={loading} onRefresh={loadData} onViewDetails={setSelectedCampaignId} />
          ) : (
            <div className="pt-1 animate-fade-in">
              <EmailTemplatesPanel createTrigger={createTemplateTrigger} onEditorStateChange={setIsEditorOpen} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, color, bg, sub }: { icon: typeof Mail; label: string; value: string; color: string; bg: string; sub: string }) {
  return (
    <GlassCard className="flex items-center gap-3 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl2" style={{ backgroundColor: bg }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-secondary-c">{label}</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums text-primary-c">{value}</p>
        <p className="text-[10px] text-muted-c">{sub}</p>
      </div>
    </GlassCard>
  );
}

/* ─── Tab Button ─── */
function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: typeof Mail; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
        active ? 'bg-gradient-accent text-white shadow-soft' : 'text-secondary-c hover:text-primary-c',
      )}
    >
      <Icon className="h-4 w-4" /> {label}
      <span className={cx('rounded-full px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-white/20' : 'bg-slate-200 dark:bg-ink-800')}>
        {count}
      </span>
    </button>
  );
}

/* ─── Campaign List ─── */
function CampaignList({ campaigns, search, setSearch, loading, onRefresh, onViewDetails }: { campaigns: Campaign[]; search: string; setSearch: (v: string) => void; loading: boolean; onRefresh: () => void; onViewDetails: (id: string) => void }) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns…"
            className="form-input pl-9 h-10"
          />
        </div>
      </div>

      {loading && campaigns.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-3 text-xs text-muted-c">Loading email campaigns from backend…</p>
        </GlassCard>
      ) : campaigns.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-12">
          <Inbox className="h-10 w-10 text-muted-c/30" />
          <p className="mt-3 text-sm text-muted-c">No email campaigns found</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-base-c">
              <thead className="bg-slate-50/50 dark:bg-ink-800/20">
                <tr>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-secondary-c">Campaign Name</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-secondary-c">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-secondary-c">Date</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-secondary-c">Audience</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-secondary-c">Performance</th>
                  <th scope="col" className="relative px-5 py-3.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-c bg-transparent">
                {campaigns.map((c) => (
                  <CampaignRow key={c.id} campaign={c} onRefresh={onRefresh} onViewDetails={() => onViewDetails(c.id)} />
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function CampaignRow({ campaign, onRefresh, onViewDetails }: { campaign: Campaign; onRefresh: () => void; onViewDetails: () => void }) {
  const meta = CAMPAIGN_STATUS_META[campaign.status] || CAMPAIGN_STATUS_META.sent;
  
  return (
    <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-ink-800/80">
      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-primary-c">{campaign.name}</span>
          <span className="mt-0.5 truncate text-xs text-secondary-c max-w-[200px]" title={campaign.subject}>{campaign.subject}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex items-center gap-2">
          <span className={cx('h-2 w-2 rounded-full', meta.dot)} />
          <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase', meta.color)}>
            {meta.label}
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex flex-col">
          <span className="text-sm text-secondary-c">{campaign.status === 'scheduled' ? campaign.scheduledAt : campaign.sentAt}</span>
          <span className="text-[10px] text-muted-c">{campaign.status === 'scheduled' ? 'Scheduled' : 'Sent'}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-muted-c" />
          <span className="text-sm font-medium text-primary-c">{campaign.recipients.toLocaleString()}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex items-center gap-4">
          <Metric inline icon={MailOpen} label="Open" value={`${campaign.openRate}%`} highlight={campaign.openRate >= 60} />
          <Metric inline icon={MousePointerClick} label="Click" value={`${campaign.clickRate}%`} highlight={campaign.clickRate >= 20} />
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium">
        <button 
          onClick={onViewDetails}
          className="inline-flex items-center gap-1.5 rounded-md border border-base-c bg-white px-3 py-1.5 text-xs font-semibold text-secondary-c shadow-sm hover:bg-slate-50 hover:text-primary-c focus:outline-none dark:bg-ink-850 dark:hover:bg-ink-800"
        >
          View Details
        </button>
      </td>
    </tr>
  );
}

function Metric({ inline, icon: Icon, label, value, highlight }: { inline?: boolean; icon: typeof Mail; label: string; value: string; highlight?: boolean }) {
  if (inline) {
    return (
      <div className="flex items-center gap-1.5">
        <Icon className={cx('h-3.5 w-3.5', highlight ? 'text-success-500' : 'text-muted-c')} />
        <span className={cx('text-xs font-semibold', highlight ? 'text-success-600 dark:text-success-400' : 'text-primary-c')}>{value}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cx('h-3.5 w-3.5', highlight ? 'text-success-500' : 'text-muted-c')} />
      <span className="text-[10px] text-muted-c">{label}</span>
      <span className={cx('text-xs font-semibold', highlight ? 'text-success-600 dark:text-success-400' : 'text-primary-c')}>{value}</span>
    </div>
  );
}

/* ─── Template Gallery ─── */
function TemplateGallery({ templates, loading }: { templates: EmailTemplate[]; loading: boolean }) {
  if (loading && templates.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-xs text-muted-c">Loading email templates…</p>
      </GlassCard>
    );
  }

  if (templates.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-12">
        <FileText className="h-10 w-10 text-muted-c/30" />
        <p className="mt-3 text-sm text-muted-c">No email templates found</p>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {templates.map((tpl) => {
        const catMeta = TEMPLATE_CATEGORY_META[tpl.category] || TEMPLATE_CATEGORY_META.follow_up;
        return (
          <GlassCard key={tpl.id} className="group p-4 transition-all hover:shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl2 bg-gradient-accent-soft">
                  <FileText className="h-4.5 w-4.5 text-secondary-600 dark:text-secondary-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-primary-c">{tpl.name}</h4>
                  <span className={cx('mt-0.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold', catMeta.color)}>
                    {catMeta.label}
                  </span>
                </div>
              </div>
              <button className="opacity-0 transition-opacity group-hover:opacity-100">
                <Copy className="h-3.5 w-3.5 text-muted-c hover:text-primary-c" />
              </button>
            </div>
            <p className="mt-3 text-xs font-medium text-secondary-c">{tpl.subject}</p>
            <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-muted-c">{tpl.body}</p>
          </GlassCard>
        );
      })}
    </div>
  );
}
