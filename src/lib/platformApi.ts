/**
 * platformApi.ts
 * All API calls for the Super Admin / Platform panel.
 * Uses the same JWT token from localStorage as the regular app.
 * Base: /api/v1/platform/**  — all routes require ROLE=SUPER_ADMIN.
 */

import { apiFetch } from '@/lib/api';

/* ─── Types ─── */
export type ApiTenant = {
  id: string;
  businessName: string;
  businessType?: string;
  planType: string;
  onboardingCompleted: boolean;
  createdAt: string;
  userCount?: number;
  leadCount?: number;
  status?: string; // derived or from subscription
};

export type ApiUser = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  accountStatus: string;
  phone?: string;
  createdAt: string;
  tenantId?: string;
  tenant?: { id: string; businessName: string };
};

export type ApiTicket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category?: string;
  tenantId?: string;
  createdByEmail?: string;
  createdAt: string;
  updatedAt?: string;
};

export type ApiTicketMessage = {
  id: string;
  body: string;
  authorEmail: string;
  createdAt: string;
};

export type ApiAuditEntry = {
  id: string;
  action: string;
  outcome?: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
  ipAddress?: string;
  userAgent?: string;
  performedByEmail?: string;
  targetUserEmail?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
};

export type ApiAnalyticsOverview = {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalLeads: number;
  openTickets: number;
  degradedServices: number;
  mrr?: number;
};

export type ApiHealthService = {
  name: string;
  status: string;
  uptime?: number;
  latency?: number;
  message?: string;
};

export type ApiHealthResponse = {
  status: string;
  services?: unknown;
  timestamp?: string;
};

export function normalizeHealthServices(servicesRaw: unknown): ApiHealthService[] {
  if (!servicesRaw) return [];
  if (Array.isArray(servicesRaw)) return servicesRaw;
  if (typeof servicesRaw === 'object') {
    return Object.entries(servicesRaw as Record<string, Record<string, unknown>>).map(([key, val]) => ({
      name: (val?.version as string) || key.toUpperCase(),
      status: (val?.status as string) ?? 'UP',
      uptime: (val?.uptime as number) ?? 99.9,
      latency: (val?.latencyMs as number) ?? (val?.latency as number) ?? 0,
      message: val?.lastChecked ? `Last checked: ${new Date(val.lastChecked as string | number | Date).toLocaleTimeString()}` : undefined,
    }));
  }
  return [];
}

export type ApiSearchResult = {
  type: string;
  id: string;
  name: string;
  email?: string;
  tenantName?: string;
  highlight?: string;
};

