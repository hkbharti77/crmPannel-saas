import { useMemo, useState } from 'react';
import { GlassCard, Avatar, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { CONVERSATIONS } from './mockData';
import { InboxToolbar, type FilterId } from './InboxToolbar';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from './inboxTypes';
import {
  MessageSquare,
  Bot,
  UserCheck,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Image as ImageIcon,
  Sparkles,
  Check,
} from 'lucide-react';

export function InboxView({ onOpenChat }: { onOpenChat: () => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const all = CONVERSATIONS.length;
    const unread = CONVERSATIONS.filter((c) => c.unread > 0).length;
    const bot = CONVERSATIONS.filter((c) => c.isBotHandled).length;
    const vip = CONVERSATIONS.filter((c) => c.tags.includes('VIP')).length;
    const mine = CONVERSATIONS.filter((c) => c.assignedTo === 'Arjun').length;
    return { all, unread, bot, vip, mine };
  }, []);

  const filtered = useMemo(() => {
    return CONVERSATIONS.filter((c) => {
      if (filter === 'unread' && c.unread === 0) return false;
      if (filter === 'bot' && !c.isBotHandled) return false;
      if (filter === 'vip' && !c.tags.includes('VIP')) return false;
      if (filter === 'mine' && c.assignedTo !== 'Arjun') return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filter, query]);

  const selected = CONVERSATIONS.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="grid gap-4 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">
        {/* Left: conversation list */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary-c">Inbox</h2>
              <p className="text-xs text-muted-c">
                {counts.unread} unread · {counts.bot} bot-handled
              </p>
            </div>
            <Badge variant="success" className="px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" />
              Live
            </Badge>
          </div>

          <InboxToolbar
            query={query}
            onQuery={setQuery}
            activeFilter={filter}
            onFilter={setFilter}
            counts={counts}
          />

          {/* List */}
          <div className="space-y-1.5 overflow-y-auto scrollbar-thin" style={{ maxHeight: 'calc(100vh - 260px)' }}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <MessageSquare className="h-10 w-10 text-muted-c/40" />
                <p className="mt-3 text-sm text-muted-c">No conversations found</p>
              </div>
            ) : (
              filtered.map((c) => (
                <ConversationItem
                  key={c.id}
                  conv={c}
                  active={c.id === selectedId}
                  onClick={() => setSelectedId(c.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: conversation preview or empty state */}
        <div className="hidden lg:block">
          {selected ? (
            <ChatPreview conv={selected} onOpenChat={onOpenChat} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <GlassCard className="flex h-full min-h-[500px] flex-col items-center justify-center p-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-accent-soft">
        <MessageSquare className="h-8 w-8 text-primary-600 dark:text-primary-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-primary-c">Select a conversation</h3>
      <p className="mt-1 max-w-xs text-sm text-secondary-c">
        Choose a chat from the list to preview messages, or open the full chat
        room for the complete experience.
      </p>
    </GlassCard>
  );
}

function ChatPreview({ conv, onOpenChat }: { conv: Conversation; onOpenChat: () => void }) {
  return (
    <GlassCard className="flex h-full min-h-[500px] flex-col overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-base-c p-4">
        <div className="relative">
          <Avatar name={conv.name} size={40} />
          <span
            className={cx(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card-c',
              conv.status === 'online' && 'bg-success-500',
              conv.status === 'typing' && 'bg-warning-500',
              conv.status === 'away' && 'bg-warning-400',
              conv.status === 'offline' && 'bg-slate-300 dark:bg-ink-700',
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary-c">{conv.name}</p>
          <p className="truncate text-xs text-muted-c">
            {conv.status === 'typing' ? (
              <span className="text-warning-600 dark:text-warning-400">typing…</span>
            ) : (
              conv.phone
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {conv.isBotHandled && (
            <Badge variant="primary" className="mr-1">
              <Bot className="h-3 w-3" /> Bot
            </Badge>
          )}
          <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
            <Phone className="h-4 w-4" />
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
            <Video className="h-4 w-4" />
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
        {/* Date separator */}
        <div className="flex items-center justify-center">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-muted-c dark:bg-ink-800">
            Today
          </span>
        </div>

        {/* Incoming */}
        <div className="flex justify-start">
          <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-primary-c dark:bg-ink-800">
            Hi, I saw your listing for Skyline Residency. Is it still available?
          </div>
        </div>

        {/* Outgoing */}
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-gradient-accent px-4 py-2.5 text-sm text-white">
            Yes it is! Would you like to schedule a site visit?
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/70">
              <Check /> Delivered
            </div>
          </div>
        </div>

        {/* Incoming */}
        <div className="flex justify-start">
          <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-primary-c dark:bg-ink-800">
            {conv.lastMessage}
          </div>
        </div>

        {/* Typing indicator */}
        {conv.status === 'typing' && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-ink-800">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-c [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-c [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-c [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="border-t border-base-c p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 rounded-lg border border-base-c px-2.5 py-1 text-xs text-secondary-c hover:text-primary-c">
            <Sparkles className="h-3 w-3 text-secondary-500" /> AI Reply
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-base-c px-2.5 py-1 text-xs text-secondary-c hover:text-primary-c">
            <UserCheck className="h-3 w-3 text-primary-500" /> Assign
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-base-c px-2.5 py-1 text-xs text-secondary-c hover:text-primary-c">
            <Paperclip className="h-3 w-3" /> Attach
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl2 border border-base-c bg-card-c px-3 py-2">
          <button className="text-muted-c hover:text-primary-c">
            <Smile className="h-4 w-4" />
          </button>
          <button className="text-muted-c hover:text-primary-c">
            <ImageIcon className="h-4 w-4" />
          </button>
          <input
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm text-primary-c placeholder:text-muted-c focus:outline-none"
          />
          <button className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-accent text-white transition-transform hover:scale-105">
            <Send className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={onOpenChat}
          className="mt-2 w-full rounded-lg bg-gradient-accent-soft py-2 text-xs font-medium text-primary-600 transition-colors hover:bg-gradient-accent hover:text-white dark:text-primary-300"
        >
          Open full chat room
        </button>
      </div>
    </GlassCard>
  );
}
