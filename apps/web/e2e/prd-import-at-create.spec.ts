import { test, expect } from '@playwright/test';

const IMPORT_BODY = '# E2E imported PRD\n\nVision: founders need a fast path from idea to PRD.';

test.describe('PRD import at project creation', () => {
  test('paste import: creates project, opens PRD tab, persists v1', async ({ page, request }) => {
    const projectName = `E2E Import ${Date.now()}`;

    const createRes = await request.post('/api/projects', {
      data: {
        name: projectName,
        description: null,
        journeyMode: 'standard',
        importPaste: IMPORT_BODY,
      },
    });
    expect(createRes.ok(), `POST /api/projects failed: ${createRes.status()}`).toBeTruthy();
    const project = (await createRes.json()) as { id: string };
    expect(project.id).toBeTruthy();

    await page.goto(`/dashboard/projects/${project.id}?tab=prd`);
    await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${project.id}`));

    const prdTab = page.getByRole('tab', { name: /PRD/i });
    await expect(prdTab).toBeVisible({ timeout: 20_000 });
    if ((await prdTab.getAttribute('data-state')) !== 'active') {
      await prdTab.click();
    }
    await expect(prdTab).toHaveAttribute('data-state', 'active');
    await expect(page.getByText('Imported content')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('founders need a fast path')).toBeVisible();

    const prdList = await request.get(`/api/projects/${project.id}/prd`);
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
