import { useState, useEffect } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { Sparkline } from '@/components/ui/charts';
import { cx } from '@/lib/types';
import { fetchDashboardAggregate, type DashboardAggregateDTO } from '@/lib/dashboardApi';
import {
  TrendingUp,
  TrendingDown,
  Filter,
  Users,
  Target,
  IndianRupee,
  Percent,
  RefreshCw,
} from 'lucide-react';

const RANGES = ['7D', '30D', '90D', '1Y'] as const;
type Range = (typeof RANGES)[number];

export function ReportsView() {
  const [range, setRange] = useState<Range>('30D');
  const [dashData, setDashData] = useState<DashboardAggregateDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await fetchDashboardAggregate();
    setLoading(false);
    if (res.data) {
      setDashData(res.data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const revReport = dashData?.revenueReport;
  const totalLeads = dashData?.totalLeads ?? 0;
  const closedLeads = dashData?.closedLeads ?? 0;

  const totalRev = revReport?.receivedRevenue || revReport?.totalPipelineValue || 0;
  const totalRevStr = totalRev >= 10000000
    ? `₹${(totalRev / 10000000).toFixed(2)}Cr`
    : totalRev >= 100000
    ? `₹${(totalRev / 100000).toFixed(1)}L`
    : `₹${totalRev.toLocaleString('en-IN')}`;
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0';

  const kpis = [
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: totalRevStr,
      change: 0,
      trend: 'up' as const,
      spark: [0, 0, 0, 0, 0, 0, 0],
      color: '#2563EB',
      icon: IndianRupee,
    },
    {
      id: 'deals',
      label: 'Deals Closed',
      value: String(closedLeads),
      change: 0,
      trend: 'up' as const,
      spark: [0, 0, 0, 0, 0, 0, 0],
      color: '#10b981',
      icon: Target,
    },
    {
      id: 'leads',
      label: 'Total Leads',
      value: String(totalLeads),
      change: 0,
      trend: 'up' as const,
      spark: [0, 0, 0, 0, 0, 0, 0],
      color: '#f59e0b',
      icon: Users,
    },
    {
      id: 'conversion',
      label: 'Conversion Rate',
      value: `${conversionRate}%`,
      change: 0,
      trend: 'up' as const,
      spark: [0, 0, 0, 0, 0, 0, 0],
      color: '#ef4444',
      icon: Percent,
    },
  ];

  const pipelineStages = dashData?.pipeline || [];
  const funnel = [
    { stage: 'Total Leads', count: totalLeads, pct: 100 },
    ...pipelineStages.map((st) => ({
      stage: st.stageName,
      count: st.count,
      pct: totalLeads > 0 ? Math.round((st.count / totalLeads) * 100) : 0,
    })),
    { stage: 'Closed Won', count: closedLeads, pct: totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Reports</h2>
          <p className="mt-0.5 text-sm text-secondary-c">
            Track performance, conversions, and revenue analytics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c disabled:opacity-50"
          >
            <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
          </button>
          <div className="flex rounded-lg border border-base-c p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cx(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  range === r ? 'bg-gradient-accent text-white' : 'text-secondary-c hover:text-primary-c',
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((m) => {
          const Icon = m.icon;
          const TrendIcon = m.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <GlassCard key={m.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-xl2" style={{ backgroundColor: `${m.color}15` }}>
                  <Icon className="h-4.5 w-4.5" style={{ color: m.color }} />
                </div>
                <Badge variant={m.trend === 'up' ? 'success' : 'danger'}>
                  <TrendIcon className="h-3 w-3" /> {m.change}%
                </Badge>
              </div>
              <p className="mt-3 text-[10px] font-medium uppercase tracking-wider text-muted-c">{m.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-primary-c tabular-nums">{m.value}</p>
              <div className="mt-3">
                <Sparkline data={m.spark} color={m.color} className="h-9 w-full" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Revenue chart + Funnel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-primary-c">Revenue Breakdown</h3>
              <p className="mt-0.5 text-xs text-muted-c">Live deal pipeline & received revenue</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-base-c p-4 bg-card-c">
              <p className="text-xs text-secondary-c font-medium">Pipeline Value</p>
              <p className="text-lg font-bold text-primary-c mt-1">₹{(revReport?.totalPipelineValue || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-xl border border-base-c p-4 bg-card-c">
              <p className="text-xs text-secondary-c font-medium">Received Revenue</p>
              <p className="text-lg font-bold text-success-600 dark:text-success-400 mt-1">₹{(revReport?.receivedRevenue || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-xl border border-base-c p-4 bg-card-c">
              <p className="text-xs text-secondary-c font-medium">Pending Revenue</p>
              <p className="text-lg font-bold text-warning-600 dark:text-warning-400 mt-1">₹{(revReport?.pendingRevenue || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-c" />
            <h3 className="text-sm font-semibold text-primary-c">Sales Funnel</h3>
          </div>
          {funnel.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-c">No funnel data available yet.</div>
          ) : (
            <div className="space-y-3">
              {funnel.map((f, i) => (
                <div key={f.stage}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-secondary-c">{f.stage}</span>
                    <span className="font-semibold text-primary-c tabular-nums">
                      {f.count.toLocaleString()} <span className="text-muted-c">({f.pct}%)</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-6 overflow-hidden rounded-lg bg-slate-100 dark:bg-ink-800">
                    <div
                      className="h-full rounded-lg bg-gradient-accent transition-all duration-700 ease-out"
                      style={{ width: `${Math.max(f.pct, f.count > 0 ? 5 : 0)}%`, opacity: 1 - Math.min(i * 0.1, 0.5) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
