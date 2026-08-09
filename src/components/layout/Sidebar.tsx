import { useState, useEffect } from 'react';
import { NAV_ITEMS } from '@/lib/navigation';
import { cx } from '@/lib/types';
import { Logo } from '@/components/ui/primitives';
import { ChevronLeft, X, Shield, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchCurrentUserProfile, type UserProfileDto } from '@/lib/userApi';
import { useNavigate, useLocation } from 'react-router-dom';

import { usePermissions } from '@/hooks/usePermissions';

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { user, signOut } = useAuth();
  const { hasPermission } = usePermissions();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.split('/')[1] || 'dashboard';

  const loadProfile = () => {
    fetchCurrentUserProfile().then((res) => {
      if (res.data) setProfile(res.data);
    });
  };

  useEffect(() => {
    loadProfile();

    // Listen for real-time profile updates from settings toggle changes
    window.addEventListener('profileUpdated', loadProfile);
    return () => window.removeEventListener('profileUpdated', loadProfile);
  }, []);

  const displayName = profile?.displayName || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const rawRole = (profile?.role || user?.role || '').toUpperCase();
  const roleLabel = rawRole === 'OWNER' ? 'Tenant Owner' : rawRole === 'ADMIN' ? 'Tenant Admin' : (rawRole === 'SUPER_ADMIN' || rawRole === 'PLATFORM_ADMIN') ? 'Platform Owner' : 'Agent';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Dynamically filter navigation items based on user permissions and module toggles
  const navItems = NAV_ITEMS.filter((item) => {
    if (item.id === 'pipeline' && profile?.forceShowLeads === false) return false;
    if (item.id === 'appointments' && profile?.forceShowAppointment === false) return false;
    if (item.id === 'booking' && profile?.forceShowBooking === false) return false;

    // Granular Module Permission Checks
    if (item.id === 'inbox' && !hasPermission('MODULE_INBOX')) return false;
    if (item.id === 'pipeline' && !hasPermission('MODULE_LEADS')) return false;
    if (item.id === 'broadcasts' && !hasPermission('MODULE_CAMPAIGNS')) return false;
    if (item.id === 'meta-config' && !hasPermission('SETTINGS_WHATSAPP')) return false;
    if (item.id === 'reports' && !hasPermission('MODULE_ANALYTICS')) return false;
    if (item.id === 'team' && !hasPermission('MODULE_TEAM')) return false;
    if (item.id === 'settings' && !hasPermission('MODULE_SETTINGS')) return false;

    return true;
  });

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-base-c bg-card-c transition-all duration-300 lg:static lg:translate-x-0',
          collapsed ? 'w-[72px]' : 'w-[248px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Logo collapsed={collapsed} />
          <button
            onClick={onCloseMobile}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:text-primary-c lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(`/${item.id}`);
                  onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
                className={cx(
                  'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  collapsed && 'justify-center',
                  active
                    ? 'bg-gradient-accent-soft text-primary-600 dark:text-primary-300'
                    : 'text-secondary-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-850 dark:hover:text-white',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-accent" />
                )}
                <Icon
                  className={cx(
                    'h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110',
                    active && 'text-primary-600 dark:text-primary-400',
                  )}
                />
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gradient-accent px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gradient-accent" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Super Admin entry — rendered only for Super Admin users */}
        {(() => {
          const roleUpper = (user?.role || '').toUpperCase();
          const isSuperAdmin =
            user?.isSuperAdmin === true ||
            roleUpper === 'SUPER_ADMIN' ||
            roleUpper === 'PLATFORM_ADMIN' ||
            user?.email?.toLowerCase() === 'gyanvaniai@gmail.com' ||
            user?.email?.toLowerCase().startsWith('superadmin');

          if (!isSuperAdmin) return null;

          return (
            <div className="border-t border-base-c p-3">
              <button
                onClick={() => {
                  navigate('/admin');
                }}
                className={cx(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  collapsed && 'justify-center',
                  'bg-gradient-to-br from-rose-500/10 to-orange-500/10 text-rose-600 hover:from-rose-500/20 hover:to-orange-500/20 dark:text-rose-400',
                )}
              >
                <Shield className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>Super Admin</span>}
              </button>
            </div>
          );
        })()}

        <div className="hidden border-t border-base-c p-3 lg:block">
          <button
            onClick={onToggleCollapse}
            className={cx(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-c transition-colors hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-850 dark:hover:text-white',
              collapsed && 'justify-center',
            )}
          >
            <ChevronLeft
              className={cx(
                'h-[18px] w-[18px] transition-transform',
                collapsed && 'rotate-180',
              )}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* Dynamic Authenticated User Profile */}
        <div className="relative border-t border-base-c p-3">
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className={cx(
              'flex w-full items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-ink-850',
              collapsed && 'justify-center',
            )}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-accent text-sm font-bold text-white shadow-sm">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-primary-c">{displayName}</p>
                <p className="truncate text-xs text-muted-c">{roleLabel}</p>
              </div>
            )}
          </button>

          {/* User Profile Popover */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute bottom-16 left-3 z-20 w-64 overflow-hidden rounded-xl2 border border-base-c bg-card-c p-3 shadow-2xl animate-slide-up">
                <div className="flex items-center gap-3 border-b border-base-c pb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-accent text-sm font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-primary-c">{displayName}</p>
                    <p className="truncate text-xs text-muted-c">{profile?.email || user?.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/settings');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-secondary-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-850"
                  >
                    <SettingsIcon className="h-4 w-4" /> Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-danger-600 hover:bg-danger-500/10 dark:text-danger-400"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
