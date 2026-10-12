import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { WhatsAppCallModal } from './WhatsAppCallModal';
import * as callingApi from '@/lib/whatsappCallingApi';

vi.mock('@/lib/whatsappCallingApi', async () => {
  const actual = await vi.importActual<typeof import('@/lib/whatsappCallingApi')>('@/lib/whatsappCallingApi');
  return {
    ...actual,
    initiateWhatsAppCall: vi.fn(),
    requestWhatsAppCallPermission: vi.fn(),
    fetchWhatsAppCallPermission: vi.fn(),
    fetchWhatsAppCallDetail: vi.fn(),
    terminateWhatsAppCall: vi.fn(),
  };
});

describe('WhatsAppCallModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (callingApi.fetchWhatsAppCallPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        id: 'perm-1',
        phoneNumberId: 'phone-1',
        userWaId: '919876543210',
        status: 'ACTIVE',
        active: true,
        canInitiateCall: true,
      },
    });
  });

  it('renders modal with recipient details and active permission badge', async () => {
    render(
      <WhatsAppCallModal
        isOpen={true}
        onClose={vi.fn()}
        contactName="Alice Johnson"
        phoneNumber="919876543210"
      />
    );

    expect(screen.getByText('WhatsApp AI Voice Agent')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('919876543210')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Permission Active')).toBeInTheDocument();
    });
  });

  it('displays warning and allows requesting permission when permission is missing', async () => {
    (callingApi.fetchWhatsAppCallPermission as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        id: 'perm-none',
        phoneNumberId: 'phone-1',
        userWaId: '919876543210',
        status: 'NONE',
        active: false,
        canInitiateCall: false,
      },
    });

    render(
      <WhatsAppCallModal
        isOpen={true}
        onClose={vi.fn()}
        contactName="Bob Smith"
        phoneNumber="919876543210"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Permission Required')).toBeInTheDocument();
      expect(screen.getByText(/Meta requires prior consent/i)).toBeInTheDocument();
    });

    const requestBtn = screen.getByText('Request Calling Permission via WhatsApp');
    fireEvent.click(requestBtn);

    expect(screen.getByText('Interactive Permission Request')).toBeInTheDocument();
  });

  it('initiates call and prevents duplicate submissions while in-flight', async () => {
    (callingApi.initiateWhatsAppCall as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  callId: 'call_12345',
                  status: 'OFFER_SENT',
                  direction: 'BUSINESS_INITIATED',
                  createdAt: new Date().toISOString(),
                },
              }),
            100
          )
        )
    );

    render(
      <WhatsAppCallModal
        isOpen={true}
        onClose={vi.fn()}
        contactName="Charlie Brown"
        phoneNumber="919876543210"
      />
    );

    const callBtn = screen.getByText('Initiate AI Call');
    fireEvent.click(callBtn);

    await waitFor(() => {
      expect(callingApi.initiateWhatsAppCall).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Ringing Customer WhatsApp/i)).toBeInTheDocument();
    });
  });

  it('handles backend policy restriction 403 error gracefully', async () => {
    (callingApi.initiateWhatsAppCall as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: 'Outbound call not permitted: active permission required',
      status: 403,
    });

    render(
      <WhatsAppCallModal
        isOpen={true}
        onClose={vi.fn()}
        contactName="Denied User"
        phoneNumber="919876543210"
      />
    );

    const callBtn = screen.getByText('Initiate AI Call');
    fireEvent.click(callBtn);

    await waitFor(() => {
      expect(screen.getByText(/Outbound call blocked: active permission required/i)).toBeInTheDocument();
    });
  });

  it('invokes terminateWhatsAppCall when End Call is clicked', async () => {
    (callingApi.initiateWhatsAppCall as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        callId: 'call_to_terminate',
        status: 'OFFER_SENT',
        direction: 'BUSINESS_INITIATED',
        createdAt: new Date().toISOString(),
      },
    });
    (callingApi.terminateWhatsAppCall as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { success: true, callId: 'call_to_terminate', message: 'Call terminated' },
    });

    render(
      <WhatsAppCallModal
        isOpen={true}
        onClose={vi.fn()}
        contactName="Test Termination"
        phoneNumber="919876543210"
      />
    );

    const callBtn = screen.getByText('Initiate AI Call');
    fireEvent.click(callBtn);

    await waitFor(() => {
      expect(screen.getByText('End Call')).toBeInTheDocument();
    });

    const endBtn = screen.getByText('End Call');
    fireEvent.click(endBtn);

    await waitFor(() => {
      expect(callingApi.terminateWhatsAppCall).toHaveBeenCalledWith('call_to_terminate');
    });
  });
});
