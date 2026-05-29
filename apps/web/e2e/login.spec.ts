import { test, expect } from '@playwright/test';
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from './constants';

test.describe('Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects unauthenticated users away from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/(sign-in|login)/);
  });

  test('signs in through the login form and reaches the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').click();
    await page.locator('#email').fill('');
    await page.locator('#email').pressSequentially(E2E_USER_EMAIL, { delay: 20 });
    await page.locator('#password').click();
    await page.locator('#password').fill('');
    await page.locator('#password').pressSequentially(E2E_USER_PASSWORD, { delay: 20 });
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
