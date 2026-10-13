import { apiFetch } from './api';
import type {
  WhatsAppCallSummaryDTO,
  WhatsAppCallDetailDTO,
  WhatsAppCallTurnDTO,
  WhatsAppCallingAnalyticsDTO,
} from './whatsappCallingApi';

export interface VoiceCallOptions {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
  status?: string;
  callDirection?: 'BUSINESS_INITIATED' | 'USER_INITIATED';
  phone?: string;
  from?: string;
  to?: string;
}

export interface PagedVoiceCallsResponse {
  content: WhatsAppCallSummaryDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PagedVoiceTurnsResponse {
  content: WhatsAppCallTurnDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export async function fetchVoiceCalls(
  options: VoiceCallOptions = {}
): Promise<{ data: PagedVoiceCallsResponse | null; error: string | null }> {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.append('page', options.page.toString());
  if (options.size !== undefined) params.append('size', options.size.toString());
  if (options.sort) params.append('sort', options.sort);
  if (options.direction) params.append('direction', options.direction);
  if (options.status) params.append('status', options.status);
  if (options.callDirection) params.append('callDirection', options.callDirection);
  if (options.phone) params.append('phone', options.phone);
  if (options.from) params.append('from', options.from);
  if (options.to) params.append('to', options.to);

  const res = await apiFetch<PagedVoiceCallsResponse>(`/api/v1/voice/calls?${params.toString()}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function fetchVoiceCallDetails(
  callId: string
): Promise<{ data: WhatsAppCallDetailDTO | null; error: string | null }> {
  const res = await apiFetch<WhatsAppCallDetailDTO>(`/api/v1/voice/calls/${encodeURIComponent(callId)}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function fetchVoiceCallTurns(
  callId: string,
  page = 0,
  size = 50
): Promise<{ data: PagedVoiceTurnsResponse | null; error: string | null }> {
  const res = await apiFetch<PagedVoiceTurnsResponse>(
    `/api/v1/voice/calls/${encodeURIComponent(callId)}/turns?page=${page}&size=${size}`
  );
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function fetchVoiceAnalytics(
  phoneNumberId?: string,
  from?: string,
  to?: string
): Promise<{ data: WhatsAppCallingAnalyticsDTO | null; error: string | null }> {
  const params = new URLSearchParams();
  if (phoneNumberId) params.append('phoneNumberId', phoneNumberId);
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const res = await apiFetch<WhatsAppCallingAnalyticsDTO>(`/api/v1/voice/analytics?${params.toString()}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function triggerVoiceTestCall(
  toPhone: string,
  phoneNumberId?: string
): Promise<{ data: unknown | null; error: string | null }> {
  const res = await apiFetch<unknown>('/api/v1/voice/test-call', {
    method: 'POST',
    body: JSON.stringify({ toPhone, phoneNumberId }),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}
