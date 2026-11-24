import { expect, test } from '@playwright/test';
import { MAIN_JOURNEY_HASH, openApp, snap, startMainJourney } from './helpers';

test.describe('start screen', () => {
  test('shows the welcome scroll over the map', async ({ page }, testInfo) => {
    await openApp(page);
    await expect(page.getByTestId('welcome')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Yolculuğunu seç' })).toBeVisible();
    await snap(page, testInfo, '01-welcome');
  });

  test('shows a destination that is chosen before the start', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('slot-to').click();
    await page.getByTestId('pick-mehmed-ii').click();
    await expect(page.getByTestId('welcome')).toBeVisible();
    await expect(page.getByTestId('slot-to')).toContainText('Fatih Sultan Mehmed');
    await expect(page.getByTestId('endpoint-to')).toContainText('Fatih Sultan Mehmed');

    await page.getByTestId('slot-from').click();
    await page.getByTestId('pick-ataturk').click();
    await expect(page.getByTestId('route-chain')).toBeVisible();
  });

  test('has no horizontal scrolling', async ({ page }) => {
    await openApp(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('choosing two figures', () => {
  test('computes a route when both figures are picked', async ({ page }, testInfo) => {
    await openApp(page);
    await page.getByTestId('endpoint-from').click();
    await expect(page.getByTestId('figure-picker')).toBeVisible();
    await snap(page, testInfo, '02-picker');
    await page.getByTestId('pick-ataturk').click();
    await expect(page.getByTestId('starting-point')).toBeVisible();
    await expect(page.getByTestId('card-ataturk')).toBeVisible();

    await page.getByTestId('endpoint-to').click();
    await page.getByPlaceholder('Figür ara…').fill('fatih');
    await page.getByTestId('pick-mehmed-ii').click();

    await expect(page.getByTestId('route-chain')).toBeVisible();
    await expect(page.getByTestId('card-ataturk')).toBeVisible();
    await expect(page.getByTestId('strip-mehmed-ii')).toBeVisible();
    await expect(page).toHaveURL(/#\/yol\/ataturk\/mehmed-ii/);
  });

  test('offers alternative routes and switches between them', async ({ page }, testInfo) => {
    await startMainJourney(page);
    await expect(page.getByTestId('route-tab-0')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('route-tab-1')).toBeVisible();
    // Two routes differ in the figures they pass through, not necessarily in their length.
    const figuresOnRoute = () =>
      page
        .getByTestId('route-chain')
        .locator('[data-testid^="strip-"], [data-testid^="card-"]')
        .evaluateAll((items) => items.map((item) => item.getAttribute('data-testid')?.replace(/^(strip|card)-/, '')));
    const firstRoute = await figuresOnRoute();
    await page.getByTestId('route-tab-1').click();
    await expect(page.getByTestId('route-tab-1')).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/r=1/);
    expect(await figuresOnRoute()).not.toEqual(firstRoute);
    await snap(page, testInfo, '04-alternative-route');
  });

  test('names the relation between consecutive cards', async ({ page }) => {
    await startMainJourney(page);
    await expect(page.locator('.chain-link__tag').first()).not.toBeEmpty();
    await expect(page.locator('.chain-link__note').first()).not.toBeEmpty();
  });

  test('swaps the two figures', async ({ page }) => {
    await startMainJourney(page);
    await page.getByRole('button', { name: 'Başlangıç ile varışı değiştir' }).click();
    await expect(page).toHaveURL(/#\/yol\/mehmed-ii\/ataturk/);
    await expect(page.getByTestId('card-mehmed-ii')).toBeVisible();
  });
});

test.describe('reading a card', () => {
  test('reveals cause, consequence and depth of an action', async ({ page }, testInfo) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const card = page.getByTestId('card-ahmed-i');
    await expect(card).toBeVisible();
    await expect(card.getByText('13 yaşındayken tahta çıkan')).toBeVisible();
    await snap(page, testInfo, '03-card');

    const action = page.getByTestId('action-kardes-katli');
    await action.getByRole('button', { name: 'Neden' }).click();
    await expect(action.getByText('19 kardeşini birden boğdurmuş')).toBeVisible();

    await action.getByRole('button', { name: 'Sonuç' }).click();
    await expect(action.getByText('19 kardeşini birden boğdurmuş')).toBeHidden();
    await expect(action.getByText('Şehzadeler artık sancağa gönderilmedi')).toBeVisible();

    await action.getByRole('button', { name: 'Derinlik' }).click();
    await expect(action.getByText('tek bir kararla koymadı')).toBeVisible();
    await snap(page, testInfo, '05-depth');
  });

  test('opens a concept with its root and related words', async ({ page }, testInfo) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const action = page.getByTestId('action-kardes-katli');
    await action.getByRole('button', { name: 'Sonuç' }).click();
    await action.getByRole('button', { name: 'ekber ve erşed' }).click();
    const dialog = page.getByTestId('concept-dialog');
    await expect(dialog.getByTestId('concept-root')).toHaveText('k-b-r');
    await expect(dialog.getByText('tekbir')).toBeVisible();
    await snap(page, testInfo, '06-concept');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('shows journey, relations and sources in the details', async ({ page }) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const card = page.getByTestId('card-ahmed-i');
    await card.getByRole('button', { name: 'Ayrıntılar' }).click();
    await expect(card.getByRole('heading', { name: 'Yolculuğu' })).toBeVisible();
    await expect(card.getByText('yapı kesin').first()).toBeVisible();
    await expect(card.getByRole('link', { name: /TDV İslâm Ansiklopedisi/ })).toBeVisible();
    await expect(card.getByText('insan onayından geçmedi')).toBeVisible();
  });

  test('moves along the route with the next button', async ({ page }) => {
    await startMainJourney(page);
    // The second card of the route is whichever figure the route engine links to Atatürk.
    const secondStrip = page.locator('[data-testid^="strip-"]').first();
    const second = (await secondStrip.getAttribute('data-testid'))?.replace('strip-', '') ?? '';
    await page.getByTestId('next-card').click();
    await expect(page.getByTestId(`card-${second}`)).toBeVisible();
    await expect(page.getByTestId('strip-ataturk')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`k=${second}`));
  });

  test('leaves the route for another figure and returns to the same card', async ({ page }, testInfo) => {
    await openApp(page, `${MAIN_JOURNEY_HASH}?k=ahmed-i`);
    const card = page.getByTestId('card-ahmed-i');
    await card.getByRole('button', { name: 'Ayrıntılar' }).click();
    await card.getByRole('button', { name: 'Kösem Sultan' }).click();
    await expect(page.getByTestId('detour')).toBeVisible();
    await expect(page.getByTestId('card-kosem-sultan')).toBeVisible();
    await expect(page).toHaveURL(/d=kosem-sultan/);
    await snap(page, testInfo, '07-detour');

    await page.getByTestId('back-to-route').click();
    await expect(page.getByTestId('card-ahmed-i')).toBeVisible();
    await expect(page.getByTestId('detour')).toBeHidden();
  });
});

test.describe('error cases', () => {
  test('falls back to the start screen for an unknown figure in the link', async ({ page }) => {
    await openApp(page, '#/yol/nobody/also-nobody?k=x');
    await expect(page.getByTestId('welcome')).toBeVisible();
  });

  test('ignores a malformed link', async ({ page }) => {
    await openApp(page, '#/yol/%%%/<script>?r=abc&y=notayear');
    await expect(page.getByTestId('welcome')).toBeVisible();
  });

  test('opens the card instead of a route when both figures are the same', async ({ page }) => {
    await openApp(page, '#/yol/ahmed-i/ahmed-i');
    await expect(page.getByTestId('starting-point')).toBeVisible();
    await expect(page.getByTestId('card-ahmed-i')).toBeVisible();
  });

  test('keeps working and says so when the map cannot start', async ({ page }) => {
    await page.route('**/geo/land.json', (route) => route.abort());
    await page.route('**/geo/relief.jpg', (route) => route.abort());
    await openApp(page);
    await expect(page.getByTestId('map-error')).toBeVisible();
    await page.getByRole('button', { name: /Mustafa Kemal Atatürk → / }).click();
    await expect(page.getByTestId('route-chain')).toBeVisible();
  });

  test('shows a retry screen when the content cannot be loaded', async ({ page }, testInfo) => {
    await page.route('**/data/hj.sqlite', (route) => route.abort());
    await page.goto('/');
    await expect(page.getByTestId('load-error')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Yeniden dene' })).toBeVisible();
    await snap(page, testInfo, '08-load-error');
  });
});
