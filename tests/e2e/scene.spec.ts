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

interface SpokenLine {
  text: string;
  voice: string;
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
}

/**
 * Replaces the voice of the device with one that writes down what it is asked to say. The test browser has no
 * Turkish voice, and a test cannot listen; what was said, by which voice and how, can be read afterwards.
 */
async function listenToTheDevice(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const heard = { spoken: [] as unknown[], cancels: 0 };
    const voices = [
      { name: 'Microsoft Emel Online (Natural) - Turkish (Türkiye)', lang: 'tr-TR' },
      { name: 'Microsoft Ahmet Online (Natural) - Turkish (Türkiye)', lang: 'tr-TR' },
      { name: 'Microsoft David - English (United States)', lang: 'en-US' },
    ];
    class Utterance {
      voice: { name: string } | null = null;
      lang = '';
      rate = 1;
      pitch = 1;
      volume = 1;
      constructor(public text: string) {}
    }
    const synthesis = {
      getVoices: () => voices,
      speak: (line: Utterance) => heard.spoken.push({ text: line.text, voice: line.voice?.name ?? '', lang: line.lang, rate: line.rate, pitch: line.pitch, volume: line.volume }),
      cancel: () => {
        heard.cancels += 1;
      },
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synthesis, configurable: true });
    Object.assign(window, { SpeechSynthesisUtterance: Utterance, heardFromTheDevice: heard });
  });
}

function spoken(page: Page): Promise<SpokenLine[]> {
  return page.evaluate(() => (window as unknown as { heardFromTheDevice: { spoken: SpokenLine[] } }).heardFromTheDevice.spoken);
}

