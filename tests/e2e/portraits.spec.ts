import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { openApp, snap } from './helpers';

interface FigureFile {
  slug: string;
  portrait?: { title: string; author: string; representative: boolean };
}

/** The figures of the content, so that the tests choose their examples from it instead of naming them. */
const FIGURES = readdirSync('content/figures')
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(`content/figures/${file}`, 'utf8')) as FigureFile);
const WITH_LIFETIME_PORTRAIT = FIGURES.find((figure) => figure.portrait && !figure.portrait.representative);
const WITH_REPRESENTATIVE_PORTRAIT = FIGURES.find((figure) => figure.portrait?.representative);
const WITHOUT_PORTRAIT = FIGURES.find((figure) => !figure.portrait);

/** Waits until a picture has really been loaded and decoded, not only placed in the page. */
async function expectLoaded(image: Locator): Promise<void> {
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
}

/** Opens the card of one figure, without a route. */
async function openFigure(page: Page, slug: string): Promise<void> {
  await openApp(page, `#/yol/${slug}`);
  await expect(page.getByTestId(`card-${slug}`)).toBeVisible();
}

test.describe('portraits of the figures', () => {
  // The content decides who the examples are; a test whose example the content does not have is skipped, not failed.
  const NO_EXAMPLE = 'the content has no figure of this kind';

  test('shows the portrait in the medallion of a figure that has one', async ({ page }, testInfo) => {
    test.skip(!WITH_LIFETIME_PORTRAIT, NO_EXAMPLE);
    const figure = WITH_LIFETIME_PORTRAIT!;
    await openFigure(page, figure.slug);
    const image = page.getByTestId(`card-${figure.slug}`).locator('.card__head .medallion img');
    await expect(image).toBeVisible();
    await expectLoaded(image);
    await snap(page, testInfo, '31-portrait');
  });

  test('shows the emblem in the medallion of a figure without a portrait', async ({ page }) => {
    test.skip(!WITHOUT_PORTRAIT, NO_EXAMPLE);
    const figure = WITHOUT_PORTRAIT!;
    await openFigure(page, figure.slug);
    const medallion = page.getByTestId(`card-${figure.slug}`).locator('.card__head .medallion');
    await expect(medallion.locator('svg')).toBeVisible();
    await expect(medallion.locator('img')).toHaveCount(0);
  });

  test('shows the portrait on the banner of the figure on the map, and the emblem where there is none', async ({ page }, testInfo) => {
    test.skip(!WITH_LIFETIME_PORTRAIT || !WITHOUT_PORTRAIT, NO_EXAMPLE);
    await openFigure(page, WITH_LIFETIME_PORTRAIT!.slug);
    const banner = page.locator(`.map-figure[data-slug="${WITH_LIFETIME_PORTRAIT!.slug}"]`);
    await expect(banner.locator('img')).toBeVisible();
    await expectLoaded(banner.locator('img'));
    await snap(page, testInfo, '32-map-portrait');

    await openFigure(page, WITHOUT_PORTRAIT!.slug);
    const plain = page.locator(`.map-figure[data-slug="${WITHOUT_PORTRAIT!.slug}"]`);
    await expect(plain).toBeVisible();
    await expect(plain.locator('img')).toHaveCount(0);
    await expect(plain.locator('svg')).toBeVisible();
  });

  test('credits the portrait among the sources of the card', async ({ page }) => {
    test.skip(!WITH_LIFETIME_PORTRAIT, NO_EXAMPLE);
    const figure = WITH_LIFETIME_PORTRAIT!;
    await openFigure(page, figure.slug);
    const card = page.getByTestId(`card-${figure.slug}`);
    await card.getByTestId('tab-sources').click();
    const credit = card.getByTestId('portrait-credit');
    await expect(credit).toContainText(figure.portrait!.title);
    await expect(credit).toContainText(figure.portrait!.author);
    await expect(credit.getByRole('link')).toHaveAttribute('href', /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    await expect(card.getByTestId('portrait-representative')).toHaveCount(0);
  });

  test('says so when a portrait was not made in the lifetime of the figure', async ({ page }) => {
    test.skip(!WITH_REPRESENTATIVE_PORTRAIT, NO_EXAMPLE);
    const figure = WITH_REPRESENTATIVE_PORTRAIT!;
    await openFigure(page, figure.slug);
    const card = page.getByTestId(`card-${figure.slug}`);
    await card.getByTestId('tab-sources').click();
    await expect(card.getByTestId('portrait-representative')).toContainText('Temsilî');
  });

  test('has no portrait credit for a figure without a portrait', async ({ page }) => {
    test.skip(!WITHOUT_PORTRAIT, NO_EXAMPLE);
    const figure = WITHOUT_PORTRAIT!;
    await openFigure(page, figure.slug);
    const card = page.getByTestId(`card-${figure.slug}`);
    await card.getByTestId('tab-sources').click();
    await expect(card.getByTestId('portrait-credit')).toHaveCount(0);
  });

  test('falls back to the emblem when a portrait cannot be loaded, and only for that figure', async ({ page }) => {
    const [broken, sound] = FIGURES.filter((figure) => figure.portrait);
    test.skip(!broken || !sound, NO_EXAMPLE);
    await page.route(`**/portraits/${broken!.slug}.webp`, (route) => route.fulfill({ status: 404 }));
    await openFigure(page, broken!.slug);
    const start = page.getByTestId('endpoint-from').locator('.medallion');
    await expect(start.locator('svg')).toBeVisible();
    await expect(start.locator('img')).toHaveCount(0);
    // The banner on the map is built apart from the medallions; it falls back to the pennant with the emblem too.
    const banner = page.locator(`.map-figure[data-slug="${broken!.slug}"]`);
    await expect(banner.locator('.map-figure__banner svg')).toBeVisible();
    await expect(banner.locator('img')).toHaveCount(0);

    // The same slot of the top bar now holds another figure, whose portrait is fine.
    await page.getByTestId('endpoint-from').click();
    await page.getByTestId(`pick-${sound!.slug}`).click();
    await expect(page.getByTestId(`card-${sound!.slug}`)).toBeVisible();
    await expect(start.locator('img')).toBeVisible();
  });

  test('never loads a picture from another server, and shows portraits offline', async ({ page, context }) => {
    test.skip(!WITH_LIFETIME_PORTRAIT, NO_EXAMPLE);
    const foreign: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.protocol.startsWith('http') && url.host !== new URL(page.url() || 'http://localhost').host && page.url() !== 'about:blank') foreign.push(request.url());
    });
    const figure = WITH_LIFETIME_PORTRAIT!;
    await openFigure(page, figure.slug);
    await page.evaluate(() => navigator.serviceWorker.ready);
    // The first visit fills the cache; the reload then has to succeed without a network.
    await page.reload();
    await expect(page.getByTestId(`card-${figure.slug}`)).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    const image = page.getByTestId(`card-${figure.slug}`).locator('.card__head .medallion img');
    await expect(image).toBeVisible();
    await expectLoaded(image);
    await context.setOffline(false);
    expect(foreign).toEqual([]);
  });
});
