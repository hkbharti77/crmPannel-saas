import { useState, useMemo } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { SUBSCRIPTIONS, PLAN_META, type Subscription } from '@/components/admin/adminData';
import { Search, CreditCard, DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react';

const SUB_STATUS_META: Record<Subscription['status'], { label: string; color: string; dot: string }> = {
  active: { label: 'Active', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300', dot: 'bg-success-500' },
  trialing: { label: 'Trialing', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300', dot: 'bg-primary-500' },
  past_due: { label: 'Past Due', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300', dot: 'bg-warning-500' },
  canceled: { label: 'Canceled', color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300', dot: 'bg-danger-500' },
};

export function AdminSubscriptions() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => SUBSCRIPTIONS.filter((s) => !search || s.tenant.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const totalMRR = SUBSCRIPTIONS.filter((s) => s.status === 'active').reduce((s, x) => s + x.mrr, 0);
  const activeCount = SUBSCRIPTIONS.filter((s) => s.status === 'active').length;
  const trialCount = SUBSCRIPTIONS.filter((s) => s.status === 'trialing').length;
  const pastDueCount = SUBSCRIPTIONS.filter((s) => s.status === 'past_due').length;
  const totalSeats = SUBSCRIPTIONS.reduce((s, x) => s + x.seats, 0);
  const usedSeats = SUBSCRIPTIONS.reduce((s, x) => s + x.seatsUsed, 0);

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-primary-c">Subscriptions</h2>
        <p className="mt-0.5 text-sm text-secondary-c">Manage billing, plans, and renewals across all tenants.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SubKpi icon={DollarSign} label="Total MRR" value={`₹${(totalMRR / 1000).toFixed(1)}K`} color="#10B981" />
        <SubKpi icon={CreditCard} label="Active Subs" value={String(activeCount)} color="#2563EB" />
        <SubKpi icon={Users} label="Seats Used" value={`${usedSeats}/${totalSeats}`} color="#7C3AED" />
        <SubKpi icon={AlertCircle} label="Past Due" value={String(pastDueCount)} color="#F59E0B" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subscriptions…" className="form-input pl-9" />
      </div>

      {/* Cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((s) => {
          const sMeta = SUB_STATUS_META[s.status];
          const pMeta = PLAN_META[s.plan];
          const seatPct = Math.round((s.seatsUsed / s.seats) * 100);
          return (
            <GlassCard key={s.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-primary-c">{s.tenant}</p>
                    <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold', pMeta.color)}>{pMeta.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-c">{s.id} · {s.paymentMethod}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cx('h-2 w-2 rounded-full', sMeta.dot)} />
                  <span className="text-[10px] font-bold text-secondary-c">{sMeta.label}</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-ink-850/60">
                  <p className="text-[9px] text-muted-c">MRR</p>
                  <p className="text-sm font-bold text-primary-c">₹{s.mrr.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-ink-850/60">
                  <p className="text-[9px] text-muted-c">Seats</p>
                  <p className="text-sm font-bold text-primary-c">{s.seatsUsed}/{s.seats}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 dark:bg-ink-850/60">
                  <p className="text-[9px] text-muted-c">Renewal</p>
                  <p className="text-xs font-medium text-primary-c line-clamp-1">{s.renewalDate}</p>
                </div>
              </div>

              <div className="mt-2.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-850">
                  <div className={cx('h-full rounded-full transition-all', seatPct > 80 ? 'bg-warning-500' : 'bg-success-500')} style={{ width: `${seatPct}%` }} />
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

function SubKpi({ icon: Icon, label, value, color }: { icon: typeof DollarSign; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl2 border border-base-c bg-card-c p-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl2" style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-primary-c">{value}</p>
      <p className="text-[11px] text-muted-c">{label}</p>
    </div>
  );
}
