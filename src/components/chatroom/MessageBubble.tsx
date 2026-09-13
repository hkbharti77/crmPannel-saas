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
  CalendarPlus,
  Sparkles,
  UserCheck,
} from 'lucide-react';

const STATUS_ICONS: Record<string, typeof Check> = {
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  pending: Clock,
};

export function MessageBubble({
  msg,
  theme = 'whatsapp-dark',
}: {
  msg: Message;
  theme?: 'whatsapp-dark' | 'whatsapp-light' | 'glass';
}) {
  if (msg.type === 'system' || msg.sender === 'system') {
    return <SystemMessage msg={msg} theme={theme} />;
  }

  const isMe = msg.sender === 'me';
  const isBot = msg.sender === 'bot';
  const StatusIcon = msg.status ? STATUS_ICONS[msg.status] : null;

  const getBubbleStyle = () => {
    if (theme === 'whatsapp-dark') {
      if (isMe) return 'rounded-tr-xs bg-[#005c4b] text-[#e9edef] shadow-xs';
      if (isBot) return 'rounded-tl-xs bg-[#1f2c34] text-[#e9edef] border border-[#005c4b]/50 shadow-xs';
      return 'rounded-tl-xs bg-[#202c33] text-[#e9edef] shadow-xs';
    }
    if (theme === 'whatsapp-light') {
      if (isMe) return 'rounded-tr-xs bg-[#d9fdd3] text-[#111b21] shadow-xs';
      if (isBot) return 'rounded-tl-xs bg-[#f0f2f5] text-[#111b21] border border-emerald-500/30 shadow-xs';
      return 'rounded-tl-xs bg-[#ffffff] text-[#111b21] shadow-xs';
    }
    // glass theme fallback
    if (isMe) return 'rounded-tr-xs bg-gradient-accent text-white shadow-md';
    if (isBot) return 'rounded-tl-xs bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-purple-500/10 text-primary-c border border-violet-500/30 backdrop-blur-md';
    return 'rounded-tl-xs bg-slate-100/90 text-primary-c dark:bg-ink-850/90 border border-base-c/60 backdrop-blur-md';
  };

  return (
    <div
      className={cx(
        'flex items-end gap-2.5 my-1',
        isMe ? 'justify-end' : 'justify-start',
      )}
    >
      {/* Bot avatar */}
      {isBot && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-soft">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cx(
          'max-w-[84%] rounded-2xl px-3.5 py-2.5 sm:max-w-[72%] transition-all',
          getBubbleStyle()
        )}
      >
        {/* Bot header badge */}
        {isBot && (
          <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            <Sparkles className="h-3 w-3" /> AI Assistant
          </p>
        )}

        {/* Image / Sticker */}
        {(msg.type === 'image' || msg.type === 'sticker') && (msg.imageUrl || msg.mediaUrl) && (
          <div className="mb-2 overflow-hidden rounded-xl border border-white/20 shadow-sm">
            <a href={msg.mediaUrl || msg.imageUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={msg.imageUrl || msg.mediaUrl}
                alt={msg.text ?? ''}
                className={msg.type === 'sticker' ? 'max-h-36 max-w-36 object-contain' : 'max-h-56 w-full object-cover hover:scale-102 transition-transform'}
              />
            </a>
          </div>
        )}

        {/* Video */}
        {msg.type === 'video' && (msg.mediaUrl || msg.imageUrl) && (
          <div className="mb-2 overflow-hidden rounded-xl border border-white/20 shadow-sm">
            <video
              src={msg.mediaUrl || msg.imageUrl}
              controls
              className="max-h-60 w-full rounded-xl object-contain bg-black/60"
            />
          </div>
        )}

        {/* Document */}
        {msg.type === 'doc' && (
          <a
            href={msg.mediaUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            download={msg.docName}
            className="mb-1 flex items-center gap-3 rounded-xl bg-black/5 p-2.5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-base-c/40"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-danger-500/15 text-danger-600 dark:text-danger-400">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{msg.docName || 'Document'}</p>
              <p className="text-[10px] opacity-75">{msg.docSize || 'File attachment'}</p>
            </div>
            <Download className="h-4 w-4 opacity-70" />
          </a>
        )}

        {/* Voice / Audio */}
        {msg.type === 'voice' && (
          <div className="py-1">
            {msg.mediaUrl ? (
              <audio src={msg.mediaUrl} controls className="h-8 w-full max-w-[240px]" />
            ) : (
              <div className="flex items-center gap-3 py-1">
                <button className="grid h-9 w-9 place-items-center rounded-full bg-white/25 hover:bg-white/30 text-current transition-all shadow-xs">
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </button>
                <div className="flex items-center gap-0.5">
                  {[4, 10, 16, 8, 14, 20, 10, 12, 18, 8, 14, 10, 16, 8, 12, 6].map((h, i) => (
                    <span
                      key={i}
                      className="w-0.5 rounded-full bg-current opacity-70"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono opacity-80">{msg.voiceDuration || '0:15'}</span>
              </div>
            )}
          </div>
        )}

        {/* Text content */}
        {msg.text && (
          <p className={cx('leading-relaxed whitespace-pre-wrap', msg.type === 'text' ? 'text-sm font-medium' : 'text-xs mt-1.5 opacity-90')}>
            {msg.text}
          </p>
        )}

        {/* Timestamp & Read Status */}
        <div
          className={cx(
            'mt-1.5 flex items-center justify-end gap-1 text-[10px] font-medium',
            isMe ? 'text-white/80' : 'text-muted-c',
          )}
        >
          {msg.isAISuggested && (
            <span className="flex items-center gap-0.5 text-violet-400" title="AI Suggested Response">
              <Sparkles className="h-3 w-3" />
            </span>
          )}
          <span>{msg.time}</span>
          {isMe && StatusIcon && <StatusIcon className="h-3.5 w-3.5 text-white/90" />}
        </div>
      </div>
    </div>
  );
}

function SystemMessage({
  msg,
  theme = 'whatsapp-dark',
}: {
  msg: Message;
  theme?: 'whatsapp-dark' | 'whatsapp-light' | 'glass';
}) {
  const isBooking = Boolean(msg.text?.includes('booked'));
  const isHandoff = Boolean(msg.text?.includes('Human') || msg.text?.includes('manual'));
  const Icon = isBooking ? CalendarPlus : isHandoff ? UserCheck : Bot;

  const getSystemStyle = () => {
    if (theme === 'whatsapp-dark') {
      return 'bg-[#182229] text-[#8696a0] border-[#222d34] shadow-xs';
    }
    if (theme === 'whatsapp-light') {
      return 'bg-[#ffeecd] text-[#54656f] border-[#e9edef] shadow-xs';
    }
    return 'bg-card-c/90 text-primary-c border-base-c/80 shadow-soft backdrop-blur-md';
  };

  return (
    <div className="flex justify-center my-3">
      <div className={cx('flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium max-w-md text-center', getSystemStyle())}>
        <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        <span>{msg.text}</span>
      </div>
    </div>
  );
}




