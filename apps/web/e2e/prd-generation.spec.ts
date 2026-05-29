import { test, expect } from '@playwright/test';
import {
  AUTH_NO_CREDITS_STORAGE_PATH,
  E2E_PROJECT_ID,
  E2E_PROJECT_NO_CREDITS_ID,
} from './constants';

test.describe('PRD generation', () => {
  test('happy path: runs real generate-prd flow and persists a version', async ({ page, request }) => {
    await page.goto(`/dashboard/projects/${E2E_PROJECT_ID}`);
    await expect(page.getByRole('button', { name: 'Generate PRD' })).toBeEnabled();

    await page.getByRole('button', { name: 'Generate PRD' }).click();
    await expect(page.getByText('PRD generated!')).toBeVisible({ timeout: 30_000 });

    const prdList = await request.get(`/api/projects/${E2E_PROJECT_ID}/prd`);
    expect(prdList.ok()).toBeTruthy();
    const versions = (await prdList.json()) as Array<{ versionNumber: number; status: string }>;
    expect(versions.length).toBeGreaterThan(0);
    expect(versions.some((v) => v.status === 'generated')).toBe(true);
  });

  test('error path: insufficient credits surfaces an error toast', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: AUTH_NO_CREDITS_STORAGE_PATH,
    });
    const page = await context.newPage();

    await page.goto(`/dashboard/projects/${E2E_PROJECT_NO_CREDITS_ID}`);
    await expect(page.getByRole('button', { name: 'Generate PRD' })).toBeEnabled();
    await page.getByRole('button', { name: 'Generate PRD' }).click();

    await expect(
      page.getByText(/insufficient|crédit|credit/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    await context.close();
  });
});
