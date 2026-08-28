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
  fetchWhatsAppTemplates,
  deleteWhatsAppTemplate,
  fetchCampaignRecipients,
  type WhatsAppTemplateDto,
  type WhatsAppCampaignRecipientDto,
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
} from 'lucide-react';
import { TabSwitcher } from '@/components/ui/TabSwitcher';

type FilterStatus = BroadcastStatus | 'ALL';
type MainTab = 'broadcasts' | 'templates';

/* ─── WhatsApp Text Formatter Helper ─── */
function renderWhatsAppFormattedText(text: string) {
  if (!text) return <span className="text-slate-400 italic">Body message content preview...</span>;

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
          delivered: c.deliveredCount || 0,
          read: c.readCount || 0,
          responded: c.failedCount || 0,
          template: c.templateId || 'Meta Approved',
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
    const sent = broadcasts.filter((b) => b.status === 'sent');
    const totalRecipients = sent.reduce((s, b) => s + b.recipients, 0);
    const totalDelivered = sent.reduce((s, b) => s + b.delivered, 0);
    const totalRead = sent.reduce((s, b) => s + b.read, 0);
    const totalResponded = sent.reduce((s, b) => s + b.responded, 0);
    return {
      totalSent: sent.length,
      totalRecipients,
      deliveryRate: totalRecipients ? Math.round((totalDelivered / totalRecipients) * 100) : 0,
      readRate: totalDelivered ? Math.round((totalRead / totalDelivered) * 100) : 0,
      responseRate: totalRead ? Math.round((totalResponded / totalRead) * 100) : 0,
    };
  }, [broadcasts]);



  const handleDelete = async (id: string) => {
    if (id.includes('-')) {
      await cancelCampaign(id);
    }
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
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
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">WhatsApp Broadcasts & Templates</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Create, send, and manage Meta-approved WhatsApp marketing & utility templates.</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'broadcasts' ? (
            <button
              onClick={() => navigate('/broadcasts/create')}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
            >
              <Plus className="h-3.5 w-3.5" /> New Broadcast
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncTemplates}
                disabled={templatesLoading}
                className="flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c"
              >
                <RefreshCw className={cx('h-3.5 w-3.5', templatesLoading && 'animate-spin')} /> Sync with Meta
              </button>
              <button
                onClick={() => navigate('/broadcasts/create-template')}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
              >
                <Plus className="h-3.5 w-3.5" /> Create Template
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
          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Send} label="Campaigns Sent" value={String(stats.totalSent)} accent="#2563EB" />
            <StatCard icon={Users} label="Total Recipients" value={stats.totalRecipients.toLocaleString()} accent="#7C3AED" />
            <StatCard icon={CheckCircle2} label="Delivery Rate" value={`${stats.deliveryRate}%`} accent="#10B981" />
            <StatCard icon={Reply} label="Response Rate" value={`${stats.responseRate}%`} accent="#F59E0B" />
          </div>

          {/* Main layout */}
          <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
            {/* Left: list */}
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search broadcasts…"
                    className="form-input pl-9"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 shrink-0 text-muted-c" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                    className="flex-1 rounded-lg border border-base-c bg-card-c px-2 py-1.5 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="sent">Sent</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="draft">Draft</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 lg:max-h-[calc(100vh-340px)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Megaphone className="h-10 w-10 text-muted-c/30" />
                    <p className="mt-3 text-sm text-muted-c">No broadcasts found</p>
                  </div>
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

            {/* Right: detail */}
            {selected ? (
              <BroadcastDetail
                broadcast={selected}
                onDelete={() => handleDelete(selected.id)}
              />
            ) : (
              <GlassCard className="grid place-items-center py-20">
                <div className="text-center">
                  <Megaphone className="mx-auto h-12 w-12 text-muted-c/30" />
                  <p className="mt-3 text-sm text-muted-c">Select a broadcast to view details</p>
                </div>
              </GlassCard>
            )}
          </div>
        </>
      ) : (
        /* WhatsApp Templates Tab */
        <TemplatesTab
          templates={templates}
          loading={templatesLoading}
          onDelete={handleDeleteTemplate}
          onCreateNew={() => navigate('/broadcasts/create-template')}
        />
      )}





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
    </div>
  );
}

