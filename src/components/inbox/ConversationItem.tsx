import { Avatar, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import type { Conversation, ConversationStatus, ConversationTag } from './inboxTypes';
import { Bot, Check, CheckCheck } from 'lucide-react';

const STATUS_STYLES: Record<ConversationStatus, { dot: string; label: string; text: string }> = {
  online: { dot: 'bg-success-500', label: 'Online', text: 'text-success-600 dark:text-success-400' },
  typing: { dot: 'bg-warning-500', label: 'typing…', text: 'text-warning-600 dark:text-warning-400' },
  away: { dot: 'bg-warning-400', label: 'Away', text: 'text-warning-600 dark:text-warning-400' },
  offline: { dot: 'bg-slate-300 dark:bg-ink-700', label: 'Offline', text: 'text-muted-c' },
};

const TAG_STYLES: Record<ConversationTag, string> = {
  NEW: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
  HOT: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300',
  VIP: 'bg-gradient-accent text-white',
  RETURNING: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300',
  BOT: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300',
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
      <CheckCheck className="h-3.5 w-3.5 text-primary-500" />
    ) : conv.lastMessageSender === 'bot' ? (
      <Bot className="h-3.5 w-3.5 text-secondary-500" />
    ) : null;

  return (
    <button
      onClick={onClick}
      className={cx(
        'group relative flex w-full gap-3 rounded-xl2 p-3 text-left transition-all',
        active
          ? 'bg-gradient-accent-soft ring-1 ring-primary-500/20'
          : 'hover:bg-slate-50 dark:hover:bg-ink-850/60',
      )}
    >
      {/* Active accent bar */}
      {active && (
        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-accent" />
      )}

      {/* Avatar with status dot */}
      <div className="relative shrink-0">
        <Avatar name={conv.name} size={44} />
        <span
          className={cx(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card-c',
            status.dot,
            conv.status === 'typing' && 'animate-pulse',
          )}
        />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cx(
              'truncate text-sm',
              conv.unread > 0 ? 'font-bold text-primary-c' : 'font-medium text-primary-c',
            )}
          >
            {conv.name}
          </p>
          <span
            className={cx(
              'shrink-0 text-[11px]',
              conv.unread > 0 ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-muted-c',
            )}
          >
            {conv.timestamp}
          </span>
        </div>

        {/* Last message */}
        <div className="mt-0.5 flex items-center gap-1.5">
          {senderIcon}
          <p
            className={cx(
              'truncate text-xs',
              conv.unread > 0 ? 'font-medium text-secondary-c' : 'text-muted-c',
            )}
          >
            {conv.lastMessage}
          </p>
        </div>

        {/* Tags + unread + bot badge */}
          <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {conv.tags.map((t) => (
              <span
                key={t}
                className={cx(
                  'inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide',
                  TAG_STYLES[t],
                )}
              >
                {t}
              </span>
            ))}
            {/* Bot/Human mode badge */}
            <span
              className={cx(
                'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide',
                conv.isBotHandled
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'
                  : 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300'
              )}
            >
              {conv.isBotHandled ? <Bot className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />}
              {conv.isBotHandled ? 'Bot' : 'Human'}
            </span>
            {conv.assignedTo && (
              <span className="text-[10px] text-muted-c">
                · {conv.assignedTo}
              </span>
            )}
          </div>

          {conv.unread > 0 && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-gradient-accent px-1.5 text-[10px] font-bold text-white">
              {conv.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
