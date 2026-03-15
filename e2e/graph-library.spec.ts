import { expect, test } from '@playwright/test';
import {
  createBaselineGraph,
  createGraphFromTemplate,
  getSavedGraphCard,
  openGraphFromLibrary,
  resetApp,
  returnToLibrary,
} from './test-helpers';

test.beforeEach(async ({ page }) => {
  await resetApp(page);
});

test('creates a graph from the troubleshooting template and reopens it from the library', async ({
  page,
}) => {
  await createGraphFromTemplate(page, 'Symptom-Driven Troubleshooting Map');

  await expect(page.getByLabel('Entry push')).toBeVisible();
  await returnToLibrary(page);

  const graphCard = getSavedGraphCard(page, 'Symptom-Driven Troubleshooting Map');
  await expect(graphCard).toBeVisible();

  await openGraphFromLibrary(page, 'Symptom-Driven Troubleshooting Map');
  await expect(page.getByLabel('Exit instability')).toBeVisible();
});

test('duplicates a saved graph and confirms delete flows from the library', async ({
  page,
}) => {
  await createBaselineGraph(page);
  await returnToLibrary(page);

  const originalCard = getSavedGraphCard(page, '2WD Buggy Carpet Baseline');
  await originalCard.getByRole('button', { name: 'Duplicate' }).click();
  await expect(page).toHaveURL(/\/graphs\//);
  await expect(
    page.getByRole('heading', { name: '2WD Buggy Carpet Baseline Copy' }),
  ).toBeVisible();

  await returnToLibrary(page);

  const copyCard = getSavedGraphCard(page, '2WD Buggy Carpet Baseline Copy');
  await expect(copyCard).toBeVisible();

  await originalCard.getByRole('button', { name: 'Delete' }).click();
  const deleteDialog = page.getByRole('alertdialog', {
    name: 'Delete graph?',
  });
  await expect(deleteDialog).toBeVisible();
  await expect(deleteDialog).toContainText('2WD Buggy Carpet Baseline');
  await deleteDialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(deleteDialog).toBeHidden();
  await expect(originalCard).toBeVisible();

  await originalCard.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Delete graph' }).click();

  await expect(originalCard).toBeHidden();
  await expect(copyCard).toBeVisible();

  await openGraphFromLibrary(page, '2WD Buggy Carpet Baseline Copy');
  await expect(page.getByLabel('Lazy rotation')).toBeVisible();
});
