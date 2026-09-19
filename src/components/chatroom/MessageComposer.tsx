import { useRef, useState } from 'react';
import { cx } from '@/lib/types';
import { Paperclip, Smile, Image as ImageIcon, Mic, Send, X, Bot, Zap, UserCheck, ShieldAlert, IndianRupee, MenuSquare, FormInput } from 'lucide-react';

export function MessageComposer({
  onSend,
  draft,
  setDraft,
  botMode,
  onToggleBot,
  onRequestPayment,
  onSendMenu,
  onSendFlow,
  sendingMenu = false,
  theme = 'whatsapp-dark',
}: {
  onSend: (text: string) => void;
  draft: string;
  setDraft: (s: string) => void;
  botMode: boolean;
  onToggleBot: () => void;
  onRequestPayment?: () => void;
  onSendMenu?: () => void;
  onSendFlow?: () => void;
  sendingMenu?: boolean;
  theme?: 'whatsapp-dark' | 'whatsapp-light' | 'glass';
}) {
  const [showAttach, setShowAttach] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (botMode || !draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  const quickTemplates = [
    'Hello! How can we assist you today?',
    'Thanks for reaching out! A representative will connect shortly.',
    'Could you please share your preferred appointment time slot?',
  ];

  const getContainerStyle = () => {
    if (theme === 'whatsapp-dark') return 'bg-[#202c33] border-[#222d34] text-[#e9edef]';
    if (theme === 'whatsapp-light') return 'bg-[#f0f2f5] border-[#e9edef] text-[#111b21]';
    return 'bg-card-c/90 backdrop-blur-md border-base-c/80';
  };

  const getInputStyle = () => {
    if (theme === 'whatsapp-dark') return 'bg-[#2a3942] border-none text-[#e9edef] placeholder-[#8696a0]';
    if (theme === 'whatsapp-light') return 'bg-[#ffffff] border-none text-[#111b21] placeholder-[#54656f]';
    return 'bg-card-c border-base-c text-primary-c placeholder:text-muted-c';
  };

  return (
    <div className={cx('border-t p-3 lg:p-4 transition-colors', getContainerStyle())}>
      {botMode ? (
        /* ── BOT ACTIVE: locked state ─────────────────────────── */
        <div className={cx(
          'flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 shadow-soft',
          theme === 'whatsapp-dark'
            ? 'border-[#005c4b]/40 bg-[#111b21]/80 text-[#e9edef]'
            : theme === 'whatsapp-light'
              ? 'border-emerald-500/30 bg-[#ffffff]/90 text-[#111b21]'
              : 'border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-purple-500/10'
        )}>
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
            <ShieldAlert className="h-4 w-4" />
            <span>AI Bot is handling real-time customer replies</span>
          </div>
          <p className="text-[11px] opacity-75 text-center max-w-sm">
            AI Assistant is automatically analyzing incoming WhatsApp queries. Switch to Human Takeover to send manual messages.
          </p>
          <button
            onClick={onToggleBot}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:scale-105 btn-tactile"
          >
            <UserCheck className="h-4 w-4" />
            Take Over — Switch to Human Mode
          </button>
        </div>
      ) : (
        /* ── HUMAN MODE: full composer ────────────────────────── */
        <>
          {/* Action & Status toolbar */}
          <div className="mb-2.5 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Human Mode Active
              </div>

              <button
                onClick={onToggleBot}
                className="flex items-center gap-1.5 rounded-xl border border-base-c bg-card-c px-3 py-1 text-[11px] font-semibold hover:border-emerald-500/40 transition-all shadow-xs"
                title="Hand back conversation to AI Bot"
              >
                <Bot className="h-3.5 w-3.5 text-emerald-500" />
                Hand Back to AI Bot
              </button>

              {/* Send Menu Button moved down */}
              {onSendMenu && (
                <button
                  onClick={onSendMenu}
                  disabled={sendingMenu}
                  className="flex items-center gap-1.5 text-[11px] font-semibold rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 btn-tactile shadow-xs transition-all cursor-pointer"
                  title="Send Automated Interactive Menu Card"
                >
                  <MenuSquare className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <span>{sendingMenu ? 'Sending…' : 'Send Menu'}</span>
                </button>
              )}

              {/* Send Flow Button */}
              {onSendFlow && (
                <button
                  onClick={onSendFlow}
                  className="flex items-center gap-1.5 text-[11px] font-semibold rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 btn-tactile shadow-xs transition-all cursor-pointer"
                  title="Send interactive WhatsApp Flow"
                >
                  <FormInput className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                  <span>Send Flow</span>
                </button>
              )}

              {/* Request Payment Button moved down */}
              {onRequestPayment && (
                <button
                  onClick={onRequestPayment}
                  className="flex items-center gap-1.5 text-[11px] font-bold rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 btn-tactile shadow-xs transition-all cursor-pointer"
                  title="Send WhatsApp Bill & Payment Request"
                >
                  <IndianRupee className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>Request Payment</span>
                </button>
              )}
            </div>

            {/* Quick Template Chips */}
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickTemplates.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => setDraft(t)}
                  className="truncate max-w-[180px] rounded-lg border border-base-c bg-slate-100 dark:bg-ink-800/80 px-2.5 py-1 text-[10px] font-medium text-muted-c hover:text-primary-c hover:border-primary-500/40 transition-colors"
                >
                  <Zap className="h-2.5 w-2.5 inline mr-1 text-amber-500" />
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Attachment menu */}
          {showAttach && (
            <div className="mb-2.5 flex items-center gap-2 rounded-xl border border-base-c/80 bg-card-c p-2.5 shadow-soft animate-slide-down flex-wrap">
              {[
                { icon: ImageIcon, label: 'Photo & Video', color: 'text-emerald-500', action: () => fileRef.current?.click() },
                { icon: Paperclip, label: 'Document', color: 'text-indigo-500', action: () => fileRef.current?.click() },
                { icon: Mic, label: 'Voice Note', color: 'text-amber-500', action: () => fileRef.current?.click() },
                ...(onRequestPayment ? [{ icon: IndianRupee, label: 'Request Payment', color: 'text-emerald-600', action: onRequestPayment }] : []),
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    onClick={() => {
                      setShowAttach(false);
                      a.action();
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-secondary-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors"
                  >
                    <Icon className={cx('h-4 w-4', a.color)} /> {a.label}
                  </button>
                );
              })}
              <button
                onClick={() => setShowAttach(false)}
                className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-muted-c hover:text-primary-c"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className={cx('flex items-center gap-2 rounded-2xl px-3.5 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-emerald-500/30', getInputStyle())}>
            <button
              onClick={() => setShowAttach((s) => !s)}
              className="opacity-70 transition-opacity hover:opacity-100 p-1"
              aria-label="Attach File"
              title="Attach File / Document"
            >
              <Paperclip className="h-4.5 w-4.5" />
            </button>
            <input ref={fileRef} type="file" className="hidden" />

            <button
              className="opacity-70 transition-opacity hover:opacity-100 p-1"
              aria-label="Emoji Picker"
              title="Insert Emoji"
            >
              <Smile className="h-4.5 w-4.5" />
            </button>

            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message or paste AI prompt…"
              className="flex-1 bg-transparent text-sm font-medium outline-none border-none focus:outline-none focus:ring-0"
            />

            <button
              className="opacity-70 transition-opacity hover:opacity-100 p-1"
              aria-label="Record Voice Message"
              title="Record Voice Note"
            >
              <Mic className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className={cx(
                'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white transition-all shadow-sm',
                draft.trim()
                  ? 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95 shadow-emerald-500/25'
                  : 'bg-slate-400/50 opacity-60 cursor-not-allowed',
              )}
              aria-label="Send Message"
              title="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}


