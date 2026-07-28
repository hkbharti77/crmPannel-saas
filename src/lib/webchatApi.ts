import { apiFetch } from './api';

export type WebChatSession = {
  id: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
};

export type WebChatMessage = {
  id: string;
  sender: 'USER' | 'BOT';
  content: string;
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

export async function deleteWebChatSession(id: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch(`/api/v1/webchat/sessions/${id}`, {
    method: 'DELETE',
  });
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true, error: null };
}
