/** @vitest-environment happy-dom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResetPasswordPage from './page';

const replaceMock = vi.hoisted(() => vi.fn());
const getParamMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => getParamMock(key),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParamMock.mockImplementation((key: string) => {
      if (key === 'token') return 'reset-token-123';
      if (key === 'error') return null;
      return null;
    });
  });

  it('renders invalid link banner when error query param is present', async () => {
    getParamMock.mockImplementation((key: string) => {
      if (key === 'token') return null;
      if (key === 'error') return 'invalid_token';
      return null;
    });

    render(<ResetPasswordPage />);
    expect(screen.getByText('The reset link is invalid or expired.')).toBeTruthy();
  });

  it('shows error when token is missing', async () => {
    getParamMock.mockImplementation((key: string) => {
      if (key === 'token') return null;
      if (key === 'error') return null;
      return null;
    });

    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'new-password-123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Missing or invalid token');
    });
  });

  it('submits reset and redirects to login on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 }))
    );

    render(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'new-password-123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Reset password/i }));

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Password reset successful. Please sign in.'
      );
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });
});
