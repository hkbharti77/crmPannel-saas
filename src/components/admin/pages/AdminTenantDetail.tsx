import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GlassCard, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  ArrowLeft, Building2, Users, Mail, Calendar, Shield, Activity, BarChart3,
  CheckCircle2, SlidersHorizontal, RefreshCw,
  Search, MessageSquare, Clock, ArrowUpRight, TrendingUp, Ban
} from 'lucide-react';
import {
  fetchTenantProfile,
  fetchTenantAnalytics,
  fetchTenantMembers,
  suspendTenant,
  activateTenant,
  lockTenant,
  type TenantProfileSummary,
  type TenantMultiChannelAnalytics,
  type TenantMemberRoster,
} from '@/lib/platformApi';
import { PLAN_META, STATUS_META } from '@/components/admin/adminData';

type Tab = 'overview' | 'roster' | 'analytics';

export function AdminTenantDetail() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Overview State
  const [profile, setProfile] = useState<TenantProfileSummary | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Analytics State
  const [analytics, setAnalytics] = useState<TenantMultiChannelAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState('CURRENT_MONTH');

  // Roster State
  const [roster, setRoster] = useState<TenantMemberRoster | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterRole, setRosterRole] = useState('ALL');
  const [rosterSearch, setRosterSearch] = useState('');
  const [_rosterPage, _setRosterPage] = useState(0);

  const [actionLoading, setActionLoading] = useState(false);

  const loadOverview = async () => {
    if (!tenantId) return;
    setProfileLoading(true);
    setError(null);
    const res = await fetchTenantProfile(tenantId);
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setProfile(res.data);
    }
    setProfileLoading(false);
  };

  const loadAnalytics = async (range: string) => {
    if (!tenantId) return;
    setAnalyticsLoading(true);
    const res = await fetchTenantAnalytics(tenantId, range);
    if (res.data) setAnalytics(res.data);
    setAnalyticsLoading(false);
  };

  const loadRoster = async (page = 0, role = rosterRole, search = rosterSearch) => {
    if (!tenantId) return;
    setRosterLoading(true);
    const res = await fetchTenantMembers(tenantId, { page, size: 12, role: role !== 'ALL' ? role : undefined, search });
    if (res.data) setRoster(res.data);
    setRosterLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, [tenantId]);

  useEffect(() => {
    if (activeTab === 'analytics' && !analytics) {
      loadAnalytics(analyticsRange);
    } else if (activeTab === 'roster' && !roster) {
      loadRoster(0);
    }
  }, [activeTab]);

  const handleAction = async (action: 'suspend' | 'activate' | 'lock') => {
    if (!tenantId) return;
    setActionLoading(true);
    if (action === 'suspend') await suspendTenant(tenantId);
    else if (action === 'activate') await activateTenant(tenantId);
    else await lockTenant(tenantId);
    await loadOverview();
    setActionLoading(false);
  };

  if (!tenantId) {
    return <div className="p-6 text-sm text-danger-500">Tenant ID missing</div>;
  }

  const plan = (profile?.planType || 'STARTER').toLowerCase();
  const pMeta = PLAN_META[plan] ?? PLAN_META['starter'];
  const sMeta = STATUS_META[profile?.lifecycleStatus?.toLowerCase() || 'active'] ?? STATUS_META['active'];

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/tenants')}
            className="flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-3 py-1.5 text-xs font-semibold text-secondary-c hover:text-primary-c transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Tenants</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted-c">
            <Link to="/admin/tenants" className="hover:underline">Tenants</Link>
            <span>/</span>
            <span className="font-semibold text-primary-c">{profile?.businessName || tenantId.slice(0, 8)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/admin/tenants/${tenantId}/entitlements`}
            className="flex items-center gap-1.5 rounded-lg border border-primary-500/30 bg-primary-500/10 px-3.5 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-all shadow-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Manage Entitlements</span>
          </Link>

          {profile?.lifecycleStatus === 'ACTIVE' ? (
            <button
              onClick={() => handleAction('suspend')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-lg border border-warning-500/30 bg-warning-500/10 px-3 py-2 text-xs font-semibold text-warning-600 dark:text-warning-400 hover:bg-warning-500/20 transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Suspend</span>
            </button>
          ) : (
            <button
              onClick={() => handleAction('activate')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-lg border border-success-500/30 bg-success-500/10 px-3 py-2 text-xs font-semibold text-success-600 dark:text-success-400 hover:bg-success-500/20 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Activate</span>
            </button>
          )}

          <button
            onClick={loadOverview}
            disabled={profileLoading}
            className="grid h-8 w-8 place-items-center rounded-lg border border-base-c text-secondary-c hover:text-primary-c transition-colors"
          >
            <RefreshCw className={cx('h-3.5 w-3.5', profileLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2">{error}</p>}

      {/* Main Tenant Banner */}
      <GlassCard className="p-6 border border-base-c">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={profile?.businessName || 'Tenant'} size={56} />
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-primary-c">{profile?.businessName || 'Loading…'}</h1>
                <span className={cx('rounded-full px-3 py-0.5 text-xs font-bold uppercase', pMeta.color)}>
                  {profile?.planName || pMeta.label}
                </span>
                <span className={cx('flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', sMeta.bg, sMeta.color)}>
                  <span className={cx('h-2 w-2 rounded-full', sMeta.dot)} />
                  {profile?.lifecycleStatus || 'ACTIVE'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-c">
                Tenant ID: <span className="font-mono">{tenantId}</span> · Category: {profile?.businessType || 'General CRM'} · Timezone: {profile?.timezone || 'Asia/Kolkata'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-muted-c">Created Date</p>
              <p className="text-xs font-semibold text-primary-c">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tab Navigation */}
      <div className="flex border-b border-base-c bg-slate-100/30 dark:bg-ink-850/30 rounded-t-xl px-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={cx(
            'flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-semibold transition-colors',
            activeTab === 'overview'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-secondary-c hover:text-primary-c'
          )}
        >
          <Building2 className="h-4 w-4" />
          <span>Overview & Quotas</span>
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={cx(
            'flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-semibold transition-colors',
            activeTab === 'roster'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-secondary-c hover:text-primary-c'
          )}
        >
          <Users className="h-4 w-4" />
          <span>Team Roster ({profile?.totalUsers ?? '…'})</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={cx(
            'flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-semibold transition-colors',
            activeTab === 'analytics'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-secondary-c hover:text-primary-c'
          )}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Multi-Channel Usage Analytics</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {profileLoading ? (
              <div className="space-y-4 py-8">
                <div className="h-28 rounded-xl bg-slate-100 dark:bg-ink-800 animate-pulse" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-36 rounded-xl bg-slate-100 dark:bg-ink-800 animate-pulse" />
                  <div className="h-36 rounded-xl bg-slate-100 dark:bg-ink-800 animate-pulse" />
                  <div className="h-36 rounded-xl bg-slate-100 dark:bg-ink-800 animate-pulse" />
                </div>
              </div>
            ) : profile ? (
              <>
                {/* Metric Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <GlassCard className="p-5 border border-base-c bg-card-c">
                    <div className="flex items-center justify-between text-muted-c">
                      <span className="text-[11px] font-semibold uppercase">Total Leads</span>
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-primary-c">{profile.totalLeads}</p>
                    <p className="text-[11px] text-muted-c">Leads in CRM Database</p>
                  </GlassCard>

                  <GlassCard className="p-5 border border-base-c bg-card-c">
                    <div className="flex items-center justify-between text-muted-c">
                      <span className="text-[11px] font-semibold uppercase">Team Roster</span>
                      <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-primary-c">{profile.totalUsers}</p>
                    <p className="text-[11px] text-success-500 font-semibold">{profile.activeUsers} active accounts</p>
                  </GlassCard>

                  <GlassCard className="p-5 border border-base-c bg-card-c">
                    <div className="flex items-center justify-between text-muted-c">
                      <span className="text-[11px] font-semibold uppercase">Support Tickets</span>
                      <Shield className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-primary-c">{profile.totalTickets}</p>
                    <p className="text-[11px] text-muted-c">Tickets submitted</p>
                  </GlassCard>

                  <GlassCard className="p-5 border border-base-c bg-card-c">
                    <div className="flex items-center justify-between text-muted-c">
                      <span className="text-[11px] font-semibold uppercase">Appointments</span>
                      <Calendar className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="mt-2 text-3xl font-bold text-primary-c">{profile.totalAppointments}</p>
                    <p className="text-[11px] text-muted-c">Total bookings scheduled</p>
                  </GlassCard>
                </div>

                {/* Organization & Subscription Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassCard className="p-6 border border-base-c bg-card-c space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-c flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary-500" /> Organization Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-c text-[11px]">Business Category</p>
                        <p className="font-semibold text-primary-c text-sm">{profile.businessType || 'General CRM'}</p>
                      </div>
                      <div>
                        <p className="text-muted-c text-[11px]">Sub Category</p>
                        <p className="font-semibold text-primary-c text-sm">{profile.businessSubType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-c text-[11px]">Country & Currency</p>
                        <p className="font-semibold text-primary-c text-sm">{profile.country} ({profile.currency})</p>
                      </div>
                      <div>
                        <p className="text-muted-c text-[11px]">Onboarding Completed</p>
                        <p className="font-semibold text-success-500 text-sm">{profile.onboardingCompleted ? 'Yes (Completed)' : 'Pending'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-c text-[11px]">Physical Address</p>
                        <p className="font-medium text-secondary-c text-xs">{profile.address || 'No physical address configured'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-c text-[11px]">About Business</p>
                        <p className="font-medium text-secondary-c text-xs">{profile.aboutUs || 'No description provided'}</p>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6 border border-base-c bg-card-c space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-c flex items-center gap-2">
                      <Activity className="h-4 w-4 text-success-500" /> Subscription & Billing
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-c text-[11px]">Current Plan</p>
                        <p className="font-bold text-primary-500 text-base">{profile.planName}</p>
                      </div>
                      <div>
                        <p className="text-muted-c text-[11px]">Billing Cycle</p>
                        <p className="font-semibold text-primary-c text-sm">{profile.billingCycle}</p>
                      </div>
                      <div>
                        <p className="text-muted-c text-[11px]">Active Period</p>
                        <p className="font-medium text-secondary-c text-xs">
                          {profile.currentPeriodStart ? new Date(profile.currentPeriodStart).toLocaleDateString() : '—'} →{' '}
                          {profile.currentPeriodEnd ? new Date(profile.currentPeriodEnd).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-c text-[11px]">Monthly Amount</p>
                        <p className="font-bold text-primary-c text-sm">{profile.currency} {profile.monthlyAmount?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* TAB 2: TEAM ROSTER */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            {/* Header & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-ink-850/50 p-4 rounded-xl border border-base-c">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400">
                  {roster?.summary?.ownersCount || 0} Owner
                </span>
                <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                  {roster?.summary?.adminsCount || 0} Admins
                </span>
                <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {roster?.summary?.agentsCount || 0} Agents
                </span>
                <span className="rounded-lg bg-slate-500/10 px-3 py-1 text-xs font-bold text-muted-c">
                  {roster?.summary?.activeCount || 0} Active Accounts
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-c" />
                  <input
                    type="text"
                    placeholder="Search member…"
                    value={rosterSearch}
                    onChange={(e) => {
                      setRosterSearch(e.target.value);
                      loadRoster(0, rosterRole, e.target.value);
                    }}
                    className="form-input pl-8 py-1.5 text-xs w-48"
                  />
                </div>
                <select
                  value={rosterRole}
                  onChange={(e) => {
                    setRosterRole(e.target.value);
                    loadRoster(0, e.target.value, rosterSearch);
                  }}
                  className="form-select py-1.5 text-xs"
                >
                  <option value="ALL">All Roles</option>
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                  <option value="AGENT">Agent</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
            </div>

            {/* Roster Table */}
            <GlassCard className="p-0 overflow-hidden border border-base-c">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-base-c text-left text-[10px] font-bold uppercase tracking-wider text-muted-c bg-slate-50/50 dark:bg-ink-850/50">
                    <th className="px-5 py-3">Team Member</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Assigned Leads</th>
                    <th className="px-5 py-3">Resolved Tickets</th>
                    <th className="px-5 py-3">Last Active</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterLoading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="border-b border-base-c">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="h-7 rounded bg-slate-100 dark:bg-ink-800 animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : roster?.members && roster.members.length > 0 ? (
                    roster.members.map((u) => {
                      const isOwner = u.role.toUpperCase() === 'OWNER';
                      const isAdmin = u.role.toUpperCase() === 'ADMIN';
                      return (
                        <tr key={u.id} className="border-b border-base-c hover:bg-slate-50/50 dark:hover:bg-ink-850/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={u.displayName} size={36} />
                              <div>
                                <p className="text-xs font-semibold text-primary-c">{u.displayName}</p>
                                <p className="text-[10px] text-muted-c">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cx(
                              'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                              isOwner ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                              isAdmin ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                              'bg-slate-500/10 text-secondary-c'
                            )}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cx(
                              'inline-flex items-center gap-1.5 text-xs font-medium',
                              u.accountStatus === 'ACTIVE' ? 'text-success-500' : 'text-danger-500'
                            )}>
                              <span className={cx('h-2 w-2 rounded-full', u.accountStatus === 'ACTIVE' ? 'bg-success-500' : 'bg-danger-500')} />
                              {u.accountStatus}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-bold text-primary-c">{u.assignedLeadsCount}</td>
                          <td className="px-5 py-3.5 text-xs font-bold text-primary-c">{u.resolvedTicketsCount}</td>
                          <td className="px-5 py-3.5 text-[11px] text-muted-c">
                            {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link
                              to={`/admin/users/${u.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-all"
                            >
                              <span>View Profile</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-xs text-muted-c">
                        No team members found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}

        {/* TAB 3: MULTI-CHANNEL USAGE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Range Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-ink-850/50 p-4 rounded-xl border border-base-c">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-500" />
                <span className="text-xs font-bold text-primary-c">Time Period ({analytics?.timezone || 'Asia/Kolkata'}):</span>
                <span className="text-xs text-muted-c font-mono">
                  {analytics?.fromDate} → {analytics?.toDate}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: 'TODAY', label: 'Today' },
                  { id: 'LAST_7_DAYS', label: '7 Days' },
                  { id: 'LAST_30_DAYS', label: '30 Days' },
                  { id: 'CURRENT_MONTH', label: 'This Month' },
                  { id: 'PREVIOUS_MONTH', label: 'Prev Month' },
                  { id: 'ALL_TIME', label: 'All Time' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setAnalyticsRange(r.id);
                      loadAnalytics(r.id);
                    }}
                    className={cx(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                      analyticsRange === r.id
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-card-c text-secondary-c hover:text-primary-c border border-base-c'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {analyticsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-36 rounded-xl bg-slate-100 dark:bg-ink-800 animate-pulse" />
                ))}
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Leads & Email Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leads */}
                  <GlassCard className="p-6 border border-base-c bg-card-c space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-c flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" /> Leads & Pipeline Conversion
                      </h4>
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        {analytics.leads.conversionRate}% Won Rate
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-slate-50 dark:bg-ink-850 p-3.5 rounded-xl border border-base-c">
                        <p className="text-[10px] text-muted-c uppercase font-bold">Created</p>
                        <p className="text-2xl font-bold text-primary-c mt-1">{analytics.leads.totalCreated}</p>
                      </div>
                      <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Won</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{analytics.leads.wonCount}</p>
                      </div>
                      <div className="bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20">
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold">Lost</p>
                        <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{analytics.leads.lostCount}</p>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Email */}
                  <GlassCard className="p-6 border border-base-c bg-card-c space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-c flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" /> Email Marketing Engine
                      </h4>
                      <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                        {analytics.emails.deliveryRate}% Delivered
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-slate-50 dark:bg-ink-850 p-3 rounded-xl border border-base-c">
                        <p className="text-[9px] text-muted-c uppercase font-bold">Sent</p>
                        <p className="text-xl font-bold text-primary-c mt-1">{analytics.emails.totalSent}</p>
                      </div>
                      <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                        <p className="text-[9px] text-blue-600 dark:text-blue-400 uppercase font-bold">Delivered</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{analytics.emails.delivered}</p>
                      </div>
                      <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                        <p className="text-[9px] text-purple-600 dark:text-purple-400 uppercase font-bold">Opened</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">{analytics.emails.opened}</p>
                      </div>
                      <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <p className="text-[9px] text-amber-600 dark:text-amber-400 uppercase font-bold">Clicked</p>
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{analytics.emails.clicked}</p>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* WhatsApp & Support Desk Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* WhatsApp */}
                  <GlassCard className="p-6 border border-base-c bg-card-c space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-c flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-emerald-500" /> WhatsApp Cloud Messaging
                      </h4>
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        {analytics.whatsapp.readRate}% Read Rate
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-slate-50 dark:bg-ink-850 p-3.5 rounded-xl border border-base-c">
                        <p className="text-[10px] text-muted-c uppercase font-bold">Campaigns</p>
                        <p className="text-2xl font-bold text-primary-c mt-1">{analytics.whatsapp.campaignsCount}</p>
                      </div>
                      <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Delivered</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{analytics.whatsapp.delivered}</p>
                      </div>
                      <div className="bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/20">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold">Read</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{analytics.whatsapp.read}</p>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Support Desk */}
                  <GlassCard className="p-6 border border-base-c bg-card-c space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-c flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-500" /> Support Desk & SLA
                      </h4>
                      <span className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
                        {analytics.tickets.resolutionRate}% Resolved
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-slate-50 dark:bg-ink-850 p-3.5 rounded-xl border border-base-c">
                        <p className="text-[10px] text-muted-c uppercase font-bold">Total</p>
                        <p className="text-2xl font-bold text-primary-c mt-1">{analytics.tickets.totalTickets}</p>
                      </div>
                      <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold">Open</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{analytics.tickets.openTickets}</p>
                      </div>
                      <div className="bg-purple-500/10 p-3.5 rounded-xl border border-purple-500/20">
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-bold">Avg Res. Time</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{analytics.tickets.avgResolutionTimeHours}h</p>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Quota Meters */}
                {analytics.quotas && (
                  <GlassCard className="p-6 border border-base-c bg-card-c space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-c flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary-500" /> Quota Health & Consumption Status
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        analytics.quotas.employeeQuota,
                        analytics.quotas.leadQuota,
                        analytics.quotas.emailQuota,
                        analytics.quotas.whatsappQuota,
                        analytics.quotas.ticketQuota,
                      ].filter(Boolean).map((q, idx) => {
                        const isDis = q.healthStatus === 'SERVICE_DISABLED';
                        const isCrit = q.healthStatus === 'CRITICAL' || q.healthStatus === 'EXHAUSTED';
                        const isWarn = q.healthStatus === 'WARNING';
                        return (
                          <div key={idx} className="p-4 rounded-xl border border-base-c bg-slate-50/50 dark:bg-ink-850/50 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-primary-c">{q.name}</span>
                              <span className={cx(
                                'rounded px-2 py-0.5 text-[10px] font-bold uppercase',
                                isDis ? 'bg-slate-500/10 text-muted-c' :
                                isCrit ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                isWarn ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              )}>
                                {q.healthStatus.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-c">
                              <span>{isDis ? 'Disabled' : `${q.used.toLocaleString()} / ${q.limit.toLocaleString()}`}</span>
                              <span className="font-bold text-primary-c">{isDis ? '—' : `${q.percentage}%`}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-ink-800 overflow-hidden">
                              <div
                                className={cx(
                                  'h-full rounded-full transition-all duration-500',
                                  isDis ? 'bg-slate-400 w-0' :
                                  isCrit ? 'bg-rose-500' :
                                  isWarn ? 'bg-amber-500' :
                                  'bg-emerald-500'
                                )}
                                style={{ width: `${Math.min(100, q.percentage)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
