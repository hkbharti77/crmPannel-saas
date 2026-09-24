import { apiFetch, getTenantId } from './api';
import { MaskedSmsProvider, SmsSendRequest, SmsSendResult, SmsTemplate, SmsCampaign } from '../types/sms';

export interface SaveSmsProviderRequest {
  id?: string;
  providerType: 'TWILIO' | 'MSG91' | 'FAST2SMS' | 'AWS_SNS';
  name: string;
  senderId: string;
  isDefault?: boolean;
  accountSid?: string;
  authToken?: string;
  apiKey?: string;
  apiSecret?: string;
}

function resolveActiveTenantId(fallback: string = 'default'): string {
  const activeTenant = getTenantId();
  return activeTenant && activeTenant.trim() !== '' ? activeTenant.trim() : fallback;
}

export async function fetchSmsProviders(businessId: string = 'default'): Promise<MaskedSmsProvider[]> {
  const effectiveId = resolveActiveTenantId(businessId);
  const res = await apiFetch<MaskedSmsProvider[]>(`/api/v1/sms/providers?businessId=${encodeURIComponent(effectiveId)}`);
  if (res.error) {
    throw new Error(res.error);
  }
  return Array.isArray(res.data) ? res.data : [];
}

export async function saveSmsProvider(request: SaveSmsProviderRequest, businessId: string = 'default'): Promise<MaskedSmsProvider> {
  const effectiveId = resolveActiveTenantId(businessId);
  const res = await apiFetch<MaskedSmsProvider>(`/api/v1/sms/providers?businessId=${encodeURIComponent(effectiveId)}`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to save SMS provider credentials');
  }
  return res.data;
}

export async function deleteSmsProvider(id: string, businessId: string = 'default'): Promise<void> {
  const effectiveId = resolveActiveTenantId(businessId);
  const res = await apiFetch<void>(`/api/v1/sms/providers/${id}?businessId=${encodeURIComponent(effectiveId)}`, {
    method: 'DELETE',
  });
  if (res.error) {
    throw new Error(res.error);
  }
}

export async function sendSmsMessage(request: SmsSendRequest, businessId: string = 'default'): Promise<SmsSendResult> {
  const effectiveId = resolveActiveTenantId(businessId);
  const res = await apiFetch<SmsSendResult>(`/api/v1/sms/send?businessId=${encodeURIComponent(effectiveId)}`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
  if (res.error) {
    return {
      success: false,
      provider: 'NONE',
      errorMessage: res.error,
      segments: 1,
    };
  }
  return res.data || { success: false, provider: 'NONE', segments: 1 };
}

// Templates API
export async function fetchSmsTemplates(businessId: string = 'default'): Promise<SmsTemplate[]> {
  const effectiveId = resolveActiveTenantId(businessId);
  const res = await apiFetch<SmsTemplate[]>(`/api/v1/sms/templates?businessId=${encodeURIComponent(effectiveId)}`);
  if (res.error) {
    throw new Error(res.error);
  }
  return Array.isArray(res.data) ? res.data : [];
}

export async function saveSmsTemplate(template: SmsTemplate, businessId: string = 'default'): Promise<SmsTemplate> {
  const effectiveId = resolveActiveTenantId(businessId);
  const res = await apiFetch<SmsTemplate>(`/api/v1/sms/templates?businessId=${encodeURIComponent(effectiveId)}`, {
    method: 'POST',
    body: JSON.stringify(template),
  });
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to save SMS template');
  }
  return res.data;
}

export async function deleteSmsTemplate(id: string, businessId: string = 'default'): Promise<void> {
  const effectiveId = resolveActiveTenantId(businessId);
  const res = await apiFetch<void>(`/api/v1/sms/templates/${id}?businessId=${encodeURIComponent(effectiveId)}`, {
    method: 'DELETE',
  });
  if (res.error) {
    throw new Error(res.error);
  }
}

// Campaigns API
export async function fetchSmsCampaigns(businessId: string = 'default'): Promise<SmsCampaign[]> {
  const effectiveId = resolveActiveTenantId(businessId);
  const res = await apiFetch<SmsCampaign[]>(`/api/v1/sms/campaigns?businessId=${encodeURIComponent(effectiveId)}`);
  if (res.error) {
    throw new Error(res.error);
  }
  return Array.isArray(res.data) ? res.data : [];
}

export async function createSmsCampaign(campaign: { name: string; templateId?: string; providerId?: string; phoneNumbers: string[] }, businessId: string = 'default'): Promise<SmsCampaign> {
  const effectiveId = resolveActiveTenantId(businessId);
  const res = await apiFetch<SmsCampaign>(`/api/v1/sms/campaigns?businessId=${encodeURIComponent(businessId)}`, {
    method: 'POST',
    body: JSON.stringify(campaign),
  });
  if (res.error || !res.data) {
    throw new Error(res.error || 'Failed to create SMS campaign');
  }
  return res.data;
}

export async function triggerSmsCampaign(campaignId: string, businessId: string = 'default'): Promise<void> {
  const effectiveId = resolveActiveTenantId(businessId);
  const res = await apiFetch<string>(`/api/v1/sms/campaigns/${campaignId}/trigger?businessId=${encodeURIComponent(effectiveId)}`, {
    method: 'POST',
  });
  if (res.error) {
    throw new Error(res.error);
  }
}
