import { test, expect } from '@playwright/test';

const IMPORT_BODY = '# E2E imported PRD\n\nVision: founders need a fast path from idea to PRD.';

test.describe('PRD import at project creation', () => {
  test('paste import: creates project, opens PRD tab, persists v1', async ({ page }) => {
    const projectName = `E2E Import ${Date.now()}`;

    // Use in-page fetch so auth cookies match the browser session (Playwright APIRequest can differ in CI).
    await page.goto('/dashboard/projects');
    const projectId = await page.evaluate(
      async ({ name, importPaste }) => {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            name,
            journeyMode: 'standard',
            importPaste,
          }),
        });
        const text = await res.text();
        if (!res.ok) {
          throw new Error(`POST /api/projects ${res.status}: ${text.slice(0, 300)}`);
        }
        const data = JSON.parse(text) as { id: string };
        return data.id;
      },
      { name: projectName, importPaste: IMPORT_BODY }
    );
    expect(projectId).toBeTruthy();

    await page.goto(`/dashboard/projects/${projectId}?tab=prd`);
    await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${projectId}`));

    const prdTab = page.getByRole('tab', { name: /PRD/i });
    await expect(prdTab).toBeVisible({ timeout: 20_000 });
    if ((await prdTab.getAttribute('data-state')) !== 'active') {
      await prdTab.click();
    }
    await expect(prdTab).toHaveAttribute('data-state', 'active');
    await expect(page.getByText('Imported content')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('founders need a fast path')).toBeVisible();

    const prdList = await page.request.get(`/api/projects/${projectId}/prd`);
    expect(prdList.ok(), `GET /prd failed: ${prdList.status()}`).toBeTruthy();
    const versions = (await prdList.json()) as Array<{
      versionNumber: number;
      content: { sections?: Array<{ id: string; content: string }> };
    }>;
    expect(versions.length).toBeGreaterThanOrEqual(1);
    const v1 = versions.find((v) => v.versionNumber === 1) ?? versions[0];
    const imported = v1?.content?.sections?.find((s) => s.id === 'imported_content');
    expect(imported?.content).toContain('founders need a fast path');
  });
});
