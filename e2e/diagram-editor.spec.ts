import { expect, test } from '@playwright/test';
import { createBaselineGraph, resetApp } from './test-helpers';

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
