import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  CAMPAIGN_STATUS_META,
  TEMPLATE_CATEGORY_META,
  type EmailTemplate,
  type Campaign,
} from './emailData';
import {
  fetchEmailCampaigns,
  sendEmailCampaign,
  fetchEmailTemplates,
  generateAiEmailContent,
  type CustomEmailDTO,
  type EmailTemplateDTO,
  type RecipientMode,
} from '@/lib/emailsApi';
import {
  Mail,
  Plus,
  Search,
  Send,
  Clock,
  Users,
  MailOpen,
  MousePointerClick,
  Sparkles,
  ChevronRight,
  X,
  FileText,
  Copy,
  Megaphone,
  TrendingUp,
  Inbox,
  Loader2,
  AlertTriangle,
  Tag,
  Upload,
  Download,
  Info,
} from 'lucide-react';

type Tab = 'campaigns' | 'compose';

function mapDtoToCampaign(dto: CustomEmailDTO): Campaign {
  let status: Campaign['status'] = 'sent';
  if (dto.status === 'DRAFT') status = 'draft';
  else if (dto.status === 'SENDING') status = 'sending';
  else if (dto.status === 'FAILED') status = 'draft';

  return {
    id: dto.id,
    name: dto.subject,
    subject: dto.subject,
    status,
    recipients: dto.totalSent || 0,
    openRate: 0,
    clickRate: 0,
    sentAt: dto.sentAt
      ? new Date(dto.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      : dto.createdAt
      ? new Date(dto.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Just now',
    template: dto.recipientMode ? `Mode: ${dto.recipientMode}` : 'Custom Email',
  };
}

function mapDtoToTemplate(dto: EmailTemplateDTO): EmailTemplate {
  const validCategories: EmailTemplate['category'][] = ['follow_up', 'welcome', 'promotion', 'announcement', 'nurture'];
  const catStr = (dto.interestCategory?.toLowerCase() || 'follow_up') as EmailTemplate['category'];
  const category = validCategories.includes(catStr) ? catStr : 'follow_up';

  return {
    id: dto.id,
    name: dto.name,
    subject: dto.subject,
    body: dto.content,
    category,
  };
}

export function EmailsView() {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    const [cmpRes, tplRes] = await Promise.all([
      fetchEmailCampaigns(0, 100),
      fetchEmailTemplates(),
    ]);

    if (cmpRes.error) {
      setApiError(cmpRes.error);
      setCampaigns([]);
    } else if (cmpRes.data) {
      setCampaigns(cmpRes.data.content.map(mapDtoToCampaign));
    }

    if (tplRes.data) {
      setTemplates(tplRes.data.map(mapDtoToTemplate));
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

  const totalSent = campaigns.filter((c) => c.status === 'sent').length;
  const totalRecipients = campaigns.filter((c) => c.status === 'sent').reduce((s, c) => s + c.recipients, 0);
  const avgOpen = campaigns.filter((c) => c.openRate > 0).length > 0
    ? Math.round(campaigns.filter((c) => c.openRate > 0).reduce((s, c) => s + c.openRate, 0) / campaigns.filter((c) => c.openRate > 0).length)
    : 0;
  const scheduled = campaigns.filter((c) => c.status === 'scheduled').length;

  const handleCampaignSent = () => {
    loadData();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Email Campaigns</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Create, send, and track email campaigns to your leads.</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary-500" />}
          <button
            onClick={() => setComposeOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
          >
            <Plus className="h-3.5 w-3.5" /> New Campaign
          </button>
        </div>
      </div>

      {apiError && (
        <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Backend Connection Error: {apiError}. Make sure backend is running and authenticated.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Megaphone} label="Campaigns Sent" value={String(totalSent)} color="#2563EB" bg="rgba(37,99,235,0.10)" sub="All time" />
        <StatCard icon={Users} label="Total Recipients" value={totalRecipients.toLocaleString()} color="#7C3AED" bg="rgba(124,58,237,0.10)" sub="Reached" />
        <StatCard icon={MailOpen} label="Avg Open Rate" value={`${avgOpen}%`} color="#10B981" bg="rgba(16,185,129,0.10)" sub="Across sent campaigns" />
        <StatCard icon={Clock} label="Scheduled" value={String(scheduled)} color="#F59E0B" bg="rgba(245,158,11,0.10)" sub="Pending send" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl2 border border-base-c bg-card-c p-1">
        <TabButton active={tab === 'campaigns'} onClick={() => setTab('campaigns')} icon={Inbox} label="Campaigns" count={campaigns.length} />
        <TabButton active={tab === 'compose'} onClick={() => setTab('compose')} icon={FileText} label="Templates" count={templates.length} />
      </div>

      {/* Content */}
      {tab === 'campaigns' ? (
        <CampaignList campaigns={filtered} search={search} setSearch={setSearch} loading={loading} />
      ) : (
        <TemplateGallery templates={templates} loading={loading} />
      )}

      {/* Compose Email Modal */}
      {composeOpen && (
        <ComposeEmailModal
          onClose={() => setComposeOpen(false)}
          onSent={handleCampaignSent}
        />
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
function CampaignList({ campaigns, search, setSearch, loading }: { campaigns: Campaign[]; search: string; setSearch: (v: string) => void; loading: boolean }) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campaigns…"
          className="form-input pl-9"
        />
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
        campaigns.map((c) => (
          <CampaignRow key={c.id} campaign={c} />
        ))
      )}
    </div>
  );
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const meta = CAMPAIGN_STATUS_META[campaign.status] || CAMPAIGN_STATUS_META.sent;
  return (
    <GlassCard className="p-4 transition-all hover:shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cx('h-2 w-2 rounded-full', meta.dot)} />
            <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold', meta.color)}>{meta.label}</span>
            <span className="text-[10px] text-muted-c">{campaign.sentAt}</span>
          </div>
          <h4 className="mt-2 text-sm font-semibold text-primary-c">{campaign.name}</h4>
          <p className="mt-0.5 truncate text-xs text-secondary-c">{campaign.subject}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-c" />
      </div>

      {/* Metrics */}
      {campaign.status === 'sent' && (
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-base-c pt-3">
          <Metric icon={Users} label="Recipients" value={campaign.recipients.toLocaleString()} />
          <Metric icon={MailOpen} label="Opens" value={`${campaign.openRate}%`} highlight={campaign.openRate >= 60} />
          <Metric icon={MousePointerClick} label="Clicks" value={`${campaign.clickRate}%`} highlight={campaign.clickRate >= 20} />
          <Metric icon={TrendingUp} label="Template" value={campaign.template} />
        </div>
      )}
      {campaign.status === 'scheduled' && (
        <div className="mt-3 flex items-center gap-2 border-t border-base-c pt-3">
          <Clock className="h-3.5 w-3.5 text-primary-500" />
          <span className="text-xs text-secondary-c">Scheduled for {campaign.sentAt}</span>
          <span className="text-xs text-muted-c">· {campaign.recipients} recipients</span>
        </div>
      )}
      {campaign.status === 'draft' && (
        <div className="mt-3 flex items-center gap-2 border-t border-base-c pt-3">
          <FileText className="h-3.5 w-3.5 text-muted-c" />
          <span className="text-xs text-muted-c">Draft · {campaign.recipients} recipients targeted</span>
        </div>
      )}
    </GlassCard>
  );
}

function Metric({ icon: Icon, label, value, highlight }: { icon: typeof Mail; label: string; value: string; highlight?: boolean }) {
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

/* ─── Compose Email Modal (Matches User Screenshot UI 1-to-1) ─── */
function ComposeEmailModal({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: () => void;
}) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('ALL');
  const [tagsFilter, setTagsFilter] = useState('');
  const [manualRecipients, setManualRecipients] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWriteAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    const res = await generateAiEmailContent(aiPrompt.trim());
    setAiLoading(false);

    if (res.error) {
      setAiError(res.error);
    } else if (res.data) {
      if (res.data.subject) setSubject(res.data.subject);
      if (res.data.body) setBody(res.data.body);
      else if ((res.data as any).text) setBody((res.data as any).text);
      if ((res.data as any).ctaLabel) setCtaLabel((res.data as any).ctaLabel);
      if ((res.data as any).ctaUrl) setCtaUrl((res.data as any).ctaUrl);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'email_recipients_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        const emails: string[] = [];
        lines.forEach((line) => {
          const parts = line.split(',');
          const emailCandidate = parts[parts.length - 1]?.trim();
          if (emailCandidate && emailCandidate.includes('@')) {
            emails.push(emailCandidate);
          }
        });
        if (emails.length > 0) {
          setManualRecipients((prev) => (prev ? `${prev}, ${emails.join(', ')}` : emails.join(', ')));
        }
      }
    };
    reader.readAsText(file);
  };

  const canSubmit = subject.trim().length > 0 && body.trim().length > 0 && (
    recipientMode === 'ALL' ||
    (recipientMode === 'TAGGED' && tagsFilter.trim().length > 0) ||
    (recipientMode === 'MANUAL' && manualRecipients.trim().length > 0)
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);

    const res = await sendEmailCampaign({
      subject: subject.trim(),
      body: body.trim(),
      ctaLabel: ctaLabel.trim() || undefined,
      ctaUrl: ctaUrl.trim() || undefined,
      recipientMode,
      tagsFilter: recipientMode === 'TAGGED' ? tagsFilter.trim() : undefined,
      manualRecipients: recipientMode === 'MANUAL' ? manualRecipients.trim() : undefined,
    });

    setSending(false);

    if (res.error) {
      alert(`Failed to send campaign: ${res.error}`);
      return;
    }

    onSent();
    setShowConfirmation(true);
  };

  if (showConfirmation) {
    return (
      <SentConfirmation
        campaignName={subject}
        recipientMode={recipientMode}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-xl2 border border-base-c bg-card-c shadow-soft-lg animate-slide-up sm:rounded-xl2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-c px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-primary-c">Compose Email</h3>
            <p className="text-xs text-muted-c">Send a new email campaign</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          {/* Section 1: Email Content */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-c">Email Content</h4>

            {/* AI Email Writer Banner */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">AI Email Writer</span>
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-500">
                  PRO Feature
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Write a summer sale promo email"
                  className="form-input flex-1 bg-white dark:bg-ink-900 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleWriteAi();
                  }}
                />
                <button
                  onClick={handleWriteAi}
                  disabled={!aiPrompt.trim() || aiLoading}
                  className={cx(
                    'rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                    aiPrompt.trim() && !aiLoading
                      ? 'bg-gradient-accent text-white hover:scale-105'
                      : 'bg-slate-200 text-slate-400 dark:bg-ink-800 cursor-not-allowed',
                  )}
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Write'}
                </button>
              </div>

              {aiError ? (
                <p className="text-[10px] text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {aiError}
                </p>
              ) : (
                <p className="text-[10px] text-muted-c flex items-center gap-1">
                  <span>🔒 AI Content Generation is available for PRO & Enterprise users.</span>
                </p>
              )}
            </div>

            {/* Subject Input */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary-c">
                Subject <span className="text-danger-500">*</span>
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject *"
                className="form-input text-xs"
              />
            </div>

            {/* Body Textarea */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary-c">
                Body <span className="text-danger-500">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="Body *"
                className="form-input resize-none text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Call to Action */}
          <div className="space-y-3 border-t border-base-c pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-c">Call to Action</h4>

            <div>
              <input
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="CTA Button Label (optional)"
                className="form-input text-xs"
              />
            </div>

            <div>
              <input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="CTA Button URL (optional)"
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* Section 3: Recipients */}
          <div className="space-y-3 border-t border-base-c pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-c">Recipients</h4>

            {/* Recipient Mode Tabs */}
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-base-c bg-slate-100/60 dark:bg-ink-850 p-1">
              <button
                type="button"
                onClick={() => setRecipientMode('ALL')}
                className={cx(
                  'flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                  recipientMode === 'ALL'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm'
                    : 'text-secondary-c hover:text-primary-c',
                )}
              >
                <Users className="h-3.5 w-3.5 text-indigo-500" /> All
              </button>
              <button
                type="button"
                onClick={() => setRecipientMode('TAGGED')}
                className={cx(
                  'flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                  recipientMode === 'TAGGED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm'
                    : 'text-secondary-c hover:text-primary-c',
                )}
              >
                <Tag className="h-3.5 w-3.5 text-amber-500" /> Tagged
              </button>
              <button
                type="button"
                onClick={() => setRecipientMode('MANUAL')}
                className={cx(
                  'flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                  recipientMode === 'MANUAL'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm'
                    : 'text-secondary-c hover:text-primary-c',
                )}
              >
                <Mail className="h-3.5 w-3.5 text-purple-500" /> Manual
              </button>
            </div>

            {/* Conditional Recipient Inputs */}
            {recipientMode === 'TAGGED' && (
              <div className="space-y-2 animate-fade-in">
                <input
                  value={tagsFilter}
                  onChange={(e) => setTagsFilter(e.target.value)}
                  placeholder="Tags (comma-separated)"
                  className="form-input text-xs"
                />
              </div>
            )}

            {recipientMode === 'MANUAL' && (
              <div className="space-y-2 animate-fade-in">
                <textarea
                  value={manualRecipients}
                  onChange={(e) => setManualRecipients(e.target.value)}
                  rows={3}
                  placeholder="Email Addresses (comma-separated)"
                  className="form-input resize-none text-xs"
                />
                <p className="text-[10px] text-muted-c leading-relaxed">
                  💡 <strong>Format:</strong> Name &lt;email&gt; or simple <strong>email</strong>. Placeholders like [User Name] or [Customer Name] in subject/body will be automatically replaced with their name.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.txt,.xlsx"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload CSV / Excel
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1 text-xs text-secondary-c hover:text-primary-c"
                  >
                    <Download className="h-3.5 w-3.5 text-muted-c" /> Download Template
                  </button>
                </div>
              </div>
            )}

            {/* Footer Branded Template Note */}
            <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-400">
              <Info className="h-4 w-4 shrink-0" />
              <span>Emails are sent using your branded template with header and footer.</span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-base-c px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || sending}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold transition-all',
              canSubmit && !sending
                ? 'bg-gradient-accent text-white hover:scale-105'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-ink-700',
            )}
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sent Confirmation ─── */
function SentConfirmation({ campaignName, recipientMode, onClose }: { campaignName: string; recipientMode: RecipientMode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl2 border border-base-c bg-card-c p-6 text-center shadow-soft-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mx-auto mb-4 w-fit">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-success-500/15">
            <Send className="h-7 w-7 text-success-600 dark:text-success-400" />
          </div>
          <span className="absolute -inset-2 animate-ping rounded-full bg-success-500/20" />
        </div>
        <h3 className="text-lg font-bold text-primary-c">Campaign Sent!</h3>
        <p className="mt-1.5 text-sm text-secondary-c">
          <span className="font-semibold text-primary-c">{campaignName}</span> has been dispatched via backend email service (Mode: <span className="font-semibold text-primary-c">{recipientMode}</span>).
        </p>
        <p className="mt-1 text-xs text-muted-c">Delivery logs are saved in campaign history.</p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-gradient-accent py-2.5 text-xs font-semibold text-white transition-transform hover:scale-105"
        >
          Done
        </button>
      </div>
    </div>
  );
}
