import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  Search,
  Ticket as TicketIcon,
  Clock,
  Building2,
  RefreshCw,
  X,
  Send,
  User,
  MessageSquare,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  fetchPlatformTickets,
  fetchTicketById,
  updateTicket,
  sendTicketMessage,
  fetchTicketMessages,
  type ApiTicket,
  type ApiTicketMessage,
} from '@/lib/platformApi';

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'URGENT', color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300' },
  HIGH: { label: 'HIGH', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
  MEDIUM: { label: 'MEDIUM', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' },
  LOW: { label: 'LOW', color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300' },
};

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  OPEN: { label: 'Open', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300', dot: 'bg-primary-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300', dot: 'bg-warning-500' },
  RESOLVED: { label: 'Resolved', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300', dot: 'bg-success-500' },
  CLOSED: { label: 'Closed', color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300', dot: 'bg-slate-400' },
};

type StatusKey = keyof typeof STATUS_META;

export function AdminTickets() {
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StatusKey>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Selected Ticket Drawer
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ApiTicket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [messages, setMessages] = useState<ApiTicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [officialResponse, setOfficialResponse] = useState('');
  const [savingResponse, setSavingResponse] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchPlatformTickets({ size: 100 });
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      const list: ApiTicket[] = Array.isArray(res.data) ? res.data : (res.data as { content?: ApiTicket[] }).content ?? [];
      setTickets(list);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const loadTicketDetail = async (id: string) => {
    setDetailLoading(true);
    const [ticketRes, messagesRes] = await Promise.all([
      fetchTicketById(id),
      fetchTicketMessages(id),
    ]);

    if (ticketRes.data) {
      setSelectedTicket(ticketRes.data);
      setOfficialResponse(ticketRes.data.response || '');
    }
    if (messagesRes.data) {
      setMessages(messagesRes.data);
    }
    setDetailLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  useEffect(() => {
    if (selectedTicketId) {
      loadTicketDetail(selectedTicketId);
    } else {
      setSelectedTicket(null);
      setMessages([]);
    }
  }, [selectedTicketId]);

  const filtered = useMemo(() =>
    tickets.filter((t) => {
      const title = t.title || t.subject || '';
      const tenant = t.tenantName || t.tenantId || '';
      const email = t.submittedByEmail || t.createdByEmail || '';
      const ms = !search ||
        title.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        tenant.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase());
      const mst = statusFilter === 'ALL' || t.status === statusFilter;
      return ms && mst;
    }),
    [tickets, search, statusFilter],
  );

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    await updateTicket(id, { status });
    setUpdatingId(null);
    if (selectedTicket && selectedTicket.id === id) {
      setSelectedTicket((prev) => prev ? { ...prev, status } : null);
    }
    load();
  };

  const handleSendReply = async () => {
    if (!selectedTicketId || !replyText.trim()) return;
    setSendingReply(true);
    const res = await sendTicketMessage(selectedTicketId, replyText.trim());
    if (res.data) {
      setMessages((prev) => [...prev, res.data!]);
      setReplyText('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    setSendingReply(false);
  };

  const handleSaveOfficialResponse = async () => {
    if (!selectedTicketId) return;
    setSavingResponse(true);
    const res = await updateTicket(selectedTicketId, { response: officialResponse });
    if (res.data) {
      setSelectedTicket(res.data);
      setResponseSuccess(true);
      setTimeout(() => setResponseSuccess(false), 3000);
      load();
    }
    setSavingResponse(false);
  };

  const counts: Record<string, number> = {};
  ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].forEach((s) => {
    counts[s] = tickets.filter((t) => t.status === s).length;
  });

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Platform Support Tickets</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Cross-tenant support tickets and customer resolution console.</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors">
          <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2">{error}</p>}

      {/* Filter Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as StatusKey[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)}
            className={cx(
              'flex items-center gap-2.5 rounded-xl border p-3.5 transition-all text-left shadow-sm',
              statusFilter === s
                ? 'border-primary-500/40 bg-primary-500/10 shadow-soft ring-1 ring-primary-500/30'
                : 'border-base-c bg-card-c hover:border-primary-500/20'
            )}
          >
            <span className={cx('h-3 w-3 rounded-full', STATUS_META[s].dot)} />
            <div>
              <p className="text-xl font-bold tabular-nums text-primary-c">{loading ? '—' : (counts[s] || 0)}</p>
              <p className="text-xs font-medium text-muted-c">{STATUS_META[s].label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tickets by subject, tenant, email, or ID…"
          className="form-input pl-9 text-xs py-2 w-full"
        />
      </div>

      {/* Tickets Table */}
      <GlassCard className="overflow-hidden p-0 border border-base-c">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base-c text-left text-[10px] font-bold uppercase tracking-wide text-muted-c bg-slate-50/50 dark:bg-ink-850/50">
                <th className="px-4 py-3">Ticket Details</th>
                <th className="px-4 py-3">Tenant Organization</th>
                <th className="hidden px-4 py-3 sm:table-cell">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Requester</th>
                <th className="hidden px-4 py-3 lg:table-cell">Created</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-base-c">
                    <td className="px-4 py-3" colSpan={7}><div className="h-10 rounded-lg bg-slate-100 dark:bg-ink-800 animate-pulse" /></td>
                  </tr>
                ))
                : filtered.map((t) => {
                  const title = t.title || t.subject || 'Support Request';
                  const tenantName = t.tenantName || 'Business Tenant';
                  const requesterEmail = t.submittedByEmail || t.createdByEmail || 'customer@tenant.com';
                  const p = PRIORITY_META[t.priority || 'MEDIUM'] ?? PRIORITY_META['MEDIUM'];
                  const s = STATUS_META[t.status?.toUpperCase() || 'OPEN'] ?? STATUS_META['OPEN'];
                  const isSelected = selectedTicketId === t.id;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={cx(
                        'border-b border-base-c transition-colors cursor-pointer',
                        isSelected ? 'bg-primary-500/10' : 'hover:bg-slate-50 dark:hover:bg-ink-850/50'
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-500/10 text-primary-500">
                            <TicketIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <p className="truncate text-sm font-semibold text-primary-c hover:text-primary-500 transition-colors">
                              {title}
                            </p>
                            <p className="truncate text-[10px] text-muted-c font-mono">
                              #{t.id.slice(0, 8)} {t.description ? `· ${t.description.slice(0, 45)}…` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <Link
                          to={t.tenantId ? `/admin/tenants/${t.tenantId}` : '#'}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs font-medium text-secondary-c hover:text-primary-500 transition-colors group"
                        >
                          <Building2 className="h-3.5 w-3.5 text-muted-c group-hover:text-primary-500" />
                          <span className="truncate max-w-[150px]">{tenantName}</span>
                          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>

                      <td className="hidden px-4 py-3.5 sm:table-cell">
                        <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', p.color)}>{p.label}</span>
                      </td>

                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={t.status?.toUpperCase() || 'OPEN'}
                          disabled={updatingId === t.id}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          className={cx('rounded-full border-0 bg-transparent px-2.5 py-1 text-[11px] font-bold appearance-none cursor-pointer focus:outline-none shadow-sm', s.color)}
                        >
                          {Object.keys(STATUS_META).map((sk) => (
                            <option key={sk} value={sk}>{STATUS_META[sk].label}</option>
                          ))}
                        </select>
                      </td>

                      <td className="hidden px-4 py-3.5 md:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar name={requesterEmail} size={24} />
                          <span className="text-xs text-secondary-c truncate max-w-[140px]">{requesterEmail}</span>
                        </div>
                      </td>

                      <td className="hidden px-4 py-3.5 lg:table-cell">
                        <span className="flex items-center gap-1 text-[11px] text-muted-c">
                          <Clock className="h-3 w-3" />
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedTicketId(t.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-colors shadow-sm"
                        >
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <TicketIcon className="h-12 w-12 text-muted-c/30" />
            <p className="mt-3 text-sm font-medium text-muted-c">{error ? 'Could not load tickets' : 'No tickets found matching criteria'}</p>
          </div>
        )}
      </GlassCard>

      {/* Ticket Details Slide-Over / Full Drawer */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedTicketId(null)}>
          <div
            className="h-full w-full max-w-2xl bg-surface-c border-l border-base-c shadow-2xl flex flex-col overflow-hidden animate-slide-left dark:bg-ink-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-base-c p-5 bg-card-c">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-500/10 text-primary-500">
                  <TicketIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-primary-c">Ticket #{selectedTicketId.slice(0, 8)}</h3>
                    {selectedTicket && (
                      <span className={cx('rounded-full px-2.5 py-0.5 text-[10px] font-bold', STATUS_META[selectedTicket.status?.toUpperCase() || 'OPEN']?.color)}>
                        {selectedTicket.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-c mt-0.5">
                    {selectedTicket?.tenantName || 'Tenant'} · Created on {selectedTicket?.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : '—'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicketId(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800 hover:text-primary-c transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {detailLoading ? (
                <div className="space-y-4 py-8">
                  <div className="h-20 rounded-xl bg-slate-100 dark:bg-ink-800 animate-pulse" />
                  <div className="h-32 rounded-xl bg-slate-100 dark:bg-ink-800 animate-pulse" />
                </div>
              ) : selectedTicket ? (
                <>
                  {/* Status & Priority Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-base-c bg-card-c">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-c">Current Status:</span>
                      <select
                        value={selectedTicket.status?.toUpperCase() || 'OPEN'}
                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                        className="form-select py-1 text-xs font-bold text-primary-c rounded-lg"
                      >
                        {Object.keys(STATUS_META).map((sk) => (
                          <option key={sk} value={sk}>{STATUS_META[sk].label}</option>
                        ))}
                      </select>
                    </div>

                    {selectedTicket.tenantId && (
                      <Link
                        to={`/admin/tenants/${selectedTicket.tenantId}`}
                        className="flex items-center gap-1 rounded-lg border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-colors"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        <span>Inspect Tenant</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  {/* Subject & Description Card */}
                  <div className="p-5 rounded-2xl border border-base-c bg-card-c space-y-3">
                    <h4 className="text-lg font-bold text-primary-c">{selectedTicket.title || selectedTicket.subject || 'Support Ticket'}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-c border-b border-base-c pb-3">
                      <User className="h-3.5 w-3.5 text-primary-500" />
                      <span>Submitted by: <strong className="text-primary-c">{selectedTicket.submittedByEmail || selectedTicket.createdByEmail || 'N/A'}</strong></span>
                    </div>
                    <div className="text-xs text-secondary-c whitespace-pre-wrap leading-relaxed pt-1">
                      {selectedTicket.description || 'No detailed problem description was provided with this ticket.'}
                    </div>
                  </div>

                  {/* Official Platform Response Card */}
                  <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Official Platform Resolution
                      </h4>
                      {responseSuccess && (
                        <span className="text-[11px] font-bold text-success-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Saved!
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={officialResponse}
                      onChange={(e) => setOfficialResponse(e.target.value)}
                      placeholder="Write official resolution or response shown to the tenant..."
                      className="form-input text-xs w-full py-2 bg-card-c"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveOfficialResponse}
                        disabled={savingResponse}
                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {savingResponse ? 'Saving…' : 'Save Resolution'}
                      </button>
                    </div>
                  </div>

                  {/* Live Conversation Thread */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-c flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary-500" /> Live Message Thread ({messages.length})
                    </h4>

                    <div className="space-y-3 max-h-72 overflow-y-auto p-1">
                      {messages.length > 0 ? (
                        messages.map((m, idx) => {
                          const isPlatform = m.senderType?.toUpperCase() === 'PLATFORM';
                          return (
                            <div
                              key={m.id || idx}
                              className={cx(
                                'flex flex-col rounded-xl p-3 text-xs space-y-1',
                                isPlatform
                                  ? 'ml-8 bg-primary-500/10 border border-primary-500/20 text-primary-c'
                                  : 'mr-8 bg-card-c border border-base-c text-secondary-c'
                              )}
                            >
                              <div className="flex items-center justify-between text-[10px] text-muted-c">
                                <span className="font-bold text-primary-c">{isPlatform ? 'Platform Support (Super Admin)' : (m.senderEmail || 'Customer')}</span>
                                <span>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}</span>
                              </div>
                              <p className="text-xs whitespace-pre-wrap">{m.message || m.body}</p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center text-xs text-muted-c py-4 bg-slate-50 dark:bg-ink-850/50 rounded-xl">
                          No conversation replies yet. Type a response below to start the thread.
                        </p>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Reply Input Bar */}
            <div className="border-t border-base-c p-4 bg-card-c">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type reply message to tenant..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="form-input flex-1 text-xs py-2"
                />
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="flex items-center gap-1 rounded-xl bg-primary-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
