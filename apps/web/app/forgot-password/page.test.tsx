/** @vitest-environment happy-dom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ForgotPasswordPage from './page';

const toastErrorMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error toast when API rejects request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 500 }))
    );
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'owner@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send reset link/i }));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Unable to send reset link');
    });
  });

  it('submits reset request and shows success message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 }))
    );
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'owner@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send reset link/i }));

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'If the account exists, a reset email has been sent.'
      );
    });
  });
});
