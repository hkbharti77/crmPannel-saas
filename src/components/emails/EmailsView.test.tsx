import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailsView from './EmailsView';
import * as emailsApi from '../../lib/emailsApi';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock the API and matchMedia
vi.mock('../../lib/emailsApi', () => ({
  fetchEmailCampaigns: vi.fn(),
  pauseEmailCampaign: vi.fn(),
  resumeEmailCampaign: vi.fn(),
  cancelEmailCampaign: vi.fn(),
  sendTestEmail: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

window.confirm = vi.fn().mockReturnValue(true);

describe('EmailsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (emailsApi.fetchEmailCampaigns as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        content: [
          {
            id: 'test-uuid',
            name: 'Quarterly Newsletter',
            subject: 'Q3 Product Updates',
            status: 'SENT',
            totalSent: 10,
            totalRecipients: 10,
            openRate: 50,
            createdAt: '2023-01-01T00:00:00Z',
          }
        ],
        totalPages: 1
      }
    });
  });

  it('calculates average open rate without NaN', async () => {
    render(<MemoryRouter><EmailsView /></MemoryRouter>);
    
    // Wait for the mock API to load the data
    await waitFor(() => {
      expect(screen.getByText('Quarterly Newsletter')).toBeInTheDocument();
    });

    // The single mock campaign has openRate=50, totalSent=10
    expect(screen.getAllByText('10')[0]).toBeInTheDocument(); // total sent
    expect(screen.getAllByText('50')[0]).toBeInTheDocument(); // avg open rate
  });

  it('disables cancel button while loading', async () => {
    (emailsApi.fetchEmailCampaigns as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        content: [
          {
            id: 'test-uuid',
            name: 'Quarterly Newsletter',
            subject: 'Q3 Product Updates',
            status: 'SCHEDULED',
            totalSent: 0,
            totalRecipients: 10,
            openRate: 0,
            createdAt: '2023-01-01T00:00:00Z',
          }
        ],
        totalPages: 1
      }
    });

    render(<MemoryRouter><EmailsView /></MemoryRouter>);
    
    await waitFor(() => {
      expect(screen.getByText('Quarterly Newsletter')).toBeInTheDocument();
    });

    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    let resolveCancel: (val: unknown) => void = () => {};
    (emailsApi.cancelEmailCampaign as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      return new Promise(resolve => {
        resolveCancel = resolve;
      });
    });

    // Click campaign card to open details
    fireEvent.click(screen.getByText('Quarterly Newsletter'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    
    expect(cancelBtn).toBeDisabled();
    
    resolveCancel({ data: {}, error: null });
    
    await waitFor(() => {
      expect(cancelBtn).not.toBeDisabled();
    });

    mockConfirm.mockRestore();
  });
});
