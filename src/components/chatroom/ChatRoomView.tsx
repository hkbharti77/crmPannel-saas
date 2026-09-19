import { useState, useRef, useEffect, useCallback } from 'react';
import { useWebSocket, type WsIncomingMessage } from '@/hooks/useWebSocket';
import { Avatar } from '@/components/ui/primitives';
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
  UserCheck,
  PanelRightClose,
  PanelRightOpen,
  MenuSquare,
  RefreshCw,
  MessageSquare,
  IndianRupee,
} from 'lucide-react';
import { PaymentRequestModal } from '@/components/payments/PaymentRequestModal';
import { SendFlowModal } from './SendFlowModal';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';

export type ChatTheme = 'whatsapp-dark' | 'whatsapp-light';

export function ChatRoomView() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const onBack = () => navigate('/inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [contactDetails, setContactDetails] = useState<ContactDTO | null>(null);
  const [draft, setDraft] = useState('');
  const [botMode, setBotMode] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [, setSuggestionIdx] = useState<number>(0);
  const [showContext, setShowContext] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendingMenu, setSendingMenu] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSendFlowModalOpen, setIsSendFlowModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const shouldForceScrollRef = useRef<boolean>(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight <= 120;
  };

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  const chatTheme: ChatTheme = theme === 'dark' ? 'whatsapp-dark' : 'whatsapp-light';

  const displayName = contactDetails?.name || contactDetails?.phone || (contactId ? `Contact (${contactId.slice(0, 8)})` : 'WhatsApp Chat');
  const displayPhone = contactDetails?.phone || contactId || '';

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
      const converted: Message[] = historyRes.data.map((m, index) => {
        let type: 'text' | 'image' | 'video' | 'doc' | 'voice' | 'sticker' | 'system' = 'text';
        const mediaType = (m.mediaType || '').toUpperCase();
        if (mediaType === 'IMAGE' || mediaType === 'STICKER') {
          type = mediaType === 'STICKER' ? 'sticker' : 'image';
        } else if (mediaType === 'VIDEO') {
          type = 'video';
        } else if (mediaType === 'AUDIO' || mediaType === 'VOICE') {
          type = 'voice';
        } else if (mediaType === 'DOCUMENT' || mediaType === 'RAW') {
          type = 'doc';
        }

        return {
          id: m.id || `msg-${index}`,
          sender: m.direction === 'OUTGOING' ? 'me' : 'them',
          type,
          text: m.content,
          imageUrl: m.mediaUrl || m.thumbnailUrl,
          mediaUrl: m.mediaUrl,
          docName: m.fileName || 'Attachment',
          docSize: m.fileSize ? (m.fileSize > 1024 * 1024 ? `${(m.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(m.fileSize / 1024)} KB`) : undefined,
          time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
          status: 'read',
        };
      });
      setMessages(converted);
    } else {
      setMessages([]);
    }
  };

  useEffect(() => {
    shouldForceScrollRef.current = true;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  // ── Real-time WebSocket listener ──────────────────────────────────
  const handleWsMessage = useCallback((msg: WsIncomingMessage) => {
    if (!contactId || !msg.contactId) return;

    // Case-insensitive UUID / phone matching
    const targetContactId = contactId.toLowerCase().trim();
    const incomingContactId = msg.contactId.toLowerCase().trim();

    if (incomingContactId !== targetContactId) return;

    const isIncoming = msg.direction === 'INCOMING';
    const isOutgoing = msg.direction === 'OUTGOING';

    let type: 'text' | 'image' | 'video' | 'doc' | 'voice' | 'sticker' | 'system' = 'text';
    const mediaType = (msg.mediaType || '').toUpperCase();
    if (mediaType === 'IMAGE' || mediaType === 'STICKER') {
      type = mediaType === 'STICKER' ? 'sticker' : 'image';
    } else if (mediaType === 'VIDEO') {
      type = 'video';
    } else if (mediaType === 'AUDIO' || mediaType === 'VOICE') {
      type = 'voice';
    } else if (mediaType === 'DOCUMENT' || mediaType === 'RAW') {
      type = 'doc';
    }

    const newMessage: Message = {
      id: msg.id || `ws-${Date.now()}-${Math.random()}`,
      sender: isIncoming ? 'them' : (isOutgoing ? 'me' : (botMode ? 'bot' : 'me')),
      type,
      text: msg.content,
      imageUrl: msg.mediaUrl || msg.thumbnailUrl,
      mediaUrl: msg.mediaUrl,
      docName: msg.fileName || 'Attachment',
      docSize: msg.fileSize ? (msg.fileSize > 1024 * 1024 ? `${(msg.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(msg.fileSize / 1024)} KB`) : undefined,
      time: msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
    };

    setMessages((prev) => {
      if (prev.some((m) => m.id === newMessage.id || (m.text === newMessage.text && Math.abs(Date.now() - (parseInt(m.id.replace('m', '')) || 0)) < 3000))) {
        return prev;
      }
      return [...prev, newMessage];
    });
  }, [contactId, botMode]);

  useWebSocket(handleWsMessage);

  useEffect(() => {
    if (messages.length > 0) {
      if (shouldForceScrollRef.current || isAtBottomRef.current) {
        scrollToBottom();
        shouldForceScrollRef.current = false;
      }
    }
  }, [messages, scrollToBottom]);

  const currentSuggestions = AI_SUGGESTIONS;

  const handleSend = async (text: string) => {
    shouldForceScrollRef.current = true;
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
    if (togglingBot) return;
    setTogglingBot(true);
    const nextMode = !botMode;
    setBotMode(nextMode);
    setShowSuggestions(!nextMode);

    const systemMsg: Message = {
      id: `sys-${Date.now()}`,
      sender: 'system',
      type: 'system',
      text: nextMode ? '🤖 AI Bot Resumed — Automatically handling responses' : '👤 Human Takeover — You are replying manually',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, systemMsg]);

    if (contactId && contactId.includes('-')) {
      await toggleBotPaused(contactId, !nextMode);
    }
    setTogglingBot(false);
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
    setSuggestionIdx((i: number) => (i + 1) % 3);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-3 p-2 sm:p-4">
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Main Chat Area */}
        <div className={cx(
          'flex flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm transition-colors duration-200',
          chatTheme === 'whatsapp-dark' ? 'border-[#222d34]' : 'border-[#e9edef]'
        )}>
          {/* Header */}
          <div className={cx(
            'flex items-center justify-between border-b px-3 sm:px-4 py-2.5 transition-colors duration-200',
            chatTheme === 'whatsapp-dark'
              ? 'bg-[#202c33] text-[#e9edef] border-[#222d34]'
              : 'bg-[#f0f2f5] text-[#111b21] border-[#e9edef]'
          )}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={onBack}
                className={cx(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors',
                  chatTheme === 'whatsapp-dark'
                    ? 'hover:bg-[#374248] text-[#aebac1]'
                    : 'hover:bg-[#e9edef] text-[#54656f]'
                )}
                title="Back to inbox"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="relative shrink-0">
                <Avatar name={displayName} size="md" className="ring-2 ring-emerald-500/30" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm sm:text-base font-semibold">{displayName}</h2>
                  <span className="hidden sm:inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Online
                  </span>
                </div>
                <p className={cx(
                  'truncate text-xs',
                  chatTheme === 'whatsapp-dark' ? 'text-[#8696a0]' : 'text-[#667781]'
                )}>
                  {displayPhone}
                </p>
              </div>
            </div>

            {/* Header Right Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handleToggleBot}
                disabled={togglingBot}
                className={cx(
                  'flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50',
                  botMode
                    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-xs'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                )}
              >
                {botMode ? (
                  <>
                    {togglingBot ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5 shrink-0" />}
                    <span className="hidden xs:inline sm:inline">AI Bot Active</span>
                  </>
                ) : (
                  <>
                    {togglingBot ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5 shrink-0" />}
                    <span className="hidden xs:inline sm:inline">Human Mode</span>
                  </>
                )}
              </button>

              <button
                onClick={loadData}
                disabled={loadingHistory}
                className={cx(
                  'grid h-8 w-8 place-items-center rounded-lg transition-colors',
                  chatTheme === 'whatsapp-dark'
                    ? 'hover:bg-[#374248] text-[#aebac1]'
                    : 'hover:bg-[#e9edef] text-[#54656f]'
                )}
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
                    : chatTheme === 'whatsapp-dark'
                      ? 'hover:bg-[#374248] text-[#aebac1]'
                      : 'hover:bg-[#e9edef] text-[#54656f]'
                )}
                aria-label="Toggle lead panel"
              >
                {showContext ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Messages Canvas */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className={cx(
              'flex-1 space-y-3 overflow-y-auto p-3 scrollbar-thin lg:p-4 transition-colors duration-200',
              chatTheme === 'whatsapp-dark' ? 'bg-[#0b141a]' : 'bg-[#efeae2]'
            )}
            style={{
              backgroundImage: chatTheme === 'whatsapp-dark'
                ? 'radial-gradient(circle at 50% 50%, rgba(18, 28, 36, 0.5), transparent)'
                : 'radial-gradient(circle at 50% 50%, rgba(220, 215, 205, 0.4), transparent)',
            }}
          >
            {/* Encryption & Session Badge */}
            <div className="flex justify-center my-1">
              <span className={cx(
                'rounded-lg px-3 py-1 text-[11px] font-medium border shadow-xs text-center max-w-md',
                chatTheme === 'whatsapp-dark'
                  ? 'bg-[#182229] text-[#8696a0] border-[#222d34]'
                  : 'bg-[#ffffff] text-[#54656f] border-[#e9edef]'
              )}>
                🔒 End-to-End Encrypted · Official WhatsApp API Session
              </span>
            </div>

            {messages.length > 0 ? (
              messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} theme={chatTheme} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-c">
                <MessageSquare className="h-12 w-12 opacity-30 mb-3 text-emerald-500" />
                <p className="text-base font-bold">No messages yet in this conversation</p>
                <p className="text-xs mt-1 max-w-sm opacity-70">Send a message below or click "Send Menu" to initiate automated customer onboarding.</p>
              </div>
            )}

            {/* AI Typing Animation Indicator */}
            {botMode && messages.length > 0 && (
              <div className="flex items-end gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-soft">
                  <Bot className="h-4 w-4" />
                </div>
                <div className={cx(
                  'flex items-center gap-1.5 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs border',
                  chatTheme === 'whatsapp-dark'
                    ? 'bg-[#202c33] border-[#222d34]'
                    : 'bg-[#ffffff] border-[#e9edef]'
                )}>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* AI Suggestions Floating Bar */}
          {showSuggestions && !botMode && (
            <AiSuggestions
              suggestions={currentSuggestions}
              onPick={handlePickSuggestion}
              onDismiss={() => setShowSuggestions(false)}
              onRegenerate={handleRegenerate}
            />
          )}

          {/* Message Composer */}
          <MessageComposer
            onSend={handleSend}
            draft={draft}
            setDraft={setDraft}
            botMode={botMode}
            onToggleBot={handleToggleBot}
            theme={chatTheme}
            onRequestPayment={() => setIsPaymentModalOpen(true)}
            onSendMenu={contactId && contactId.includes('-') ? handleSendMenu : undefined}
            onSendFlow={contactId && contactId.includes('-') ? () => setIsSendFlowModalOpen(true) : undefined}
            sendingMenu={sendingMenu}
          />
        </div>

        {/* Lead Context Drawer */}
        {showContext && (
          <div className="hidden w-80 shrink-0 overflow-hidden rounded-2xl border border-base-c/80 bg-card-c/95 lg:backdrop-blur-md xl:block shadow-md">
            <LeadContextPanel
              contact={contactDetails}
              onRequestPayment={() => setIsPaymentModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Payment Request Modal */}
      <PaymentRequestModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customerWaId={contactDetails?.phone || contactDetails?.waId || contactId || ''}
        customerName={contactDetails?.name || ''}
        onSuccess={(order) => {
          loadData();
          const payMsg: Message = {
            id: `pay-${Date.now()}`,
            sender: 'me',
            type: 'text',
            text: `💳 Payment Bill Sent: ₹${(order.totalMinor / 100).toFixed(2)} (Ref: ${order.referenceId})`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
          };
          setMessages((prev) => [...prev, payMsg]);
        }}
      />

      {/* Send Flow Modal */}
      {contactId && contactId.includes('-') && (
        <SendFlowModal
          isOpen={isSendFlowModalOpen}
          onClose={() => setIsSendFlowModalOpen(false)}
          contactId={contactId}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
