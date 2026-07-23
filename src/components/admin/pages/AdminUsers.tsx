import { useState, useMemo } from 'react';
import { GlassCard, Badge, Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { ADMIN_USERS, type AdminUser } from '@/components/admin/adminData';
import { Search, Shield, MoreVertical, UserCheck, UserX, Mail, Building2 } from 'lucide-react';

export function AdminUsers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminUser['status']>('ALL');

  const filtered = useMemo(
    () =>
      ADMIN_USERS.filter((u) => {
        const ms = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.tenant.toLowerCase().includes(search.toLowerCase());
        const mst = statusFilter === 'ALL' || u.status === statusFilter;
        return ms && mst;
      }),
    [search, statusFilter],
  );

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-primary-c">User Management</h2>
        <p className="mt-0.5 text-sm text-secondary-c">{ADMIN_USERS.length} users across all tenants.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="form-input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-lg border border-base-c bg-card-c px-3 py-2 text-xs text-secondary-c focus:border-primary-500/40 focus:outline-none">
          <option value="ALL">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="invited">Invited</option>
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
                <th className="hidden px-4 py-3 lg:table-cell">2FA</th>
                <th className="hidden px-4 py-3 lg:table-cell">Last Login</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-base-c transition-colors hover:bg-slate-50 dark:hover:bg-ink-850/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary-c">{u.name}</p>
                        <p className="truncate text-[10px] text-muted-c">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell"><span className="flex items-center gap-1 text-xs text-secondary-c"><Building2 className="h-3 w-3 text-muted-c" /> {u.tenant}</span></td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-semibold', u.role === 'Tenant Admin' ? 'bg-gradient-to-br from-rose-500/10 to-orange-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-100 text-secondary-c dark:bg-ink-800')}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.status === 'active' && <span className="flex items-center gap-1 text-xs font-medium text-success-600 dark:text-success-400"><UserCheck className="h-3 w-3" /> Active</span>}
                    {u.status === 'suspended' && <span className="flex items-center gap-1 text-xs font-medium text-danger-600 dark:text-danger-400"><UserX className="h-3 w-3" /> Suspended</span>}
                    {u.status === 'invited' && <span className="flex items-center gap-1 text-xs font-medium text-warning-600 dark:text-warning-400"><Mail className="h-3 w-3" /> Invited</span>}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {u.twoFactor ? <span className="flex items-center gap-1 text-[10px] font-medium text-success-600 dark:text-success-400"><Shield className="h-3 w-3" /> Enabled</span> : <span className="text-[10px] text-muted-c">Disabled</span>}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell"><span className="text-[11px] text-muted-c">{u.lastLogin}</span></td>
                  <td className="px-4 py-3"><button className="grid h-8 w-8 place-items-center rounded-lg text-muted-c transition-colors hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"><MoreVertical className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12"><UserCheck className="h-10 w-10 text-muted-c/30" /><p className="mt-3 text-sm text-muted-c">No users found</p></div>
        )}
      </GlassCard>
    </div>
  );
}
