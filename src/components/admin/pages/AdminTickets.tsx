import { useState, useEffect, useMemo } from 'react';
import { GlassCard, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { Search, Ticket as TicketIcon, Clock, Building2, RefreshCw } from 'lucide-react';
import { fetchPlatformTickets, updateTicket, type ApiTicket } from '@/lib/platformApi';

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

  useEffect(() => { load();  
  }, []);

  const filtered = useMemo(() =>
    tickets.filter((t) => {
      const ms = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
      const mst = statusFilter === 'ALL' || t.status === statusFilter;
      return ms && mst;
    }),
    [tickets, search, statusFilter],
  );

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    await updateTicket(id, { status });
    setUpdatingId(null);
    load();
  };

  const counts: Record<string, number> = {};
  ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].forEach((s) => {
    counts[s] = tickets.filter((t) => t.status === s).length;
  });

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Platform Support Tickets</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Cross-tenant ticket management for all customers.</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors">
          <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2">{error}</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as StatusKey[]).map((s) => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)} className={cx('flex items-center gap-2.5 rounded-xl2 border p-3 transition-all', statusFilter === s ? 'border-primary-500/40 bg-primary-500/5 shadow-soft' : 'border-base-c bg-card-c hover:border-primary-500/20')}>
            <span className={cx('h-2.5 w-2.5 rounded-full', STATUS_META[s].dot)} />
            <div className="text-left">
              <p className="text-lg font-bold tabular-nums text-primary-c">{loading ? '—' : counts[s]}</p>
              <p className="text-[10px] text-muted-c">{STATUS_META[s].label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets…" className="form-input pl-9" />
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base-c text-left text-[10px] font-bold uppercase tracking-wide text-muted-c">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Tenant</th>
                <th className="hidden px-4 py-3 sm:table-cell">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Requester</th>
                <th className="hidden px-4 py-3 lg:table-cell">Category</th>
                <th className="hidden px-4 py-3 lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-base-c">
                    <td className="px-4 py-3" colSpan={7}><div className="h-8 rounded-lg bg-slate-100 dark:bg-ink-800 animate-pulse" /></td>
                  </tr>
                ))
                : filtered.map((t) => {
                  const p = PRIORITY_META[t.priority] ?? PRIORITY_META['LOW'];
                  const s = STATUS_META[t.status] ?? STATUS_META['OPEN'];
                  return (
                    <tr key={t.id} className="border-b border-base-c transition-colors hover:bg-slate-50 dark:hover:bg-ink-850/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TicketIcon className="h-3.5 w-3.5 shrink-0 text-muted-c" />
                          <div>
                            <p className="text-[10px] font-bold text-muted-c">{t.id.slice(0, 8)}…</p>
                            <p className="text-sm font-semibold text-primary-c line-clamp-1">{t.subject}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-secondary-c">
                          <Building2 className="h-3 w-3 text-muted-c" />
                          {t.tenantId?.slice(0, 8) ?? '—'}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold', p.color)}>{p.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={t.status}
                            disabled={updatingId === t.id}
                            onChange={(e) => handleStatusChange(t.id, e.target.value)}
                            className={cx('rounded-full border-0 bg-transparent px-2 py-0.5 text-[10px] font-semibold appearance-none cursor-pointer focus:outline-none', s.color)}
                          >
                            {Object.keys(STATUS_META).map((sk) => (
                              <option key={sk} value={sk}>{STATUS_META[sk].label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar name={t.createdByEmail ?? '?'} size={24} />
                          <span className="text-xs text-secondary-c">{t.createdByEmail ?? '—'}</span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="text-xs text-secondary-c">{t.category ?? '—'}</span>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="flex items-center gap-1 text-[11px] text-muted-c">
                          <Clock className="h-3 w-3" />
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <TicketIcon className="h-10 w-10 text-muted-c/30" />
            <p className="mt-3 text-sm text-muted-c">{error ? 'Could not load tickets' : 'No tickets found'}</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
