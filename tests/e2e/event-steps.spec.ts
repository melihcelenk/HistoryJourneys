import { expect, test } from '@playwright/test';
import { MAIN_JOURNEY_HASH, openApp, snap } from './helpers';

test.describe('stepping through events by hand', () => {
  test('goes to the next and the previous event with the buttons beside play', async ({ page }, testInfo) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    const slider = page.getByTestId('year-slider');
    await slider.fill((await slider.getAttribute('min')) ?? '');
    const chronicle = page.getByTestId('chronicle');
    const previous = page.getByTestId('previous-event');
    const next = page.getByTestId('next-event');

    await next.click();
    await expect(chronicle).toBeVisible();
    const first = (await chronicle.textContent()) ?? '';
    await expect(previous).toBeDisabled();

    await next.click();
    await expect(chronicle).not.toHaveText(first);
    await expect(previous).toBeEnabled();
    await snap(page, testInfo, '24-event-steps');

    await previous.click();
    await expect(chronicle).toHaveText(first);
    await expect(page.getByTestId('play')).toHaveAccessibleName('Zamanı oynat');
  });

  test('keeps the note about an event above the stops of the map', async ({ page }) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    await page.getByTestId('next-event').click();
    const chronicle = page.getByTestId('chronicle');
    await expect(chronicle).toBeVisible();
    // Whatever marker lies under the note, the note is what the reader sees at each of its corners and its centre.
    const covered = await chronicle.evaluate((note) => {
      const box = note.getBoundingClientRect();
      const points = [0.1, 0.5, 0.9].flatMap((x) => [0.2, 0.5, 0.8].map((y) => [box.left + box.width * x, box.top + box.height * y]));
      return points.filter(([x, y]) => !note.contains(document.elementFromPoint(x ?? 0, y ?? 0))).length;
    });
    expect(covered).toBe(0);
    const stacking = await page.locator('.stage__map').evaluate((map) => getComputedStyle(map).isolation);
    expect(stacking).toBe('isolate');
  });
});
