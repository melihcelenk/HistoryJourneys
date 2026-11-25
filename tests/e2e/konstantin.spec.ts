import { expect, test } from '@playwright/test';
import { figureContent, JOURNEY_STOP, openApp, snap } from './helpers';

const SLUG = 'konstantin-i';
const KONSTANTIN = figureContent(SLUG);

test.describe('Constantine I', () => {
  test('has a card that opens at the first stop of his journey, with his marker on the map', async ({ page }, testInfo) => {
    await openApp(page, `#/yol/${SLUG}`);
    await expect(page.getByTestId(`card-${SLUG}`)).toBeVisible();
    await expect(page.locator('.card__roles').first()).toHaveText('Roma imparatoru');
    await expect(page.locator('.card__years').first()).toContainText(`${KONSTANTIN.birth.year}–${KONSTANTIN.death.year}`);
    await expect(page.getByTestId('year')).toContainText(String(KONSTANTIN.journey[0]!.from));
    await expect(page.locator(`.map-figure[data-slug="${SLUG}"]`)).toHaveCount(1);
    await expect(page.locator(`${JOURNEY_STOP} .map-stop__pin`).first()).toHaveText('1');
    await snap(page, testInfo, 'konstantin-card');
  });

  test('is on the map in the city he made his capital, in the year he opened it', async ({ page }, testInfo) => {
    const capital = KONSTANTIN.journey.find((stop) => stop.event.includes('başkent'))!;
    await openApp(page, `#/yol/${SLUG}`);
    await page.getByTestId('year-slider').fill(String(capital.from));
    await expect(page.locator(`.map-figure[data-slug="${SLUG}"]`)).toHaveCount(1);
    await expect(page.getByTestId('year')).toContainText(String(capital.from));
    await snap(page, testInfo, 'konstantin-capital');
  });

  test('is joined to the conqueror of his city by a route', async ({ page }) => {
    await openApp(page, `#/yol/${SLUG}/mehmed-ii`);
    await expect(page.getByTestId('route-chain')).toBeVisible();
    await expect(page.getByTestId('route-chain')).toContainText('I. Konstantin');
    await expect(page.getByTestId('route-chain')).toContainText('Fatih Sultan Mehmed');
  });

  test('can be found in the figure picker by his name', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('endpoint-from').click();
    await page.getByRole('searchbox').fill('Konstantin');
    await expect(page.getByRole('button', { name: /I\. Konstantin/ })).toBeVisible();
  });
});
