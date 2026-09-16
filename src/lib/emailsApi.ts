import { apiFetch } from './api';

export type RecipientMode = 'ALL' | 'TAGGED' | 'MANUAL' | 'LEAD_STATUS_BASED';
export type EmailStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'PAUSED' | 'CANCELLED' | 'SENT' | 'FAILED' | 'COMPLETED' | 'UNKNOWN';

export type CustomEmailDTO = {
  id: string;
  name?: string;
  subject: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recipientMode?: RecipientMode;
  tagsFilter?: string;
  status?: EmailStatus;
  sentAt?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  cancelledAt?: string;
  totalRecipients?: number;
  processedRecipients?: number;
  totalSent?: number;
  totalFailed?: number;
  createdAt?: string;
  uniqueOpens?: number;
  uniqueClicks?: number;
  bounces?: number;
  unsubscribes?: number;
  uniqueRepliedCount?: number;
  totalReplyMessagesCount?: number;
  openRate?: number;
  clickRate?: number;
  clickToOpenRate?: number;
  bounceRate?: number;
  unsubscribeRate?: number;
  replyRatePercentage?: number;
};

export type CustomEmailRequest = {
  name?: string;
  subject: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  recipientMode?: RecipientMode;
  tagsFilter?: string;
  manualRecipients?: string;
  scheduledAt?: string;
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
): Promise<{ data: { subject?: string; htmlContent?: string; ctaLabel?: string; ctaUrl?: string } | null; error: string | null }> {
  const res = await apiFetch<{ subject?: string; htmlContent?: string; ctaLabel?: string; ctaUrl?: string }>('/api/v1/custom-emails/ai/generate-content', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function generateAiEmailTemplate(
  prompt: string
): Promise<{ data: { subject?: string; html?: string; hasUnsubscribeLink?: boolean } | null; error: string | null }> {
  const res = await apiFetch<{ subject?: string; html?: string; hasUnsubscribeLink?: boolean }>('/api/v1/custom-emails/ai/generate-template', {
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

export async function pauseEmailCampaign(
  id: string
): Promise<{ data: CustomEmailDTO | null; error: string | null }> {
  const res = await apiFetch<CustomEmailDTO>(`/api/v1/custom-emails/${id}/pause`, {
    method: 'POST',
  });
  if (res.error) return { data: null, error: res.error };
  return { data: res.data || null, error: null };
}

export async function resumeEmailCampaign(
  id: string
): Promise<{ data: CustomEmailDTO | null; error: string | null }> {
  const res = await apiFetch<CustomEmailDTO>(`/api/v1/custom-emails/${id}/resume`, {
    method: 'POST',
  });
  if (res.error) return { data: null, error: res.error };
  return { data: res.data || null, error: null };
}

export async function cancelEmailCampaign(
  id: string
): Promise<{ data: CustomEmailDTO | null; error: string | null }> {
  const res = await apiFetch<CustomEmailDTO>(`/api/v1/custom-emails/${id}/cancel`, {
    method: 'POST',
  });
  if (res.error) return { data: null, error: res.error };
  return { data: res.data || null, error: null };
}

export async function sendTestEmail(
  id: string,
  testEmail: string
): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch<{ message: string }>(`/api/v1/custom-emails/${id}/test-send`, {
    method: 'POST',
    body: JSON.stringify({ testEmail }),
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true, error: null };
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

export type EmailProviderType = 'AWS_SES' | 'BREVO' | 'ZOHO' | 'SMTP';

export type EmailProviderDTO = {
  id?: string;
  providerType: EmailProviderType;
  name: string;
  fromEmail: string;
  credentialsPayload: string;
  isDefault?: boolean;
  status?: 'CONNECTED' | 'ERROR' | 'UNVERIFIED';
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchEmailProviders(): Promise<{ data: EmailProviderDTO[] | null; error: string | null }> {
  const res = await apiFetch<EmailProviderDTO[]>('/api/v1/email-providers');
  if (res.error) return { data: null, error: res.error };
  return { data: res.data || [], error: null };
}

export async function saveEmailProvider(provider: EmailProviderDTO): Promise<{ data: EmailProviderDTO | null; error: string | null }> {
  const isEdit = !!provider.id;
  const endpoint = isEdit ? `/api/v1/email-providers/${provider.id}` : '/api/v1/email-providers';
  const method = isEdit ? 'PUT' : 'POST';
  const res = await apiFetch<EmailProviderDTO>(endpoint, {
    method,
    body: JSON.stringify(provider),
  });
  if (res.error) return { data: null, error: res.error };
  return { data: res.data || null, error: null };
}

export async function deleteEmailProvider(id: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch<void>(`/api/v1/email-providers/${id}`, {
    method: 'DELETE',
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true, error: null };
}

export async function testEmailProvider(provider: EmailProviderDTO, testEmail: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch<{ success: boolean }>(`/api/v1/email-providers/test?testEmail=${encodeURIComponent(testEmail)}`, {
    method: 'POST',
    body: JSON.stringify(provider),
  });
  if (res.error) return { success: false, error: res.error };
  return { success: res.data?.success || false, error: null };
}

export async function fetchEmailCampaignById(id: string): Promise<{ data: CustomEmailDTO | null; error: string | null }> {
  const res = await apiFetch<CustomEmailDTO>(`/api/v1/custom-emails/${id}`);
  if (res.error) return { data: null, error: res.error };
  return { data: res.data || null, error: null };
}

export type SuppressionReason = 'UNSUBSCRIBED' | 'HARD_BOUNCE' | 'SOFT_BOUNCE' | 'COMPLAINT' | 'MANUAL' | 'INVALID';

export type EmailSuppressionDTO = {
  id: string;
  email: string;
  reason: SuppressionReason;
  sourceCampaignId?: string;
  createdAt?: string;
  createdBy?: string;
};

export async function fetchEmailSuppressions(): Promise<{ data: EmailSuppressionDTO[] | null; error: string | null }> {
  const res = await apiFetch<EmailSuppressionDTO[]>('/api/v1/email-suppressions');
  if (res.error) return { data: null, error: res.error };
  return { data: res.data || [], error: null };
}

export async function addEmailSuppression(email: string, reason = 'MANUAL'): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch<{ message: string }>('/api/v1/email-suppressions', {
    method: 'POST',
    body: JSON.stringify({ email, reason }),
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true, error: null };
}

export async function deleteEmailSuppression(id: string): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch<{ message: string }>(`/api/v1/email-suppressions/${id}`, {
    method: 'DELETE',
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true, error: null };
}

export type EmailInboundMessageDTO = {
  id: string;
  campaignId?: string;
  recipientId?: string;
  campaignRecipientId?: string;
  replyToken?: string;
  provider: string;
  providerMessageId: string;
  messageId?: string;
  inReplyTo?: string;
  fromEmail: string;
  toEmail: string;
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  replySnippet?: string;
  attributionStatus: string;
  receivedAt: string;
  createdAt: string;
};

export async function fetchCampaignInboundReplies(campaignId: string): Promise<{ data: EmailInboundMessageDTO[] | null; error: string | null }> {
  const res = await apiFetch<EmailInboundMessageDTO[]>(`/api/v1/custom-emails/${campaignId}/replies`);
  if (res.error) return { data: null, error: res.error };
  return { data: res.data || [], error: null };
}

export async function simulateCampaignInboundReply(campaignId: string, fromEmail: string, textBody: string, subject?: string): Promise<{ data: EmailInboundMessageDTO | null; error: string | null }> {
  const res = await apiFetch<EmailInboundMessageDTO>(`/api/v1/custom-emails/${campaignId}/simulate-reply`, {
    method: 'POST',
    body: JSON.stringify({ fromEmail, textBody, subject }),
  });
  if (res.error) return { data: null, error: res.error };
  return { data: res.data || null, error: null };
}


