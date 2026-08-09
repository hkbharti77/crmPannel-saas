import { useState, useEffect } from 'react';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { REVENUE_DATA } from '@/components/admin/adminData';
import {
  Building2, Users, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Server, Activity, DollarSign, UserPlus, RefreshCw,
} from 'lucide-react';
import {
  fetchAnalyticsOverview, fetchTenants, fetchPlatformHealth, fetchRecentActivity, normalizeHealthServices,
  type ApiAnalyticsOverview, type ApiTenant, type ApiHealthService,
} from '@/lib/platformApi';

import { useNavigate } from 'react-router-dom';

export function AdminOverview() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<ApiAnalyticsOverview | null>(null);
  const [tenants, setTenants] = useState<ApiTenant[]>([]);
  const [health, setHealth] = useState<ApiHealthService[]>([]);
  const [activity, setActivity] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [ovRes, tenRes, hlRes, actRes] = await Promise.all([
      fetchAnalyticsOverview(),
      fetchTenants({ size: 5 }),
      fetchPlatformHealth(),
      fetchRecentActivity(),
    ]);
    if (ovRes.error) setError(ovRes.error);
    if (ovRes.data) setOverview(ovRes.data);
    if (tenRes.data) {
      const list = Array.isArray(tenRes.data) ? tenRes.data : tenRes.data.content ?? [];
      setTenants(list.slice(0, 5));
    }
    if (hlRes.data?.services) setHealth(normalizeHealthServices(hlRes.data.services).slice(0, 5));
    if (actRes.data) setActivity(Array.isArray(actRes.data) ? actRes.data.slice(0, 5) : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const activeTenants = overview?.activeTenants ?? 0;
  const totalTenants = overview?.totalTenants ?? 0;
  const totalUsers = overview?.totalUsers ?? 0;
  const totalLeads = overview?.totalLeads ?? 0;
  const openTickets = overview?.openTickets ?? 0;
  const degradedServices = overview?.degradedServices ?? 0;

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-1.5">{error}</p>}
        <button onClick={load} disabled={loading} className="ml-auto flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-1.5 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors">
          <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Building2} label="Active Tenants" value={loading ? '—' : String(activeTenants)} sub={`${totalTenants - activeTenants} trial/other`} trend="up" trendVal="+2 this month" color="#2563EB" onClick={() => navigate('/admin/tenants')} />
        <KpiCard icon={DollarSign} label="Monthly Recurring Revenue" value={loading ? '—' : `₹${((overview?.mrr ?? 0) / 1000).toFixed(1)}K`} sub="MRR" trend="up" trendVal="+12.4%" color="#10B981" onClick={() => navigate('/admin/subscriptions')} />
        <KpiCard icon={Users} label="Total Users" value={loading ? '—' : String(totalUsers)} sub={`${totalLeads} leads`} trend="up" trendVal="+8 this month" color="#7C3AED" onClick={() => navigate('/admin/tenants')} />
        <KpiCard icon={AlertCircle} label="Open Tickets" value={loading ? '—' : String(openTickets)} sub={degradedServices > 0 ? `${degradedServices} service degraded` : 'All systems up'} trend={degradedServices > 0 ? 'down' : 'up'} trendVal={degradedServices > 0 ? 'Attention needed' : 'Healthy'} color={degradedServices > 0 ? '#F43F5E' : '#10B981'} onClick={() => navigate('/admin/tickets')} />
      </div>

      {/* Revenue chart + Recent tenants */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-primary-c">Revenue Growth</h3>
              <p className="text-[11px] text-muted-c">Monthly recurring revenue (last 7 months)</p>
            </div>
            <Badge variant="success"><TrendingUp className="h-3 w-3" /> +75% YoY</Badge>
          </div>
          <RevenueChart />
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-primary-c">Recent Tenants</h3>
            <button onClick={() => navigate('/admin/tenants')} className="text-[11px] font-medium text-rose-500 hover:underline">View all</button>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-ink-800 animate-pulse" />)}</div>
          ) : tenants.length === 0 ? (
            <p className="text-xs text-muted-c">No tenants found</p>
          ) : (
            <div className="space-y-2.5">
              {tenants.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <Avatar name={t.businessName} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary-c">{t.businessName}</p>
                    <p className="truncate text-[10px] text-muted-c">{t.businessType ?? 'Business'}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary-500/10 px-2 py-0.5 text-[9px] font-bold text-primary-600 dark:text-primary-300">{t.planType}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* System health + activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-c"><Server className="h-4 w-4 text-muted-c" /> System Health</h3>
            <button onClick={() => navigate('/admin/health')} className="text-[11px] font-medium text-rose-500 hover:underline">Details</button>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-ink-800 animate-pulse" />)}</div>
          ) : health.length === 0 ? (
            <p className="text-xs text-muted-c">Health data unavailable</p>
          ) : (
            <div className="space-y-2.5">
              {health.map((s) => (
                <div key={s.name} className="flex items-center justify-between rounded-lg border border-base-c p-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={cx('h-2.5 w-2.5 rounded-full', s.status === 'operational' || s.status === 'UP' ? 'bg-success-500' : s.status === 'degraded' ? 'bg-warning-500' : 'bg-danger-500')} />
                    <div>
                      <p className="text-xs font-medium text-primary-c">{s.name}</p>
                      <p className="text-[10px] text-muted-c">{s.uptime ? `${s.uptime}% uptime` : ''}{s.latency ? ` · ${s.latency}ms` : ''}</p>
                    </div>
                  </div>
                  <span className={cx('text-[10px] font-bold', s.status === 'operational' || s.status === 'UP' ? 'text-success-600 dark:text-success-400' : 'text-warning-600 dark:text-warning-400')}>
                    {(s.status || '').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-c"><Activity className="h-4 w-4 text-muted-c" /> Recent Activity</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-ink-800 animate-pulse" />)}</div>
          ) : activity.length === 0 ? (
            <div className="space-y-3">
              <ActivityRow icon={UserPlus} color="#10B981" text="Platform activity will appear here" time="Connect backend" />
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((a: Record<string, unknown>, i: number) => (
                <ActivityRow key={i} icon={CheckCircle2} color="#2563EB" text={(a.action as string) ?? (a.message as string) ?? JSON.stringify(a)} time={(a.timestamp as string) ?? (a.time as string) ?? ''} />
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, trend, trendVal, color, onClick }: {
  icon: typeof Building2; label: string; value: string; sub: string; trend: 'up' | 'down'; trendVal: string; color: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="rounded-xl2 border border-base-c bg-card-c p-4 text-left transition-all hover:border-primary-500/30 hover:shadow-soft">
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl2" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <span className={cx('flex items-center gap-0.5 text-[10px] font-bold', trend === 'up' ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400')}>
          {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trendVal}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-primary-c">{value}</p>
      <p className="text-[11px] text-muted-c">{label}</p>
      <p className="mt-0.5 text-[10px] text-secondary-c">{sub}</p>
    </button>
  );
}

function RevenueChart() {
  const max = Math.max(...REVENUE_DATA.map((d) => d.mrr));
  const min = Math.min(...REVENUE_DATA.map((d) => d.mrr));
  const range = max - min || 1;
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 180 }}>
      {REVENUE_DATA.map((d) => {
        const h = ((d.mrr - min) / range) * 140 + 40;
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative w-full" style={{ height: h }}>
              <div className="absolute inset-x-1 bottom-0 top-0 rounded-t-lg bg-gradient-to-t from-primary-500 to-secondary-500 transition-all hover:from-primary-600 hover:to-secondary-600" />
            </div>
            <span className="text-[10px] text-muted-c">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityRow({ icon: Icon, color, text, time }: { icon: typeof Building2; color: string; text: string; time: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-primary-c">{text}</p>
        <p className="text-[10px] text-muted-c">{time}</p>
      </div>
    </div>
  );
}
