import { apiFetch, getAuthToken, getTenantId } from './api';
import type { ContactDTO } from './messagesApi';

export type LeadDTO = {
  id: string;
  leadNumber?: string;
  contact?: ContactDTO;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'WON' | 'LOST';
  enquiries?: any[];
  createdAt?: string;
  lastActivity?: string;
  dealValue?: number;
  currency?: string;
  dealLabel?: string;
  isNew?: boolean;
  createdAtHuman?: string;
  ownerName?: string;
  score?: number;
};

export type RevenueReportDTO = {
  totalPipelineValue?: number;
  wonRevenue?: number;
  totalLeadsCount?: number;
  qualifiedDealsCount?: number;
  winRatePercentage?: number;
};

export type PagedLeadsResponse = {
  content: LeadDTO[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type LeadNoteDTO = {
  id: string;
  leadId: string;
  content: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
};

export type LeadAttachmentDTO = {
  id: string;
  leadId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storageType: string;
  uploaderName: string;
  createdAt: string;
  downloadUrl: string;
};

export type LeadActivityDTO = {
  id: string;
  leadId: string;
  type: string;
  actorName: string;
  metadataJson: string;
  createdAt: string;
};

export type PagedResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export async function fetchLeadsPaged(
  page = 0,
  size = 100,
  status?: string,
  search?: string
): Promise<{ data: PagedLeadsResponse | null; error: string | null }> {
  let url = `/api/v1/leads/paged?page=${page}&size=${size}`;
  if (status) {
    url += `&status=${status}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

  const res = await apiFetch<PagedLeadsResponse>(url);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function fetchLeadById(
  leadId: string
): Promise<{ data: LeadDTO | null; error: string | null }> {
  const res = await apiFetch<LeadDTO>(`/api/v1/leads/${leadId}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function fetchLeadsByContactId(contactId: string) {
  try {
    const res = await apiFetch<LeadDTO[]>(`/api/v1/leads/contact/${contactId}`);
    return { data: res.data, error: res.error };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function updateLeadStatus(
  leadId: string,
  status: string,
  dealValue?: number,
  lostReason?: string,
  paymentStatus?: string,
  sendPaymentLink?: boolean,
  paymentMethod?: string,
  paymentLinkUrl?: string
): Promise<{ data: LeadDTO | null; error: string | null }> {
  let url = `/api/v1/leads/${leadId}/status?status=${status}`;
  if (dealValue !== undefined) url += `&dealValue=${dealValue}`;
  if (lostReason !== undefined) url += `&lostReason=${encodeURIComponent(lostReason)}`;
  if (paymentStatus !== undefined) url += `&paymentStatus=${paymentStatus}`;
  if (sendPaymentLink !== undefined) url += `&sendPaymentLink=${sendPaymentLink}`;
  if (paymentMethod !== undefined) url += `&paymentMethod=${encodeURIComponent(paymentMethod)}`;
  if (paymentLinkUrl !== undefined) url += `&paymentLinkUrl=${encodeURIComponent(paymentLinkUrl)}`;
  
  const res = await apiFetch<LeadDTO>(url, {
    method: 'PATCH',
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function fetchRevenueReport(): Promise<{ data: RevenueReportDTO | null; error: string | null }> {
  const res = await apiFetch<RevenueReportDTO>('/api/v1/leads/revenue');
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function downloadLeadsExport(format: 'csv' | 'excel' = 'csv'): Promise<void> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const token = getAuthToken();
  const tenantId = getTenantId();

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;

  const res = await fetch(`${API_BASE_URL}/api/v1/leads/export?format=${format}`, {
    headers,
  });

  if (!res.ok) {
    alert('Failed to download leads export file');
    return;
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `leads_export.${format === 'excel' ? 'xlsx' : 'csv'}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// ── Notes ─────────────────────────────────────────────────────────────

export async function fetchLeadNotes(leadId: string, page = 0, size = 20) {
  return apiFetch<PagedResponse<LeadNoteDTO>>(`/api/v1/leads/${leadId}/notes?page=${page}&size=${size}`);
}

export async function createLeadNote(leadId: string, content: string) {
  return apiFetch<LeadNoteDTO>(`/api/v1/leads/${leadId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function deleteLeadNote(leadId: string, noteId: string) {
  return apiFetch<void>(`/api/v1/leads/${leadId}/notes/${noteId}`, {
    method: 'DELETE',
  });
}

// ── Attachments ───────────────────────────────────────────────────────

export async function fetchLeadAttachments(leadId: string, page = 0, size = 20) {
  return apiFetch<PagedResponse<LeadAttachmentDTO>>(`/api/v1/leads/${leadId}/attachments?page=${page}&size=${size}`);
}

export async function uploadLeadAttachment(leadId: string, file: File) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const token = getAuthToken();
  const tenantId = getTenantId();

  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/leads/${leadId}/attachments`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errText = await res.text();
      return { data: null, error: errText || 'Failed to upload attachment' };
    }
    const data: LeadAttachmentDTO = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error' };
  }
}

export async function deleteLeadAttachment(leadId: string, attachmentId: string) {
  return apiFetch<void>(`/api/v1/leads/${leadId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}

// ── Reassign & Activity ───────────────────────────────────────────────

export async function reassignLeadOwner(leadId: string, agentId: string) {
  return apiFetch<LeadDTO>(`/api/v1/leads/${leadId}/assign?agentId=${agentId}`, {
    method: 'PATCH',
  });
}

export async function fetchLeadActivities(leadId: string, page = 0, size = 20) {
  return apiFetch<PagedResponse<LeadActivityDTO>>(`/api/v1/leads/${leadId}/activities?page=${page}&size=${size}`);
}

export async function logCallActivity(leadId: string) {
  return apiFetch<void>(`/api/v1/leads/${leadId}/call-log`, {
    method: 'POST',
  });
}

export type LeadScoreResultDTO = {
  totalScore: number;
  scoreGrade: 'HOT' | 'WARM' | 'COLD';
  interactionScore: number;
  sentimentScore: number;
  dealValueScore: number;
  profileScore: number;
  calculatedAt: string;
};

export async function recalculateLeadScore(leadId: string) {
  return apiFetch<LeadScoreResultDTO>(`/api/v1/leads/${leadId}/recalculate-score`, {
    method: 'POST',
  });
}