/* ─── Templates Tab View ─── */
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
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const selected = useMemo(() => templates.find(t => t.name === selectedName), [templates, selectedName]);
  if (loading && templates.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-3 text-xs text-muted-c">Syncing templates with Meta API…</p>
      </GlassCard>
    );
  }

  if (templates.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-c/30" />
        <h3 className="mt-3 text-sm font-bold text-primary-c">No WhatsApp Templates Found</h3>
        <p className="mt-1 text-xs text-muted-c max-w-sm">
          Create a new WhatsApp message template to submit it to Meta for approval. Once approved, you can send it in bulk broadcasts.
        </p>
        <button
          onClick={onCreateNew}
          className="mt-4 flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white shadow-soft"
        >
          <Plus className="h-3.5 w-3.5" /> Create Template
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="grid flex-1 items-start gap-6 lg:gap-8 lg:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr]">
      {/* Left: Premium List of templates */}
      <div className="surface flex flex-col rounded-2xl shadow-sm border border-base-c bg-card-c overflow-hidden h-[450px] lg:h-[calc(100vh-220px)]">
        <div className="bg-subtle-c border-b border-base-c px-5 py-3.5 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-bold text-primary-c">All Templates</h3>
          <span className="rounded-full bg-slate-200/50 dark:bg-ink-800 px-2.5 py-0.5 text-xs font-semibold text-secondary-c">
            {templates.length}
          </span>
        </div>
        <div className="divide-y divide-base-c overflow-y-auto scrollbar-thin flex-1">
          {templates.map((tpl) => {
            const status = tpl.status?.toUpperCase() || 'APPROVED';
            let statusColor = 'text-success-700 bg-success-50 ring-1 ring-success-200 dark:bg-success-500/10 dark:text-success-400 dark:ring-success-500/20';
            if (status === 'PENDING') statusColor = 'text-warning-700 bg-warning-50 ring-1 ring-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:ring-warning-500/20';
            if (status === 'REJECTED') statusColor = 'text-danger-700 bg-danger-50 ring-1 ring-danger-200 dark:bg-danger-500/10 dark:text-danger-400 dark:ring-danger-500/20';

            const isSelected = selectedName === tpl.name;
            return (
              <div
                key={tpl.id || tpl.name}
                onClick={() => setSelectedName(tpl.name)}
                className={cx(
                  "cursor-pointer p-4 transition-all hover:bg-slate-50 dark:hover:bg-ink-850 flex flex-col gap-2 relative",
                  isSelected ? "bg-primary-50/50 dark:bg-primary-500/5" : ""
                )}
              >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />}
                
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-primary-c truncate flex-1">{tpl.name}</span>
                  <span className={cx("text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0", statusColor)}>{status}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-secondary-c font-medium">
                  <span className="uppercase tracking-wider">{tpl.category || 'MARKETING'}</span>
                  <span>{tpl.language || 'en_US'}</span>
                </div>
              </div>
            );
          })}
          
          {templates.length === 0 && (
            <div className="p-8 text-center text-muted-c text-sm">
              No templates found.
            </div>
          )}
        </div>
      </div>

      {/* Right: Template Preview Detail */}
      <div className="h-[650px] lg:h-[calc(100vh-220px)] flex flex-col overflow-y-auto pr-2 scrollbar-thin">
        {selected ? (
          <WhatsAppTemplateCard 
            template={selected} 
            onDelete={() => {
              onDelete(selected.name);
              setSelectedName(null);
            }} 
          />
        ) : (
          <div className="flex-1 rounded-2xl border-2 border-dashed border-base-c bg-transparent flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-ink-800 flex items-center justify-center mb-4">
              <LayoutTemplate className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-primary-c">No Template Selected</h3>
            <p className="mt-2 text-sm text-secondary-c max-w-[260px]">
              Select a template from the list to view its configuration and a live WhatsApp preview.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function WhatsAppTemplateCard({ template, onDelete }: { template: WhatsAppTemplateDto; onDelete: () => void }) {
  const status = template.status?.toUpperCase() || 'APPROVED';

  let statusBg = 'bg-success-50 text-success-700 ring-1 ring-success-200 dark:bg-success-500/15 dark:text-success-300 dark:ring-success-500/20';
  if (status === 'PENDING') statusBg = 'bg-warning-50 text-warning-700 ring-1 ring-warning-200 dark:bg-warning-500/15 dark:text-warning-300 dark:ring-warning-500/20';
  if (status === 'REJECTED') statusBg = 'bg-danger-50 text-danger-700 ring-1 ring-danger-200 dark:bg-danger-500/15 dark:text-danger-300 dark:ring-danger-500/20';

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-ink-950 rounded-2xl border border-base-c overflow-hidden shadow-sm">
      {/* Premium Header Strip */}
      <div className="bg-card-c border-b border-base-c px-6 py-5 flex items-start justify-between gap-4 shrink-0">
        <div className="space-y-2">
          <h3 className="font-mono text-xl font-bold text-primary-c tracking-tight">{template.name}</h3>
          <div className="flex items-center gap-3">
            <span className={cx('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase', statusBg)}>
              {status}
            </span>
            <span className="rounded-full bg-slate-200/50 dark:bg-ink-800 px-2.5 py-0.5 text-[10px] font-bold text-secondary-c uppercase tracking-wider">
              {template.category || 'MARKETING'}
            </span>
            <span className="text-xs font-medium text-muted-c">{template.language || 'en_US'}</span>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="rounded-lg hover:bg-danger-50 text-muted-c hover:text-danger-500 p-2.5 transition-colors border border-transparent hover:border-danger-100"
          title="Delete Template"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {template.rejectedReason && (
        <div className="bg-danger-50 border-b border-danger-100 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-danger-600 mt-0.5" />
          <div className="text-sm text-danger-800">
            <strong className="font-bold block mb-1">Template Rejected</strong>
            {template.rejectedReason}
          </div>
        </div>
      )}

      {/* WhatsApp Live Preview Body */}
      <div className="flex-1 p-4 sm:p-8 flex flex-col items-center justify-start bg-slate-50/50 dark:bg-ink-950/50 relative overflow-y-auto max-h-[85vh] scrollbar-thin">
        <div className="flex items-center gap-2 mb-4 sm:mb-6 self-start max-w-[340px] mx-auto w-full">
          <Smartphone className="h-5 w-5 text-emerald-600" />
          <h4 className="text-sm font-bold text-primary-c">WhatsApp Preview</h4>
        </div>

        {/* Premium Mock Phone */}
        <div className="relative w-full max-w-[340px] rounded-[2.5rem] sm:rounded-[3rem] border-[6px] sm:border-[8px] border-slate-900 bg-[#E5DDD5] shadow-2xl overflow-hidden min-h-[520px] sm:min-h-[580px] flex flex-col shrink-0">
          {/* Phone Notch */}
          <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-2xl w-32 mx-auto z-20"></div>

          {/* WhatsApp Header */}
          <div className="bg-[#075E54] text-white pt-10 pb-3 px-4 flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-6 w-6" />
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                <div className="h-7 w-7 rounded-full bg-slate-200" />
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">Business Name</div>
                <div className="text-[10px] text-white/80 opacity-90">Business Account</div>
              </div>
            </div>
            <div className="flex gap-4">
              <Video className="h-5 w-5 opacity-90" />
              <Phone className="h-5 w-5 opacity-90" />
              <MoreVertical className="h-5 w-5 opacity-90" />
            </div>
          </div>

          {/* WhatsApp Chat Area */}
          <div className="flex-1 p-4 relative overflow-y-auto scrollbar-thin" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover' }}>
            <div className="flex justify-center mb-4">
              <span className="bg-[#E1F3FB] text-slate-600 text-[11px] px-3 py-1 rounded-lg shadow-sm font-medium">TODAY</span>
            </div>

            <div className="flex justify-start">
              {/* Tail SVG */}
              <svg viewBox="0 0 8 13" width="8" height="13" className="absolute left-[8px] mt-1 text-white">
                <path opacity="1" fill="currentColor" d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"></path>
              </svg>
              
              <div className="relative max-w-[275px] bg-white rounded-lg rounded-tl-none shadow-sm flex flex-col z-10 ml-2">
                <div className="p-2.5 space-y-2">
                  {template.headerContent && (
                    <p className="font-bold text-slate-900 text-[15px] px-1 pt-1">{template.headerContent}</p>
                  )}
                  
                  <div className="text-[14px] text-[#111b21] leading-relaxed px-1">
                    {renderWhatsAppFormattedText(template.bodyText || (template.components ? JSON.stringify(template.components) : ''))}
                  </div>

                  <div className="flex items-end justify-between gap-4 px-1 pt-1">
                    <p className="text-[11px] text-slate-500 truncate flex-1">
                      {template.footerText || ''}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                      <span>13:08</span>
                      <Check className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                {template.buttons && template.buttons.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/50 rounded-b-lg overflow-hidden divide-y divide-slate-100">
                    {template.buttons.map((btn, idx) => (
                      <div key={idx} className="flex items-center justify-center gap-2 py-2.5 px-3 text-[14px] text-[#00A884] bg-white">
                        {btn.type === 'URL' ? <ExternalLink className="h-4 w-4" /> : btn.type === 'PHONE_NUMBER' ? <PhoneCall className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                        <span className="font-medium truncate">{btn.text || 'Action Button'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 inset-x-0 flex justify-center">
            <div className="h-1 w-24 bg-slate-900/20 rounded-full" />
          </div>
        </div>
        
        <p className="mt-6 text-xs text-muted-c text-center max-w-[280px]">
          Preview illustrates how this message appears on iOS devices. Actual rendering may vary slightly on Android.
        </p>
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Send;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <GlassCard className="flex items-center gap-3 p-3.5">
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl2"
        style={{ backgroundColor: `${accent}15` }}
      >
        <Icon className="h-4.5 w-4.5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-c">{label}</p>
        <p className="mt-0.5 text-lg font-bold tabular-nums text-primary-c">{value}</p>
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

  return (
    <div
      onClick={onClick}
      className={cx(
        'group cursor-pointer rounded-xl2 border p-3 transition-all',
        selected
          ? 'border-primary-500 bg-primary-500/10 shadow-soft'
          : 'border-base-c bg-card-c hover:border-primary-500/30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cx('h-2 w-2 rounded-full', dotClass)} />
            <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold', colorClass)}>
              {labelText}
            </span>
          </div>
          <h4 className="mt-1.5 truncate text-xs font-bold text-primary-c">{broadcast.title}</h4>
          <p className="mt-0.5 truncate text-[11px] text-muted-c">{broadcast.template}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-c transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-base-c pt-2 text-[10px] text-muted-c">
        <span>{broadcast.recipients} recipients</span>
        <span>{broadcast.sentAt}</span>
      </div>
    </div>
  );
}

function BroadcastDetail({
  broadcast,
  onDelete,
}: {
  broadcast: Broadcast;
  onDelete: () => void;
}) {
  const statusMeta = (broadcast?.status && STATUS_META[broadcast.status])
    || (broadcast?.status && STATUS_META[broadcast.status.toLowerCase()])
    || DEFAULT_STATUS_META;
  const colorClass = statusMeta?.color || 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300';
  const labelText = statusMeta?.label || broadcast?.status || 'Broadcast';

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-base-c pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={cx('rounded-full px-2.5 py-0.5 text-[10px] font-bold', colorClass)}>
              {labelText}
            </span>
            <span className="text-xs text-muted-c">ID: {broadcast.id}</span>
          </div>
          <h3 className="mt-1.5 text-base font-bold text-primary-c">{broadcast.title}</h3>
          <p className="mt-0.5 text-xs text-secondary-c">Target: {broadcast.audience}</p>
        </div>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded-lg border border-danger-500/30 bg-danger-500/10 px-2.5 py-1.5 text-xs font-semibold text-danger-600 dark:text-danger-400 hover:bg-danger-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>

      <div className="rounded-xl border border-base-c bg-slate-50/50 p-3.5 dark:bg-ink-850/40">
        <p className="text-[10px] font-bold uppercase text-muted-c">Template & Content</p>
        <p className="mt-1 text-xs font-semibold text-primary-c">{broadcast.template}</p>
        <p className="mt-1 text-xs text-secondary-c">{broadcast.message}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-base-c pt-4 text-center">
        <div>
          <p className="text-[10px] font-medium text-muted-c">Delivered</p>
          <p className="mt-0.5 text-base font-bold text-success-600 dark:text-success-400 tabular-nums">{broadcast.delivered}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-muted-c">Read</p>
          <p className="mt-0.5 text-base font-bold text-primary-600 dark:text-primary-400 tabular-nums">{broadcast.read}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-muted-c font-sans">Failed</p>
          <p className="mt-0.5 text-base font-bold text-warning-600 dark:text-warning-400 tabular-nums">{broadcast.responded}</p>
        </div>
      </div>

      {/* Recipient Logs & Meta Reasons Table */}
      <CampaignRecipientsTable campaignId={broadcast.id} />
    </GlassCard>
  );
}

// ─── Classified Meta Failure Reason Helper ──────────────────────────────────

function getMetaReasonInfo(errorMessage?: string, skipReason?: string) {
  const text = ((errorMessage || '') + ' ' + (skipReason || '')).toLowerCase();

  if (text.includes('payment') || text.includes('bill') || text.includes('credit') || text.includes('business_payment')) {
    return {
      label: 'Meta Payment Issue',
      desc: 'Meta Business account bill unpaid or payment method declined.',
      badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-300',
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
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-200',
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
      <div className="flex items-center justify-center p-6 text-xs text-muted-c">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading recipient data & Meta delivery status...
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4 border-t border-base-c pt-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h4 className="text-xs font-bold text-primary-c flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary-500" />
            Uploaded Data & Meta Status Logs ({recipients.length})
          </h4>
          <p className="text-[10px] text-muted-c">Displays CSV/Excel row data, delivery status & Meta policy failure reasons</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3 w-3 text-muted-c" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search phone or data..."
              className="h-7 w-36 rounded-lg border border-base-c bg-card-c pl-7 pr-2 text-[11px] text-primary-c placeholder:text-muted-c focus:border-primary-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'FAILED_ONLY' | 'SENT' | 'DELIVERED' | 'READ')}
            className="h-7 rounded-lg border border-base-c bg-card-c px-2 text-[11px] text-primary-c focus:border-primary-500 focus:outline-none"
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
        <div className="rounded-xl border border-dashed border-base-c p-6 text-center text-xs text-muted-c">
          No recipient logs available for this campaign filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-c bg-card-c max-h-72 overflow-y-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-ink-800 text-[10px] uppercase tracking-wider text-muted-c border-b border-base-c">
              <tr>
                <th className="p-2.5">Phone Number</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Meta Reason / Delivery Status</th>
                <th className="p-2.5">Uploaded CSV / Variable Data</th>
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
                } catch (e) { console.error(e); }

                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-ink-850/50 transition-colors">
                    <td className="p-2.5 font-semibold text-primary-c whitespace-nowrap">
                      {r.phoneNumber}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span
                        className={cx(
                          'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase',
                          r.status === 'READ'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                            : r.status === 'DELIVERED'
                            ? 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300'
                            : r.status === 'SENT'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                            : isFail
                            ? 'bg-danger-100 text-danger-700 dark:bg-danger-500/20 dark:text-danger-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300'
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-2.5">
                      {isFail && reasonMeta ? (
                        <div className="space-y-0.5">
                          <span className={cx('inline-block rounded border px-1.5 py-0.5 text-[9px] font-bold', reasonMeta.badge)}>
                            {reasonMeta.label}
                          </span>
                          <p className="text-[10px] text-muted-c max-w-xs truncate" title={reasonMeta.desc}>
                            {reasonMeta.desc}
                          </p>
                        </div>
                      ) : r.status === 'READ' ? (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Read by recipient</span>
                      ) : r.status === 'DELIVERED' ? (
                        <span className="text-[10px] text-success-600 dark:text-success-400 font-medium">Delivered to handset</span>
                      ) : (
                        <span className="text-[10px] text-muted-c">Sent to Meta Cloud API</span>
                      )}
                    </td>
                    <td className="p-2.5 text-muted-c max-w-xs truncate font-mono text-[10px]">
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


