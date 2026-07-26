import { useState } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { AreaChart, BarRow, Sparkline } from '@/components/ui/charts';
import { cx } from '@/lib/types';
import {
  KPI_METRICS,
  REVENUE_BY_MONTH,
  LEAD_SOURCE_BREAKDOWN,
  AGENT_PERFORMANCE,
  SALES_FUNNEL,
} from './reportData';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  Users,
  Target,
  IndianRupee,
  Percent,
} from 'lucide-react';

const RANGES = ['7D', '30D', '90D', '1Y'] as const;
type Range = (typeof RANGES)[number];

const KPI_ICONS: Record<string, typeof IndianRupee> = {
  revenue: IndianRupee,
  deals: Target,
  leads: Users,
  conversion: Percent,
};

export function ReportsView() {
  const [range, setRange] = useState<Range>('30D');

  const revenueValues = REVENUE_BY_MONTH.map((m) => m.value);
  const maxSource = Math.max(...LEAD_SOURCE_BREAKDOWN.map((s) => s.count));

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
          <button className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c transition-colors hover:text-primary-c">
            <Calendar className="h-3.5 w-3.5" /> Custom
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-gradient-accent px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_METRICS.map((m) => {
          const Icon = KPI_ICONS[m.id] ?? IndianRupee;
          const TrendIcon = m.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <GlassCard key={m.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-xl2" style={{ backgroundColor: `${m.color}15` }}>
                  <Icon className="h-4.5 w-4.5" style={{ color: m.color }} />
                </div>
                <Badge variant={m.trend === 'up' ? 'success' : 'danger'}>
                  <TrendIcon className="h-3 w-3" /> {Math.abs(m.change)}%
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

      {/* Revenue chart + lead sources */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-primary-c">Revenue Trend</h3>
              <p className="mt-0.5 text-xs text-muted-c">Monthly closed deal value (in ₹ lakhs)</p>
            </div>
            <Badge variant="success">
              <TrendingUp className="h-3 w-3" /> +12.4%
            </Badge>
          </div>
          <AreaChart data={revenueValues} height={240} showDots className="w-full" />
          <div className="mt-3 flex justify-between px-2">
            {REVENUE_BY_MONTH.map((m) => (
              <span key={m.month} className="text-[10px] font-medium text-muted-c">{m.month}</span>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-primary-c">Lead Sources</h3>
          <p className="mt-0.5 text-xs text-muted-c">Where your leads come from</p>
          <div className="mt-5 space-y-4">
            {LEAD_SOURCE_BREAKDOWN.map((s) => (
              <BarRow
                key={s.source}
                label={s.source}
                value={s.count}
                max={maxSource}
                color={s.color}
                rightLabel={`${s.count} (${s.pct}%)`}
              />
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Sales funnel + agent performance */}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-c" />
            <h3 className="text-sm font-semibold text-primary-c">Sales Funnel</h3>
          </div>
          <div className="space-y-3">
            {SALES_FUNNEL.map((f, i) => (
              <div key={f.stage}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-secondary-c">{f.stage}</span>
                  <span className="font-semibold text-primary-c tabular-nums">
                    {f.count.toLocaleString()} <span className="text-muted-c">({f.pct}%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-7 overflow-hidden rounded-lg bg-slate-100 dark:bg-ink-800">
                  <div
                    className="h-full rounded-lg bg-gradient-accent transition-all duration-700 ease-out"
                    style={{ width: `${f.pct}%`, opacity: 1 - i * 0.12 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-c" />
            <h3 className="text-sm font-semibold text-primary-c">Agent Performance</h3>
          </div>
          <div className="space-y-4">
            {AGENT_PERFORMANCE.map((a) => (
              <div key={a.agent} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-primary-c">{a.agent}</p>
                    <span className="shrink-0 text-xs font-bold text-primary-c tabular-nums">{a.revenue}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-c">
                    <span>{a.deals} deals</span>
                    <span>{a.conv}% conv</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800">
                    <div
                      className="h-full rounded-full bg-gradient-accent transition-all duration-700"
                      style={{ width: `${(a.deals / 41) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
