import { readFileSync } from 'node:fs';
import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { JOURNEY_GROUP_SIZE } from '../../src/domain/journey';

/** What the tests read of a figure in the content, so that they follow the content instead of repeating it. */
export interface FigureContent {
  birth: { year: number };
  death: { year: number };
  journey: { from: number; event: string }[];
}

/** A figure as it is in the content. */
export function figureContent(slug: string): FigureContent {
  return JSON.parse(readFileSync(`content/figures/${slug}.json`, 'utf8')) as FigureContent;
}

/** A numbered stop of a journey that is on the map (as opposed to the place of a figure). */
export const JOURNEY_STOP = '.map-stop[data-kind="journey"]';
/** The pin of the journey stop the figure is at. */
export const CURRENT_JOURNEY_PIN = `${JOURNEY_STOP}[data-current="true"] .map-stop__pin`;

/** How many stops of a journey are on the map: one group at a time. */
export function shownStopCount(slug: string): number {
  return Math.min(figureContent(slug).journey.length, JOURNEY_GROUP_SIZE);
}

/** How often waitUntilStill samples the position of an element. */
const STILLNESS_SAMPLE_MS = 250;

/** Whether the test runs on the wide viewport; the name comes from playwright.config.ts. */
export function isDesktop(testInfo: TestInfo): boolean {
  return testInfo.project.name === 'desktop';
}

/** Time for the map camera and card transitions to come to rest before a screenshot. */
const SETTLE_MS = 900;

/** Saves a screenshot under tmp/screens, named after the project, for visual review. */
export async function snap(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  // Let fonts, the map and transitions settle so that screenshots are comparable.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(SETTLE_MS);
  await page.screenshot({ path: `tmp/screens/${testInfo.project.name}-${name}.png` });
}

/** Waits until an element has stopped moving, for example a map marker while the camera flies. */
export async function waitUntilStill(locator: Locator): Promise<{ x: number; y: number }> {
  let previous = await locator.boundingBox();
  await expect(async () => {
    await locator.page().waitForTimeout(STILLNESS_SAMPLE_MS);
    const current = await locator.boundingBox();
    const still = current !== null && previous !== null && current.x === previous.x && current.y === previous.y;
    previous = current;
    expect(still).toBe(true);
  }).toPass();
  return { x: previous?.x ?? 0, y: previous?.y ?? 0 };
}

/** Opens the application and waits until the content and the map are ready. */
export async function openApp(page: Page, hash = ''): Promise<void> {
  await page.goto(`/${hash}`);
  await expect(page.getByTestId('map-stage')).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
}

/** Starts the journey from Atatürk back to Mehmed II through the start screen. */
export async function startMainJourney(page: Page): Promise<void> {
  await openApp(page);
  await page.getByRole('button', { name: /Mustafa Kemal Atatürk → / }).click();
  await expect(page.getByTestId('route-chain')).toBeVisible();
}

export const MAIN_JOURNEY_HASH = '#/yol/ataturk/mehmed-ii';
