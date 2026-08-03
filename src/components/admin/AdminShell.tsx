import { useState } from 'react';
import { ADMIN_NAV_ITEMS, ADMIN_TITLES } from '@/lib/adminNavigation';
import { cx } from '@/lib/types';
import { useTheme } from '@/context/ThemeContext';
import { IconButton, Avatar } from '@/components/ui/primitives';
import {
  ChevronLeft,
  X,
  Menu,
  Bell,
  Sun,
  Moon,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export function AdminShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.split('/')[2] || 'overview';

  return (
    <div className="flex h-screen overflow-hidden bg-base-c">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-base-c bg-card-c transition-all duration-300 lg:static lg:translate-x-0',
          collapsed ? 'w-[72px]' : 'w-[248px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5 select-none">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center">
              <img src="https://www.gyanvaniai.online/logo.webp" alt="Logo" className="h-full w-full object-contain" />
            </div>
              {!collapsed && (
                <div className="flex flex-col justify-center">
                  <span className="text-[15px] font-extrabold tracking-tight text-primary-c leading-tight">
                    GyanVaniAi
                  </span>
                  <div className="flex items-center gap-1.5 mt-[2px]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary-500/80 leading-none">
                      Connect
                    </span>
                    <span className="h-1 w-1 rounded-full bg-base-c" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500 leading-none">
                      Admin
                    </span>
                  </div>
                </div>
              )}
          </div>
          <button onClick={() => setMobileOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:text-primary-c lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(`/admin/${item.id}`); setMobileOpen(false); }}
                title={collapsed ? item.label : undefined}
                className={cx(
                  'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  collapsed && 'justify-center',
                  active
                    ? 'bg-gradient-to-br from-rose-500/10 to-orange-500/10 text-rose-600 dark:text-rose-400'
                    : 'text-secondary-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-850 dark:hover:text-white',
                )}
              >
                {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-rose-500 to-orange-500" />}
                <Icon className={cx('h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110', active && 'text-rose-500')} />
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden border-t border-base-c p-3 lg:block">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-c transition-colors hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-850 dark:hover:text-white', collapsed && 'justify-center')}
          >
            <ChevronLeft className={cx('h-[18px] w-[18px] transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* Exit to CRM */}
        <div className="border-t border-base-c p-3">
          <button
            onClick={() => navigate('/')}
            className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary-c transition-colors hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-ink-850', collapsed && 'justify-center')}
          >
            <ArrowLeft className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Exit to CRM</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-base-c px-4 lg:px-6 glass">
          <button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-secondary-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 dark:hover:text-white lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-primary-c lg:text-lg">{ADMIN_TITLES[currentPath as keyof typeof ADMIN_TITLES] ?? 'Admin'}</h1>
          <span className="hidden rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-500 sm:block">SUPER ADMIN</span>

          <div className="ml-auto flex items-center gap-1.5">
            <IconButton label="Toggle theme" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </IconButton>
            <IconButton label="Notifications">
              <div className="relative">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-card-c" />
              </div>
            </IconButton>
            <div className="ml-1.5 hidden sm:block">
              <Avatar name="Admin Owner" size={34} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin"><Outlet /></main>
      </div>
    </div>
  );
}
