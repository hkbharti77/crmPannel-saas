import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket, type WsIncomingMessage } from '@/hooks/useWebSocket';
import { GlassCard, Avatar, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { InboxToolbar, type FilterId, type ChannelId } from './InboxToolbar';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from './inboxTypes';
import { useTheme } from '@/context/ThemeContext';
import {
  fetchActiveChats,
  fetchMessageHistory,
  sendWhatsAppMessage,
  sendTenantMenu,
  toggleBotPaused,
  resolveLiveChat,
  type ApiMessage,
} from '@/lib/messagesApi';
import {
  fetchWebChatSessions,
  fetchWebChatSessionDetails,
  deleteWebChatSession,
  type WebChatSession,
  type WebChatMessage,
} from '@/lib/webchatApi';
import {
  MessageSquare,
  Bot,
  Globe,
  Send,
  RefreshCw,
  Trash2,
  MenuSquare,
  Check,
  UserCheck,
  Users,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Returns a human-friendly relative time string, e.g. "2m ago", "3h ago", "2d ago" */
function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000); // seconds
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function InboxView() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<ChannelId>('whatsapp');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // WhatsApp states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  // WebChat states
  const [webSessions, setWebSessions] = useState<WebChatSession[]>([]);
  const [loadingWeb, setLoadingWeb] = useState(false);
  const [_webError, setWebError] = useState<string | null>(null);

  const loadChats = async () => {
    setLoading(true);
    const { data } = await fetchActiveChats();
    setLoading(false);

    if (data) {
      const now = Date.now();
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

      // Only include contacts with actual messages / active chat history
      const activeData = data.filter(
        (c) => c.lastMessage && c.lastMessage !== 'No messages yet' && c.time
      );

      const mapped: Conversation[] = activeData.map((c) => {
        const lastMsgTime = c.time ? new Date(c.time).getTime() : 0;
        const isWithin24h = lastMsgTime > 0 && (now - lastMsgTime) < TWENTY_FOUR_HOURS;

        return {
          id: String(c.id),
          name: c.name || 'WhatsApp Contact',
          phone: String(c.id),
          lastMessage: c.lastMessage,
          lastMessageSender: 'them',
          timestamp: c.time ? timeAgo(new Date(c.time)) : 'Just now',
          lastMessageTime: c.time || undefined,
          unread: c.unread || 0,
          // Green dot only if last message was within 24h (active WhatsApp session)
          status: isWithin24h ? 'online' : 'offline',
          tags: (c.tags || []) as ('NEW' | 'HOT' | 'VIP' | 'RETURNING' | 'BOT')[],
          // botPaused=true means human took over; botPaused=false means bot is active
          isBotHandled: c.botPaused === false,
          leadId: c.leadId,
          leadStatus: c.leadStatus,
          assignedTo: c.assignedAgentName,
        };
      });
      setConversations(mapped);
      if (!selectedId && mapped.length > 0) {
        setSelectedId(mapped[0].id);
      } else if (mapped.length === 0) {
        setSelectedId(null);
      }
    }
  };

  const loadWebSessions = async () => {
    setLoadingWeb(true);
    setWebError(null);
    const { data, error } = await fetchWebChatSessions();
    setLoadingWeb(false);

    if (error) {
      setWebError(error);
    } else {
      const list = data || [];
      setWebSessions(list);
      if (list.length > 0) {
        setSelectedId((prev) => {
          const exists = list.some((s) => s.id === prev);
          return exists ? prev : list[0].id;
        });
      } else {
        setSelectedId(null);
      }
    }
  };

  useEffect(() => {
    if (channel === 'whatsapp') {
      loadChats();
    } else {
      loadWebSessions();
      const interval = setInterval(() => {
        loadWebSessions();
      }, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  // ── Real-time WebSocket integration ──────────────────────────────
  const [wsMessages, setWsMessages] = useState<Record<string, ApiMessage[]>>({});

  const handleWsMessage = useCallback((msg: WsIncomingMessage) => {
    if (channel !== 'whatsapp') return;

    const contactId = msg.contactId;
    if (!contactId) return;

    const now = new Date();

    setConversations((prev) => {
      const exists = prev.find((c) => c.id === contactId);
      if (exists) {
        const updated = prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                lastMessage: msg.content,
                timestamp: 'Just now',
                lastMessageTime: now.toISOString(),
                status: 'online' as const,
                unread: msg.direction === 'INCOMING' ? c.unread + 1 : c.unread,
              }
            : c
        );
        return updated.sort((a, b) => {
          if (a.id === contactId) return -1;
          if (b.id === contactId) return 1;
          return 0;
        });
      } else {
        const newConv: Conversation = {
          id: contactId,
          name: msg.contactName || 'WhatsApp Contact',
          phone: contactId,
          lastMessage: msg.content,
          lastMessageSender: msg.direction === 'INCOMING' ? 'them' : 'me',
          timestamp: 'Just now',
          lastMessageTime: now.toISOString(),
          unread: msg.direction === 'INCOMING' ? 1 : 0,
          status: 'online',
          tags: ['NEW', 'HOT'],
          isBotHandled: true,
        };
        return [newConv, ...prev];
      }
    });

    const apiMsg: ApiMessage = {
      id: msg.id || 'ws-' + Date.now(),
      content: msg.content,
      direction: msg.direction || 'INCOMING',
      timestamp: msg.timestamp || now.toISOString(),
    };
    setWsMessages((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), apiMsg],
    }));
  }, [channel]);

  useWebSocket(handleWsMessage);

  const counts = useMemo(() => {
    const all = conversations.length;
    const unread = conversations.filter((c) => c.unread > 0).length;
    const bot = conversations.filter((c) => c.isBotHandled).length;
    const vip = conversations.filter((c) => c.tags.includes('VIP')).length;
    const mine = conversations.filter((c) => c.assignedTo === 'Arjun').length;
    const unassigned = conversations.filter((c) => c.leadStatus === 'UNASSIGNED' || !c.assignedTo).length;

    return { all, unread, bot, vip, mine, unassigned };
  }, [conversations]);

  const filteredWhatsApp = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === 'unread' && c.unread === 0) return false;
      if (filter === 'bot' && !c.isBotHandled) return false;
      if (filter === 'vip' && !c.tags.includes('VIP')) return false;
      if (filter === 'mine' && c.assignedTo !== 'Arjun') return false;
      if (filter === 'unassigned' && c.leadStatus !== 'UNASSIGNED' && c.assignedTo) return false;
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
  }, [conversations, filter, query]);

  const filteredWebSessions = useMemo(() => {
    return webSessions.filter((s) => {
      if (query) {
        const q = query.toLowerCase();
        return (
          s.sessionId.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (s.lastMessage && s.lastMessage.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [webSessions, query]);

  const selectedWa = conversations.find((c) => c.id === selectedId) ?? (conversations.length > 0 ? conversations[0] : null);
  const selectedWeb = webSessions.find((s) => s.id === selectedId) ?? (webSessions.length > 0 ? webSessions[0] : null);

  const [deleteSessionState, setDeleteSessionState] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });

  const handleDeleteWebSession = (id: string) => {
    setDeleteSessionState({ isOpen: true, id });
  };

  const confirmDeleteWebSession = async () => {
    const id = deleteSessionState.id;
    setDeleteSessionState({ isOpen: false, id: '' });
    if (!id) return;

    const { success } = await deleteWebChatSession(id);
    if (success) {
      setWebSessions((prev) => prev.filter((s) => s.id !== id));
      setSelectedId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl h-[calc(100vh-4rem)] p-2 sm:p-4 overflow-hidden">
      <div className="grid h-full gap-3 sm:gap-4 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] overflow-hidden">
        {/* Left: Conversation List Panel */}
        <div className={cx("flex h-full flex-col overflow-hidden space-y-3 bg-card-c/60 dark:bg-ink-900/40 p-3 rounded-2xl border border-base-c/80 shadow-xs", selectedId ? "hidden lg:flex" : "flex")}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary-c flex items-center gap-2">
                <span>Unified Inbox</span>
              </h2>
              <p className="text-xs text-muted-c">
                {channel === 'whatsapp'
                  ? `${counts.unread} unread · ${counts.bot} bot-handled`
                  : `${webSessions.length} active webchat sessions`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={channel === 'whatsapp' ? loadChats : loadWebSessions}
                disabled={channel === 'whatsapp' ? loading : loadingWeb}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors"
                title="Refresh sessions"
              >
                <RefreshCw className={cx('h-4 w-4', (loading || loadingWeb) && 'animate-spin')} />
              </button>
              <Badge variant={channel === 'whatsapp' ? 'success' : 'primary'} className="px-2.5 py-1 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {channel === 'whatsapp' ? 'Live WhatsApp' : 'Live WebChat'}
              </Badge>
            </div>
          </div>

          <InboxToolbar
            channel={channel}
            onChannel={(c) => {
              setChannel(c);
              setSelectedId(null);
            }}
            query={query}
            onQuery={setQuery}
            activeFilter={filter}
            onFilter={setFilter}
            counts={counts}
          />

          {/* List Area */}
          <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
            {channel === 'whatsapp' ? (
              filteredWhatsApp.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <MessageSquare className="h-12 w-12 text-emerald-500/40 mb-2" />
                  <p className="text-sm font-bold text-primary-c">No WhatsApp conversations found</p>
                  <p className="text-xs text-muted-c max-w-xs mt-1">Incoming WhatsApp messages will automatically show up here in real-time.</p>
                </div>
              ) : (
                filteredWhatsApp.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conv={c}
                    active={c.id === (selectedId || selectedWa?.id)}
                    onClick={() => setSelectedId(c.id)}
                  />
                ))
              )
            ) : filteredWebSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Globe className="h-12 w-12 text-indigo-500/40 mb-2" />
                <p className="text-sm font-bold text-primary-c">No WebChat widget sessions found</p>
                <p className="text-xs text-muted-c max-w-xs mt-1">Active customer sessions on your website widget will appear here.</p>
              </div>
            ) : (
              filteredWebSessions.map((s) => {
                const isSelected = s.id === (selectedId || selectedWeb?.id);
                const senderIcon = s.lastMessageSender === 'USER' ? (
                  <UserCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                );

                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={cx(
                      'group relative flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all border',
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/30 shadow-xs dark:bg-indigo-500/15'
                        : 'border-transparent hover:bg-slate-100/70 dark:hover:bg-ink-850/60 hover:border-base-c/50',
                    )}
                  >
                    {/* Active Left Accent Indicator */}
                    {isSelected && (
                      <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600 shadow-xs" />
                    )}

                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-600 text-white font-bold shadow-soft">
                      <Globe className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-primary-c">
                          {s.sessionId || 'Website Visitor'}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-c">
                          {s.updatedAt ? timeAgo(new Date(s.updatedAt)) : 'Recent'}
                        </span>
                      </div>

                      {/* Latest Message Snippet */}
                      <div className="mt-1 flex items-center gap-1.5 min-w-0">
                        {senderIcon}
                        <p className="truncate text-xs font-medium text-primary-c/90">
                          {s.lastMessage || 'No messages recorded'}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center gap-1">
                        <Badge variant="primary" className="text-[9px] py-0.5 px-1.5 font-bold">
                          <Bot className="h-2.5 w-2.5" /> WebBot Active
                        </Badge>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detail Preview Pane */}
        <div className={cx("h-full overflow-hidden", selectedId ? "block" : "hidden lg:block")}>
          {channel === 'whatsapp' ? (
            selectedWa ? (
              <ChatPreview
                conv={selectedWa}
                wsMessages={wsMessages[selectedWa.id] || []}
                onClearWsMessages={() => setWsMessages((prev) => ({ ...prev, [selectedWa.id]: [] }))}
                onOpenChat={() => navigate(`/chatroom/${selectedWa.id}`)}
                onBotToggle={async (newBotPaused) => {
                  await toggleBotPaused(selectedWa.id, newBotPaused);
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === selectedWa.id ? { ...c, isBotHandled: !newBotPaused } : c
                    )
                  );
                }}
                onBack={() => setSelectedId(null)}
              />
            ) : (
              <EmptyState />
            )
          ) : selectedWeb ? (
            <WebChatPreview
              session={selectedWeb}
              onDelete={() => handleDeleteWebSession(selectedWeb.id)}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Delete WebChat Session Modal */}
      <ConfirmModal
        isOpen={deleteSessionState.isOpen}
        title="Delete WebChat Thread"
        message="Are you sure you want to delete this WebChat session and message thread? This action cannot be undone."
        confirmText="Delete Thread"
        variant="danger"
        onConfirm={confirmDeleteWebSession}
        onCancel={() => setDeleteSessionState({ isOpen: false, id: '' })}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <GlassCard className="flex h-full flex-col items-center justify-center p-12 text-center rounded-2xl border border-base-c/80">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
        <MessageSquare className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-primary-c">Select a Conversation</h3>
      <p className="mt-1.5 max-w-xs text-xs text-muted-c leading-relaxed">
        Choose a WhatsApp or WebChat thread from the list on the left to preview real-time messages and quick controls.
      </p>
    </GlassCard>
  );
}

function ChatPreview({ conv, wsMessages, onClearWsMessages, onOpenChat, onBotToggle, onBack }: {
  conv: Conversation;
  wsMessages: ApiMessage[];
  onClearWsMessages: () => void;
  onOpenChat: () => void;
  onBotToggle: (newBotPaused: boolean) => Promise<void>;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [menuSending, setMenuSending] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);
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

  const loadHistory = async () => {
    if (!conv.id || !conv.id.includes('-')) return;
    const { data } = await fetchMessageHistory(conv.id);
    if (data && data.length > 0) {
      setMessages(data);
    }
  };

  useEffect(() => {
    shouldForceScrollRef.current = true;
    loadHistory();
    onClearWsMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.id]);

  useEffect(() => {
    if (wsMessages.length === 0) return;
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newMsgs = wsMessages.filter((m) => !existingIds.has(m.id));
      return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
    });
  }, [wsMessages]);

  // Auto-scroll to latest message on thread opening or when user is at bottom
  useEffect(() => {
    if (messages.length > 0) {
      if (shouldForceScrollRef.current || isAtBottomRef.current) {
        scrollToBottom();
        shouldForceScrollRef.current = false;
      }
    }
  }, [messages, scrollToBottom]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || sending) return;

    const textToSend = input.trim();
    setInput('');
    setSending(true);

    const { success } = await sendWhatsAppMessage(conv.id, textToSend);
    setSending(false);

    if (success) {
      shouldForceScrollRef.current = true;
      setMessages((prev) => [
        ...prev,
        {
          id: 'temp-' + Date.now(),
          content: textToSend,
          direction: 'OUTGOING',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSendMenu = async () => {
    setMenuSending(true);
    await sendTenantMenu(conv.id);
    setMenuSending(false);
  };

  return (
    <div className={cx(
      'flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-colors duration-200',
      isDark ? 'bg-[#0b141a] border-[#222d34]' : 'bg-[#efeae2] border-[#e9edef]'
    )}>
      {/* Header */}
      <div className={cx(
        'flex items-center gap-3 border-b px-4 py-3 transition-colors duration-200 shrink-0',
        isDark ? 'bg-[#202c33] text-[#e9edef] border-[#222d34]' : 'bg-[#f0f2f5] text-[#111b21] border-[#e9edef]'
      )}>
        <button
          onClick={onBack}
          className={cx(
            'lg:hidden p-1.5 -ml-1 rounded-lg transition-colors',
            isDark ? 'hover:bg-[#374248] text-[#aebac1]' : 'hover:bg-[#e9edef] text-[#54656f]'
          )}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="relative shrink-0">
          <Avatar name={conv.name} size={40} className="ring-2 ring-emerald-500/30" />
          <span className={cx(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card-c',
            conv.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
          )} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm sm:text-base font-bold">{conv.name}</p>
          <p className={cx(
            'truncate text-xs',
            isDark ? 'text-[#8696a0]' : 'text-[#667781]'
          )}>
            {conv.status === 'online' ? '🟢 Active WhatsApp Session (24h Window)' : '⚪ Session Expired'}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <button
            onClick={handleSendMenu}
            disabled={menuSending}
            className="flex items-center gap-1 text-xs font-semibold rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all shrink-0"
          >
            <MenuSquare className="h-3.5 w-3.5" />
            <span className="hidden xs:inline sm:inline">{menuSending ? 'Sending…' : 'Send Menu'}</span>
          </button>
          
          {conv.leadStatus === 'UNASSIGNED' && conv.leadId && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/v1/leads/${conv.leadId}/claim`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                  });
                  if (res.ok) {
                    window.location.reload();
                  } else {
                    alert('Could not claim lead.');
                  }
                } catch (err) {
                  console.error(err);
                }
              }}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-soft hover:bg-emerald-700 transition-all shrink-0"
            >
              <Users className="h-3.5 w-3.5" />
              Claim Lead
            </button>
          )}

          {/* Bot / Human Mode Toggle */}
          <button
            onClick={async () => {
              setTogglingBot(true);
              await onBotToggle(!conv.isBotHandled);
              setTogglingBot(false);
            }}
            disabled={togglingBot}
            title={conv.isBotHandled ? 'Switch to Human mode' : 'Switch to Bot mode'}
            className={cx(
              'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-50 shrink-0 shadow-xs',
              conv.isBotHandled ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'
            )}
          >
            {conv.isBotHandled ? (
              <><Bot className="h-3.5 w-3.5" />{togglingBot ? '…' : 'AI Bot Active'}</>
            ) : (
              <><UserCheck className="h-3.5 w-3.5" />{togglingBot ? '…' : 'Human Mode'}</>
            )}
          </button>

          {!conv.isBotHandled && (
            <button
              onClick={async () => {
                setTogglingBot(true);
                await resolveLiveChat(conv.id);
                await onBotToggle(false);
                setTogglingBot(false);
              }}
              disabled={togglingBot}
              title="Resolve support chat and resume bot"
              className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50 shrink-0"
            >
              <Check className="h-3.5 w-3.5" />
              {togglingBot ? '…' : 'Resolve Chat'}
            </button>
          )}

          {/* Open Full Chat Room Button */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1 rounded-lg bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/25 px-2.5 py-1.5 text-xs font-bold transition-all shrink-0 border border-emerald-500/30"
            title="Open full interactive chatroom"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Full View</span>
          </button>
        </div>
      </div>

      {/* Messages Canvas */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cx(
          'flex-1 space-y-3 overflow-y-auto p-3 sm:p-4 scrollbar-thin transition-colors duration-200',
          isDark ? 'bg-[#0b141a]' : 'bg-[#efeae2]'
        )}
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(circle at 50% 50%, rgba(18, 28, 36, 0.5), transparent)'
            : 'radial-gradient(circle at 50% 50%, rgba(220, 215, 205, 0.4), transparent)',
        }}
      >
        <div className="flex justify-center">
          <span className={cx(
            'rounded-lg px-3 py-1 text-[11px] font-medium border shadow-xs text-center',
            isDark ? 'bg-[#182229] text-[#8696a0] border-[#222d34]' : 'bg-[#ffffff] text-[#54656f] border-[#e9edef]'
          )}>
            🔒 Official WhatsApp API Session · Encrypted
          </span>
        </div>

        {messages.length > 0 ? (
          messages.map((m) => {
            const isOutgoing = m.direction === 'OUTGOING';
            return (
              <div
                key={m.id}
                className={cx('flex', isOutgoing ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cx(
                    'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-xs border',
                    isOutgoing
                      ? isDark
                        ? 'bg-[#005c4b] text-[#e9edef] border-[#005c4b] rounded-tr-xs'
                        : 'bg-[#d9fdd3] text-[#111b21] border-[#c2f6b8] rounded-tr-xs'
                      : isDark
                        ? 'bg-[#202c33] text-[#e9edef] border-[#222d34] rounded-tl-xs'
                        : 'bg-[#ffffff] text-[#111b21] border-[#e9edef] rounded-tl-xs'
                  )}
                >
                  <div className="prose prose-sm max-w-none break-words leading-relaxed dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                  <div className={cx(
                    'mt-1 text-[10px] text-right font-medium',
                    isOutgoing
                      ? isDark ? 'text-[#8696a0]' : 'text-[#667781]'
                      : isDark ? 'text-[#8696a0]' : 'text-[#667781]'
                  )}>
                    {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-c">
            <MessageSquare className="h-10 w-10 opacity-30 mb-2 text-emerald-500" />
            <p className="text-sm font-bold text-primary-c">No messages yet in this conversation</p>
            <p className="text-xs mt-1 opacity-70">Send a message below to start chatting over WhatsApp.</p>
          </div>
        )}
      </div>

      {/* Input / Controls Bar */}
      <div className={cx(
        'border-t p-3 transition-colors duration-200 shrink-0',
        isDark ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-[#e9edef]'
      )}>
        {conv.isBotHandled ? (
          <div className={cx(
            'flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl p-3 border',
            isDark ? 'bg-[#182229] border-[#222d34]' : 'bg-[#ffffff] border-[#e9edef]'
          )}>
            <div className="flex items-center gap-2 text-xs">
              <Bot className="h-4 w-4 text-purple-500 shrink-0 animate-bounce" />
              <span className="font-semibold text-primary-c">AI Bot is automatically replying to incoming messages</span>
            </div>
            <button
              onClick={async () => {
                setTogglingBot(true);
                await onBotToggle(true);
                setTogglingBot(false);
              }}
              disabled={togglingBot}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all disabled:opacity-50 shrink-0"
            >
              <UserCheck className="h-3.5 w-3.5" />
              {togglingBot ? 'Switching…' : 'Take Over (Human Mode)'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a WhatsApp reply message…"
              className={cx(
                'flex-1 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border',
                isDark
                  ? 'bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] border-[#374248]'
                  : 'bg-[#ffffff] text-[#111b21] placeholder-[#667781] border-[#e9edef]'
              )}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-700 disabled:opacity-50 shadow-soft shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function WebChatPreview({
  session,
  onDelete,
  onBack,
}: {
  session: WebChatSession;
  onDelete: () => void;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<WebChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
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

  const loadDetails = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data } = await fetchWebChatSessionDetails(session.id);
    if (showLoading) setLoading(false);
    setMessages(data?.messages || []);
  }, [session.id]);

  useEffect(() => {
    shouldForceScrollRef.current = true;
    setMessages([]);
    loadDetails(true);
    const interval = setInterval(() => {
      loadDetails(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [session.id, loadDetails]);

  // Auto-scroll to bottom whenever session changes or when user is at bottom
  useEffect(() => {
    if (messages.length > 0) {
      if (shouldForceScrollRef.current || isAtBottomRef.current) {
        scrollToBottom();
        shouldForceScrollRef.current = false;
      }
    }
  }, [messages, scrollToBottom]);

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden rounded-2xl border border-base-c/80">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-base-c/80 px-4 py-3 bg-card-c/80 shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 -ml-1 rounded-lg text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white font-bold shadow-soft shrink-0">
          <Globe className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-primary-c">
            {session.sessionId || 'Website Visitor Session'}
          </p>
          <p className="truncate text-xs text-muted-c">
            Created: {session.createdAt ? new Date(session.createdAt).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="primary" className="px-2.5 py-1">
            <Bot className="h-3 w-3" /> WebBot Active
          </Badge>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all"
            title="Delete Session"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Thread
          </button>
        </div>
      </div>

      {/* Message thread */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin bg-card-c/30"
      >
        <div className="flex items-center justify-center">
          <span className="rounded-full bg-slate-100/80 dark:bg-ink-800 px-3 py-1 text-[10px] font-semibold text-muted-c border border-base-c/50">
            WebChat Widget History
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-muted-c">Loading chat thread…</div>
        ) : messages.length > 0 ? (
          messages.map((m) => (
            <div
              key={m.id}
              className={cx(
                'flex',
                m.sender === 'USER' ? 'justify-start' : 'justify-end'
              )}
            >
              <div
                className={cx(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-xs border',
                  m.sender === 'USER'
                    ? 'rounded-tl-xs bg-slate-100 text-primary-c dark:bg-ink-800 border-base-c'
                    : 'rounded-tr-xs bg-indigo-600 text-white border-indigo-700'
                )}
              >
                <div className="mb-1 text-[10px] font-bold opacity-80 uppercase tracking-wider">
                  {m.sender === 'USER' ? 'Website Visitor' : 'AI WebBot'}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
                <div className="mt-1 text-[10px] opacity-70 text-right">
                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-xs text-muted-c">
            No messages recorded in this website session yet.
          </div>
        )}
      </div>
    </GlassCard>
  );
}
