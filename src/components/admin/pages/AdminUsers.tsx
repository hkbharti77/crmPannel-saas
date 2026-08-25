import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { Search, UserCheck, UserX, Mail, Building2, RefreshCw, Eye, ArrowUpRight } from 'lucide-react';
import { fetchAllUsers, enableUser, disableUser, type ApiUser } from '@/lib/platformApi';

type StatusFilter = 'ALL' | 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'DEACTIVATED';

export function AdminUsers() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchAllUsers({ size: 100 });
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      const list = Array.isArray(res.data) ? res.data : res.data.content ?? [];
      const tot = Array.isArray(res.data) ? res.data.length : res.data.totalElements ?? list.length;
      setUsers(list);
      setTotal(tot);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    users.filter((u) => {
      const ms = !search
        || u.displayName?.toLowerCase().includes(search.toLowerCase())
        || u.email.toLowerCase().includes(search.toLowerCase())
        || u.tenant?.businessName?.toLowerCase().includes(search.toLowerCase());
      const mst = statusFilter === 'ALL' || u.accountStatus?.toUpperCase() === statusFilter;
      return ms && mst;
    }),
    [users, search, statusFilter],
  );

  const handleToggle = async (u: ApiUser) => {
    setActionLoading(u.id);
    const isActive = u.accountStatus?.toUpperCase() === 'ACTIVE';
    if (isActive) await disableUser(u.id);
    else await enableUser(u.id);
    setActionLoading(null);
    load();
  };

  function statusMeta(s: string) {
    const up = (s ?? '').toUpperCase();
    if (up === 'ACTIVE') return { icon: <UserCheck className="h-3 w-3" />, label: 'Active', cls: 'text-success-600 dark:text-success-400' };
    if (up === 'LOCKED' || up === 'SUSPENDED') return { icon: <UserX className="h-3 w-3" />, label: up === 'LOCKED' ? 'Locked' : 'Suspended', cls: 'text-danger-600 dark:text-danger-400' };
    return { icon: <Mail className="h-3 w-3" />, label: 'Inactive', cls: 'text-warning-600 dark:text-warning-400' };
  }

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary-c">User Management</h2>
          <p className="mt-0.5 text-sm text-secondary-c">{loading ? '…' : `${total} users across all tenants`}</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-base-c px-3 py-2 text-xs font-medium text-secondary-c hover:text-primary-c transition-colors">
          <RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {error && <p className="text-xs text-danger-500 bg-danger-50 dark:bg-danger-500/10 rounded-lg px-3 py-2">{error}</p>}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="form-input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none">
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="LOCKED">Locked</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DEACTIVATED">Deactivated</option>
        </select>
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base-c text-left text-[10px] font-bold uppercase tracking-wide text-muted-c">
                <th className="px-4 py-3">User</th>
                <th className="hidden px-4 py-3 sm:table-cell">Tenant</th>
                <th className="hidden px-4 py-3 md:table-cell">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 lg:table-cell">Phone</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-base-c">
                    <td className="px-4 py-3" colSpan={6}><div className="h-8 rounded-lg bg-slate-100 dark:bg-ink-800 animate-pulse" /></td>
                  </tr>
                ))
                : filtered.map((u) => {
                  const sm = statusMeta(u.accountStatus);
                  const isActive = u.accountStatus?.toUpperCase() === 'ACTIVE';
                  return (
                    <tr key={u.id} className="border-b border-base-c transition-colors hover:bg-slate-50 dark:hover:bg-ink-850/50">
                      <td className="px-4 py-3">
                        <Link to={`/admin/users/${u.id}`} className="flex items-center gap-3 group">
                          <Avatar name={u.displayName || u.email} size={36} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-primary-c group-hover:text-primary-500 transition-colors flex items-center gap-1">
                              <span>{u.displayName || '—'}</span>
                              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <p className="truncate text-[10px] text-muted-c">{u.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className="flex items-center gap-1 text-xs text-secondary-c">
                          <Building2 className="h-3 w-3 text-muted-c" />
                          {u.tenant?.businessName ?? u.tenantId?.slice(0, 8) ?? '—'}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          u.role === 'OWNER' || u.role === 'SUPER_ADMIN'
                            ? 'bg-gradient-to-br from-rose-500/10 to-orange-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-slate-100 text-secondary-c dark:bg-ink-800'
                        )}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cx('flex items-center gap-1 text-xs font-medium', sm.cls)}>
                          {sm.icon} {sm.label}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell"><span className="text-[11px] text-muted-c">{u.phone ?? '—'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/admin/users/${u.id}`}
                            title="View Comprehensive 360° User Profile Page"
                            className="flex items-center gap-1 rounded-lg border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-colors shadow-sm"
                          >
                            <Eye className="h-3 w-3" />
                            <span>360° Profile</span>
                          </Link>
                          <button
                            onClick={() => handleToggle(u)}
                            disabled={actionLoading === u.id}
                            className={cx(
                              'rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors',
                              isActive
                                ? 'bg-danger-50 text-danger-600 hover:bg-danger-100 dark:bg-danger-500/10 dark:text-danger-400'
                                : 'bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400',
                            )}
                          >
                            {actionLoading === u.id ? '…' : isActive ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <UserCheck className="h-10 w-10 text-muted-c/30" />
            <p className="mt-3 text-sm text-muted-c">{error ? 'Could not load users' : 'No users found'}</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

