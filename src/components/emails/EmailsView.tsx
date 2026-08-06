import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cx } from '@/lib/types';
import {
  CAMPAIGN_STATUS_META,
  type Campaign,
} from './emailData';
import {
  fetchEmailCampaigns,
  resendEmailCampaign,
  pauseEmailCampaign,
  resumeEmailCampaign,
  cancelEmailCampaign,
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
  Filter,
  Download,
  CheckSquare,
  Square,
  RefreshCw,
  Eye,
  Pause,
  Play,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  X,
  Calendar,
  SlidersHorizontal
} from 'lucide-react';

type Tab = 'campaigns' | 'compose';
type StatusFilter = 'all' | 'completed' | 'scheduled' | 'draft' | 'sending' | 'failed';

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
    name: dto.subject || 'Untitled Campaign',
    subject: dto.subject || 'No Subject',
    status,
    recipients: dto.totalRecipients || dto.totalSent || 0,
    totalRecipients: dto.totalRecipients || 0,
    processedRecipients: dto.processedRecipients || 0,
    totalSent: dto.totalSent || 0,
    totalFailed: dto.totalFailed || 0,
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

/**
 * Enterprise Merge Tag Renderer: Formats {{variable_name}} into sleek inline pills
 */
function FormattedTextWithTags({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/({{[^}]+}})/g);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {parts.map((part, i) => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
          const varName = part.slice(2, -2).trim();
          return (
            <span
              key={i}
              className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300"
            >
              ${varName}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function EmailsView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlTab = searchParams.get('tab');
  const initialTab: Tab = urlTab === 'templates' || urlTab === 'compose' ? 'compose' : 'campaigns';

  const [tab, setTabState] = useState<Tab>(initialTab);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'openRate' | 'recipients'>('newest');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [createTemplateTrigger, setCreateTemplateTrigger] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  // Filter & Sort Logic
  const filteredCampaigns = useMemo(() => {
    let result = campaigns.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.subject.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'completed'
          ? c.status === 'completed' || c.status === 'sent'
          : c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
      if (sortBy === 'oldest') return (a.createdAt || '').localeCompare(b.createdAt || '');
      if (sortBy === 'openRate') return b.openRate - a.openRate;
      if (sortBy === 'recipients') return b.recipients - a.recipients;
      return 0;
    });

    return result;
  }, [campaigns, search, statusFilter, sortBy]);

  // Paginated campaigns
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCampaigns.slice(start, start + pageSize);
  }, [filteredCampaigns, currentPage]);

  const totalPages = Math.ceil(filteredCampaigns.length / pageSize) || 1;

  // Counts for status tabs
  const statusCounts = useMemo(() => {
    return {
      all: campaigns.length,
      completed: campaigns.filter((c) => c.status === 'completed' || c.status === 'sent').length,
      scheduled: campaigns.filter((c) => c.status === 'scheduled').length,
      draft: campaigns.filter((c) => c.status === 'draft').length,
      sending: campaigns.filter((c) => c.status === 'sending' || c.status === 'paused').length,
      failed: campaigns.filter((c) => c.status === 'failed' || c.status === 'cancelled').length,
    };
  }, [campaigns]);

  // Stats Metrics
  const totalSent = campaigns.reduce((s, c) => s + (c.totalSent || 0), 0);
  const totalRecipients = campaigns.reduce((s, c) => s + (c.totalRecipients || c.totalSent || c.recipients || 0), 0);

  const sentCampaigns = campaigns.filter((c) => c.status === 'sent' || c.status === 'completed');
  const avgOpen =
    sentCampaigns.length > 0
      ? Math.round(sentCampaigns.reduce((s, c) => s + c.openRate, 0) / sentCampaigns.length)
      : 0;

  const avgClick =
    sentCampaigns.length > 0
      ? Math.round(sentCampaigns.reduce((s, c) => s + c.clickRate, 0) / sentCampaigns.length)
      : 0;

  const scheduled = campaigns.filter((c) => c.status === 'scheduled').length;

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedCampaigns.length && paginatedCampaigns.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedCampaigns.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // CSV Export Handler
  const exportToCsv = () => {
    const itemsToExport = selectedIds.size > 0
      ? campaigns.filter((c) => selectedIds.has(c.id))
      : filteredCampaigns;

    const headers = ['ID', 'Name', 'Subject', 'Status', 'Recipients', 'Total Sent', 'Open Rate %', 'Click Rate %', 'Sent Date'];
    const rows = itemsToExport.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.subject.replace(/"/g, '""')}"`,
      c.status,
      c.recipients,
      c.totalSent || 0,
      c.openRate,
      c.clickRate,
      `"${c.sentAt || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `email_campaigns_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
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
          {/* Header */}
          {!isEditorOpen && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  {tab === 'campaigns' ? 'Email Marketing' : 'Email Templates'}
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {tab === 'campaigns'
                    ? 'Create, schedule, and analyze enterprise email broadcasts.'
                    : 'Manage responsive HTML templates and reusable blocks.'}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <RefreshCw className={cx('h-3.5 w-3.5 text-slate-400', loading && 'animate-spin')} />
                  Refresh
                </button>

                {tab === 'campaigns' ? (
                  <button
                    onClick={() => navigate('/emails/create')}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> New Campaign
                  </button>
                ) : (
                  <button
                    onClick={() => setCreateTemplateTrigger((prev) => prev + 1)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Create Template
                  </button>
                )}
              </div>
            </div>
          )}

          {apiError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Backend Error: {apiError}</span>
            </div>
          )}

          {/* Metrics Overview Cards */}
          {tab === 'campaigns' && (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={Megaphone}
                label="Total Sent"
                value={totalSent.toLocaleString()}
                sub="All time emails"
              />
              <MetricCard
                icon={Users}
                label="Total Recipients"
                value={totalRecipients.toLocaleString()}
                sub="Audience size"
              />
              <MetricCard
                icon={MailOpen}
                label="Avg Open Rate"
                value={`${avgOpen}%`}
                sub={`CTR ${avgClick}%`}
              />
              <MetricCard
                icon={Clock}
                label="Scheduled"
                value={String(scheduled)}
                sub="Pending dispatch"
              />
            </div>
          )}

          {/* Main Tab Switcher (Original Gradient Pill Styling) */}
          {!isEditorOpen && (
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/60 p-1.5 shadow-xs">
              <button
                onClick={() => setTab('campaigns')}
                className={cx(
                  'flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs',
                  tab === 'campaigns'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <Inbox className="h-4 w-4" />
                Campaigns
                <span
                  className={cx(
                    'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                    tab === 'campaigns'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  {campaigns.length}
                </span>
              </button>
              <button
                onClick={() => setTab('compose')}
                className={cx(
                  'flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs',
                  tab === 'compose'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <FileText className="h-4 w-4" />
                Email Templates
              </button>
            </div>
          )}

          {/* Tab Content */}
          {tab === 'campaigns' ? (
            <div className="space-y-3.5">
              {/* Enterprise Filter Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[220px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    placeholder="Filter campaigns..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-7 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-indigo-400"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Filter Controls Group */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950 px-2.5 py-1 text-xs">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-500">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e: any) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="all">All ({statusCounts.all})</option>
                      <option value="completed">Completed ({statusCounts.completed})</option>
                      <option value="scheduled">Scheduled ({statusCounts.scheduled})</option>
                      <option value="draft">Drafts ({statusCounts.draft})</option>
                      <option value="sending">Active ({statusCounts.sending})</option>
                      <option value="failed">Failed ({statusCounts.failed})</option>
                    </select>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950 px-2.5 py-1 text-xs">
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-500">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="openRate">Highest Open Rate</option>
                      <option value="recipients">Most Recipients</option>
                    </select>
                  </div>

                  {/* Export CSV */}
                  <button
                    onClick={exportToCsv}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    title="Export CSV"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    Export
                  </button>
                </div>
              </div>

              {/* Active Selection Banner */}
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/50 dark:bg-indigo-950/30 px-3.5 py-2 text-xs text-indigo-900 dark:text-indigo-200">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{selectedIds.size} campaign{selectedIds.size > 1 ? 's' : ''} selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportToCsv}
                      className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:underline px-2"
                    >
                      Deselect
                    </button>
                  </div>
                </div>
              )}

              {/* Data Table Container */}
              <div className="rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs">
                {loading && campaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    <p className="mt-2 text-xs text-slate-500">Loading campaigns...</p>
                  </div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">No campaigns found</p>
                    {search || statusFilter !== 'all' ? (
                      <button
                        onClick={() => { setSearch(''); setStatusFilter('all'); }}
                        className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Reset filters
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <th scope="col" className="w-8 px-3 py-3 text-center">
                            <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                              {selectedIds.size === paginatedCampaigns.length && paginatedCampaigns.length > 0 ? (
                                <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                              ) : (
                                <Square className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </th>
                          <th scope="col" className="px-3.5 py-3 min-w-[260px]">Campaign Name &amp; Subject</th>
                          <th scope="col" className="px-3.5 py-3 min-w-[110px]">Status</th>
                          <th scope="col" className="px-3.5 py-3 min-w-[130px]">Recipients</th>
                          <th scope="col" className="px-3.5 py-3 min-w-[140px]">Performance</th>
                          <th scope="col" className="px-3.5 py-3 min-w-[130px]">Date</th>
                          <th scope="col" className="px-3.5 py-3 text-right min-w-[100px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {paginatedCampaigns.map((c) => {
                          const isSelected = selectedIds.has(c.id);
                          return (
                            <CampaignTableRow
                              key={c.id}
                              campaign={c}
                              isSelected={isSelected}
                              onToggleSelect={() => toggleSelect(c.id)}
                              onRefresh={loadData}
                              onViewDetails={() => setSelectedCampaignId(c.id)}
                            />
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Simple Enterprise Pagination */}
                {filteredCampaigns.length > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredCampaigns.length)}</strong>-<strong>{Math.min(currentPage * pageSize, filteredCampaigns.length)}</strong> of <strong>{filteredCampaigns.length}</strong>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 font-medium">{currentPage} / {totalPages}</span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

/* ─── Metric Card ─── */
function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Table Row Component ─── */
function CampaignTableRow({
  campaign,
  isSelected,
  onToggleSelect,
  onRefresh,
  onViewDetails,
}: {
  campaign: Campaign;
  isSelected: boolean;
  onRefresh: () => void;
  onViewDetails: () => void;
  onToggleSelect: () => void;
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const meta = CAMPAIGN_STATUS_META[campaign.status] || CAMPAIGN_STATUS_META.sent;

  return (
    <tr className={cx('hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors', isSelected && 'bg-indigo-50/30 dark:bg-indigo-950/20')}>
      <td className="px-3 py-3 text-center">
        <button onClick={onToggleSelect} className="text-slate-400 hover:text-indigo-600">
          {isSelected ? <CheckSquare className="h-3.5 w-3.5 text-indigo-600" /> : <Square className="h-3.5 w-3.5" />}
        </button>
      </td>
      <td className="px-3.5 py-3">
        <div className="flex flex-col">
          <span onClick={onViewDetails} className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 cursor-pointer">
            <FormattedTextWithTags text={campaign.name} />
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[280px]">
            <FormattedTextWithTags text={campaign.subject} />
          </span>
        </div>
      </td>
      <td className="px-3.5 py-3">
        <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase', meta.color)}>
          {meta.label}
        </span>
      </td>
      <td className="px-3.5 py-3 font-medium text-slate-800 dark:text-slate-200">
        {campaign.recipients.toLocaleString()}
      </td>
      <td className="px-3.5 py-3">
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <span className="text-slate-600 dark:text-slate-300">Open <strong>{campaign.openRate}%</strong></span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 dark:text-slate-300">Click <strong>{campaign.clickRate}%</strong></span>
        </div>
      </td>
      <td className="px-3.5 py-3 text-slate-600 dark:text-slate-400 text-[11px]">
        {campaign.sentAt || 'N/A'}
      </td>
      <td className="px-3.5 py-3 text-right">
        <button
          onClick={onViewDetails}
          className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          Details
        </button>
      </td>
    </tr>
  );
}
