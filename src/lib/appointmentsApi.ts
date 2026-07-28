import { apiFetch } from './api';

export type AppointmentDto = {
  id: string;
  contactName?: string;
  contactWaId?: string;
  contactId?: string;
  appointmentDateTime?: string;
  title: string;
  collectedData?: Record<string, any>;
  meetingLink?: string;
  status: 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  ownerName?: string;
};

export type AppointmentRequestPayload = {
  title: string;
  appointmentDateTime: string;
  contactId?: string;
  source?: string;
  notes?: string;
};

export async function fetchAppointments(): Promise<{ data: AppointmentDto[]; error: string | null }> {
  const res = await apiFetch<AppointmentDto[]>('/api/v1/appointments');
  if (res.error) {
    return { data: [], error: res.error };
  }
  return { data: res.data || [], error: null };
}

export async function fetchTodayAppointments(): Promise<{ data: AppointmentDto[]; error: string | null }> {
  const res = await apiFetch<AppointmentDto[]>('/api/v1/appointments/today');
  if (res.error) {
    return { data: [], error: res.error };
  }
  return { data: res.data || [], error: null };
}

export async function bookAppointment(
  payload: AppointmentRequestPayload
): Promise<{ data: AppointmentDto | null; error: string | null }> {
  const res = await apiFetch<AppointmentDto>('/api/v1/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function completeAppointment(
  id: string
): Promise<{ data: AppointmentDto | null; error: string | null }> {
  const res = await apiFetch<AppointmentDto>(`/api/v1/appointments/${id}/complete`, {
    method: 'PATCH',
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function cancelAppointment(
  id: string
): Promise<{ data: AppointmentDto | null; error: string | null }> {
  const res = await apiFetch<AppointmentDto>(`/api/v1/appointments/${id}/cancel`, {
    method: 'PATCH',
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}
