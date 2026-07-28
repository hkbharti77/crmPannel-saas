import { useState, useEffect, useMemo } from 'react';
import { GlassCard } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { PLAN_META, type PlanTier } from '@/components/admin/adminData';
import { Search, CreditCard, DollarSign, Users, AlertCircle, RefreshCw, Plus, Edit2, Trash2, Check, X, Shield, Layers, Zap } from 'lucide-react';
import { fetchPlatformSubscriptions, updateTenantPlan, fetchPlatformPlans, createPlatformPlan, updatePlatformPlanDetails, deletePlatformPlan } from '@/lib/platformApi';

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
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Platform Plans State (Super Admin CRUD)
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
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
    hasCustomWidget: false,
    hasRagLlm: true,
    isContactUs: false,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchPlatformSubscriptions();
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setSubscriptions(res.data);
    }
    setLoading(false);
  };

  const loadPlans = async () => {
    setPlansLoading(true);
    const res = await fetchPlatformPlans();
    if (res.data) {
      setPlans(res.data);
    }
    setPlansLoading(false);
  };

  useEffect(() => {
    load();
    loadPlans();
  }, []);

  const filtered = useMemo(
    () => subscriptions.filter((s) => !search || (s.tenant || '').toLowerCase().includes(search.toLowerCase()) || (s.id || '').toLowerCase().includes(search.toLowerCase())),
    [subscriptions, search],
  );

  const handlePlanChange = async (tenantId: string, newPlan: string) => {
    setUpdatingId(tenantId);
    await updateTenantPlan(tenantId, newPlan);
    setUpdatingId(null);
    load();
  };

  const openCreateModal = () => {
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
      hasCustomWidget: false,
      hasRagLlm: true,
      isContactUs: false,
    });
    setEditingPlan(null);
    setIsCreating(true);
  };

  const openEditModal = (plan: any) => {
    setPlanForm({
      id: plan.id,
      name: plan.name,
      priceMonthlyInr: plan.priceMonthlyInr ?? plan.priceMonthly ?? 0,
      priceYearlyInr: plan.priceYearlyInr ?? plan.priceYearly ?? 0,
      priceMonthlyUsd: plan.priceMonthlyUsd ?? plan.priceMonthly ?? 0,
      priceYearlyUsd: plan.priceYearlyUsd ?? plan.priceYearly ?? 0,
      employeeLimit: plan.employeeLimit,
      primaryResourceLimit: plan.primaryResourceLimit,
      secondaryResourceLimit: plan.secondaryResourceLimit,
      ticketLimit: plan.ticketLimit,
      emailLimit: plan.emailLimit,
      hasWhatsapp: plan.hasWhatsapp,
      hasCustomWidget: plan.hasCustomWidget,
      hasRagLlm: plan.hasRagLlm,
      isContactUs: plan.isContactUs ?? plan.contactUs ?? (plan.id === 'ENTERPRISE'),
    });
    setEditingPlan(plan);
    setIsCreating(false);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isCreating) {
      const res = await createPlatformPlan(planForm);
      if (res.error) {
        setError(`Plan creation failed: ${res.error}`);
        return;
      }
    } else if (editingPlan) {
      const res = await updatePlatformPlanDetails(editingPlan.id, planForm);
      if (res.error) {
        setError(`Plan update failed: ${res.error}`);
        return;
      }
    }

    setIsCreating(false);
    setEditingPlan(null);
    loadPlans();
  };

  const handleDeletePlan = (planId: string) => {
    setDeletingPlanId(planId);
  };

  const confirmDeletePlan = async () => {
    if (!deletingPlanId) return;
    setError(null);
    const planIdToDelete = deletingPlanId;
    setDeletingPlanId(null);

    const res = await deletePlatformPlan(planIdToDelete);
    if (res.error) {
      setError(`Could not delete plan: ${res.error}`);
    } else {
      loadPlans();
    }
  };

  const totalMRR = subscriptions.reduce((sum, s) => sum + (s.mrr || 0), 0);
  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const trialingCount = subscriptions.filter((s) => s.status === 'trialing').length;
  const totalSeats = subscriptions.reduce((sum, s) => sum + (s.seats || 0), 0);
  const usedSeats = subscriptions.reduce((sum, s) => sum + (s.seatsUsed || 0), 0);

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">Subscription & Plan Management</h2>
          <p className="mt-0.5 text-sm text-secondary-c">Manage tenant subscriptions, MRR, and superadmin plan pricing CRUD.</p>
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
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SubKpi icon={DollarSign} label="Total Platform MRR" value={loading ? '—' : `₹${(totalMRR / 1000).toFixed(1)}K`} color="#10B981" />
            <SubKpi icon={CreditCard} label="Active Subscriptions" value={loading ? '—' : String(activeCount)} color="#2563EB" />
            <SubKpi icon={Users} label="Seats Used" value={loading ? '—' : `${usedSeats}/${totalSeats}`} color="#7C3AED" />
            <SubKpi icon={AlertCircle} label="Trialing Tenants" value={loading ? '—' : String(trialingCount)} color="#F59E0B" />
          </div>

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
              <p className="col-span-2 text-center py-10 text-sm text-muted-c">{error ? 'Could not load subscriptions' : 'No subscriptions found'}</p>
            ) : (
              filtered.map((s) => {
                const planKey = mapPlan(s.plan);
                const pMeta = PLAN_META[planKey] || { color: 'bg-primary-500/10 text-primary-500' };
                const isUpdating = updatingId === s.tenantId;
                return (
                  <GlassCard key={s.id} className="p-4">
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
                        <p className="text-[10px] text-muted-c">{s.id} · {s.paymentMethod}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={cx('h-2 w-2 rounded-full', s.status === 'active' ? 'bg-success-500' : 'bg-primary-500')} />
                        <span className="text-[10px] font-bold text-secondary-c">{(s.status || '').toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
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

          <div className="grid gap-4 md:grid-cols-3">
            {plansLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-xl2 bg-slate-100 dark:bg-ink-800 animate-pulse" />)
            ) : plans.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-xs text-muted-c">No subscription plans found in PostgreSQL database.</div>
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
          <div className="w-full max-w-xl rounded-xl2 border border-base-c bg-card-c p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-base-c pb-3">
              <h3 className="text-base font-bold text-primary-c">
                {isCreating ? 'Create New Subscription Plan' : `Edit Plan: ${editingPlan.id}`}
              </h3>
              <button onClick={() => { setIsCreating(false); setEditingPlan(null); }} className="rounded-lg p-1 text-muted-c hover:text-primary-c">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
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

function SubKpi({ icon: Icon, label, value, color }: { icon: typeof DollarSign; label: string; value: string; color: string }) {
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
