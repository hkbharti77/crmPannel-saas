import { apiFetch } from './api';

export type AppointmentDto = {
  id: string;
  contactName?: string;
  contactWaId?: string;
  contactId?: string;
  appointmentDateTime?: string;
  title: string;
  collectedData?: Record<string, unknown>;
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

export type CreateAppointmentPayload = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceCategory?: string;
  appointmentDate?: string;
  timeSlot?: string;
  notes?: string;
};

export async function createAppointment(
  payload: CreateAppointmentPayload
): Promise<{ data: AppointmentDto | null; error: string | null }> {
  const title = `${payload.serviceCategory || 'Site Visit'} - ${payload.customerName || 'Lead'}`;
  const dateStr = payload.appointmentDate || new Date().toISOString().split('T')[0];
  const appointmentDateTime = `${dateStr}T10:00:00`;

  return bookAppointment({
    title,
    appointmentDateTime,
    notes: payload.notes,
    source: payload.serviceCategory || 'CRM Panel',
  });
}

export async function fetchAppointmentsByContactId(
  contactId: string
): Promise<{ data: AppointmentDto[]; error: string | null }> {
  const res = await apiFetch<AppointmentDto[]>(`/api/v1/appointments/contact/${contactId}`);
  if (res.error) {
    return { data: [], error: res.error };
  }
  return { data: res.data || [], error: null };
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

export async function generateMeetLink(
  id: string,
  durationMinutes = 60
): Promise<{ meetLink?: string; error: string | null }> {
  const res = await apiFetch<{ meetLink?: string }>(
    `/api/v1/appointments/${id}/generate-meet-link?durationMinutes=${durationMinutes}`,
    { method: 'POST' }
  );
  if (res.error) {
    return { error: res.error };
  }
  return { meetLink: res.data?.meetLink, error: null };
}
