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

export async function fetchLeadsPaged(
  page = 0,
  size = 100,
  status?: string
): Promise<{ data: PagedLeadsResponse | null; error: string | null }> {
  let url = `/api/v1/leads/paged?page=${page}&size=${size}`;
  if (status) {
    url += `&status=${status}`;
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

export async function updateLeadStatus(
  leadId: string,
  status: string
): Promise<{ data: LeadDTO | null; error: string | null }> {
  const res = await apiFetch<LeadDTO>(`/api/v1/leads/${leadId}/status?status=${status}`, {
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
