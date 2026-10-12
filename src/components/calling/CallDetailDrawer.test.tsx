import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { CallDetailDrawer } from './CallDetailDrawer';
import * as callingApi from '@/lib/whatsappCallingApi';

vi.mock('@/lib/whatsappCallingApi', async () => {
  const actual = await vi.importActual<typeof import('@/lib/whatsappCallingApi')>('@/lib/whatsappCallingApi');
  return {
    ...actual,
    fetchWhatsAppCallDetail: vi.fn(),
    fetchWhatsAppCallTurns: vi.fn(),
    fetchWhatsAppCallRecording: vi.fn(),
  };
});

describe('CallDetailDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (callingApi.fetchWhatsAppCallDetail as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        id: 'call-1',
        callId: 'wa_call_test_001',
        direction: 'BUSINESS_INITIATED',
        fromWaId: '15551234567',
        toWaId: '919876543210',
        state: 'TERMINATED',
        durationSeconds: 125,
        codec: 'OPUS',
        signalingMode: 'GRAPH',
        startedAt: '2026-10-10T10:00:00Z',
        createdAt: '2026-10-10T10:00:00Z',
        recordingStatus: 'AVAILABLE',
        recordingFormat: 'MP3',
        recordingDurationSeconds: 125,
      },
    });

    (callingApi.fetchWhatsAppCallTurns as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        content: [
          {
            turnId: 'turn-1',
            turnNumber: 1,
            speaker: 'ASSISTANT',
            transcript: 'Hello! Thanks for connecting with GyanVaniAi. How can I help you today?',
            ttfaMs: 420,
            llmLatencyMs: 310,
            detectedLanguage: 'en',
            wasInterrupted: false,
          },
          {
            turnId: 'turn-2',
            turnNumber: 2,
            speaker: 'USER',
            transcript: 'I would like to inquire about pricing for enterprise CRM.',
            wasInterrupted: false,
          },
        ],
        totalElements: 2,
        totalPages: 1,
      },
    });

    (callingApi.fetchWhatsAppCallRecording as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        callId: 'wa_call_test_001',
        available: true,
        status: 'AVAILABLE',
        publicId: 'tenants/t-1/voice_recordings/call-1.mp3',
        format: 'MP3',
        durationSeconds: 125,
        sizeBytes: 245000,
        playbackUrl: '/api/v1/voice/whatsapp/calls/wa_call_test_001/recording/stream?token=abc',
        downloadUrl: '/api/v1/voice/whatsapp/calls/wa_call_test_001/recording/download?token=abc',
      },
    });
  });

  it('renders call session details and conversation turns with metrics', async () => {
    render(
      <CallDetailDrawer
        isOpen={true}
        onClose={vi.fn()}
        callId="wa_call_test_001"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Call Session Details')).toBeInTheDocument();
      expect(screen.getAllByText('02:05').length).toBeGreaterThan(0);
      expect(screen.getByText(/opus/i)).toBeInTheDocument();
      expect(screen.getByText(/Thanks for connecting with GyanVaniAi/i)).toBeInTheDocument();
      expect(screen.getByText(/inquire about pricing/i)).toBeInTheDocument();
      expect(screen.getByText('TTFA: 420ms')).toBeInTheDocument();
    });
  });

  it('renders call recording playback section when recording is AVAILABLE', async () => {
    render(
      <CallDetailDrawer
        isOpen={true}
        onClose={vi.fn()}
        callId="wa_call_test_001"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Call Recording')).toBeInTheDocument();
      expect(screen.getByText('MP3')).toBeInTheDocument();
      expect(screen.getByText(/239.26 KB|239.3 KB/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /play call recording/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /download mp3/i })).toBeInTheDocument();
      expect(screen.getByRole('slider', { name: /seek call recording/i })).toBeInTheDocument();
    });
  });

  it('renders recording in-progress banner when status is PROCESSING', async () => {
    (callingApi.fetchWhatsAppCallRecording as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        callId: 'wa_call_test_001',
        available: false,
        status: 'PROCESSING',
      },
    });

    render(
      <CallDetailDrawer
        isOpen={true}
        onClose={vi.fn()}
        callId="wa_call_test_001"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Call Recording In Progress')).toBeInTheDocument();
      expect(screen.getByText(/synced to Cloudinary/i)).toBeInTheDocument();
    });
  });

  it('renders unavailable placeholder when no recording exists', async () => {
    (callingApi.fetchWhatsAppCallRecording as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        callId: 'wa_call_test_001',
        available: false,
        status: 'NOT_AVAILABLE',
      },
    });

    render(
      <CallDetailDrawer
        isOpen={true}
        onClose={vi.fn()}
        callId="wa_call_test_001"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No audio recording available for this call session')).toBeInTheDocument();
    });
  });

  it('renders empty turns placeholder when no dialogue occurred', async () => {
    (callingApi.fetchWhatsAppCallTurns as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
      },
    });

    render(
      <CallDetailDrawer
        isOpen={true}
        onClose={vi.fn()}
        callId="wa_call_test_001"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No conversation turns recorded')).toBeInTheDocument();
    });
  });
});
