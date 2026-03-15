import { expect, test } from '@playwright/test';
import {
  createBaselineGraph,
  openGraphFromLibrary,
  resetApp,
  returnToLibrary,
} from './test-helpers';

test.beforeEach(async ({ page }) => {
  await resetApp(page);
});

test('adds, edits, and deletes nodes with persistence after reopening from the library', async ({
  page,
}) => {
  await createBaselineGraph(page);

  const nodeForm = page.locator('form[aria-label="Node inspector form"]');

  await page.getByRole('button', { name: /^Setup/i }).click();
  await expect(nodeForm).toBeVisible();
  await nodeForm.getByLabel('Title').fill('Front spring 2.6');
  await nodeForm.getByLabel('Subtype').fill('front-spring');
  await nodeForm
    .getByLabel('Description')
    .fill('Softer front spring to calm turn-in bite on carpet.');
  await nodeForm.getByLabel('Confidence').selectOption('high');
  await nodeForm
    .locator('label', { hasText: 'braking' })
    .locator('input')
    .check();
  await nodeForm.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByLabel('Front spring 2.6')).toBeVisible();
  await expect(nodeForm.getByLabel('Title')).toHaveValue('Front spring 2.6');

  await page.getByRole('button', { name: /^Experiment/i }).click();
  await nodeForm.getByLabel('Title').fill('Lower rear ride height');
  await nodeForm
    .getByLabel('Description')
    .fill('Quick experiment to settle rear grip on exit.');
  await nodeForm.getByLabel('Confidence').selectOption('medium');
  await nodeForm.locator('label', { hasText: 'exit' }).locator('input').check();
  await nodeForm.getByRole('button', { name: 'Save changes' }).click();

  const deletedNode = page.getByLabel('Lower rear ride height');
  await expect(deletedNode).toBeVisible();
  await nodeForm.getByRole('button', { name: 'Delete node' }).click();
  await expect(deletedNode).toBeHidden();

  await returnToLibrary(page);
  await openGraphFromLibrary(page, '2WD Buggy Carpet Baseline');

  const persistedNode = page.getByLabel('Front spring 2.6');
  await expect(persistedNode).toBeVisible();
  await expect(page.getByLabel('Lower rear ride height')).toBeHidden();
});
