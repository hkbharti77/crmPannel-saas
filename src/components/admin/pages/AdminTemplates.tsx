import { useState } from 'react';
import { GlassCard, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { NICHE_TEMPLATES, type NicheTemplate } from '@/components/admin/adminData';
import {
  Plus, Home, Building2, Crown, KeyRound, Map, Palmtree, TrendingUp,
  Globe, Search, Copy, Trash2, Eye, Check, X,
} from 'lucide-react';

const TEMPLATE_ICONS: Record<string, typeof Home> = {
  home: Home, building: Building2, crown: Crown, key: KeyRound,
  map: Map, palmtree: Palmtree, trending: TrendingUp, globe: Globe,
};

const STATUS_META: Record<NicheTemplate['status'], { label: string; color: string }> = {
  published: { label: 'Published', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' },
  draft: { label: 'Draft', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-500 dark:bg-ink-800 dark:text-slate-400' },
};

export function AdminTemplates() {
  const [search, setSearch] = useState('');
  const [nicheFilter, setNicheFilter] = useState('ALL');

  const niches = Array.from(new Set(NICHE_TEMPLATES.map((t) => t.niche)));

  const filtered = NICHE_TEMPLATES.filter((t) => {
    const ms = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.niche.toLowerCase().includes(search.toLowerCase());
    const mn = nicheFilter === 'ALL' || t.niche === nicheFilter;
    return ms && mn;
  });

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Niche Templates</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Pre-configured CRM templates for different real estate niches.</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
          <Plus className="h-3.5 w-3.5" /> New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…" className="form-input pl-9" />
        </div>
        <select value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)} className="rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none">
          <option value="ALL">All Niches</option>
          {niches.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => {
          const TIcon = TEMPLATE_ICONS[t.icon] ?? Home;
          const sMeta = STATUS_META[t.status];
          return (
            <GlassCard key={t.id} hover className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl2" style={{ backgroundColor: `${t.color}15` }}>
                    <TIcon className="h-6 w-6" style={{ color: t.color }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary-c">{t.name}</h4>
                    <p className="text-[10px] text-muted-c">{t.id} · {t.niche}</p>
                  </div>
                </div>
                <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold', sMeta.color)}>{sMeta.label}</span>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-secondary-c">{t.description}</p>

              {/* Stages */}
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-semibold text-muted-c">Pipeline Stages ({t.stages.length})</p>
                <div className="flex flex-wrap gap-1">
                  {t.stages.map((s, i) => (
                    <span key={s} className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-secondary-c dark:bg-ink-850">
                      <span className="font-bold text-muted-c">{i + 1}</span> {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-base-c pt-3">
                <span className="text-[10px] text-muted-c"><span className="font-bold text-primary-c">{t.tenantsUsing}</span> tenants using</span>
                <div className="flex gap-1">
                  <button title="Preview" className="grid h-7 w-7 place-items-center rounded-lg text-muted-c transition-colors hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"><Eye className="h-3.5 w-3.5" /></button>
                  <button title="Duplicate" className="grid h-7 w-7 place-items-center rounded-lg text-muted-c transition-colors hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"><Copy className="h-3.5 w-3.5" /></button>
                  <button title="Delete" className="grid h-7 w-7 place-items-center rounded-lg text-muted-c transition-colors hover:text-danger-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="h-10 w-10 text-muted-c/30" />
          <p className="mt-3 text-sm text-muted-c">No templates found</p>
        </div>
      )}
    </div>
  );
}
