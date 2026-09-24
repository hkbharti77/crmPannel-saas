import { apiFetch, getAuthToken, getTenantId } from '@/lib/api';

export interface BulkUploadBatch {
  id: string;
  businessId: string;
  fileName: string;
  fileType: 'CSV' | 'EXCEL' | 'TXT';
  fileChecksum: string;
  fileSize: number;
  uploadedBy: string;
  columnMapping: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED' | 'CANCELLED';
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedContacts: number;
  updatedContacts: number;
  duplicateRows: number;
  failedRows: number;
  autoTriggerJourneyId?: string;
  createdAt: string;
  completedAt?: string;
}

export async function uploadContactsFile(
  file: File,
  columnMapping: Record<string, string>,
  autoTriggerJourneyId?: string
): Promise<BulkUploadBatch> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('columnMapping', JSON.stringify(columnMapping));
  if (autoTriggerJourneyId) {
    formData.append('autoTriggerJourneyId', autoTriggerJourneyId);
  }

  const token = getAuthToken();
  const tenantId = getTenantId();

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;

  const res = await fetch('/api/v1/bulk-upload/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || json.message || 'Failed to upload bulk contacts file');
  }
  return json.data || json;
}

export async function fetchBulkUploadBatches(): Promise<BulkUploadBatch[]> {
  const res = await apiFetch<any>('/api/v1/bulk-upload/batches');
  const payload = (res.data as any)?.data || res.data;
  return Array.isArray(payload) ? payload : [];
}

export async function downloadFailedRowsCsv(batchId: string): Promise<void> {
  const token = getAuthToken();
  const tenantId = getTenantId();

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;

  const res = await fetch(`/api/v1/bulk-upload/batches/${batchId}/errors/csv`, { headers });
  if (!res.ok) throw new Error('Failed to download error CSV');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `failed_rows_${batchId}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
