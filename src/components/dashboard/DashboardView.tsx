import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { LeadSummary } from '@/components/dashboard/LeadSummary';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { BarRow } from '@/components/ui/charts';
import { Zap, CalendarClock, ArrowRight } from 'lucide-react';

const TOP_STAFF = [
  { name: 'Priya Sharma', deals: 12, revenue: '₹1,80,000' },
  { name: 'Sneha Patel', deals: 9, revenue: '₹1,45,000' },
  { name: 'Rahul Verma', deals: 7, revenue: '₹98,000' },
];

const QUICK_STATS = [
  { label: 'Response time', value: '2m 14s', change: -18 },
  { label: 'Bot resolution', value: '64%', change: 6 },
  { label: 'Booking rate', value: '41%', change: 3 },
];

export function DashboardView({ onNavigate }: { onNavigate: (v: string) => void }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      {/* Greeting header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c lg:text-2xl">
            Welcome back, Arjun
          </h2>
          <p className="mt-1 text-sm text-secondary-c">
            Here's what's happening across your business today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse-ring" />
            All systems operational
          </Badge>
        </div>
      </div>

      {/* KPI grid */}
      <KpiGrid />

      {/* Main two-column layout */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <SalesChart />

          {/* Quick stats strip */}
          <div className="grid gap-4 sm:grid-cols-3">
            {QUICK_STATS.map((s) => (
              <GlassCard key={s.label} className="p-4">
                <p className="text-xs text-secondary-c">{s.label}</p>
                <p className="mt-1 text-lg font-bold text-primary-c tabular-nums">
                  {s.value}
                </p>
                <p
                  className={`mt-0.5 text-xs font-medium ${
                    s.change >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                  }`}
                >
                  {s.change >= 0 ? '+' : ''}
                  {s.change}% vs last week
                </p>
              </GlassCard>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <LeadSummary onOpenPipeline={() => onNavigate('pipeline')} />

          {/* Top performers */}
          <GlassCard className="p-6">
            <h3 className="mb-4 text-sm font-semibold text-primary-c">Top Performers</h3>
            <div className="space-y-4">
              {TOP_STAFF.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="w-4 text-sm font-bold text-muted-c tabular-nums">
                    {i + 1}
                  </span>
                  <Avatar name={s.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-primary-c">{s.name}</p>
                    <p className="text-xs text-muted-c">{s.deals} deals closed</p>
                  </div>
                  <span className="text-sm font-semibold text-primary-c tabular-nums">
                    {s.revenue}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Activity feed + upcoming */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityFeed />
        </div>

        <div className="space-y-6">
          {/* Upcoming appointments */}
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                <h3 className="text-sm font-semibold text-primary-c">Upcoming</h3>
              </div>
              <button
                onClick={() => onNavigate('appointments')}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
              >
                All <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Site visit — Metro Realty', time: 'Today, 11:00 AM', status: 'SCHEDULED' },
                { title: 'Call — Sunil Group', time: 'Today, 3:30 PM', status: 'SCHEDULED' },
                { title: 'Demo — Apex Housing', time: 'Tomorrow, 10:00 AM', status: 'SCHEDULED' },
              ].map((a) => (
                <div
                  key={a.title}
                  className="rounded-xl2 border border-base-c p-3 transition-colors hover:border-primary-500/30"
                >
                  <p className="text-sm font-medium text-primary-c">{a.title}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-muted-c">{a.time}</span>
                    <Badge variant="primary">{a.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* AI usage */}
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning-500" />
              <h3 className="text-sm font-semibold text-primary-c">AI Usage</h3>
            </div>
            <div className="space-y-4">
              <BarRow label="Messages processed" value={8420} max={10000} rightLabel="8,420 / 10K" />
              <BarRow label="Embeddings indexed" value={1240} max={2000} rightLabel="1,240 / 2K" color="bg-secondary-500" />
              <BarRow label="Bot conversations" value={386} max={500} rightLabel="386 / 500" color="bg-success-500" />
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="mt-4 w-full rounded-xl2 bg-gradient-accent-soft py-2 text-xs font-medium text-primary-600 transition-colors hover:bg-gradient-accent hover:text-white dark:text-primary-300"
            >
              Manage plan
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
