import { useState, useEffect, useMemo } from 'react';
import { cx } from '@/lib/types';
import { Search, Shield, AlertCircle, Info, AlertTriangle, RefreshCw, LogIn, MessageSquare, ToggleLeft, CreditCard, Activity } from 'lucide-react';
import { fetchAuditLog, type ApiAuditEntry } from '@/lib/platformApi';

type CategoryTab = 'ALL' | 'LOGINS' | 'META' | 'TOGGLES' | 'SUBSCRIPTIONS';

function deriveSeverity(entry: ApiAuditEntry): 'info' | 'warning' | 'critical' {
  const action = (entry.action ?? '').toLowerCase();
  if (action.includes('suspend') || action.includes('delete') || action.includes('lock') || action.includes('block') || action.includes('failed')) return 'critical';
  if (action.includes('reset') || action.includes('update') || action.includes('change') || action.includes('toggle')) return 'warning';
  return 'info';
}

function deriveCategory(entry: ApiAuditEntry): CategoryTab {
  const action = (entry.action ?? '').toUpperCase();
  const target = (entry.targetType ?? '').toUpperCase();

  if (action.includes('LOGIN') || action.includes('LOGOUT') || target === 'USER') return 'LOGINS';
  if (action.includes('META') || action.includes('WHATSAPP') || target === 'METAWHATSAPP') return 'META';
  if (action.includes('TOGGLE') || action.includes('FEATURE') || target === 'FEATURETOGGLE') return 'TOGGLES';
  if (action.includes('SUBSCRIPTION') || action.includes('PLAN') || action.includes('PAYMENT') || target === 'SUBSCRIPTION') return 'SUBSCRIPTIONS';
  return 'ALL';
}

export function AdminAudit() {
  const [entries, setEntries] = useState<ApiAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryTab>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'info' | 'warning' | 'critical'>('ALL');

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchAuditLog({ size: 100 });
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      const list: ApiAuditEntry[] = Array.isArray(res.data) ? res.data : (res.data as { content?: ApiAuditEntry[] }).content ?? [];
      setEntries(list);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    entries.filter((e) => {
      const actor = e.performedByEmail ?? e.targetId ?? '';
      const actionStr = e.action ?? '';
      const detailStr = e.detail ?? '';
      const ms = !search
        || actor.toLowerCase().includes(search.toLowerCase())
        || actionStr.toLowerCase().includes(search.toLowerCase())
        || detailStr.toLowerCase().includes(search.toLowerCase());

      const sev = deriveSeverity(e);
      const msev = severityFilter === 'ALL' || sev === severityFilter;

      const cat = deriveCategory(e);
      const mcat = activeTab === 'ALL' || cat === activeTab;

      return ms && msev && mcat;
    }),
    [entries, search, severityFilter, activeTab],
  );

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Super Admin Audit Log</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Comprehensive audit trail of tenant logins, Meta WhatsApp connections, feature toggles, and subscriptions.</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors">
          <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2">{error}</p>}

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-base-c pb-2">
        {[
          { id: 'ALL', label: 'All Events', icon: Activity },
          { id: 'LOGINS', label: 'Tenant Logins', icon: LogIn },
          { id: 'META', label: 'Meta WhatsApp', icon: MessageSquare },
          { id: 'TOGGLES', label: 'Feature Toggles', icon: ToggleLeft },
          { id: 'SUBSCRIPTIONS', label: 'Subscriptions & Payments', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CategoryTab)}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-card-c border border-base-c text-secondary-c hover:text-primary-c'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search audit logs by tenant, action, or detail..." className="form-input pl-9 text-xs" />
        </div>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)} className="rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none">
          <option value="ALL">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Audit Feed */}
      <div className="space-y-2">
        {loading
          ? [...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl2 bg-slate-100 dark:bg-ink-800 animate-pulse" />)
          : filtered.map((e) => {
            const sev = deriveSeverity(e);
            const SevIcon = sev === 'critical' ? AlertCircle : sev === 'warning' ? AlertTriangle : Info;
            const sevColor = sev === 'critical' ? '#F43F5E' : sev === 'warning' ? '#F59E0B' : '#2563EB';
            const outcome = e.outcome ?? 'SUCCESS';
            const isFailed = outcome.toUpperCase() === 'FAILED';

            return (
              <div key={e.id} className="flex items-start gap-3 rounded-xl2 border border-base-c bg-card-c p-3.5 shadow-sm">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${sevColor}15` }}>
                  <SevIcon className="h-4 w-4" style={{ color: sevColor }} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary-c">{e.action}</span>
                      <span className={cx('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase',
                        isFailed ? 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300' : 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300'
                      )}>
                        {outcome}
                      </span>
                      {e.targetType && (
                        <span className="rounded bg-slate-100 dark:bg-ink-800 px-1.5 py-0.5 text-[9px] font-medium text-secondary-c">
                          {e.targetType}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-c">
                      {e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}
                    </span>
                  </div>

                  <p className="text-xs text-secondary-c font-mono bg-slate-50 dark:bg-ink-850 p-2 rounded border border-base-c break-all">
                    {e.detail || `Target: ${e.targetId || 'N/A'}`}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-muted-c pt-1">
                    <span>Target ID: <strong className="text-primary-c">{e.targetId || 'N/A'}</strong></span>
                    {e.ipAddress && <span>IP: <strong className="text-primary-c">{e.ipAddress}</strong></span>}
                  </div>
                </div>
              </div>
            );
          })}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Shield className="h-10 w-10 text-muted-c/30" />
            <p className="mt-3 text-sm text-muted-c">{error ? 'Could not load audit log' : 'No audit entries matching category filters'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
