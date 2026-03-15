import { expect, test } from '@playwright/test';
import { createBaselineGraph, resetApp } from './test-helpers';

test.beforeEach(async ({ page }) => {
  await resetApp(page);
});

test('navigates between Today, Diagnose, Garage, and Map from the mobile tab bar', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Today' }).click();
  await expect(
    page.getByRole('heading', { name: 'Trackside overview' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Diagnose' }).click();
  await expect(
    page.getByRole('heading', { name: 'Find the next setup direction' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Garage' }).click();
  await expect(page.getByRole('heading', { name: 'Garage' })).toBeVisible();

  await createBaselineGraph(page);

  await page.getByRole('link', { name: 'Map' }).click();
  await expect(page.getByRole('heading', { name: '2WD Buggy Carpet Baseline' }).first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Open garage' }),
  ).toBeVisible();
  await expect(page.getByLabel('Diagram canvas')).toBeVisible();
});

test('opens the mobile palette and inspector sheets inside the editor', async ({
  page,
}) => {
  await createBaselineGraph(page);

  await page.getByRole('button', { name: 'Palette + Filters' }).click();

  const paletteDialog = page.getByRole('dialog', {
    name: 'Palette and filters',
  });
  await expect(paletteDialog).toBeVisible();
  await paletteDialog.getByLabel('setup').check();
  await expect(page.getByLabel('Rear oil 32.5wt')).not.toHaveClass(/opacity-45/);
  await expect(page.getByLabel('Lazy rotation')).toHaveClass(/opacity-45/);
  await paletteDialog.getByRole('button', { name: 'Close' }).click();
  await expect(paletteDialog).toBeHidden();

  await page.getByLabel('Lazy rotation').click();

  const inspectorDialog = page.getByRole('dialog', { name: 'Inspector' });
  await expect(inspectorDialog).toBeVisible();
  const nodeForm = inspectorDialog.getByRole('form', {
    name: 'Node inspector form',
  });
  await expect(nodeForm).toBeVisible();
  await nodeForm.getByLabel('Title').fill('Lazy rotation mobile');
  await nodeForm.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByLabel('Lazy rotation mobile')).toBeVisible();
});