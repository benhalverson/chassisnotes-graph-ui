import { expect, type Locator, type Page } from '@playwright/test';

const DATABASE_NAME = 'chassisnotes_relationships';

export async function resetApp(page: Page): Promise<void> {
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
  await expect(
    page.getByRole('heading', { name: 'Graphs' }),
  ).toBeVisible();
}

export async function createBaselineGraph(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /Create 2WD Buggy Carpet Baseline/i })
    .click();
  await expectEditorLoaded(page, '2WD Buggy Carpet Baseline');
}

export async function createGraphFromTemplate(
  page: Page,
  graphName: string,
): Promise<void> {
  await page
    .getByRole('button', {
      name: new RegExp(`^${escapeRegExp(graphName)}`, 'i'),
    })
    .click();
  await expectEditorLoaded(page, graphName);
}

export async function openGraphFromLibrary(
  page: Page,
  graphName: string,
): Promise<void> {
  const graphCard = getSavedGraphCard(page, graphName);

  await expect(graphCard).toBeVisible();
  await graphCard.getByRole('button', { name: 'Open' }).click();
  await expectEditorLoaded(page, graphName);
}

export async function returnToLibrary(page: Page): Promise<void> {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Graphs' }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Saved graphs' })).toBeVisible();
}

export function getSavedGraphCard(page: Page, graphName: string): Locator {
  return page
    .getByRole('listitem')
    .filter({
      has: page.getByRole('heading', { name: graphName, exact: true }),
    })
    .first();
}

export async function expectEditorLoaded(
  page: Page,
  graphName: string,
): Promise<void> {
  await expect(page).toHaveURL(/\/graphs\//);
  await expect(page.getByRole('heading', { name: graphName })).toBeVisible();
  await expect(page.getByLabel('Diagram canvas')).toBeVisible();
  await expect(
    page.getByRole('toolbar', { name: 'Canvas actions' }),
  ).toBeVisible();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
