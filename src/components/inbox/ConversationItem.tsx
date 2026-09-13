import { Avatar } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { Conversation, ConversationStatus, ConversationTag } from './inboxTypes';
import { Bot, Check, CheckCheck } from 'lucide-react';

const STATUS_STYLES: Record<ConversationStatus, { dot: string; label: string; text: string }> = {
  online: { dot: 'bg-emerald-500', label: 'Online', text: 'text-emerald-600 dark:text-emerald-400' },
  typing: { dot: 'bg-amber-500', label: 'typing…', text: 'text-amber-600 dark:text-amber-400' },
  away: { dot: 'bg-amber-400', label: 'Away', text: 'text-amber-600 dark:text-amber-400' },
  offline: { dot: 'bg-slate-300 dark:bg-ink-700', label: 'Offline', text: 'text-muted-c' },
};

const TAG_STYLES: Record<ConversationTag, string> = {
  NEW: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
  HOT: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
  VIP: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/40',
  RETURNING: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
  BOT: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30',
};

export function ConversationItem({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const status = STATUS_STYLES[conv.status];
  const senderIcon =
    conv.lastMessageSender === 'me' ? (
      <CheckCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
    ) : conv.lastMessageSender === 'bot' ? (
      <Bot className="h-3.5 w-3.5 text-purple-500 shrink-0" />
    ) : null;

  return (
    <button
      onClick={onClick}
      className={cx(
        'group relative flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all duration-150 border',
        active
          ? 'bg-emerald-500/10 border-emerald-500/30 shadow-xs dark:bg-emerald-500/15'
          : 'border-transparent hover:bg-slate-100/70 dark:hover:bg-ink-850/60 hover:border-base-c/50',
      )}
    >
      {/* Active Left Accent Indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500 shadow-xs" />
      )}

      {/* Uniform Avatar with Status Badge */}
      <div className="relative shrink-0 w-11 h-11">
        <Avatar name={conv.name} size={44} className="ring-2 ring-emerald-500/20" />
        <span
          className={cx(
            'absolute -bottom-0.5 -right-0.5 z-10 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs',
            status.dot,
            conv.status === 'typing' && 'animate-pulse',
          )}
        />
      </div>

      {/* Item Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cx(
              'truncate text-sm',
              conv.unread > 0 ? 'font-bold text-primary-c' : 'font-semibold text-primary-c/90',
            )}
          >
            {conv.name}
          </p>
          <span
            className={cx(
              'shrink-0 text-[11px]',
              conv.unread > 0 ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-muted-c',
            )}
          >
            {conv.timestamp}
          </span>
        </div>

        {/* Last Message Snippet */}
        <div className="mt-1 flex items-center gap-1.5 min-w-0">
          {senderIcon}
          <p
            className={cx(
              'truncate text-xs',
              conv.unread > 0 ? 'font-semibold text-primary-c' : 'text-muted-c',
            )}
          >
            {conv.lastMessage || 'No recent messages'}
          </p>
        </div>

        {/* Badges & Tags Row */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {conv.tags.map((t) => (
              <span
                key={t}
                className={cx(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase',
                  TAG_STYLES[t],
                )}
              >
                {t}
              </span>
            ))}

            {/* Bot/Human Status Pill */}
            <span
              className={cx(
                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide border',
                conv.isBotHandled
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              )}
            >
              {conv.isBotHandled ? <Bot className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />}
              {conv.isBotHandled ? 'Bot' : 'Human'}
            </span>

            {conv.assignedTo && (
              <span className="text-[10px] text-muted-c font-medium truncate max-w-[90px]">
                · {conv.assignedTo}
              </span>
            )}
            {conv.leadStatus === 'LIMIT_REACHED' && (
              <span className="inline-flex items-center rounded-md bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                LIMIT REACHED
              </span>
            )}
            {conv.leadStatus === 'UNASSIGNED' && (
              <span className="inline-flex items-center rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                UNASSIGNED
              </span>
            )}
          </div>

          {/* Unread Pill */}
          {conv.unread > 0 && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white shadow-soft">
              {conv.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
