import { expect, type Page, test } from '@playwright/test';

const DATABASE_NAME = 'chassisnotes_relationships';

async function resetApp(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(async (databaseName: string) => {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(databaseName);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  }, DATABASE_NAME);
  await page.reload();
}

async function createBaselineGraph(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /Create 2WD Buggy Carpet Baseline/i })
    .click();
  await expect(page).toHaveURL(/\/graphs\//);
  await expect(
    page.getByRole('heading', { name: '2WD Buggy Carpet Baseline' }),
  ).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await resetApp(page);
});

test('creates a graph from the default template and opens the editor', async ({
  page,
}) => {
  await createBaselineGraph(page);

  await expect(page.getByLabel('Diagram canvas')).toBeVisible();
  await expect(
    page.getByRole('toolbar', { name: 'Canvas actions' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fit view' })).toBeEnabled();
});

test('adds a setup node, edits it in the inspector, and persists after reload', async ({
  page,
}) => {
  await createBaselineGraph(page);

  await page.getByRole('button', { name: /^Setup/i }).click();
  await page.getByLabel('Title').fill('Camber shim');
  await page
    .getByLabel('Description')
    .fill('Added for e2e persistence coverage.');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByLabel('Camber shim')).toBeVisible();

  await page.reload();

  await expect(page.getByLabel('Camber shim')).toBeVisible();
});

test('dims non-matching nodes when a category filter is applied', async ({
  page,
}) => {
  await createBaselineGraph(page);

  await expect(page.getByLabel('Rear oil 32.5wt')).toBeVisible();
  await page.getByLabel('setup').check();

  await expect(page.getByLabel('Rear oil 32.5wt')).not.toHaveClass(
    /opacity-45/,
  );
  await expect(page.getByLabel('Lazy rotation')).toHaveClass(/opacity-45/);
});
