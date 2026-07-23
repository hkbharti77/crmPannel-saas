import { useTheme } from '@/context/ThemeContext';
import { IconButton, Avatar } from '@/components/ui/primitives';
import type { ViewId } from '@/lib/navigation';
import { Menu, Search, Bell, Sun, Moon, Command } from 'lucide-react';

const TITLES: Record<ViewId, string> = {
  dashboard: 'Dashboard',
  inbox: 'Inbox',
  chatroom: 'Chat Room',
  pipeline: 'Pipeline',
  broadcasts: 'Broadcasts',
  leaddetail: 'Lead Detail',
  appointments: 'Appointments',
  booking: 'Booking',
  tickets: 'Tickets',
  emails: 'Emails',
  settings: 'Settings',
};

export function TopBar({
  current,
  onOpenMobile,
}: {
  current: ViewId;
  onOpenMobile: () => void;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-base-c px-4 lg:px-6 glass">
      <button
        onClick={onOpenMobile}
        className="grid h-9 w-9 place-items-center rounded-lg text-secondary-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 dark:hover:text-white lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-base font-semibold text-primary-c lg:text-lg">
        {TITLES[current] ?? 'Dashboard'}
      </h1>

      <div className="ml-auto flex items-center gap-1.5">
        <button className="hidden items-center gap-2 rounded-lg border border-base-c bg-card-c px-3 py-2 text-sm text-muted-c transition-colors hover:border-primary-500/40 hover:text-secondary-c sm:flex">
          <Search className="h-4 w-4" />
          <span>Search…</span>
          <kbd className="ml-2 inline-flex items-center gap-0.5 rounded border border-base-c px-1.5 py-0.5 text-[10px] font-medium text-muted-c">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        <IconButton label="Toggle theme" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </IconButton>

        <IconButton label="Notifications">
          <div className="relative">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-card-c" />
          </div>
        </IconButton>

        <div className="ml-1.5 hidden sm:block">
          <Avatar name="Arjun Kapoor" size={34} />
        </div>
      </div>
    </header>
  );
}
