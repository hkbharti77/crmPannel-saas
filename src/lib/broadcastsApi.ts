import { apiFetch } from './api';

export type WhatsAppCampaignDto = {
  id: string;
  name: string;
  templateId?: string;
  targetType?: string;
  targetFilterJson?: string;
  variableMappingJson?: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'EXECUTING' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  scheduleTime?: string;
  createdAt?: string;
  totalRecipients?: number;
  sentCount?: number;
  deliveredCount?: number;
  readCount?: number;
  failedCount?: number;
};

export type TemplateButtonDto = {
  type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL' | string;
  text: string;
  url?: string;
  phoneNumber?: string;
};

export type WhatsAppTemplateDto = {
  id?: string;
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION' | string;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED' | string;
  headerType?: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | string;
  headerContent?: string;
  bodyText?: string;
  footerText?: string;
  rejectedReason?: string;
  buttons?: TemplateButtonDto[];
  components?: unknown[];
};

export type CampaignAnalyticsDto = {
  campaignId: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  deliveryRate: number;
  readRate: number;
  responseRate: number;
};

export type PagedCampaignResponse = {
  content: WhatsAppCampaignDto[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export async function fetchCampaigns(
  page = 0,
  size = 20
): Promise<{ data: PagedCampaignResponse | null; error: string | null }> {
  const res = await apiFetch<PagedCampaignResponse>(`/api/v1/whatsapp/campaigns?page=${page}&size=${size}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function fetchCampaignById(
  id: string
): Promise<{ data: WhatsAppCampaignDto | null; error: string | null }> {
  const res = await apiFetch<WhatsAppCampaignDto>(`/api/v1/whatsapp/campaigns/${id}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function createCampaign(payload: {
  name: string;
  templateId: string;
  targetType: string;
  targetFilterJson?: string;
  variableMappingJson?: string;
  saveImportedRecipients?: boolean;
}): Promise<{ data: WhatsAppCampaignDto | null; error: string | null }> {
  const res = await apiFetch<WhatsAppCampaignDto>('/api/v1/whatsapp/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function executeDryRun(
  campaignId: string,
  testPhoneNumber: string
): Promise<{ success: boolean; message?: string; error: string | null }> {
  const res = await apiFetch<{ message: string; waMessageId: string }>(
    `/api/v1/whatsapp/campaigns/${campaignId}/dry-run`,
    {
      method: 'POST',
      body: JSON.stringify({ testPhoneNumber }),
    }
  );
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true, message: res.data?.message || 'Dry run sent successfully', error: null };
}

export async function scheduleCampaign(
  campaignId: string,
  scheduleTime?: string
): Promise<{ data: WhatsAppCampaignDto | null; error: string | null }> {
  const res = await apiFetch<WhatsAppCampaignDto>(`/api/v1/whatsapp/campaigns/${campaignId}/schedule`, {
    method: 'POST',
    body: JSON.stringify({ scheduleTime }),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function pauseCampaign(
  campaignId: string
): Promise<{ data: WhatsAppCampaignDto | null; error: string | null }> {
  const res = await apiFetch<WhatsAppCampaignDto>(`/api/v1/whatsapp/campaigns/${campaignId}/pause`, {
    method: 'POST',
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function resumeCampaign(
  campaignId: string
): Promise<{ data: WhatsAppCampaignDto | null; error: string | null }> {
  const res = await apiFetch<WhatsAppCampaignDto>(`/api/v1/whatsapp/campaigns/${campaignId}/resume`, {
    method: 'POST',
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function cancelCampaign(
  campaignId: string
): Promise<{ data: WhatsAppCampaignDto | null; error: string | null }> {
  const res = await apiFetch<WhatsAppCampaignDto>(`/api/v1/whatsapp/campaigns/${campaignId}/cancel`, {
    method: 'POST',
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function fetchCampaignAnalytics(
  campaignId: string
): Promise<{ data: CampaignAnalyticsDto | null; error: string | null }> {
  const res = await apiFetch<CampaignAnalyticsDto>(`/api/v1/whatsapp/campaigns/${campaignId}/analytics`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function fetchWhatsAppTemplates(
  forceSync = false
): Promise<{ data: WhatsAppTemplateDto[]; error: string | null }> {
  const res = await apiFetch<WhatsAppTemplateDto[]>(`/api/v1/whatsapp/templates?forceSync=${forceSync}`);
  if (res.error) {
    return { data: [], error: res.error };
  }
  return { data: res.data || [], error: null };
}

export async function createWhatsAppTemplate(
  template: WhatsAppTemplateDto
): Promise<{ data: WhatsAppTemplateDto | null; error: string | null }> {
  const res = await apiFetch<WhatsAppTemplateDto>('/api/v1/whatsapp/templates', {
    method: 'POST',
    body: JSON.stringify(template),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function deleteWhatsAppTemplate(
  name: string
): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch<void>(`/api/v1/whatsapp/templates/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true, error: null };
}

export type WhatsAppAiTemplateResponseDto = {
  headerContent: string;
  bodyText: string;
  footerText: string;
  buttons: TemplateButtonDto[];
};

export async function generateAiWhatsAppTemplate(
  prompt: string
): Promise<{ data: WhatsAppAiTemplateResponseDto | null; error: string | null }> {
  const res = await apiFetch<WhatsAppAiTemplateResponseDto>('/api/v1/whatsapp/templates/ai/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

// ─── CSV Broadcast Upload Types & APIs ────────────────────────────────────

export type InvalidRowDto = {
  rowNumber: number;
  phone: string;
  reason: string;
};

export type BroadcastCsvUploadResult = {
  totalRows: number;
  detectedColumns: string[];
  phoneColumnName: string;
  validPhoneCount: number;
  invalidPhoneCount: number;
  duplicatePhoneCount: number;
  sampleRows: Record<string, string | null>[];
  invalidRows: InvalidRowDto[];
  validRows: Record<string, string | null>[];
};

export type FilterRuleDto = {
  column: string;
  operator: string; // EQUALS, CONTAINS, STARTS_WITH, IN, NOT_EQUALS
  label: string;
};

export type BroadcastFilterConfig = {
  filterColumns: string[];
  filterRules: FilterRuleDto[];
};

/**
 * Uploads and parses a CSV/XLSX file for WhatsApp broadcast audience targeting.
 * Returns detected columns, phone validation stats, and sample rows.
 */
export async function uploadCsvForBroadcast(
  file: File
): Promise<{ data: BroadcastCsvUploadResult | null; error: string | null }> {
  const token = localStorage.getItem('crmlite_token');
  const tenantId = localStorage.getItem('crmlite_tenant_id');
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantId) headers['X-Tenant-ID'] = tenantId;

    const res = await fetch(`${baseUrl}/api/v1/whatsapp/campaigns/upload-csv`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: `Upload failed (${res.status})` }));
      return { data: null, error: body?.message || body?.error || `Upload failed (${res.status})` };
    }

    const data: BroadcastCsvUploadResult = await res.json();
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: (err as Error)?.message || 'Network error during file upload' };
  }
}

/**
 * Fetches the admin-defined broadcast upload filter configuration for the current tenant.
 */
export async function fetchBroadcastFilterConfig(): Promise<{
  data: BroadcastFilterConfig | null;
  error: string | null;
}> {
  const res = await apiFetch<BroadcastFilterConfig>('/api/v1/whatsapp/campaigns/filter-config');
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

/**
 * Updates the broadcast upload filter configuration (OWNER/ADMIN only).
 */
export async function updateBroadcastFilterConfig(
  config: BroadcastFilterConfig
): Promise<{ data: BroadcastFilterConfig | null; error: string | null }> {
  const res = await apiFetch<BroadcastFilterConfig>('/api/v1/whatsapp/campaigns/filter-config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export type WhatsAppCampaignRecipientDto = {
  id: string;
  phoneNumber: string;
  status: 'PENDING' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'SKIPPED';
  errorMessage?: string;
  skipReason?: string;
  waMessageId?: string;
  resolvedVariablesJson?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  retryCount?: number;
};

export type PagedRecipientResponse = {
  content: WhatsAppCampaignRecipientDto[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export async function fetchCampaignRecipients(
  campaignId: string,
  page = 0,
  size = 50
): Promise<{ data: PagedRecipientResponse | null; error: string | null }> {
  const res = await apiFetch<PagedRecipientResponse>(`/api/v1/whatsapp/campaigns/${campaignId}/recipients?page=${page}&size=${size}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}
