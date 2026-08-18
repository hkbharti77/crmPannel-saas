import { apiFetch } from './api';

export interface UserProfileDto {
  id: string;
  email: string;
  displayName?: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
  businessSubType?: string;
  address?: string;
  aboutUs?: string;
  logoUrl?: string;
  widgetIconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  emailHeaderText?: string;
  emailFooterText?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  currency?: string;
  timezone?: string;
  forceShowBooking?: boolean;
  forceShowAppointment?: boolean;
  forceShowLeads?: boolean;
  role: 'OWNER' | 'ADMIN' | 'AGENT' | string;
  accountStatus?: string;
  planType?: string;
  tenantId?: string;
  defaultDailyLeadLimit?: number;
  autoAssignmentDelayMinutes?: number;
}

export async function fetchCurrentUserProfile() {
  return apiFetch<UserProfileDto>('/api/v1/users/me');
}

export async function updateCurrentUserProfile(data: Partial<UserProfileDto>) {
  return apiFetch<UserProfileDto>('/api/v1/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadWidgetIcon(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<{ message: string; widgetIconUrl: string }>('/api/v1/users/me/widget-icon', {
    method: 'POST',
    body: formData,
  });
}

export async function uploadCompanyLogo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<{ message: string; logoUrl: string }>('/api/v1/users/me/logo', {
    method: 'POST',
    body: formData,
  });
}

export async function fetchBusinessCategories() {
  return apiFetch<Record<string, string[]>>('/api/v1/business-categories');
}

export interface TimezoneOption {
  id: string;
  name: string;
  offset: string;
}

export interface CountryOption {
  code: string;
  name: string;
  currency: string;
  defaultTimezone: string;
}

export async function fetchTimezones() {
  return apiFetch<TimezoneOption[]>('/api/v1/timezones');
}

export async function fetchCountries() {
  return apiFetch<CountryOption[]>('/api/v1/countries');
}

// ─── Security Settings ─────────────────────────────────────────────────────

export interface SecurityDashboardDto {
  healthScore: number;
  biometricsEnabled: boolean;
  loginAlertsEnabled: boolean;
  ipWhitelist: string[];
  accountStatus: string;
}

export interface SecuritySettingsRequest {
  biometricsEnabled?: boolean;
  loginAlertsEnabled?: boolean;
  ipWhitelist?: string[];
}

export async function fetchSecurityDashboard() {
  return apiFetch<SecurityDashboardDto>('/api/v1/users/me/security-dashboard');
}

export async function updateSecuritySettings(data: SecuritySettingsRequest) {
  return apiFetch<string>('/api/v1/users/me/security-settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateCurrentUserPassword(data: { currentPassword?: string; newPassword: string }) {
  return apiFetch<{ message: string }>('/api/v1/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

