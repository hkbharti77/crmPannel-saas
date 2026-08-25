import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchTenantEntitlementsMatrix,
  updateTenantEntitlementsMatrix,
  fetchEntitlementPresets,
  applyEntitlementPreset,
  fetchTenantProfile,
  type PlatformTenantEntitlementMatrix,
  type EntitlementPreset,
  type OverrideAction,
  type EntitlementDefinition,
  type TenantProfileSummary,
} from '@/lib/platformApi';
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Lock,
  Search,
  Check,
  Ban,
  RotateCcw,
  SlidersHorizontal,
  CheckCheck,
} from 'lucide-react';
import { cx } from '@/lib/types';
import { GlassCard } from '@/components/ui/primitives';

export function AdminTenantEntitlements() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  const [tenantProfile, setTenantProfile] = useState<TenantProfileSummary | null>(null);
  const [matrix, setMatrix] = useState<PlatformTenantEntitlementMatrix | null>(null);
  const [presets, setPresets] = useState<EntitlementPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Local draft state for mutations
  const [pageOverrides, setPageOverrides] = useState<Record<string, OverrideAction>>({});
  const [settingOverrides, setSettingOverrides] = useState<Record<string, OverrideAction>>({});
  const [serviceOverrides, setServiceOverrides] = useState<Record<string, OverrideAction>>({});
  const [reason, setReason] = useState('');

  // Filtering
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PAGE' | 'SETTING' | 'SERVICE'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  const loadData = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [matrixRes, presetsRes, profileRes] = await Promise.all([
        fetchTenantEntitlementsMatrix(tenantId),
        fetchEntitlementPresets(),
        fetchTenantProfile(tenantId),
      ]);

      if (matrixRes.error) {
        setError(matrixRes.error);
      } else if (matrixRes.data) {
        setMatrix(matrixRes.data);
        setPageOverrides(matrixRes.data.pageOverrides || {});
        setSettingOverrides(matrixRes.data.settingOverrides || {});
        setServiceOverrides(matrixRes.data.serviceOverrides || {});
      }

      if (presetsRes.data) {
        setPresets(presetsRes.data);
      }

      if (profileRes.data) {
        setTenantProfile(profileRes.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load tenant entitlements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const handleActionChange = (def: EntitlementDefinition, action: OverrideAction) => {
    if (def.mutability === 'ALWAYS_ENABLED') return;

    if (def.type === 'PAGE') {
      setPageOverrides((prev) => ({ ...prev, [def.key]: action }));
    } else if (def.type === 'SETTING') {
      setSettingOverrides((prev) => ({ ...prev, [def.key]: action }));
    } else if (def.type === 'SERVICE') {
      setServiceOverrides((prev) => ({ ...prev, [def.key]: action }));
    }
  };

  const getEffectiveState = (def: EntitlementDefinition): { action: OverrideAction; effective: boolean } => {
    let currentOverride: OverrideAction = 'INHERIT';
    if (def.type === 'PAGE') currentOverride = pageOverrides[def.key] || 'INHERIT';
    else if (def.type === 'SETTING') currentOverride = settingOverrides[def.key] || 'INHERIT';
    else if (def.type === 'SERVICE') currentOverride = serviceOverrides[def.key] || 'INHERIT';

    if (def.mutability === 'ALWAYS_ENABLED') {
      return { action: 'ALLOW', effective: true };
    }

    if (currentOverride === 'ALLOW') return { action: 'ALLOW', effective: true };
    if (currentOverride === 'DENY') return { action: 'DENY', effective: false };

    const planDefault = Boolean(
      def.defaultInPlans && (
        def.defaultInPlans.includes(matrix?.planId || '') ||
        def.defaultInPlans.includes(matrix?.planId?.toUpperCase() || '') ||
        (matrix?.planType && def.defaultInPlans.includes(matrix.planType))
      )
    );
    return { action: 'INHERIT', effective: planDefault };
  };

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await updateTenantEntitlementsMatrix(tenantId, {
        pageOverrides,
        settingOverrides,
        serviceOverrides,
        reason: reason || undefined,
      });

      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setMatrix(res.data);
        setPageOverrides(res.data.pageOverrides || {});
        setSettingOverrides(res.data.settingOverrides || {});
        setServiceOverrides(res.data.serviceOverrides || {});
        setSuccessMsg('Tenant entitlements updated and cached in Redis successfully.');
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save entitlements.');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = async () => {
    if (!selectedPresetId || !tenantId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await applyEntitlementPreset(tenantId, selectedPresetId);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setMatrix(res.data);
        setPageOverrides(res.data.pageOverrides || {});
        setSettingOverrides(res.data.settingOverrides || {});
        setServiceOverrides(res.data.serviceOverrides || {});
        setSuccessMsg(`Preset applied and synchronized successfully.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to apply preset.');
    } finally {
      setSaving(false);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    if (!matrix?.catalog) return [];
    const set = new Set<string>();
    matrix.catalog.forEach((item) => set.add(item.category));
    return Array.from(set).sort();
  }, [matrix]);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    if (!matrix?.catalog) return [];
    return matrix.catalog.filter((item) => {
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.displayName.toLowerCase().includes(q);
        const matchKey = item.key.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchReq = item.requiredServices?.some((s) => s.toLowerCase().includes(q));
        if (!matchName && !matchKey && !matchDesc && !matchReq) return false;
      }
      return true;
    });
  }, [matrix, typeFilter, categoryFilter, search]);

  // Calculated Stats
  const stats = useMemo(() => {
    let inherited = 0;
    let allowed = 0;
    let denied = 0;

    if (!matrix?.catalog) return { inherited: 0, allowed: 0, denied: 0 };

    matrix.catalog.forEach((def) => {
      let action: OverrideAction = 'INHERIT';
      if (def.type === 'PAGE') action = pageOverrides[def.key] || 'INHERIT';
      else if (def.type === 'SETTING') action = settingOverrides[def.key] || 'INHERIT';
      else if (def.type === 'SERVICE') action = serviceOverrides[def.key] || 'INHERIT';

      if (action === 'ALLOW') allowed++;
      else if (action === 'DENY') denied++;
      else inherited++;
    });

    return { inherited, allowed, denied };
  }, [matrix, pageOverrides, settingOverrides, serviceOverrides]);

  if (!tenantId) {
    return <div className="p-6 text-sm text-danger-500">Tenant ID missing</div>;
  }

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/tenants/${tenantId}`)}
            className="flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-3 py-1.5 text-xs font-semibold text-secondary-c hover:text-primary-c transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Tenant Overview</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted-c">
            <Link to="/admin/tenants" className="hover:underline">Tenants</Link>
            <span>/</span>
            <Link to={`/admin/tenants/${tenantId}`} className="hover:underline">
              {tenantProfile?.businessName || tenantId.slice(0, 8)}
            </Link>
            <span>/</span>
            <span className="font-semibold text-primary-c">Entitlements Control</span>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-1.5 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors"
        >
          <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-xl p-3">{error}</p>}
      {successMsg && (
        <p className="text-xs text-success-600 bg-success-50 dark:bg-success-500/10 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMsg}</span>
        </p>
      )}

      {/* Main Tenant Entitlements Banner */}
      <GlassCard className="p-6 border border-base-c">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 text-rose-600 dark:text-rose-400">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-primary-c">
                  {tenantProfile?.businessName || 'Tenant'} Entitlements
                </h1>
                <span className="rounded-full bg-blue-500/10 px-3 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                  Plan: {matrix?.planName || matrix?.planId || 'Scale'}
                </span>
                <span className="rounded-md border border-base-c px-2 py-0.5 text-[11px] font-mono text-muted-c">
                  v{matrix?.entitlementVersion || 1}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-c">
                Central Super Admin Page Routing, Settings Tabs, and Backend Services Permission Matrix
              </p>
            </div>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="form-select py-1.5 text-xs"
            >
              <option value="">-- Apply Server Preset --</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={handleApplyPreset}
              disabled={!selectedPresetId || saving}
              className="flex items-center gap-1.5 rounded-lg bg-primary-500/10 px-3 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Apply</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-base-c">
          <div className="flex items-center gap-2 rounded-xl border border-base-c bg-card-c px-4 py-2 text-xs">
            <RotateCcw className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-muted-c font-medium">Inherited from Plan:</span>
            <span className="font-bold text-primary-c">{stats.inherited}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">Allowed Overrides:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.allowed}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs">
            <Ban className="h-3.5 w-3.5 text-rose-500" />
            <span className="text-rose-700 dark:text-rose-300 font-medium">Denied Overrides:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{stats.denied}</span>
          </div>
        </div>
      </GlassCard>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-ink-850/50 p-4 rounded-xl border border-base-c">
        {/* Type Pills */}
        <div className="flex items-center gap-1.5">
          {(['ALL', 'PAGE', 'SETTING', 'SERVICE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cx(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                typeFilter === t
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-card-c text-secondary-c hover:text-primary-c border border-base-c'
              )}
            >
              {t === 'ALL' ? 'All Types' : t === 'PAGE' ? 'Pages' : t === 'SETTING' ? 'Settings Tabs' : 'Backend Services'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input
            type="text"
            placeholder="Search features, keys, dependencies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 text-xs"
          />
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={cx(
            'whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all',
            categoryFilter === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold'
              : 'bg-slate-100 dark:bg-ink-800 text-secondary-c hover:text-primary-c'
          )}
        >
          All Categories ({matrix?.catalog?.length || 0})
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={cx(
              'whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all',
              categoryFilter === c
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold'
                : 'bg-slate-100 dark:bg-ink-800 text-secondary-c hover:text-primary-c'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Entitlements Grid */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3 py-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-ink-800 animate-pulse" />
            ))}
          </div>
        ) : filteredCatalog.length > 0 ? (
          filteredCatalog.map((def) => {
            const { action, effective } = getEffectiveState(def);
            const isAlwaysEnabled = def.mutability === 'ALWAYS_ENABLED';

            return (
              <GlassCard
                key={def.key}
                className={cx(
                  'p-4 border transition-all',
                  effective
                    ? 'border-base-c bg-card-c'
                    : 'border-rose-500/20 bg-rose-500/5 opacity-80'
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <span className={cx(
                        'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase',
                        def.type === 'PAGE' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        def.type === 'SETTING' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      )}>
                        {def.type}
                      </span>
                      <h4 className="text-sm font-bold text-primary-c">{def.displayName}</h4>
                      <code className="text-[10px] text-muted-c font-mono">{def.key}</code>
                      {isAlwaysEnabled && (
                        <span className="flex items-center gap-1 rounded bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-secondary-c">
                          <Lock className="h-2.5 w-2.5" /> Core Safe
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-secondary-c">{def.description}</p>
                    {def.requiredServices && def.requiredServices.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-c">
                        <span className="font-semibold">Requires:</span>
                        {def.requiredServices.map((s) => (
                          <code key={s} className="rounded bg-slate-100 dark:bg-ink-800 px-1 py-0.5 font-mono text-primary-500">
                            {s}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tri-State Action Buttons */}
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-base-c bg-slate-100 dark:bg-ink-850 p-0.5">
                      <button
                        onClick={() => handleActionChange(def, 'INHERIT')}
                        disabled={isAlwaysEnabled}
                        className={cx(
                          'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                          action === 'INHERIT'
                            ? 'bg-card-c text-primary-c shadow-sm'
                            : 'text-muted-c hover:text-primary-c disabled:opacity-50'
                        )}
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Inherit</span>
                      </button>

                      <button
                        onClick={() => handleActionChange(def, 'ALLOW')}
                        disabled={isAlwaysEnabled}
                        className={cx(
                          'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                          action === 'ALLOW'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'text-muted-c hover:text-emerald-500 disabled:opacity-50'
                        )}
                      >
                        <Check className="h-3 w-3" />
                        <span>Allow</span>
                      </button>

                      <button
                        onClick={() => handleActionChange(def, 'DENY')}
                        disabled={isAlwaysEnabled}
                        className={cx(
                          'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                          action === 'DENY'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'text-muted-c hover:text-rose-500 disabled:opacity-50'
                        )}
                      >
                        <Ban className="h-3 w-3" />
                        <span>Deny</span>
                      </button>
                    </div>

                    <div className={cx(
                      'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                      effective
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    )}>
                      <span>{effective ? 'Active' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })
        ) : (
          <div className="py-12 text-center text-xs text-muted-c">
            No entitlements matching the search or category filter.
          </div>
        )}
      </div>

      {/* Sticky Save Bar */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/20 bg-surface-c/95 p-4 shadow-2xl backdrop-blur-xl dark:bg-ink-900/95">
        <div className="flex-1 min-w-[280px] max-w-lg">
          <input
            type="text"
            placeholder="Audit log reason (e.g. Enterprise add-on contract signed)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="form-input text-xs py-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/tenants/${tenantId}`)}
            className="rounded-xl border border-base-c px-4 py-2 text-xs font-semibold text-secondary-c hover:text-primary-c transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Entitlements Matrix'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
