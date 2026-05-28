import { describe, expect, it, vi } from 'vitest';
import SignInPage from './page';

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
}));

describe('SignInPage redirect', () => {
  it('redirects to /login and forwards query params', async () => {
    await SignInPage({
      searchParams: Promise.resolve({
        callbackUrl: '/dashboard/projects',
        from: 'middleware',
      }),
    });

    expect(redirectMock).toHaveBeenCalledWith(
      '/login?callbackUrl=%2Fdashboard%2Fprojects&from=middleware'
    );
  });
});
