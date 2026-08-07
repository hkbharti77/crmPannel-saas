import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GlassCard, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { TicketStatus, TicketPriority } from '@/lib/types';
import {
  STATUS_META,
  PRIORITY_META,
  CATEGORY_META,
  type Ticket,
  type TicketCategory,
} from './ticketData';
import {
  fetchTickets,
  createTicket as apiCreateTicket,
  updateTicketStatus as apiUpdateTicketStatus,
  addTicketComment as apiAddTicketComment,
  type TicketDTO,
} from '@/lib/ticketsApi';
import {
  Search,
  Plus,
  Ticket as TicketIcon,
  Cog,
  CreditCard,
  MessageCircle,
  Lightbulb,
  Bug,
  Send,
  X,
  AlertCircle,
  Clock,
  UserCheck,
  Filter,
  Inbox,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, typeof Cog> = {
  Cog,
  CreditCard,
  MessageCircle,
  Lightbulb,
  Bug,
};

type FilterStatus = TicketStatus | 'ALL';
type FilterPriority = TicketPriority | 'ALL';

function mapDtoToTicket(dto: TicketDTO): Ticket {
  const cat = (dto.category?.toLowerCase() || 'technical') as TicketCategory;
  const validCategories: TicketCategory[] = ['technical', 'billing', 'general', 'feature_request', 'bug'];
  const finalCat = validCategories.includes(cat) ? cat : 'technical';

  const comments = (dto.comments || []).map((c, idx) => ({
    id: c.id || `c-${idx}`,
    author: c.authorName || 'User',
    isAgent: c.authorRole === 'AGENT' || c.authorRole === 'ADMIN',
    text: c.message,
    time: c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
  }));

  if (comments.length === 0 && dto.description) {
    comments.push({
      id: 'c-0',
      author: dto.submitterName || 'Requester',
      isAgent: false,
      text: dto.description,
      time: dto.createdAtHuman || 'Recently',
    });
  }

  return {
    id: dto.id,
    subject: dto.subject,
    description: dto.description,
    category: finalCat,
    status: dto.status || 'OPEN',
    priority: dto.priority || 'MEDIUM',
    requester: dto.submitterName || dto.contactName || 'Customer',
    requesterEmail: dto.submitterEmail || 'N/A',
    assignedTo: dto.assignedToName || 'Unassigned',
    createdAt: dto.createdAtHuman || (dto.createdAt ? new Date(dto.createdAt).toLocaleDateString() : 'Recently'),
    updatedAt: dto.createdAtHuman || 'Recently',
    comments,
  };
}

export function TicketsView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    const res = await fetchTickets({
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: search.trim() || undefined,
    });

    if (res.error) {
      setApiError(res.error);
      setTickets([]);
      setSelectedId(null);
    } else if (res.data) {
      const mapped = res.data.map(mapDtoToTicket);
      setTickets(mapped);
      if (mapped.length > 0) {
        setSelectedId((prev) => (prev && mapped.some((t) => t.id === prev) ? prev : mapped[0].id));
      } else {
        setSelectedId(null);
      }
    }
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        !search ||
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.requester.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  const handleCreate = async (data: {
    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    requester: string;
    requesterEmail: string;
  }) => {
    const res = await apiCreateTicket({
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority,
      submitterName: data.requester,
      submitterEmail: data.requesterEmail,
    });

    if (res.error) {
      alert(`Failed to create ticket: ${res.error}`);
      return;
    }

    if (res.data) {
      const newTicket = mapDtoToTicket(res.data);
      setTickets((prev) => [newTicket, ...prev]);
      setSelectedId(newTicket.id);
      setShowCreate(false);
    }
  };

  const handleAddComment = async (ticketId: string, text: string) => {
    const res = await apiAddTicketComment(ticketId, text);
    if (res.error) {
      alert(`Failed to add reply: ${res.error}`);
      return;
    }
    if (res.data) {
      const updated = mapDtoToTicket(res.data);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    const res = await apiUpdateTicketStatus(ticketId, status);
    if (res.error) {
      alert(`Failed to update status: ${res.error}`);
      return;
    }
    if (res.data) {
      const updated = mapDtoToTicket(res.data);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Support Tickets</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Track and resolve issues, feature requests, and inquiries.</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary-500" />}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
          >
            <Plus className="h-3.5 w-3.5" /> New Ticket
          </button>
        </div>
      </div>

      {apiError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-xs text-danger-600 dark:text-danger-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Backend API Error: {apiError}. Make sure you are logged in and backend is running.</span>
        </div>
      )}

      {/* Stats strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map((s) => {
          const count = tickets.filter((t) => t.status === s).length;
          const meta = STATUS_META[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)}
              className={cx(
                'flex items-center gap-2.5 rounded-xl2 border p-3 transition-all',
                statusFilter === s ? 'border-primary-500/40 bg-primary-500/5 shadow-soft' : 'border-base-c bg-card-c hover:border-primary-500/20',
              )}
            >
              <span className={cx('h-2.5 w-2.5 rounded-full', meta.dot)} />
              <div className="text-left">
                <p className="text-lg font-bold tabular-nums text-primary-c">{count}</p>
                <p className="text-[10px] text-muted-c">{meta.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Left: ticket list */}
        <div className="space-y-3">
          {/* Search + filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets…"
                className="form-input pl-9"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 shrink-0 text-muted-c" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
                className="flex-1 rounded-lg border border-base-c bg-card-c px-2 py-1.5 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Ticket list */}
          <div className="space-y-2 lg:max-h-[calc(100vh-320px)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
            {loading && tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <p className="mt-3 text-xs text-muted-c">Loading tickets from backend…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-10 w-10 text-muted-c/30" />
                <p className="mt-3 text-sm text-muted-c">No tickets found</p>
              </div>
            ) : (
              filtered.map((t) => (
                <TicketListItem
                  key={t.id}
                  ticket={t}
                  selected={t.id === selectedId}
                  onClick={() => setSelectedId(t.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: ticket detail */}
        {selected ? (
          <TicketDetail
            ticket={selected}
            onAddComment={(text) => handleAddComment(selected.id, text)}
            onStatusChange={(status) => handleStatusChange(selected.id, status)}
          />
        ) : (
          <GlassCard className="grid place-items-center py-20">
            <div className="text-center">
              <TicketIcon className="mx-auto h-12 w-12 text-muted-c/30" />
              <p className="mt-3 text-sm text-muted-c">
                {tickets.length === 0 ? 'No tickets available. Click "+ New Ticket" to create one.' : 'Select a ticket to view details'}
              </p>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateTicketModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

/* ─── Ticket List Item ─── */
function TicketListItem({ ticket, selected, onClick }: { ticket: Ticket; selected: boolean; onClick: () => void }) {
  const statusMeta = STATUS_META[ticket.status] || STATUS_META.OPEN;
  const priorityMeta = PRIORITY_META[ticket.priority] || PRIORITY_META.MEDIUM;
  const catMeta = CATEGORY_META[ticket.category] || CATEGORY_META.general;
  const CatIcon = CATEGORY_ICONS[catMeta.icon] ?? MessageCircle;

  return (
    <button
      onClick={onClick}
      className={cx(
        'w-full rounded-xl2 border-l-4 border p-3 text-left transition-all',
        priorityMeta.ring,
        selected
          ? 'border-primary-500/30 bg-primary-500/5 shadow-soft'
          : 'border-base-c bg-card-c hover:border-primary-500/20 hover:shadow-soft',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <CatIcon className="h-3.5 w-3.5 shrink-0 text-muted-c" />
          <span className="truncate text-[10px] font-bold text-muted-c">{ticket.id.length > 8 ? `${ticket.id.slice(0, 8)}…` : ticket.id}</span>
        </div>
        <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold', statusMeta.color)}>
          {statusMeta.label}
        </span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-primary-c">{ticket.subject}</p>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar name={ticket.requester} size={18} />
          <span className="truncate text-[10px] text-secondary-c">{ticket.requester}</span>
        </div>
        <span className={cx('text-[10px] font-bold', priorityMeta.color)}>{priorityMeta.label}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-c">
        <span className="flex items-center gap-1">
          <MessageCircle className="h-2.5 w-2.5" /> {ticket.comments.length}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" /> {ticket.updatedAt}
        </span>
      </div>
    </button>
  );
}

/* ─── Ticket Detail ─── */
function TicketDetail({
  ticket,
  onAddComment,
  onStatusChange,
}: {
  ticket: Ticket;
  onAddComment: (text: string) => void;
  onStatusChange: (status: TicketStatus) => void;
}) {
  const [reply, setReply] = useState('');
  const statusMeta = STATUS_META[ticket.status] || STATUS_META.OPEN;
  const priorityMeta = PRIORITY_META[ticket.priority] || PRIORITY_META.MEDIUM;
  const catMeta = CATEGORY_META[ticket.category] || CATEGORY_META.general;
  const CatIcon = CATEGORY_ICONS[catMeta.icon] ?? MessageCircle;

  const handleSend = () => {
    if (!reply.trim()) return;
    onAddComment(reply.trim());
    setReply('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard className="p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CatIcon className="h-4 w-4 text-muted-c" />
              <span className="text-xs font-bold text-muted-c">{ticket.id.length > 12 ? `${ticket.id.slice(0, 12)}…` : ticket.id}</span>
              <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', statusMeta.color)}>
                {statusMeta.label}
              </span>
              <span className={cx('text-[11px] font-bold', priorityMeta.color)}>
                {priorityMeta.label} PRIORITY
              </span>
            </div>
            <h3 className="mt-2 text-base font-bold text-primary-c">{ticket.subject}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-secondary-c">{ticket.description}</p>
          </div>
        </div>

        {/* Meta grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetaItem icon={UserCheck} label="Requester" value={ticket.requester} />
          <MetaItem icon={UserCheck} label="Assigned" value={ticket.assignedTo} />
          <MetaItem icon={Clock} label="Created" value={ticket.createdAt} />
          <MetaItem icon={AlertCircle} label="Category" value={catMeta.label} />
        </div>

        {/* Status changer */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-muted-c">Update status:</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STATUS_META) as TicketStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={cx(
                  'flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all',
                  ticket.status === s
                    ? STATUS_META[s].color + ' ring-2 ring-offset-1 ring-primary-500/20'
                    : 'border border-base-c text-muted-c hover:text-primary-c',
                )}
              >
                <span className={cx('h-1.5 w-1.5 rounded-full', STATUS_META[s].dot)} />
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Conversation */}
      <GlassCard className="p-4 lg:p-5">
        <h4 className="mb-4 text-sm font-semibold text-primary-c">
          Conversation <span className="text-muted-c">({ticket.comments.length})</span>
        </h4>

        <div className="space-y-4">
          {ticket.comments.map((c) => (
            <div key={c.id} className={cx('flex gap-3', c.isAgent && 'flex-row-reverse')}>
              <Avatar name={c.author} size={32} className={c.isAgent ? 'bg-gradient-accent' : ''} />
              <div className={cx('max-w-[80%]')}>
                <div className={cx('flex items-center gap-2', c.isAgent && 'flex-row-reverse')}>
                  <span className="text-xs font-semibold text-primary-c">{c.author}</span>
                  {c.isAgent && (
                    <span className="rounded bg-secondary-500/15 px-1.5 py-0.5 text-[9px] font-bold text-secondary-600 dark:text-secondary-400">
                      AGENT
                    </span>
                  )}
                  <span className="text-[10px] text-muted-c">{c.time}</span>
                </div>
                <div
                  className={cx(
                    'mt-1.5 rounded-xl2 px-3.5 py-2.5 text-sm leading-relaxed',
                    c.isAgent
                      ? 'bg-gradient-accent-soft text-primary-c'
                      : 'bg-slate-50 text-secondary-c dark:bg-ink-850/60',
                  )}
                >
                  {c.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply box */}
        {ticket.status !== 'CLOSED' ? (
          <div className="mt-4 rounded-xl2 border border-base-c bg-card-c p-3">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type a reply…"
              rows={2}
              className="w-full resize-none bg-transparent text-sm text-primary-c placeholder:text-muted-c focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              <button className="flex items-center gap-1 text-xs text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
                <Sparkles className="h-3.5 w-3.5" /> AI Suggest
              </button>
              <button
                onClick={handleSend}
                disabled={!reply.trim()}
                className={cx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  reply.trim()
                    ? 'bg-gradient-accent text-white hover:scale-105'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-ink-700',
                )}
              >
                <Send className="h-3 w-3" /> Send
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl2 bg-slate-50 py-3 text-xs text-muted-c dark:bg-ink-850/60">
            <CheckCircle2 className="h-4 w-4 text-success-500" /> This ticket is closed
          </div>
        )}
      </GlassCard>
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

/* ─── Create Ticket Modal ─── */
function CreateTicketModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { subject: string; description: string; category: TicketCategory; priority: TicketPriority; requester: string; requesterEmail: string }) => void;
}) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('technical');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [requester, setRequester] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');

  const canSubmit = subject.trim() && description.trim() && requester.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreate({
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      requester: requester.trim(),
      requesterEmail: requesterEmail.trim() || 'N/A',
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-xl2 border border-base-c bg-card-c p-5 shadow-soft-lg animate-slide-up sm:rounded-xl2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl2 bg-gradient-accent">
              <TicketIcon className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-c">New Support Ticket</h3>
              <p className="text-xs text-muted-c">Report an issue or request a feature</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3.5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Subject <span className="text-danger-500">*</span></label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              className="form-input"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-secondary-c">Description <span className="text-danger-500">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the issue in detail…"
              className="form-input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary-c">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className="form-input">
                {(Object.keys(CATEGORY_META) as TicketCategory[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_META[c].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary-c">Priority</label>
              <div className="flex gap-1.5">
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TicketPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cx(
                      'flex-1 rounded-lg py-1.5 text-[10px] font-bold transition-all',
                      priority === p
                        ? 'bg-gradient-accent text-white shadow-soft'
                        : 'border border-base-c text-muted-c hover:text-primary-c',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary-c">Your Name <span className="text-danger-500">*</span></label>
              <input
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                placeholder="Your name"
                className="form-input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-secondary-c">Email</label>
              <input
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="you@company.com"
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-base-c px-4 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all',
              canSubmit
                ? 'bg-gradient-accent text-white hover:scale-105'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-ink-700',
            )}
          >
            <Plus className="h-3.5 w-3.5" /> Create Ticket
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
