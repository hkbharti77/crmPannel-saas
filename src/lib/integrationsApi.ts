import { apiFetch } from './api';

export async function fetchGoogleIntegrationStatus(): Promise<{ data: { connected: boolean } | null; error: string | null }> {
  return apiFetch<{ connected: boolean }>('/api/v1/integrations/google/status');
}

export async function fetchGoogleAuthUrl(): Promise<{ data: { url: string } | null; error: string | null }> {
  return apiFetch<{ url: string }>('/api/v1/integrations/google/auth-url');
}

export async function disconnectGoogleAccount(): Promise<{ data: { message: string } | null; error: string | null }> {
  return apiFetch<{ message: string }>('/api/v1/integrations/google/disconnect', {
    method: 'DELETE',
  });
}
