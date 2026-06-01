import { test, expect } from '@playwright/test';
import { E2E_PROJECT_ID } from './constants';

test.describe('Delivery export workspace', () => {
  test('loads delivery page and eligible bundles API', async ({ page }) => {
    await page.goto(`/dashboard/projects/${E2E_PROJECT_ID}/delivery`);
    await expect(page.getByText(/Export locked story bundles/i)).toBeVisible({ timeout: 15_000 });

    const eligibleRes = await page.request.get(
      `/api/projects/${E2E_PROJECT_ID}/delivery/eligible`
    );
    expect(eligibleRes.ok()).toBeTruthy();
    const body = await eligibleRes.json();
    expect(body).toHaveProperty('bundles');
    expect(Array.isArray(body.bundles)).toBe(true);
  });
});
