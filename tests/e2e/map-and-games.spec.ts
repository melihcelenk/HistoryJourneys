import { expect, test } from '@playwright/test';
import { isDesktop, JOURNEY_STOP, MAIN_JOURNEY_HASH, openApp, shownStopCount, snap, startMainJourney, waitUntilStill } from './helpers';

/** Longer than one rest of playback at normal speed: if time were still playing, the caption would have changed. */
const LONGER_THAN_ONE_REST_MS = 3200;

test.describe('map and timeline', () => {
  test('shows the focused figure and its journey on the map', async ({ page }) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const figure = page.locator('.map-figure[data-slug="ahmed-i"]');
    await expect(figure).toHaveAttribute('data-focused', 'true');
    // The map shows one group of stops at a time.
    await expect(page.locator(JOURNEY_STOP)).toHaveCount(shownStopCount('ahmed-i'));
    await expect(page.locator(`${JOURNEY_STOP}[data-current="true"]`)).toHaveCount(1);
  });

  test('moves time with the slider and shows both calendars', async ({ page }, testInfo) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    await page.getByTestId('year-slider').fill('1609');
    await expect(page.getByTestId('year')).toContainText('1609');
    if (isDesktop(testInfo)) {
      await expect(page.getByTestId('year')).toContainText('H. 1018');
    }
    await expect(page).toHaveURL(/y=1609/);
    await expect(page.locator(`${JOURNEY_STOP}[data-reached="true"]`)).toHaveCount(2);
    await snap(page, testInfo, '09-timeline-1609');

    await page.getByTestId('year-slider').fill('1612');
    await expect(page.locator(`${JOURNEY_STOP}[data-reached="true"]`)).toHaveCount(3);
  });

  test('hides figures outside their lifetime', async ({ page }) => {
    // The overview: with a card open the timeline covers only the life of that figure.
    await openApp(page, `${MAIN_JOURNEY_HASH}?g=1`);
    await page.getByTestId('year-slider').fill('1700');
    await expect(page.locator('.map-figure[data-slug="ahmed-i"]')).toHaveCount(0);
  });

  test('plays from event to event, tells what happens and stops on demand', async ({ page }, testInfo) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    await page.getByTestId('year-slider').fill('1600');
    await expect(page.getByTestId('chronicle')).toBeHidden();
    await page.getByTestId('play').click();
    await expect(page.getByTestId('play')).toHaveAccessibleName('Zamanı durdur');

    // Playback goes straight to the first recorded event after 1600 and rests there.
    const chronicle = page.getByTestId('chronicle');
    await expect(chronicle).toBeVisible();
    const firstEvent = await chronicle.textContent();
    await expect(page.getByTestId('year')).not.toContainText('1600');
    await snap(page, testInfo, '15-playback');
    await expect(chronicle).not.toHaveText(firstEvent ?? '', { timeout: 10_000 });

    await page.getByTestId('play').click();
    const stoppedAt = await chronicle.textContent();
    await page.waitForTimeout(LONGER_THAN_ONE_REST_MS);
    await expect(chronicle).toHaveText(stoppedAt ?? '');
  });

  test('lets the reader choose the playback speed', async ({ page }) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const speed = page.getByTestId('speed');
    await expect(speed).toHaveText('1×');
    await speed.click();
    await expect(speed).toHaveText('2×');
    await speed.click();
    await expect(speed).toHaveText('0,5×');
    await speed.click();
    await expect(speed).toHaveText('1×');
  });

  test('opens a card from its banner on the map', async ({ page }) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    await page.getByTestId('year-slider').fill('1600');
    const other = page.locator('.map-figure[data-focused="false"]').first();
    const slug = await other.getAttribute('data-slug');
    expect(slug).not.toBeNull();
    await other.click();
    await expect(page.getByTestId(`card-${slug}`)).toBeVisible();
  });

  test('offers the basic map as an alternative to the painted map', async ({ page }, testInfo) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    await expect(page.getByTestId('map-stage')).toHaveAttribute('data-map-kind', 'pixi');
    await snap(page, testInfo, '13-painted-map');

    await page.getByTestId('open-settings').click();
    await page.getByTestId('map-kind-maplibre').click();
    await page.getByTestId('close-dialog').click();
    await expect(page.getByTestId('map-stage')).toHaveAttribute('data-map-kind', 'maplibre');
    await expect(page.getByTestId('map-stage')).toHaveAttribute('data-ready', 'true');
    await expect(page).toHaveURL(/map=maplibre/);
    await expect(page.locator('.map-figure[data-slug="ahmed-i"]')).toHaveAttribute('data-focused', 'true');
    await expect(page.locator(JOURNEY_STOP)).toHaveCount(shownStopCount('ahmed-i'));
    await snap(page, testInfo, '14-basic-map');
  });

  test('pans and zooms the painted map', async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), 'mouse wheel and drag are desktop gestures');
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const marker = page.locator('.map-stop').first();
    // The camera flies to the journey first; measure only once it has come to rest.
    const before = await waitUntilStill(marker);
    // The drag must begin on the map itself: a marker under the pointer would take the press as a click.
    const start = await page.evaluate(() => {
      for (let x = 700; x <= 1300; x += 60) {
        for (let y = 300; y <= 700; y += 60) {
          if (document.elementFromPoint(x, y)?.classList.contains('map-canvas')) return { x, y };
        }
      }
      return null;
    });
    expect(start).not.toBeNull();
    await page.mouse.move(start!.x, start!.y);
    await page.mouse.down();
    await page.mouse.move(start!.x + 100, start!.y + 70, { steps: 5 });
    await page.mouse.up();
    const after = await waitUntilStill(marker);
    expect(Math.round(after.x - before.x)).toBe(100);
    expect(Math.round(after.y - before.y)).toBe(70);
  });

  test('keeps markers on their places when the window is resized', async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), 'the window is resized on the desktop viewport');
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const marker = page.locator('.map-stop').first();
    const before = await waitUntilStill(marker);
    // The view keeps its centre: a window 200 pixels narrower moves everything 100 pixels left.
    await page.setViewportSize({ width: 1240, height: 900 });
    const after = await waitUntilStill(marker);
    expect(Math.round(after.x - before.x)).toBe(-100);
    expect(Math.round(after.y - before.y)).toBe(0);
  });

  test('shows the minimap on wide screens only', async ({ page }, testInfo) => {
    await openApp(page);
    if (isDesktop(testInfo)) await expect(page.getByTestId('minimap')).toBeVisible();
    else await expect(page.getByTestId('minimap')).toBeHidden();
  });
});

