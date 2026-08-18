import { apiFetch, authHeaders } from '@/lib/api';

export type TenantEffectiveEntitlements = {
  tenantId: string;
  planId: string;
  planName: string;
  entitlementVersion: number;
  pages: Record<string, boolean>;
  settings: Record<string, boolean>;
  services: Record<string, boolean>;
  limits?: {
    employeeLimit: number;
    primaryResourceLimit: number;
    secondaryResourceLimit: number;
    ticketLimit: number;
    emailLimit: number;
    maxRecipientsPerWhatsappCampaign: number;
    monthlyWhatsappMessageQuota: number;
  };
};

export async function fetchMyTenantEntitlements() {
  return apiFetch<TenantEffectiveEntitlements>('/api/v1/tenants/me/entitlements', {
    headers: authHeaders(),
  });
}