function cancels(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { heardFromTheDevice: { cancels: number } }).heardFromTheDevice.cancels);
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
    await listenToTheDevice(page);
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

    // He says it too: sentence by sentence, in a Turkish man's voice, a little slow and low.
    await expect.poll(() => spoken(page).then((lines) => lines.length)).toBeGreaterThan(1);
    const first = await spoken(page);
    expect(first[0]?.text).toBe('Şehir karadan sarılsa bile denizden beslenirdi.');
    expect(first.every((line) => line.voice.includes('Ahmet') && line.lang === 'tr-TR')).toBe(true);
    expect(first[0]?.rate).toBeLessThan(1);
    // Lower than the voice's own pitch by a good deal, but not at the bottom of what a voice can do.
    expect(first[0]?.pitch).toBeLessThanOrEqual(0.65);
    expect(first[0]?.pitch).toBeGreaterThanOrEqual(0.4);
    // At the levels the scene opens with: voices at full, everything at four fifths.
    expect(first[0]?.volume).toBeCloseTo(0.8, 5);
    await expect(page.getByTestId('voice-note')).toBeHidden();

    // A new step cuts off the old one and is spoken in its place.
    const cancelsBefore = await cancels(page);
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('briefing-counter')).toContainText('2 / 6');
    expect(await cancels(page)).toBeGreaterThan(cancelsBefore);
    expect((await spoken(page)).at(first.length)?.text).toContain('Kara surları');

    // With the sound off nothing is spoken; the words stay on the panel.
    await page.keyboard.press('KeyM');
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('data-muted', 'true');
    const whileMuted = (await spoken(page)).length;
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByTestId('briefing-counter')).toContainText('1 / 6');
    await expect(page.getByTestId('briefing-text')).toContainText('Rumeli Hisarı');
    expect((await spoken(page)).length).toBe(whileMuted);
    await page.keyboard.press('KeyM');
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('data-muted', 'false');

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

    // After the last step the briefing ends, he falls silent and the player stands where he stood.
    const cancelsAtEnd = await cancels(page);
    await page.getByTestId('briefing-next').click();
    await expect(panel).toBeHidden();
    expect(await cancels(page)).toBeGreaterThan(cancelsAtEnd);
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

  test('has a sound switch that is remembered', async ({ page }) => {
    await openScene(page, GAME_URL);
    const toggle = page.getByTestId('sound-toggle');
    await expect(toggle).toHaveAttribute('data-muted', 'false');
    await expect(toggle).toContainText('açık');
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-muted', 'true');
    await expect(toggle).toContainText('kapalı');

    await openScene(page, GAME_URL);
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('data-muted', 'true');
    await page.keyboard.press('KeyM');
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('data-muted', 'false');
  });

  test('has separate levels for everything, for voices and for the room, and remembers them', async ({ page }) => {
    await openScene(page, GAME_URL);
    const panel = page.getByTestId('sound-panel');
    await expect(panel).toBeHidden();
    await page.getByTestId('sound-levels-toggle').click();
    await expect(panel).toBeVisible();
    await expect(page.getByTestId('volume-name-master')).toHaveText('Ana ses');
    await expect(page.getByTestId('volume-name-voice')).toHaveText('Konuşma');
    await expect(page.getByTestId('volume-name-ambience')).toHaveText('Ortam');
    await expect(page.getByTestId('volume-name-effects')).toHaveText('Arayüz');
    // The room opens quieter than the voices.
    await expect(page.getByTestId('volume-value-voice')).toHaveText('%100');
    await expect(page.getByTestId('volume-value-ambience')).toHaveText('%50');

    await page.getByTestId('volume-ambience').fill('20');
    await page.getByTestId('volume-master').fill('60');
    await expect(page.getByTestId('volume-value-ambience')).toHaveText('%20');
    await expect(page.getByTestId('volume-value-master')).toHaveText('%60');
    // One level does not move another.
    await expect(page.getByTestId('volume-value-voice')).toHaveText('%100');

    await openScene(page, GAME_URL);
    await page.getByTestId('sound-levels-toggle').click();
    await expect(page.getByTestId('volume-ambience')).toHaveValue('20');
    await expect(page.getByTestId('volume-master')).toHaveValue('60');
    await expect(page.getByTestId('volume-voice')).toHaveValue('100');
  });

  test('makes a sound of the room that is neither silent, nor clipped, nor harsh', async ({ page }) => {
    await openScene(page, GAME_URL);
    const level = await page.evaluate(() =>
      (window as unknown as { measureSceneAmbience: (seconds: number) => Promise<{ peak: number; rms: number; brightness: number }> }).measureSceneAmbience(12),
    );
    // Heard at full level: clearly there, with room to spare below the loudest a speaker can play.
    expect(level.rms).toBeGreaterThan(0.02);
    expect(level.rms).toBeLessThan(0.4);
    expect(level.peak).toBeLessThan(0.95);
    // A fire is a low sound. Bright bursts of noise ring like struck metal; almost none of the energy may lie
    // above 2 kHz.
    expect(level.brightness).toBeLessThan(0.02);
  });

  test('the marker of the chosen figure says who he was and when, and offers a visit to his room', async ({ page }) => {
    await openApp(page, '#/yol/mehmed-ii');
    const marker = page.locator('.map-figure[data-slug="mehmed-ii"]');
    await expect(marker).toHaveAttribute('data-focused', 'true');
    const details = marker.locator('.map-figure__detail');
    await expect(details.nth(0)).toBeVisible();
    await expect(details.nth(0)).toContainText('7. Osmanlı padişahı');
    await expect(details.nth(1)).toContainText('1432–1481');
    // The same two lines as under the name on the card.
    await expect(details.nth(0)).toHaveText((await page.locator('.card__roles').first().textContent()) ?? '');
    await expect(details.nth(1)).toHaveText((await page.locator('.card__years').first().textContent()) ?? '');

    const visit = marker.getByTestId('visit-scene');
    await expect(visit).toBeVisible();
    await expect(visit).toHaveText(/ziyaret et/i);
    await expect(visit).toHaveAttribute('href', 'sahne.html');
    await visit.click();
    await expect(page).toHaveURL(/sahne\.html/);
  });

  test('a figure without a room is not offered a visit, and a figure that is not chosen shows only his name', async ({ page }) => {
    await openApp(page, '#/yol/mehmed-iii');
    const marker = page.locator('.map-figure[data-slug="mehmed-iii"]');
    await expect(marker).toHaveAttribute('data-focused', 'true');
    await expect(marker.locator('.map-figure__detail').first()).toBeVisible();
    await expect(marker.getByTestId('visit-scene')).toHaveCount(0);
    const others = page.locator('.map-figure[data-focused="false"] .map-figure__detail');
    for (const detail of await others.all()) await expect(detail).toBeHidden();
  });

  test('the map has a sound switch, and the room follows it', async ({ page }) => {
    await openApp(page, '#/yol/mehmed-ii');
    const toggle = page.getByTestId('sound-toggle');
    await expect(toggle).toHaveAttribute('data-muted', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-muted', 'true');
    await expect(toggle).toHaveAccessibleName('Sesi aç');

    await openScene(page, GAME_URL);
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('data-muted', 'true');
    await page.getByTestId('sound-toggle').click();

    await openApp(page, '#/yol/mehmed-ii');
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('data-muted', 'false');
  });

  test('the way back to the map is offered at the door, not where the player comes in', async ({ page }, testInfo) => {
    test.setTimeout(WALK_TIMEOUT * 2);
    test.skip(testInfo.project.name === 'phone', 'Walking with the keyboard is a desktop control.');
    await openScene(page, GAME_URL);
    const leave = page.getByTestId('scene-leave');
    await expect(leave).toBeHidden();
    const start = await sceneInfo(page);

    await page.keyboard.down('KeyS');
    await expect(leave).toBeVisible({ timeout: WALK_TIMEOUT });
    await page.keyboard.up('KeyS');
    expect((await sceneInfo(page)).player.z).toBeGreaterThan(start.player.z);
    await expect(leave).toHaveText(/haritaya dön/i);
    await expect(leave).toHaveAttribute('href', './#/yol/mehmed-ii');

    // Back into the room, the offer goes.
    await page.keyboard.down('KeyW');
    await expect(leave).toBeHidden({ timeout: WALK_TIMEOUT });
    await page.keyboard.up('KeyW');
  });

  test('makes the sounds of the interface: a short tap and a rustle of parchment, neither silent nor clipped', async ({ page }) => {
    await openScene(page, GAME_URL);
    const measure = (sound: string): Promise<{ peak: number; rms: number; seconds: number }> =>
      page.evaluate((name) => (window as unknown as { measureUiSound: (sound: string) => Promise<{ peak: number; rms: number; seconds: number }> }).measureUiSound(name), sound);
    const click = await measure('click');
    expect(click.peak).toBeGreaterThan(0.05);
    expect(click.peak).toBeLessThan(0.95);
    expect(click.seconds).toBeLessThan(0.15);
    const parchment = await measure('parchment');
    expect(parchment.peak).toBeGreaterThan(0.02);
    expect(parchment.peak).toBeLessThan(0.95);
    expect(parchment.seconds).toBeGreaterThan(click.seconds);
    expect(parchment.seconds).toBeLessThan(0.6);
    // The rustle is a background to the tap, not louder than it.
    expect(parchment.peak).toBeLessThan(click.peak);
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
    for (const id of ['scene-title', 'scene-place', 'scene-hint', 'scene-back', 'scene-credits-summary', 'script-toggle', 'sound-toggle', 'sound-levels-toggle']) {
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
