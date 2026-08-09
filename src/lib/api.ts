const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function getAuthToken(): string | null {
  return localStorage.getItem('crmlite_token');
}

export function getTenantId(): string | null {
  return localStorage.getItem('crmlite_tenant_id');
}

export function setAuthSession(data: { token: string; tenantId?: string; user?: unknown }) {
  localStorage.setItem('crmlite_token', data.token);
  if (data.tenantId) {
    localStorage.setItem('crmlite_tenant_id', data.tenantId);
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

export function getStoredUser(): unknown | null {
  const raw = localStorage.getItem('crmlite_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
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
      if (res.status === 401) {
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
