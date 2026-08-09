import { apiFetch } from './api';

export interface ContactDTO {
  id: string;
  waId: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags: string[];
  source: string | null;
  botPaused: boolean;
}

export interface CreateContactRequest {
  name?: string;
  email?: string;
  waId: string;
  tags?: string[];
}

export async function createContact(data: CreateContactRequest) {
  try {
    const res = await apiFetch<ContactDTO>('/api/v1/contacts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return { data: res.data, error: res.error };
  } catch (error: unknown) {
    console.error('Error creating contact:', error);
    return { data: null, error: (error as Error).message };
  }
}

export async function fetchContacts() {
  try {
    const res = await apiFetch<ContactDTO[]>('/api/v1/contacts');
    return { data: res.data, error: res.error };
  } catch (error: unknown) {
    console.error('Error fetching contacts:', error);
    return { data: null, error: (error as Error).message };
  }
}

export async function fetchContactById(id: string) {
  try {
    const res = await apiFetch<ContactDTO>(`/api/v1/contacts/${id}`);
    return { data: res.data, error: res.error };
  } catch (error: unknown) {
    console.error('Error fetching contact:', error);
    return { data: null, error: (error as Error).message };
  }
}

export async function updateContactTags(id: string, tags: string[]) {
  try {
    const res = await apiFetch(`/api/v1/contacts/${id}/tags`, {
      method: 'PATCH',
      body: JSON.stringify(tags)
    });
    return { data: res.data, error: res.error };
  } catch (error: unknown) {
    console.error('Error updating contact tags:', error);
    return { data: null, error: (error as Error).message };
  }
}

export async function toggleContactBot(id: string, botPaused: boolean) {
  try {
    const res = await apiFetch(`/api/v1/contacts/${id}/toggle-bot`, {
      method: 'PATCH',
      body: JSON.stringify({ botPaused })
    });
    return { data: res.data, error: res.error };
  } catch (error: unknown) {
    console.error('Error toggling contact bot:', error);
    return { data: null, error: (error as Error).message };
  }
}

export async function deleteContact(id: string) {
  try {
    const res = await apiFetch(`/api/v1/contacts/${id}`, {
      method: 'DELETE'
    });
    return { data: res.data, error: res.error };
  } catch (error: unknown) {
    console.error('Error deleting contact:', error);
    return { data: null, error: (error as Error).message };
  }
}

export interface ImportErrorDTO {
  file: string;
  row: number;
  field: string;
  code: string;
  message: string;
}

export interface ImportResultDTO {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ImportErrorDTO[];
}

export interface ContactImportRowDTO {
  file: string;
  row: number;
  name?: string;
  email?: string;
  waId: string;
  tags?: string[];
}

export async function importContactsBatch(contacts: ContactImportRowDTO[]) {
  try {
    const res = await apiFetch<ImportResultDTO>('/api/v1/contacts/import', {
      method: 'POST',
      body: JSON.stringify({ contacts })
    });
    return { data: res.data, error: res.error };
  } catch (error: unknown) {
    console.error('Error importing contacts:', error);
    return { data: null, error: (error as Error).message };
  }
}

export function getExportUrl(search?: string, source?: string, botStatus?: string) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (source && source !== 'ALL') params.append('source', source);
  if (botStatus && botStatus !== 'ALL') params.append('botStatus', botStatus);
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  
  // Since this is a direct download link, we can't easily pass the Authorization header via a normal <a> tag.
  // Instead, we can fetch it via apiFetch and trigger download from Blob.
  return `${baseUrl}/api/v1/contacts/export?${params.toString()}`;
}

export async function exportContacts(search?: string, source?: string, botStatus?: string) {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (source && source !== 'ALL') params.append('source', source);
    if (botStatus && botStatus !== 'ALL') params.append('botStatus', botStatus);
    
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const url = `${baseUrl}/api/v1/contacts/export?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'contacts.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    
    return { error: null };
  } catch (error: unknown) {
    console.error('Error exporting contacts:', error);
    return { error: (error as Error).message };
  }
}
