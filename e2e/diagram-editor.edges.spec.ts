import { expect, test } from '@playwright/test';
import { createBaselineGraph, resetApp } from './test-helpers';

test.beforeEach(async ({ page }) => {
  await resetApp(page);
});

test('opens the import/export dialog from the editor and closes it with Escape', async ({
  page,
}) => {
  await createBaselineGraph(page);

  await page.getByRole('button', { name: 'Import / Export' }).click();

  const dialog = page.getByRole('dialog', {
    name: 'Import / Export graph JSON',
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Download JSON' }),
  ).toBeEnabled();
  await expect(
    dialog.getByRole('button', { name: 'Download PNG' }),
  ).toBeEnabled();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
