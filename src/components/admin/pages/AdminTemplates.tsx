import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  Plus, Home, Building2, Crown, KeyRound, Map, Palmtree, TrendingUp,
  Globe, Search, Copy, Trash2, Eye, RefreshCw, X, Loader2,
  Car, GraduationCap, Stethoscope, Sparkles, Palette, Laptop, Dumbbell,
  Leaf, BookOpen, ShieldCheck, Music, HeartPulse, Scissors, Plane,
  Sun, Camera, UserCheck, Bot, Briefcase
} from 'lucide-react';
import {
  fetchNicheTemplates, createNicheTemplate, updateNicheTemplate, deleteNicheTemplate,
  type ApiNicheTemplate
} from '@/lib/platformApi';

const TEMPLATE_ICONS: Record<string, typeof Home> = {
  home: Home, building: Building2, crown: Crown, key: KeyRound,
  map: Map, palmtree: Palmtree, trending: TrendingUp, globe: Globe,
  car: Car, graduationCap: GraduationCap, stethoscope: Stethoscope,
  sparkles: Sparkles, palette: Palette, laptop: Laptop, dumbbell: Dumbbell,
  leaf: Leaf, bookOpen: BookOpen, shieldCheck: ShieldCheck, music: Music,
  heartPulse: HeartPulse, scissors: Scissors, plane: Plane, sun: Sun,
  camera: Camera, userCheck: UserCheck, bot: Bot, briefcase: Briefcase,
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  published: { label: 'Published', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' },
  draft: { label: 'Draft', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-500 dark:bg-ink-800 dark:text-slate-400' },
};

function parseStages(stagesRaw: any): string[] {
  if (Array.isArray(stagesRaw)) return stagesRaw;
  if (typeof stagesRaw === 'string') {
    try { return JSON.parse(stagesRaw); } catch { return [stagesRaw]; }
  }
  return [];
}

export function AdminTemplates() {
  const [templates, setTemplates] = useState<ApiNicheTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [nicheFilter, setNicheFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  // New template modal state
  const [newName, setNewName] = useState('');
  const [newNiche, setNewNiche] = useState('Real Estate');
  const [newIcon, setNewIcon] = useState('home');
  const [newColor, setNewColor] = useState('#2563EB');
  const [newDesc, setNewDesc] = useState('');
  const [newStagesStr, setNewStagesStr] = useState('New Lead, Contacted, Qualified, Closed');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchNicheTemplates();
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setTemplates(res.data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const niches = Array.from(new Set(templates.map((t) => t.niche)));

  const filtered = templates.filter((t) => {
    const ms = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.niche.toLowerCase().includes(search.toLowerCase());
    const mn = nicheFilter === 'ALL' || t.niche === nicheFilter;
    return ms && mn;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const stagesArr = newStagesStr.split(',').map((s) => s.trim()).filter(Boolean);
    const res = await createNicheTemplate({
      name: newName,
      niche: newNiche,
      icon: newIcon,
      color: newColor,
      description: newDesc,
      stages: JSON.stringify(stagesArr),
      status: 'published',
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      setShowModal(false);
      setNewName('');
      setNewDesc('');
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    await deleteNicheTemplate(id);
    load();
  };

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Niche CRM Templates</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Pre-configured pipeline templates for different business niches.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors">
            <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 px-3 py-2 text-xs font-semibold text-white transition-transform hover:scale-105">
            <Plus className="h-3.5 w-3.5" /> New Template
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2">{error}</p>}

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
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-56 rounded-xl2 bg-slate-100 dark:bg-ink-800 animate-pulse" />)
        ) : (
          filtered.map((t) => {
            const TIcon = TEMPLATE_ICONS[t.icon] ?? Home;
            const sMeta = STATUS_META[t.status || 'published'] ?? STATUS_META['published'];
            const stages = parseStages(t.stages);
            return (
              <GlassCard key={t.id} hover className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl2" style={{ backgroundColor: `${t.color || '#2563EB'}15` }}>
                      <TIcon className="h-6 w-6" style={{ color: t.color || '#2563EB' }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-primary-c">{t.name}</h4>
                      <p className="text-[10px] text-muted-c">{t.id} · {t.niche}</p>
                    </div>
                  </div>
                  <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold', sMeta.color)}>{sMeta.label}</span>
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-secondary-c">{t.description || 'No description provided.'}</p>

                {/* Stages */}
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] font-semibold text-muted-c">Pipeline Stages ({stages.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {stages.map((s, i) => (
                      <span key={i} className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-secondary-c dark:bg-ink-850">
                        <span className="font-bold text-muted-c">{i + 1}</span> {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between border-t border-base-c pt-3">
                  <span className="text-[10px] text-muted-c"><span className="font-bold text-primary-c">{t.tenantsUsing ?? 0}</span> tenants using</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(t.id)} title="Delete" className="grid h-7 w-7 place-items-center rounded-lg text-muted-c transition-colors hover:text-danger-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="h-10 w-10 text-muted-c/30" />
          <p className="mt-3 text-sm text-muted-c">{error ? 'Could not load templates' : 'No templates found'}</p>
        </div>
      )}

      {/* Modal for creating a new template */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl2 border border-base-c bg-card-c p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-primary-c">Create Niche CRM Template</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-c hover:text-primary-c"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-secondary-c">Template Name</label>
                <input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Solar Installation CRM" className="form-input mt-1 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-secondary-c">Niche Category</label>
                  <input required value={newNiche} onChange={(e) => setNewNiche(e.target.value)} placeholder="Solar" className="form-input mt-1 text-xs" />
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary-c">Icon</label>
                  <select value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="form-input mt-1 text-xs">
                    <option value="home">Home</option>
                    <option value="building">Building</option>
                    <option value="crown">Crown</option>
                    <option value="key">Key</option>
                    <option value="map">Map</option>
                    <option value="palmtree">Palmtree</option>
                    <option value="trending">Trending</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-c">Description</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Short summary of this pipeline template…" className="form-input mt-1 text-xs h-20" />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-c">Pipeline Stages (comma-separated)</label>
                <input required value={newStagesStr} onChange={(e) => setNewStagesStr(e.target.value)} className="form-input mt-1 text-xs" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-base-c px-3 py-1.5 text-xs text-secondary-c">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 px-4 py-1.5 text-xs font-semibold text-white">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {saving ? 'Creating…' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
