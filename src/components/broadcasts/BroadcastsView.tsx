import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/ui/primitives';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { cx } from '@/lib/types';
import {
  STATUS_META,
  type Broadcast,
  type BroadcastStatus,
} from './broadcastData';
import {
  fetchCampaigns,
  cancelCampaign,
  deleteCampaign,
  deleteAllCampaigns,
  fetchWhatsAppTemplates,
  deleteWhatsAppTemplate,
  fetchCampaignRecipients,
  fetchCampaignAbMetrics,
  promoteAbWinner,
  type WhatsAppTemplateDto,
  type WhatsAppCampaignRecipientDto,
  type CampaignAbMetricsDto,
} from '@/lib/broadcastsApi';
import { fetchLeadsPaged } from '@/lib/leadsApi';
import {
  Plus,
  Search,
  Send,
  Users,
  CheckCircle2,
  Reply,
  Megaphone,
  Filter,
  Trash2,
  ChevronRight,
  PhoneCall,
  FileText,
  RefreshCw,
  Loader2,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Check,
  Video,
  Phone,
  LayoutTemplate,
  Smartphone,
  ChevronLeft,
  MoreVertical,
  Edit3,
  TrendingUp,
  Sparkles,
  X,
  ShieldCheck,
  Zap,
  Clock,
  Calendar,
  Split,
  Trophy,
} from 'lucide-react';
import { TabSwitcher } from '@/components/ui/TabSwitcher';
import { EditBroadcastModal } from './EditBroadcastModal';

type FilterStatus = BroadcastStatus | 'ALL';
type MainTab = 'broadcasts' | 'templates';

