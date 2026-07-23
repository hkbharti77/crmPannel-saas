import { useState, useMemo } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { AUDIT_ENTRIES, type AuditEntry } from '@/components/admin/adminData';
import { Search, Shield, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export function AdminAudit() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AuditEntry['severity']>('ALL');

  const filtered = useMemo(
    () =>
      AUDIT_ENTRIES.filter((e) => {
        const ms = !search || e.actor.toLowerCase().includes(search.toLowerCase()) || e.action.toLowerCase().includes(search.toLowerCase()) || e.target.toLowerCase().includes(search.toLowerCase());
        const msev = severityFilter === 'ALL' || e.severity === severityFilter;
        return ms && msev;
      }),
    [search, severityFilter],
  );

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-primary-c">Audit Log</h2>
        <p className="mt-0.5 text-sm text-secondary-c">All platform-level actions taken by admins and the system.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search audit log…" className="form-input pl-9" />
        </div>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)} className="rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none">
          <option value="ALL">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Log entries */}
      <div className="space-y-2">
        {filtered.map((e) => {
          const SevIcon = e.severity === 'critical' ? AlertCircle : e.severity === 'warning' ? AlertTriangle : Info;
          const sevColor = e.severity === 'critical' ? '#F43F5E' : e.severity === 'warning' ? '#F59E0B' : '#2563EB';
          return (
            <div key={e.id} className="flex items-start gap-3 rounded-xl2 border border-base-c bg-card-c p-3.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${sevColor}15` }}>
                <SevIcon className="h-4 w-4" style={{ color: sevColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-muted-c">{e.id}</span>
                  <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', e.severity === 'critical' ? 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300' : e.severity === 'warning' ? 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' : 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300')}>
                    {e.severity}
                  </span>
                </div>
                <p className="mt-1 text-sm text-primary-c">
                  <span className="font-semibold">{e.actor}</span> {e.action.toLowerCase()} <span className="font-medium text-secondary-c">{e.target}</span>
                </p>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-c">
                  <span>{e.timestamp}</span>
                  <span>IP: {e.ip}</span>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Shield className="h-10 w-10 text-muted-c/30" />
            <p className="mt-3 text-sm text-muted-c">No audit entries found</p>
          </div>
        )}
      </div>
    </div>
  );
}
