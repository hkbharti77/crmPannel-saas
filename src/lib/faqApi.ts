import { apiFetch } from './api';

export interface FaqItemDto {
  id?: string;
  tenantId?: string;
  question: string;
  answer: string;
  category?: string;
  keywords?: string;
  isActive?: boolean;
  hitCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchFaqs() {
  return apiFetch<FaqItemDto[]>('/api/v1/faq');
}

export async function createFaq(data: Partial<FaqItemDto>) {
  return apiFetch<FaqItemDto>('/api/v1/faq', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFaq(id: string, data: Partial<FaqItemDto>) {
  return apiFetch<FaqItemDto>(`/api/v1/faq/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteFaq(id: string) {
  return apiFetch<void>(`/api/v1/faq/${id}`, {
    method: 'DELETE',
  });
}

export async function createBatchFaqs(items: Partial<FaqItemDto>[]) {
  return apiFetch<FaqItemDto[]>('/api/v1/faq/batch', {
    method: 'POST',
    body: JSON.stringify(items),
  });
}
