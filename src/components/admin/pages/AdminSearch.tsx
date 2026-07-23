import { useState, useMemo } from 'react';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { TENANTS, ADMIN_USERS, ADMIN_TICKETS, SUBSCRIPTIONS } from '@/components/admin/adminData';
import { Search, Building2, User, Ticket as TicketIcon, CreditCard, X } from 'lucide-react';

type SearchResult = { type: 'tenant' | 'user' | 'ticket' | 'subscription'; id: string; title: string; subtitle: string; meta: string };

export function AdminSearch() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | SearchResult['type']>('ALL');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const r: SearchResult[] = [];

    TENANTS.forEach((t) => {
      if (t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.domain.includes(q) || t.region.toLowerCase().includes(q) || t.niche.toLowerCase().includes(q))
        r.push({ type: 'tenant', id: t.id, title: t.name, subtitle: `${t.region} · ${t.niche}`, meta: t.domain });
    });
    ADMIN_USERS.forEach((u) => {
      if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.tenant.toLowerCase().includes(q))
        r.push({ type: 'user', id: u.id, title: u.name, subtitle: `${u.role} · ${u.tenant}`, meta: u.email });
    });
    ADMIN_TICKETS.forEach((t) => {
      if (t.subject.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.tenant.toLowerCase().includes(q))
        r.push({ type: 'ticket', id: t.id, title: t.subject, subtitle: `${t.tenant} · ${t.priority}`, meta: t.category });
    });
    SUBSCRIPTIONS.forEach((s) => {
      if (s.tenant.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
        r.push({ type: 'subscription', id: s.id, title: s.tenant, subtitle: `₹${s.mrr.toLocaleString()}/mo · ${s.seatsUsed}/${s.seats} seats`, meta: s.renewalDate });
    });

    return r;
  }, [query]);

  const filtered = activeTab === 'ALL' ? results : results.filter((r) => r.type === activeTab);

  const counts = {
    tenant: results.filter((r) => r.type === 'tenant').length,
    user: results.filter((r) => r.type === 'user').length,
    ticket: results.filter((r) => r.type === 'ticket').length,
    subscription: results.filter((r) => r.type === 'subscription').length,
  };

  const TYPE_META: Record<SearchResult['type'], { label: string; icon: typeof Building2; color: string }> = {
    tenant: { label: 'Tenants', icon: Building2, color: '#2563EB' },
    user: { label: 'Users', icon: User, color: '#7C3AED' },
    ticket: { label: 'Tickets', icon: TicketIcon, color: '#F59E0B' },
    subscription: { label: 'Subscriptions', icon: CreditCard, color: '#10B981' },
  };

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-primary-c">Global Search</h2>
        <p className="mt-0.5 text-sm text-secondary-c">Search across all tenants, users, tickets, and subscriptions.</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-c" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, tenant, ticket ID…"
          className="w-full rounded-xl2 border border-base-c bg-card-c py-3.5 pl-12 pr-10 text-sm text-primary-c placeholder:text-muted-c focus:border-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500/15"
        />
        {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted-c hover:text-primary-c"><X className="h-4 w-4" /></button>}
      </div>

      {/* Type filters */}
      {query && (
        <div className="flex flex-wrap gap-2">
          <TabButton label="All" count={results.length} active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')} />
          {(Object.keys(TYPE_META) as SearchResult['type'][]).map((t) => (
            <TabButton key={t} label={TYPE_META[t].label} count={counts[t]} active={activeTab === t} onClick={() => setActiveTab(t)} />
          ))}
        </div>
      )}

      {/* Results */}
      {query && (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <GlassCard className="flex flex-col items-center justify-center py-16">
              <Search className="h-10 w-10 text-muted-c/30" />
              <p className="mt-3 text-sm text-muted-c">No results for "{query}"</p>
            </GlassCard>
          ) : (
            filtered.map((r) => {
              const TMeta = TYPE_META[r.type];
              const TIcon = TMeta.icon;
              return (
                <GlassCard key={`${r.type}-${r.id}`} hover className="flex items-center gap-3 p-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl2" style={{ backgroundColor: `${TMeta.color}15` }}>
                    <TIcon className="h-5 w-5" style={{ color: TMeta.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-primary-c">{r.title}</p>
                      <Badge variant="neutral" className="shrink-0">{r.type}</Badge>
                    </div>
                    <p className="truncate text-[11px] text-secondary-c">{r.subtitle}</p>
                    <p className="truncate text-[10px] text-muted-c">{r.id} · {r.meta}</p>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      )}

      {!query && (
        <GlassCard className="flex flex-col items-center justify-center py-20">
          <Search className="h-12 w-12 text-muted-c/30" />
          <p className="mt-4 text-sm text-muted-c">Start typing to search across the entire platform</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['Metro', 'Arjun', 'TK-301', 'Luxe', 'growth'].map((s) => (
              <button key={s} onClick={() => setQuery(s)} className="rounded-full border border-base-c px-3 py-1.5 text-xs text-secondary-c transition-colors hover:border-primary-500/40 hover:text-primary-c">
                {s}
              </button>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function TabButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cx('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all', active ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-soft' : 'border border-base-c text-secondary-c hover:border-primary-500/30')}>
      {label}
      <span className={cx('grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold', active ? 'bg-white/20' : 'bg-slate-100 dark:bg-ink-800')}>{count}</span>
    </button>
  );
}
