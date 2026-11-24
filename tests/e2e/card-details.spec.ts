import { expect, test } from '@playwright/test';
import { CURRENT_JOURNEY_PIN, figureContent, isDesktop, MAIN_JOURNEY_HASH, openApp, snap } from './helpers';

const ATATURK = figureContent('ataturk');

test.describe('the card of a figure', () => {
  test('reveals cause, consequence and depth with icon buttons on the line of the action', async ({ page }, testInfo) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const action = page.getByTestId('action-kardes-katli');
    const cause = action.getByRole('button', { name: 'Neden' });
    await expect(cause).toHaveText('');
    await expect(action.getByRole('button', { name: 'Derinlik' })).toHaveText('');
    // The buttons sit beside the text, not on a row of their own under it.
    const text = await action.locator('.action__text').boundingBox();
    const button = await cause.boundingBox();
    expect(button!.y).toBeLessThan(text!.y + text!.height);
    expect(button!.x).toBeGreaterThan(text!.x);
    await cause.click();
    await expect(action.getByText('19 kardeşini birden boğdurmuş')).toBeVisible();
    await snap(page, testInfo, '25-action-icons');
  });

  test('has its parts as tabs right under the heading, one open at a time', async ({ page }, testInfo) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const card = page.getByTestId('card-ahmed-i');
    await expect(card.getByTestId('tab-overview')).toHaveAttribute('aria-selected', 'true');
    await expect(card.locator('.card__summary')).toBeVisible();
    await expect(card.getByTestId('journey-list')).toBeHidden();
    // The tabs come before the summary, not after everything else.
    const tabs = await card.getByTestId('tab-journey').boundingBox();
    const summary = await card.locator('.card__summary').boundingBox();
    expect(tabs!.y).toBeLessThan(summary!.y);

    await card.getByTestId('tab-journey').click();
    await expect(card.getByTestId('tab-journey')).toHaveAttribute('aria-selected', 'true');
    await expect(card.getByTestId('journey-list')).toBeVisible();
    await expect(card.locator('.card__summary')).toBeHidden();

    await card.getByTestId('tab-relations').click();
    await expect(card.getByTestId('journey-list')).toBeHidden();
    await expect(card.getByTestId('open-relation-graph')).toBeVisible();
    await snap(page, testInfo, '26-card-tabs');

    await card.getByTestId('tab-sources').click();
    await expect(card.getByText('insan onayından geçmedi')).toBeVisible();
  });

  test('keeps the chosen tab when moving to the next card', async ({ page }) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    await page.getByTestId('card-ataturk').getByTestId('tab-journey').click();
    await page.getByTestId('next-card').click();
    await expect(page.getByTestId('card-ataturk')).toBeHidden();
    await expect(page.getByTestId('tab-journey')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('journey-list')).toBeVisible();
  });

  test('walks the journey in the card together with the map', async ({ page }, testInfo) => {
    await openApp(page, MAIN_JOURNEY_HASH);
    const card = page.getByTestId('card-ataturk');
    await card.getByTestId('tab-journey').click();
    const entries = card.getByTestId('journey-list').locator('.journey__stop');
    await expect(entries).toHaveCount(ATATURK.journey.length);

    await entries.nth(3).click();
    await expect(entries.nth(3)).toHaveAttribute('aria-current', 'true');
    await expect(page.getByTestId('year')).toContainText(String(ATATURK.journey[3]!.from));
    await expect(page.getByTestId('chronicle')).toContainText(ATATURK.journey[3]!.event);
    await expect(page.locator(CURRENT_JOURNEY_PIN)).toHaveText('4');
    await snap(page, testInfo, '27-journey-list');

    await page.getByTestId('next-event').click();
    await expect(entries.nth(4)).toHaveAttribute('aria-current', 'true');
    await expect(entries.nth(3)).not.toHaveAttribute('aria-current', 'true');
    await expect(card.locator('.journey__stop[aria-current="true"]')).toHaveCount(1);
  });

  test('stays at the stop when the banner of the open figure is clicked on the map', async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), 'the banner can lie under the strip of stop groups on a phone');
    await openApp(page, MAIN_JOURNEY_HASH);
    const slider = page.getByTestId('year-slider');
    await slider.fill((await slider.getAttribute('min')) ?? '');
    await page.getByTestId('next-event').click();
    await page.getByTestId('next-event').click();
    const year = await page.getByTestId('year').textContent();
    const note = await page.getByTestId('chronicle').textContent();

    await page.locator('.map-figure[data-slug="ataturk"]').click();
    await expect(page.getByTestId('year')).toHaveText(year ?? '');
    await expect(page.getByTestId('chronicle')).toHaveText(note ?? '');
  });
});

test.describe('the relations of a figure as a graph', () => {
  test('opens in a window and leads to the card of a related figure', async ({ page }, testInfo) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const card = page.getByTestId('card-ahmed-i');
    await card.getByTestId('tab-relations').click();
    await card.getByTestId('open-relation-graph').click();

    const graph = page.getByTestId('relation-graph');
    await expect(graph).toBeVisible();
    await expect(graph.getByTestId('graph-centre')).toContainText('I. Ahmed');
    await expect(graph.getByTestId('graph-node-kosem-sultan')).toBeVisible();
    // The window is wide but leaves the game visible around it.
    const box = await graph.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.height).toBeLessThan(viewport.height);
    await snap(page, testInfo, '28-relation-graph');

    await graph.getByTestId('graph-node-kosem-sultan').click();
    await expect(graph).toBeHidden();
    await expect(page.getByTestId('card-kosem-sultan')).toBeVisible();
  });
});
