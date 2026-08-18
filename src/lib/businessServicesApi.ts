import { getAuthToken, getTenantId, apiFetch } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface BusinessServiceItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchBusinessServices() {
  return apiFetch<BusinessServiceItem[]>('/api/v1/business-services');
}

export async function createBusinessService(name: string, description?: string, imageFile?: File) {
  const token = getAuthToken();
  const tenantId = getTenantId();

  const formData = new FormData();
  formData.append('name', name);
  if (description) formData.append('description', description);
  if (imageFile) formData.append('file', imageFile);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/business-services`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: text || `Failed with status ${res.status}` };
    }
    const data = await res.json();
    return { data };
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Network error' };
  }
}

export async function updateBusinessService(id: string, name: string, description?: string, imageFile?: File) {
  const token = getAuthToken();
  const tenantId = getTenantId();

  const formData = new FormData();
  formData.append('name', name);
  if (description) formData.append('description', description);
  if (imageFile) formData.append('file', imageFile);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/business-services/${id}`, {
      method: 'PUT',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: text || `Failed with status ${res.status}` };
    }
    const data = await res.json();
    return { data };
  } catch (err: unknown) {
    return { error: (err as Error).message || 'Network error' };
  }
}

export async function deleteBusinessService(id: string) {
  return apiFetch(`/api/v1/business-services/${id}`, { method: 'DELETE' });
}
