import { expect, test } from '@playwright/test';
import { CURRENT_JOURNEY_PIN, figureContent, MAIN_JOURNEY_HASH, openApp, snap } from './helpers';

/** The ink buttons of the card are 34 pixels high; the button to the next card must stay below that. */
const MAX_NEXT_CARD_HEIGHT_PX = 32;
/** Sizes are compared with this tolerance, in pixels, to allow for rounding. */
const TOLERANCE_PX = 3;

function firstStopYear(slug: string): number {
  return figureContent(slug).journey[0]!.from;
}

test.describe('opening a figure', () => {
  test('starts its journey at the first stop', async ({ page }) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    await expect(page.getByTestId('year')).toContainText(String(firstStopYear('ataturk')));
    await expect(page.locator(CURRENT_JOURNEY_PIN)).toHaveText('1');

    const secondStrip = page.locator('[data-testid^="strip-"]').first();
    const second = (await secondStrip.getAttribute('data-testid'))?.replace('strip-', '') ?? '';
    await page.getByTestId('next-card').click();
    await expect(page.getByTestId(`card-${second}`)).toBeVisible();
    await expect(page.getByTestId('year')).toContainText(String(firstStopYear(second)));
  });
});

test.describe('the layout of the card', () => {
  test('has a wide button to the next card, as wide as the content of the card', async ({ page }, testInfo) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    const card = page.getByTestId('card-ataturk');
    const next = await card.getByTestId('next-card').boundingBox();
    const tabs = await card.locator('.card-tabs__bar').boundingBox();
    expect(Math.abs(next!.x - tabs!.x)).toBeLessThanOrEqual(TOLERANCE_PX);
    expect(Math.abs(next!.width - tabs!.width)).toBeLessThanOrEqual(TOLERANCE_PX);
    await expect(card.getByTestId('next-card')).toContainText('Sıradaki');
    // Broad but low: lower than the ink buttons of the card, so that it does not take the room of the content.
    expect(next!.height).toBeLessThanOrEqual(MAX_NEXT_CARD_HEIGHT_PX);
    await card.getByTestId('next-card').scrollIntoViewIfNeeded();
    await snap(page, testInfo, '29-next-card');
  });

  test('lets the roles and the years use the whole width under the heading', async ({ page }, testInfo) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    const card = page.getByTestId('card-ataturk');
    const roles = await card.locator('.card__roles').boundingBox();
    const tools = await card.getByTestId('toggle-journey').boundingBox();
    // The roles run on under the buttons at the corner instead of stopping short of them.
    expect(roles!.y).toBeGreaterThan(tools!.y + tools!.height - TOLERANCE_PX);
    expect(roles!.x + roles!.width).toBeGreaterThan(tools!.x);
    await snap(page, testInfo, '30-card-header');
  });

  test('gives the text of an action the whole line and writes the depth note upright', async ({ page }) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const action = page.getByTestId('action-kardes-katli');
    const head = await action.locator('.action__head').boundingBox();
    const text = await action.locator('.action__text').boundingBox();
    expect(Math.abs(head!.x + head!.width - (text!.x + text!.width))).toBeLessThanOrEqual(TOLERANCE_PX);

    await action.getByRole('button', { name: 'Derinlik' }).click();
    const note = action.locator('.reveal__body[data-tone="depth"]');
    await expect(note).toBeVisible();
    expect(await note.evaluate((node) => getComputedStyle(node).fontStyle)).toBe('normal');
  });
});
