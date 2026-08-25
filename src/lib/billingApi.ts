import { apiFetch, getAuthToken, getTenantId } from './api';

export interface BillingLimits {
  employeeLimit: number;
  primaryResourceLimit: number;
  secondaryResourceLimit: number;
  ticketLimit: number;
  emailLimit: number;
  hasWhatsapp: boolean;
  hasWhatsappCampaign?: boolean;
  whatsappCampaignLimit?: number;
  allowedPriorities?: ('LOW' | 'MEDIUM' | 'HIGH')[];
  hasCustomWidget: boolean;
  hasRagLlm?: boolean;
}

export interface BillingUsage {
  employeesCount: number;
  leadsCount: number;
  bookingsCount: number;
  appointmentsCount: number;
  ticketsCount: number;
  emailsCount: number;
  whatsappCampaignsCount?: number;
}

export interface SubscriptionData {
  planId: string;
  planName: string;
  status: string;
  billingCycle: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  primaryResource?: string;
  limits: BillingLimits;
  usage: BillingUsage;
}

export interface SubscriptionPlanDto {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  priceMonthlyInr?: number;
  priceYearlyInr?: number;
  priceMonthlyUsd?: number;
  priceYearlyUsd?: number;
  employeeLimit: number;
  primaryResourceLimit: number;
  secondaryResourceLimit: number;
  ticketLimit: number;
  emailLimit: number;
  hasWhatsapp: boolean;
  hasWhatsappCampaign?: boolean;
  whatsappCampaignLimit?: number;
  allowedPriorities?: ('LOW' | 'MEDIUM' | 'HIGH')[];
  hasCustomWidget: boolean;
  hasRagLlm: boolean;
  isContactUs?: boolean;
}

export interface BillingTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  gateway?: string;
  paymentGateway?: string;
  gatewayTransactionId?: string;
  createdAt: string;
  invoiceUrl?: string;
}

export interface CheckoutResponse {
  checkoutUrl?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  gateway?: 'STRIPE' | 'RAZORPAY';
  keyId?: string;
  planId?: string;
  planName?: string;
}

export interface VerifyRazorpayPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  planId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
}

export interface EffectiveEntitlementsDto {
  basePlanId: string;
  basePlanName: string;
  isCustomized: boolean;
  entitlementVersion: number;
  features: {
    hasWhatsapp: boolean;
    hasWhatsappCampaign: boolean;
    hasCustomWidget: boolean;
    hasRagLlm: boolean;
    hasEmailCampaign: boolean;
  };
  limits: {
    employeeLimit: number;
    primaryResourceLimit: number;
    secondaryResourceLimit: number;
    ticketLimit: number;
    emailLimit: number;
    maxRecipientsPerWhatsappCampaign: number;
    monthlyWhatsappMessageQuota: number;
  };
  pricing: {
    monthlyInr: number;
    yearlyInr: number;
    monthlyUsd: number;
    yearlyUsd: number;
  };
  maxAllowedPriority: 'LOW' | 'MEDIUM' | 'HIGH';
  allowedPriorities: ('LOW' | 'MEDIUM' | 'HIGH')[];
  trace?: Record<string, { value: unknown; source: 'TENANT_OVERRIDE' | 'BASE_PLAN' }>;
}

export interface UpdateTenantOverridesPayload {
  hasWhatsapp?: boolean;
  hasWhatsappCampaign?: boolean;
  hasCustomWidget?: boolean;
  hasRagLlm?: boolean;
  hasEmailCampaign?: boolean;
  employeeLimit?: number;
  primaryResourceLimit?: number;
  secondaryResourceLimit?: number;
  ticketLimit?: number;
  emailLimit?: number;
  maxRecipientsPerWhatsappCampaign?: number;
  monthlyWhatsappMessageQuota?: number;
  maxAllowedPriority?: 'LOW' | 'MEDIUM' | 'HIGH';
  customMonthlyInr?: number;
  customYearlyInr?: number;
  customMonthlyUsd?: number;
  customYearlyUsd?: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
  reason?: string;
}

export interface TenantOverrideAudit {
  id: string;
  action: 'CREATE_OVERRIDE' | 'UPDATE_OVERRIDE' | 'RESET_OVERRIDE' | 'EXPIRE_OVERRIDE';
  oldValueJson?: string;
  newValueJson?: string;
  changedBy: string;
  reason?: string;
  requestId?: string;
  ipAddress?: string;
  createdAt: string;
}

export async function fetchEffectiveEntitlements(tenantId: string, trace = false) {
  return apiFetch<EffectiveEntitlementsDto>(`/api/v1/platform/tenants/${tenantId}/entitlements?trace=${trace}`);
}

export async function updateTenantOverrides(tenantId: string, payload: UpdateTenantOverridesPayload) {
  return apiFetch<EffectiveEntitlementsDto>(`/api/v1/platform/tenants/${tenantId}/overrides`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function resetTenantOverrides(tenantId: string) {
  return apiFetch<{ message: string }>(`/api/v1/platform/tenants/${tenantId}/overrides`, {
    method: 'DELETE',
  });
}

export async function fetchOverrideAudits(tenantId: string) {
  return apiFetch<TenantOverrideAudit[]>(`/api/v1/platform/tenants/${tenantId}/override-audits`);
}

export async function fetchAvailablePlans(currency?: string) {
  const query = currency ? `?currency=${currency}` : '';
  return apiFetch<SubscriptionPlanDto[]>(`/api/v1/billing/plans${query}`);
}

export async function fetchSubscriptionStatus() {
  return apiFetch<SubscriptionData>('/api/v1/billing/subscription');
}

export async function fetchBillingTransactions() {
  return apiFetch<BillingTransaction[]>('/api/v1/billing/transactions');
}

export async function initiateCheckout(
  planId: string,
  billingCycle: 'MONTHLY' | 'YEARLY',
  gateway: 'STRIPE' | 'RAZORPAY',
  currency: 'INR' | 'USD' = 'INR'
) {
  return apiFetch<CheckoutResponse>('/api/v1/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ planId, billingCycle, gateway, currency }),
  });
}

export async function verifyRazorpayPayment(payload: VerifyRazorpayPayload) {
  return apiFetch<{ success: boolean; message: string; planId: string }>('/api/v1/billing/verify-razorpay', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function downloadInvoice(transactionId: string) {
  const token = getAuthToken();
  const tenantId = getTenantId();

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;

  const response = await fetch(`/api/v1/billing/invoice/${transactionId}/download`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to download invoice receipt');
  }

  const htmlText = await response.text();
  const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${transactionId.substring(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export async function resendInvoiceEmailApi(transactionId: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/billing/invoice/${transactionId}/resend`, {
    method: 'POST',
  });
}
