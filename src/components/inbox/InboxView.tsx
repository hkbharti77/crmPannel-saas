import { useMemo, useState, useEffect, useCallback } from 'react';
import { useWebSocket, type WsIncomingMessage } from '@/hooks/useWebSocket';
import { GlassCard, Avatar, Badge } from '@/components/ui/primitives';
import { cx } from '@/lib/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { InboxToolbar, type FilterId, type ChannelId } from './InboxToolbar';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from './inboxTypes';
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
  const [webError, setWebError] = useState<string | null>(null);

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
  // Tracks messages pushed via WS so ChatPreview can display them instantly
  const [wsMessages, setWsMessages] = useState<Record<string, ApiMessage[]>>({});

  const handleWsMessage = useCallback((msg: WsIncomingMessage) => {
    if (channel !== 'whatsapp') return;

    const contactId = msg.contactId;
    if (!contactId) return;

    const now = new Date();

    // 1. Update the conversation list
    setConversations((prev) => {
      const exists = prev.find((c) => c.id === contactId);
      if (exists) {
        // Update existing conversation: bump lastMessage + move to top
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
        // Sort: the updated conversation goes to the top
        return updated.sort((a, b) => {
          if (a.id === contactId) return -1;
          if (b.id === contactId) return 1;
          return 0;
        });
      } else {
        // New contact not yet in the list — prepend it
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

    // 2. Append to wsMessages so ChatPreview can pick it up
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
    const unassigned = conversations.filter((c) => c.status === 'UNASSIGNED' || !c.assignedTo).length;

    return { all, unread, bot, vip, mine, unassigned };
  }, [conversations]);

  const filteredWhatsApp = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === 'unread' && c.unread === 0) return false;
      if (filter === 'bot' && !c.isBotHandled) return false;
      if (filter === 'vip' && !c.tags.includes('VIP')) return false;
      if (filter === 'mine' && c.assignedTo !== 'Arjun') return false;
      if (filter === 'unassigned' && c.status !== 'UNASSIGNED' && c.assignedTo) return false;
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
        return s.sessionId.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
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
    <div className="mx-auto max-w-7xl h-[calc(100vh-4.5rem)] p-3 lg:p-5 overflow-hidden">
      <div className="grid h-full gap-4 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] overflow-hidden">
        {/* Left: conversation list */}
        <div className="flex h-full flex-col overflow-hidden space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary-c">Inbox</h2>
              <p className="text-xs text-muted-c">
                {channel === 'whatsapp'
                  ? `${counts.unread} unread · ${counts.bot} bot-handled`
                  : `${webSessions.length} active webchat widget sessions`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={channel === 'whatsapp' ? loadChats : loadWebSessions}
                disabled={channel === 'whatsapp' ? loading : loadingWeb}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-c hover:bg-slate-100 dark:hover:bg-ink-800"
                title="Refresh sessions"
              >
                <RefreshCw className={cx('h-4 w-4', (loading || loadingWeb) && 'animate-spin')} />
              </button>
              <Badge variant="success" className="px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" />
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

          {/* List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-thin">
            {channel === 'whatsapp' ? (
              filteredWhatsApp.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-c/40" />
                  <p className="mt-3 text-sm text-muted-c">No WhatsApp conversations found</p>
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
              <div className="flex flex-col items-center py-16 text-center">
                <Globe className="h-10 w-10 text-muted-c/40" />
                <p className="mt-3 text-sm text-muted-c">No WebChat widget sessions found</p>
              </div>
            ) : (
              filteredWebSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cx(
                    'group relative flex w-full gap-3 rounded-xl2 p-3 text-left transition-all',
                    s.id === (selectedId || selectedWeb?.id)
                      ? 'bg-gradient-accent-soft ring-1 ring-primary-500/20'
                      : 'hover:bg-slate-50 dark:hover:bg-ink-850/60',
                  )}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-accent text-white font-bold">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold text-primary-c">
                        {s.sessionId || 'Website Visitor'}
                      </p>
                      <span className="text-[11px] text-muted-c">
                        {s.updatedAt ? new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-c">
                      ID: {s.id.substring(0, 18)}…
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <Badge variant="primary" className="text-[9px]">
                        <Bot className="h-2.5 w-2.5" /> WebBot Thread
                      </Badge>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: conversation / session preview */}
        <div className="hidden h-full overflow-hidden lg:block">
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
              />
            ) : (
              <EmptyState />
            )
          ) : selectedWeb ? (
            <WebChatPreview
              session={selectedWeb}
              onDelete={() => handleDeleteWebSession(selectedWeb.id)}
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
    <GlassCard className="flex h-full flex-col items-center justify-center p-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-accent-soft">
        <MessageSquare className="h-8 w-8 text-primary-600 dark:text-primary-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-primary-c">Select a conversation</h3>
      <p className="mt-1 max-w-xs text-sm text-secondary-c">
        Choose a chat from the list to preview messages, or open the full chat
        room for the complete experience.
      </p>
    </GlassCard>
  );
}

