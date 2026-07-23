import { useState, useMemo } from 'react';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  TEMPLATES,
  AUDIENCES,
  CAMPAIGNS,
  CAMPAIGN_STATUS_META,
  TEMPLATE_CATEGORY_META,
  type EmailTemplate,
  type Audience,
  type Campaign,
} from './emailData';
import {
  Mail,
  Plus,
  Search,
  Send,
  Eye,
  Clock,
  Users,
  MailOpen,
  MousePointerClick,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  CheckCircle2,
  Trash2,
  Copy,
  Megaphone,
  TrendingUp,
  Inbox,
} from 'lucide-react';

type Tab = 'campaigns' | 'compose';
type ComposeStep = 1 | 2 | 3;

const COMPOSE_STEPS = ['Template', 'Content', 'Audience'];

export function EmailsView() {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>(CAMPAIGNS);
  const [search, setSearch] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);

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

  const handleCampaignSent = (data: { name: string; subject: string; recipients: number; template: string }) => {
    const newCampaign: Campaign = {
      id: `cmp${campaigns.length + 1}`,
      name: data.name,
      subject: data.subject,
      status: 'sent',
      recipients: data.recipients,
      openRate: 0,
      clickRate: 0,
      sentAt: 'Just now',
      template: data.template,
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Email Campaigns</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Create, send, and track email campaigns to your leads.</p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
        >
          <Plus className="h-3.5 w-3.5" /> New Campaign
        </button>
      </div>

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
        <TabButton active={tab === 'compose'} onClick={() => setTab('compose')} icon={FileText} label="Templates" count={TEMPLATES.length} />
      </div>

      {/* Content */}
      {tab === 'campaigns' ? (
        <CampaignList campaigns={filtered} search={search} setSearch={setSearch} />
      ) : (
        <TemplateGallery />
      )}

      {/* Compose wizard */}
      {composeOpen && (
        <ComposeWizard
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
function CampaignList({ campaigns, search, setSearch }: { campaigns: Campaign[]; search: string; setSearch: (v: string) => void }) {
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

      {campaigns.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-12">
          <Inbox className="h-10 w-10 text-muted-c/30" />
          <p className="mt-3 text-sm text-muted-c">No campaigns found</p>
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
  const meta = CAMPAIGN_STATUS_META[campaign.status];
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
function TemplateGallery() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {TEMPLATES.map((tpl) => {
        const catMeta = TEMPLATE_CATEGORY_META[tpl.category];
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

/* ─── Compose Wizard ─── */
function ComposeWizard({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: (data: { name: string; subject: string; recipients: number; template: string }) => void;
}) {
  const [step, setStep] = useState<ComposeStep>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSelectTemplate = (tpl: EmailTemplate) => {
    setSelectedTemplate(tpl);
    setSubject(tpl.subject);
    setBody(tpl.body);
    setStep(2);
  };

  const canProceed = () => {
    if (step === 2) return subject.trim().length > 0 && body.trim().length > 0 && campaignName.trim().length > 0;
    if (step === 3) return !!selectedAudience;
    return true;
  };

  const handleSend = () => {
    if (!selectedTemplate || !selectedAudience || !campaignName.trim()) return;
    onSent({
      name: campaignName.trim(),
      subject: subject.trim(),
      recipients: selectedAudience.count,
      template: selectedTemplate.name,
    });
    setShowPreview(true);
  };

  if (showPreview) {
    return (
      <SentConfirmation
        campaignName={campaignName}
        recipientCount={selectedAudience?.count ?? 0}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-xl2 border border-base-c bg-card-c shadow-soft-lg animate-slide-up sm:rounded-xl2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-c p-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl2 bg-gradient-accent">
              <Mail className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-c">New Campaign</h3>
              <p className="text-xs text-muted-c">{COMPOSE_STEPS[step - 1]} · Step {step} of 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-4 py-3">
          {COMPOSE_STEPS.map((label, i) => {
            const stepNum = (i + 1) as ComposeStep;
            const isComplete = stepNum < step;
            const isCurrent = stepNum === step;
            return (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2">
                  <div className={cx(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-all',
                    isComplete ? 'bg-success-500 text-white' : isCurrent ? 'bg-gradient-accent text-white ring-4 ring-primary-500/15' : 'border-2 border-base-c text-muted-c',
                  )}>
                    {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepNum}
                  </div>
                  <span className={cx('hidden text-xs font-semibold sm:block', isCurrent ? 'text-primary-c' : 'text-muted-c')}>{label}</span>
                </div>
                {i < COMPOSE_STEPS.length - 1 && (
                  <div className="mx-2 h-0.5 flex-1 rounded-full">
                    <div className={cx('h-full rounded-full transition-colors', isComplete ? 'bg-success-500' : 'bg-base-c')} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-secondary-c">Choose a template to start from</p>
              {TEMPLATES.map((tpl) => {
                const catMeta = TEMPLATE_CATEGORY_META[tpl.category];
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={cx(
                      'flex w-full items-start gap-3 rounded-xl2 border-2 p-3 text-left transition-all',
                      selectedTemplate?.id === tpl.id
                        ? 'border-primary-500 bg-primary-500/5 shadow-soft'
                        : 'border-base-c hover:border-primary-500/30',
                    )}
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl2 bg-gradient-accent-soft">
                      <FileText className="h-4.5 w-4.5 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-primary-c">{tpl.name}</h4>
                        <span className={cx('rounded-full px-1.5 py-0.5 text-[9px] font-bold', catMeta.color)}>{catMeta.label}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-secondary-c">{tpl.subject}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-c">{tpl.body}</p>
                    </div>
                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-c" />
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary-c">Campaign Name <span className="text-danger-500">*</span></label>
                <input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. August Follow-up Campaign"
                  className="form-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary-c">Subject Line <span className="text-danger-500">*</span></label>
                <div className="relative">
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject…"
                    className="form-input pr-24"
                  />
                  <button className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md bg-gradient-accent-soft px-2 py-1 text-[10px] font-semibold text-secondary-600 dark:text-secondary-400">
                    <Sparkles className="h-3 w-3" /> AI
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-muted-c">Use {'{{name}}'}, {'{{property}}'}, {'{{agentName}}'} for personalization</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-secondary-c">Email Body <span className="text-danger-500">*</span></label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="form-input resize-none font-mono text-xs leading-relaxed"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-secondary-c">Select target audience</p>
              {AUDIENCES.map((aud) => (
                <button
                  key={aud.id}
                  onClick={() => setSelectedAudience(aud)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-xl2 border-2 p-3 text-left transition-all',
                    selectedAudience?.id === aud.id
                      ? 'border-primary-500 bg-primary-500/5 shadow-soft'
                      : 'border-base-c hover:border-primary-500/30',
                  )}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl2 bg-primary-500/10">
                    <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-primary-c">{aud.name}</h4>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-secondary-c dark:bg-ink-800">
                        {aud.count} leads
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-c">{aud.description}</p>
                  </div>
                  {selectedAudience?.id === aud.id && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-500" />
                  )}
                </button>
              ))}

              {/* Summary */}
              {selectedAudience && (
                <div className="rounded-xl2 border border-base-c bg-slate-50 p-3 dark:bg-ink-850/60">
                  <p className="text-xs font-semibold text-primary-c">Campaign Summary</p>
                  <div className="mt-2 space-y-1 text-[11px] text-secondary-c">
                    <p>Name: <span className="font-medium text-primary-c">{campaignName || '—'}</span></p>
                    <p>Subject: <span className="font-medium text-primary-c">{subject || '—'}</span></p>
                    <p>Audience: <span className="font-medium text-primary-c">{selectedAudience.name}</span></p>
                    <p>Recipients: <span className="font-medium text-primary-c">{selectedAudience.count}</span></p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-base-c p-4">
          <button
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as ComposeStep) : s))}
            disabled={step === 1}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all',
              step === 1 ? 'cursor-not-allowed text-muted-c/40' : 'border border-base-c text-secondary-c hover:text-primary-c',
            )}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => ((s + 1) as ComposeStep))}
              disabled={!canProceed()}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold transition-all',
                canProceed() ? 'bg-gradient-accent text-white hover:scale-105' : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-ink-700',
              )}
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!selectedAudience}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold transition-all',
                selectedAudience ? 'bg-gradient-accent text-white hover:scale-105' : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-ink-700',
              )}
            >
              <Send className="h-3.5 w-3.5" /> Send to {selectedAudience?.count ?? 0} Leads
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sent Confirmation ─── */
function SentConfirmation({ campaignName, recipientCount, onClose }: { campaignName: string; recipientCount: number; onClose: () => void }) {
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
          <span className="font-semibold text-primary-c">{campaignName}</span> has been sent to{' '}
          <span className="font-semibold text-primary-c">{recipientCount}</span> leads.
        </p>
        <p className="mt-1 text-xs text-muted-c">You'll see open and click metrics as they come in.</p>
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
