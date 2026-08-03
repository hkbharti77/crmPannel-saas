import { useMemo, useState, useEffect } from 'react';
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
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export function InboxView() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<ChannelId>('whatsapp');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // WhatsApp states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // WebChat states
  const [webSessions, setWebSessions] = useState<WebChatSession[]>([]);
  const [loadingWeb, setLoadingWeb] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);

  const loadChats = async () => {
    setLoading(true);
    setApiError(null);
    const { data, error } = await fetchActiveChats();
    setLoading(false);

    if (error) {
      setApiError(error);
    } else if (data && data.length > 0) {
      const mapped: Conversation[] = data.map((c) => ({
        id: String(c.id),
        name: c.name || 'WhatsApp Contact',
        phone: String(c.id),
        lastMessage: c.lastMessage || 'No messages yet',
        lastMessageSender: 'them',
        timestamp: c.time ? new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        unread: c.unread || 0,
        status: 'online',
        tags: c.status === 'NEW' ? ['NEW', 'HOT'] : ['VIP'],
        isBotHandled: true,
      }));
      setConversations(mapped);
      if (!selectedId && mapped.length > 0) {
        setSelectedId(mapped[0].id);
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
      setWebSessions(data || []);
      if (!selectedId && data && data.length > 0) {
        setSelectedId(data[0].id);
      }
    }
  };

  useEffect(() => {
    if (channel === 'whatsapp') {
      loadChats();
    } else {
      loadWebSessions();
    }
  }, [channel]);

  const counts = useMemo(() => {
    const all = conversations.length;
    const unread = conversations.filter((c) => c.unread > 0).length;
    const bot = conversations.filter((c) => c.isBotHandled).length;
    const vip = conversations.filter((c) => c.tags.includes('VIP')).length;
    const mine = conversations.filter((c) => c.assignedTo === 'Arjun').length;
    return { all, unread, bot, vip, mine };
  }, [conversations]);

  const filteredWhatsApp = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === 'unread' && c.unread === 0) return false;
      if (filter === 'bot' && !c.isBotHandled) return false;
      if (filter === 'vip' && !c.tags.includes('VIP')) return false;
      if (filter === 'mine' && c.assignedTo !== 'Arjun') return false;
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
              <ChatPreview conv={selectedWa} onOpenChat={() => navigate(`/chatroom/${selectedWa.id}`)} />
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

function ChatPreview({ conv, onOpenChat }: { conv: Conversation; onOpenChat: () => void }) {
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [menuSending, setMenuSending] = useState(false);

  const loadHistory = async () => {
    if (!conv.id || !conv.id.includes('-')) return;
    const { data } = await fetchMessageHistory(conv.id);
    if (data && data.length > 0) {
      setMessages(data);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [conv.id]);

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
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success-500 ring-2 ring-card-c" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary-c">{conv.name}</p>
          <p className="truncate text-xs text-muted-c">{conv.phone}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSendMenu}
            disabled={menuSending}
            className="flex items-center gap-1 text-xs font-medium rounded-lg border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20"
          >
            <MenuSquare className="h-3.5 w-3.5" />
            {menuSending ? 'Sending Menu...' : 'Send Menu'}
          </button>
          {conv.isBotHandled && (
            <Badge variant="primary" className="mr-1">
              <Bot className="h-3 w-3" /> Bot Active
            </Badge>
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
                {m.content}
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

  const loadDetails = async () => {
    setLoading(true);
    const { data } = await fetchWebChatSessionDetails(session.id);
    setLoading(false);
    if (data && data.messages) {
      setMessages(data.messages);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [session.id]);

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
                {m.content}
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
