import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { Search, Building2, User, Ticket as TicketIcon, CreditCard, X, Loader2 } from 'lucide-react';
import { platformSearch, type ApiSearchResult } from '@/lib/platformApi';

export function AdminSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | string>('ALL');

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      const res = await platformSearch(query);
      if (res.error) {
        setError(res.error);
        setResults([]);
      } else {
        setResults(res.data ?? []);
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = activeTab === 'ALL' ? results : results.filter((r) => r.type === activeTab);
  const types = [...new Set(results.map((r) => r.type))];

  const ICONS: Record<string, typeof Building2> = {
    tenant: Building2,
    user: User,
    ticket: TicketIcon,
    subscription: CreditCard,
  };

  const COLORS: Record<string, string> = {
    tenant: '#2563EB',
    user: '#7C3AED',
    ticket: '#F59E0B',
    subscription: '#10B981',
  };

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-primary-c">Global Search</h2>
        <p className="mt-0.5 text-sm text-secondary-c">Search tenants, users, tickets, and subscriptions.</p>
      </div>

      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-c" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anything…"
          className="form-input pl-11 pr-10 py-3 text-sm"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-c" />}
        {!loading && query && (
          <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full text-muted-c hover:text-primary-c">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2">{error}</p>}

      {/* Type tabs */}
      {results.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', ...types] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={cx('rounded-full px-3 py-1 text-xs font-medium transition-colors', activeTab === t ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white' : 'border border-base-c text-secondary-c hover:text-primary-c')}>
              {t} {t === 'ALL' ? `(${results.length})` : `(${results.filter(r => r.type === t).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {!query.trim() ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="h-12 w-12 text-muted-c/20" />
          <p className="mt-3 text-sm text-muted-c">Start typing to search the platform</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['tenant', 'user', 'support'].map((s) => (
              <button key={s} onClick={() => setQuery(s)} className="rounded-full border border-base-c px-3 py-1.5 text-xs text-secondary-c hover:border-primary-500/40 hover:text-primary-c transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl2 bg-slate-100 dark:bg-ink-800 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Search className="h-10 w-10 text-muted-c/30" />
          <p className="mt-3 text-sm text-muted-c">No results for "{query}"</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const Icon = ICONS[r.type] ?? Building2;
            const color = COLORS[r.type] ?? '#2563EB';
            return (
              <GlassCard key={`${r.type}-${r.id}`} className="flex items-center gap-3 p-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl2" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-primary-c">{r.name}</p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-secondary-c dark:bg-ink-800">{r.type}</span>
                  </div>
                  <p className="truncate text-[11px] text-muted-c">
                    {r.email ?? r.tenantName ?? r.highlight ?? r.id.slice(0, 20)}
                  </p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
