import { cx } from '@/lib/types';
import {
  Search,
  Filter,
  Bot,
  Star,
  Users,
  Inbox as InboxIcon,
  Globe,
  MessageSquare,
  X,
} from 'lucide-react';
import { TabSwitcher } from '@/components/ui/TabSwitcher';

export type ChannelId = 'whatsapp' | 'webchat';
export type FilterId = 'all' | 'unread' | 'unassigned' | 'bot' | 'vip' | 'mine';

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
    { id: 'unassigned', label: 'Unassigned Pool', icon: Users, count: counts.unassigned || 0 },
    { id: 'bot', label: 'Bot Handled', icon: Bot, count: counts.bot },
    { id: 'vip', label: 'VIP', icon: Star, count: counts.vip },
    { id: 'mine', label: 'Assigned to me', icon: Users, count: counts.mine },
  ];

  return (
    <div className="space-y-3 shrink-0">
      {/* Channel Switcher Tabs */}
      <TabSwitcher
        tabs={[
          {
            id: 'whatsapp',
            label: 'WhatsApp Inbox',
            icon: <MessageSquare className="h-4 w-4 text-emerald-500" />,
          },
          {
            id: 'webchat',
            label: 'WebChat Widget',
            icon: <Globe className="h-4 w-4 text-indigo-500" />,
          },
        ]}
        activeTab={channel}
        onChange={(id) => onChannel(id as ChannelId)}
        className="w-full justify-between [&>button]:flex-1 bg-slate-100/80 dark:bg-ink-900/60 p-1 rounded-xl"
      />

      {/* Search Input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-c" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={
            channel === 'whatsapp'
              ? 'Search contact, phone or message…'
              : 'Search webchat sessions…'
          }
          className="w-full rounded-xl border border-base-c/80 bg-card-c/90 py-2 pl-10 pr-9 text-xs sm:text-sm text-primary-c placeholder:text-muted-c transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
        />
        {query && (
          <button
            onClick={() => onQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-c hover:bg-slate-200 dark:hover:bg-ink-800 hover:text-primary-c transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter tabs (only for WhatsApp) */}
      {channel === 'whatsapp' && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
          {filters.map((f) => {
            const Icon = f.icon;
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onFilter(f.id)}
                className={cx(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap btn-tactile',
                  active
                    ? 'bg-emerald-600 text-white shadow-soft font-semibold'
                    : 'border border-base-c/70 bg-card-c/60 text-secondary-c hover:border-emerald-500/40 hover:text-primary-c hover:bg-card-c',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{f.label}</span>
                <span
                  className={cx(
                    'grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold leading-none',
                    active
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-100 text-muted-c dark:bg-ink-800',
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
