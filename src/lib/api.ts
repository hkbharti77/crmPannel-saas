const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function getAuthToken(): string | null {
  return localStorage.getItem('crmlite_token');
}

export function getTenantId(): string | null {
  return localStorage.getItem('crmlite_tenant_id');
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const tenantId = getTenantId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }
  return headers;
}

export function setAuthSession(data: { token: string; tenantId?: string | null; user?: unknown }) {
  localStorage.setItem('crmlite_token', data.token);
  if (data.tenantId) {
    localStorage.setItem('crmlite_tenant_id', data.tenantId);
  } else {
    localStorage.removeItem('crmlite_tenant_id');
  }
  if (data.user) {
    localStorage.setItem('crmlite_user', JSON.stringify(data.user));
  }
}

export function clearAuthSession() {
  localStorage.removeItem('crmlite_token');
  localStorage.removeItem('crmlite_tenant_id');
  localStorage.removeItem('crmlite_user');
}

export function getStoredUser<T = unknown>(): T | null {
  const raw = localStorage.getItem('crmlite_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status?: number }> {
  const token = getAuthToken();
  const tenantId = getTenantId();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const status = res.status;
    const contentType = res.headers.get('content-type');
    let body: unknown = null;

    if (contentType && contentType.includes('application/json')) {
      body = await res.json();
    } else {
      const text = await res.text();
      body = text ? { message: text } : {};
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        // Dispatch global event for auth context to pick up
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
      const errorMessage = (body as { error?: string; message?: string })?.error || (body as { error?: string; message?: string })?.message || `Request failed with status ${res.status}`;
      return { error: errorMessage, status };
    }

    return { data: body as T, status };
  } catch (err: unknown) {
    return { error: (err as Error)?.message || 'Network error. Please check backend connection.' };
  }
}

export interface OnboardingData {
  displayName: string;
  phone: string;
  businessName?: string;
  businessType?: string;
  businessSubType?: string;
  phoneNumberId?: string;
  accessToken?: string;
  verifyToken?: string;
  wabaId?: string;
  consentAccepted: boolean;
  address?: string;
  logoUrl?: string;
}

export const onboardingApi = {
  submit: (data: OnboardingData) =>
    apiFetch<string>('/api/v1/onboarding/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  skip: () =>
    apiFetch<string>('/api/v1/onboarding/skip', {
      method: 'POST',
    }),
};

export const categoryApi = {
  getAll: () => apiFetch<Record<string, string[]>>('/api/v1/categories'),
};

export const metaGatewayApi = {
  getSession: () =>
    apiFetch<{
      appId: string;
      configId: string;
      state: string;
      verifyToken: string;
      coexistenceEnabled: boolean;
      sessionInfoVersion: string;
    }>('/api/v1/integrations/meta/gateway/session'),

  getLaunchUrl: (token?: string, theme?: string) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const authToken = token || getAuthToken() || '';
    const activeTheme = theme || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    return `${baseUrl}/api/v1/integrations/meta/gateway/launch?token=${encodeURIComponent(authToken)}&theme=${encodeURIComponent(activeTheme)}`;
  },

  exchangeCode: (code: string) =>
    apiFetch<{
      success: boolean;
      phoneNumberId?: string;
      displayPhoneNumber?: string;
      verifiedName?: string;
      wabaId?: string;
      connectionType?: string;
    }>('/api/v1/integrations/meta/gateway/exchange', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  getStatus: () =>
    apiFetch<{
      connected: boolean;
      phoneNumberId?: string;
      displayPhoneNumber?: string;
      verifiedName?: string;
      qualityRating?: string;
      wabaId?: string;
      connectionType?: string;
    }>('/api/v1/integrations/meta/gateway/status'),
};


