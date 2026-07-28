import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { GlassCard, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  STATUS_META,
  CHANNEL_META,
  AUDIENCE_OPTIONS,
  type Broadcast,
  type BroadcastStatus,
} from './broadcastData';
import {
  fetchCampaigns,
  createCampaign,
  scheduleCampaign,
  executeDryRun,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  fetchWhatsAppTemplates,
  createWhatsAppTemplate,
  deleteWhatsAppTemplate,
  type WhatsAppTemplateDto,
  type TemplateButtonDto,
} from '@/lib/broadcastsApi';
import {
  Plus,
  Search,
  Send,
  Users,
  CheckCircle2,
  Reply,
  Clock,
  X,
  Megaphone,
  Filter,
  Sparkles,
  Trash2,
  Copy,
  ChevronRight,
  PhoneCall,
  Play,
  Pause,
  StopCircle,
  FileText,
  RefreshCw,
  Loader2,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Check,
  Image as ImageIcon,
  Video,
  File,
  Globe,
  Phone,
} from 'lucide-react';

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
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templates, setTemplates] = useState<WhatsAppTemplateDto[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [campRes, tmplRes] = await Promise.all([
      fetchCampaigns(0, 50),
      fetchWhatsAppTemplates(),
    ]);
    setLoading(false);

    if (tmplRes.data) {
      setTemplates(tmplRes.data);
    }

    if (campRes.data && campRes.data.content && campRes.data.content.length > 0) {
      const converted: Broadcast[] = campRes.data.content.map((c) => ({
        id: c.id,
        title: c.name,
        message: `Template ID: ${c.templateId || 'General Bulk'}`,
        audience: c.targetType || 'All Leads',
        recipients: c.totalRecipients || 100,
        channel: 'whatsapp',
        status: (c.status?.toLowerCase() as any) || 'sent',
        sentAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Recently',
        delivered: c.deliveredCount || 0,
        read: c.readCount || 0,
        responded: c.failedCount || 0,
        template: c.templateId || 'Meta Approved',
      }));
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

  const handleCreate = async (data: {
    title: string;
    message: string;
    audienceLabel: string;
    recipients: number;
    channel: Broadcast['channel'];
    schedule: string;
    status: BroadcastStatus;
    templateId?: string;
  }) => {
    const createRes = await createCampaign({
      name: data.title,
      templateId: data.templateId || 'UTILITY_GENERAL',
      targetType: 'ALL',
    });

    if (createRes.data) {
      const campId = createRes.data.id;
      if (data.status === 'sent' || data.status === 'scheduled') {
        await scheduleCampaign(campId);
      }
      await loadData();
      setSelectedId(campId);
    }
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (id.includes('-')) {
      await cancelCampaign(id);
    }
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleDeleteTemplate = async (templateName: string) => {
    if (confirm(`Are you sure you want to delete template "${templateName}"?`)) {
      const res = await deleteWhatsAppTemplate(templateName);
      if (res.success) {
        setTemplates((prev) => prev.filter((t) => t.name !== templateName));
      } else {
        alert(`Failed to delete template: ${res.error}`);
      }
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
              onClick={() => setShowCreate(true)}
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
                onClick={() => setShowCreateTemplate(true)}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
              >
                <Plus className="h-3.5 w-3.5" /> Create Template
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-1 rounded-xl2 border border-base-c bg-card-c p-1">
        <button
          onClick={() => setTab('broadcasts')}
          className={cx(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            tab === 'broadcasts' ? 'bg-gradient-accent text-white shadow-soft' : 'text-secondary-c hover:text-primary-c',
          )}
        >
          <Megaphone className="h-4 w-4" /> Broadcast Campaigns
          <span className={cx('rounded-full px-1.5 py-0.5 text-[10px] font-bold', tab === 'broadcasts' ? 'bg-white/20' : 'bg-slate-200 dark:bg-ink-800')}>
            {broadcasts.length}
          </span>
        </button>
        <button
          onClick={() => setTab('templates')}
          className={cx(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
            tab === 'templates' ? 'bg-gradient-accent text-white shadow-soft' : 'text-secondary-c hover:text-primary-c',
          )}
        >
          <FileText className="h-4 w-4" /> WhatsApp Templates
          <span className={cx('rounded-full px-1.5 py-0.5 text-[10px] font-bold', tab === 'templates' ? 'bg-white/20' : 'bg-slate-200 dark:bg-ink-800')}>
            {templates.length}
          </span>
        </button>
      </div>

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
          onCreateNew={() => setShowCreateTemplate(true)}
        />
      )}

      {/* Broadcast Create Modal */}
      {showCreate && (
        <CreateModal
          templates={templates}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {/* WhatsApp Template Creation Modal */}
      {showCreateTemplate && (
        <CreateWhatsAppTemplateModal
          onClose={() => setShowCreateTemplate(false)}
          onCreated={(newTpl) => {
            setTemplates((prev) => [newTpl, ...prev]);
            setShowCreateTemplate(false);
          }}
        />
      )}
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((tpl) => (
        <WhatsAppTemplateCard key={tpl.id || tpl.name} template={tpl} onDelete={() => onDelete(tpl.name)} />
      ))}
    </div>
  );
}

function WhatsAppTemplateCard({ template, onDelete }: { template: WhatsAppTemplateDto; onDelete: () => void }) {
  const status = template.status?.toUpperCase() || 'APPROVED';

  let statusBg = 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300';
  if (status === 'PENDING') statusBg = 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300';
  if (status === 'REJECTED') statusBg = 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300';

  return (
    <GlassCard hover className="flex flex-col justify-between p-4 space-y-3">
      <div>
        {/* Header strip */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-mono text-xs font-bold text-primary-c">{template.name}</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold', statusBg)}>
                {status}
              </span>
              <span className="rounded-full bg-slate-100 dark:bg-ink-800 px-2 py-0.5 text-[9px] font-semibold text-secondary-c uppercase">
                {template.category || 'MARKETING'}
              </span>
              <span className="text-[10px] text-muted-c">{template.language || 'en_US'}</span>
            </div>
          </div>
          <button
            onClick={onDelete}
            className="text-muted-c hover:text-danger-500 p-1 transition-colors"
            title="Delete Template"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* WhatsApp Preview Box */}
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-50/40 p-3 dark:bg-ink-850/60 font-sans text-xs space-y-2">
          {template.headerContent && (
            <p className="font-bold text-emerald-800 dark:text-emerald-300">{template.headerContent}</p>
          )}
          <div className="whitespace-pre-wrap text-secondary-c leading-relaxed">
            {renderWhatsAppFormattedText(template.bodyText || (template.components ? JSON.stringify(template.components) : ''))}
          </div>
          {template.footerText && (
            <p className="text-[10px] text-muted-c border-t border-emerald-500/10 pt-1">{template.footerText}</p>
          )}

          {/* Buttons */}
          {template.buttons && template.buttons.length > 0 && (
            <div className="space-y-1 pt-1">
              {template.buttons.map((btn, idx) => (
                <div key={idx} className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-white dark:bg-ink-900 py-1 px-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {btn.type === 'URL' ? <ExternalLink className="h-3 w-3" /> : btn.type === 'PHONE_NUMBER' ? <PhoneCall className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                  <span>{btn.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {template.rejectedReason && (
        <div className="flex items-center gap-1.5 rounded-lg bg-danger-500/10 p-2 text-[10px] text-danger-600 dark:text-danger-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Rejected: {template.rejectedReason}</span>
        </div>
      )}
    </GlassCard>
  );
}

/* ─── Split-Screen Create WhatsApp Template Modal with 3 Action Buttons Limit ─── */
function CreateWhatsAppTemplateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (template: WhatsAppTemplateDto) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('en_US');
  const [mediaSample, setMediaSample] = useState<'NONE' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO'>('NONE');
  const [headerContent, setHeaderContent] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  
  // Dynamic list of action buttons (Max limit: 3)
  const [buttonsList, setButtonsList] = useState<TemplateButtonDto[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = name.trim().length > 0 && bodyText.trim().length > 0 && !submitting;

  const insertFormatting = (prefix: string, suffix = prefix) => {
    const input = bodyRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = bodyText.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;

    const newText = bodyText.substring(0, start) + replacement + bodyText.substring(end);
    setBodyText(newText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const insertVariable = () => {
    const matches = bodyText.match(/\{\{\d+\}\}/g) || [];
    const nextVarNum = matches.length + 1;
    const varTag = `{{${nextVarNum}}}`;

    const input = bodyRef.current;
    if (input) {
      const start = input.selectionStart;
      const newText = bodyText.substring(0, start) + varTag + bodyText.substring(start);
      setBodyText(newText);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + varTag.length, start + varTag.length);
      }, 50);
    } else {
      setBodyText((prev) => prev + varTag);
    }
  };

  // Button management helpers (Max 3 buttons enforced)
  const handleAddButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER') => {
    if (buttonsList.length >= 3) return;
    if (type === 'QUICK_REPLY') {
      setButtonsList((prev) => [...prev, { type: 'QUICK_REPLY', text: '' }]);
    } else if (type === 'URL') {
      setButtonsList((prev) => [...prev, { type: 'URL', text: '', url: 'https://' }]);
    } else if (type === 'PHONE_NUMBER') {
      setButtonsList((prev) => [...prev, { type: 'PHONE_NUMBER', text: '', phoneNumber: '+91' }]);
    }
  };

  const handleRemoveButton = (index: number) => {
    setButtonsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateButton = (index: number, field: keyof TemplateButtonDto, value: string) => {
    setButtonsList((prev) =>
      prev.map((btn, i) => (i === index ? { ...btn, [field]: value } : btn)),
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const formattedName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Filter valid non-empty buttons
    const validButtons = buttonsList.filter((b) => b.text.trim().length > 0);

    const dto: WhatsAppTemplateDto = {
      name: formattedName,
      category,
      language,
      headerType: mediaSample !== 'NONE' ? mediaSample : headerType,
      headerContent: headerType === 'TEXT' ? headerContent.trim() : undefined,
      bodyText: bodyText.trim(),
      footerText: footerText.trim() || undefined,
      buttons: validButtons.length > 0 ? validButtons : undefined,
    };

    const res = await createWhatsAppTemplate(dto);
    setSubmitting(false);

    if (res.error) {
      alert(`Failed to create template: ${res.error}`);
      return;
    }

    if (res.data) {
      onCreated(res.data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6" onClick={onClose}>
      <div
        className="flex max-h-[94vh] w-full max-w-5xl flex-col rounded-xl2 border border-base-c bg-card-c shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-c px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-primary-c">Create WhatsApp Template</h3>
            <p className="text-xs text-muted-c">Form & real-time Meta live preview</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body: Split Screen (Left 65% Form, Right 35% Real-Time Preview) */}
        <div className="grid flex-1 overflow-hidden lg:grid-cols-[1fr_360px]">
          
          {/* Left Column: Form Fields */}
          <div className="overflow-y-auto p-6 space-y-6 scrollbar-thin border-r border-base-c">
            
            {/* Section 1: Template name & language */}
            <div className="rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-850/40 p-4 space-y-3">
              <h4 className="text-xs font-bold text-primary-c">Template name and language</h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-secondary-c">Name your template</label>
                    <span className="text-[10px] text-muted-c">{name.length}/512 {name.length > 0 && <Check className="inline-block h-3 w-3 text-emerald-500" />}</span>
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="e.g. site_visit_reminder"
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Select language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="form-input text-xs">
                    <option value="en_US">English (US)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="es">Spanish (es)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Content */}
            <div className="rounded-xl border border-base-c bg-card-c p-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-primary-c">Content</h4>
                <p className="text-[11px] text-muted-c mt-0.5">
                  Add a header, body, and footer for your template. Cloud API hosted by Meta will review template variables and content.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="form-input text-xs">
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-secondary-c">Media sample · Optional</label>
                  <select value={mediaSample} onChange={(e) => setMediaSample(e.target.value as any)} className="form-input text-xs">
                    <option value="NONE">None</option>
                    <option value="IMAGE">Image Header</option>
                    <option value="VIDEO">Video Header</option>
                    <option value="DOCUMENT">Document Header</option>
                  </select>
                </div>
              </div>

              {mediaSample === 'NONE' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-secondary-c">Header · Optional</label>
                    <span className="text-[10px] text-muted-c">{headerContent.length}/60</span>
                  </div>
                  <input
                    value={headerContent}
                    onChange={(e) => {
                      setHeaderContent(e.target.value);
                      if (e.target.value.trim() && headerType === 'NONE') setHeaderType('TEXT');
                    }}
                    placeholder="Add a short line of text to the header of your message"
                    className="form-input text-xs"
                  />
                </div>
              )}

              {/* Body Textarea with WhatsApp Formatting Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-secondary-c">Body <span className="text-danger-500">*</span></label>
                  <span className="text-[10px] text-muted-c">{bodyText.length}/1024</span>
                </div>

                {/* WhatsApp Formatting Bar */}
                <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-base-c bg-slate-100/80 dark:bg-ink-850 px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertFormatting('*')}
                      className="rounded p-1 text-secondary-c hover:bg-white hover:text-primary-c dark:hover:bg-ink-800"
                      title="Bold (*text*)"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('_')}
                      className="rounded p-1 text-secondary-c hover:bg-white hover:text-primary-c dark:hover:bg-ink-800"
                      title="Italic (_text_)"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('~')}
                      className="rounded p-1 text-secondary-c hover:bg-white hover:text-primary-c dark:hover:bg-ink-800"
                      title="Strikethrough (~text~)"
                    >
                      <Strikethrough className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('`')}
                      className="rounded p-1 text-secondary-c hover:bg-white hover:text-primary-c dark:hover:bg-ink-800"
                      title="Monospace (`text`)"
                    >
                      <Code className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={insertVariable}
                    className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                  >
                    <Plus className="h-3 w-3" /> Add variable
                  </button>
                </div>

                <textarea
                  ref={bodyRef}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={5}
                  placeholder="Enter the text for your message in the language you've selected. e.g. Hello {{1}}, your booking for {{2}} is confirmed!"
                  className="w-full rounded-b-xl border border-base-c bg-card-c p-3 text-xs leading-relaxed text-primary-c focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* Footer Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-secondary-c">Footer · Optional</label>
                  <span className="text-[10px] text-muted-c">{footerText.length}/60</span>
                </div>
                <input
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Add a short line of text to the bottom of your message"
                  className="form-input text-xs"
                />
              </div>
            </div>

            {/* Section 3: Quick Action Buttons (Optional - Limit Max 3 Buttons) */}
            <div className="rounded-xl border border-base-c bg-card-c p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-primary-c">Quick Action Buttons (Optional)</h4>
                  <p className="text-[10px] text-muted-c mt-0.5">Maximum 3 buttons allowed per Meta WhatsApp template</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {buttonsList.length}/3
                </span>
              </div>

              {/* Button Add Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddButton('QUICK_REPLY')}
                  disabled={buttonsList.length >= 3}
                  className={cx(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                    buttonsList.length < 3
                      ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:scale-105'
                      : 'border-slate-300 text-slate-400 dark:border-ink-800 cursor-not-allowed',
                  )}
                >
                  <Plus className="h-3.5 w-3.5" /> Quick Reply
                </button>

                <button
                  type="button"
                  onClick={() => handleAddButton('URL')}
                  disabled={buttonsList.length >= 3}
                  className={cx(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                    buttonsList.length < 3
                      ? 'border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 hover:scale-105'
                      : 'border-slate-300 text-slate-400 dark:border-ink-800 cursor-not-allowed',
                  )}
                >
                  <Plus className="h-3.5 w-3.5" /> Website Link
                </button>

                <button
                  type="button"
                  onClick={() => handleAddButton('PHONE_NUMBER')}
                  disabled={buttonsList.length >= 3}
                  className={cx(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                    buttonsList.length < 3
                      ? 'border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:scale-105'
                      : 'border-slate-300 text-slate-400 dark:border-ink-800 cursor-not-allowed',
                  )}
                >
                  <Plus className="h-3.5 w-3.5" /> Call Button
                </button>
              </div>

              {/* Added Buttons Inputs List */}
              {buttonsList.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  {buttonsList.map((btn, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-xl border border-base-c bg-slate-50/70 dark:bg-ink-850/60 p-2.5">
                      <span className="font-mono text-[10px] font-bold text-secondary-c shrink-0 w-24 uppercase">
                        {btn.type}
                      </span>

                      <div className="flex-1 space-y-1">
                        <input
                          value={btn.text}
                          onChange={(e) => handleUpdateButton(idx, 'text', e.target.value)}
                          placeholder="Button Label Text (e.g. Interested)"
                          className="form-input text-xs"
                        />

                        {btn.type === 'URL' && (
                          <input
                            value={btn.url || ''}
                            onChange={(e) => handleUpdateButton(idx, 'url', e.target.value)}
                            placeholder="Target Website URL (e.g. https://metrorealty.com)"
                            className="form-input text-xs font-mono"
                          />
                        )}

                        {btn.type === 'PHONE_NUMBER' && (
                          <input
                            value={btn.phoneNumber || ''}
                            onChange={(e) => handleUpdateButton(idx, 'phoneNumber', e.target.value)}
                            placeholder="Phone Number with Country Code (e.g. +91 9876543210)"
                            className="form-input text-xs font-mono"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveButton(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 transition-colors"
                        title="Remove Button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Real-Time Meta Live WhatsApp Preview */}
          <div className="bg-slate-100/70 dark:bg-ink-900/60 p-6 flex flex-col items-center justify-start border-l border-base-c overflow-y-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-c self-start mb-4">Template preview</h4>

            {/* Mock Phone Background */}
            <div className="w-full max-w-[300px] rounded-2xl border border-slate-300 dark:border-ink-800 bg-[#E5DDD5] dark:bg-[#0B141A] p-3 shadow-lg min-h-[380px] flex flex-col justify-between">
              
              {/* Top WhatsApp Chat Bubble */}
              <div className="self-start w-full max-w-[270px] rounded-xl bg-white dark:bg-[#005C4B] p-3 shadow-md text-xs space-y-2 text-slate-800 dark:text-slate-100 animate-fade-in">
                
                {/* Media Header Preview */}
                {mediaSample === 'IMAGE' && (
                  <div className="grid h-28 w-full place-items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-[10px] font-bold">Image Header Sample</span>
                  </div>
                )}
                {mediaSample === 'VIDEO' && (
                  <div className="grid h-28 w-full place-items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                    <Video className="h-8 w-8" />
                    <span className="text-[10px] font-bold">Video Header Sample</span>
                  </div>
                )}
                {mediaSample === 'DOCUMENT' && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
                    <File className="h-5 w-5" />
                    <span className="text-[10px] font-bold">Document Header Sample</span>
                  </div>
                )}

                {/* Text Header */}
                {mediaSample === 'NONE' && headerContent.trim() && (
                  <p className="font-bold text-slate-900 dark:text-white leading-tight">{headerContent}</p>
                )}

                {/* Rendered Formatted Body */}
                <div className="leading-relaxed">
                  {renderWhatsAppFormattedText(bodyText)}
                </div>

                {/* Footer */}
                {footerText.trim() && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-300/60 border-t border-slate-200 dark:border-white/10 pt-1">
                    {footerText}
                  </p>
                )}

                {/* Timestamp & Double Checkmark */}
                <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 dark:text-emerald-200/70 pt-0.5">
                  <span>13:08</span>
                  <span className="font-bold text-sky-500">✓✓</span>
                </div>
              </div>

              {/* Pinned Action Buttons underneath (Up to 3 buttons) */}
              {buttonsList.length > 0 && (
                <div className="w-full max-w-[270px] self-start mt-2 space-y-1">
                  {buttonsList.map((btn, idx) => (
                    <div key={idx} className="flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-[#005C4B] py-2 px-3 text-xs font-semibold text-sky-600 dark:text-sky-300 shadow-md">
                      {btn.type === 'URL' ? <Globe className="h-3.5 w-3.5 text-sky-500" /> : btn.type === 'PHONE_NUMBER' ? <Phone className="h-3.5 w-3.5 text-purple-500" /> : <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />}
                      <span>{btn.text || 'Button Text'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-4 text-[10px] text-center text-muted-c max-w-[260px]">
              This is an exact preview of how recipients will see your template on WhatsApp.
            </p>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between border-t border-base-c px-6 py-4 bg-slate-50/50 dark:bg-ink-850/40">
          <button onClick={onClose} className="rounded-lg border border-base-c px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c">
            Previous
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-xs font-bold transition-all shadow-md',
              canSubmit ? 'bg-sky-600 hover:bg-sky-700 text-white hover:scale-105' : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-ink-700',
            )}
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Submit for Review'}
          </button>
        </div>
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

function BroadcastListItem({
  broadcast,
  selected,
  onClick,
}: {
  broadcast: Broadcast;
  selected: boolean;
  onClick: () => void;
}) {
  const statusMeta = STATUS_META[broadcast.status];
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
            <span className={cx('h-2 w-2 rounded-full', statusMeta.dot)} />
            <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold', statusMeta.color)}>
              {statusMeta.label}
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
  const statusMeta = STATUS_META[broadcast.status];
  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-base-c pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={cx('rounded-full px-2.5 py-0.5 text-[10px] font-bold', statusMeta.color)}>
              {statusMeta.label}
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
    </GlassCard>
  );
}

function CreateModal({
  templates,
  onClose,
  onCreate,
}: {
  templates: WhatsAppTemplateDto[];
  onClose: () => void;
  onCreate: (data: any) => void;
}) {
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-xl2 border border-base-c bg-card-c p-5 shadow-soft-lg animate-slide-up sm:rounded-xl2" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-primary-c">New WhatsApp Broadcast</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-secondary-c">Broadcast Campaign Name</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend Property Festival" className="form-input text-xs" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-secondary-c">Select Approved WhatsApp Template</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="form-input text-xs">
              <option value="">Select a Meta Template…</option>
              {templates.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.category} - {t.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-base-c pt-4">
          <button onClick={onClose} className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c">Cancel</button>
          <button
            onClick={() => onCreate({ title, templateId, recipients: 100, channel: 'whatsapp', schedule: 'Now', status: 'sent' })}
            disabled={!title || !templateId}
            className={cx('rounded-lg px-4 py-2 text-xs font-semibold text-white', title && templateId ? 'bg-gradient-accent' : 'bg-slate-300 cursor-not-allowed')}
          >
            Launch Broadcast
          </button>
        </div>
      </div>
    </div>
  );
}
