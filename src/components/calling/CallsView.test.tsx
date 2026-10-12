import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { CallsView } from './CallsView';
import * as callingApi from '@/lib/whatsappCallingApi';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/whatsappCallingApi', async () => {
  const actual = await vi.importActual<typeof import('@/lib/whatsappCallingApi')>('@/lib/whatsappCallingApi');
  return {
    ...actual,
    fetchWhatsAppCalls: vi.fn(),
    fetchWhatsAppCallDetail: vi.fn(),
    fetchWhatsAppCallTurns: vi.fn(),
    fetchWhatsAppCallingAnalytics: vi.fn(),
  };
});

describe('CallsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (callingApi.fetchWhatsAppCalls as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        content: [
          {
            id: 'call-uuid-1',
            callId: 'wa_call_test_001',
            direction: 'BUSINESS_INITIATED',
            fromWaId: '15551234567',
            toWaId: '919876543210',
            state: 'TERMINATED',
            durationSeconds: 125,
            terminationReason: 'COMPLETED_SUCCESSFULLY',
            createdAt: '2026-10-10T10:00:00Z',
          },
          {
            id: 'call-uuid-2',
            callId: 'wa_call_test_002',
            direction: 'USER_INITIATED',
            fromWaId: '919123456789',
            toWaId: '15551234567',
            state: 'ACTIVE',
            durationSeconds: 45,
            createdAt: '2026-10-10T10:15:00Z',
          },
        ],
        totalElements: 2,
        totalPages: 1,
        size: 20,
        number: 0,
      },
    });

    (callingApi.fetchWhatsAppCallingAnalytics as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        totalCalls: 2,
        inboundCalls: 1,
        outboundCalls: 1,
        answeredCalls: 2,
        rejectedCalls: 0,
        failedCalls: 0,
        completedCalls: 1,
        averageDurationSeconds: 85,
        totalDurationSeconds: 170,
        answerRate: 100,
        failureCount: 0,
        terminationReasons: { COMPLETED_SUCCESSFULLY: 1 },
        statusBreakdown: { TERMINATED: 1, ACTIVE: 1 },
      },
    });
  });

  it('renders call table with call records and status badges', async () => {
    render(
      <MemoryRouter>
        <CallsView />
      </MemoryRouter>
    );

    expect(screen.getByText('WhatsApp Voice Agent')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('919876543210')).toBeInTheDocument();
      expect(screen.getByText('919123456789')).toBeInTheDocument();
      expect(screen.getByText('02:05')).toBeInTheDocument();
      expect(screen.getByText('00:45')).toBeInTheDocument();
    });
  });

  it('renders empty state when no calls are returned', async () => {
    (callingApi.fetchWhatsAppCalls as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
      },
    });

    render(
      <MemoryRouter>
        <CallsView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Call Records Found')).toBeInTheDocument();
    });
  });

  it('handles API error state gracefully', async () => {
    (callingApi.fetchWhatsAppCalls as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: 'Tenant authorization error',
      status: 403,
    });

    render(
      <MemoryRouter>
        <CallsView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Calls')).toBeInTheDocument();
      expect(screen.getByText('Tenant authorization error')).toBeInTheDocument();
    });
  });

  it('switches to analytics tab and displays analytics panel', async () => {
    render(
      <MemoryRouter>
        <CallsView />
      </MemoryRouter>
    );

    const analyticsTab = screen.getByRole('button', { name: /Analytics/i });
    fireEvent.click(analyticsTab);

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Voice Agent Analytics')).toBeInTheDocument();
      expect(screen.getByText('Answer Rate')).toBeInTheDocument();
    });
  });
});
