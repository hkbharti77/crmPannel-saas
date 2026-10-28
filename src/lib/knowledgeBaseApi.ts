import { apiFetch } from './api';

export interface TenantRagQuotaDto {
  dailyPageLimit: number;
  dailyPagesConsumed: number;
  monthlyChunkLimit: number;
  monthlyChunksConsumed: number;
  timezone: string;
  planId?: string;
  hasRagLlm?: boolean;
  activeDocumentsCount?: number;
  maxDocumentsLimit?: number;
  maxFileSizeMb?: number;
}

export interface CrawlSubmissionDto {
  jobId: string;
  status: string;
  sourceUrl: string;
  crawlType: string;
  message: string;
}

export interface CrawlJobDto {
  id: string;
  sourceUrl: string;
  crawlType: string;
  status: 'QUEUED' | 'CRAWLING' | 'RETRYING' | 'PARTIAL_SUCCESS' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  pagesDiscovered: number;
  pagesCrawled: number;
  pagesFailed: number;
  totalChunks: number;
  documentId?: string;
  documentName?: string;
  partialFailuresJson?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DocumentChunkDto {
  id: string;
  chunkIndex: number;
  content: string;
  version: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  updatedAt?: string;
}

export interface PaginatedChunksDto {
  chunks: DocumentChunkDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  documentId: string;
}

export interface ReindexResultDto {
  documentId: string;
  status: string;
  previousVersion: number;
  activeVersion: number;
  totalChunks: number;
}

export async function fetchTenantQuotas() {
  return apiFetch<TenantRagQuotaDto>('/api/v1/rag/quotas');
}

export async function submitCrawlJob(url: string, crawlType: string = 'SINGLE_PAGE', idempotencyKey?: string) {
  return apiFetch<CrawlSubmissionDto>('/api/v1/rag/crawl', {
    method: 'POST',
    body: JSON.stringify({ url, crawlType, idempotencyKey }),
  });
}

export async function fetchCrawlJob(jobId: string) {
  return apiFetch<CrawlJobDto>(`/api/v1/rag/crawl/${jobId}`);
}

export async function cancelCrawlJob(jobId: string) {
  return apiFetch<{ jobId: string; cancelled: boolean; message: string }>(`/api/v1/rag/crawl/${jobId}/cancel`, {
    method: 'POST',
  });
}

export async function fetchDocumentChunks(docId: string, page: number = 0, size: number = 10) {
  return apiFetch<PaginatedChunksDto>(`/api/v1/rag/documents/${docId}/chunks?page=${page}&size=${size}`);
}

export async function updateChunkContent(chunkId: string, content: string) {
  return apiFetch<{ message: string; id: string; chunkIndex: number; version: number }>(`/api/v1/rag/chunks/${chunkId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export async function deleteChunk(chunkId: string) {
  return apiFetch<{ message: string; id: string }>(`/api/v1/rag/chunks/${chunkId}`, {
    method: 'DELETE',
  });
}

export async function reindexDocument(docId: string) {
  return apiFetch<ReindexResultDto>(`/api/v1/rag/documents/${docId}/reindex`, {
    method: 'POST',
  });
}
