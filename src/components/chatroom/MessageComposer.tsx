import { useRef, useState } from 'react';
import { cx } from '@/lib/types';
import { Paperclip, Smile, Image as ImageIcon, Mic, Send, X, Bot, Zap, UserCheck, ShieldAlert } from 'lucide-react';

export function MessageComposer({
  onSend,
  draft,
  setDraft,
  botMode,
  onToggleBot,
}: {
  onSend: (text: string) => void;
  draft: string;
  setDraft: (s: string) => void;
  botMode: boolean;
  onToggleBot: () => void;
}) {
  const [showAttach, setShowAttach] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (botMode || !draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <div className="border-t border-base-c p-3">
      {botMode ? (
        /* ── BOT ACTIVE: locked state ─────────────────────────── */
        <div className="flex flex-col items-center gap-2.5 rounded-xl2 border border-secondary-500/20 bg-secondary-500/5 px-4 py-4">
          <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-xs font-semibold">Bot is handling this conversation</span>
          </div>
          <p className="text-[11px] text-muted-c text-center max-w-xs">
            The AI bot is actively replying to this customer. To reply manually, switch to Human Mode first.
          </p>
          <button
            onClick={onToggleBot}
            className="flex items-center gap-1.5 rounded-lg bg-success-500/15 px-4 py-2 text-xs font-semibold text-success-600 dark:text-success-400 ring-1 ring-success-500/30 hover:bg-success-500/25 transition-all"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Take Over — Switch to Human Mode
          </button>
        </div>
      ) : (
        /* ── HUMAN MODE: full composer ────────────────────────── */
        <>
          {/* Mode bar */}
          <div className="mb-2 flex items-center gap-2">
            <button
              onClick={onToggleBot}
              className="flex items-center gap-1.5 rounded-lg border border-base-c px-2.5 py-1 text-[11px] font-medium text-muted-c hover:text-primary-c transition-all"
            >
              <Bot className="h-3 w-3" />
              Hand back to AI Bot
            </button>
            <div className="flex items-center gap-1 rounded-lg bg-success-500/10 px-2 py-0.5 text-[10px] font-semibold text-success-600 dark:text-success-400">
              <UserCheck className="h-2.5 w-2.5" />
              You are replying
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-base-c px-2.5 py-1 text-[11px] font-medium text-muted-c transition-colors hover:text-primary-c">
              <Zap className="h-3 w-3" /> Quick templates
            </button>
          </div>

          {/* Attach menu */}
          {showAttach && (
            <div className="mb-2 flex items-center gap-2 rounded-xl2 border border-base-c p-2 animate-slide-down">
              {[
                { icon: ImageIcon, label: 'Photo', color: 'text-success-600' },
                { icon: Paperclip, label: 'Document', color: 'text-primary-600' },
                { icon: Mic, label: 'Voice', color: 'text-secondary-600' },
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    onClick={() => setShowAttach(false)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-secondary-c hover:bg-slate-100 dark:hover:bg-ink-800"
                  >
                    <Icon className={cx('h-3.5 w-3.5', a.color)} /> {a.label}
                  </button>
                );
              })}
              <button
                onClick={() => setShowAttach(false)}
                className="ml-auto grid h-6 w-6 place-items-center rounded text-muted-c hover:text-primary-c"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Input bar */}
          <div className="flex items-center gap-2 rounded-xl2 border border-base-c bg-card-c px-3 py-2 transition-colors focus-within:border-primary-500/40 focus-within:ring-2 focus-within:ring-primary-500/15">
            <button
              onClick={() => setShowAttach((s) => !s)}
              className="text-muted-c transition-colors hover:text-primary-c"
              aria-label="Attach"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" className="hidden" />

            <button
              className="text-muted-c transition-colors hover:text-primary-c"
              aria-label="Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>

            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message…"
              className="flex-1 bg-transparent text-sm text-primary-c placeholder:text-muted-c focus:outline-none"
            />

            <button
              className="text-muted-c transition-colors hover:text-primary-c"
              aria-label="Voice message"
            >
              <Mic className="h-4 w-4" />
            </button>

            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className={cx(
                'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white transition-all',
                draft.trim()
                  ? 'bg-gradient-accent hover:scale-105 active:scale-95'
                  : 'bg-slate-300 dark:bg-ink-700 cursor-not-allowed',
              )}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
