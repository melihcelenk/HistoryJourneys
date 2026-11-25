import { expect, test, type Page } from '@playwright/test';
import { openApp } from './helpers';

/**
 * The 3D scene: Mehmed II in a room of his palace. The tests follow what game developers check automatically:
 * the scene starts without errors (smoke test), stays within its drawing budget, plays the same way for the same
 * input, and looks the same from fixed cameras as the accepted pictures (golden images).
 */

const READY = 'html[data-scene-ready="true"]';
const READY_TIMEOUT = 120_000;
/** Interaction tests run without the picture effects: they test the game, not the look, and need many frames. */
const GAME_URL = 'sahne.html?q=low';
/** The most one frame may cost; the scene is small and must stay cheap enough for a laptop. */
const BUDGET = { calls: 260, triangles: 900_000 } as const;
/** How long a walk across the room may take in the test browser. */
const WALK_TIMEOUT = 240_000;
const FIGURE = { x: 0.35, z: -1.55 } as const;
/** The edge of the map table that faces the entrance, and half the width of the player. */
const TABLE_FRONT_Z = 0.02;
const PLAYER_RADIUS = 0.3;
/** The figure and the player both take room; their centres never come closer than this. */
const CLOSEST_APPROACH = 0.7;

interface SceneInfo {
  calls: number;
  triangles: number;
  player: { x: number; z: number };
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function openScene(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForSelector(READY, { timeout: READY_TIMEOUT });
}

function sceneInfo(page: Page): Promise<SceneInfo> {
  return page.evaluate(() => (window as unknown as { sceneInfo: SceneInfo }).sceneInfo);
}

async function distanceToFigure(page: Page): Promise<number> {
  const { player } = await sceneInfo(page);
  return Math.hypot(player.x - FIGURE.x, player.z - FIGURE.z);
}

test.describe('3D scene', () => {
  test.describe.configure({ timeout: 240_000 });

  test('starts without errors and says where we are', async ({ page }) => {
    const errors = collectErrors(page);
    await openScene(page, GAME_URL);
    await expect(page.getByTestId('scene-title')).toHaveText('Fatih Sultan Mehmed');
    await expect(page.getByTestId('scene-place')).toBeVisible();
    await expect(page.getByTestId('scene-hint')).toBeVisible();
    await expect(page.locator('#scene-root canvas')).toBeVisible();
    await expect(page.getByTestId('scene-loading')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('starts with the full picture effects too', async ({ page }) => {
    const errors = collectErrors(page);
    await openScene(page, 'sahne.html?shot=entrance');
    expect(errors).toEqual([]);
  });

  test('stays within the drawing budget from every fixed camera in the room', async ({ page }) => {
    for (const shot of ['entrance', 'windows', 'portrait']) {
      await openScene(page, `sahne.html?shot=${shot}`);
      const info = await sceneInfo(page);
      expect(info.calls, `${shot}: draw calls`).toBeLessThanOrEqual(BUDGET.calls);
      expect(info.triangles, `${shot}: triangles`).toBeLessThanOrEqual(BUDGET.triangles);
      expect(info.triangles, `${shot}: something is drawn`).toBeGreaterThan(10_000);
    }
  });

  test('the player walks to the map table, listens to the plan step by step and walks on', async ({ page }, testInfo) => {
    // The headless browser draws in software, a few frames a second, and slower still when other tests run beside it.
    test.setTimeout(WALK_TIMEOUT * 4);
    test.skip(testInfo.project.name === 'phone', 'Walking with the keyboard is a desktop control.');
    await openScene(page, GAME_URL);
    const start = await sceneInfo(page);
    const prompt = page.getByTestId('scene-prompt');
    const panel = page.getByTestId('briefing-panel');
    await expect(prompt).toBeHidden();
    await expect(panel).toBeHidden();

    await page.keyboard.down('KeyW');
    await expect(prompt).toBeVisible({ timeout: WALK_TIMEOUT });
    await expect(prompt).toContainText('Fetih planını dinle');
    // Keep walking: the table and the figure stand in the way and the player must not pass through them.
    await expect.poll(() => sceneInfo(page).then((info) => info.player.z), { timeout: WALK_TIMEOUT }).toBeLessThan(TABLE_FRONT_Z + 0.6);
    await page.waitForTimeout(1500);
    await page.keyboard.up('KeyW');
    const atTable = await sceneInfo(page);
    expect(atTable.player.z).toBeLessThan(start.player.z - 2);
    expect(atTable.player.z).toBeGreaterThanOrEqual(TABLE_FRONT_Z + PLAYER_RADIUS - 0.01);
    expect(await distanceToFigure(page)).toBeGreaterThanOrEqual(CLOSEST_APPROACH);

    // The figure tells his plan: the first step is shown and the walking hint gives way to it.
    await page.keyboard.press('KeyE');
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('briefing-speaker')).toHaveText('Fatih Sultan Mehmed');
    await expect(page.getByTestId('briefing-note')).toContainText('1451');
    await expect(page.getByTestId('briefing-counter')).toContainText('1 / 6');
    await expect(page.getByTestId('briefing-title')).toHaveText("Önce Boğaz'ı kestik");
    await expect(page.getByTestId('briefing-text')).toContainText('Rumeli Hisarı');
    await expect(page.getByTestId('briefing-back')).toBeDisabled();
    await expect(prompt).toBeHidden();
    await expect(page.getByTestId('scene-hint')).toBeHidden();

    // Forward with the keyboard to the last step, back one, forward again with the button.
    for (let step = 2; step <= 6; step += 1) {
      await page.keyboard.press('ArrowRight');
      await expect(page.getByTestId('briefing-counter')).toContainText(`${step} / 6`);
    }
    await expect(page.getByTestId('briefing-title')).toContainText('son hücum');
    await expect(page.getByTestId('briefing-next')).toHaveText('Bitir');
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByTestId('briefing-counter')).toContainText('5 / 6');
    await expect(page.getByTestId('briefing-text')).toContainText('Haliç');
    await page.getByTestId('briefing-next').click();
    await expect(page.getByTestId('briefing-counter')).toContainText('6 / 6');

    // While he speaks the player does not walk.
    await page.keyboard.down('KeyS');
    await page.waitForTimeout(1500);
    await page.keyboard.up('KeyS');

    // After the last step the briefing ends and the player stands where he stood.
    await page.getByTestId('briefing-next').click();
    await expect(panel).toBeHidden();
    await expect(prompt).toBeVisible({ timeout: WALK_TIMEOUT });
    const back = await sceneInfo(page);
    expect(back.player.x).toBeCloseTo(atTable.player.x, 1);
    expect(back.player.z).toBeCloseTo(atTable.player.z, 1);

    // And walks on: away from the table the invitation goes.
    await page.keyboard.down('KeyS');
    await expect(prompt).toBeHidden({ timeout: WALK_TIMEOUT });
    await page.keyboard.up('KeyS');
  });

  test('a briefing can be left at any step', async ({ page }) => {
    await openScene(page, 'sahne.html?q=low&shot=briefing&step=2');
    const panel = page.getByTestId('briefing-panel');
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('briefing-counter')).toContainText('3 / 6');
    await page.getByTestId('briefing-close').click();
    await expect(panel).toBeHidden();
  });

  test('the map opens in Ottoman script and a button turns it to Latin letters and back', async ({ page }) => {
    await openScene(page, GAME_URL);
    const toggle = page.getByTestId('script-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('data-script', 'ottoman');
    await expect(toggle).toContainText('Latin');
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-script', 'latin');
    await expect(toggle).toContainText('Osmanlıca');
    await page.keyboard.press('KeyT');
    await expect(toggle).toHaveAttribute('data-script', 'ottoman');
  });

  test('a link can open the map in Latin letters', async ({ page }) => {
    await openScene(page, 'sahne.html?q=low&script=latin');
    await expect(page.getByTestId('script-toggle')).toHaveAttribute('data-script', 'latin');
  });

  test('tells the player how to look around', async ({ page }, testInfo) => {
    await openScene(page, GAME_URL);
    const hint = page.getByTestId('scene-hint');
    await expect(hint).toContainText(testInfo.project.name === 'phone' ? 'sürükleyerek' : 'fareyi hareket ettir');
  });

  test('names the makers and licences of the models it uses', async ({ page }) => {
    await openScene(page, GAME_URL);
    await page.getByTestId('scene-credits-summary').click();
    const credits = page.getByTestId('scene-credits-list');
    await expect(credits).toContainText('Lee Perry-Smith');
    await expect(credits).toContainText('CC BY 3.0');
    await expect(credits).toContainText('MIT');
  });

  test('fits the screen: nothing written over the scene leaves it', async ({ page }) => {
    await openScene(page, GAME_URL);
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('The test needs a viewport.');
    for (const id of ['scene-title', 'scene-place', 'scene-hint', 'scene-back', 'scene-credits-summary', 'script-toggle']) {
      const box = await page.getByTestId(id).boundingBox();
      if (!box) throw new Error(`${id} is not on the page.`);
      expect(box.x, id).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, id).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height, id).toBeLessThanOrEqual(viewport.height);
    }
  });

  test('says so when the device cannot draw in 3D', async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await page.goto(GAME_URL);
    await expect(page.getByTestId('scene-notice')).toBeVisible({ timeout: READY_TIMEOUT });
    await expect(page.getByTestId('scene-notice')).toContainText('açılamadı');
  });

