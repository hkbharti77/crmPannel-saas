import { apiFetch } from '@/lib/api';

export interface CustomerJourney {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  triggerEvent: string;
  status: 'DRAFT' | 'VALIDATED' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';
  reentryMode: 'ALLOW_MULTIPLE' | 'ONE_ACTIVE_PER_CONTACT' | 'ONCE_EVER' | 'AFTER_COMPLETION';
  publishedVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerJourneyVersion {
  id: string;
  journeyId: string;
  businessId: string;
  versionNumber: number;
  definitionJson: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  createdAt: string;
  publishedAt?: string;
}

export interface JourneyNode {
  id: string;
  type: 'TRIGGER' | 'ACTION_WHATSAPP' | 'ACTION_EMAIL' | 'ACTION_SMS' | 'WAIT' | 'CONDITION';
  name: string;
  config: Record<string, any>;
}

export interface JourneyEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export async function fetchJourneys(): Promise<CustomerJourney[]> {
  const res = await apiFetch<any>('/api/v1/journeys');
  const payload = (res.data as any)?.data || res.data;
  return Array.isArray(payload) ? payload : [];
}

export async function createJourney(data: {
  name: string;
  description?: string;
  triggerEvent: string;
  reentryMode?: string;
}): Promise<CustomerJourney> {
  const res = await apiFetch<any>('/api/v1/journeys', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.error) throw new Error(res.error);
  const journey = (res.data as any)?.data || res.data;
  if (!journey || !journey.id) {
    throw new Error('Failed to create journey: missing ID in response');
  }
  return journey;
}

export async function fetchJourneyVersions(journeyId: string): Promise<CustomerJourneyVersion[]> {
  if (!journeyId || journeyId === 'undefined') return [];
  const res = await apiFetch<any>(`/api/v1/journeys/${journeyId}/versions`);
  const payload = (res.data as any)?.data || res.data;
  return Array.isArray(payload) ? payload : [];
}

export async function createJourneyVersion(journeyId: string, definitionJson: string): Promise<CustomerJourneyVersion> {
  if (!journeyId || journeyId === 'undefined') {
    throw new Error('Invalid Journey ID provided for creating version');
  }
  const res = await apiFetch<any>(`/api/v1/journeys/${journeyId}/versions`, {
    method: 'POST',
    body: JSON.stringify({ definitionJson }),
  });
  if (res.error) throw new Error(res.error);
  const version = (res.data as any)?.data || res.data;
  if (!version || !version.id) {
    throw new Error('Failed to create journey version: missing version ID in response');
  }
  return version;
}

export async function publishJourneyVersion(journeyId: string, versionId: string): Promise<CustomerJourney> {
  if (!journeyId || journeyId === 'undefined' || !versionId || versionId === 'undefined') {
    throw new Error('Invalid Journey ID or Version ID provided for publishing');
  }
  const res = await apiFetch<any>(`/api/v1/journeys/${journeyId}/versions/${versionId}/publish`, {
    method: 'POST',
  });
  if (res.error) throw new Error(res.error);
  return (res.data as any)?.data || res.data;
}
