import { expect, test } from '@playwright/test';
import { JOURNEY_GROUP_SIZE as GROUP_SIZE } from '../../src/domain/journey';
import { figureContent, isDesktop, JOURNEY_STOP, MAIN_JOURNEY_HASH, openApp, snap, startMainJourney } from './helpers';

const ATATURK = figureContent('ataturk');
const FATIH = figureContent('mehmed-ii');

test.describe('the journey of the open card', () => {
  test.beforeAll(() => {
    // These tests walk through groups of stops; they need a journey longer than one group.
    expect(ATATURK.journey.length).toBeGreaterThan(GROUP_SIZE);
  });

  test('is on the map by default, one group of stops at a time', async ({ page }, testInfo) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    await expect(page.getByTestId('card-ataturk')).toBeVisible();
    await page.getByTestId('year-slider').fill(String(ATATURK.birth.year));

    const pins = page.locator(`${JOURNEY_STOP} .map-stop__pin`);
    await expect(pins).toHaveCount(Math.min(GROUP_SIZE, ATATURK.journey.length));
    await expect(pins.first()).toHaveText('1');
    await snap(page, testInfo, '19-journey-first-group');

    await page.getByTestId('journey-group-1').click();
    await expect(page.getByTestId('journey-group-1')).toHaveAttribute('aria-pressed', 'true');
    await expect(pins.first()).toHaveText(String(GROUP_SIZE + 1));
    await expect(page.getByTestId('year')).toContainText(String(ATATURK.journey[GROUP_SIZE]!.from));
    await snap(page, testInfo, '20-journey-second-group');
  });

  test('goes to a stop when its number is clicked and tells what happened there', async ({ page }) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    await page.getByTestId('year-slider').fill(String(ATATURK.birth.year));
    const fourth = ATATURK.journey[3]!;

    await page.locator(`${JOURNEY_STOP} .map-stop__pin`, { hasText: /^4$/ }).click();
    await expect(page.getByTestId('year')).toContainText(String(fourth.from));
    await expect(page.getByTestId('chronicle')).toContainText(fourth.event);
    await expect(page.locator(`${JOURNEY_STOP}[data-current="true"] .map-stop__pin`)).toHaveText('4');
  });

  test('opens the card of a stop when the pointer is over its number', async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), 'hovering needs a mouse');
    await openApp(page, MAIN_JOURNEY_HASH);
    await page.getByTestId('year-slider').fill(String(ATATURK.birth.year));
    const stop = page.locator(JOURNEY_STOP).filter({ has: page.locator('.map-stop__pin', { hasText: /^4$/ }) });
    await expect(stop.locator('.map-stop__card')).toBeHidden();
    await stop.locator('.map-stop__pin').hover();
    await expect(stop.locator('.map-stop__card')).toBeVisible();
    await expect(stop.locator('.map-stop__card')).toContainText(ATATURK.journey[3]!.event);
    await snap(page, testInfo, '21-stop-card');
  });

  test('has its switches at the top of the card: the journey and the lines', async ({ page }) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    const journey = page.getByTestId('toggle-journey');
    const lines = page.getByTestId('toggle-lines');
    await expect(journey).toBeInViewport();
    await expect(journey).toHaveAttribute('aria-pressed', 'true');
    await expect(lines).toHaveAttribute('aria-pressed', 'true');

    await lines.click();
    await expect(lines).toHaveAttribute('aria-pressed', 'false');
    await expect(page).toHaveURL(/l=0/);
    // The stops stay; a stop right next to the current one is hidden by design, so the current one is checked.
    await expect(page.locator(`${JOURNEY_STOP}[data-current="true"]`)).toBeVisible();

    await journey.click();
    await expect(page.locator(JOURNEY_STOP)).toHaveCount(0);
    await expect(page).toHaveURL(/j=0/);
  });
});

