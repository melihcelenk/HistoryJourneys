import { expect, test, type Page } from '@playwright/test';
import type { MapKind } from '../../src/app/urlState';
import { MAIN_JOURNEY_HASH, openApp } from './helpers';

/** Chooses a map in the settings. */
async function pickMap(page: Page, kind: MapKind): Promise<void> {
  await page.getByTestId('open-settings').click();
  await page.getByTestId(`map-kind-${kind}`).click();
  await page.getByTestId('close-dialog').click();
}

/** Chooses a map in the settings and waits until that map is the one on the stage and can draw. */
async function chooseMap(page: Page, kind: MapKind): Promise<void> {
  await pickMap(page, kind);
  const stage = page.getByTestId('map-stage');
  await expect(stage).toHaveAttribute('data-map-kind', kind);
  await expect(stage).toHaveAttribute('data-ready', 'true');
}

test.describe('choosing the map', () => {
  test('opens with the plain map; the painted map is a choice', async ({ page }) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    await expect(page.getByTestId('map-stage')).toHaveAttribute('data-map-kind', 'maplibre');
    await expect(page).not.toHaveURL(/map=/);
    await chooseMap(page, 'pixi');
    await expect(page).toHaveURL(/map=pixi/);
    await expect(page.locator('.map-canvas')).toBeVisible();
  });

  test.describe('when the painted map cannot start', () => {
    // The service worker would answer for the relief picture from its cache, past the route that breaks it.
    test.use({ serviceWorkers: 'block' });

    test('says so when the painted map cannot start, and stays on the plain map', async ({ page }) => {
      // The painted map needs the relief picture; the plain map does not.
      let attempts = 0;
      await page.route('**/geo/relief.jpg', (route) => {
        attempts += 1;
        return route.abort();
      });
      await openApp(page, MAIN_JOURNEY_HASH);
      await expect(page.getByTestId('map-notice')).toHaveCount(0);
      await pickMap(page, 'pixi');

      await expect(page.getByTestId('map-notice')).toContainText('Boyalı harita açılamadı');
      await expect(page.getByTestId('map-stage')).toHaveAttribute('data-map-kind', 'maplibre');
      await expect(page.getByTestId('map-stage')).toHaveAttribute('data-ready', 'true');
      await expect(page.locator('.map-figure').first()).toBeVisible();
      // It was tried again before giving up.
      expect(attempts).toBeGreaterThanOrEqual(2);

      // Choosing a map again takes the note away.
      await pickMap(page, 'maplibre');
      await expect(page.getByTestId('map-notice')).toHaveCount(0);
    });
  });

  test('switches between the two maps as often as asked', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await openApp(page, MAIN_JOURNEY_HASH);
    for (let round = 0; round < 3; round += 1) {
      await chooseMap(page, 'pixi');
      await expect(page.locator('.map-canvas')).toBeVisible();
      await expect(page.locator('.map-figure').first()).toBeVisible();
      await chooseMap(page, 'maplibre');
      await expect(page.locator('.map-figure').first()).toBeVisible();
    }
    expect(errors.filter((text) => text.includes('could not start'))).toEqual([]);
  });
});
