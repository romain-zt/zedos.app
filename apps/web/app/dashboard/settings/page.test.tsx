/** @vitest-environment happy-dom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsPage from './page';

vi.mock('@repo/auth', () => ({
  useSession: () => ({
    data: {
      user: {
        email: 'owner@zedos.dev',
      },
    },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/account/consent')) {
          return new Response(
            JSON.stringify({ marketingConsent: false, productUpdatesConsent: true, consentUpdatedAt: null }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          );
        }
        if (url.includes('/api/account/sessions')) {
          return new Response(JSON.stringify({ sessions: [] }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response(null, { status: 404 });
      }),
    );
  });

  it('renders the settings headings', async () => {
    render(<SettingsPage />);
    expect(screen.getByText('Account settings')).toBeTruthy();
    expect(screen.getByText('Privacy consent')).toBeTruthy();
    expect(screen.getByText('Active sessions')).toBeTruthy();
  });
});
