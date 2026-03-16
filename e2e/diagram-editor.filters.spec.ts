import { expect, test } from '@playwright/test';
import {
  createGraphFromTemplate,
  openMobilePaletteDialog,
  resetApp,
} from './test-helpers';

test.beforeEach(async ({ page }) => {
  await resetApp(page);
});

test('applies phase, confidence, and evidence filters and then clears them', async ({
  page,
}) => {
  await createGraphFromTemplate(page, 'Symptom-Driven Troubleshooting Map');

  const paletteDialog = await openMobilePaletteDialog(page);
  const filters = paletteDialog.locator('section[aria-label="Graph filters"]');
  const canvas = page.getByLabel('Diagram canvas');
  const entryPushNode = page.getByLabel('Entry push');
  const exitInstabilityNode = page.getByLabel('Exit instability');
  const observedEdge = canvas.getByText('observed', { exact: true }).first();
  const tradeoffEdge = canvas.getByText('tradeoff', { exact: true });

  await filters.getByLabel('exit').check();
  await expect(exitInstabilityNode).not.toHaveClass(/opacity-45/);
  await expect(entryPushNode).toHaveClass(/opacity-45/);

  await filters.getByRole('button', { name: 'Clear' }).click();
  await expect(entryPushNode).not.toHaveClass(/opacity-45/);

  await filters.getByLabel('medium').check();
  await expect(exitInstabilityNode).not.toHaveClass(/opacity-45/);
  await expect(entryPushNode).toHaveClass(/opacity-45/);

  await filters.getByRole('button', { name: 'Clear' }).click();
  await filters.getByLabel('observed').check();
  await expect(observedEdge).not.toHaveClass(/opacity-45/);
  await expect(tradeoffEdge).toHaveClass(/opacity-45/);

  await filters.getByRole('button', { name: 'Clear' }).click();
  await expect(entryPushNode).not.toHaveClass(/opacity-45/);
  await expect(tradeoffEdge).not.toHaveClass(/opacity-45/);
});
