import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GlassCard, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  ArrowLeft, TrendingUp,
  UserCheck, UserX, Building2, Search, KeyRound,
  ArrowUpRight, RefreshCw
} from 'lucide-react';
import {
  fetchUserDetailedProfile,
  suspendPlatformUser,
  activatePlatformUser,
  type UserDetailedProfile,
} from '@/lib/platformApi';

export function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserDetailedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permSearch, setPermSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const res = await fetchUserDetailedProfile(userId);
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setProfile(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleToggleStatus = async () => {
    if (!profile) return;
    setActionLoading(true);
    const isActive = profile.accountStatus.toUpperCase() === 'ACTIVE';
    if (isActive) {
      await suspendPlatformUser(profile.id);
    } else {
      await activatePlatformUser(profile.id);
    }
    await load();
    setActionLoading(false);
  };

  if (!userId) {
    return <div className="p-6 text-sm text-danger-500">User ID missing</div>;
  }

  const isOwner = profile?.role.toUpperCase() === 'OWNER';
  const isAdmin = profile?.role.toUpperCase() === 'ADMIN';
  const isSuper = profile?.isSuperAdmin || profile?.role.toUpperCase() === 'SUPER_ADMIN';

  const filteredPerms = (profile?.permissions || []).filter((p) =>
    !permSearch || p.toLowerCase().includes(permSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-6">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-1.5 rounded-lg border border-base-c bg-card-c px-3 py-1.5 text-xs font-semibold text-secondary-c hover:text-primary-c transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Users</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted-c">
            <Link to="/admin/users" className="hover:underline">Users</Link>
            <span>/</span>
            <span className="font-semibold text-primary-c">{profile?.displayName || userId.slice(0, 8)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSuper && profile && (
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all shadow-sm',
                profile.accountStatus === 'ACTIVE'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
              )}
            >
              {profile.accountStatus === 'ACTIVE' ? (
                <>
                  <UserX className="h-3.5 w-3.5" />
                  <span>Suspend Account</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Activate Account</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={load}
            disabled={loading}
            className="grid h-8 w-8 place-items-center rounded-lg border border-base-c text-secondary-c hover:text-primary-c transition-colors"
          >
            <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2">{error}</p>}

      {/* Main User Profile Header */}
      <GlassCard className="p-6 border border-base-c">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={profile?.displayName || 'User'} size={56} />
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-primary-c">{profile?.displayName || 'Loading…'}</h1>
                <span className={cx(
                  'rounded-full px-3 py-0.5 text-xs font-bold uppercase',
                  isSuper ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                  isOwner ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                  isAdmin ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                  'bg-slate-500/10 text-secondary-c'
                )}>
                  {isSuper ? 'Platform Owner' : profile?.role || 'Agent'}
                </span>
                <span className={cx(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  profile?.accountStatus === 'ACTIVE'
                    ? 'bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400'
                    : 'bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-400'
                )}>
                  <span className={cx('h-2 w-2 rounded-full', profile?.accountStatus === 'ACTIVE' ? 'bg-success-500' : 'bg-danger-500')} />
                  {profile?.accountStatus || 'ACTIVE'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-c">
                User ID: <span className="font-mono">{userId}</span> · Email: {profile?.email} · Phone: {profile?.phone || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-c">Last Active</p>
              <p className="text-xs font-semibold text-primary-c">
                {profile?.lastActiveAt ? new Date(profile.lastActiveAt).toLocaleString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-c">Member Since</p>
              <p className="text-xs font-semibold text-primary-c">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Organization Preview Card */}
      <GlassCard className="p-6 border border-base-c bg-card-c flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-500/10 text-primary-500">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-c uppercase tracking-wider">Assigned Tenant Organization</p>
            <h3 className="text-lg font-bold text-primary-c mt-0.5">{profile?.tenantBusinessName}</h3>
            <p className="text-xs text-muted-c">Plan: <span className="font-semibold text-primary-500">{profile?.tenantPlanType}</span></p>
          </div>
        </div>

        {profile?.tenantId && (
          <Link
            to={`/admin/tenants/${profile.tenantId}`}
            className="flex items-center gap-1.5 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-all shadow-sm"
          >
            <span>View Tenant 360° Profile</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </GlassCard>

      {/* Workload & Attribution KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-c flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Workload & Performance Attribution ({profile?.metricsPeriod || 'Last 30 Days'})
          </h3>
          <span className="text-xs text-muted-c">Rolling 30-Day Window Attribution</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlassCard className="p-5 border border-base-c bg-card-c">
            <p className="text-[10px] uppercase font-bold text-muted-c">Assigned Leads</p>
            <p className="mt-2 text-3xl font-bold text-primary-c">{profile?.assignedLeadsCount || 0}</p>
            <p className="text-xs text-emerald-500 font-semibold mt-1">
              {profile?.wonLeadsCount || 0} won ({profile?.leadConversionRate || 0}%)
            </p>
          </GlassCard>

          <GlassCard className="p-5 border border-base-c bg-card-c">
            <p className="text-[10px] uppercase font-bold text-muted-c">Lead Conversion Rate</p>
            <p className="mt-2 text-3xl font-bold text-emerald-500">{profile?.leadConversionRate || 0}%</p>
            <p className="text-xs text-muted-c mt-1">Won / Total Assigned</p>
          </GlassCard>

          <GlassCard className="p-5 border border-base-c bg-card-c">
            <p className="text-[10px] uppercase font-bold text-muted-c">Assigned Tickets</p>
            <p className="mt-2 text-3xl font-bold text-primary-c">{profile?.assignedTicketsCount || 0}</p>
            <p className="text-xs text-purple-500 font-semibold mt-1">
              {profile?.resolvedTicketsCount || 0} resolved
            </p>
          </GlassCard>

          <GlassCard className="p-5 border border-base-c bg-card-c">
            <p className="text-[10px] uppercase font-bold text-muted-c">Live Chat Volume</p>
            <p className="mt-2 text-3xl font-bold text-primary-c">{profile?.directChatsHandled || 0}</p>
            <p className="text-xs text-muted-c mt-1">Direct conversations handled</p>
          </GlassCard>
        </div>
      </div>

      {/* RBAC Action Permissions */}
      <GlassCard className="p-6 border border-base-c bg-card-c space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-c flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary-500" /> Granted Action Permissions ({profile?.permissions.length || 0})
            </h3>
            <p className="text-xs text-muted-c mt-0.5">Granular User RBAC keys controlling accessible tabs and action buttons.</p>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-c" />
            <input
              type="text"
              placeholder="Search permissions…"
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              className="form-input pl-8 py-1.5 text-xs w-52"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
          {filteredPerms.map((p, idx) => (
            <span
              key={idx}
              className="rounded-lg border border-base-c bg-slate-100/70 dark:bg-ink-800/70 px-3 py-1 text-xs font-mono font-medium text-secondary-c shadow-sm"
            >
              {p}
            </span>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
