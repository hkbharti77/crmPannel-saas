import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  TENANTS, ADMIN_TICKETS, SUBSCRIPTIONS, REVENUE_DATA, SERVICE_HEALTH,
  PLAN_META, STATUS_META,
} from '@/components/admin/adminData';
import {
  Building2, Users, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, Server, Activity, DollarSign, UserPlus,
} from 'lucide-react';

export function AdminOverview({ onNavigate }: { onNavigate: (v: 'tenants' | 'tickets' | 'subscriptions' | 'health') => void }) {
  const activeTenants = TENANTS.filter((t) => t.status === 'active').length;
  const trialTenants = TENANTS.filter((t) => t.status === 'trial').length;
  const totalMRR = SUBSCRIPTIONS.filter((s) => s.status === 'active').reduce((s, sub) => s + sub.mrr, 0);
  const totalUsers = TENANTS.reduce((s, t) => s + t.users, 0);
  const totalLeads = TENANTS.reduce((s, t) => s + t.leads, 0);
  const openTickets = ADMIN_TICKETS.filter((t) => t.status === 'OPEN').length;
  const degradedServices = SERVICE_HEALTH.filter((s) => s.status !== 'operational').length;

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Building2} label="Active Tenants" value={String(activeTenants)} sub={`${trialTenants} on trial`} trend="up" trendVal="+2 this month" color="#2563EB" onClick={() => onNavigate('tenants')} />
        <KpiCard icon={DollarSign} label="Monthly Recurring Revenue" value={`₹${(totalMRR / 1000).toFixed(1)}K`} sub="₹85.9K total" trend="up" trendVal="+12.4%" color="#10B981" onClick={() => onNavigate('subscriptions')} />
        <KpiCard icon={Users} label="Total Users" value={String(totalUsers)} sub={`${totalLeads} leads`} trend="up" trendVal="+8 this month" color="#7C3AED" onClick={() => onNavigate('tenants')} />
        <KpiCard icon={AlertCircle} label="Open Tickets" value={String(openTickets)} sub={degradedServices > 0 ? `${degradedServices} service degraded` : 'All systems up'} trend={degradedServices > 0 ? 'down' : 'up'} trendVal={degradedServices > 0 ? 'Attention needed' : 'Healthy'} color={degradedServices > 0 ? '#F43F5E' : '#10B981'} onClick={() => onNavigate('tickets')} />
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
            <button onClick={() => onNavigate('tenants')} className="text-[11px] font-medium text-rose-500 hover:underline">View all</button>
          </div>
          <div className="space-y-2.5">
            {TENANTS.slice(0, 5).map((t) => {
              const sMeta = STATUS_META[t.status];
              const pMeta = PLAN_META[t.plan];
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <Avatar name={t.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary-c">{t.name}</p>
                    <p className="truncate text-[10px] text-muted-c">{t.region} · {t.niche}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={cx('h-2 w-2 rounded-full', sMeta.dot)} />
                    <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold', pMeta.color)}>{pMeta.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* System health + activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-c"><Server className="h-4 w-4 text-muted-c" /> System Health</h3>
            <button onClick={() => onNavigate('health')} className="text-[11px] font-medium text-rose-500 hover:underline">Details</button>
          </div>
          <div className="space-y-2.5">
            {SERVICE_HEALTH.slice(0, 5).map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-lg border border-base-c p-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={cx('h-2.5 w-2.5 rounded-full', s.status === 'operational' ? 'bg-success-500' : s.status === 'degraded' ? 'bg-warning-500' : 'bg-danger-500')} />
                  <div>
                    <p className="text-xs font-medium text-primary-c">{s.name}</p>
                    <p className="text-[10px] text-muted-c">{s.uptime}% uptime · {s.latency}ms</p>
                  </div>
                </div>
                <span className={cx('text-[10px] font-bold', s.status === 'operational' ? 'text-success-600 dark:text-success-400' : 'text-warning-600 dark:text-warning-400')}>
                  {s.status === 'operational' ? 'OPERATIONAL' : s.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-c"><Activity className="h-4 w-4 text-muted-c" /> Recent Activity</h3>
          </div>
          <div className="space-y-3">
            <ActivityRow icon={UserPlus} color="#10B981" text="New tenant Suburb Homes started trial" time="2 hr ago" />
            <ActivityRow icon={AlertCircle} color="#F43F5E" text="Urban Nest suspended (payment overdue)" time="5 hr ago" />
            <ActivityRow icon={CheckCircle2} color="#2563EB" text="Skyline Properties upgraded to Growth" time="1 day ago" />
            <ActivityRow icon={Clock} color="#F59E0B" text="2 new support tickets from Apex Investors" time="1 day ago" />
            <ActivityRow icon={Building2} color="#7C3AED" text="Apex Investors added 15 seats to Enterprise" time="2 days ago" />
          </div>
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
