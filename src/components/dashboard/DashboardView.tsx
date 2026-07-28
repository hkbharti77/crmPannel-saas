import { useState, useEffect } from 'react';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { LeadSummary } from '@/components/dashboard/LeadSummary';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { CalendarClock, ArrowRight, Loader2, RefreshCw, Wallet, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchDashboardAggregate, type DashboardAggregateDTO } from '@/lib/dashboardApi';

export function DashboardView({ onNavigate }: { onNavigate: (v: string) => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardAggregateDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const res = await fetchDashboardAggregate();
    setLoading(false);
    if (res.data) {
      setData(res.data);
    }
  };

  const displayName = user?.user_metadata?.name || user?.businessName || user?.email?.split('@')[0] || 'User';

  const formatCurrency = (val?: number) => {
    return `₹${Number(val || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      {/* Greeting header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c lg:text-2xl">
            Welcome back, {displayName}
          </h2>
          <p className="mt-1 text-sm text-secondary-c">
            Here&apos;s what&apos;s happening across your business today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3 py-1.5 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Badge variant="success" className="px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse-ring" />
            All systems operational
          </Badge>
        </div>
      </div>

      {/* KPI grid with real data */}
      <KpiGrid data={data} />

      {/* Main two-column layout */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <SalesChart />

          {/* Quick stats strip using real revenue summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-4">
              <p className="text-xs text-secondary-c flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5 text-primary-500" /> Total Pipeline Value
              </p>
              <p className="mt-1 text-lg font-bold text-primary-c tabular-nums">
                {formatCurrency(data?.revenueReport?.totalPipelineValue)}
              </p>
              <p className="mt-0.5 text-xs text-muted-c">
                {data?.revenueReport?.totalDeals || 0} deals with value
              </p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-xs text-secondary-c flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Received Revenue
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(data?.revenueReport?.receivedRevenue)}
              </p>
              <p className="mt-0.5 text-xs text-muted-c">
                {data?.revenueReport?.paidDeals || 0} paid deals
              </p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-xs text-secondary-c flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" /> Pending Revenue
              </p>
              <p className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {formatCurrency(data?.revenueReport?.pendingRevenue)}
              </p>
              <p className="mt-0.5 text-xs text-muted-c">
                {data?.revenueReport?.pendingDeals || 0} pending deals
              </p>
            </GlassCard>
          </div>
        </div>

        <div className="space-y-6">
          <LeadSummary pipeline={data?.pipeline} onOpenPipeline={() => onNavigate('pipeline')} />

          {/* Account Overview */}
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-primary-c">Workspace Overview</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-base-c pb-2">
                <span className="text-muted-c">Business Name</span>
                <span className="font-semibold text-primary-c">{user?.businessName || 'My Business'}</span>
              </div>
              <div className="flex justify-between border-b border-base-c pb-2">
                <span className="text-muted-c">Account Role</span>
                <span className="font-semibold text-primary-c">{user?.role || 'OWNER'}</span>
              </div>
              <div className="flex justify-between border-b border-base-c pb-2">
                <span className="text-muted-c">Total Leads</span>
                <span className="font-semibold text-primary-c">{data?.totalLeads || 0}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-muted-c">Open Support Tickets</span>
                <span className="font-semibold text-primary-c">{data?.openTickets || 0}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Activity feed + upcoming */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityFeed activities={data?.recentActivity} />
        </div>

        <div className="space-y-6">
          {/* Upcoming appointments */}
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                <h3 className="text-sm font-semibold text-primary-c">Upcoming Appointments</h3>
              </div>
              <button
                onClick={() => onNavigate('appointments')}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400"
              >
                All <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
              </div>
            ) : !data?.upcomingMeetingsList || data.upcomingMeetingsList.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-c">
                No upcoming appointments scheduled for this week.
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingMeetingsList.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl2 border border-base-c p-3 transition-colors hover:border-primary-500/30"
                  >
                    <p className="text-sm font-medium text-primary-c">{a.title || 'Meeting'}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs text-muted-c">{a.date} {a.time}</span>
                      <Badge variant="primary">{a.status || 'SCHEDULED'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

