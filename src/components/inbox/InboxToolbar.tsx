import { Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import {
  Search,
  Filter,
  Bot,
  Star,
  Archive,
  Users,
  Inbox as InboxIcon,
  Globe,
  MessageSquare,
} from 'lucide-react';
import { TabSwitcher } from '@/components/ui/TabSwitcher';

export type ChannelId = 'whatsapp' | 'webchat';
export type FilterId = 'all' | 'unread' | 'bot' | 'vip' | 'mine';

type FilterTab = {
  id: FilterId;
  label: string;
  icon: typeof InboxIcon;
  count: number;
};

export function InboxToolbar({
  channel,
  onChannel,
  query,
  onQuery,
  activeFilter,
  onFilter,
  counts,
}: {
  channel: ChannelId;
  onChannel: (c: ChannelId) => void;
  query: string;
  onQuery: (q: string) => void;
  activeFilter: FilterId;
  onFilter: (f: FilterId) => void;
  counts: Record<FilterId, number>;
}) {
  const filters: FilterTab[] = [
    { id: 'all', label: 'All', icon: InboxIcon, count: counts.all },
    { id: 'unread', label: 'Unread', icon: Filter, count: counts.unread },
    { id: 'bot', label: 'Bot Handled', icon: Bot, count: counts.bot },
    { id: 'vip', label: 'VIP', icon: Star, count: counts.vip },
    { id: 'mine', label: 'Assigned to me', icon: Users, count: counts.mine },
  ];

  return (
    <div className="space-y-4">
      {/* Channel Switcher Tabs */}
      <TabSwitcher
        tabs={[
          { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="h-4 w-4" /> },
          { id: 'webchat', label: 'WebChat', icon: <Globe className="h-4 w-4" /> }
        ]}
        activeTab={channel}
        onChange={(id) => onChannel(id as ChannelId)}
        className="w-full justify-between [&>button]:flex-1"
      />

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={channel === 'whatsapp' ? 'Search conversations or phone numbers…' : 'Search webchat sessions…'}
          className="w-full rounded-xl2 border border-base-c bg-card-c py-2.5 pl-10 pr-10 text-sm text-primary-c placeholder:text-muted-c transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        {query && (
          <button
            onClick={() => onQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-c hover:text-primary-c"
            aria-label="Clear search"
          >
            <Archive className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter tabs (only for WhatsApp) */}
      {channel === 'whatsapp' && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {filters.map((f) => {
            const Icon = f.icon;
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onFilter(f.id)}
                className={cx(
                  'flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  active
                    ? 'bg-gradient-accent text-white shadow-soft'
                    : 'border border-base-c text-secondary-c hover:border-primary-500/30 hover:text-primary-c',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {f.label}
                <span
                  className={cx(
                    'grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold',
                    active ? 'bg-white/25' : 'bg-slate-100 text-muted-c dark:bg-ink-800',
                  )}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
