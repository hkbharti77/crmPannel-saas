import { useState, useMemo } from 'react';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { TENANTS, PLAN_META, STATUS_META, type Tenant, type TenantStatus, type PlanTier } from '@/components/admin/adminData';
import { Search, Building2, Users, MapPin, Plus, MoreVertical, Filter } from 'lucide-react';

type FilterPlan = PlanTier | 'ALL';
type FilterStatus = TenantStatus | 'ALL';

export function AdminTenants() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<FilterPlan>('ALL');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  const filtered = useMemo(
    () =>
      TENANTS.filter((t) => {
        const ms = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()) || t.domain.includes(search.toLowerCase());
        const mp = planFilter === 'ALL' || t.plan === planFilter;
        const mst = statusFilter === 'ALL' || t.status === statusFilter;
        return ms && mp && mst;
      }),
    [search, planFilter, statusFilter],
  );

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Tenant Management</h2>
          <p className="mt-0.5 text-sm text-secondary-c">{TENANTS.length} tenants across {new Set(TENANTS.map((t) => t.region)).size} regions</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
          <Plus className="h-3.5 w-3.5" /> New Tenant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tenants…" className="form-input pl-9" />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value as FilterPlan)} className="rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none">
          <option value="ALL">All Plans</option>
          {(Object.keys(PLAN_META) as PlanTier[]).map((p) => <option key={p} value={p}>{PLAN_META[p].label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as FilterStatus)} className="rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none">
          <option value="ALL">All Statuses</option>
          {(Object.keys(STATUS_META) as TenantStatus[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base-c text-left text-[10px] font-bold uppercase tracking-wide text-muted-c">
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 sm:table-cell">Users</th>
                <th className="hidden px-4 py-3 md:table-cell">Leads</th>
                <th className="hidden px-4 py-3 lg:table-cell">MRR</th>
                <th className="hidden px-4 py-3 lg:table-cell">Region</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <TenantRow key={t.id} tenant={t} />
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-10 w-10 text-muted-c/30" />
            <p className="mt-3 text-sm text-muted-c">No tenants found</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function TenantRow({ tenant: t }: { tenant: Tenant }) {
  const sMeta = STATUS_META[t.status];
  const pMeta = PLAN_META[t.plan];
  return (
    <tr className="border-b border-base-c transition-colors hover:bg-slate-50 dark:hover:bg-ink-850/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={t.name} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary-c">{t.name}</p>
            <p className="truncate text-[10px] text-muted-c">{t.id} · {t.domain}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', pMeta.color)}>{pMeta.label}</span></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className={cx('h-2 w-2 rounded-full', sMeta.dot)} />
          <span className="text-xs font-medium text-primary-c">{sMeta.label}</span>
        </div>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-muted-c" />
          <span className="text-xs font-medium text-primary-c">{t.users}</span>
          <span className="text-[10px] text-muted-c">/ {t.maxUsers}</span>
        </div>
      </td>
      <td className="hidden px-4 py-3 md:table-cell"><span className="text-xs font-medium text-primary-c">{t.leads}</span></td>
      <td className="hidden px-4 py-3 lg:table-cell"><span className="text-xs font-semibold text-primary-c">₹{t.mrr.toLocaleString()}</span></td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <span className="flex items-center gap-1 text-[11px] text-secondary-c"><MapPin className="h-3 w-3 text-muted-c" />{t.region}</span>
      </td>
      <td className="px-4 py-3">
        <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-c transition-colors hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
          <MoreVertical className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
