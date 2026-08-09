import { apiFetch } from './api';
import type { TicketStatus, TicketPriority } from './types';

export type TicketCommentDTO = {
  id: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
};

export type TicketDTO = {
  id: string;
  referenceNumber?: string;
  ticketNumber?: string;
  contactId?: string;
  contactName?: string;
  contactWaId?: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  source?: string;
  category?: string;
  assignedToId?: string;
  assignedToName?: string;
  comments?: TicketCommentDTO[];
  slaStatus?: string;
  slaBreached?: boolean;
  firstResponseDueAt?: string;
  resolutionDueAt?: string;
  firstRespondedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  isNew?: boolean;
  createdAtHuman?: string;
};

export type CreateTicketPayload = {
  subject: string;
  description: string;
  category?: string;
  priority?: TicketPriority;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  contactId?: string;
  assignedToId?: string;
};

export async function fetchTickets(params?: {
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}): Promise<{ data: TicketDTO[] | null; error: string | null }> {
  const queryParts: string[] = [];
  if (params?.status && params.status !== 'ALL') {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params?.search) {
    queryParts.push(`search=${encodeURIComponent(params.search)}`);
  }
  if (params?.page !== undefined) {
    queryParts.push(`page=${params.page}`);
  }
  if (params?.size !== undefined) {
    queryParts.push(`size=${params.size}`);
  }

  const queryStr = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const res = await apiFetch<TicketDTO[]>(`/api/v1/tickets${queryStr}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || [], error: null };
}

export async function fetchTicketById(id: string): Promise<{ data: TicketDTO | null; error: string | null }> {
  const res = await apiFetch<TicketDTO>(`/api/v1/tickets/${id}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function createTicket(payload: CreateTicketPayload): Promise<{ data: TicketDTO | null; error: string | null }> {
  const res = await apiFetch<TicketDTO>('/api/v1/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<{ data: TicketDTO | null; error: string | null }> {
  const res = await apiFetch<TicketDTO>(`/api/v1/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function updateTicketPriority(id: string, priority: TicketPriority): Promise<{ data: TicketDTO | null; error: string | null }> {
  const res = await apiFetch<TicketDTO>(`/api/v1/tickets/${id}/priority`, {
    method: 'PATCH',
    body: JSON.stringify({ priority }),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function addTicketComment(id: string, message: string, internal = false): Promise<{ data: TicketDTO | null; error: string | null }> {
  const res = await apiFetch<TicketDTO>(`/api/v1/tickets/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ message, internal }),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function deleteTicket(id: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch<void>(`/api/v1/tickets/${id}`, {
    method: 'DELETE',
  });
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true, error: null };
}