/* ─── WhatsApp Text Formatter Helper ─── */
function renderWhatsAppFormattedText(text: string) {
  if (!text) return <span className="text-slate-400 dark:text-slate-500 italic">Body message content preview...</span>;

  const lines = text.split('\n');

  return lines.map((line, lIdx) => {
    const parts: (string | JSX.Element)[] = [];
    const regex = /(\{\{\d+\}\})|(\*[^*]+\*)|(_[^_]+_)|(~[^~]+~)|(`[^`]+`)/g;
    let match;
    let lastIdx = 0;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push(line.substring(lastIdx, match.index));
      }

      const val = match[0];
      if (val.startsWith('{{')) {
        parts.push(
          <span key={match.index} className="mx-0.5 inline-block rounded bg-emerald-500/20 px-1 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
            {val}
          </span>
        );
      } else if (val.startsWith('*') && val.endsWith('*')) {
        parts.push(<strong key={match.index} className="font-bold text-slate-900 dark:text-white">{val.slice(1, -1)}</strong>);
      } else if (val.startsWith('_') && val.endsWith('_')) {
        parts.push(<em key={match.index} className="italic text-slate-800 dark:text-slate-200">{val.slice(1, -1)}</em>);
      } else if (val.startsWith('~') && val.endsWith('~')) {
        parts.push(<del key={match.index} className="line-through text-slate-500">{val.slice(1, -1)}</del>);
      } else if (val.startsWith('`') && val.endsWith('`')) {
        parts.push(<code key={match.index} className="rounded bg-slate-200 dark:bg-ink-800 px-1 font-mono text-[11px] text-pink-600 dark:text-pink-400">{val.slice(1, -1)}</code>);
      } else {
        parts.push(val);
      }

      lastIdx = regex.lastIndex;
    }

    if (lastIdx < line.length) {
      parts.push(line.substring(lastIdx));
    }

    return (
      <span key={lIdx} className="block min-h-[1.2em]">
        {parts.length > 0 ? parts : line}
      </span>
    );
  });
}

export function BroadcastsView() {
  const [tab, setTab] = useState<MainTab>('broadcasts');
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const navigate = useNavigate();
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templates, setTemplates] = useState<WhatsAppTemplateDto[]>([]);

  const loadData = useCallback(async () => {
    const [campRes, tmplRes] = await Promise.all([
      fetchCampaigns(0, 50),
      fetchWhatsAppTemplates(),
      fetchLeadsPaged(0, 100),
    ]);

    if (tmplRes.data) {
      setTemplates(tmplRes.data);
    }

    if (campRes.data && campRes.data.content && campRes.data.content.length > 0) {
      const converted: Broadcast[] = campRes.data.content.map((c) => {
        const recipients = c.totalRecipients || 0;
        return {
          id: c.id,
          title: c.name,
          message: `Template ID: ${c.templateId || 'General Bulk'}`,
          audience: c.targetType === 'QUALIFIED_LEADS' ? 'Qualified Leads' : c.targetType === 'VIP_CLIENTS' ? 'VIP Clients' : 'All Leads',
          recipients: recipients,
          channel: 'whatsapp',
          status: (c.status?.toLowerCase() as Broadcast['status']) || 'sent',
          sentAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Recently',
          scheduledAt: c.scheduleTime,
          delivered: c.deliveredCount || 0,
          read: c.readCount || 0,
          responded: c.failedCount || 0,
          clicks: c.trackedLinkClicks || 0,
          ctr: (c.deliveredCount && c.deliveredCount > 0) ? Math.round(((c.trackedLinkClicks || 0) / c.deliveredCount) * 100) : 0,
          template: c.templateId || 'Meta Approved',
          isAbTest: c.isAbTest,
          abStatus: c.abStatus,
          abWinnerMetric: c.abWinnerMetric,
          winningVariantId: c.winningVariantId,
        };
      });
      setBroadcasts(converted);
      if (!selectedId && converted[0]) {
        setSelectedId(converted[0].id);
      }
    } else {
      setBroadcasts([]);
      setSelectedId(null);
    }
  }, [selectedId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncTemplates = async () => {
    setTemplatesLoading(true);
    const res = await fetchWhatsAppTemplates(true);
    setTemplatesLoading(false);
    if (res.data) {
      setTemplates(res.data);
    }
  };

  const filtered = useMemo(
    () =>
      broadcasts.filter((b) => {
        const matchesSearch =
          !search ||
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [broadcasts, search, statusFilter],
  );

  const selected = broadcasts.find((b) => b.id === selectedId) ?? null;

  const stats = useMemo(() => {
    const sent = broadcasts.filter((b) => b.status === 'sent' || b.status === 'completed' || b.status === 'RUNNING');
    const totalRecipients = broadcasts.reduce((s, b) => s + b.recipients, 0);
    const totalDelivered = broadcasts.reduce((s, b) => s + b.delivered, 0);
    const totalRead = broadcasts.reduce((s, b) => s + b.read, 0);
    const totalResponded = broadcasts.reduce((s, b) => s + b.responded, 0);
    const totalClicks = broadcasts.reduce((s, b) => s + (b.clicks || 0), 0);
    return {
      totalSent: sent.length,
      totalRecipients,
      totalClicks,
      deliveryRate: totalRecipients ? Math.round((totalDelivered / totalRecipients) * 100) : 0,
      readRate: totalDelivered ? Math.round((totalRead / totalDelivered) * 100) : 0,
      responseRate: totalRead ? Math.round((totalResponded / totalRead) * 100) : 0,
      ctrRate: totalDelivered ? Math.round((totalClicks / totalDelivered) * 100) : 0,
    };
  }, [broadcasts]);

  const [isClearingAll, setIsClearingAll] = useState(false);
  const [deleteCampaignConfirm, setDeleteCampaignConfirm] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    isAll?: boolean;
  }>({ isOpen: false, id: '', title: '' });

  const handleDelete = (id: string) => {
    const camp = broadcasts.find((b) => b.id === id);
    setDeleteCampaignConfirm({
      isOpen: true,
      id,
      title: camp ? camp.title : 'this campaign',
      isAll: false,
    });
  };

  const handleClearAll = () => {
    setDeleteCampaignConfirm({
      isOpen: true,
      id: 'ALL',
      title: 'ALL broadcast campaigns',
      isAll: true,
    });
  };

  const [cancelCampaignConfirm, setCancelCampaignConfirm] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
  }>({ isOpen: false, id: '', title: '' });

  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null);

  const handleCancelSchedule = (id: string) => {
    const camp = broadcasts.find((b) => b.id === id);
    setCancelCampaignConfirm({
      isOpen: true,
      id,
      title: camp ? camp.title : 'this campaign',
    });
  };

  const confirmCancelCampaign = async () => {
    const { id } = cancelCampaignConfirm;
    setCancelCampaignConfirm({ isOpen: false, id: '', title: '' });
    if (!id) return;
    const res = await cancelCampaign(id);
    if (!res.error) {
      loadData();
    }
  };

  const confirmDeleteCampaign = async () => {
    const { id, isAll } = deleteCampaignConfirm;
    setDeleteCampaignConfirm({ isOpen: false, id: '', title: '' });

    if (isAll) {
      setIsClearingAll(true);
      const res = await deleteAllCampaigns();
      setIsClearingAll(false);
      if (res.success) {
        setBroadcasts([]);
        setSelectedId(null);
      }
    } else if (id) {
      const res = await deleteCampaign(id);
      if (res.success) {
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
        if (selectedId === id) setSelectedId(null);
      }
    }
  };

  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    templateName: string;
  }>({ isOpen: false, templateName: '' });

  const handleDeleteTemplate = (templateName: string) => {
    setDeleteConfirmState({ isOpen: true, templateName });
  };

  const confirmDeleteTemplate = async () => {
    const templateName = deleteConfirmState.templateName;
    setDeleteConfirmState({ isOpen: false, templateName: '' });
    if (!templateName) return;
    const res = await deleteWhatsAppTemplate(templateName);
    if (res.success) {
      setTemplates((prev) => prev.filter((t) => t.name !== templateName));
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/5">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-primary-c">WhatsApp Broadcasts & Meta Campaigns</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Meta Cloud API Active
              </span>
            </div>
            <p className="mt-0.5 text-xs text-secondary-c">
              Dispatch targeted WhatsApp bulk broadcasts, manage Meta-approved templates & track delivery metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {tab === 'broadcasts' ? (
            <div className="flex items-center gap-2">
              {broadcasts.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={isClearingAll}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isClearingAll ? 'Clearing...' : 'Clear All Campaigns'}</span>
                </button>
              )}
              <button
                onClick={() => navigate('/broadcasts/create')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-soft transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New Broadcast</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncTemplates}
                disabled={templatesLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-base-c bg-card-c px-3.5 py-2 text-xs font-bold text-secondary-c hover:text-primary-c hover:border-primary-500/40 shadow-xs transition-all cursor-pointer"
              >
                <RefreshCw className={cx('h-3.5 w-3.5', templatesLoading && 'animate-spin')} />
                <span>Sync with Meta</span>
              </button>
              <button
                onClick={() => navigate('/broadcasts/create-template')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-soft transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <TabSwitcher
        tabs={[
          { id: 'broadcasts', label: `Broadcast Campaigns (${broadcasts.length})`, icon: <Megaphone className="h-4 w-4" /> },
          { id: 'templates', label: `WhatsApp Templates (${templates.length})`, icon: <FileText className="h-4 w-4" /> }
        ]}
        activeTab={tab}
        onChange={(id) => setTab(id as MainTab)}
        className="w-full justify-between [&>button]:flex-1"
      />

      {tab === 'broadcasts' ? (
        <>
          {/* Executive KPI Stats strip */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={Send}
              label="Campaigns Sent"
              value={String(stats.totalSent)}
              badge="+12% this month"
              badgeColor="text-emerald-600 bg-emerald-500/10"
              accent="#2563EB"
            />
            <StatCard
              icon={Users}
              label="Total Audience Reached"
              value={stats.totalRecipients.toLocaleString()}
              badge="Audience Contacts"
              badgeColor="text-purple-600 bg-purple-500/10"
              accent="#7C3AED"
            />
            <StatCard
              icon={CheckCircle2}
              label="Delivery Rate"
              value={`${stats.deliveryRate}%`}
              badge="Handset Delivered"
              badgeColor="text-emerald-600 bg-emerald-500/10"
              accent="#10B981"
            />
            <StatCard
              icon={Reply}
              label="Read & CTR Rate"
              value={`${stats.readRate}% / ${stats.ctrRate}%`}
              badge={`${stats.totalClicks} CTA Clicks`}
              badgeColor="text-blue-600 bg-blue-500/10"
              accent="#2563EB"
            />
          </div>

          {/* Main List + Detail Split Grid Layout */}
          <div className="grid gap-5 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">
            {/* Left Column: Broadcasts Filterable List */}
            <div className="space-y-3.5">
              <div className="space-y-2.5 rounded-2xl border border-base-c bg-card-c p-3.5 shadow-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search campaigns by name or ID…"
                    className="form-input pl-9 pr-8 text-xs h-9"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-c hover:text-primary-c"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 shrink-0 text-muted-c" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                    className="flex-1 rounded-xl border border-base-c bg-card-c px-3 py-1.5 text-xs text-secondary-c focus:border-primary-500 focus:outline-none"
                  >
                    <option value="ALL">All Statuses ({broadcasts.length})</option>
                    <option value="sent">Sent / Completed</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="draft">Draft</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2.5 lg:max-h-[calc(100vh-380px)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
                {filtered.length === 0 ? (
                  <GlassCard className="flex flex-col items-center justify-center py-12 text-center">
                    <Megaphone className="h-10 w-10 text-muted-c/40 mb-2" />
                    <p className="text-sm font-bold text-primary-c">No broadcasts found</p>
                    <p className="text-xs text-muted-c mt-0.5">Try searching with a different term or clear filters.</p>
                  </GlassCard>
                ) : (
                  filtered.map((b) => (
                    <BroadcastListItem
                      key={b.id}
                      broadcast={b}
                      selected={b.id === selectedId}
                      onClick={() => setSelectedId(b.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Selected Campaign Detail & Analytics Panel */}
            <div className="min-w-0">
              {selected ? (
                <BroadcastDetail
                  broadcast={selected}
                  onDelete={() => handleDelete(selected.id)}
                  onEdit={() => setEditingBroadcast(selected)}
                  onCancelSchedule={() => handleCancelSchedule(selected.id)}
                  onRefresh={loadData}
                />
              ) : (
                <GlassCard className="flex flex-col items-center justify-center py-24 text-center min-h-[450px]">
                  <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-ink-850 flex items-center justify-center mb-4">
                    <Megaphone className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-base font-bold text-primary-c">No Broadcast Selected</h3>
                  <p className="mt-1.5 text-xs text-secondary-c max-w-xs">
                    Select a campaign from the list on the left to inspect performance analytics, message content, and Meta recipient logs.
                  </p>
                </GlassCard>
              )}
            </div>
          </div>
        </>
      ) : (
        /* WhatsApp Templates Tab View */
        <TemplatesTab
          templates={templates}
          loading={templatesLoading}
          onDelete={handleDeleteTemplate}
          onCreateNew={() => navigate('/broadcasts/create-template')}
        />
      )}

      {/* Delete Campaign Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteCampaignConfirm.isOpen}
        title={deleteCampaignConfirm.isAll ? 'Clear All Broadcast Campaigns' : 'Delete Broadcast Campaign'}
        message={`Are you sure you want to delete ${deleteCampaignConfirm.title}? All associated logs, analytics and recipient queues will be permanently removed.`}
        confirmText={deleteCampaignConfirm.isAll ? 'Clear All Campaigns' : 'Delete Campaign'}
        variant="danger"
        onConfirm={confirmDeleteCampaign}
        onCancel={() => setDeleteCampaignConfirm({ isOpen: false, id: '', title: '' })}
      />

      {/* Reusable Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmState.isOpen}
        title="Delete WhatsApp Template"
        message={`Are you sure you want to delete template "${deleteConfirmState.templateName}"? This action cannot be undone.`}
        confirmText="Delete Template"
        variant="danger"
        onConfirm={confirmDeleteTemplate}
        onCancel={() => setDeleteConfirmState({ isOpen: false, templateName: '' })}
      />

      {/* Cancel Scheduled Campaign Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelCampaignConfirm.isOpen}
        title="Cancel Scheduled Broadcast"
        message={`Are you sure you want to cancel "${cancelCampaignConfirm.title}"? This will unschedule the Quartz distributed job trigger immediately and prevent messages from being dispatched.`}
        confirmText="Cancel Broadcast"
        variant="danger"
        onConfirm={confirmCancelCampaign}
        onCancel={() => setCancelCampaignConfirm({ isOpen: false, id: '', title: '' })}
      />

      {/* Edit / Reschedule Broadcast Modal */}
      <EditBroadcastModal
        isOpen={!!editingBroadcast}
        broadcast={editingBroadcast}
        templates={templates}
        onClose={() => setEditingBroadcast(null)}
        onUpdated={loadData}
      />
    </div>
  );
}

/* ─── Templates Tab View Component ─── */
function TemplatesTab({
  templates,
  loading,
  onDelete,
  onCreateNew,
}: {
  templates: WhatsAppTemplateDto[];
  loading: boolean;
  onDelete: (name: string) => void;
  onCreateNew: () => void;
}) {
  const navigate = useNavigate();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || (t.category || '').toUpperCase() === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [templates, search, categoryFilter]);

  const selected = useMemo(() => templates.find((t) => t.name === selectedName), [templates, selectedName]);

  useEffect(() => {
    if (!selectedName && templates.length > 0) {
      setSelectedName(templates[0].name);
    }
  }, [templates, selectedName]);

  if (loading && templates.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-bold text-primary-c">Syncing templates with Meta API...</p>
        <p className="text-xs text-muted-c mt-1">Retrieving latest approval statuses & language components.</p>
      </GlassCard>
    );
  }

  if (templates.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-ink-850 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-base font-bold text-primary-c">No WhatsApp Templates Found</h3>
        <p className="mt-1.5 text-xs text-secondary-c max-w-md leading-relaxed">
          Create a new WhatsApp message template to submit it to Meta for approval. Once approved, you can send it to thousands of contacts in bulk broadcasts.
        </p>
        <button
          onClick={onCreateNew}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-soft transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create First Template
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="grid flex-1 items-start gap-5 lg:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr]">
      {/* Left: Template Browser Column */}
      <div className="surface flex flex-col rounded-2xl border border-base-c bg-card-c overflow-hidden shadow-xs h-[520px] lg:h-[calc(100vh-250px)]">
        <div className="bg-subtle-c border-b border-base-c p-3.5 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-c">All Meta Templates</h3>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {filteredTemplates.length} / {templates.length}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-c" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search template name..."
              className="w-full rounded-xl border border-base-c bg-card-c pl-8 pr-3 py-1.5 text-xs text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cx(
                  'rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer',
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-ink-800 text-secondary-c hover:text-primary-c',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-base-c overflow-y-auto scrollbar-thin flex-1">
          {filteredTemplates.map((tpl) => {
            const status = (tpl.status || 'APPROVED').toUpperCase();
            let statusColor = 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20';
            if (status === 'PENDING') statusColor = 'text-amber-700 bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20';
            if (status === 'REJECTED') statusColor = 'text-rose-700 bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20';

            const isSelected = selectedName === tpl.name;
            return (
              <div
                key={tpl.id || tpl.name}
                onClick={() => setSelectedName(tpl.name)}
                className={cx(
                  'cursor-pointer p-3.5 transition-all hover:bg-slate-50 dark:hover:bg-ink-850/60 flex flex-col gap-1.5 relative',
                  isSelected ? 'bg-emerald-50/60 dark:bg-emerald-500/10' : '',
                )}
              >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r" />}

                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-primary-c truncate flex-1">{tpl.name}</span>
                  <span className={cx('text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0', statusColor)}>{status}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-secondary-c font-medium">
                  <span className="uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">{tpl.category || 'MARKETING'}</span>
                  <span>{tpl.language || 'en_US'}</span>
                </div>
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <div className="p-8 text-center text-muted-c text-xs">
              No matching templates found.
            </div>
          )}
        </div>
      </div>

      {/* Right: Mock Smartphone WhatsApp Live Preview Panel */}
      <div className="h-[650px] lg:h-[calc(100vh-250px)] flex flex-col overflow-y-auto pr-1 scrollbar-thin">
        {selected ? (
          <WhatsAppTemplateCard
            template={selected}
            onEdit={() => {
              navigate('/broadcasts/edit-template/' + encodeURIComponent(selected.name), {
                state: { template: selected }
              });
            }}
            onDelete={() => {
              onDelete(selected.name);
              setSelectedName(null);
            }}
          />
        ) : (
          <GlassCard className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[450px]">
            <LayoutTemplate className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-3" />
            <h3 className="text-base font-bold text-primary-c">No Template Selected</h3>
            <p className="mt-1 text-xs text-secondary-c max-w-xs">
              Select a template from the list to view configuration details and an interactive WhatsApp preview.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

/* ─── WhatsApp Template Smartphone Card Component ─── */
function WhatsAppTemplateCard({ template, onEdit, onDelete }: { template: WhatsAppTemplateDto; onEdit: () => void; onDelete: () => void }) {
  const status = (template.status || 'APPROVED').toUpperCase();

  let statusBg = 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20';
  if (status === 'PENDING') statusBg = 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20';
  if (status === 'REJECTED') statusBg = 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/20';

  return (
    <div className="flex flex-col h-full bg-card-c rounded-2xl border border-base-c overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="bg-subtle-c border-b border-base-c px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h3 className="font-mono text-lg font-bold text-primary-c tracking-tight">{template.name}</h3>
          <div className="flex items-center gap-2.5">
            <span className={cx('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase', statusBg)}>
              {status}
            </span>
            <span className="rounded-full bg-slate-200/60 dark:bg-ink-800 px-2.5 py-0.5 text-[10px] font-bold text-secondary-c uppercase tracking-wider">
              {template.category || 'MARKETING'}
            </span>
            <span className="text-xs font-medium text-muted-c">{template.language || 'en_US'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 px-3 py-2 text-xs font-bold transition-all border border-primary-200 dark:border-primary-500/30 cursor-pointer shadow-2xs"
            title="Edit Template on Meta"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={onDelete}
            className="rounded-xl hover:bg-rose-50 text-muted-c hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 p-2.5 transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
            title="Delete Template"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {template.rejectedReason && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="text-xs text-rose-900 dark:text-rose-200">
            <strong className="font-bold block mb-0.5">Template Rejected by Meta Review</strong>
            {template.rejectedReason}
          </div>
        </div>
      )}

      {/* Mock Smartphone Live View */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-start bg-slate-100/50 dark:bg-ink-950/50 relative overflow-y-auto max-h-[85vh] scrollbar-thin">
        <div className="flex items-center gap-2 mb-4 self-start max-w-[340px] mx-auto w-full">
          <Smartphone className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-xs font-bold text-primary-c">Interactive WhatsApp Mockup</h4>
        </div>

        {/* Mock Phone Frame */}
        <div className="relative w-full max-w-[340px] rounded-[2.5rem] border-[7px] border-slate-900 bg-[#E5DDD5] dark:bg-[#0b141a] shadow-2xl overflow-hidden min-h-[520px] flex flex-col shrink-0">
          {/* Top Notch */}
          <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 rounded-b-xl w-28 mx-auto z-20"></div>

          {/* WhatsApp Header */}
          <div className="bg-[#075E54] dark:bg-[#1f2c34] text-white pt-8 pb-3 px-3.5 flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-5 w-5 opacity-80" />
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">CRM</div>
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs leading-tight truncate">CRM Business</div>
                <div className="text-[9px] text-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" /> Official Business
                </div>
              </div>
            </div>
            <div className="flex gap-3 text-white/80">
              <Video className="h-4 w-4" />
              <Phone className="h-4 w-4" />
              <MoreVertical className="h-4 w-4" />
            </div>
          </div>

          {/* WhatsApp Chat Body */}
          <div
            className="flex-1 p-3.5 relative overflow-y-auto scrollbar-thin"
            style={{
              backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundSize: 'cover',
            }}
          >
            <div className="flex justify-center mb-3">
              <span className="bg-[#E1F3FB] text-slate-700 text-[10px] px-2.5 py-0.5 rounded-md shadow-xs font-semibold">TODAY</span>
            </div>

            <div className="flex justify-start">
              <div className="relative max-w-[270px] bg-white dark:bg-[#111b21] rounded-lg rounded-tl-none shadow-md flex flex-col z-10">
                <div className="p-2.5 space-y-1.5">
                  {template.headerContent && (
                    <p className="font-bold text-slate-900 dark:text-white text-xs px-1 pt-0.5">{template.headerContent}</p>
                  )}

                  <div className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed px-1">
                    {renderWhatsAppFormattedText(template.bodyText || (template.components ? JSON.stringify(template.components) : ''))}
                  </div>

                  <div className="flex items-end justify-between gap-3 px-1 pt-1">
                    <p className="text-[10px] text-slate-400 truncate flex-1">
                      {template.footerText || ''}
                    </p>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 shrink-0">
                      <span>13:08</span>
                      <Check className="h-3 w-3 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                {template.buttons && template.buttons.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {template.buttons.map((btn, idx) => (
                      <div key={idx} className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs text-[#00A884] dark:text-[#00a884] bg-white dark:bg-[#111b21] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                        {btn.type === 'URL' ? <ExternalLink className="h-3.5 w-3.5" /> : btn.type === 'PHONE_NUMBER' ? <PhoneCall className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                        <span className="font-semibold truncate">{btn.text || 'Action Button'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute bottom-1.5 inset-x-0 flex justify-center">
            <div className="h-1 w-20 bg-slate-900/30 rounded-full" />
          </div>
        </div>

        <p className="mt-4 text-[11px] text-muted-c text-center max-w-[280px]">
          Live preview demonstrates how approved text & buttons appear on customer devices.
        </p>
      </div>
    </div>
  );
}

/* ─── Stat Card Component ─── */
function StatCard({
  icon: Icon,
  label,
  value,
  badge,
  badgeColor,
  accent,
}: {
  icon: typeof Send;
  label: string;
  value: string;
  badge?: string;
  badgeColor?: string;
  accent: string;
}) {
  return (
    <GlassCard className="flex items-center gap-3.5 p-4 relative overflow-hidden transition-all duration-200 hover:shadow-md">
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c truncate">{label}</p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <p className="text-xl font-bold tabular-nums text-primary-c tracking-tight">{value}</p>
          {badge && (
            <span className={cx('text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate', badgeColor || 'text-emerald-600 bg-emerald-500/10')}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

const DEFAULT_STATUS_META = {
  label: 'Broadcast',
  color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300',
  dot: 'bg-slate-400',
};

function BroadcastListItem({
  broadcast,
  selected,
  onClick,
}: {
  broadcast: Broadcast;
  selected: boolean;
  onClick: () => void;
}) {
  const statusMeta = (broadcast?.status && STATUS_META[broadcast.status])
    || (broadcast?.status && STATUS_META[broadcast.status.toLowerCase()])
    || DEFAULT_STATUS_META;
  const dotClass = statusMeta?.dot || 'bg-slate-400';
  const colorClass = statusMeta?.color || 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300';
  const labelText = statusMeta?.label || broadcast?.status || 'Broadcast';

  const deliveryPercent = broadcast.recipients > 0 ? Math.round((broadcast.delivered / broadcast.recipients) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className={cx(
        'group cursor-pointer rounded-2xl border p-3.5 transition-all relative overflow-hidden',
        selected
          ? 'border-emerald-500 bg-emerald-500/10 shadow-soft dark:bg-emerald-500/10'
          : 'border-base-c bg-card-c hover:border-emerald-500/40 hover:shadow-xs',
      )}
    >
      {selected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cx('h-2 w-2 rounded-full', dotClass)} />
            <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', colorClass)}>
              {labelText}
            </span>
            {broadcast.isAbTest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[9px] font-bold text-purple-600 dark:text-purple-300">
                <Split className="h-2.5 w-2.5" /> A/B ({broadcast.abStatus || 'TESTING'})
              </span>
            )}
          </div>
          <h4 className="mt-1.5 truncate text-xs font-bold text-primary-c">{broadcast.title}</h4>
          <p className="mt-0.5 truncate text-[11px] text-muted-c">{broadcast.template}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-c transition-transform group-hover:translate-x-0.5" />
      </div>

      {/* Mini Progress Bar */}
      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-[10px] text-muted-c font-medium">
          <span>Target: {broadcast.audience}</span>
          <span className="font-semibold text-primary-c tabular-nums">{broadcast.delivered} / {broadcast.recipients} ({deliveryPercent}%)</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-ink-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(5, deliveryPercent))}%` }}
          />
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-base-c pt-2 text-[10px] text-muted-c">
        <span>
          {broadcast.recipients} Recipients
          {broadcast.clicks !== undefined && broadcast.clicks > 0 ? (
            <span className="ml-1 font-semibold text-blue-600 dark:text-blue-400">
              • {broadcast.clicks} clicks
            </span>
          ) : null}
        </span>
        {broadcast.status === 'scheduled' && broadcast.scheduledAt ? (
          <span className="flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400">
            <Clock className="h-3 w-3" /> {new Date(broadcast.scheduledAt).toLocaleString()}
          </span>
        ) : (
          <span>{broadcast.sentAt}</span>
        )}
      </div>
    </div>
  );
}

