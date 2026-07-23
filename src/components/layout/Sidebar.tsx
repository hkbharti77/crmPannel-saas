import { NAV_ITEMS, type ViewId } from '@/lib/navigation';
import { cx } from '@/lib/types';
import { Logo } from '@/components/ui/primitives';
import { ChevronLeft, X } from 'lucide-react';

export function Sidebar({
  current,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  current: ViewId;
  onNavigate: (id: ViewId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
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
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
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

        <div className="border-t border-base-c p-3">
          <div className={cx('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-accent text-sm font-semibold text-white">
              AK
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary-c">Arjun Kapoor</p>
                <p className="truncate text-xs text-muted-c">Tenant Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
