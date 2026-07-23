import { useState, useMemo } from 'react';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { ADMIN_TICKETS, type AdminTicket } from '@/components/admin/adminData';
import { Search, Ticket as TicketIcon, Clock, Filter, Building2 } from 'lucide-react';

const PRIORITY_META: Record<AdminTicket['priority'], { label: string; color: string }> = {
  URGENT: { label: 'URGENT', color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300' },
  HIGH: { label: 'HIGH', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
  MEDIUM: { label: 'MEDIUM', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' },
  LOW: { label: 'LOW', color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300' },
};

const STATUS_META: Record<AdminTicket['status'], { label: string; color: string; dot: string }> = {
  OPEN: { label: 'Open', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300', dot: 'bg-primary-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300', dot: 'bg-warning-500' },
  RESOLVED: { label: 'Resolved', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300', dot: 'bg-success-500' },
  CLOSED: { label: 'Closed', color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300', dot: 'bg-slate-400' },
};

export function AdminTickets() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminTicket['status']>('ALL');

  const filtered = useMemo(
    () =>
      ADMIN_TICKETS.filter((t) => {
        const ms = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()) || t.tenant.toLowerCase().includes(search.toLowerCase());
        const mst = statusFilter === 'ALL' || t.status === statusFilter;
        return ms && mst;
      }),
    [search, statusFilter],
  );

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-primary-c">Platform Support Tickets</h2>
        <p className="mt-0.5 text-sm text-secondary-c">Cross-tenant ticket management for all customers.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as AdminTicket['status'][]).map((s) => {
          const count = ADMIN_TICKETS.filter((t) => t.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)} className={cx('flex items-center gap-2.5 rounded-xl2 border p-3 transition-all', statusFilter === s ? 'border-primary-500/40 bg-primary-500/5 shadow-soft' : 'border-base-c bg-card-c hover:border-primary-500/20')}>
              <span className={cx('h-2.5 w-2.5 rounded-full', STATUS_META[s].dot)} />
              <div className="text-left">
                <p className="text-lg font-bold tabular-nums text-primary-c">{count}</p>
                <p className="text-[10px] text-muted-c">{STATUS_META[s].label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets…" className="form-input pl-9" />
        </div>
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
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-base-c transition-colors hover:bg-slate-50 dark:hover:bg-ink-850/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TicketIcon className="h-3.5 w-3.5 shrink-0 text-muted-c" />
                      <div>
                        <p className="text-[10px] font-bold text-muted-c">{t.id}</p>
                        <p className="text-sm font-semibold text-primary-c line-clamp-1">{t.subject}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-secondary-c"><Building2 className="h-3 w-3 text-muted-c" /> {t.tenant}</span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell"><span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold', PRIORITY_META[t.priority].color)}>{PRIORITY_META[t.priority].label}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cx('h-2 w-2 rounded-full', STATUS_META[t.status].dot)} />
                      <span className="text-xs font-medium text-primary-c">{STATUS_META[t.status].label}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar name={t.requester} size={24} />
                      <span className="text-xs text-secondary-c">{t.requester}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell"><span className="text-xs text-secondary-c">{t.category}</span></td>
                  <td className="hidden px-4 py-3 lg:table-cell"><span className="flex items-center gap-1 text-[11px] text-muted-c"><Clock className="h-3 w-3" /> {t.createdAt}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12"><TicketIcon className="h-10 w-10 text-muted-c/30" /><p className="mt-3 text-sm text-muted-c">No tickets found</p></div>
        )}
      </GlassCard>
    </div>
  );
}