function BroadcastDetail({
  broadcast,
  onDelete,
  onEdit,
  onCancelSchedule,
  onRefresh,
}: {
  broadcast: Broadcast;
  onDelete: () => void;
  onEdit?: () => void;
  onCancelSchedule?: () => void;
  onRefresh?: () => void;
}) {
  const statusMeta = (broadcast?.status && STATUS_META[broadcast.status])
    || (broadcast?.status && STATUS_META[broadcast.status.toLowerCase()])
    || DEFAULT_STATUS_META;
  const colorClass = statusMeta?.color || 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300';
  const labelText = statusMeta?.label || broadcast?.status || 'Broadcast';

  const isScheduled = broadcast.status?.toLowerCase() === 'scheduled';
  const isDraft = broadcast.status?.toLowerCase() === 'draft';
  const isEditable = isScheduled || isDraft;

  const deliveryRate = broadcast.recipients ? Math.round((broadcast.delivered / broadcast.recipients) * 100) : 0;
  const readRate = broadcast.delivered ? Math.round((broadcast.read / broadcast.delivered) * 100) : 0;

  return (
    <GlassCard className="p-5 space-y-5">
      {/* Detail Header */}
      <div className="flex items-start justify-between gap-3 border-b border-base-c pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={cx('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase', colorClass)}>
              {labelText}
            </span>
            {broadcast.isAbTest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-300">
                <Split className="h-3 w-3" /> A/B Split Test
              </span>
            )}
            <span className="text-xs font-mono text-muted-c">ID: {broadcast.id}</span>
          </div>
          <h3 className="mt-1.5 text-lg font-bold text-primary-c">{broadcast.title}</h3>
          <p className="mt-0.5 text-xs text-secondary-c">Target Segment: <strong className="font-semibold text-primary-c">{broadcast.audience}</strong></p>
        </div>
        <div className="flex items-center gap-2">
          {isEditable && onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary-500/30 bg-primary-500/10 px-3 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-all cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" /> {isScheduled ? 'Reschedule' : 'Edit'}
            </button>
          )}
          {isScheduled && onCancelSchedule && (
            <button
              onClick={onCancelSchedule}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <X className="h-3.5 w-3.5" /> Cancel Schedule
            </button>
          )}
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Scheduled Execution Banner */}
      {isScheduled && broadcast.scheduledAt && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary-500/30 bg-primary-500/10 p-3.5 text-xs text-primary-700 dark:text-primary-300">
          <Clock className="h-5 w-5 shrink-0 text-primary-500 animate-pulse" />
          <div className="flex-1">
            <span className="font-bold">Scheduled Execution Time: </span>
            <span className="font-semibold">{new Date(broadcast.scheduledAt).toLocaleString()}</span>
            <p className="text-[11px] text-secondary-c mt-0.5">
              Managed by Quartz distributed scheduler cluster. Message queue dispatches automatically at this time.
            </p>
          </div>
        </div>
      )}

      {/* WhatsApp A/B Split Testing Comparative Analytics (Gap 07) */}
      {broadcast.isAbTest && (
        <AbTestComparativeCard campaignId={broadcast.id} onWinnerPromoted={onRefresh} />
      )}

      {/* Delivery, Read & Click Rates Metrics Card */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-base-c bg-card-c p-3.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Delivered</p>
          <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{broadcast.delivered}</p>
          <p className="text-[10px] font-semibold text-emerald-600/80 mt-0.5">{deliveryRate}% Delivery</p>
        </div>
        <div className="rounded-2xl border border-base-c bg-card-c p-3.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Read</p>
          <p className="mt-1 text-xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">{broadcast.read}</p>
          <p className="text-[10px] font-semibold text-purple-600/80 mt-0.5">{readRate}% Read Rate</p>
        </div>
        <div className="rounded-2xl border border-base-c bg-card-c p-3.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Link Clicks</p>
          <p className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{broadcast.clicks || 0}</p>
          <p className="text-[10px] font-semibold text-blue-600/80 mt-0.5">{broadcast.ctr || 0}% CTR</p>
        </div>
        <div className="rounded-2xl border border-base-c bg-card-c p-3.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Failed / Skipped</p>
          <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{broadcast.responded}</p>
          <p className="text-[10px] font-semibold text-amber-600/80 mt-0.5">Meta Policy Log</p>
        </div>
      </div>

      {/* Template Details Box */}
      <div className="rounded-2xl border border-base-c bg-slate-50/50 p-4 dark:bg-ink-850/40 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c">Meta Approved Template</p>
          <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{broadcast.template}</span>
        </div>
        <p className="text-xs text-secondary-c leading-relaxed">{broadcast.message}</p>
      </div>

      {/* Recipient Logs & Meta Reasons Table */}
      <CampaignRecipientsTable campaignId={broadcast.id} />
    </GlassCard>
  );
}

