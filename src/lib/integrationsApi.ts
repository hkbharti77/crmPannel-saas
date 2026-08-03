import { apiFetch } from './api';

export async function fetchGoogleIntegrationStatus() {
  return apiFetch<{ connected: boolean }>('/api/v1/integrations/google/status');
}

export async function fetchGoogleAuthUrl() {
  return apiFetch<{ url: string }>('/api/v1/integrations/google/auth-url');
}

export async function disconnectGoogleAccount() {
  return apiFetch<{ message: string }>('/api/v1/integrations/google/disconnect', {
    method: 'DELETE',
  });
}
