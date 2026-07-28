import { apiFetch } from './api';

export type RecipientMode = 'ALL' | 'TAGGED' | 'MANUAL';
export type EmailStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';

export type CustomEmailDTO = {
  id: string;
  subject: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recipientMode?: RecipientMode;
  tagsFilter?: string;
  status?: EmailStatus;
  sentAt?: string;
  totalSent?: number;
  totalFailed?: number;
  createdAt?: string;
};

export type CustomEmailRequest = {
  subject: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recipientMode?: RecipientMode;
  tagsFilter?: string;
  manualRecipients?: string;
};

export type EmailTemplateDTO = {
  id: string;
  name: string;
  subject: string;
  content: string;
  interestCategory?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PagedCustomEmailResponse = {
  content: CustomEmailDTO[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export async function fetchEmailCampaigns(
  page = 0,
  size = 50
): Promise<{ data: PagedCustomEmailResponse | null; error: string | null }> {
  const res = await apiFetch<PagedCustomEmailResponse>(`/api/v1/custom-emails?page=${page}&size=${size}`);
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function sendEmailCampaign(
  payload: CustomEmailRequest
): Promise<{ data: CustomEmailDTO | null; error: string | null }> {
  const res = await apiFetch<CustomEmailDTO>('/api/v1/custom-emails/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function saveEmailDraft(
  payload: CustomEmailRequest
): Promise<{ data: CustomEmailDTO | null; error: string | null }> {
  const res = await apiFetch<CustomEmailDTO>('/api/v1/custom-emails/draft', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function generateAiEmailContent(
  prompt: string
): Promise<{ data: { subject?: string; body?: string } | null; error: string | null }> {
  const res = await apiFetch<{ subject?: string; body?: string; text?: string; content?: string }>('/api/v1/custom-emails/generate-ai', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function resendEmailCampaign(
  id: string
): Promise<{ data: CustomEmailDTO | null; error: string | null }> {
  const res = await apiFetch<CustomEmailDTO>(`/api/v1/custom-emails/${id}/resend`, {
    method: 'POST',
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function fetchEmailTemplates(): Promise<{ data: EmailTemplateDTO[] | null; error: string | null }> {
  const res = await apiFetch<EmailTemplateDTO[]>('/api/v1/email-templates');
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || [], error: null };
}

export async function createEmailTemplate(payload: {
  name: string;
  subject: string;
  content: string;
  interestCategory?: string;
}): Promise<{ data: EmailTemplateDTO | null; error: string | null }> {
  const res = await apiFetch<EmailTemplateDTO>('/api/v1/email-templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function deleteEmailTemplate(id: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch<void>(`/api/v1/email-templates/${id}`, {
    method: 'DELETE',
  });
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true, error: null };
}