  test('leads back to the map', async ({ page }) => {
    await openScene(page, GAME_URL);
    await expect(page.getByTestId('scene-back')).toHaveAttribute('href', './#/yol/mehmed-ii');
  });

  test('is reached from the card of the figure it shows, and only from that card', async ({ page }) => {
    await openApp(page, '#/yol/mehmed-ii');
    await expect(page.getByTestId('card-mehmed-ii')).toBeVisible();
    const link = page.getByTestId('open-scene');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'sahne.html');
    await expect(link).toHaveAccessibleName(/sahne/i);

    await openApp(page, '#/yol/mehmed-iii');
    await expect(page.getByTestId('card-mehmed-iii')).toBeVisible();
    await expect(page.getByTestId('open-scene')).toHaveCount(0);
  });
});

test.describe('3D scene, golden images', () => {
  test.describe.configure({ timeout: 240_000 });

  // The accepted look of the scene, from fixed cameras at a fixed moment. A change in the picture fails the test;
  // an intended change is accepted by running the tests with --update-snapshots after looking at the new pictures.
  for (const shot of ['entrance', 'hearth', 'windows', 'portrait', 'briefing&step=4', 'briefing&step=4&script=latin']) {
    test(`looks as accepted from the camera "${shot}"`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'phone', 'The golden images are taken on the desktop viewport.');
      await openScene(page, `sahne.html?shot=${shot}`);
      await expect(page).toHaveScreenshot(`scene-${shot.replace(/\W+/g, '-')}.png`, { maxDiffPixelRatio: 0.03, animations: 'disabled' });
    });
  }
});
