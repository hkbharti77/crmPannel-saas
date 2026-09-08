import { apiFetch } from './api';

export interface FlowFieldConfig {
  key: string;
  enabled: boolean;
  required: boolean;
  order: number;
  label: string;
  fieldType: string;
  options?: string[];
}

export type FormFlowType = 'lead' | 'appointment' | 'booking';

export async function fetchFlowFields(flowType: FormFlowType) {
  return apiFetch<FlowFieldConfig[]>(`/api/v1/flow-config/fields?flowType=${flowType}`);
}

export async function saveFlowFields(flowType: FormFlowType, fields: FlowFieldConfig[]) {
  return apiFetch(`/api/v1/flow-config/fields?flowType=${flowType}`, {
    method: 'POST',
    body: JSON.stringify(fields),
  });
}

export async function fetchFlowGreeting(flowType: FormFlowType) {
  return apiFetch<{ greetingMessage: string }>(`/api/v1/flow-config/greeting?flowType=${flowType}`);
}

export async function saveFlowGreeting(flowType: FormFlowType, greetingMessage: string) {
  return apiFetch(`/api/v1/flow-config/greeting?flowType=${flowType}`, {
    method: 'POST',
    body: JSON.stringify({ greetingMessage }),
  });
}

export async function fetchFlowIntent(flowType: FormFlowType) {
  return apiFetch<{ intentDescription: string; triggerExamples: string[] }>(`/api/v1/flow-config/intent?flowType=${flowType}`);
}

export async function saveFlowIntent(flowType: FormFlowType, intentDescription: string, triggerExamples: string[]) {
  return apiFetch(`/api/v1/flow-config/intent?flowType=${flowType}`, {
    method: 'POST',
    body: JSON.stringify({ intentDescription, triggerExamples }),
  });
}

export interface VoiceAssistantConfigDTO {
  id?: string;
  tenantId?: string;
  voiceAssistantName: string;
  voiceGreetingText: string;
  voicePersonaPrompt: string;
  isSystemDefault?: boolean;
  version?: number;
}

export async function fetchVoiceConfig() {
  return apiFetch<VoiceAssistantConfigDTO>('/api/v1/tenant/voice-config');
}

export async function saveVoiceConfig(config: Partial<VoiceAssistantConfigDTO>) {
  return apiFetch<VoiceAssistantConfigDTO>('/api/v1/tenant/voice-config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

export async function resetVoiceConfig() {
  return apiFetch<VoiceAssistantConfigDTO>('/api/v1/tenant/voice-config/reset', {
    method: 'POST',
  });
}

