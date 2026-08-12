import { apiFetch } from './api';

export type ApiChat = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  status: string;
  botPaused?: boolean;
};

export type ApiMessage = {
  id: string;
  waMessageId?: string;
  content: string;
  direction: 'INCOMING' | 'OUTGOING';
  timestamp: string;
  sentiment?: string;
  sentimentScore?: number;
  tags?: string[];
};

export type ContactDTO = {
  id: string;
  waId?: string;
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  source?: string;
  botPaused?: boolean;
  leadId?: string;
  leadStatus?: string;
  assignedAgentName?: string;
};

export async function fetchActiveChats(): Promise<{ data: ApiChat[]; error: string | null }> {
  const res = await apiFetch<ApiChat[]>('/api/v1/messages/chats');
  if (res.error) {
    return { data: [], error: res.error };
  }
  return { data: res.data || [], error: null };
}

export async function fetchMessageHistory(contactId: string): Promise<{ data: ApiMessage[]; error: string | null }> {
  const res = await apiFetch<ApiMessage[]>(`/api/v1/messages/${contactId}`);
  if (res.error) {
    return { data: [], error: res.error };
  }
  return { data: res.data || [], error: null };
}

export async function fetchContactDetails(contactId: string): Promise<{ data: ContactDTO | null; error: string | null }> {
  const res = await apiFetch<ContactDTO>(`/api/v1/contacts/${contactId}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function sendWhatsAppMessage(contactId: string, text: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch(`/api/v1/messages/${contactId}`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return { success: !res.error, error: res.error };
}

export async function sendTenantMenu(contactId: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch(`/api/v1/messages/${contactId}/menu`, {
    method: 'POST',
  });
  return { success: !res.error, error: res.error };
}

export async function toggleBotPaused(contactId: string, botPaused: boolean): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch(`/api/v1/contacts/${contactId}/bot-paused`, {
    method: 'PUT',
    body: JSON.stringify({ botPaused }),
  });
  return { success: !res.error, error: res.error };
}

export async function takeoverLiveChat(contactId: string, reason?: string, forceTakeover?: boolean) {
  const res = await apiFetch(`/api/livechat/contacts/${contactId}/takeover`, {
    method: 'POST',
    body: JSON.stringify({ reason, forceTakeover }),
  });
  return { success: !res.error, error: res.error };
}

export async function transferLiveChat(contactId: string, targetUserId: string, reason?: string) {
  const res = await apiFetch(`/api/livechat/contacts/${contactId}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ targetUserId, reason }),
  });
  return { success: !res.error, error: res.error };
}

export async function resolveLiveChat(contactId: string) {
  const res = await apiFetch(`/api/livechat/contacts/${contactId}/resolve`, {
    method: 'POST',
  });
  return { success: !res.error, error: res.error };
}

export async function fetchLiveChatContacts() {
  const res = await apiFetch<unknown[]>('/api/livechat/contacts');
  return { data: res.data || [], error: res.error };
}
