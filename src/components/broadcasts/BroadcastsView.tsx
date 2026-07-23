import { useState, useMemo } from 'react';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  BROADCASTS,
  STATUS_META,
  CHANNEL_META,
  AUDIENCE_OPTIONS,
  TEMPLATES,
  type Broadcast,
  type BroadcastStatus,
} from './broadcastData';
import {
  Plus,
  Search,
  Send,
  Users,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  Eye,
  Reply,
  Clock,
  AlertCircle,
  X,
  Megaphone,
  Calendar,
  Filter,
  Sparkles,
  Trash2,
  Copy,
  ChevronRight,
} from 'lucide-react';

type FilterStatus = BroadcastStatus | 'ALL';

export function BroadcastsView() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(BROADCASTS);
  const [selectedId, setSelectedId] = useState<string | null>(BROADCASTS[0]?.id ?? null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [showCreate, setShowCreate] = useState(false);

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

  const handleCreate = (data: {
    title: string;
    message: string;
    audienceLabel: string;
    recipients: number;
    channel: Broadcast['channel'];
    schedule: string;
    status: BroadcastStatus;
  }) => {
    const id = `BC-${1000 + broadcasts.length + 1}`;
    const newB: Broadcast = {
      ...data,
      audience: data.audienceLabel,
      id,
      template: 'Custom Message',
      sentAt: data.status === 'sent' ? 'Just now' : data.schedule,
      delivered: 0,
      read: 0,
      responded: 0,
    };
    setBroadcasts((prev) => [newB, ...prev]);
    setSelectedId(id);
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleDuplicate = (b: Broadcast) => {
    const id = `BC-${1000 + broadcasts.length + 1}`;
    const dup: Broadcast = { ...b, id, title: `${b.title} (Copy)`, status: 'draft', sentAt: 'Not sent yet', delivered: 0, read: 0, responded: 0 };
    setBroadcasts((prev) => [dup, ...prev]);
    setSelectedId(id);
  };

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">WhatsApp Broadcasts</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Create and track bulk messaging campaigns to your leads.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
        >
          <Plus className="h-3.5 w-3.5" /> New Broadcast
        </button>
      </div>

      {/* Stats strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
            onDuplicate={() => handleDuplicate(selected)}
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

      {showCreate && <CreateBroadcastModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Send; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl2 border border-base-c bg-card-c p-3">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ backgroundColor: `${accent}15` }}>
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums text-primary-c">{value}</p>
          <p className="text-[10px] text-muted-c">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── List Item ─── */
function BroadcastListItem({ broadcast, selected, onClick }: { broadcast: Broadcast; selected: boolean; onClick: () => void }) {
  const statusMeta = STATUS_META[broadcast.status];
  const channelMeta = CHANNEL_META[broadcast.channel];
  const ChIcon = channelMeta.icon;
  const SIcon = statusMeta.icon;

  return (
    <button
      onClick={onClick}
      className={cx(
        'w-full rounded-xl2 border p-3 text-left transition-all',
        selected ? 'border-primary-500/30 bg-primary-500/5 shadow-soft' : 'border-base-c bg-card-c hover:border-primary-500/20 hover:shadow-soft',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ChIcon className="h-3.5 w-3.5" style={{ color: channelMeta.color }} />
          <span className="text-[10px] font-bold text-muted-c">{broadcast.id}</span>
        </div>
        <span className={cx('flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold', statusMeta.color)}>
          <SIcon className="h-2.5 w-2.5" /> {statusMeta.label}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-1 text-sm font-semibold text-primary-c">{broadcast.title}</p>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-c">{broadcast.message}</p>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-c">
        <span className="flex items-center gap-1">
          <Users className="h-2.5 w-2.5" /> {broadcast.recipients.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" /> {broadcast.sentAt}
        </span>
      </div>
    </button>
  );
}

/* ─── Detail View ─── */
function BroadcastDetail({ broadcast, onDelete, onDuplicate }: { broadcast: Broadcast; onDelete: () => void; onDuplicate: () => void }) {
  const statusMeta = STATUS_META[broadcast.status];
  const channelMeta = CHANNEL_META[broadcast.channel];
  const ChIcon = channelMeta.icon;

  const deliveryRate = broadcast.recipients ? Math.round((broadcast.delivered / broadcast.recipients) * 100) : 0;
  const readRate = broadcast.delivered ? Math.round((broadcast.read / broadcast.delivered) * 100) : 0;
  const responseRate = broadcast.read ? Math.round((broadcast.responded / broadcast.read) * 100) : 0;

  const metrics = [
    { icon: Users, label: 'Recipients', value: broadcast.recipients.toLocaleString(), pct: null, color: '#2563EB' },
    { icon: CheckCircle2, label: 'Delivered', value: broadcast.delivered.toLocaleString(), pct: deliveryRate, color: '#10B981' },
    { icon: Eye, label: 'Read', value: broadcast.read.toLocaleString(), pct: readRate, color: '#7C3AED' },
    { icon: Reply, label: 'Responded', value: broadcast.responded.toLocaleString(), pct: responseRate, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard className="p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ChIcon className="h-4 w-4" style={{ color: channelMeta.color }} />
              <span className="text-xs font-bold text-muted-c">{broadcast.id}</span>
              <span className={cx('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', statusMeta.color)}>
                {statusMeta.label}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-secondary-c dark:bg-ink-850">
                {channelMeta.label}
              </span>
            </div>
            <h3 className="mt-2 text-base font-bold text-primary-c">{broadcast.title}</h3>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              onClick={onDuplicate}
              title="Duplicate"
              className="grid h-8 w-8 place-items-center rounded-lg border border-base-c text-muted-c transition-colors hover:text-primary-c"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              title="Delete"
              className="grid h-8 w-8 place-items-center rounded-lg border border-base-c text-muted-c transition-colors hover:text-danger-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Meta grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetaItem icon={Users} label="Audience" value={broadcast.audience} />
          <MetaItem icon={Calendar} label="Sent At" value={broadcast.sentAt} />
          <MetaItem icon={Sparkles} label="Template" value={broadcast.template} />
        </div>
      </GlassCard>

      {/* Message preview */}
      <GlassCard className="p-4 lg:p-5">
        <h4 className="mb-3 text-sm font-semibold text-primary-c">Message Preview</h4>
        <div className="rounded-xl2 bg-emerald-50/60 p-4 dark:bg-emerald-500/5">
          <div className="flex gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#25D366]">
              <MessageSquare className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-primary-c">Metro Realty</p>
                <CheckCircle2 className="h-3 w-3 text-[#25D366]" />
                <span className="text-[10px] text-muted-c">Official Business Account</span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-secondary-c">{broadcast.message}</p>
              <p className="mt-2 text-[10px] text-muted-c">{broadcast.sentAt}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Performance metrics */}
      {broadcast.status === 'sent' ? (
        <GlassCard className="p-4 lg:p-5">
          <h4 className="mb-4 text-sm font-semibold text-primary-c">Performance Metrics</h4>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map((m) => {
              const MIcon = m.icon;
              return (
                <div key={m.label} className="rounded-xl2 border border-base-c p-3">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: `${m.color}15` }}>
                      <MIcon className="h-4 w-4" style={{ color: m.color }} />
                    </div>
                    <div>
                      <p className="text-base font-bold tabular-nums text-primary-c">{m.value}</p>
                      <p className="text-[10px] text-muted-c">{m.label}</p>
                    </div>
                  </div>
                  {m.pct !== null && (
                    <div className="mt-2">
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-850">
                        <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                      </div>
                      <p className="mt-1 text-right text-[10px] font-semibold text-muted-c">{m.pct}%</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Funnel */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-secondary-c">Conversion Funnel</p>
            <div className="flex items-center gap-1">
              <FunnelBar label="Sent" value={broadcast.recipients} max={broadcast.recipients} color="#2563EB" />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-c" />
              <FunnelBar label="Delivered" value={broadcast.delivered} max={broadcast.recipients} color="#10B981" />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-c" />
              <FunnelBar label="Read" value={broadcast.read} max={broadcast.recipients} color="#7C3AED" />
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-c" />
              <FunnelBar label="Responded" value={broadcast.responded} max={broadcast.recipients} color="#F59E0B" />
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="flex flex-col items-center justify-center p-8 text-center">
          {broadcast.status === 'scheduled' && <Clock className="h-10 w-10 text-primary-400" />}
          {broadcast.status === 'draft' && <Megaphone className="h-10 w-10 text-muted-c" />}
          {broadcast.status === 'failed' && <AlertCircle className="h-10 w-10 text-danger-500" />}
          <p className="mt-3 text-sm font-medium text-primary-c">
            {broadcast.status === 'scheduled' && 'This broadcast is scheduled and will be sent automatically.'}
            {broadcast.status === 'draft' && 'This broadcast is a draft. Edit and schedule it to send.'}
            {broadcast.status === 'failed' && 'This broadcast failed to send. Please try again.'}
          </p>
          <p className="mt-1 text-xs text-muted-c">{broadcast.sentAt}</p>
          {(broadcast.status === 'draft' || broadcast.status === 'failed') && (
            <button className="mt-4 flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
              <Send className="h-3.5 w-3.5" /> Send Now
            </button>
          )}
          {broadcast.status === 'scheduled' && (
            <div className="mt-4 flex gap-2">
              <button className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-danger-500">
                Cancel Schedule
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
                <Send className="h-3.5 w-3.5" /> Send Now
              </button>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-ink-850/60">
      <p className="flex items-center gap-1 text-[10px] text-muted-c">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-medium text-primary-c">{value}</p>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1">
      <div className="h-12 overflow-hidden rounded-lg" style={{ backgroundColor: `${color}10` }}>
        <div className="flex h-full items-center justify-center rounded-lg text-[10px] font-bold text-white transition-all" style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: color, minWidth: 40 }}>
          {value}
        </div>
      </div>
      <p className="mt-1 text-center text-[9px] text-muted-c">{label}</p>
    </div>
  );
}

/* ─── Create Modal ─── */
function CreateBroadcastModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { title: string; message: string; audienceLabel: string; recipients: number; channel: Broadcast['channel']; schedule: string; status: BroadcastStatus }) => void;
}) {
  const [title, setTitle] = useState('');
  const [audienceId, setAudienceId] = useState(AUDIENCE_OPTIONS[0].id);
  const [channel, setChannel] = useState<Broadcast['channel']>('whatsapp');
  const [templateId, setTemplateId] = useState('none');
  const [message, setMessage] = useState('');
  const [sendType, setSendType] = useState<'now' | 'schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');

  const audience = AUDIENCE_OPTIONS.find((a) => a.id === audienceId)!;
  const template = TEMPLATES.find((t) => t.id === templateId)!;

  const canSubmit = title.trim() && (message.trim() || template.text);

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const t = TEMPLATES.find((x) => x.id === id)!;
    setMessage(t.text);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const finalMessage = message.trim() || template.text;
    const scheduleStr =
      sendType === 'now'
        ? 'Just now'
        : `Scheduled: ${scheduleDate} ${scheduleTime}`;
    onCreate({
      title: title.trim(),
      message: finalMessage,
      audienceLabel: audience.label,
      recipients: audience.count,
      channel,
      schedule: scheduleStr,
      status: sendType === 'now' ? 'sent' : 'scheduled',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl2 border border-base-c bg-card-c shadow-soft-lg animate-slide-up sm:rounded-xl2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-c p-5">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl2 bg-gradient-accent">
              <Megaphone className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-c">New Broadcast</h3>
              <p className="text-xs text-muted-c">Send a bulk message to selected leads</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 space-y-3.5 overflow-y-auto p-5 scrollbar-thin">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Campaign Title <span className="text-danger-500">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Diwali Greeting Campaign" className="form-input" />
          </div>

          {/* Channel */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {(['whatsapp', 'sms', 'email'] as const).map((ch) => {
                const meta = CHANNEL_META[ch];
                const ChIcon = meta.icon;
                return (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={cx(
                      'flex items-center justify-center gap-1.5 rounded-lg border-2 py-2.5 text-xs font-medium transition-all',
                      channel === ch ? 'border-primary-500 bg-primary-500/5 shadow-soft' : 'border-base-c hover:border-primary-500/30',
                    )}
                  >
                    <ChIcon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Audience</label>
            <div className="space-y-1.5">
              {AUDIENCE_OPTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAudienceId(a.id)}
                  className={cx(
                    'flex w-full items-center justify-between rounded-lg border p-2.5 text-left transition-all',
                    audienceId === a.id ? 'border-primary-500 bg-primary-500/5' : 'border-base-c hover:border-primary-500/30',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Users className={cx('h-3.5 w-3.5', audienceId === a.id ? 'text-primary-500' : 'text-muted-c')} />
                    <span className="text-xs font-medium text-primary-c">{a.label}</span>
                  </div>
                  <Badge variant={audienceId === a.id ? 'primary' : 'neutral'}>{a.count}</Badge>
                </button>
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-c">
              <Users className="h-3 w-3" /> {audience.count} recipients will receive this broadcast
            </p>
          </div>

          {/* Template */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Message Template</label>
            <select value={templateId} onChange={(e) => handleTemplateChange(e.target.value)} className="form-input">
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Message Content <span className="text-danger-500">*</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Type your broadcast message… Use {{name}} for personalization."
              className="form-input resize-none"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <button className="flex items-center gap-1 text-[11px] text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
                <Sparkles className="h-3 w-3" /> AI Suggest
              </button>
              <span className="text-[10px] text-muted-c">{message.length} / 1024</span>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Send Options</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSendType('now')}
                className={cx(
                  'flex items-center justify-center gap-1.5 rounded-lg border-2 py-2.5 text-xs font-semibold transition-all',
                  sendType === 'now' ? 'border-primary-500 bg-primary-500/5 shadow-soft' : 'border-base-c hover:border-primary-500/30',
                )}
              >
                <Send className="h-3.5 w-3.5" /> Send Now
              </button>
              <button
                onClick={() => setSendType('schedule')}
                className={cx(
                  'flex items-center justify-center gap-1.5 rounded-lg border-2 py-2.5 text-xs font-semibold transition-all',
                  sendType === 'schedule' ? 'border-primary-500 bg-primary-500/5 shadow-soft' : 'border-base-c hover:border-primary-500/30',
                )}
              >
                <Clock className="h-3.5 w-3.5" /> Schedule
              </button>
            </div>
            {sendType === 'schedule' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="form-input" />
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="form-input" />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-base-c p-4">
          <div className="text-[11px] text-muted-c">
            <span className="font-semibold text-primary-c">{audience.count}</span> recipients · {channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'SMS' : 'Email'}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                canSubmit ? 'bg-gradient-accent text-white hover:scale-105' : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-ink-700',
              )}
            >
              <Send className="h-3.5 w-3.5" /> {sendType === 'now' ? 'Send Broadcast' : 'Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
