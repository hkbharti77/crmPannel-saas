import { apiFetch } from './api';

export type WebChatSession = {
  id: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  status?: string;
  supportState?: 'IDLE' | 'QUEUED' | 'ASSIGNED' | 'RESOLVED';
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  contactId?: string | null;
  contactName?: string | null;
  botPaused?: boolean;
  lastMessage?: string;
  lastMessageSender?: 'USER' | 'BOT' | 'AGENT' | 'SYSTEM';
  lastMessageSenderName?: string | null;
  lastMessageTime?: string | null;
};

export type WebChatMessage = {
  id: string;
  sender: 'USER' | 'BOT' | 'AGENT' | 'SYSTEM';
  content: string;
  senderName?: string | null;
  senderAvatar?: string | null;
  createdAt: string;
};

export type WebChatSessionDetails = {
  session: WebChatSession;
  messages: WebChatMessage[];
};

export async function fetchWebChatSessions(): Promise<{ data: WebChatSession[]; error: string | null }> {
  const res = await apiFetch<WebChatSession[]>('/api/v1/webchat/sessions');
  if (res.error) {
    return { data: [], error: res.error };
  }
  return { data: res.data || [], error: null };
}

export async function fetchWebChatSessionDetails(id: string): Promise<{ data: WebChatSessionDetails | null; error: string | null }> {
  const res = await apiFetch<WebChatSessionDetails>(`/api/v1/webchat/sessions/${id}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function sendWebChatReply(sessionId: string, text: string): Promise<{ success: boolean; error: string | null; data?: any }> {
  const res = await apiFetch<any>(`/api/v1/webchat/sessions/${sessionId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true, error: null, data: res.data };
}

export async function takeoverWebChatSession(sessionId: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch(`/api/v1/webchat/sessions/${sessionId}/takeover`, {
    method: 'POST',
  });
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true, error: null };
}

export async function resolveWebChatSession(sessionId: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch(`/api/v1/webchat/sessions/${sessionId}/resolve`, {
    method: 'POST',
  });
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true, error: null };
}

export async function deleteWebChatSession(id: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch(`/api/v1/webchat/sessions/${id}`, {
    method: 'DELETE',
  });
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true, error: null };
}
