import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { SERVICE_HEALTH } from '@/components/admin/adminData';
import { Server, CheckCircle2, AlertTriangle, XCircle, Activity, Zap, Clock } from 'lucide-react';

export function AdminHealth() {
  const operational = SERVICE_HEALTH.filter((s) => s.status === 'operational').length;
  const degraded = SERVICE_HEALTH.filter((s) => s.status === 'degraded').length;
  const down = SERVICE_HEALTH.filter((s) => s.status === 'down').length;
  const avgUptime = (SERVICE_HEALTH.reduce((s, x) => s + x.uptime, 0) / SERVICE_HEALTH.length).toFixed(2);
  const avgLatency = Math.round(SERVICE_HEALTH.reduce((s, x) => s + x.latency, 0) / SERVICE_HEALTH.length);

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      {/* Status banner */}
      <div className={cx('flex items-center gap-3 rounded-xl2 border p-4', degraded > 0 ? 'border-warning-500/30 bg-warning-500/5' : 'border-success-500/30 bg-success-500/5')}>
        <div className={cx('grid h-10 w-10 place-items-center rounded-xl2', degraded > 0 ? 'bg-warning-500/15' : 'bg-success-500/15')}>
          {degraded > 0 ? <AlertTriangle className="h-5 w-5 text-warning-500" /> : <CheckCircle2 className="h-5 w-5 text-success-500" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-primary-c">
            {degraded > 0 ? `${degraded} service${degraded > 1 ? 's' : ''} degraded` : 'All systems operational'}
          </p>
          <p className="text-[11px] text-secondary-c">{operational} operational · {degraded} degraded · {down} down · {avgUptime}% avg uptime · {avgLatency}ms avg latency</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard icon={CheckCircle2} label="Operational" value={String(operational)} color="#10B981" />
        <SummaryCard icon={AlertTriangle} label="Degraded" value={String(degraded)} color="#F59E0B" />
        <SummaryCard icon={XCircle} label="Down" value={String(down)} color="#F43F5E" />
        <SummaryCard icon={Activity} label="Avg Uptime" value={`${avgUptime}%`} color="#2563EB" />
      </div>

      {/* Service list */}
      <div className="grid gap-3 md:grid-cols-2">
        {SERVICE_HEALTH.map((s) => (
          <GlassCard key={s.name} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cx('grid h-10 w-10 place-items-center rounded-xl2', s.status === 'operational' ? 'bg-success-500/15' : s.status === 'degraded' ? 'bg-warning-500/15' : 'bg-danger-500/15')}>
                  <Server className={cx('h-5 w-5', s.status === 'operational' ? 'text-success-500' : s.status === 'degraded' ? 'text-warning-500' : 'text-danger-500')} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-c">{s.name}</p>
                  <p className="text-[10px] text-muted-c">Last incident: {s.lastIncident}</p>
                </div>
              </div>
              <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold', s.status === 'operational' ? 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' : s.status === 'degraded' ? 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' : 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300')}>
                {s.status.toUpperCase()}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-ink-850/60">
                <p className="flex items-center gap-1 text-[10px] text-muted-c"><Activity className="h-3 w-3" /> Uptime</p>
                <p className="mt-0.5 text-sm font-bold text-primary-c">{s.uptime}%</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-ink-850/60">
                <p className="flex items-center gap-1 text-[10px] text-muted-c"><Zap className="h-3 w-3" /> Latency</p>
                <p className="mt-0.5 text-sm font-bold text-primary-c">{s.latency}ms</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Incident timeline */}
      <GlassCard className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-c"><Clock className="h-4 w-4 text-muted-c" /> Recent Incidents</h3>
        <div className="space-y-3">
          <IncidentRow title="File Storage degradation" desc="Increased latency on file upload service (280ms vs normal 50ms)" time="2 hr ago" status="investigating" />
          <IncidentRow title="WhatsApp Edge Function timeout" desc="Brief 3-minute timeout on WhatsApp message delivery" time="Jul 20, 2026" status="resolved" />
          <IncidentRow title="Database connection pool exhaustion" desc="Connection pool reached max during peak load" time="Jun 28, 2026" status="resolved" />
        </div>
      </GlassCard>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: typeof Server; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl2 border border-base-c bg-card-c p-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl2" style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-primary-c">{value}</p>
      <p className="text-[11px] text-muted-c">{label}</p>
    </div>
  );
}

function IncidentRow({ title, desc, time, status }: { title: string; desc: string; time: string; status: 'resolved' | 'investigating' }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-base-c p-3">
      <span className={cx('mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full', status === 'resolved' ? 'bg-success-500' : 'bg-warning-500')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-primary-c">{title}</p>
          <Badge variant={status === 'resolved' ? 'success' : 'warning'}>{status}</Badge>
        </div>
        <p className="mt-0.5 text-[11px] text-secondary-c">{desc}</p>
        <p className="mt-1 text-[10px] text-muted-c">{time}</p>
      </div>
    </div>
  );
}