test.describe('learning games', () => {
  test('orders figures and scores the round', async ({ page }, testInfo) => {
    await startMainJourney(page);
    await page.getByTestId('open-quiz').click();
    const items = page.getByTestId('order-list').locator('li');
    await expect(items).toHaveCount(5);
    const before = await items.first().getAttribute('data-slug');
    await items.first().getByRole('button', { name: /aşağı taşı/ }).click();
    await expect(items.nth(1)).toHaveAttribute('data-slug', before ?? '');
    await snap(page, testInfo, '10-ordering-game');

    await page.getByTestId('check-order').click();
    await expect(page.getByTestId('score')).toHaveText(/^[0-5] \/ 5 doğru$/);
    await expect(page.locator('.order-item[data-result]')).toHaveCount(5);
    await page.getByTestId('new-round').click();
    await expect(page.getByTestId('score')).toBeHidden();
  });

  test('asks for the cause of an action and moves to the next question', async ({ page }, testInfo) => {
    await startMainJourney(page);
    await page.getByTestId('open-quiz').click();
    await page.getByTestId('tab-causes').click();
    await expect(page.getByTestId('next-question')).toBeDisabled();
    await page.getByTestId('cause-option-0').click();
    await expect(page.locator('.quiz__option[data-result="right"]')).toHaveCount(1);
    await snap(page, testInfo, '11-cause-game');
    // Answer until the round ends, however many questions the route yields.
    await page.getByTestId('next-question').click();
    while (await page.getByTestId('cause-option-1').isVisible()) {
      await page.getByTestId('cause-option-1').click();
      await page.getByTestId('next-question').click();
    }
    await expect(page.getByTestId('cause-finished')).toContainText('sorudan');

    await page.getByRole('button', { name: 'Yeni tur' }).click();
    await expect(page.locator('.score')).toContainText('Soru 1 /');
    await expect(page.locator('.score')).toContainText('0 doğru');
  });
});

test.describe('learning games without a journey', () => {
  test('builds the ordering round from all figures and explains the empty cause game', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('open-quiz').click();
    await expect(page.getByTestId('order-list').locator('li')).toHaveCount(5);
    await page.getByTestId('tab-causes').click();
    await expect(page.getByTestId('cause-empty')).toContainText('önce bir yolculuk seç');
  });
});

test.describe('links and installation', () => {
  test('restores the same state from a copied link', async ({ page, context }) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    await page.getByTestId('year-slider').fill('1609');
    const card = page.getByTestId('card-ahmed-i');
    await card.getByTestId('tab-relations').click();
    await card.getByRole('button', { name: 'Kösem Sultan' }).click();
    await expect(page.getByTestId('card-kosem-sultan')).toBeVisible();
    const link = page.url();

    const copy = await context.newPage();
    await copy.goto(link);
    await expect(copy.getByTestId('card-kosem-sultan')).toBeVisible();
    await copy.getByTestId('back-to-route').click();
    await expect(copy.getByTestId('card-ahmed-i')).toBeVisible();
  });

  test('follows the browser when the link changes', async ({ page }) => {
    await openApp(page);
    await page.evaluate((hash) => {
      window.location.hash = hash;
    }, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    await expect(page.getByTestId('card-ahmed-i')).toBeVisible();
  });

  test('can be installed and works offline', async ({ page, context }) => {
    await openApp(page);
    const manifest = await page.evaluate(async () => {
      const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href ?? '';
      return (await fetch(href)).json() as Promise<{ name: string; display: string; icons: unknown[] }>;
    });
    expect(manifest.name).toBe('History Journeys');
    expect(manifest.display).toBe('fullscreen');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

    await page.evaluate(() => navigator.serviceWorker.ready);
    // The first visit fills the cache; the reload then has to succeed without a network.
    await page.reload();
    await expect(page.getByTestId('welcome')).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId('welcome')).toBeVisible();
    await page.getByRole('button', { name: /Mustafa Kemal Atatürk → / }).click();
    await expect(page.getByTestId('route-chain')).toBeVisible();
    await context.setOffline(false);
  });

  test('shows the about scroll with licences', async ({ page }, testInfo) => {
    await openApp(page);
    await page.getByTestId('open-settings').click();
    await page.getByTestId('open-about').click();
    const about = page.getByTestId('about-dialog');
    await expect(about.getByText('CC BY-SA 4.0')).toBeVisible();
    await expect(about.getByText('hiçbir veri saklamaz')).toBeVisible();
    await snap(page, testInfo, '12-about');
  });
});
