import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { IconButton, Avatar } from '@/components/ui/primitives';
import { Menu, Search, Bell, Sun, Moon, Command, LogOut, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TITLES: Record<string, string> = {
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
  properties: 'Properties',
  reports: 'Reports',
  team: 'Team',
  settings: 'Settings',
  'meta-config': 'Meta Config',
  'knowledge-base': 'Knowledge Base',
  contacts: 'Contacts',
};

export function TopBar({
  onOpenMobile,
}: {
  onOpenMobile: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const currentPath = location.pathname.split('/')[1] || 'dashboard';

  const displayName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'User';

  const [availability, setAvailability] = useState<'AVAILABLE' | 'BUSY' | 'OFFLINE'>('AVAILABLE');

  // Heartbeat loop every 60 seconds
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        await fetch('/api/livechat/heartbeat', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch {
        // silent fail
      }
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (newStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
    setAvailability(newStatus);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await fetch('/api/livechat/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error('Failed updating availability status', err);
    }
  };

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
        {TITLES[currentPath] ?? 'Dashboard'}
      </h1>

      {/* Agent Availability Toggle */}
      <div className="ml-4 flex items-center gap-1.5 rounded-full border border-base-c bg-card-c px-2 py-1 text-xs">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            availability === 'AVAILABLE'
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
              : availability === 'BUSY'
              ? 'bg-amber-500'
              : 'bg-slate-400'
          }`}
        />
        <select
          value={availability}
          onChange={(e) => handleStatusChange(e.target.value as 'AVAILABLE' | 'BUSY' | 'OFFLINE')}
          className="bg-transparent font-medium text-primary-c focus:outline-none cursor-pointer text-xs"
        >
          <option value="AVAILABLE">Online (Available)</option>
          <option value="BUSY">Busy</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

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

        <div className="relative ml-1.5 hidden sm:block">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg p-0.5 transition-colors hover:bg-slate-100 dark:hover:bg-ink-800"
          >
            <Avatar name={displayName} size={34} />
            <ChevronDown className="h-3.5 w-3.5 text-muted-c" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-xl2 border border-base-c bg-card-c shadow-soft-lg animate-slide-down">
                <div className="border-b border-base-c p-3">
                  <p className="truncate text-sm font-semibold text-primary-c">{displayName}</p>
                  <p className="truncate text-[11px] text-muted-c">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-500/5 dark:text-danger-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
