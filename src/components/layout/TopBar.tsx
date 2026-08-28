import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { IconButton, Avatar } from '@/components/ui/primitives';
import { Menu, Bell, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
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

      <h1 className="text-base font-semibold text-primary-c lg:text-lg truncate max-w-[180px] sm:max-w-none">
        {TITLES[currentPath] ?? 'Dashboard'}
      </h1>



      <div className="ml-auto flex items-center gap-1.5">
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
                
                {/* Status Options */}
                <div className="border-b border-base-c py-1">
                  <button
                    onClick={() => handleStatusChange('AVAILABLE')}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-ink-800"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className={availability === 'AVAILABLE' ? 'text-primary-c' : 'text-muted-c'}>Online (Available)</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange('BUSY')}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-ink-800"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
                    <span className={availability === 'BUSY' ? 'text-primary-c' : 'text-muted-c'}>Busy</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange('OFFLINE')}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-ink-800"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
                    <span className={availability === 'OFFLINE' ? 'text-primary-c' : 'text-muted-c'}>Offline</span>
                  </button>
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
