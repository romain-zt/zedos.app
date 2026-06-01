import { test, expect } from '@playwright/test';

async function readAutoReload(page: import('@playwright/test').Page) {
  const res = await page.request.get('/api/credits/auto-reload');
  expect(res.ok(), `GET auto-reload failed: ${res.status()}`).toBeTruthy();
  return res.json() as Promise<{
    enabled: boolean;
    packSize: number;
    hasSavedPaymentMethod: boolean;
  }>;
}

test.describe('Auto-reload preferences', () => {
  test('loads auto-reload settings on credits page', async ({ page }) => {
    await page.goto('/dashboard/credits');
    await expect(page.getByText('Current Balance')).toBeVisible({ timeout: 15_000 });

    const toggle = page.locator('#auto-reload-toggle');
    await expect(toggle).toBeVisible();

    const body = await readAutoReload(page);
    expect(body).toHaveProperty('enabled');
    expect(body).toHaveProperty('packSize');
    expect(body.hasSavedPaymentMethod).toBe(true);
  });

  test('PATCH auto-reload toggles enabled flag when payment method is saved', async ({ page }) => {
    await page.goto('/dashboard/credits');
    await expect(page.locator('#auto-reload-toggle')).toBeVisible({ timeout: 15_000 });

    const before = await readAutoReload(page);
    expect(before.hasSavedPaymentMethod).toBe(true);

    const nextEnabled = !before.enabled;
    const packSize = before.packSize ?? 100;

    const patchRes = await page.request.patch('/api/credits/auto-reload', {
      data: { enabled: nextEnabled, packSize },
    });
    if (!patchRes.ok()) {
      const errBody = await patchRes.text();
      throw new Error(`PATCH auto-reload failed (${patchRes.status()}): ${errBody}`);
    }

    const after = await readAutoReload(page);
    expect(after.enabled).toBe(nextEnabled);

    const restoreRes = await page.request.patch('/api/credits/auto-reload', {
      data: { enabled: before.enabled, packSize },
    });
    expect(restoreRes.ok()).toBeTruthy();
  });
});
