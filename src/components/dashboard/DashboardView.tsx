import { useState, useEffect } from 'react';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { LeadSummary } from '@/components/dashboard/LeadSummary';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { GlassCard, Badge } from '@/components/ui/primitives';
import {
  CalendarClock,
  ArrowRight,
  Loader2,
  RefreshCw,
  Wallet,
  CheckCircle2,
  Clock,
  Sparkles,
  LayoutDashboard,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchDashboardAggregate, type DashboardAggregateDTO } from '@/lib/dashboardApi';
import { useNavigate } from 'react-router-dom';

export function DashboardView() {
  const navigate = useNavigate();
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
      {/* Greeting Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-purple-600/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-md shadow-blue-500/5">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-primary-c lg:text-2xl">
                Welcome back, {displayName}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Workspace
              </span>
            </div>
            <p className="mt-0.5 text-xs text-secondary-c">
              Executive business metrics, sales pipeline velocity & AI chatbot engagement dashboard.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-base-c bg-card-c px-3.5 py-2 text-xs font-bold text-secondary-c hover:text-primary-c hover:border-primary-500/40 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Live AI Chatbot & Demo Callout Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-5 sm:p-6 shadow-xl shadow-indigo-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur-md text-white border border-white/20 shadow-inner">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">Test Your Live AI Chatbot Widget</h3>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                Interactive
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
              Simulate customer conversations and test real-time AI responses directly on your custom <strong className="underline decoration-blue-300 font-bold">/demo</strong> webchat simulator.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/demo')}
          className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 px-5 py-3 text-xs font-extrabold shadow-lg transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer w-full md:w-auto justify-center"
        >
          <span>Launch AI Demo Page</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Grid */}
      <KpiGrid data={data} />

      {/* Unified Balanced Layout Grid (items-start prevents empty gap stretching) */}
      <div className="grid gap-6 xl:grid-cols-3 items-start">
        {/* Left 2 Columns: Chart + Revenue Cards + Recent Activity Stream */}
        <div className="xl:col-span-2 space-y-6">
          <SalesChart revenueReport={data?.revenueReport} />

          {/* Quick Stats Strip using Real Revenue Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-5 flex flex-col justify-between rounded-2xl border border-base-c bg-card-c shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                  <Wallet className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-c truncate">
                  Total Pipeline Value
                </span>
              </div>
              <div className="my-2.5">
                <p className="text-2xl font-bold text-primary-c tabular-nums tracking-tight">
                  {formatCurrency(data?.revenueReport?.totalPipelineValue)}
                </p>
              </div>
              <div className="pt-2 border-t border-base-c/60">
                <p className="text-xs text-secondary-c font-medium">
                  {data?.revenueReport?.totalDeals || 0} active deals with value
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex flex-col justify-between rounded-2xl border border-base-c bg-card-c shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-c truncate">
                  Received Revenue
                </span>
              </div>
              <div className="my-2.5">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                  {formatCurrency(data?.revenueReport?.receivedRevenue)}
                </p>
              </div>
              <div className="pt-2 border-t border-base-c/60">
                <p className="text-xs text-secondary-c font-medium">
                  {data?.revenueReport?.paidDeals || 0} paid deals completed
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex flex-col justify-between rounded-2xl border border-base-c bg-card-c shadow-xs hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-c truncate">
                  Pending Revenue
                </span>
              </div>
              <div className="my-2.5">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                  {formatCurrency(data?.revenueReport?.pendingRevenue)}
                </p>
              </div>
              <div className="pt-2 border-t border-base-c/60">
                <p className="text-xs text-secondary-c font-medium">
                  {data?.revenueReport?.pendingDeals || 0} pending deal invoices
                </p>
              </div>
            </GlassCard>
          </div>

          {/* Activity Feed directly below revenue cards */}
          <ActivityFeed activities={data?.recentActivity} />
        </div>

        {/* Right 1 Column: Pipeline Stage Summary + Upcoming Appointments + Workspace Overview */}
        <div className="space-y-6">
          <LeadSummary pipeline={data?.pipeline} onOpenPipeline={() => navigate('/pipeline')} />

          {/* Upcoming Appointments Card */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary-c">Upcoming Appointments</h3>
              </div>
              <button
                onClick={() => navigate('/appointments')}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            ) : !data?.upcomingMeetingsList || data.upcomingMeetingsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-c">
                No upcoming appointments scheduled for this week.
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.upcomingMeetingsList.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-base-c bg-card-c p-3 transition-colors hover:border-blue-500/40"
                  >
                    <p className="text-xs font-bold text-primary-c">{a.title || 'Consultation Meeting'}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[11px] text-muted-c font-medium">{a.date} {a.time}</span>
                      <Badge variant="primary" className="text-[9px] font-bold">
                        {a.status || 'SCHEDULED'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Workspace Overview Card */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-c flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                Workspace Overview
              </h3>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-c font-medium">Business Name</span>
                <span className="font-bold text-primary-c">{user?.businessName || 'My Business'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-c font-medium">Account Role</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{user?.role || 'OWNER'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-c font-medium">Total Leads</span>
                <span className="font-bold text-primary-c tabular-nums">{data?.totalLeads || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-c font-medium">Open Support Tickets</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{data?.openTickets || 0}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
