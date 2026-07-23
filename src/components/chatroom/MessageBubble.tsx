import { cx } from '@/lib/types';
import type { Message } from './chatData';
import {
  Check,
  CheckCheck,
  Clock,
  FileText,
  Download,
  Play,
  Bot,
  Phone,
  CalendarPlus,
  ArrowLeft,
  MoreVertical,
  Paperclip,
  Smile,
  Image as ImageIcon,
  Mic,
  Send,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';

const STATUS_ICONS: Record<string, typeof Check> = {
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  pending: Clock,
};

export function MessageBubble({ msg }: { msg: Message }) {
  if (msg.type === 'system' || msg.sender === 'system') {
    return <SystemMessage msg={msg} />;
  }

  const isMe = msg.sender === 'me';
  const isBot = msg.sender === 'bot';
  const StatusIcon = msg.status ? STATUS_ICONS[msg.status] : null;

  return (
    <div
      className={cx(
        'flex items-end gap-2',
        isMe ? 'justify-end' : 'justify-start',
      )}
    >
      {/* Bot avatar */}
      {isBot && (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary-500/15">
          <Bot className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
        </div>
      )}

      <div
        className={cx(
          'max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[65%]',
          isMe
            ? 'rounded-tr-sm bg-gradient-accent text-white'
            : isBot
              ? 'rounded-tl-sm bg-secondary-500/10 text-primary-c border border-secondary-500/20'
              : 'rounded-tl-sm bg-slate-100 text-primary-c dark:bg-ink-800',
        )}
      >
        {/* Bot label */}
        {isBot && (
          <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-secondary-600 dark:text-secondary-400">
            <Sparkles className="h-2.5 w-2.5" /> AI Assistant
          </p>
        )}

        {/* Image */}
        {msg.type === 'image' && msg.imageUrl && (
          <div className="mb-1.5 overflow-hidden rounded-xl">
            <img
              src={msg.imageUrl}
              alt={msg.text ?? ''}
              className="max-h-48 w-full object-cover"
            />
          </div>
        )}

        {/* Document */}
        {msg.type === 'doc' && (
          <div className="flex items-center gap-3 rounded-xl bg-black/5 py-2 pl-2 pr-3 dark:bg-white/5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-danger-500/15">
              <FileText className="h-5 w-5 text-danger-600 dark:text-danger-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{msg.docName}</p>
              <p className="text-[10px] opacity-70">{msg.docSize}</p>
            </div>
            <Download className="h-4 w-4 opacity-60" />
          </div>
        )}

        {/* Voice */}
        {msg.type === 'voice' && (
          <div className="flex items-center gap-2.5 py-0.5">
            <button className="grid h-8 w-8 place-items-center rounded-full bg-white/20">
              <Play className="h-4 w-4 fill-current" />
            </button>
            <div className="flex items-center gap-0.5">
              {[4, 8, 14, 6, 12, 18, 8, 10, 16, 6, 12, 8, 14, 6, 10, 4].map((h, i) => (
                <span
                  key={i}
                  className="w-0.5 rounded-full bg-current opacity-60"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            <span className="text-[10px] opacity-70">{msg.voiceDuration}</span>
          </div>
        )}

        {/* Text */}
        {msg.type === 'text' && msg.text && (
          <p className="text-sm leading-relaxed">{msg.text}</p>
        )}
        {msg.type === 'image' && msg.text && (
          <p className="text-xs leading-relaxed opacity-90">{msg.text}</p>
        )}

        {/* Time + status */}
        <div
          className={cx(
            'mt-1 flex items-center justify-end gap-1 text-[10px]',
            isMe ? 'text-white/70' : 'text-muted-c',
          )}
        >
          {msg.isAISuggested && (
            <span className="flex items-center gap-0.5 text-secondary-400">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
          )}
          {msg.time}
          {isMe && StatusIcon && <StatusIcon className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
}

function SystemMessage({ msg }: { msg: Message }) {
  const isBooking = msg.text?.includes('booked') ?? false;
  const isHandoff = msg.text?.includes('handed off') ?? false;
  const Icon = isBooking ? CalendarPlus : isHandoff ? UserCheck : Bot;

  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-ink-800">
        <Icon className="h-3 w-3 text-muted-c" />
        <span className="text-[11px] font-medium text-muted-c">{msg.text}</span>
      </div>
    </div>
  );
}

export { ArrowLeft, MoreVertical, Paperclip, Smile, ImageIcon, Mic, Send, Phone, X };
