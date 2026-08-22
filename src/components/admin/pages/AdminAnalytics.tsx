import { useState, useEffect } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { PLAN_META } from '@/components/admin/adminData';
import {
  TrendingUp, Users, Building2, DollarSign, Activity, RefreshCw, MessageSquare, FileText, CheckCircle2
} from 'lucide-react';
import {
  fetchAnalyticsOverview,
  fetchAnalyticsGrowth,
  fetchAnalyticsSubscriptions,
  fetchAnalyticsChurn,
  fetchAnalyticsNiches,
  fetchAnalyticsOperational,
  type ApiAnalyticsOverview,
} from '@/lib/platformApi';

interface GrowthPoint {
  date: string;
  count: number;
  signups?: number;
  churn?: number;
}

interface OperationalMetrics {
  aiRequestsToday?: number;
  apiRequestsToday?: number;
  jobFailuresToday?: number;
  whatsappMessagesToday?: number;
  totalDocuments?: number;
}

export function AdminAnalytics() {
  const [overview, setOverview] = useState<ApiAnalyticsOverview | null>(null);
  const [growthData, setGrowthData] = useState<GrowthPoint[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<Record<string, any> | null>(null);
  const [churnRate, setChurnRate] = useState<string>('0.0%');
  const [nicheData, setNicheData] = useState<{ niche: string; count: number }[]>([]);
  const [operational, setOperational] = useState<OperationalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, grRes, subRes, chRes, nchRes, opRes] = await Promise.all([
        fetchAnalyticsOverview(),
        fetchAnalyticsGrowth(),
        fetchAnalyticsSubscriptions(),
        fetchAnalyticsChurn(),
        fetchAnalyticsNiches(),
        fetchAnalyticsOperational(),
      ]);

      if (ovRes.data) setOverview(ovRes.data);
      if (grRes.data && Array.isArray(grRes.data)) setGrowthData(grRes.data as GrowthPoint[]);
      if (subRes.data) setSubscriptionData(subRes.data as Record<string, any>);
      if (chRes.data) {
        const churnObj = chRes.data as Record<string, any>;
        setChurnRate(churnObj.churnRate ?? '0.0%');
      }
      if (nchRes.data && Array.isArray(nchRes.data)) setNicheData(nchRes.data as { niche: string; count: number }[]);
      if (opRes.data) setOperational(opRes.data as OperationalMetrics);

      if (ovRes.error && grRes.error) {
        setError(ovRes.error || grRes.error || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load live analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalTenants = overview?.totalTenants ?? 0;
  const totalMRR = overview?.mrr ?? 0;
  const planBreakdown = subscriptionData?.planBreakdown ?? {};

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Platform Analytics</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Live growth, revenue, and platform usage metrics.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {error && (
        <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Real KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={DollarSign}
          label="Calculated MRR"
          value={loading ? '—' : `₹${totalMRR.toLocaleString('en-IN')}`}
          badge={totalMRR > 0 ? 'Active' : 'Free Tier Base'}
          color="#10B981"
        />
        <MetricCard
          icon={Building2}
          label="Total Tenants"
          value={loading ? '—' : String(totalTenants)}
          badge={`${overview?.activeTenants ?? totalTenants} active`}
          color="#2563EB"
        />
        <MetricCard
          icon={Users}
          label="Total Platform Users"
          value={loading ? '—' : String(overview?.totalUsers ?? 0)}
          badge="Verified"
          color="#7C3AED"
        />
        <MetricCard
          icon={Activity}
          label="Churn Rate"
          value={loading ? '—' : churnRate}
          badge="Live Status"
          color="#F59E0B"
        />
      </div>

      {/* Real Operational Activity Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-base-c bg-card-c p-3.5">
          <div className="flex items-center gap-2 text-muted-c text-xs font-medium">
            <Building2 className="h-4 w-4 text-primary-500" />
            <span>Total Leads Captured</span>
          </div>
          <p className="mt-2 text-xl font-bold text-primary-c tabular-nums">
            {loading ? '—' : (overview?.totalLeads ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-base-c bg-card-c p-3.5">
          <div className="flex items-center gap-2 text-muted-c text-xs font-medium">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <span>WhatsApp Messages (Today)</span>
          </div>
          <p className="mt-2 text-xl font-bold text-primary-c tabular-nums">
            {loading ? '—' : (operational?.whatsappMessagesToday && operational.whatsappMessagesToday >= 0 ? operational.whatsappMessagesToday.toLocaleString() : '0')}
          </p>
        </div>

        <div className="rounded-xl border border-base-c bg-card-c p-3.5">
          <div className="flex items-center gap-2 text-muted-c text-xs font-medium">
            <FileText className="h-4 w-4 text-violet-500" />
            <span>AI Knowledge Chunks</span>
          </div>
          <p className="mt-2 text-xl font-bold text-primary-c tabular-nums">
            {loading ? '—' : (operational?.totalDocuments ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-base-c bg-card-c p-3.5">
          <div className="flex items-center gap-2 text-muted-c text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span>Support Tickets</span>
          </div>
          <p className="mt-2 text-xl font-bold text-primary-c tabular-nums">
            {loading ? '—' : `${overview?.openTickets ?? 0} open / ${overview?.totalTickets ?? 0} total`}
          </p>
        </div>
      </div>

      {/* Real Signups Growth Timeline Chart */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-primary-c">Tenant Registrations Timeline</h3>
            <p className="text-[11px] text-muted-c">Daily tenant signups recorded in database (Last 30 Days)</p>
          </div>
          <Badge variant="success">
            <TrendingUp className="h-3 w-3 mr-1" />
            {growthData.reduce((acc, curr) => acc + (curr.count || curr.signups || 0), 0)} Signups Recorded
          </Badge>
        </div>
        
        {growthData.length > 0 ? (
          <div className="space-y-2">
            <RealGrowthChart data={growthData} />
            <div className="flex items-center justify-between text-[10px] text-muted-c px-1">
              <span>{growthData[0]?.date || '30 days ago'}</span>
              <span>{growthData[Math.floor(growthData.length / 2)]?.date || '15 days ago'}</span>
              <span>{growthData[growthData.length - 1]?.date || 'Today'}</span>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-xs text-muted-c">
            No signup timeline records found in current period.
          </div>
        )}
      </GlassCard>

      {/* Plan distribution + Niches */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-primary-c">Live Plan Distribution</h3>
          <div className="space-y-3">
            {Object.keys(PLAN_META).map((p) => {
              const meta = PLAN_META[p as keyof typeof PLAN_META];
              const count = Number(planBreakdown[p] ?? planBreakdown[p.toLowerCase()] ?? 0);
              const percentage = totalTenants > 0 ? Math.round((count / totalTenants) * 100) : 0;
              const planMRR = count * meta.price;

              return (
                <div key={p}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-primary-c">{meta.label}</span>
                    <span className="text-muted-c">
                      {count} {count === 1 ? 'tenant' : 'tenants'} ({percentage}%) · ₹{planMRR.toLocaleString('en-IN')} MRR
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-850">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Real Niche Breakdown */}
        <GlassCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-primary-c">Tenants by Business Niche</h3>
          {nicheData.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {nicheData.map((n) => (
                <div key={n.niche} className="rounded-xl border border-base-c bg-subtle-c p-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-primary-c">{n.count}</p>
                  <p className="text-[11px] text-muted-c truncate mt-0.5">{n.niche}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-xs text-muted-c">
              <Building2 className="h-6 w-6 text-muted-c mb-2 opacity-40" />
              <span>No business niches registered yet</span>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  badge,
  color,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  badge?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl2 border border-base-c bg-card-c p-4">
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl2" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-ink-800 text-secondary-c">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-primary-c">{value}</p>
      <p className="text-[11px] text-muted-c">{label}</p>
    </div>
  );
}

function RealGrowthChart({ data }: { data: GrowthPoint[] }) {
  const counts = data.map((d) => Number(d.count || d.signups || 0));
  const maxCount = Math.max(...counts, 1);
  const w = 100;
  const h = 120;

  if (data.length === 0) return null;

  const points = data.map((d, i) => {
    const val = Number(d.count || d.signups || 0);
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * w;
    const y = h - (val / maxCount) * (h - 20) - 10;
    return { x, y, val, date: d.date };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 140 }}>
        <defs>
          <linearGradient id="real-growth-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#real-growth-grad)" />
        <path
          d={pathD}
          fill="none"
          stroke="#2563EB"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.8"
            className="fill-primary-600 dark:fill-primary-400"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}
