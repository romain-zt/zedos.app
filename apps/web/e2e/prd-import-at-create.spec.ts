import { test, expect } from '@playwright/test';

const IMPORT_BODY = '# E2E imported PRD\n\nVision: founders need a fast path from idea to PRD.';

test.describe('PRD import at project creation', () => {
  test('paste import: creates project, opens PRD tab, persists v1', async ({ page }) => {
    const projectName = `E2E Import ${Date.now()}`;

    await page.goto('/dashboard/projects');
    await expect(page.getByRole('button', { name: /New project|Nouveau projet/i }).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('button', { name: /New project|Nouveau projet/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.locator('#project-name').fill(projectName);
    await page.getByRole('button', { name: /Import existing PRD|Importer un PRD existant/i }).click();
    await page.locator('#import-paste').fill(IMPORT_BODY);

    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        /\/api\/projects\/?$/.test(new URL(response.url()).pathname),
      { timeout: 30_000 },
    );

    const createButton = page
      .getByRole('dialog')
      .getByRole('button', { name: /Create project|Créer le projet/i });
    await expect(createButton).toBeEnabled();
    // Radix dialog footer can sit outside Playwright's viewport; DOM click still submits.
    await createButton.evaluate((btn) => {
      (btn as HTMLButtonElement).click();
    });

    const createResponse = await createResponsePromise;
    expect(
      createResponse.ok(),
      `POST /api/projects failed: ${createResponse.status()} ${(await createResponse.text()).slice(0, 300)}`,
    ).toBeTruthy();

    const project = (await createResponse.json()) as { id: string };
    expect(project.id).toBeTruthy();

    await expect(
      page.getByText(/Project created with imported PRD|Projet créé avec PRD importé/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(
      new RegExp(`/dashboard/projects/${project.id}(\\?tab=prd)?`),
      { timeout: 20_000 },
    );

    const prdTab = page.getByRole('tab', { name: /PRD/i });
    await expect(prdTab).toBeVisible({ timeout: 20_000 });
    if ((await prdTab.getAttribute('data-state')) !== 'active') {
      await prdTab.click();
    }
    await expect(prdTab).toHaveAttribute('data-state', 'active');
    await expect(page.getByText('Imported content')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('founders need a fast path')).toBeVisible();

    const prdList = await page.request.get(`/api/projects/${project.id}/prd`);
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
