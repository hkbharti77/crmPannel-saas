import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket, type WsIncomingMessage } from '@/hooks/useWebSocket';
import { GlassCard, Avatar, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SkeletonChatList } from '@/components/ui/Skeleton';
import { EmptyState as CustomEmptyState } from '@/components/ui/EmptyState';
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
  sendWebChatReply,
  takeoverWebChatSession,
  resolveWebChatSession,
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
        const isTg = c.channel === 'telegram' || (c.phone && c.phone.startsWith('tg:')) || (c.source === 'TELEGRAM');

        return {
          id: String(c.id),
          name: c.name || (isTg ? (c.telegramUsername || 'Telegram User') : 'WhatsApp Contact'),
          phone: c.phone || String(c.id),
          channel: isTg ? ('telegram' as const) : ('whatsapp' as const),
          telegramUsername: c.telegramUsername,
          lastMessage: c.lastMessage,
          lastMessageSender: 'them',
          timestamp: c.time ? timeAgo(new Date(c.time)) : 'Just now',
          lastMessageTime: c.time || undefined,
          unread: c.unread || 0,
          // Green dot only if last message was within 24h (active session)
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
        const firstCurrent = mapped.find(c => channel === 'telegram' ? c.channel === 'telegram' : c.channel !== 'telegram');
        setSelectedId(firstCurrent ? firstCurrent.id : mapped[0].id);
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
    if (channel === 'whatsapp' || channel === 'telegram') {
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
    if (!msg) return;

    // Real-time updates for WebChat sessions list & badges
    if (msg.type === 'WEBCHAT_USER_MSG' || msg.type === 'WEBCHAT_AGENT_REPLY' || msg.type === 'WEBCHAT_SUPPORT_UPDATE') {
      const targetSessionId = msg.sessionId;
      const targetWebId = (msg as any).webSessionId;
      setWebSessions((prev) => {
        const idx = prev.findIndex((s) => s.sessionId === targetSessionId || s.id === targetWebId || (msg.contactId && s.contactId === msg.contactId));
        if (idx !== -1) {
          const existing = prev[idx];
          const updated: WebChatSession = {
            ...existing,
            lastMessageSnippet: msg.content || existing.lastMessageSnippet,
            lastMessageTime: msg.timestamp || new Date().toISOString(),
            lastMessageSender: msg.type === 'WEBCHAT_USER_MSG' ? 'USER' : (msg.type === 'WEBCHAT_AGENT_REPLY' ? 'AGENT' : existing.lastMessageSender),
            supportState: (msg as any).supportState || existing.supportState,
            assignedAgentName: msg.agentName || existing.assignedAgentName,
          };
          const rest = prev.filter((_, i) => i !== idx);
          return [updated, ...rest];
        } else {
          // If a new session arrived, refresh list immediately
          loadWebSessions();
          return prev;
        }
      });
      return;
    }

    if (channel === 'webchat') return;

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
        const isTg = contactId.startsWith('tg:') || (msg.contactName && msg.contactName.toLowerCase().includes('telegram'));
        const newConv: Conversation = {
          id: contactId,
          name: msg.contactName || (isTg ? 'Telegram User' : 'WhatsApp Contact'),
          phone: contactId,
          channel: isTg ? 'telegram' : 'whatsapp',
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

  const channelConversations = useMemo(() => {
    if (channel === 'telegram') {
      return conversations.filter((c) => c.channel === 'telegram' || c.phone.startsWith('tg:'));
    }
    if (channel === 'whatsapp') {
      return conversations.filter((c) => c.channel !== 'telegram' && !c.phone.startsWith('tg:'));
    }
    return conversations;
  }, [conversations, channel]);

  const counts = useMemo(() => {
    const all = channelConversations.length;
    const unread = channelConversations.filter((c) => c.unread > 0).length;
    const bot = channelConversations.filter((c) => c.isBotHandled).length;
    const vip = channelConversations.filter((c) => c.tags.includes('VIP')).length;
    const mine = channelConversations.filter((c) => c.assignedTo === 'Arjun').length;
    const unassigned = channelConversations.filter((c) => c.leadStatus === 'UNASSIGNED' || !c.assignedTo).length;

    return { all, unread, bot, vip, mine, unassigned };
  }, [channelConversations]);

  const filteredWhatsApp = useMemo(() => {
    return channelConversations.filter((c) => {
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
          (c.telegramUsername && c.telegramUsername.toLowerCase().includes(q)) ||
          c.lastMessage.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [channelConversations, filter, query]);

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

  const selectedWa = channelConversations.find((c) => c.id === selectedId) ?? (channelConversations.length > 0 ? channelConversations[0] : null);
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
                  : channel === 'telegram'
                  ? `${counts.all} Telegram chats · ${counts.unread} unread`
                  : `${webSessions.length} active webchat sessions`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={channel === 'webchat' ? loadWebSessions : loadChats}
                disabled={channel === 'webchat' ? loadingWeb : loading}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors"
                title="Refresh sessions"
              >
                <RefreshCw className={cx('h-4 w-4', (loading || loadingWeb) && 'animate-spin')} />
              </button>
              <Badge
                variant={channel === 'whatsapp' ? 'success' : 'primary'}
                className={cx(
                  "px-2.5 py-1 text-xs font-semibold",
                  channel === 'telegram' && "bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30"
                )}
              >
                <span
                  className={cx(
                    "h-1.5 w-1.5 rounded-full animate-pulse",
                    channel === 'telegram' ? "bg-[#229ED9]" : channel === 'whatsapp' ? "bg-emerald-500" : "bg-indigo-500"
                  )}
                />
                {channel === 'whatsapp' ? 'Live WhatsApp' : channel === 'telegram' ? 'Live Telegram' : 'Live WebChat'}
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
            {channel === 'whatsapp' || channel === 'telegram' ? (
              loading && channelConversations.length === 0 ? (
                <SkeletonChatList count={5} />
              ) : filteredWhatsApp.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div
                    className={cx(
                      "h-12 w-12 rounded-2xl grid place-items-center mb-3 ring-1",
                      channel === 'telegram'
                        ? "bg-[#229ED9]/10 text-[#229ED9] ring-[#229ED9]/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20"
                    )}
                  >
                    {channel === 'telegram' ? <Send className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                  </div>
                  <p className="text-sm font-bold text-primary-c">
                    {channel === 'telegram' ? 'No Telegram conversations found' : 'No WhatsApp conversations found'}
                  </p>
                  <p className="text-xs text-muted-c max-w-xs mt-1">
                    {channel === 'telegram'
                      ? 'Customer messages from your Telegram bot will automatically appear here in real-time.'
                      : 'Incoming WhatsApp messages will automatically show up here in real-time.'}
                  </p>
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
            ) : loadingWeb && webSessions.length === 0 ? (
              <SkeletonChatList count={5} />
            ) : filteredWebSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 grid place-items-center text-indigo-600 dark:text-indigo-400 mb-3 ring-1 ring-indigo-500/20">
                  <Globe className="h-6 w-6" />
                </div>
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

                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {s.supportState === 'ASSIGNED' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live: {s.assignedAgentName || 'Agent'}
                          </span>
                        ) : s.supportState === 'QUEUED' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                            In Queue
                          </span>
                        ) : s.botPaused ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            <UserCheck className="h-2.5 w-2.5" /> Human Takeover
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                            <Bot className="h-2.5 w-2.5" /> WebBot Active
                          </span>
                        )}
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
          {channel === 'whatsapp' || channel === 'telegram' ? (
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
              onSessionUpdated={loadWebSessions}
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
  const isTelegram = conv.channel === 'telegram' || (conv.phone && conv.phone.startsWith('tg:'));
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
    const tempId = 'temp-' + Date.now();
    setInput('');
    setSending(true);

    // Optimistic immediate append
    const optimisticMsg: ApiMessage = {
      id: tempId,
      content: textToSend,
      direction: 'OUTGOING',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    shouldForceScrollRef.current = true;
    scrollToBottom();

    const { success } = await sendWhatsAppMessage(conv.id, textToSend);
    setSending(false);

    if (!success) {
      // If sending failed, restore text so user doesn't lose it
      setInput(textToSend);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
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
          <Avatar
            name={conv.name}
            size={40}
            className={cx('ring-2', isTelegram ? 'ring-[#229ED9]/40' : 'ring-emerald-500/30')}
          />
          {isTelegram && (
            <span className="absolute -top-1 -left-1 z-10 grid h-4 w-4 place-items-center rounded-full bg-[#229ED9] text-white shadow-xs ring-1 ring-white dark:ring-slate-900">
              <Send className="h-2 w-2" />
            </span>
          )}
          <span className={cx(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card-c',
            conv.status === 'online' ? (isTelegram ? 'bg-[#229ED9]' : 'bg-emerald-500') : 'bg-slate-400'
          )} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm sm:text-base font-bold">{conv.name}</p>
            {isTelegram && (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30">
                <Send className="h-2.5 w-2.5" /> Telegram Bot
              </span>
            )}
          </div>
          <p className={cx(
            'truncate text-xs',
            isDark ? 'text-[#8696a0]' : 'text-[#667781]'
          )}>
            {isTelegram
              ? (conv.telegramUsername ? `${conv.telegramUsername} · Telegram ID: ${conv.phone.replace('tg:', '')}` : `Telegram ID: ${conv.phone.replace('tg:', '')}`)
              : (conv.status === 'online' ? '🟢 Active WhatsApp Session (24h Window)' : '⚪ Session Expired')}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {!isTelegram && (
            <button
              onClick={handleSendMenu}
              disabled={menuSending}
              className="flex items-center gap-1 text-xs font-semibold rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all shrink-0"
            >
              <MenuSquare className="h-3.5 w-3.5" />
              <span className="hidden xs:inline sm:inline">{menuSending ? 'Sending…' : 'Send Menu'}</span>
            </button>
          )}
          
          {conv.leadStatus === 'UNASSIGNED' && conv.leadId && (
            <button
              onClick={async () => {
                try {
                  const { authHeaders } = await import('@/lib/api');
                  const res = await fetch(`/api/v1/leads/${conv.leadId}/claim`, {
                    method: 'POST',
                    headers: authHeaders()
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
            {isTelegram
              ? '✈️ Telegram Bot Customer Session · Real-Time'
              : '🔒 Official WhatsApp API Session · Encrypted'}
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
                      ? isTelegram
                        ? isDark
                          ? 'bg-[#229ED9]/85 text-white border-[#229ED9] rounded-tr-xs'
                          : 'bg-[#229ED9] text-white border-[#229ED9] rounded-tr-xs'
                        : isDark
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
                      ? isTelegram
                        ? 'text-white/80'
                        : isDark ? 'text-[#8696a0]' : 'text-[#667781]'
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
            {isTelegram ? (
              <Send className="h-10 w-10 opacity-30 mb-2 text-[#229ED9]" />
            ) : (
              <MessageSquare className="h-10 w-10 opacity-30 mb-2 text-emerald-500" />
            )}
            <p className="text-sm font-bold text-primary-c">No messages yet in this conversation</p>
            <p className="text-xs mt-1 opacity-70">
              {isTelegram ? 'Send a message below to start chatting over Telegram.' : 'Send a message below to start chatting over WhatsApp.'}
            </p>
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
              className={cx(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-50 shrink-0",
                isTelegram ? "bg-[#229ED9] hover:bg-[#1b8bc2]" : "bg-emerald-600 hover:bg-emerald-700"
              )}
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
              placeholder={isTelegram ? "Type a Telegram reply message…" : "Type a WhatsApp reply message…"}
              className={cx(
                'flex-1 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 border',
                isTelegram ? 'focus:ring-[#229ED9]/30' : 'focus:ring-emerald-500/30',
                isDark
                  ? 'bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] border-[#374248]'
                  : 'bg-[#ffffff] text-[#111b21] placeholder-[#667781] border-[#e9edef]'
              )}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className={cx(
                "grid h-10 w-10 place-items-center rounded-xl text-white transition-all disabled:opacity-50 shadow-soft shrink-0",
                isTelegram ? "bg-[#229ED9] hover:bg-[#1b8bc2]" : "bg-emerald-600 hover:bg-emerald-700"
              )}
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
  onSessionUpdated,
}: {
  session: WebChatSession;
  onDelete: () => void;
  onBack: () => void;
  onSessionUpdated?: () => void;
}) {
  const [messages, setMessages] = useState<WebChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);
  const [localSession, setLocalSession] = useState<WebChatSession>(session);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const shouldForceScrollRef = useRef<boolean>(true);

  useEffect(() => {
    setLocalSession(session);
  }, [session]);

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
    if (data?.messages) {
      setMessages(data.messages);
    }
    if (data?.session) {
      setLocalSession(data.session);
    }
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

  // Real-time WebSocket listener for instant message delivery
  useWebSocket((msg: WsIncomingMessage) => {
    if (!msg) return;
    const isTargetSession =
      (msg.sessionId && (msg.sessionId === localSession?.sessionId || msg.sessionId === session?.sessionId || msg.sessionId === session?.id)) ||
      ((msg as any).webSessionId && ((msg as any).webSessionId === session?.id || (msg as any).webSessionId === localSession?.id)) ||
      (msg.contactId && localSession?.contactId && msg.contactId.toLowerCase() === localSession.contactId.toLowerCase());

    if (isTargetSession) {
      if (msg.type === 'WEBCHAT_USER_MSG' || msg.direction === 'INCOMING') {
        const newMsg: WebChatMessage = {
          id: msg.id || `ws-${Date.now()}`,
          sender: 'USER',
          content: msg.content,
          createdAt: msg.timestamp || new Date().toISOString(),
        };
        setMessages((prev) => {
          if (prev.some((m) => m.content === newMsg.content && Math.abs(new Date(m.createdAt).getTime() - new Date(newMsg.createdAt).getTime()) < 2000)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        shouldForceScrollRef.current = true;
      } else if (msg.type === 'WEBCHAT_AGENT_REPLY' || msg.direction === 'OUTGOING') {
        const newMsg: WebChatMessage = {
          id: msg.id || `ws-${Date.now()}`,
          sender: 'AGENT',
          senderName: msg.agentName,
          content: msg.content,
          createdAt: msg.timestamp || new Date().toISOString(),
        };
        setMessages((prev) => {
          // Replace matching optimistic temp message if present, or avoid duplicates
          const withoutTemp = prev.filter((m) => !(m.id.startsWith('temp-') && m.content === newMsg.content));
          if (withoutTemp.some((m) => m.content === newMsg.content && Math.abs(new Date(m.createdAt).getTime() - new Date(newMsg.createdAt).getTime()) < 2000)) {
            return prev;
          }
          return [...withoutTemp, newMsg];
        });
        shouldForceScrollRef.current = true;
      } else if (msg.type === 'WEBCHAT_SUPPORT_UPDATE') {
        if ((msg as any).supportState) {
          setLocalSession((prev) => ({
            ...prev,
            supportState: (msg as any).supportState,
            assignedAgentName: msg.agentName || prev.assignedAgentName,
          }));
        }
        loadDetails(false);
        if (onSessionUpdated) onSessionUpdated();
      }
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      if (shouldForceScrollRef.current || isAtBottomRef.current) {
        scrollToBottom();
        shouldForceScrollRef.current = false;
      }
    }
  }, [messages, scrollToBottom]);

  // Handlers
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const textToSend = input.trim();
    setInput('');
    setSending(true);

    // Optimistic UI append
    const optimisticMsg: WebChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'AGENT',
      senderName: 'You',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    shouldForceScrollRef.current = true;

    const res = await sendWebChatReply(session.id, textToSend);
    setSending(false);

    if (res.error) {
      alert(`Failed to send message: ${res.error}`);
    } else {
      loadDetails(false);
      if (onSessionUpdated) onSessionUpdated();
    }
  };

  const handleTakeover = async () => {
    setTogglingBot(true);
    const res = await takeoverWebChatSession(session.id);
    setTogglingBot(false);
    if (res.error) {
      alert(`Takeover failed: ${res.error}`);
    } else {
      setLocalSession((prev) => ({
        ...prev,
        supportState: 'ASSIGNED',
        botPaused: true,
      }));
      loadDetails(false);
      if (onSessionUpdated) onSessionUpdated();
    }
  };

  const handleResolve = async () => {
    setTogglingBot(true);
    const res = await resolveWebChatSession(session.id);
    setTogglingBot(false);
    if (res.error) {
      alert(`Resolve failed: ${res.error}`);
    } else {
      setLocalSession((prev) => ({
        ...prev,
        supportState: 'RESOLVED',
        botPaused: false,
      }));
      loadDetails(false);
      if (onSessionUpdated) onSessionUpdated();
    }
  };

  const isHumanActive = localSession.supportState === 'ASSIGNED' || localSession.botPaused;

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
            {localSession.sessionId || 'Website Visitor Session'}
          </p>
          <p className="truncate text-xs text-muted-c">
            {localSession.contactName ? `Visitor: ${localSession.contactName} • ` : ''}
            Created: {localSession.createdAt ? new Date(localSession.createdAt).toLocaleString() : 'N/A'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {localSession.supportState === 'ASSIGNED' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live: {localSession.assignedAgentName || 'Agent Active'}
            </span>
          ) : localSession.supportState === 'QUEUED' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              Waiting in Queue
            </span>
          ) : isHumanActive ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              <UserCheck className="h-3.5 w-3.5" />
              Human Mode
            </span>
          ) : (
            <Badge variant="primary" className="px-2.5 py-1">
              <Bot className="h-3 w-3" /> WebBot Active
            </Badge>
          )}

          {isHumanActive ? (
            <button
              onClick={handleResolve}
              disabled={togglingBot}
              className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
              title="Resolve Live Chat"
            >
              <Check className="h-3.5 w-3.5" />
              {togglingBot ? '…' : 'Resolve Chat'}
            </button>
          ) : (
            <button
              onClick={handleTakeover}
              disabled={togglingBot}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-xs disabled:opacity-50"
              title="Takeover Chat"
            >
              <UserCheck className="h-3.5 w-3.5" />
              {togglingBot ? '…' : 'Take Over'}
            </button>
          )}

          <button
            onClick={onDelete}
            className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all"
            title="Delete Session"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
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
            Live WebChat History
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-muted-c">Loading chat thread…</div>
        ) : messages.length > 0 ? (
          messages.map((m) => {
            if (m.sender === 'SYSTEM') {
              return (
                <div key={m.id} className="flex justify-center my-2">
                  <span className="rounded-full bg-slate-200/80 dark:bg-ink-800/80 px-3 py-1 text-[11px] font-medium text-muted-c border border-base-c">
                    {m.content}
                  </span>
                </div>
              );
            }

            const isUser = m.sender === 'USER';
            const isAgent = m.sender === 'AGENT';

            return (
              <div
                key={m.id}
                className={cx(
                  'flex',
                  isUser ? 'justify-start' : 'justify-end'
                )}
              >
                <div
                  className={cx(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-xs border',
                    isUser
                      ? 'rounded-tl-xs bg-slate-100 text-primary-c dark:bg-ink-800 border-base-c'
                      : isAgent
                      ? 'rounded-tr-xs bg-emerald-600 text-white border-emerald-700'
                      : 'rounded-tr-xs bg-indigo-600 text-white border-indigo-700'
                  )}
                >
                  <div className="mb-1 text-[10px] font-bold opacity-80 uppercase tracking-wider">
                    {isUser
                      ? 'Website Visitor'
                      : isAgent
                      ? `🟢 Agent (${m.senderName || 'Support'})`
                      : 'AI WebBot'}
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed text-inherit">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                  <div className="mt-1 text-[10px] opacity-70 text-right">
                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center text-xs text-muted-c">
            No messages recorded in this website session yet.
          </div>
        )}
      </div>

      {/* Input / Control Bar */}
      <div className="border-t p-3 bg-card-c/80 border-base-c/80 shrink-0">
        {!isHumanActive ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl p-3 border bg-card-c border-base-c/80">
            <div className="flex items-center gap-2 text-xs">
              <Bot className="h-4 w-4 text-purple-500 shrink-0 animate-bounce" />
              <span className="font-semibold text-primary-c">
                AI WebBot is handling visitor queries. Switch to Live Mode to reply directly.
              </span>
            </div>
            <button
              onClick={handleTakeover}
              disabled={togglingBot}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all disabled:opacity-50 shrink-0 shadow-xs"
            >
              <UserCheck className="h-3.5 w-3.5" />
              {togglingBot ? 'Switching…' : 'Take Over (Live Mode)'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a live message to this website visitor..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 border bg-card-c text-primary-c placeholder:text-muted-c border-base-c/80"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white transition-all hover:bg-emerald-700 disabled:opacity-50 shadow-soft shrink-0"
              title="Send live message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </GlassCard>
  );
}