test.describe('the timeline and the overview', () => {
  test('covers the life of the figure whose card is open', async ({ page }) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    const slider = page.getByTestId('year-slider');
    await expect(slider).toHaveAttribute('min', String(ATATURK.birth.year));
    await expect(slider).toHaveAttribute('max', String(ATATURK.death.year));
  });

  test('closes the card from its heading and shows the whole route', async ({ page }, testInfo) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    await page.getByTestId('close-card').click();
    await expect(page.getByTestId('card-ataturk')).toBeHidden();
    await expect(page.getByTestId('strip-ataturk')).toBeVisible();
    await expect(page.getByTestId('overview')).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/g=1/);

    const slider = page.getByTestId('year-slider');
    await expect(slider).toHaveAttribute('min', String(FATIH.birth.year));
    await expect(slider).toHaveAttribute('max', String(ATATURK.death.year));
    await expect(page.locator(JOURNEY_STOP)).toHaveCount(0);
    await snap(page, testInfo, '22-overview');

    await page.getByTestId('strip-ataturk').click();
    await expect(page.getByTestId('card-ataturk')).toBeVisible();
    await expect(slider).toHaveAttribute('min', String(ATATURK.birth.year));
  });

  test('goes to the overview with the button above the route', async ({ page }) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    await expect(page.getByTestId('overview')).toHaveAttribute('aria-pressed', 'false');
    await page.getByTestId('overview').click();
    await expect(page.getByTestId('card-ataturk')).toBeHidden();
    await expect(page.getByTestId('overview')).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows only the figures of the year in the overview', async ({ page }, testInfo) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?g=1`);
    await page.getByTestId('year-slider').fill('1461');
    await expect(page.locator('.map-figure[data-slug="ataturk"]')).toHaveCount(0);
    await expect(page.locator('.map-figure[data-slug="mehmed-ii"]')).toHaveCount(1);
    await snap(page, testInfo, '16-year-1461');
  });
});

test.describe('the kind of route', () => {
  test('is chosen on the start screen, before the journey', async ({ page }, testInfo) => {
    await openApp(page);
    await expect(page.getByTestId('route-kind-direct')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('route-kind-direct')).toContainText('Doğrudan');
    await expect(page.getByTestId('route-kind-influence')).toContainText('Etki');
    await page.getByTestId('route-kind-influence').click();
    await expect(page.getByTestId('route-kind-influence')).toHaveAttribute('aria-checked', 'true');
    await snap(page, testInfo, '23-route-kind');

    await page.getByRole('button', { name: /Mustafa Kemal Atatürk → / }).click();
    await expect(page.getByTestId('route-chain')).toBeVisible();
    await expect(page.locator('.chain-link__tag', { hasText: 'Etki' }).first()).toBeVisible();
    await expect(page.getByTestId('route-header')).toContainText('Etki');
    await snap(page, testInfo, '18-influence-route');
  });

  test('is not asked again on the game screen', async ({ page }) => {
    await startMainJourney(page);
    // The only tabs on the game screen are those of the card; none of them chooses a kind of route.
    await expect(page.getByRole('tab', { name: /Doğrudan|Etki/ })).toHaveCount(0);
    await expect(page.locator('.route-tab')).toHaveCount(0);
    await expect(page.getByTestId('route-kind-direct')).toHaveCount(0);
    await expect(page.getByTestId('route-header')).toContainText('Doğrudan');
    // The route of direct relations never uses an influence.
    await expect(page.locator('.chain-link__tag', { hasText: 'Etki' })).toHaveCount(0);
  });

  test('can be changed where the figures are chosen', async ({ page }, testInfo) => {
    await startMainJourney(page);
    const figuresOnRoute = () =>
      page
        .getByTestId('route-chain')
        .locator('[data-testid^="strip-"], [data-testid^="card-"]')
        .evaluateAll((items) => items.map((item) => item.getAttribute('data-testid')?.replace(/^(strip|card)-/, '')));
    const direct = await figuresOnRoute();

    await page.getByTestId('endpoint-from').click();
    await page.getByTestId('figure-picker').getByTestId('route-kind-influence').click();
    await page.getByTestId('close-dialog').click();
    await expect(page).toHaveURL(/r=1/);
    await expect.poll(figuresOnRoute).not.toEqual(direct);
    await snap(page, testInfo, '04-alternative-route');
  });
});
