import { apiFetch } from './api';

export type GoogleFeature = 'CALENDAR' | 'GMAIL' | 'CONTACTS' | 'TASKS' | 'DRIVE' | 'SHEETS';

export type GoogleStatusMap = Record<GoogleFeature | string, string>;

/**
 * Fetches status map for all Google integrations:
 * { CALENDAR: "CONNECTED", GMAIL: "DISCONNECTED", ... }
 */
export async function fetchGoogleIntegrationStatus() {
  return apiFetch<GoogleStatusMap>('/api/v1/integrations/google/status');
}

/**
 * Fetches authorization URL for a specific Google integration feature.
 * Backend controls the exact scope needed.
 */
export async function fetchGoogleAuthUrl(integration: GoogleFeature = 'CALENDAR') {
  return apiFetch<{ url: string }>(`/api/v1/integrations/google/auth-url?integration=${integration}`);
}

/**
 * Disconnects a specific Google feature and revokes the token if all features are disconnected.
 */
export async function disconnectGoogleIntegration(feature: GoogleFeature = 'CALENDAR') {
  return apiFetch<{ disconnected: boolean; feature: string }>(`/api/v1/integrations/google/${feature}`, {
    method: 'DELETE',
  });
}

/**
 * Backward compatibility alias
 */
export const disconnectGoogleAccount = () => disconnectGoogleIntegration('CALENDAR');

// ── Gmail Integration API (Phase 7) ────────────────────────────────────────

export interface SendGmailPayload {
  to: string;
  subject: string;
  bodyHtml: string;
  cc?: string;
  bcc?: string;
  crmResourceId?: string;
}

export interface SendGmailResponse {
  success: boolean;
  messageId: string;
  threadId: string;
  sentAt: string;
}

export async function sendGmailEmail(payload: SendGmailPayload) {
  return apiFetch<SendGmailResponse>('/api/v1/integrations/google/gmail/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchGmailStatus() {
  return apiFetch<{ connected: boolean; email?: string; feature: string }>('/api/v1/integrations/google/gmail/status');
}

// ── Google Contacts API (Phase 8) ──────────────────────────────────────────

export interface ContactsImportStats {
  totalFetched: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  syncedAt: string;
}

export async function fetchContactsStatus() {
  return apiFetch<{ connected: boolean; feature: string }>('/api/v1/integrations/google/contacts/status');
}

export async function importGoogleContacts(maxResults: number = 100) {
  return apiFetch<ContactsImportStats>(`/api/v1/integrations/google/contacts/import?maxResults=${maxResults}`, {
    method: 'POST',
  });
}

// ── Google Tasks API (Phase 10) ────────────────────────────────────────────

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: string;
  due?: string;
  updated?: string;
}

export interface CreateTaskPayload {
  title: string;
  notes?: string;
  dueDateTime?: string;
  crmResourceId?: string;
}

export async function fetchTasksStatus() {
  return apiFetch<{ connected: boolean; feature: string }>('/api/v1/integrations/google/tasks/status');
}

export async function listGoogleTasks(maxResults: number = 50) {
  return apiFetch<GoogleTaskItem[]>(`/api/v1/integrations/google/tasks/list?maxResults=${maxResults}`);
}

export async function createGoogleTask(payload: CreateTaskPayload) {
  return apiFetch<{ success: boolean; taskId: string; title: string; status: string }>('/api/v1/integrations/google/tasks/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function completeGoogleTask(taskId: string) {
  return apiFetch<{ success: boolean; taskId: string; status: string }>(`/api/v1/integrations/google/tasks/${taskId}/complete`, {
    method: 'POST',
  });
}

// ── Google Drive API (Phase 11) ───────────────────────────────────────────

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: number | string;
  createdTime?: string;
}

export interface UploadDriveResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  webViewLink: string;
  folderId?: string;
}

export async function fetchDriveStatus() {
  return apiFetch<{ connected: boolean; feature: string }>('/api/v1/integrations/google/drive/status');
}

export async function uploadDriveFile(file: File, folderName?: string, crmResourceId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (folderName) formData.append('folderName', folderName);
  if (crmResourceId) formData.append('crmResourceId', crmResourceId);

  return apiFetch<UploadDriveResponse>('/api/v1/integrations/google/drive/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function listDriveFiles(maxResults: number = 30) {
  return apiFetch<GoogleDriveFile[]>(`/api/v1/integrations/google/drive/files?maxResults=${maxResults}`);
}

// ── Google Sheets API (Phase 12) ──────────────────────────────────────────

export interface SheetsExportResponse {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  exportedRows: number;
  title: string;
}

export interface SheetsImportResponse {
  success: boolean;
  spreadsheetId: string;
  totalRowsRead: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
}

export async function fetchSheetsStatus() {
  return apiFetch<{ connected: boolean; feature: string }>('/api/v1/integrations/google/sheets/status');
}

export async function exportLeadsToSheet(title?: string) {
  return apiFetch<SheetsExportResponse>('/api/v1/integrations/google/sheets/export', {
    method: 'POST',
    body: JSON.stringify({ title: title || '' }),
  });
}

export async function importLeadsFromSheet(spreadsheetId: string, range?: string) {
  return apiFetch<SheetsImportResponse>('/api/v1/integrations/google/sheets/import', {
    method: 'POST',
    body: JSON.stringify({ spreadsheetId, range: range || 'Sheet1!A1:Z' }),
  });
}
