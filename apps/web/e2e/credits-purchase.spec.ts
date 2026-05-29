import { test, expect } from '@playwright/test';

async function readBalance(page: import('@playwright/test').Page): Promise<number> {
  const balanceLocator = page.locator('p.text-4xl.font-mono');
  await expect(balanceLocator).toBeVisible();
  await expect(balanceLocator).toHaveText(/^\d+$/, { timeout: 15_000 });
  const text = await balanceLocator.textContent();
  return Number.parseInt(text?.trim() ?? '0', 10);
}

test.describe('Credit purchase', () => {
  test('completes checkout via server E2E stub and increases balance', async ({ page }) => {
    await page.goto('/dashboard/credits');
    await expect(page.getByText('Current Balance')).toBeVisible();

    const balanceBefore = await readBalance(page);

    const buyButton = page.getByRole('button', { name: /Buy (\d+) Credits/ }).first();
    await expect(buyButton).toBeEnabled();
    const label = await buyButton.textContent();
    const packMatch = label?.match(/Buy (\d+) Credits/);
    const packSize = packMatch ? Number.parseInt(packMatch[1], 10) : 100;

    await buyButton.click();

    await expect(page).toHaveURL(/\/dashboard\/credits/, { timeout: 20_000 });
    await expect(page.getByText(/crédits ajoutés/i).first()).toBeVisible({ timeout: 15_000 });

    const balanceAfter = await readBalance(page);
    expect(balanceAfter).toBe(balanceBefore + packSize);
  });
});
