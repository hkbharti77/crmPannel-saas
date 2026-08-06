import { apiFetch } from './api';

export type BookingDto = {
  id: string;
  contactName?: string;
  contactWaId?: string;
  contactId?: string;
  service: string;
  preferredSlot?: string;
  collectedData?: Record<string, any>;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  ownerName?: string;
};

export type BusinessServiceDto = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
};

export type BookingRequestPayload = {
  service: string;
  preferredSlot?: string;
  contactId?: string;
  source?: string;
  notes?: string;
  collectedData?: Record<string, any>;
};

export async function fetchBusinessServices(): Promise<{ data: BusinessServiceDto[]; error: string | null }> {
  const res = await apiFetch<BusinessServiceDto[]>('/api/v1/business-services');
  if (res.error) {
    return { data: [], error: res.error };
  }
  return { data: res.data || [], error: null };
}

export async function fetchBookings(): Promise<{ data: BookingDto[]; error: string | null }> {
  const res = await apiFetch<BookingDto[]>('/api/v1/bookings');
  if (res.error) {
    return { data: [], error: res.error };
  }
  return { data: res.data || [], error: null };
}

export async function createBooking(
  payload: BookingRequestPayload
): Promise<{ data: BookingDto | null; error: string | null }> {
  const res = await apiFetch<BookingDto>('/api/v1/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function fetchBookingsByContactId(
  contactId: string
): Promise<{ data: BookingDto[]; error: string | null }> {
  const res = await apiFetch<BookingDto[]>(`/api/v1/bookings/contact/${contactId}`);
  if (res.error) {
    return { data: [], error: res.error };
  }
  return { data: res.data || [], error: null };
}

export async function completeBooking(
  id: string
): Promise<{ data: BookingDto | null; error: string | null }> {
  const res = await apiFetch<BookingDto>(`/api/v1/bookings/${id}/complete`, {
    method: 'PATCH',
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}

export async function cancelBooking(
  id: string
): Promise<{ data: BookingDto | null; error: string | null }> {
  const res = await apiFetch<BookingDto>(`/api/v1/bookings/${id}/cancel`, {
    method: 'PATCH',
  });
  if (res.error) {
    return { data: null, error: res.error };
  }
  return { data: res.data || null, error: null };
}
