import { test, expect } from '@playwright/test';

test.describe('Auto-reload preferences', () => {
  test('loads auto-reload settings on credits page', async ({ page }) => {
    await page.goto('/dashboard/credits');
    await expect(page.getByText('Current Balance')).toBeVisible({ timeout: 15_000 });

    const toggle = page.locator('#auto-reload-toggle');
    await expect(toggle).toBeVisible();

    const apiRes = await page.request.get('/api/credits/auto-reload');
    expect(apiRes.ok()).toBeTruthy();
    const body = await apiRes.json();
    expect(body).toHaveProperty('enabled');
    expect(body).toHaveProperty('packSize');
  });

  test('PATCH auto-reload toggles enabled flag', async ({ page }) => {
    await page.goto('/dashboard/credits');
    await expect(page.locator('#auto-reload-toggle')).toBeVisible({ timeout: 15_000 });

    const before = await page.request.get('/api/credits/auto-reload');
    expect(before.ok()).toBeTruthy();
    const beforeData = await before.json();
    const nextEnabled = !beforeData.enabled;

    const patchRes = await page.request.patch('/api/credits/auto-reload', {
      data: { enabled: nextEnabled, packSize: beforeData.packSize ?? 100 },
    });
    expect(patchRes.ok()).toBeTruthy();

    const after = await page.request.get('/api/credits/auto-reload');
    const afterData = await after.json();
    expect(afterData.enabled).toBe(nextEnabled);

    await page.request.patch('/api/credits/auto-reload', {
      data: { enabled: beforeData.enabled, packSize: beforeData.packSize ?? 100 },
    });
  });
});
