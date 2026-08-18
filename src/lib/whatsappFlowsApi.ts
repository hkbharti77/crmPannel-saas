import { apiFetch } from './api';

export type FlowCategoryType = 'APPOINTMENT_BOOKING' | 'LEAD_GENERATION' | 'CUSTOMER_SUPPORT' | 'SURVEY' | 'OTHER';
export type FlowStatusType = 'DRAFT' | 'PUBLISHING' | 'PUBLISHED' | 'PUBLISH_FAILED' | 'ARCHIVED' | 'DEPRECATED';
export type RevisionStatusType = 'DRAFT' | 'READY' | 'PUBLISHING' | 'PUBLISHED' | 'ARCHIVED';

export interface FlowFieldItem {
  id?: string;
  name: string;
  label: string;
  type: 'TEXT' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DATE' | 'SELECT' | 'RADIO' | 'CHECKBOX' | 'TEXTAREA';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface FlowRevisionItem {
  id: string;
  versionNumber: number;
  fieldsConfigJson: string;
  flowJson?: string;
  confirmationMessage?: string;
  status: RevisionStatusType;
  publishedAt?: string;
  createdAt?: string;
}

export interface WhatsAppFlowItem {
  id: string;
  name: string;
  category: FlowCategoryType;
  status: FlowStatusType;
  metaFlowId?: string;
  publishedRevision?: FlowRevisionItem;
  lastSyncError?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlowTemplateItem {
  id: string;
  name: string;
  category: FlowCategoryType;
  description: string;
  fields: FlowFieldItem[];
  confirmationMessage: string;
}

export async function fetchWhatsAppFlows() {
  return apiFetch<WhatsAppFlowItem[]>('/api/v1/whatsapp-flows');
}

export async function fetchWhatsAppFlow(id: string) {
  return apiFetch<{ flow: WhatsAppFlowItem; revisions: FlowRevisionItem[] }>(`/api/v1/whatsapp-flows/${id}`);
}

export async function fetchFlowTemplates() {
  return apiFetch<FlowTemplateItem[]>('/api/v1/whatsapp-flows/templates');
}

export async function saveFlowDraft(data: {
  name: string;
  category: FlowCategoryType;
  fieldsConfig: FlowFieldItem[];
  confirmationMessage?: string;
}) {
  return apiFetch<WhatsAppFlowItem>('/api/v1/whatsapp-flows/draft', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFlowDraft(id: string, data: {
  name: string;
  category?: FlowCategoryType;
  fieldsConfig: FlowFieldItem[];
  confirmationMessage?: string;
}) {
  return apiFetch<WhatsAppFlowItem>(`/api/v1/whatsapp-flows/${id}/draft`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function publishWhatsAppFlow(id: string) {
  return apiFetch<{ success: boolean; jobId: string; status: string; message: string }>(`/api/v1/whatsapp-flows/${id}/publish`, {
    method: 'POST',
  });
}

export async function duplicateWhatsAppFlow(id: string) {
  return apiFetch<WhatsAppFlowItem>(`/api/v1/whatsapp-flows/${id}/duplicate`, {
    method: 'POST',
  });
}

export async function archiveWhatsAppFlow(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/v1/whatsapp-flows/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchFlowAuditLogs(id: string) {
  return apiFetch<any[]>(`/api/v1/whatsapp-flows/${id}/audit-logs`);
}

export async function fetchFlowSubmissions(id: string) {
  return apiFetch<any[]>(`/api/v1/whatsapp-flows/${id}/submissions`);
}

export async function syncMetaFlows() {
  return apiFetch<{ success: boolean; imported: number; updated: number; total: number; message: string }>('/api/v1/whatsapp-flows/sync-meta', {
    method: 'POST',
  });
}

export interface FlowRouteConfig {
  enabled: boolean;
  mode: 'CHATBOT' | 'NATIVE_FLOW';
  flowId?: string;
  metaFlowId?: string;
  ctaText?: string;
  promptText?: string;
  headerText?: string;
}

export interface FlowsRoutingConfig {
  appointments: FlowRouteConfig;
  bookings: FlowRouteConfig;
  leadGen: FlowRouteConfig;
  feedback: FlowRouteConfig;
}

export async function fetchFlowsRoutingConfig(): Promise<FlowsRoutingConfig> {
  const res = await apiFetch<any>('/api/v1/whatsapp-config');
  const config = res?.data;
  const defaultConfig: FlowsRoutingConfig = {
    appointments: { enabled: true, mode: 'CHATBOT', ctaText: 'Book Doctor', promptText: 'Tap below to schedule a doctor consultation:' },
    bookings: { enabled: true, mode: 'CHATBOT', ctaText: 'Book Salon Slot', promptText: 'Tap below to reserve your salon & spa slot:' },
    leadGen: { enabled: true, mode: 'CHATBOT', ctaText: 'Get Quote', promptText: 'Please submit your requirements:' },
    feedback: { enabled: true, mode: 'CHATBOT', ctaText: 'Rate Service', promptText: 'Please share your valuable feedback:' },
  };

  if (config?.flowsRoutingConfigJson) {
    try {
      const parsed = JSON.parse(config.flowsRoutingConfigJson);
      return { ...defaultConfig, ...parsed };
    } catch (e) {
      console.warn('Failed to parse flowsRoutingConfigJson', e);
    }
  }
  return defaultConfig;
}

export async function saveFlowsRoutingConfig(routing: FlowsRoutingConfig) {
  return apiFetch<any>('/api/v1/whatsapp-config', {
    method: 'POST',
    body: JSON.stringify({
      flowsRoutingConfigJson: JSON.stringify(routing),
    }),
  });
}

export interface WebFlowRouteConfig {
  enabled: boolean;
  mode: 'CHATBOT' | 'WEB_FLOW';
  ctaText?: string;
  promptText?: string;
}

export interface WebFlowsRoutingConfig {
  appointments: WebFlowRouteConfig;
  bookings: WebFlowRouteConfig;
  leadGen: WebFlowRouteConfig;
  feedback: WebFlowRouteConfig;
  support: WebFlowRouteConfig;
}

export async function fetchWebFlowsRoutingConfig(): Promise<WebFlowsRoutingConfig> {
  const res = await apiFetch<any>('/api/v1/users/me');
  const user = res?.data;
  const defaultConfig: WebFlowsRoutingConfig = {
    appointments: { enabled: true, mode: 'WEB_FLOW', ctaText: '📅 Book Appointment', promptText: 'Schedule your appointment in seconds:' },
    bookings: { enabled: true, mode: 'WEB_FLOW', ctaText: '🔖 Reserve Slot', promptText: 'Reserve your booking slot:' },
    leadGen: { enabled: true, mode: 'WEB_FLOW', ctaText: '🎯 Get a Quote', promptText: 'Submit your requirements:' },
    feedback: { enabled: true, mode: 'WEB_FLOW', ctaText: '⭐ Rate Service', promptText: 'Share your feedback:' },
    support: { enabled: true, mode: 'WEB_FLOW', ctaText: '🎫 Support Ticket', promptText: 'Contact customer support:' },
  };

  if (user?.webFlowsRoutingConfigJson) {
    try {
      const parsed = JSON.parse(user.webFlowsRoutingConfigJson);
      return { ...defaultConfig, ...parsed };
    } catch (e) {
      console.warn('Failed to parse webFlowsRoutingConfigJson', e);
    }
  }
  return defaultConfig;
}

export async function saveWebFlowsRoutingConfig(routing: WebFlowsRoutingConfig) {
  return apiFetch<any>('/api/v1/users/me', {
    method: 'PUT',
    body: JSON.stringify({
      webFlowsRoutingConfigJson: JSON.stringify(routing),
    }),
  });
}

export interface MasterFieldItem {
  key: string;
  label: string;
  fieldType: string;
  required: boolean;
  order: number;
  options?: string[];
  enabled: boolean;
}

export async function fetchMasterFields(category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch<MasterFieldItem[]>(`/api/v1/whatsapp-flows/master-fields${query}`);
}

