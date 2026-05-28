/** @vitest-environment happy-dom */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import DashboardPage from './page';

const pushMock = vi.hoisted(() => vi.fn());
const useSessionMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@repo/auth', () => ({
  useSession: () => useSessionMock(),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({
      data: {
        user: {
          name: 'Romain Founder',
        },
      },
    });
  });

  it('renders recent projects from API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response(
          JSON.stringify([
            {
              id: 'proj-1',
              name: 'Project Alpha',
              prdVersionCount: 2,
              questionHistoryCount: 4,
            },
          ]),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        );
      })
    );

    render(<DashboardPage />);
    expect(await screen.findByText('Hey Romain')).toBeTruthy();
    expect(await screen.findByText('Project Alpha')).toBeTruthy();
  });

  it('navigates to projects list from CTA', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      })
    );

    render(<DashboardPage />);
    const button = await screen.findByRole('button', { name: /Go to Projects/i });
    fireEvent.click(button);
    expect(pushMock).toHaveBeenCalledWith('/dashboard/projects');
  });
});
