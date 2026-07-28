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
  components?: any[];
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
