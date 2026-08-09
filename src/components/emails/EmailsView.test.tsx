import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailsView from './EmailsView';
import * as emailsApi from '../../lib/emailsApi';
import { BrowserRouter } from 'react-router-dom';
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

describe('EmailsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (emailsApi.fetchEmailCampaigns as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        content: [
          {
            id: 'test-uuid',
            subject: 'Test Campaign',
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
    render(<BrowserRouter><EmailsView /></BrowserRouter>);
    
    // Wait for the mock API to load the data
    await waitFor(() => {
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });

    // The single mock campaign has openRate=50, totalSent=10
    expect(screen.getByText('10')).toBeInTheDocument(); // total sent
    expect(screen.getByText('50%')).toBeInTheDocument(); // avg open rate
  });

  it('disables cancel button while loading', async () => {
    render(<BrowserRouter><EmailsView /></BrowserRouter>);
    
    await waitFor(() => {
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let resolveCancel: (val: unknown) => void;
    (emailsApi.cancelEmailCampaign as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      return new Promise(resolve => {
        resolveCancel = resolve;
      });
    });

    // Expand row to reveal Cancel
    fireEvent.click(screen.getByText('Test Campaign'));

    const cancelBtn = screen.getAllByText('Cancel').find(b => b.tagName === 'BUTTON' && b.className.includes('text-danger-500'));
    if (cancelBtn) {
      fireEvent.click(cancelBtn);
      
      expect(cancelBtn).toBeDisabled();
      
      resolveCancel({ data: {}, error: null });
      
      await waitFor(() => {
        expect(cancelBtn).not.toBeDisabled();
      });
    }

    mockConfirm.mockRestore();
  });
});