/* ─── Auth header helper ─── */
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('crmlite_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ────────────────────────────────────────────────────────────────
   TENANTS
──────────────────────────────────────────────────────────────── */
export async function fetchTenants(params?: { page?: number; size?: number; search?: string }) {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set('page', String(params.page));
  if (params?.size !== undefined) q.set('size', String(params.size));
  if (params?.search) q.set('search', params.search);
  return apiFetch<{ content: ApiTenant[]; totalElements: number }>(`/api/v1/platform/tenants?${q}`, { headers: authHeaders() });
}

export async function fetchTenantById(id: string) {
  return apiFetch<ApiTenant>(`/api/v1/platform/tenants/${id}`, { headers: authHeaders() });
}

export async function fetchTenantUsers(id: string) {
  return apiFetch<ApiUser[]>(`/api/v1/platform/tenants/${id}/users`, { headers: authHeaders() });
}

export async function suspendTenant(id: string, reason?: string) {
  return apiFetch(`/api/v1/platform/tenants/${id}/suspend`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
}

export async function activateTenant(id: string) {
  return apiFetch(`/api/v1/platform/tenants/${id}/activate`, {
    method: 'POST',
    headers: authHeaders(),
  });
}

export async function lockTenant(id: string) {
  return apiFetch(`/api/v1/platform/tenants/${id}/lock`, {
    method: 'POST',
    headers: authHeaders(),
  });
}

export async function patchTenantStatus(id: string, status: string) {
  return apiFetch(`/api/v1/platform/tenants/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
}

/* ────────────────────────────────────────────────────────────────
   USERS
──────────────────────────────────────────────────────────────── */
export async function fetchAllUsers(params?: { page?: number; size?: number; search?: string }) {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set('page', String(params.page));
  if (params?.size !== undefined) q.set('size', String(params.size));
  if (params?.search) q.set('search', params.search);
  return apiFetch<{ content: ApiUser[]; totalElements: number } | ApiUser[]>(`/api/v1/platform/users?${q}`, { headers: authHeaders() });
}

export async function fetchUserById(id: string) {
  return apiFetch<ApiUser>(`/api/v1/platform/users/${id}`, { headers: authHeaders() });
}

export async function disableUser(id: string) {
  return apiFetch(`/api/v1/platform/users/${id}/disable`, {
    method: 'POST',
    headers: authHeaders(),
  });
}

export async function enableUser(id: string) {
  return apiFetch(`/api/v1/platform/users/${id}/enable`, {
    method: 'POST',
    headers: authHeaders(),
  });
}

/* ────────────────────────────────────────────────────────────────
   TICKETS
──────────────────────────────────────────────────────────────── */
export async function fetchPlatformTickets(params?: { page?: number; size?: number; status?: string }) {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set('page', String(params.page));
  if (params?.size !== undefined) q.set('size', String(params.size));
  if (params?.status) q.set('status', params.status);
  return apiFetch<{ content: ApiTicket[]; totalElements: number } | ApiTicket[]>(`/api/v1/platform/tickets?${q}`, { headers: authHeaders() });
}

export async function fetchTicketById(id: string) {
  return apiFetch<ApiTicket>(`/api/v1/platform/tickets/${id}`, { headers: authHeaders() });
}

export async function updateTicket(id: string, data: Partial<ApiTicket>) {
  return apiFetch<ApiTicket>(`/api/v1/platform/tickets/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function fetchTicketMessages(id: string) {
  return apiFetch<ApiTicketMessage[]>(`/api/v1/platform/tickets/${id}/messages`, { headers: authHeaders() });
}

export async function sendTicketMessage(id: string, body: string) {
  return apiFetch<ApiTicketMessage>(`/api/v1/platform/tickets/${id}/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ body }),
  });
}

/* ────────────────────────────────────────────────────────────────
   ANALYTICS
──────────────────────────────────────────────────────────────── */
export async function fetchAnalyticsOverview() {
  return apiFetch<ApiAnalyticsOverview>('/api/v1/platform/analytics/overview', { headers: authHeaders() });
}

export async function fetchAnalyticsGrowth() {
  return apiFetch<unknown>('/api/v1/platform/analytics/growth', { headers: authHeaders() });
}

export async function fetchAnalyticsSubscriptions() {
  return apiFetch<unknown>('/api/v1/platform/analytics/subscriptions', { headers: authHeaders() });
}

export async function fetchAnalyticsChurn() {
  return apiFetch<unknown>('/api/v1/platform/analytics/churn', { headers: authHeaders() });
}

export async function fetchAnalyticsNiches() {
  return apiFetch<unknown>('/api/v1/platform/analytics/niches', { headers: authHeaders() });
}

export async function fetchAnalyticsOperational() {
  return apiFetch<unknown>('/api/v1/platform/analytics/operational', { headers: authHeaders() });
}

export async function fetchRecentActivity() {
  return apiFetch<unknown[]>('/api/v1/platform/analytics/recent-activity', { headers: authHeaders() });
}

/* ────────────────────────────────────────────────────────────────
   HEALTH
──────────────────────────────────────────────────────────────── */
export async function fetchPlatformHealth() {
  return apiFetch<ApiHealthResponse>('/api/v1/platform/health', { headers: authHeaders() });
}

/* ────────────────────────────────────────────────────────────────
   AUDIT
──────────────────────────────────────────────────────────────── */
export async function fetchAuditLog(params?: { page?: number; size?: number }) {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.set('page', String(params.page));
  if (params?.size !== undefined) q.set('size', String(params.size));
  return apiFetch<{ content: ApiAuditEntry[]; totalElements: number } | ApiAuditEntry[]>(`/api/v1/platform/audit?${q}`, { headers: authHeaders() });
}

/* ────────────────────────────────────────────────────────────────
   SEARCH
──────────────────────────────────────────────────────────────── */
export async function platformSearch(query: string) {
  const q = new URLSearchParams({ q: query });
  return apiFetch<ApiSearchResult[]>(`/api/v1/platform/search?${q}`, { headers: authHeaders() });
}

/* ────────────────────────────────────────────────────────────────
   SUBSCRIPTIONS
──────────────────────────────────────────────────────────────── */
export async function fetchPlatformSubscriptions() {
  return apiFetch<unknown[]>('/api/v1/platform/subscriptions', { headers: authHeaders() });
}

export async function updateTenantPlan(tenantId: string, plan: string) {
  return apiFetch(`/api/v1/platform/subscriptions/${tenantId}/plan`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ plan }),
  });
}

export async function fetchPlatformPlans() {
  return apiFetch<unknown[]>('/api/v1/platform/plans', { headers: authHeaders() });
}

export async function createPlatformPlan(planData: unknown) {
  return apiFetch('/api/v1/platform/plans', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(planData),
  });
}

export async function updatePlatformPlanDetails(planId: string, planData: unknown) {
  return apiFetch(`/api/v1/platform/plans/${planId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(planData),
  });
}

export async function deletePlatformPlan(planId: string) {
  return apiFetch(`/api/v1/platform/plans/${planId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

/* ────────────────────────────────────────────────────────────────
   SETTINGS
──────────────────────────────────────────────────────────────── */
export async function fetchPlatformSettings() {
  return apiFetch<Record<string, string>>('/api/v1/platform/settings', { headers: authHeaders() });
}

export async function updatePlatformSettings(settings: Record<string, string>) {
  return apiFetch('/api/v1/platform/settings', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(settings),
  });
}

/* ────────────────────────────────────────────────────────────────
   NICHE TEMPLATES
──────────────────────────────────────────────────────────────── */
export type ApiNicheTemplate = {
  id: string;
  name: string;
  niche: string;
  icon: string;
  color: string;
  description?: string;
  stages: string; // JSON array or parsed array
  status?: string;
  tenantsUsing?: number;
};

export async function fetchNicheTemplates() {
  return apiFetch<ApiNicheTemplate[]>('/api/v1/platform/templates', { headers: authHeaders() });
}

export async function createNicheTemplate(data: Partial<ApiNicheTemplate>) {
  return apiFetch<ApiNicheTemplate>('/api/v1/platform/templates', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function updateNicheTemplate(id: string, data: Partial<ApiNicheTemplate>) {
  return apiFetch<ApiNicheTemplate>(`/api/v1/platform/templates/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function deleteNicheTemplate(id: string) {
  return apiFetch(`/api/v1/platform/templates/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

