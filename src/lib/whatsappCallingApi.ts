import { apiFetch } from './api';

// =========================================================
// WhatsApp Calling TypeScript DTOs
// =========================================================

export type CallDirection = 'BUSINESS_INITIATED' | 'USER_INITIATED';

export type CallState =
  | 'INITIATED'
  | 'OFFER_SENT'
  | 'RINGING'
  | 'ACTIVE'
  | 'TERMINATED'
  | 'REJECTED'
  | 'MISSED'
  | 'FAILED'
  | 'TIMEOUT'
  | 'ENDED';

export interface WhatsAppCallSummaryDTO {
  id: string;
  callId: string;
  direction: CallDirection | string;
  fromWaId: string;
  toWaId: string;
  state: CallState | string;
  phoneNumberId: string;
  startedAt?: string | null;
  connectedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;
  terminationReason?: string | null;
  createdAt: string;
}

export interface WhatsAppCallDetailDTO {
  id: string;
  callId: string;
  direction: CallDirection | string;
  fromWaId: string;
  toWaId: string;
  state: CallState | string;
  phoneNumberId: string;
  wabaId?: string | null;
  signalingMode?: string | null;
  mediaMode?: string | null;
  codec?: string | null;

  startedAt?: string | null;
  acceptedAt?: string | null;
  connectedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;

  terminationSource?: string | null;
  terminationReason?: string | null;
  failureStage?: string | null;

  metaErrorCode?: number | null;
  metaErrorTitle?: string | null;
  metaErrorMessage?: string | null;

  aiSessionId?: string | null;
  contactId?: string | null;
  contactName?: string | null;

  recordingAvailable?: boolean | null;
  recordingStatus?: string | null;
  recordingPublicId?: string | null;
  recordingFormat?: string | null;
  recordingDurationSeconds?: number | null;
  recordingSizeBytes?: number | null;
  recordingPlaybackUrl?: string | null;
  recordingDownloadUrl?: string | null;

  createdAt: string;
  updatedAt?: string | null;
}

export interface WhatsAppCallTurnDTO {
  turnId: string;
  turnNumber: number;
  speaker: 'USER' | 'ASSISTANT' | string;
  transcript: string;
  timestamp: string;
  audioDurationSeconds?: number | null;
  sttLatencyMs?: number | null;
  llmLatencyMs?: number | null;
  ttsLatencyMs?: number | null;
  ttfaMs?: number | null;
  wasInterrupted?: boolean | null;
  detectedLanguage?: string | null;
}

export interface WhatsAppCallingAnalyticsDTO {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  answeredCalls: number;
  rejectedCalls: number;
  failedCalls: number;
  completedCalls: number;
  averageDurationSeconds: number;
  totalDurationSeconds: number;
  answerRate: number;
  failureCount: number;
  terminationReasons: Record<string, number>;
  statusBreakdown: Record<string, number>;
  from?: string | null;
  to?: string | null;
}

export interface WhatsAppCallRecordingDTO {
  callId: string;
  available: boolean;
  status: 'AVAILABLE' | 'PROCESSING' | 'FAILED' | 'NOT_AVAILABLE' | string;
  publicId?: string | null;
  format?: string | null;
  durationSeconds?: number | null;
  sizeBytes?: number | null;
  playbackUrl?: string | null;
  signedDirectUrl?: string | null;
  downloadUrl?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
}

export interface CallPermissionResponseDTO {
  id: string;
  phoneNumberId: string;
  userWaId: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'REVOKED' | 'REJECTED' | 'NONE' | string;
  permissionType?: string | null;
  isPermanent?: boolean | null;
  grantedAt?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  lastPermissionRequestAt?: string | null;
  active: boolean;
  canInitiateCall: boolean;
}

export interface InitiateWhatsAppCallRequest {
  contactId?: string;
  toWaId?: string;
  phoneNumberId?: string;
  idempotencyKey?: string;
  bizOpaqueCallbackData?: string;
}

export interface RequestCallPermissionRequest {
  contactId?: string;
  userWaId?: string;
  phoneNumberId?: string;
  messageText?: string;
}

export interface WhatsAppCallResponse {
  callId: string;
  status: string;
  direction: string;
  phoneNumberId?: string;
  toWaId?: string;
  fromWaId?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ListCallsParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
  status?: string;
  callDirection?: string;
  phone?: string;
  contactId?: string;
  from?: string;
  to?: string;
}

// =========================================================
// API Functions
// =========================================================

/**
 * Initiates an outbound WhatsApp voice call.
 */
