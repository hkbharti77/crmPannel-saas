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
