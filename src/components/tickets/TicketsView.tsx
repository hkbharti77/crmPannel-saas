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
  ChevronRight,
  ShieldCheck,
  Check,
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
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-violet-600/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
            <TicketIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-primary-c">Support Tickets & Helpdesk</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Live Desk
              </span>
            </div>
            <p className="mt-0.5 text-xs text-secondary-c">
              Track customer inquiries, technical issues, feature requests, and resolution workflows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-2.5 text-xs font-bold text-white shadow-soft transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Support Ticket</span>
          </button>
        </div>
      </div>

      {apiError && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-bold text-rose-700 dark:text-rose-400">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>Backend API Alert: {apiError}. Make sure you are authenticated and backend API is reachable.</span>
        </div>
      )}

      {/* Interactive Status KPI Filter Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map((s) => {
          const count = tickets.filter((t) => t.status === s).length;
          const meta = STATUS_META[s];
          const isSelected = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)}
              className={cx(
                'flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-200 text-left cursor-pointer',
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-soft dark:bg-indigo-500/10'
                  : 'border-base-c bg-card-c hover:border-indigo-500/40 hover:shadow-xs',
              )}
            >
              <span className={cx('h-3 w-3 rounded-full shrink-0', meta.dot)} />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold tabular-nums text-primary-c leading-tight">{count}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-c truncate mt-0.5">{meta.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Split Grid Layout */}
      <div className="grid gap-5 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">
        {/* Left Column: Ticket List */}
        <div className="space-y-3.5">
          {/* Search + Priority filter */}
          <div className="space-y-2.5 rounded-2xl border border-base-c bg-card-c p-3.5 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets by subject, ID or requester…"
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
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
                className="flex-1 rounded-xl border border-base-c bg-card-c px-3 py-1.5 text-xs text-secondary-c focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Priorities ({tickets.length})</option>
                <option value="URGENT">Urgent Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Ticket List Items */}
          <div className="space-y-2.5 lg:max-h-[calc(100vh-380px)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
            {loading && tickets.length === 0 ? (
              <GlassCard className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
                <p className="text-xs text-muted-c font-medium">Fetching support tickets from server...</p>
              </GlassCard>
            ) : filtered.length === 0 ? (
              <GlassCard className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-10 w-10 text-muted-c/40 mb-2" />
                <p className="text-sm font-bold text-primary-c">No support tickets found</p>
                <p className="text-xs text-muted-c mt-0.5">Clear search keyword or filter options.</p>
              </GlassCard>
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

        {/* Right Column: Selected Ticket Detail & Chat Thread */}
        <div className="min-w-0">
          {selected ? (
            <TicketDetail
              ticket={selected}
              onAddComment={(text) => handleAddComment(selected.id, text)}
              onStatusChange={(status) => handleStatusChange(selected.id, status)}
            />
          ) : (
            <GlassCard className="flex flex-col items-center justify-center py-24 text-center min-h-[450px]">
              <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-ink-850 flex items-center justify-center mb-4">
                <TicketIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-primary-c">No Ticket Selected</h3>
              <p className="mt-1.5 text-xs text-secondary-c max-w-xs">
                {tickets.length === 0
                  ? 'No tickets available. Click "+ New Support Ticket" above to submit one.'
                  : 'Select a ticket from the list on the left to view customer conversation & update ticket status.'}
              </p>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <CreateTicketModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

/* ─── Ticket List Item Component ─── */
function TicketListItem({ ticket, selected, onClick }: { ticket: Ticket; selected: boolean; onClick: () => void }) {
  const statusMeta = STATUS_META[ticket.status] || STATUS_META.OPEN;
  const priorityMeta = PRIORITY_META[ticket.priority] || PRIORITY_META.MEDIUM;
  const catMeta = CATEGORY_META[ticket.category] || CATEGORY_META.general;
  const CatIcon = CATEGORY_ICONS[catMeta.icon] ?? MessageCircle;

  return (
    <button
      onClick={onClick}
      className={cx(
        'w-full rounded-2xl border p-3.5 text-left transition-all relative overflow-hidden group cursor-pointer',
        selected
          ? 'border-indigo-500 bg-indigo-500/10 shadow-soft dark:bg-indigo-500/10'
          : 'border-base-c bg-card-c hover:border-indigo-500/40 hover:shadow-xs',
      )}
    >
      {selected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <CatIcon className="h-3.5 w-3.5 shrink-0 text-muted-c" />
          <span className="truncate text-[10px] font-mono font-bold text-muted-c">
            {ticket.id.length > 8 ? `${ticket.id.slice(0, 8)}…` : ticket.id}
          </span>
        </div>
        <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', statusMeta.color)}>
          {statusMeta.label}
        </span>
      </div>

      <p className="mt-1.5 line-clamp-2 text-xs font-bold text-primary-c group-hover:text-indigo-600 transition-colors">
        {ticket.subject}
      </p>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar name={ticket.requester} size={18} />
          <span className="truncate text-[11px] text-secondary-c font-medium">{ticket.requester}</span>
        </div>
        <span className={cx('text-[10px] font-bold uppercase tracking-wider', priorityMeta.color)}>
          {priorityMeta.label}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-base-c pt-2 text-[10px] text-muted-c">
        <span className="flex items-center gap-1 font-medium">
          <MessageCircle className="h-3 w-3 text-muted-c" /> {ticket.comments.length} replies
        </span>
        <span className="flex items-center gap-1 font-medium">
          <Clock className="h-3 w-3 text-muted-c" /> {ticket.updatedAt}
        </span>
      </div>
    </button>
  );
}

/* ─── Ticket Detail Component ─── */
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
      {/* Header Info Card */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-base-c pb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CatIcon className="h-4 w-4 text-muted-c" />
              <span className="text-xs font-mono font-bold text-muted-c">{ticket.id}</span>
              <span className={cx('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase', statusMeta.color)}>
                {statusMeta.label}
              </span>
              <span className={cx('text-[10px] font-bold uppercase tracking-wider', priorityMeta.color)}>
                {priorityMeta.label} PRIORITY
              </span>
            </div>
            <h3 className="mt-2 text-base font-bold text-primary-c">{ticket.subject}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-secondary-c">{ticket.description}</p>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetaItem icon={UserCheck} label="Requester" value={ticket.requester} />
          <MetaItem icon={UserCheck} label="Assigned Agent" value={ticket.assignedTo} />
          <MetaItem icon={Clock} label="Created Date" value={ticket.createdAt} />
          <MetaItem icon={AlertCircle} label="Category" value={catMeta.label} />
        </div>

        {/* Status Quick Changer */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-base-c flex-wrap">
          <span className="text-xs font-bold text-muted-c">Update Status:</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STATUS_META) as TicketStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={cx(
                  'flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer',
                  ticket.status === s
                    ? STATUS_META[s].color + ' ring-2 ring-indigo-500/30 shadow-xs'
                    : 'border border-base-c text-muted-c hover:text-primary-c bg-card-c',
                )}
              >
                <span className={cx('h-1.5 w-1.5 rounded-full', STATUS_META[s].dot)} />
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Conversation Thread */}
      <GlassCard className="p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary-c flex items-center justify-between">
          <span>Conversation Thread ({ticket.comments.length})</span>
          <span className="text-[10px] font-medium text-muted-c">Sorted chronologically</span>
        </h4>

        <div className="space-y-4 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
          {ticket.comments.map((c) => (
            <div key={c.id} className={cx('flex gap-3', c.isAgent && 'flex-row-reverse')}>
              <Avatar name={c.author} size={32} className={c.isAgent ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold' : ''} />
              <div className={cx('max-w-[82%]')}>
                <div className={cx('flex items-center gap-2 mb-1', c.isAgent && 'flex-row-reverse')}>
                  <span className="text-xs font-bold text-primary-c">{c.author}</span>
                  {c.isAgent && (
                    <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                      SUPPORT AGENT
                    </span>
                  )}
                  <span className="text-[10px] text-muted-c">{c.time}</span>
                </div>
                <div
                  className={cx(
                    'rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs',
                    c.isAgent
                      ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-primary-c'
                      : 'bg-slate-100 dark:bg-ink-850 text-primary-c',
                  )}
                >
                  {c.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Box */}
        {ticket.status !== 'CLOSED' ? (
          <div className="rounded-2xl border border-base-c bg-card-c p-3.5 space-y-2.5 shadow-xs">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type a reply to customer... (Press Ctrl+Enter to send)"
              rows={3}
              className="w-full resize-none bg-transparent text-xs text-primary-c placeholder:text-muted-c focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
              }}
            />
            <div className="flex items-center justify-between pt-2 border-t border-base-c">
              <button
                type="button"
                onClick={() => setReply((prev) => prev + (prev ? ' ' : '') + 'Thank you for contacting support! Our engineering team is currently looking into this issue.')}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" /> Quick Template Reply
              </button>

              <button
                onClick={handleSend}
                disabled={!reply.trim()}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer',
                  reply.trim()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-soft hover:scale-[1.02]'
                    : 'bg-slate-200 text-slate-400 dark:bg-ink-800 dark:text-slate-600 cursor-not-allowed',
                )}
              >
                <Send className="h-3.5 w-3.5" /> Send Reply
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-ink-850 py-3.5 text-xs font-bold text-muted-c">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Ticket is CLOSED. Re-open ticket status above to post replies.
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-100/70 dark:bg-ink-850/60 p-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-bold text-muted-c uppercase tracking-wider">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-primary-c">{value}</p>
    </div>
  );
}

/* ─── Create Ticket Modal Component ─── */
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl border border-base-c bg-card-c p-6 shadow-2xl animate-slide-up sm:rounded-3xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-c pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-soft">
              <TicketIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary-c">Create New Support Ticket</h3>
              <p className="text-xs text-muted-c">Submit a customer inquiry, bug report or technical request.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary-c">Subject / Summary <span className="text-rose-500">*</span></label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue or request"
              className="form-input text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-secondary-c">Detailed Description <span className="text-rose-500">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide complete steps, error messages or requirements..."
              className="form-input text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-secondary-c">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className="form-input text-xs">
                {(Object.keys(CATEGORY_META) as TicketCategory[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_META[c].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-secondary-c">Priority Level</label>
              <div className="flex gap-1">
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TicketPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cx(
                      'flex-1 rounded-xl py-2 text-[9px] font-bold uppercase transition-all cursor-pointer',
                      priority === p
                        ? 'bg-indigo-600 text-white shadow-soft'
                        : 'bg-slate-100 dark:bg-ink-800 text-muted-c hover:text-primary-c',
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
              <label className="mb-1 block text-xs font-bold text-secondary-c">Requester Name <span className="text-rose-500">*</span></label>
              <input
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                placeholder="Full Name"
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-secondary-c">Requester Email</label>
              <input
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="email@domain.com"
                className="form-input text-xs"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-base-c">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-base-c px-4 py-2 text-xs font-bold text-secondary-c transition-colors hover:text-primary-c"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer',
              canSubmit
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-soft hover:scale-[1.02]'
                : 'bg-slate-200 text-slate-400 dark:bg-ink-800 dark:text-slate-600 cursor-not-allowed',
            )}
          >
            <Plus className="h-4 w-4" /> Create Ticket
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