export async function initiateWhatsAppCall(
  request: InitiateWhatsAppCallRequest,
  idempotencyKey?: string
) {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  return apiFetch<WhatsAppCallResponse>('/api/v1/voice/whatsapp/calls', {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });
}

/**
 * Lists calls for the authenticated tenant with pagination, filtering, and sorting.
 */
export async function fetchWhatsAppCalls(params: ListCallsParams = {}) {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.sort) query.set('sort', params.sort);
  if (params.direction) query.set('direction', params.direction);
  if (params.status) query.set('status', params.status);
  if (params.callDirection) query.set('callDirection', params.callDirection);
  if (params.phone) query.set('phone', params.phone);
  if (params.contactId) query.set('contactId', params.contactId);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);

  const qs = query.toString();
  return apiFetch<PageResponse<WhatsAppCallSummaryDTO>>(
    `/api/v1/voice/whatsapp/calls${qs ? `?${qs}` : ''}`
  );
}

/**
 * Retrieves detailed session metadata for a specific call.
 */
export async function fetchWhatsAppCallDetail(callId: string) {
  return apiFetch<WhatsAppCallDetailDTO>(`/api/v1/voice/whatsapp/calls/${encodeURIComponent(callId)}`);
}

/**
 * Terminates an active WhatsApp voice call on demand.
 */
export async function terminateWhatsAppCall(
  callId: string
): Promise<{ data?: { success: boolean; callId: string; message: string }; error?: string }> {
  return apiFetch<{ success: boolean; callId: string; message: string }>(
    `/api/v1/voice/whatsapp/calls/${encodeURIComponent(callId)}/terminate`,
    {
      method: 'POST',
    }
  );
}

/**
 * Retrieves conversation transcript turns for a specific call.
 */
export async function fetchWhatsAppCallTurns(callId: string, page = 0, size = 50) {
  return apiFetch<PageResponse<WhatsAppCallTurnDTO>>(
    `/api/v1/voice/whatsapp/calls/${encodeURIComponent(callId)}/turns?page=${page}&size=${size}`
  );
}

/**
 * Retrieves recording metadata and secure playback/download URLs for a specific call.
 */
export async function fetchWhatsAppCallRecording(callId: string) {
  return apiFetch<WhatsAppCallRecordingDTO>(
    `/api/v1/voice/whatsapp/calls/${encodeURIComponent(callId)}/recording`
  );
}

/**
 * Retrieves aggregated calling metrics and analytics.
 */
export async function fetchWhatsAppCallingAnalytics(params: {
  phoneNumberId?: string;
  from?: string;
  to?: string;
} = {}) {
  const query = new URLSearchParams();
  if (params.phoneNumberId) query.set('phoneNumberId', params.phoneNumberId);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);

  const qs = query.toString();
  return apiFetch<WhatsAppCallingAnalyticsDTO>(
    `/api/v1/voice/whatsapp/analytics${qs ? `?${qs}` : ''}`
  );
}

/**
 * Sends an interactive WhatsApp Outbound Call Permission request template.
 */
export async function requestWhatsAppCallPermission(request: RequestCallPermissionRequest) {
  return apiFetch<CallPermissionResponseDTO>('/api/v1/voice/whatsapp/permissions', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Checks the outbound call permission status for a contact ID or phone number.
 */
export async function fetchWhatsAppCallPermission(contactIdOrPhone: string, phoneNumberId?: string) {
  const query = phoneNumberId ? `?phoneNumberId=${encodeURIComponent(phoneNumberId)}` : '';
  return apiFetch<CallPermissionResponseDTO>(
    `/api/v1/voice/whatsapp/permissions/${encodeURIComponent(contactIdOrPhone)}${query}`
  );
}

/**
 * Format duration in seconds to MM:SS string.
 */
export function formatCallDuration(seconds?: number | null): string {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '00:00';
  const totalSecs = Math.round(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Humanize call state label.
 */
export function getCallStateLabel(state?: string | null): string {
  if (!state) return 'Unknown';
  switch (state.toUpperCase()) {
    case 'INITIATED':
      return 'Initiating';
    case 'OFFER_SENT':
      return 'Calling';
    case 'RINGING':
      return 'Ringing';
    case 'ACTIVE':
    case 'CONNECTED':
      return 'Active Call';
    case 'TERMINATED':
    case 'ENDED':
      return 'Completed';
    case 'REJECTED':
      return 'Declined';
    case 'MISSED':
      return 'Missed';
    case 'TIMEOUT':
      return 'Timed Out';
    case 'FAILED':
      return 'Failed';
    default:
      return state;
  }
}
