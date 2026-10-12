import React, { useState, useEffect } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  CheckCircle,
  XCircle,
  Clock,
  Percent,
  AlertTriangle,
  Loader2,
  Calendar,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  fetchWhatsAppCallingAnalytics,
  formatCallDuration,
  type WhatsAppCallingAnalyticsDTO,
} from '@/lib/whatsappCallingApi';

interface CallingAnalyticsPanelProps {
  phoneNumberId?: string;
}

export function CallingAnalyticsPanel({ phoneNumberId }: CallingAnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<WhatsAppCallingAnalyticsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'7D' | '30D' | '90D' | 'ALL'>('30D');

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    let from: string | undefined;
    const now = new Date();
    if (range === '7D') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (range === '30D') {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (range === '90D') {
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    }

    try {
      const res = await fetchWhatsAppCallingAnalytics({
        phoneNumberId,
        from,
        to: range !== 'ALL' ? now.toISOString() : undefined,
      });

      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setAnalytics(res.data);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load calling analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [range, phoneNumberId]);

  if (loading && !analytics) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <span className="ml-2 text-xs font-semibold text-muted-c">Loading calling analytics...</span>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
        <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{error}</p>
        <button
          onClick={loadAnalytics}
          className="mt-2 text-xs text-primary-500 hover:underline flex items-center justify-center gap-1 mx-auto"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  const data = analytics || {
    totalCalls: 0,
    inboundCalls: 0,
    outboundCalls: 0,
    answeredCalls: 0,
    rejectedCalls: 0,
    failedCalls: 0,
    completedCalls: 0,
    averageDurationSeconds: 0,
    totalDurationSeconds: 0,
    answerRate: 0,
    failureCount: 0,
    terminationReasons: {},
    statusBreakdown: {},
  };

  const statusEntries = Object.entries(data.statusBreakdown || {});
  const reasonEntries = Object.entries(data.terminationReasons || {});

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-primary-c flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary-500" /> WhatsApp Voice Agent Analytics
          </h3>
          <p className="text-xs text-muted-c">
            Aggregated performance metrics across inbound and outbound AI calls
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-base-c bg-card-c p-0.5">
            {(['7D', '30D', '90D', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  range === r
                    ? 'bg-gradient-accent text-white shadow-soft'
                    : 'text-secondary-c hover:text-primary-c'
                }`}
              >
                {r === 'ALL' ? 'All Time' : r}
              </button>
            ))}
          </div>

          <button
            onClick={loadAnalytics}
            className="rounded-xl border border-base-c bg-card-c p-1.5 text-muted-c hover:text-primary-c transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Calls */}
        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1.5">
            <PhoneCall className="h-3.5 w-3.5 text-primary-500" /> Total Calls
          </span>
          <p className="font-mono text-2xl font-black text-primary-c">
            {data.totalCalls.toLocaleString()}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-muted-c pt-1">
            <span className="flex items-center gap-1">
              <PhoneOutgoing className="h-3 w-3 text-primary-500" /> {data.outboundCalls} Out
            </span>
            <span className="flex items-center gap-1">
              <PhoneIncoming className="h-3 w-3 text-emerald-500" /> {data.inboundCalls} In
            </span>
          </div>
        </GlassCard>

        {/* Answer Rate */}
        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5 text-emerald-500" /> Answer Rate
          </span>
          <p className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {data.answerRate.toFixed(1)}%
          </p>
          <p className="text-[11px] text-muted-c pt-1">
            {data.answeredCalls} answered / {data.totalCalls} placed
          </p>
        </GlassCard>

        {/* Average Duration */}
        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-indigo-500" /> Avg Call Duration
          </span>
          <p className="font-mono text-2xl font-black text-primary-c">
            {formatCallDuration(Math.round(data.averageDurationSeconds))}
          </p>
          <p className="text-[11px] text-muted-c pt-1">
            Total {formatCallDuration(data.totalDurationSeconds)} talk time
          </p>
        </GlassCard>

        {/* Completed vs Failed */}
        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-c flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Completed Calls
          </span>
          <p className="font-mono text-2xl font-black text-primary-c">
            {data.completedCalls.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 text-[11px] pt-1">
            <span className="text-rose-500 font-semibold">{data.failedCalls} failed</span>
            <span className="text-amber-500 font-semibold">{data.rejectedCalls} declined</span>
          </div>
        </GlassCard>
      </div>

      {/* Breakdown Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Call Status Distribution */}
        <GlassCard className="p-5 space-y-4">
          <h4 className="text-xs font-bold text-primary-c uppercase tracking-wider">
            Call Status Breakdown
          </h4>
          {statusEntries.length === 0 ? (
            <p className="text-xs text-muted-c py-4 text-center">No call sessions recorded</p>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => {
                const pct = data.totalCalls > 0 ? (count / data.totalCalls) * 100 : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-secondary-c uppercase tracking-wide">
                        {status}
                      </span>
                      <span className="font-mono text-xs font-bold text-primary-c">
                        {count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-subtle-c">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          status === 'TERMINATED' || status === 'COMPLETED'
                            ? 'bg-emerald-500'
                            : status === 'ACTIVE'
                            ? 'bg-primary-500'
                            : status === 'REJECTED'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Termination Reason Distribution */}
        <GlassCard className="p-5 space-y-4">
          <h4 className="text-xs font-bold text-primary-c uppercase tracking-wider">
            Call Termination Reasons
          </h4>
          {reasonEntries.length === 0 ? (
            <p className="text-xs text-muted-c py-4 text-center">No termination data recorded</p>
          ) : (
            <div className="space-y-3">
              {reasonEntries.map(([reason, count]) => {
                const pct = data.totalCalls > 0 ? (count / data.totalCalls) * 100 : 0;
                return (
                  <div key={reason} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-secondary-c truncate max-w-[200px]" title={reason}>
                        {reason.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-xs font-bold text-primary-c">
                        {count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-subtle-c">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
