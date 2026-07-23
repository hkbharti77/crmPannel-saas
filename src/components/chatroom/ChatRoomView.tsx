import { useState, useRef, useEffect } from 'react';
import { GlassCard, Avatar, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { MESSAGES, AI_SUGGESTIONS, LEAD_CONTEXT, type Message } from './chatData';
import { MessageBubble } from './MessageBubble';
import { AiSuggestions } from './AiSuggestions';
import { LeadContextPanel } from './LeadContextPanel';
import { MessageComposer } from './MessageComposer';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Bot,
  UserCheck,
  Info,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

export function ChatRoomView({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [draft, setDraft] = useState('');
  const [botMode, setBotMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [showContext, setShowContext] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const currentSuggestions = AI_SUGGESTIONS;

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `m${prev.length + 1}`,
        sender: botMode ? 'bot' : 'me',
        type: 'text',
        text,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        isAISuggested: false,
      },
    ]);
  };

  const handlePickSuggestion = (text: string) => {
    setDraft(text);
    setShowSuggestions(false);
  };

  const handleRegenerate = () => {
    setSuggestionIdx((i) => (i + 1) % 3);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl p-2 lg:p-4">
      <div className="flex w-full gap-0 overflow-hidden rounded-xl2 border border-base-c glass lg:gap-4 lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
        {/* Main chat */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl2 border border-base-c bg-card-c lg:glass">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-base-c px-3 py-2.5 lg:px-4">
            <button
              onClick={onBack}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"
              aria-label="Back to inbox"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="relative">
              <Avatar name={LEAD_CONTEXT.name} size={40} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success-500 ring-2 ring-card-c" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary-c">{LEAD_CONTEXT.name}</p>
              <p className="truncate text-xs text-success-600 dark:text-success-400">Online</p>
            </div>

            <div className="flex items-center gap-0.5">
              <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
                <Phone className="h-4 w-4" />
              </button>
              <button className="hidden h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800 sm:grid">
                <Video className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowContext((s) => !s)}
                className={cx(
                  'grid h-8 w-8 place-items-center rounded-lg transition-colors',
                  showContext
                    ? 'text-primary-600 bg-primary-500/10 dark:text-primary-400'
                    : 'text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800',
                )}
                aria-label="Toggle lead panel"
              >
                {showContext ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </button>
              <button className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-3 scrollbar-thin lg:p-4"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(124,58,237,0.04), transparent 50%), radial-gradient(circle at 80% 20%, rgba(37,99,235,0.04), transparent 50%)',
            }}
          >
            {/* Date separator */}
            <div className="flex justify-center">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-muted-c dark:bg-ink-800">
                Today · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Typing indicator */}
            {botMode && (
              <div className="flex items-end gap-2">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary-500/15">
                  <Bot className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-secondary-500/10 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-secondary-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-secondary-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-secondary-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* AI suggestions */}
          {showSuggestions && !botMode && (
            <AiSuggestions
              suggestions={currentSuggestions}
              onPick={handlePickSuggestion}
              onDismiss={() => setShowSuggestions(false)}
              onRegenerate={handleRegenerate}
            />
          )}

          {/* Composer */}
          <MessageComposer
            onSend={handleSend}
            draft={draft}
            setDraft={setDraft}
            botMode={botMode}
            onToggleBot={() => {
              setBotMode((b) => !b);
              setShowSuggestions(false);
            }}
          />
        </div>

        {/* Lead context panel */}
        {showContext && (
          <div className="hidden w-72 shrink-0 overflow-hidden rounded-xl2 border border-base-c bg-card-c xl:block lg:glass">
            <LeadContextPanel lead={LEAD_CONTEXT} />
          </div>
        )}
      </div>
    </div>
  );
}
