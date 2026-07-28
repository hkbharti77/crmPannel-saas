import { apiFetch } from './api';

export interface BillingLimits {
  employeeLimit: number;
  primaryResourceLimit: number;
  secondaryResourceLimit: number;
  ticketLimit: number;
  emailLimit: number;
  hasWhatsapp: boolean;
  hasCustomWidget: boolean;
}

export interface BillingUsage {
  employeesCount: number;
  leadsCount: number;
  bookingsCount: number;
  appointmentsCount: number;
  ticketsCount: number;
  emailsCount: number;
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
  hasCustomWidget: boolean;
  hasRagLlm: boolean;
  isContactUs?: boolean;
}

export interface BillingTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  createdAt: string;
  invoiceUrl?: string;
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

export async function initiateCheckout(planId: string, billingCycle: 'MONTHLY' | 'YEARLY', gateway: 'STRIPE' | 'RAZORPAY') {
  return apiFetch<{ checkoutUrl?: string; orderId?: string }>('/api/v1/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ planId, billingCycle, gateway }),
  });
}
