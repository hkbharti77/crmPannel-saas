import { useState, useEffect, useMemo } from 'react';
import { GlassCard, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { PLAN_META, STATUS_META, type TenantStatus, type PlanTier } from '@/components/admin/adminData';
import { Search, Building2, Users, Plus, RefreshCw, Ban, CheckCircle2, Lock } from 'lucide-react';
import { fetchTenants, suspendTenant, activateTenant, lockTenant, type ApiTenant } from '@/lib/platformApi';

type FilterPlan = PlanTier | 'ALL';
type FilterStatus = TenantStatus | 'ALL' | string;

function mapStatus(t: ApiTenant): TenantStatus {
  const s = (t.status ?? 'active').toLowerCase();
  if (s === 'suspended') return 'suspended';
  if (s === 'trial' || !t.onboardingCompleted) return 'trial';
  if (s === 'churned' || s === 'archived') return 'churned';
  return 'active';
}

function mapPlan(t: ApiTenant): PlanTier {
  const p = (t.planType ?? 'FREE').toLowerCase();
  if (p === 'enterprise') return 'enterprise';
  if (p === 'scale' || p === 'pro') return 'scale';
  if (p === 'growth') return 'growth';
  return 'starter';
}

export function AdminTenants() {
  const [tenants, setTenants] = useState<ApiTenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<FilterPlan>('ALL');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchTenants({ size: 100, search: search || undefined });
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      const list = Array.isArray(res.data) ? res.data : res.data.content ?? [];
      const tot = Array.isArray(res.data) ? res.data.length : res.data.totalElements ?? res.data.content?.length ?? 0;
      setTenants(list);
      setTotal(tot);
    }
    setLoading(false);
  };

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() =>
    tenants.filter((t) => {
      const plan = mapPlan(t);
      const status = mapStatus(t);
      const ms = !search || t.businessName.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
      const mp = planFilter === 'ALL' || plan === planFilter;
      const mst = statusFilter === 'ALL' || status === statusFilter;
      return ms && mp && mst;
    }),
    [tenants, search, planFilter, statusFilter],
  );

  const handleAction = async (id: string, action: 'suspend' | 'activate' | 'lock') => {
    setActionLoading(id + action);
    if (action === 'suspend') await suspendTenant(id);
    else if (action === 'activate') await activateTenant(id);
    else await lockTenant(id);
    setActionLoading(null);
    load();
  };

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Tenant Management</h2>
          <p className="mt-0.5 text-sm text-secondary-c">{loading ? '…' : `${total} tenants`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors">
            <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
            <Plus className="h-3.5 w-3.5" /> New Tenant
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2">{error}</p>}

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
                <th className="hidden px-4 py-3 lg:table-cell">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-base-c">
                    <td className="px-4 py-3" colSpan={7}><div className="h-8 rounded-lg bg-slate-100 dark:bg-ink-800 animate-pulse" /></td>
                  </tr>
                ))
                : filtered.map((t) => {
                  const plan = mapPlan(t);
                  const status = mapStatus(t);
                  const sMeta = STATUS_META[status] ?? STATUS_META['active'];
                  const pMeta = PLAN_META[plan] ?? PLAN_META['starter'];
                  const isLoading = actionLoading?.startsWith(t.id);
                  return (
                    <tr key={t.id} className="border-b border-base-c transition-colors hover:bg-slate-50 dark:hover:bg-ink-850/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={t.businessName} size={36} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-primary-c">{t.businessName}</p>
                            <p className="truncate text-[10px] text-muted-c">{t.id.slice(0, 8)}… · {t.businessType ?? 'Business'}</p>
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
                          <span className="text-xs font-medium text-primary-c">{t.userCount ?? '—'}</span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell"><span className="text-xs font-medium text-primary-c">{t.leadCount ?? '—'}</span></td>
                      <td className="hidden px-4 py-3 lg:table-cell"><span className="text-[11px] text-muted-c">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {status !== 'active' && (
                            <button onClick={() => handleAction(t.id, 'activate')} disabled={!!isLoading} title="Activate" className="grid h-7 w-7 place-items-center rounded-lg text-success-500 hover:bg-success-50 dark:hover:bg-success-500/10 transition-colors">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          {status === 'active' && (
                            <button onClick={() => handleAction(t.id, 'suspend')} disabled={!!isLoading} title="Suspend" className="grid h-7 w-7 place-items-center rounded-lg text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-500/10 transition-colors">
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleAction(t.id, 'lock')} disabled={!!isLoading} title="Lock" className="grid h-7 w-7 place-items-center rounded-lg text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors">
                            <Lock className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-10 w-10 text-muted-c/30" />
            <p className="mt-3 text-sm text-muted-c">{error ? 'Could not load tenants' : 'No tenants found'}</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
