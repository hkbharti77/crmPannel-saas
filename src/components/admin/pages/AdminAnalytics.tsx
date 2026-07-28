import { useState, useEffect } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { PLAN_META, REVENUE_DATA, GROWTH_DATA } from '@/components/admin/adminData';
import {
  TrendingUp, TrendingDown, Users, Building2, DollarSign, Activity, RefreshCw
} from 'lucide-react';
import {
  fetchAnalyticsOverview,
  fetchAnalyticsGrowth,
  fetchAnalyticsSubscriptions,
  fetchAnalyticsChurn,
  fetchAnalyticsNiches,
  type ApiAnalyticsOverview,
} from '@/lib/platformApi';

export function AdminAnalytics() {
  const [overview, setOverview] = useState<ApiAnalyticsOverview | null>(null);
  const [growthData, setGrowthData] = useState<any[]>(GROWTH_DATA);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [churnRate, setChurnRate] = useState<string>('4.2%');
  const [nicheData, setNicheData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [ovRes, grRes, subRes, chRes, nchRes] = await Promise.all([
      fetchAnalyticsOverview(),
      fetchAnalyticsGrowth(),
      fetchAnalyticsSubscriptions(),
      fetchAnalyticsChurn(),
      fetchAnalyticsNiches(),
    ]);

    if (ovRes.data) setOverview(ovRes.data);
    if (grRes.data && Array.isArray(grRes.data)) setGrowthData(grRes.data);
    if (subRes.data) setSubscriptionData(subRes.data);
    if (chRes.data) setChurnRate(chRes.data.churnRate ?? '4.2%');
    if (nchRes.data && Array.isArray(nchRes.data)) setNicheData(nchRes.data);
    if (ovRes.error && grRes.error) setError(ovRes.error || grRes.error || null);

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const totalMRR = overview?.mrr ?? REVENUE_DATA[REVENUE_DATA.length - 1].mrr;
  const prevMRR = REVENUE_DATA[REVENUE_DATA.length - 2].mrr;
  const mrrGrowth = ((totalMRR - prevMRR) / (prevMRR || 1) * 100).toFixed(1);

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Platform Analytics</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Comprehensive growth, revenue, and usage insights.</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors">
          <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2">{error} — showing fallback metrics</p>}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={DollarSign} label="Current MRR" value={loading ? '—' : `₹${(totalMRR / 1000).toFixed(1)}K`} change={`+${mrrGrowth}%`} trend="up" color="#10B981" />
        <MetricCard icon={Users} label="Total Platform Users" value={loading ? '—' : String(overview?.totalUsers ?? 0)} change="+8.2%" trend="up" color="#2563EB" />
        <MetricCard icon={Building2} label="Total Leads" value={loading ? '—' : (overview?.totalLeads ?? 0).toLocaleString()} change="+15.3%" trend="up" color="#7C3AED" />
        <MetricCard icon={Activity} label="Churn Rate" value={loading ? '—' : churnRate} change="-1.1%" trend="up" color="#F59E0B" />
      </div>

      {/* Revenue trend */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-primary-c">MRR Trend</h3>
            <p className="text-[11px] text-muted-c">Monthly recurring revenue over time</p>
          </div>
          <Badge variant="success"><TrendingUp className="h-3 w-3" /> +75% YoY</Badge>
        </div>
        <AreaChart />
      </GlassCard>

      {/* Plan distribution + Growth */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-primary-c">Plan Distribution</h3>
          <div className="space-y-3">
            {Object.keys(PLAN_META).map((p) => {
              const meta = PLAN_META[p as keyof typeof PLAN_META];
              const count = subscriptionData?.[p] ?? 1;
              return (
                <div key={p}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-primary-c">{meta.label}</span>
                    <span className="text-muted-c">{count} tenants · ₹{(count * meta.price / 1000).toFixed(1)}K MRR</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-850">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all" style={{ width: `${Math.min(100, count * 25)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-primary-c">Weekly Growth (Signups vs Churn)</h3>
          <div className="flex items-end justify-between gap-1.5" style={{ height: 160 }}>
            {growthData.map((d: any, i: number) => (
              <div key={d.week || i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 120 }}>
                  <div className="w-1/2 rounded-t bg-success-500 transition-all hover:bg-success-600" style={{ height: `${((d.signups || 1) / 10) * 120}px` }} title={`${d.signups || 0} signups`} />
                  <div className="w-1/2 rounded-t bg-danger-500 transition-all hover:bg-danger-600" style={{ height: `${((d.churn || 0) / 10) * 120}px` }} title={`${d.churn || 0} churned`} />
                </div>
                <span className="text-[9px] text-muted-c">{d.week || `W${i + 1}`}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-center gap-4 text-[10px]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success-500" /> Signups</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger-500" /> Churn</span>
          </div>
        </GlassCard>
      </div>

      {/* Niche Breakdown */}
      {nicheData.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-primary-c">Tenants by Niche</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {nicheData.map((n: any) => (
              <div key={n.niche || n.name} className="rounded-xl2 border border-base-c p-3 text-center">
                <p className="text-2xl font-bold tabular-nums text-primary-c">{n.count || 0}</p>
                <p className="text-[10px] text-muted-c">{n.niche || n.name}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, change, trend, color }: { icon: typeof DollarSign; label: string; value: string; change: string; trend: 'up' | 'down'; color: string }) {
  return (
    <div className="rounded-xl2 border border-base-c bg-card-c p-4">
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl2" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <span className={cx('flex items-center gap-0.5 text-[10px] font-bold', trend === 'up' ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400')}>
          {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {change}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-primary-c">{value}</p>
      <p className="text-[11px] text-muted-c">{label}</p>
    </div>
  );
}

function AreaChart() {
  const max = Math.max(...REVENUE_DATA.map((d) => d.mrr));
  const min = Math.min(...REVENUE_DATA.map((d) => d.mrr));
  const range = max - min || 1;
  const w = 100;
  const h = 160;
  const points = REVENUE_DATA.map((d, i) => ({
    x: (i / (REVENUE_DATA.length - 1)) * w,
    y: h - ((d.mrr - min) / range) * (h - 20) - 10,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 160 }}>
      <defs>
        <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#rev-grad)" />
      <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#2563EB" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