function ChatPreview({ conv, wsMessages, onClearWsMessages, onOpenChat, onBotToggle }: {
  conv: Conversation;
  wsMessages: ApiMessage[];
  onClearWsMessages: () => void;
  onOpenChat: () => void;
  onBotToggle: (newBotPaused: boolean) => Promise<void>;
}) {
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [menuSending, setMenuSending] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);

  const loadHistory = async () => {
    if (!conv.id || !conv.id.includes('-')) return;
    const { data } = await fetchMessageHistory(conv.id);
    if (data && data.length > 0) {
      setMessages(data);
    }
  };

  useEffect(() => {
    loadHistory();
    onClearWsMessages(); // Clear buffered WS messages on conversation switch (we just loaded full history)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.id]);

  // Append real-time WebSocket messages to the chat preview
  useEffect(() => {
    if (wsMessages.length === 0) return;
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newMsgs = wsMessages.filter((m) => !existingIds.has(m.id));
      return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
    });
  }, [wsMessages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || sending) return;

    const textToSend = input.trim();
    setInput('');
    setSending(true);

    const { success } = await sendWhatsAppMessage(conv.id, textToSend);
    setSending(false);

    if (success) {
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
    <GlassCard className="flex h-full flex-col overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-base-c p-4">
        <div className="relative">
          <Avatar name={conv.name} size={40} />
          {/* Green dot = active WhatsApp session (last message within 24h) */}
          <span className={cx(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card-c',
            conv.status === 'online' ? 'bg-success-500' : 'bg-slate-300 dark:bg-ink-700'
          )} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary-c">{conv.name}</p>
          <p className="truncate text-xs text-muted-c">
            {conv.status === 'online'
              ? '🟢 Active session (within 24h)'
              : '⚪ Session expired'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSendMenu}
            disabled={menuSending}
            className="flex items-center gap-1 text-xs font-medium rounded-lg border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20"
          >
            <MenuSquare className="h-3.5 w-3.5" />
            {menuSending ? 'Sending…' : 'Send Menu'}
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
                    // Update state or refresh
                    window.location.reload();
                  } else {
                    alert('Could not claim lead. Perhaps you reached your limit?');
                  }
                } catch (err) {
                  console.error(err);
                }
              }}
              className="flex items-center gap-1 rounded-lg bg-gradient-accent px-3 py-1.5 text-xs font-bold text-white shadow-soft hover:shadow-glow transition-all"
            >
              <Users className="h-3.5 w-3.5" />
              Claim Lead
            </button>
          )}

          {/* Bot / Human mode toggle */}
          <button
            onClick={async () => {
              setTogglingBot(true);
              // isBotHandled=true means bot is active → toggling pauses it (human takes over)
              // isBotHandled=false means human mode → toggling resumes bot
              await onBotToggle(!conv.isBotHandled);
              setTogglingBot(false);
            }}
            disabled={togglingBot}
            title={conv.isBotHandled ? 'Switch to Human mode' : 'Switch to Bot mode'}
            className={cx(
              'flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
              conv.isBotHandled
                ? 'border-primary-500/30 bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20'
                : 'border-success-500/30 bg-success-500/10 text-success-600 dark:text-success-400 hover:bg-success-500/20'
            )}
          >
            {conv.isBotHandled ? (
              <><Bot className="h-3.5 w-3.5" />{togglingBot ? '…' : 'Bot Active'}</>
            ) : (
              <><UserCheck className="h-3.5 w-3.5" />{togglingBot ? '…' : 'Human Mode'}</>
            )}
          </button>

          {!conv.isBotHandled && (
            <button
              onClick={async () => {
                setTogglingBot(true);
                await resolveLiveChat(conv.id);
                await onBotToggle(false); // Resumes bot
                setTogglingBot(false);
              }}
              disabled={togglingBot}
              title="Resolve support chat and resume bot"
              className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {togglingBot ? '…' : 'Resolve Chat'}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
        <div className="flex items-center justify-center">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-muted-c dark:bg-ink-800">
            Today
          </span>
        </div>

        {messages.length > 0 ? (
          messages.map((m) => (
            <div
              key={m.id}
              className={cx(
                'flex',
                m.direction === 'OUTGOING' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cx(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                  m.direction === 'OUTGOING'
                    ? 'rounded-tr-sm bg-gradient-accent text-white'
                    : 'rounded-tl-sm bg-slate-100 text-primary-c dark:bg-ink-800'
                )}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-tight">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
                <div className="mt-1 text-[10px] opacity-70 text-right">
                  {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-c">
            <MessageSquare className="h-8 w-8 opacity-40 mb-2" />
            <p className="text-xs font-medium text-primary-c">No messages yet in this conversation</p>
            <p className="text-[11px] text-muted-c mt-0.5">Send a message below to start chatting over WhatsApp.</p>
          </div>
        )}
      </div>

      {/* Quick actions & input */}
      <div className="border-t border-base-c p-3">
        {conv.isBotHandled ? (
          /* Bot active — lock input */
          <div className="flex flex-col items-center gap-2 rounded-xl2 border border-secondary-500/20 bg-secondary-500/5 px-3 py-3">
            <p className="text-[11px] font-semibold text-secondary-600 dark:text-secondary-400">
              🤖 Bot is handling this chat
            </p>
            <p className="text-[10px] text-muted-c text-center">
              Switch to Human Mode to reply manually
            </p>
            <button
              onClick={async () => {
                setTogglingBot(true);
                await onBotToggle(true); // botPaused = true → human mode
                setTogglingBot(false);
              }}
              disabled={togglingBot}
              className="flex items-center gap-1.5 rounded-lg bg-success-500/15 px-3 py-1.5 text-xs font-semibold text-success-600 dark:text-success-400 ring-1 ring-success-500/30 hover:bg-success-500/25 transition-all disabled:opacity-50"
            >
              <UserCheck className="h-3 w-3" />
              {togglingBot ? 'Switching…' : 'Take Over'}
            </button>
          </div>
        ) : (
          /* Human mode — show input */
          <>
            <form onSubmit={handleSend} className="flex items-center gap-2 rounded-xl2 border border-base-c bg-card-c px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a WhatsApp message…"
                className="flex-1 bg-transparent text-sm text-primary-c placeholder:text-muted-c focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-accent text-white transition-transform hover:scale-105 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}

        <button
          onClick={onOpenChat}
          className="mt-2 w-full rounded-lg bg-gradient-accent-soft py-2 text-xs font-medium text-primary-600 transition-colors hover:bg-gradient-accent hover:text-white dark:text-primary-300"
        >
          Open full chat room
        </button>
      </div>
    </GlassCard>
  );
}

function WebChatPreview({
  session,
  onDelete,
}: {
  session: WebChatSession;
  onDelete: () => void;
}) {
  const [messages, setMessages] = useState<WebChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDetails = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data } = await fetchWebChatSessionDetails(session.id);
    if (showLoading) setLoading(false);
    setMessages(data?.messages || []);
  }, [session.id]);

  useEffect(() => {
    setMessages([]);
    loadDetails(true);
    const interval = setInterval(() => {
      loadDetails(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [session.id, loadDetails]);

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-base-c p-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-accent text-white font-bold">
          <Globe className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary-c">
            {session.sessionId || 'Website Visitor Session'}
          </p>
          <p className="truncate text-xs text-muted-c">
            Created: {session.createdAt ? new Date(session.createdAt).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">
            <Bot className="h-3 w-3" /> WebBot Active
          </Badge>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 rounded-lg border border-danger-500/30 bg-danger-500/10 px-2.5 py-1.5 text-xs font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-500/20"
            title="Delete Session"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
        <div className="flex items-center justify-center">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-medium text-muted-c dark:bg-ink-800">
            Web Chat Thread History
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted-c">Loading chat thread…</div>
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
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                  m.sender === 'USER'
                    ? 'rounded-tl-sm bg-slate-100 text-primary-c dark:bg-ink-800'
                    : 'rounded-tr-sm bg-gradient-accent text-white'
                )}
              >
                <div className="mb-0.5 text-[10px] font-bold opacity-80">
                  {m.sender === 'USER' ? 'Website Visitor' : 'AI WebBot'}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-tight">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
                <div className="mt-1 text-[10px] opacity-70 text-right">
                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-muted-c">
            No messages recorded in this website session yet.
          </div>
        )}
      </div>
    </GlassCard>
  );
}
