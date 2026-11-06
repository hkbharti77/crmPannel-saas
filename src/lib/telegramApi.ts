import { apiFetch } from './api';

export interface TelegramReplyKeyboardButton {
  text: string;
  type: 'TEXT' | 'REQUEST_CONTACT' | 'REQUEST_LOCATION' | 'SUB_MENU' | 'DIRECT_RESPONSE';
  subMenuId?: string;
  quickResponseId?: string;
  directResponse?: string;
  imageUrl?: string;
}

export interface TelegramGreetingMenuButton {
  text: string;
  type: 'CALLBACK' | 'URL' | 'SUB_MENU' | 'DIRECT_RESPONSE' | 'FLOW';
  payload?: string;
  subMenuId?: string;
  quickResponseId?: string;
  directResponse?: string;
  imageUrl?: string;
}

export interface TelegramConfigResponse {
  customerBotConfigured: boolean;
  customerBotUsername?: string;
  customerBotStatus: 'PENDING_SETUP' | 'ACTIVE' | 'ROTATING' | 'ROTATION_FAILED' | 'ERROR' | 'DECOMMISSIONED';
  agentBotConfigured: boolean;
  agentBotUsername?: string;
  agentBotStatus: 'PENDING_SETUP' | 'ACTIVE' | 'ROTATING' | 'ROTATION_FAILED' | 'ERROR' | 'DECOMMISSIONED';
  agentTeamChatId?: number;
  maskPiiInTelegram: boolean;
  lastErrorMessage?: string;
  lastSyncedAt?: string;
  replyKeyboardButtons?: TelegramReplyKeyboardButton[];
  welcomeMessage?: string;
  returningMessage?: string;
  greetingMenuButtons?: TelegramGreetingMenuButton[];
  talkToHumanEnabled?: boolean;
  talkToHumanLabel?: string;
}

export async function fetchTelegramConfig(): Promise<{ data: TelegramConfigResponse | null; error: string | null }> {
  const res = await apiFetch<TelegramConfigResponse>('/api/v1/telegram/config');
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function configureCustomerBot(data: {
  botToken: string;
  botUsername: string;
}): Promise<{ data: TelegramConfigResponse | null; error: string | null }> {
  const res = await apiFetch<TelegramConfigResponse>('/api/v1/telegram/config/customer-bot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function configureAgentBot(data: {
  botToken: string;
  botUsername: string;
  teamChatId?: number;
}): Promise<{ data: TelegramConfigResponse | null; error: string | null }> {
  const res = await apiFetch<TelegramConfigResponse>('/api/v1/telegram/config/agent-bot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function rotateTelegramSecret(botType: 'CUSTOMER' | 'AGENT'): Promise<{ data: TelegramConfigResponse | null; error: string | null }> {
  const res = await apiFetch<TelegramConfigResponse>(`/api/v1/telegram/config/rotate-secret?botType=${botType}`, {
    method: 'POST',
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function generateAgentBindingLink(
  agentBotUsername: string,
  userId: string
): Promise<{ deepLink: string | null; error: string | null }> {
  const res = await apiFetch<{ deepLink: string }>(
    `/api/v1/telegram/config/agent-binding-link?agentBotUsername=${encodeURIComponent(agentBotUsername)}&userId=${encodeURIComponent(userId)}`,
    {
      method: 'POST',
    }
  );
  if (res.error) {
    return { deepLink: null, error: res.error };
  }
  return { deepLink: res.data?.deepLink || null, error: null };
}

export async function updateReplyKeyboardButtons(
  buttons: TelegramReplyKeyboardButton[]
): Promise<{ data: TelegramConfigResponse | null; error: string | null }> {
  const res = await apiFetch<TelegramConfigResponse>('/api/v1/telegram/config/reply-keyboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buttons),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function updateTelegramGreetings(data: {
  welcomeMessage?: string;
  returningMessage?: string;
  greetingMenuButtons: TelegramGreetingMenuButton[];
  talkToHumanEnabled?: boolean;
  talkToHumanLabel?: string;
}): Promise<{ data: TelegramConfigResponse | null; error: string | null }> {
  const res = await apiFetch<TelegramConfigResponse>('/api/v1/telegram/config/greetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

