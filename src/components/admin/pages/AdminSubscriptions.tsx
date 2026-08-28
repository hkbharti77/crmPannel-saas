import { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { PLAN_META, type PlanTier } from '@/components/admin/adminData';
import { Search, Users, RefreshCw, Plus, Edit2, Trash2, X, Shield, Layers, Zap, Sliders, History, Sparkles } from 'lucide-react';
import { fetchPlatformSubscriptions, updateTenantPlan, fetchPlatformPlans, createPlatformPlan, updatePlatformPlanDetails, deletePlatformPlan } from '@/lib/platformApi';
import { fetchEffectiveEntitlements, updateTenantOverrides, resetTenantOverrides, fetchOverrideAudits, EffectiveEntitlementsDto, TenantOverrideAudit } from '@/lib/billingApi';

interface PlatformSubscriptionItem {
  id?: string;
  tenantId: string;
  tenant: string;
  plan: string;
  mrr?: number;
  seats?: number;
  seatsUsed?: number;
  paymentMethod?: string;
  status?: string;
  renewalDate?: string;
}

interface PlatformPlanItem {
  id: string;
  name: string;
  priceMonthlyInr?: number;
  priceYearlyInr?: number;
  priceMonthlyUsd?: number;
  priceYearlyUsd?: number;
  priceMonthly?: number;
  priceYearly?: number;
  employeeLimit?: number;
  primaryResourceLimit?: number;
  secondaryResourceLimit?: number;
  ticketLimit?: number;
  emailLimit?: number;
  hasWhatsapp?: boolean;
  hasWhatsappCampaign?: boolean;
  whatsappCampaignLimit?: number;
  hasCustomWidget?: boolean;
  hasRagLlm?: boolean;
  isContactUs?: boolean;
  contactUs?: boolean;
}

function mapPlan(planStr?: string): PlanTier {
  const p = (planStr ?? 'FREE').toLowerCase();
  if (p === 'enterprise') return 'enterprise';
  if (p === 'scale' || p === 'pro') return 'scale';
  if (p === 'growth') return 'growth';
  return 'starter';
}

export function AdminSubscriptions() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'plans'>('tenants');
  
  // Tenant Subscriptions State
  const [subscriptions, setSubscriptions] = useState<PlatformSubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Tenant Custom Overrides Modal State
  const [overrideModalTenant, setOverrideModalTenant] = useState<PlatformSubscriptionItem | null>(null);
  const [effectiveEntitlements, setEffectiveEntitlements] = useState<EffectiveEntitlementsDto | null>(null);
  const [overrideAudits, setOverrideAudits] = useState<TenantOverrideAudit[]>([]);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideTab, setOverrideTab] = useState<'config' | 'audit'>('config');

  const [overrideForm, setOverrideForm] = useState({
    employeeLimit: 10,
    maxRecipientsPerWhatsappCampaign: 25000,
    monthlyWhatsappMessageQuota: 25000,
    maxAllowedPriority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    hasWhatsapp: true,
    hasWhatsappCampaign: true,
    hasCustomWidget: true,
    hasRagLlm: true,
    customMonthlyInr: 2499,
    reason: '',
  });

  // Platform Plans State (Super Admin CRUD)
  const [plans, setPlans] = useState<PlatformPlanItem[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlatformPlanItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  // Form State for Create / Edit Plan
  const [planForm, setPlanForm] = useState({
    id: '',
    name: '',
    priceMonthlyInr: 1499,
    priceYearlyInr: 14390,
    priceMonthlyUsd: 19.99,
    priceYearlyUsd: 189.90,
    employeeLimit: 5,
    primaryResourceLimit: 10000,
    secondaryResourceLimit: 5000,
    ticketLimit: 500,
    emailLimit: 10000,
    hasWhatsapp: true,
    hasWhatsappCampaign: true,
    whatsappCampaignLimit: 2500,
    hasCustomWidget: false,
    hasRagLlm: true,
    isContactUs: false,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchPlatformSubscriptions();
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setSubscriptions((res.data || []) as unknown as PlatformSubscriptionItem[]);
    }
  };

  const loadPlans = async () => {
    setPlansLoading(true);
    const res = await fetchPlatformPlans();
    if (res.data) {
      setPlans((res.data || []) as unknown as PlatformPlanItem[]);
    }
    setPlansLoading(false);
  };

  useEffect(() => {
    load();
    loadPlans();
  }, []);

  const openOverrideModal = async (tenant: PlatformSubscriptionItem) => {
    setOverrideModalTenant(tenant);
    setOverrideLoading(true);
    setOverrideTab('config');

    try {
      const res = await fetchEffectiveEntitlements(tenant.tenantId, true);
      if (res.data) {
        setEffectiveEntitlements(res.data);
        setOverrideForm({
          employeeLimit: res.data.limits?.employeeLimit || 10,
          maxRecipientsPerWhatsappCampaign: res.data.limits?.maxRecipientsPerWhatsappCampaign || 25000,
          monthlyWhatsappMessageQuota: res.data.limits?.monthlyWhatsappMessageQuota || 25000,
          maxAllowedPriority: res.data.maxAllowedPriority || 'MEDIUM',
          hasWhatsapp: res.data.features?.hasWhatsapp ?? true,
          hasWhatsappCampaign: res.data.features?.hasWhatsappCampaign ?? true,
          hasCustomWidget: res.data.features?.hasCustomWidget ?? false,
          hasRagLlm: res.data.features?.hasRagLlm ?? true,
          customMonthlyInr: res.data.pricing?.monthlyInr || 2499,
          reason: 'Custom enterprise tenant entitlement update',
        });
      }
      const auditsRes = await fetchOverrideAudits(tenant.tenantId);
      if (auditsRes.data) {
        setOverrideAudits(auditsRes.data);
      }
    } catch (e) {
      console.error('Error fetching entitlements', e);
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleSaveOverrides = async () => {
    if (!overrideModalTenant) return;
    setOverrideSaving(true);
    try {
      const res = await updateTenantOverrides(overrideModalTenant.tenantId, {
        employeeLimit: Number(overrideForm.employeeLimit),
        maxRecipientsPerWhatsappCampaign: Number(overrideForm.maxRecipientsPerWhatsappCampaign),
        monthlyWhatsappMessageQuota: Number(overrideForm.monthlyWhatsappMessageQuota),
        maxAllowedPriority: overrideForm.maxAllowedPriority,
        hasWhatsapp: Boolean(overrideForm.hasWhatsapp),
        hasWhatsappCampaign: Boolean(overrideForm.hasWhatsappCampaign),
        hasCustomWidget: Boolean(overrideForm.hasCustomWidget),
        hasRagLlm: Boolean(overrideForm.hasRagLlm),
        customMonthlyInr: Number(overrideForm.customMonthlyInr),
        reason: overrideForm.reason || 'Admin custom entitlement override update',
      });

      if (res.data) {
        setEffectiveEntitlements(res.data);
        const auditsRes = await fetchOverrideAudits(overrideModalTenant.tenantId);
        if (auditsRes.data) setOverrideAudits(auditsRes.data);
      }
    } catch (e) {
      console.error('Error saving overrides', e);
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleResetOverrides = async () => {
    if (!overrideModalTenant) return;
    if (!confirm(`Are you sure you want to reset custom overrides for ${overrideModalTenant.tenant}? This tenant will fall back entirely to base plan '${overrideModalTenant.plan}' rules.`)) return;

    setOverrideSaving(true);
    try {
      await resetTenantOverrides(overrideModalTenant.tenantId);
      const res = await fetchEffectiveEntitlements(overrideModalTenant.tenantId, true);
      if (res.data) {
        setEffectiveEntitlements(res.data);
        setOverrideForm({
          employeeLimit: res.data.limits?.employeeLimit || 10,
          maxRecipientsPerWhatsappCampaign: res.data.limits?.maxRecipientsPerWhatsappCampaign || 25000,
          monthlyWhatsappMessageQuota: res.data.limits?.monthlyWhatsappMessageQuota || 25000,
          maxAllowedPriority: res.data.maxAllowedPriority || 'MEDIUM',
          hasWhatsapp: res.data.features?.hasWhatsapp ?? true,
          hasWhatsappCampaign: res.data.features?.hasWhatsappCampaign ?? true,
          hasCustomWidget: res.data.features?.hasCustomWidget ?? false,
          hasRagLlm: res.data.features?.hasRagLlm ?? true,
          customMonthlyInr: res.data.pricing?.monthlyInr || 2499,
          reason: 'Reset to plan defaults',
        });
        const auditsRes = await fetchOverrideAudits(overrideModalTenant.tenantId);
        if (auditsRes.data) setOverrideAudits(auditsRes.data);
      }
    } catch (e) {
      console.error('Error resetting overrides', e);
    } finally {
      setOverrideSaving(false);
    }
  };

  const resetForm = () => {
    setPlanForm({
      id: '',
      name: '',
      priceMonthlyInr: 1499,
      priceYearlyInr: 14390,
      priceMonthlyUsd: 19.99,
      priceYearlyUsd: 189.90,
      employeeLimit: 5,
      primaryResourceLimit: 10000,
      secondaryResourceLimit: 5000,
      ticketLimit: 500,
      emailLimit: 10000,
      hasWhatsapp: true,
      hasWhatsappCampaign: true,
      whatsappCampaignLimit: 2500,
      hasCustomWidget: false,
      hasRagLlm: true,
      isContactUs: false,
    });
    setEditingPlan(null);
    setIsCreating(false);
  };

  const handlePlanChange = async (tenantId: string, newPlanId: string) => {
    setUpdatingId(tenantId);
    await updateTenantPlan(tenantId, newPlanId.toUpperCase());
    setUpdatingId(null);
    load();
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreating(true);
  };

  const openEditModal = (plan: PlatformPlanItem) => {
    setEditingPlan(plan);
    setPlanForm({
      id: plan.id,
      name: plan.name || '',
      priceMonthlyInr: plan.priceMonthlyInr ?? plan.priceMonthly ?? 1499,
      priceYearlyInr: plan.priceYearlyInr ?? plan.priceYearly ?? 14390,
      priceMonthlyUsd: plan.priceMonthlyUsd ?? 19.99,
      priceYearlyUsd: plan.priceYearlyUsd ?? 189.90,
      employeeLimit: plan.employeeLimit ?? 5,
      primaryResourceLimit: plan.primaryResourceLimit ?? 10000,
      secondaryResourceLimit: plan.secondaryResourceLimit ?? 5000,
      ticketLimit: plan.ticketLimit ?? 500,
      emailLimit: plan.emailLimit ?? 10000,
      hasWhatsapp: plan.hasWhatsapp ?? true,
      hasWhatsappCampaign: plan.hasWhatsappCampaign ?? true,
      whatsappCampaignLimit: plan.whatsappCampaignLimit ?? 2500,
      hasCustomWidget: plan.hasCustomWidget ?? false,
      hasRagLlm: plan.hasRagLlm ?? true,
      isContactUs: plan.isContactUs ?? plan.contactUs ?? (plan.id === 'ENTERPRISE'),
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlansLoading(true);
    let res;
    if (editingPlan) {
      res = await updatePlatformPlanDetails(editingPlan.id, planForm);
    } else {
      res = await createPlatformPlan(planForm);
    }
    setPlansLoading(false);
    if (!res.error) {
      resetForm();
      loadPlans();
    }
  };

  const handleDeletePlan = (planId: string) => {
    setDeletingPlanId(planId);
  };

  const confirmDeletePlan = async () => {
    if (!deletingPlanId) return;
    setPlansLoading(true);
    await deletePlatformPlan(deletingPlanId);
    setDeletingPlanId(null);
    setPlansLoading(false);
    loadPlans();
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return subscriptions;
    const q = search.toLowerCase();
    return subscriptions.filter((s) => ((s.tenant as string) || '').toLowerCase().includes(q) || ((s.id as string) || '').toLowerCase().includes(q));
  }, [subscriptions, search]);

  return (
    <div className="space-y-6 mx-auto max-w-7xl p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-c">Subscription & Entitlements Management</h2>
          <p className="text-xs text-muted-c">Manage tenant subscriptions, per-tenant custom overrides, multi-currency pricing, and plan capabilities.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tabs */}
          <div className="flex items-center rounded-xl border border-base-c bg-slate-100 dark:bg-ink-850 p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('tenants')}
              className={cx('rounded-lg px-3 py-1.5 transition-all', activeTab === 'tenants' ? 'bg-card-c text-primary-c shadow-sm' : 'text-muted-c')}
            >
              Tenant Subscriptions ({subscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={cx('rounded-lg px-3 py-1.5 transition-all', activeTab === 'plans' ? 'bg-card-c text-primary-c shadow-sm' : 'text-muted-c')}
            >
              Plan Definitions ({plans.length})
            </button>
          </div>

          <button onClick={() => { load(); loadPlans(); }} disabled={loading || plansLoading} className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors">
            <RefreshCw className={cx('h-3.5 w-3.5', (loading || plansLoading) && 'animate-spin')} /> Refresh
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2 border border-danger-500/20">{error}</p>}

      {/* TENANTS SUBSCRIPTIONS TAB */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subscriptions by tenant name or ID…" className="form-input pl-9" />
          </div>

          {/* Cards */}
          <div className="grid gap-3 md:grid-cols-2">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-xl2 bg-slate-100 dark:bg-ink-800 animate-pulse" />)
            ) : filtered.length === 0 ? (
              <p className="col-span-2 text-center py-10 text-sm text-muted-c">No subscriptions found</p>
            ) : (
              filtered.map((s) => {
                const planKey = mapPlan(s.plan);
                const pMeta = PLAN_META[planKey] || { color: 'bg-primary-500/10 text-primary-500' };
                const isUpdating = updatingId === s.tenantId;
                return (
                  <GlassCard key={s.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-primary-c">{s.tenant}</p>
                          <select
                            disabled={isUpdating}
                            value={s.plan}
                            onChange={(e) => handlePlanChange(s.tenantId, e.target.value)}
                            className={cx('rounded-full border-0 px-2.5 py-0.5 text-[10px] font-bold cursor-pointer focus:outline-none uppercase', pMeta.color)}
                          >
                            {plans.length > 0 ? (
                              plans.map((p) => (
                                <option key={p.id} value={p.id.toLowerCase()}>{p.name} ({p.id})</option>
                              ))
                            ) : (
                              <>
                                <option value="free">Free</option>
                                <option value="starter">Starter</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                              </>
                            )}
                          </select>
                        </div>
                        <p className="text-[10px] text-muted-c">{s.tenantId} · {s.paymentMethod}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openOverrideModal(s)}
                          className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all"
                        >
                          <Sliders className="h-3 w-3" /> Custom Overrides
                        </button>
                        <div className="flex items-center gap-1.5">
                          <span className={cx('h-2 w-2 rounded-full', s.status === 'active' ? 'bg-success-500' : 'bg-primary-500')} />
                          <span className="text-[10px] font-bold text-secondary-c">{(s.status || '').toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-slate-50 p-2 dark:bg-ink-850/60">
                        <p className="text-[9px] text-muted-c">MRR</p>
                        <p className="text-sm font-bold text-primary-c">₹{(s.mrr || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 dark:bg-ink-850/60">
                        <p className="text-[9px] text-muted-c">Seats</p>
                        <p className="text-sm font-bold text-primary-c">{s.seatsUsed}/{s.seats}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 dark:bg-ink-850/60">
                        <p className="text-[9px] text-muted-c">Renewal</p>
                        <p className="text-xs font-medium text-primary-c line-clamp-1">{s.renewalDate}</p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* OVERRIDE & ENTITLEMENTS MODAL */}
      {overrideModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-card-c border border-base-c p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-base-c pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-primary-c">Configure Tenant Overrides</h3>
                  {effectiveEntitlements?.isCustomized && (
                    <span className="rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 text-[10px] font-bold border border-indigo-500/30 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Custom Overrides Active (v{effectiveEntitlements.entitlementVersion})
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-c">Tenant: {overrideModalTenant.tenant} ({overrideModalTenant.tenantId}) · Base Plan: {effectiveEntitlements?.basePlanId}</p>
              </div>
              <button onClick={() => setOverrideModalTenant(null)} className="rounded-lg p-1.5 text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-base-c pb-2">
              <button
                onClick={() => setOverrideTab('config')}
                className={cx('rounded-lg px-3 py-1.5 text-xs font-bold transition-all', overrideTab === 'config' ? 'bg-primary-500 text-white' : 'text-muted-c hover:text-primary-c')}
              >
                Entitlement Limits & Features
              </button>
              <button
                onClick={() => setOverrideTab('audit')}
                className={cx('rounded-lg px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1', overrideTab === 'audit' ? 'bg-primary-500 text-white' : 'text-muted-c hover:text-primary-c')}
              >
                <History className="h-3.5 w-3.5" /> Audit History ({overrideAudits.length})
              </button>
            </div>

            {overrideLoading ? (
              <div className="py-12 text-center text-xs text-muted-c animate-pulse">Loading effective tenant entitlements…</div>
            ) : overrideTab === 'config' ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Feature Toggles */}
                <div className="rounded-xl border border-base-c p-4 space-y-3 bg-slate-50/50 dark:bg-ink-850/40">
                  <p className="text-xs font-bold text-primary-c flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-indigo-500" /> Feature Entitlement Toggles
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={overrideForm.hasWhatsapp} onChange={(e) => setOverrideForm({ ...overrideForm, hasWhatsapp: e.target.checked })} className="rounded text-primary-500 focus:ring-primary-500" />
                      <span>WhatsApp Business API</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={overrideForm.hasWhatsappCampaign} onChange={(e) => setOverrideForm({ ...overrideForm, hasWhatsappCampaign: e.target.checked })} className="rounded text-primary-500 focus:ring-primary-500" />
                      <span>WhatsApp Campaigns</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={overrideForm.hasRagLlm} onChange={(e) => setOverrideForm({ ...overrideForm, hasRagLlm: e.target.checked })} className="rounded text-primary-500 focus:ring-primary-500" />
                      <span>AI RAG LLM Bot</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={overrideForm.hasCustomWidget} onChange={(e) => setOverrideForm({ ...overrideForm, hasCustomWidget: e.target.checked })} className="rounded text-primary-500 focus:ring-primary-500" />
                      <span>Custom Widget Branding</span>
                    </label>
                  </div>
                </div>

                {/* Quota & Limit Overrides */}
                <div className="rounded-xl border border-base-c p-4 space-y-3 bg-slate-50/50 dark:bg-ink-850/40">
                  <p className="text-xs font-bold text-primary-c flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-emerald-500" /> Custom Resource & Campaign Quotas
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-c block mb-1">Employee Seats</label>
                      <input type="number" value={overrideForm.employeeLimit} onChange={(e) => setOverrideForm({ ...overrideForm, employeeLimit: Number(e.target.value) })} className="form-input text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-c block mb-1">Max Recipients / Campaign</label>
                      <input type="number" value={overrideForm.maxRecipientsPerWhatsappCampaign} onChange={(e) => setOverrideForm({ ...overrideForm, maxRecipientsPerWhatsappCampaign: Number(e.target.value) })} className="form-input text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-c block mb-1">Monthly Custom Price (INR)</label>
                      <input type="number" value={overrideForm.customMonthlyInr} onChange={(e) => setOverrideForm({ ...overrideForm, customMonthlyInr: Number(e.target.value) })} className="form-input text-xs" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-c block mb-1">Max Queue Priority Rank</label>
                      <select value={overrideForm.maxAllowedPriority} onChange={(e) => setOverrideForm({ ...overrideForm, maxAllowedPriority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })} className="form-input text-xs">
                        <option value="LOW">LOW Priority Only</option>
                        <option value="MEDIUM">LOW & MEDIUM Priority</option>
                        <option value="HIGH">LOW, MEDIUM & HIGH Priority</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reason string */}
                <div>
                  <label className="text-[11px] font-medium text-muted-c block mb-1">Audit Log Reason</label>
                  <input type="text" value={overrideForm.reason} onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })} placeholder="Enterprise contract modification reason…" className="form-input text-xs" />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleResetOverrides}
                    disabled={overrideSaving || !effectiveEntitlements?.isCustomized}
                    className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-xs font-bold text-danger-600 dark:text-danger-400 hover:bg-danger-500/20 disabled:opacity-40 transition-all"
                  >
                    Reset to Base Plan
                  </button>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setOverrideModalTenant(null)} className="rounded-xl border border-base-c px-3 py-2 text-xs font-bold text-muted-c hover:text-primary-c">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveOverrides}
                      disabled={overrideSaving}
                      className="rounded-xl bg-gradient-accent px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all"
                    >
                      {overrideSaving ? 'Saving…' : 'Save Custom Overrides'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {overrideAudits.length === 0 ? (
                  <p className="text-center py-8 text-xs text-muted-c">No override audit logs recorded for this tenant yet.</p>
                ) : (
                  overrideAudits.map((audit) => (
                    <div key={audit.id} className="rounded-xl border border-base-c p-3 space-y-1.5 text-xs bg-slate-50/50 dark:bg-ink-850/40">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary-500 uppercase text-[10px]">{audit.action}</span>
                        <span className="text-[10px] text-muted-c">{new Date(audit.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-secondary-c font-medium">{audit.reason}</p>
                      <p className="text-[10px] text-muted-c">Changed by: {audit.changedBy} {audit.ipAddress ? `(${audit.ipAddress})` : ''}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PLAN DEFINITIONS (SUPER ADMIN CRUD) TAB */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-secondary-c">Super Admin control: Create and edit dynamic subscription plans, multi-currency rates (INR/USD), and quota limits.</p>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-accent px-3 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all"
            >
              <Plus className="h-4 w-4" /> Create New Plan
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plansLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-xl2 bg-slate-100 dark:bg-ink-800 animate-pulse" />)
            ) : plans.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-c">No subscription plans found in PostgreSQL database.</div>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className="rounded-xl2 border border-base-c bg-card-c p-5 space-y-4 flex flex-col justify-between shadow-sm relative">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-primary-500 uppercase tracking-wider">{plan.id}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="rounded-lg p-1 text-muted-c hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-ink-850"
                          title="Edit Plan"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {plan.id !== 'FREE' && (
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="rounded-lg p-1 text-muted-c hover:text-danger-500 hover:bg-danger-500/10"
                            title="Delete Plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-primary-c">{plan.name}</h3>

                    {/* Dual Pricing Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-b border-base-c py-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">₹ INR RATE</span>
                        <p className="font-mono font-bold text-primary-c">₹{(plan.priceMonthlyInr ?? plan.priceMonthly ?? 0).toLocaleString()} /mo</p>
                        <p className="text-[10px] text-muted-c">₹{(plan.priceYearlyInr ?? plan.priceYearly ?? 0).toLocaleString()} /yr</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">$ USD RATE</span>
                        <p className="font-mono font-bold text-primary-c">${(plan.priceMonthlyUsd ?? plan.priceMonthly ?? 0)} /mo</p>
                        <p className="text-[10px] text-muted-c">${(plan.priceYearlyUsd ?? plan.priceYearly ?? 0)} /yr</p>
                      </div>
                    </div>

                    {/* Quota Limits List */}
                    <ul className="space-y-1.5 text-xs text-secondary-c pt-1">
                      <li className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                        <span><strong>{plan.employeeLimit}</strong> Staff Member Seats</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                        <span><strong>{(plan.primaryResourceLimit || 0).toLocaleString()}</strong> Primary Leads</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                        <span><strong>{(plan.emailLimit || 0).toLocaleString()}</strong> Emails / Mo</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span><strong>{plan.ticketLimit}</strong> Support Tickets</span>
                      </li>
                    </ul>
                  </div>

                    {/* Feature Badges */}
                    <div className="flex flex-wrap gap-1 pt-2">
                      {(plan.isContactUs || plan.id === 'ENTERPRISE') && <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[9px] font-bold">Contact Sales Quote</span>}
                      {plan.hasWhatsapp && <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-bold">WhatsApp API</span>}
                      {plan.hasCustomWidget && <span className="rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 px-2 py-0.5 text-[9px] font-bold">Calendar Sync</span>}
                      {plan.hasRagLlm && <span className="rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-[9px] font-bold">AI LLM RAG</span>}
                    </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT PLAN MODAL */}
      {(isCreating || editingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto scrollbar-thin rounded-xl2 border border-base-c bg-card-c p-4 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <h3 className="text-base font-bold text-primary-c">
                {isCreating ? 'Create New Subscription Plan' : editingPlan ? `Edit Plan: ${editingPlan.id}` : 'Edit Plan'}
              </h3>
              <button onClick={() => { setIsCreating(false); setEditingPlan(null); }} className="rounded-lg p-1 text-muted-c hover:text-primary-c">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-primary-c">Plan ID (Unique Key)</label>
                  <input
                    disabled={!isCreating}
                    value={planForm.id}
                    onChange={(e) => setPlanForm({ ...planForm, id: e.target.value.toUpperCase() })}
                    placeholder="e.g. GROWTH, AGENCY"
                    className="form-input mt-1 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-primary-c">Plan Display Name</label>
                  <input
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="e.g. Growth Pro Accelerator"
                    className="form-input mt-1"
                    required
                  />
                </div>
              </div>

              {/* Dual Pricing Inputs */}
              <div className="rounded-xl border border-base-c bg-slate-50 dark:bg-ink-850/60 p-3 space-y-2">
                <p className="font-bold text-primary-c text-[11px] uppercase tracking-wider">Dual Currency Pricing Configuration</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-c font-medium">Monthly Price (₹ INR)</label>
                    <input
                      type="number"
                      value={planForm.priceMonthlyInr}
                      onChange={(e) => setPlanForm({ ...planForm, priceMonthlyInr: Number(e.target.value) })}
                      className="form-input mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-muted-c font-medium">Yearly Price (₹ INR)</label>
                    <input
                      type="number"
                      value={planForm.priceYearlyInr}
                      onChange={(e) => setPlanForm({ ...planForm, priceYearlyInr: Number(e.target.value) })}
                      className="form-input mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-muted-c font-medium">Monthly Price ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={planForm.priceMonthlyUsd}
                      onChange={(e) => setPlanForm({ ...planForm, priceMonthlyUsd: Number(e.target.value) })}
                      className="form-input mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-muted-c font-medium">Yearly Price ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={planForm.priceYearlyUsd}
                      onChange={(e) => setPlanForm({ ...planForm, priceYearlyUsd: Number(e.target.value) })}
                      className="form-input mt-1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Feature Limits Inputs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-muted-c font-medium">Staff Seats</label>
                  <input
                    type="number"
                    value={planForm.employeeLimit}
                    onChange={(e) => setPlanForm({ ...planForm, employeeLimit: Number(e.target.value) })}
                    className="form-input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-muted-c font-medium">Primary Leads</label>
                  <input
                    type="number"
                    value={planForm.primaryResourceLimit}
                    onChange={(e) => setPlanForm({ ...planForm, primaryResourceLimit: Number(e.target.value) })}
                    className="form-input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-muted-c font-medium">Monthly Emails</label>
                  <input
                    type="number"
                    value={planForm.emailLimit}
                    onChange={(e) => setPlanForm({ ...planForm, emailLimit: Number(e.target.value) })}
                    className="form-input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-muted-c font-medium">Ticket Limit</label>
                  <input
                    type="number"
                    value={planForm.ticketLimit}
                    onChange={(e) => setPlanForm({ ...planForm, ticketLimit: Number(e.target.value) })}
                    className="form-input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-muted-c font-medium">WhatsApp Campaign Limit</label>
                  <input
                    type="number"
                    value={planForm.whatsappCampaignLimit}
                    onChange={(e) => setPlanForm({ ...planForm, whatsappCampaignLimit: Number(e.target.value) })}
                    className="form-input mt-1"
                    required
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.hasWhatsapp}
                    onChange={(e) => setPlanForm({ ...planForm, hasWhatsapp: e.target.checked })}
                    className="rounded border-base-c"
                  />
                  <span>WhatsApp Business API</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.hasWhatsappCampaign}
                    onChange={(e) => setPlanForm({ ...planForm, hasWhatsappCampaign: e.target.checked })}
                    className="rounded border-base-c"
                  />
                  <span>WhatsApp Campaigns</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.hasCustomWidget}
                    onChange={(e) => setPlanForm({ ...planForm, hasCustomWidget: e.target.checked })}
                    className="rounded border-base-c"
                  />
                  <span>Google Calendar Sync</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.hasRagLlm}
                    onChange={(e) => setPlanForm({ ...planForm, hasRagLlm: e.target.checked })}
                    className="rounded border-base-c"
                  />
                  <span>AI LLM RAG Bot</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-600 dark:text-amber-400">
                  <input
                    type="checkbox"
                    checked={planForm.isContactUs}
                    onChange={(e) => setPlanForm({ ...planForm, isContactUs: e.target.checked })}
                    className="rounded border-base-c"
                  />
                  <span>Contact Us Custom Quote (Enterprise)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-base-c">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditingPlan(null); }}
                  className="rounded-xl border border-base-c px-4 py-2 text-xs font-bold text-muted-c hover:text-primary-c"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-accent px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all"
                >
                  {isCreating ? 'Create Plan' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deletingPlanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-base-c bg-card-c p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-danger-500/15 text-danger-500">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary-c">Delete Subscription Plan</h3>
                <p className="text-xs text-muted-c">Confirm removal of '{deletingPlanId}'</p>
              </div>
            </div>

            <p className="text-xs text-secondary-c leading-relaxed">
              Are you sure you want to permanently delete subscription plan <strong>'{deletingPlanId}'</strong> from the database? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-base-c">
              <button
                type="button"
                onClick={() => setDeletingPlanId(null)}
                className="rounded-xl border border-base-c px-4 py-2 text-xs font-bold text-muted-c hover:text-primary-c hover:bg-slate-100 dark:hover:bg-ink-850 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePlan}
                className="rounded-xl bg-danger-500 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-danger-600 transition-all"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