/* ─── A/B Split Testing Comparative Analytics Card (Gap 07) ─── */
function AbTestComparativeCard({
  campaignId,
  onWinnerPromoted,
}: {
  campaignId: string;
  onWinnerPromoted?: () => void;
}) {
  const [metrics, setMetrics] = useState<CampaignAbMetricsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [confirmPromote, setConfirmPromote] = useState<{ isOpen: boolean; variantId: string; variantName: string }>({
    isOpen: false,
    variantId: '',
    variantName: '',
  });

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    const res = await fetchCampaignAbMetrics(campaignId);
    setLoading(false);
    if (res.data) {
      setMetrics(res.data);
    }
  }, [campaignId]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handlePromote = async (variantId: string) => {
    setPromotingId(variantId);
    const res = await promoteAbWinner(campaignId, variantId);
    setPromotingId(null);
    setConfirmPromote({ isOpen: false, variantId: '', variantName: '' });
    if (res.data) {
      await loadMetrics();
      if (onWinnerPromoted) onWinnerPromoted();
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-6 rounded-2xl border border-purple-500/20 bg-purple-50/20 text-xs text-purple-700 dark:text-purple-300">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading live A/B test telemetry...
      </div>
    );
  }

  if (!metrics) return null;

  const isTesting = metrics.abStatus === 'TESTING';

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-purple-50/20 dark:bg-purple-950/20 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
            <Split className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-primary-c">A/B Experiment Telemetry</h4>
              <span className={cx(
                'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
                isTesting
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              )}>
                {metrics.abStatus}
              </span>
            </div>
            <p className="text-[11px] text-secondary-c mt-0.5">
              Optimizing for: <strong className="font-semibold text-purple-600 dark:text-purple-400">{metrics.winnerMetric === 'CLICK_RATE' ? 'Click-Through Rate (CTR %)' : 'Read Rate %'}</strong>
              {metrics.evaluationEndsAt && isTesting && (
                <span className="ml-2 text-muted-c">
                  • Auto-resolves at {new Date(metrics.evaluationEndsAt).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadMetrics}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-500/30 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 transition-all cursor-pointer"
        >
          <RefreshCw className={cx('h-3 w-3', loading && 'animate-spin')} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Audience partitioning mini badge */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white/60 dark:bg-ink-900/60 border border-purple-500/15 p-2.5 rounded-xl">
        <div>
          <span className="text-[10px] text-muted-c font-semibold block uppercase">Total Audience</span>
          <strong className="text-primary-c font-bold">{metrics.totalAudience}</strong>
        </div>
        <div>
          <span className="text-[10px] text-muted-c font-semibold block uppercase">Test Group</span>
          <strong className="text-purple-600 dark:text-purple-400 font-bold">{metrics.testSampleCount}</strong>
        </div>
        <div>
          <span className="text-[10px] text-muted-c font-semibold block uppercase">Holdout Pool</span>
          <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{metrics.holdoutCount}</strong>
        </div>
      </div>

      {/* Side-by-Side Variant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {metrics.variants.map((v) => {
          const isWinner = v.isWinner;
          const isLeader = v.isLeader && !isWinner;

          return (
            <div
              key={v.variantId}
              className={cx(
                'rounded-xl border p-4 transition-all relative overflow-hidden bg-card-c',
                isWinner
                  ? 'border-amber-400 dark:border-amber-500/80 shadow-md ring-2 ring-amber-400/30 bg-amber-50/10 dark:bg-amber-950/10'
                  : isLeader
                  ? 'border-purple-400 dark:border-purple-500 shadow-sm'
                  : 'border-base-c'
              )}
            >
              {isWinner && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-bold px-3 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-xs">
                  <Trophy className="h-3 w-3" /> PROMOTED WINNER
                </div>
              )}
              {isLeader && isTesting && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-xs">
                  <Sparkles className="h-3 w-3" /> CURRENT LEADER
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <span className={cx(
                  'flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold text-white',
                  v.variantCode === 'A' ? 'bg-indigo-600' : 'bg-purple-600'
                )}>
                  {v.variantCode}
                </span>
                <div>
                  <h5 className="text-xs font-bold text-primary-c">{v.name}</h5>
                  <p className="text-[10px] font-mono text-muted-c truncate max-w-[180px]">{v.templateName}</p>
                </div>
              </div>

              {/* Variant Metrics Grid */}
              <div className="grid grid-cols-4 gap-1.5 text-center mt-3 pt-2.5 border-t border-base-c text-[11px]">
                <div className="bg-subtle-c p-1.5 rounded-lg">
                  <span className="text-[9px] text-muted-c uppercase block">Sent</span>
                  <span className="font-bold text-primary-c">{v.sentCount}</span>
                </div>
                <div className="bg-subtle-c p-1.5 rounded-lg">
                  <span className="text-[9px] text-muted-c uppercase block">Delivered</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{v.deliveredCount}</span>
                </div>
                <div className="bg-subtle-c p-1.5 rounded-lg">
                  <span className="text-[9px] text-muted-c uppercase block">Read</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{v.readCount}</span>
                </div>
                <div className="bg-subtle-c p-1.5 rounded-lg">
                  <span className="text-[9px] text-muted-c uppercase block">Clicks</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{v.clickCount}</span>
                </div>
              </div>

              {/* Conversion Rates */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary-c font-medium flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-amber-500" /> CTR %
                  </span>
                  <strong className={cx('tabular-nums font-bold text-sm', v.ctr > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-primary-c')}>
                    {v.ctr.toFixed(1)}%
                  </strong>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary-c font-medium">Read Rate %</span>
                  <strong className="tabular-nums font-semibold text-purple-600 dark:text-purple-400">
                    {v.readRate.toFixed(1)}%
                  </strong>
                </div>
              </div>

              {/* Manual Override Winner Button (Active during TESTING) */}
              {isTesting && !isWinner && (
                <button
                  type="button"
                  onClick={() => setConfirmPromote({ isOpen: true, variantId: v.variantId, variantName: v.name })}
                  disabled={!!promotingId}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  {promotingId === v.variantId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
                  <span>Promote as Winner</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Manual Winner Override */}
      <ConfirmModal
        isOpen={confirmPromote.isOpen}
        title="Promote Winning Variant"
        message={`Are you sure you want to promote ${confirmPromote.variantName} as the winner now? This will immediately resolve the experiment and dispatch the holdout audience (${metrics.holdoutCount} recipients) with this template.`}
        confirmText="Promote & Dispatch Holdout"
        variant="primary"
        onConfirm={() => handlePromote(confirmPromote.variantId)}
        onCancel={() => setConfirmPromote({ isOpen: false, variantId: '', variantName: '' })}
      />
    </div>
  );
}

// ─── Classified Meta Failure Reason Helper ──────────────────────────────────

function getMetaReasonInfo(errorMessage?: string, skipReason?: string) {
  const text = ((errorMessage || '') + ' ' + (skipReason || '')).toLowerCase();

  if (text.includes('payment') || text.includes('bill') || text.includes('credit') || text.includes('business_payment')) {
    return {
      label: 'Meta Payment Issue',
      desc: 'Meta Business account bill unpaid or payment method declined.',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300',
    };
  }
  if (text.includes('quality') || text.includes('rating') || text.includes('number_quality')) {
    return {
      label: 'Number Quality Low',
      desc: 'Phone number quality rating is too low according to Meta policies.',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300',
    };
  }
  if (text.includes('not on whatsapp') || text.includes('invalid_phone') || text.includes('not_on_whatsapp') || text.includes('invalid')) {
    return {
      label: 'Not on WhatsApp',
      desc: 'Phone number is invalid or not registered on WhatsApp.',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-300',
    };
  }
  if (text.includes('opted_out') || text.includes('optout') || text.includes('unsub')) {
    return {
      label: 'User Opted Out',
      desc: 'Recipient opted out / unsubscribed from WhatsApp messages.',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
    };
  }
  if (text.includes('rate') || text.includes('limit') || text.includes('tier')) {
    return {
      label: 'Rate Limit Exceeded',
      desc: '24-hour Meta messaging tier limit reached for your account.',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-300',
    };
  }
  if (text.includes('token') || text.includes('auth') || text.includes('unauthorized')) {
    return {
      label: 'Token Expired',
      desc: 'WhatsApp API access token is expired or unauthorized.',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300',
    };
  }

  return {
    label: errorMessage || skipReason || 'Delivery Failed',
    desc: errorMessage || skipReason || 'Failed to deliver message via WhatsApp Meta API',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-200',
  };
}

// ─── Recipient Logs & CSV Rows Table Component ──────────────────────────────

function CampaignRecipientsTable({ campaignId }: { campaignId: string }) {
  const [recipients, setRecipients] = useState<WhatsAppCampaignRecipientDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FAILED_ONLY' | 'SENT' | 'DELIVERED' | 'READ'>('ALL');

  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);
    fetchCampaignRecipients(campaignId, 0, 100).then((res) => {
      setLoading(false);
      if (res.data && res.data.content) {
        setRecipients(res.data.content);
      } else {
        setRecipients([]);
      }
    });
  }, [campaignId]);

  const filteredRecipients = useMemo(() => {
    return recipients.filter((r) => {
      const matchSearch =
        !search ||
        r.phoneNumber.includes(search) ||
        (r.resolvedVariablesJson || '').toLowerCase().includes(search.toLowerCase());
      const st = (r.status || '').toUpperCase();
      let matchStatus = true;
      if (statusFilter === 'FAILED_ONLY') {
        matchStatus = st === 'FAILED' || st === 'SKIPPED';
      } else if (statusFilter !== 'ALL') {
        matchStatus = st === statusFilter;
      }
      return matchSearch && matchStatus;
    });
  }, [recipients, search, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-muted-c">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-500 mr-2" /> Loading recipient data & Meta delivery status...
      </div>
    );
  }

  return (
    <div className="space-y-3.5 mt-5 border-t border-base-c pt-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-xs font-bold text-primary-c flex items-center gap-1.5">
            <Users className="h-4 w-4 text-emerald-500" />
            Recipient Logs & Meta Delivery Diagnostics ({recipients.length})
          </h4>
          <p className="text-[11px] text-muted-c mt-0.5">Displays recipient contacts, delivery status & Meta policy failure diagnostics.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-c" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search phone or data..."
              className="h-8 w-40 rounded-xl border border-base-c bg-card-c pl-8 pr-2 text-xs text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'FAILED_ONLY' | 'SENT' | 'DELIVERED' | 'READ')}
            className="h-8 rounded-xl border border-base-c bg-card-c px-2.5 text-xs text-primary-c focus:border-primary-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="FAILED_ONLY">Failed / Skipped Only</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="READ">Read</option>
          </select>
        </div>
      </div>

      {filteredRecipients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-c p-8 text-center text-xs text-muted-c">
          No recipient logs available for this campaign filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-base-c bg-card-c max-h-80 overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-ink-850 text-[10px] font-bold uppercase tracking-wider text-muted-c border-b border-base-c">
              <tr>
                <th className="p-3">Phone Number</th>
                <th className="p-3">Status</th>
                <th className="p-3">Meta Delivery Diagnostic</th>
                <th className="p-3">Uploaded Variable Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-c">
              {filteredRecipients.map((r) => {
                const isFail = r.status === 'FAILED' || r.status === 'SKIPPED';
                const reasonMeta = isFail ? getMetaReasonInfo(r.errorMessage, r.skipReason) : null;
                let parsedVars: string[] = [];
                try {
                  if (r.resolvedVariablesJson) {
                    parsedVars = JSON.parse(r.resolvedVariablesJson);
                  }
                } catch (e) {
                  // ignore
                }

                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-ink-850/60 transition-colors">
                    <td className="p-3 font-mono font-semibold text-primary-c whitespace-nowrap">
                      {r.phoneNumber}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={cx(
                          'rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase',
                          r.status === 'READ'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                            : r.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : r.status === 'SENT'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                            : isFail
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300'
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {isFail && reasonMeta ? (
                        <div className="space-y-0.5">
                          <span className={cx('inline-block rounded border px-2 py-0.5 text-[9px] font-bold', reasonMeta.badge)}>
                            {reasonMeta.label}
                          </span>
                          <p className="text-[11px] text-muted-c max-w-xs truncate" title={reasonMeta.desc}>
                            {reasonMeta.desc}
                          </p>
                        </div>
                      ) : r.status === 'READ' ? (
                        <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Read by recipient</span>
                      ) : r.status === 'DELIVERED' ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Delivered to handset</span>
                      ) : (
                        <span className="text-[11px] text-muted-c">Sent to Meta Cloud API</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-c max-w-xs truncate font-mono text-[11px]">
                      {parsedVars.length > 0 ? parsedVars.join(', ') : r.resolvedVariablesJson || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
