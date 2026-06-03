/** @vitest-environment happy-dom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from './page';

const replaceMock = vi.hoisted(() => vi.fn());
const signInEmailMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const useSessionMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => ({
    get: (key: string): string | null => {
      if (key === 'callbackUrl') return '/dashboard/projects';
      return null;
    },
  }),
}));

vi.mock('@repo/auth', () => ({
  signIn: {
    email: (input: { email: string; password: string }) => signInEmailMock(input),
  },
  useSession: () => useSessionMock(),
  getSession: () => getSessionMock(),
}));

vi.mock('@infrastructure/analytics/posthog-client', () => ({
  captureClient: vi.fn(),
  identifyClient: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    success: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({
      data: null,
      isPending: false,
    });
  });

  it('submits credentials and redirects on success', async () => {
    signInEmailMock.mockResolvedValue({ error: null });
    getSessionMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password-123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(signInEmailMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password-123',
      });
      expect(replaceMock).toHaveBeenCalledWith('/dashboard/projects');
    });
  });

  it('shows error when credentials are rejected', async () => {
    signInEmailMock.mockResolvedValue({ error: { message: 'invalid credentials' } });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Invalid email or password');
    });
  });
});
