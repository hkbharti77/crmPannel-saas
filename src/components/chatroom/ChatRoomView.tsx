import { useState, useRef, useEffect } from 'react';
import { GlassCard, Avatar, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { AI_SUGGESTIONS, type Message } from './chatData';
import { MessageBubble } from './MessageBubble';
import { AiSuggestions } from './AiSuggestions';
import { LeadContextPanel } from './LeadContextPanel';
import { MessageComposer } from './MessageComposer';
import {
  fetchMessageHistory,
  fetchContactDetails,
  sendWhatsAppMessage,
  sendTenantMenu,
  toggleBotPaused,
  type ContactDTO,
} from '@/lib/messagesApi';
import {
  ArrowLeft,
  Bot,
  PanelRightClose,
  PanelRightOpen,
  MenuSquare,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';

import { useParams, useNavigate } from 'react-router-dom';

export function ChatRoomView() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate('/inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [contactDetails, setContactDetails] = useState<ContactDTO | null>(null);
  const [draft, setDraft] = useState('');
  const [botMode, setBotMode] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [showContext, setShowContext] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingMenu, setSendingMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    if (!contactId || !contactId.includes('-')) return;
    setLoadingHistory(true);

    const [contactRes, historyRes] = await Promise.all([
      fetchContactDetails(contactId),
      fetchMessageHistory(contactId),
    ]);

    setLoadingHistory(false);

    if (contactRes.data) {
      setContactDetails(contactRes.data);
      if (typeof contactRes.data.botPaused === 'boolean') {
        setBotMode(!contactRes.data.botPaused);
      }
    }

    if (historyRes.data && historyRes.data.length > 0) {
      const converted: Message[] = historyRes.data.map((m, index) => ({
        id: m.id || `msg-${index}`,
        sender: m.direction === 'OUTGOING' ? 'me' : 'them',
        type: 'text',
        text: m.content,
        time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
        status: 'read',
      }));
      setMessages(converted);
    } else {
      setMessages([]);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [contactId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const currentSuggestions = AI_SUGGESTIONS;

  const handleSend = async (text: string) => {
    const newMessage: Message = {
      id: `m${Date.now()}`,
      sender: botMode ? 'bot' : 'me',
      type: 'text',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isAISuggested: false,
    };
    setMessages((prev) => [...prev, newMessage]);

    if (contactId && contactId.includes('-')) {
      await sendWhatsAppMessage(contactId, text);
    }
  };

  const handleToggleBot = async () => {
    const nextMode = !botMode;
    setBotMode(nextMode);
    setShowSuggestions(!nextMode);

    if (contactId && contactId.includes('-')) {
      await toggleBotPaused(contactId, !nextMode);
    }
  };

  const handleSendMenu = async () => {
    if (!contactId || !contactId.includes('-')) return;
    setSendingMenu(true);
    await sendTenantMenu(contactId);
    setSendingMenu(false);
  };

  const handlePickSuggestion = (text: string) => {
    setDraft(text);
    setShowSuggestions(false);
  };

  const handleRegenerate = () => {
    setSuggestionIdx((i) => (i + 1) % 3);
  };

  const displayName = contactDetails?.name || contactDetails?.waId || 'WhatsApp Lead';
  const displayPhone = contactDetails?.phone || contactDetails?.waId || '';

  return (
    <div className="mx-auto flex h-[calc(100vh-4.5rem)] max-w-7xl p-2 lg:p-3 overflow-hidden">
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
              <Avatar name={displayName} size={40} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success-500 ring-2 ring-card-c" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary-c">{displayName}</p>
              <p className="truncate text-xs text-success-600 dark:text-success-400">
                {displayPhone ? `${displayPhone} · WhatsApp Live` : 'WhatsApp Live'}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {contactId && contactId.includes('-') && (
                <button
                  onClick={handleSendMenu}
                  disabled={sendingMenu}
                  className="flex items-center gap-1 text-xs font-medium rounded-lg border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20"
                >
                  <MenuSquare className="h-3.5 w-3.5" />
                  {sendingMenu ? 'Sending...' : 'Send Menu'}
                </button>
              )}

              <button
                onClick={loadData}
                disabled={loadingHistory}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 hover:text-primary-c dark:hover:bg-ink-800"
                title="Refresh messages"
              >
                <RefreshCw className={cx('h-4 w-4', loadingHistory && 'animate-spin')} />
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
                Today · Real WhatsApp Session
              </span>
            </div>

            {messages.length > 0 ? (
              messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-c">
                <MessageSquare className="h-10 w-10 opacity-30 mb-3" />
                <p className="text-sm font-semibold text-primary-c">No messages yet in this conversation</p>
                <p className="text-xs mt-1 text-muted-c">Send a message below or click "Send Menu" to trigger the WhatsApp bot menu.</p>
              </div>
            )}

            {/* Typing indicator */}
            {botMode && messages.length > 0 && (
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
            onToggleBot={handleToggleBot}
          />
        </div>

        {/* Lead context panel */}
        {showContext && (
          <div className="hidden w-72 shrink-0 overflow-hidden rounded-xl2 border border-base-c bg-card-c xl:block lg:glass">
            <LeadContextPanel contact={contactDetails} />
          </div>
        )}
      </div>
    </div>
  );
}
