/**
 * Saves a screenshot of the 3D scene for each fixed camera shot, for visual review.
 * Usage: tsx scripts/dev/shoot-scene.ts [--base http://localhost:5180] [--out tmp/screens/scene] [--size 1280x720] [--query only=figure] [shot ...]
 * The shot "game" opens the game itself instead of a fixed camera.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
function option(name: string, fallback: string): string {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = args[index + 1] ?? fallback;
  args.splice(index, 2);
  return value;
}

const base = option('base', 'http://localhost:5180');
const out = option('out', 'tmp/screens/scene');
const extra = option('query', '');
const [width, height] = option('size', '1280x720').split('x').map(Number);
const READY_TIMEOUT_MS = 45_000;
const GAME = 'game';

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let failed = false;
// Whatever happens, the browser is closed: a timeout must not leave a browser process behind.
try {
  const page = await browser.newPage({ viewport: { width: width ?? 1280, height: height ?? 720 } });
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') console.log(`[${message.type()}] ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    // A scene that throws never becomes ready; stop instead of waiting for the timeout.
    console.log(`[pageerror] ${error.stack ?? error.message}`);
    failed = true;
    void browser.close();
  });

  let shots = args;
  if (shots.length === 0) {
    await page.goto(`${base}/sahne.html?shot=list`);
    await page.waitForFunction(() => 'sceneShots' in window, undefined, { timeout: READY_TIMEOUT_MS });
    shots = await page.evaluate(() => (window as unknown as { sceneShots: string[] }).sceneShots);
  }
  for (const shot of shots) {
    const started = Date.now();
    // The name "game" is not a camera: it opens the game itself, with what is written over it.
    const query = [shot === GAME ? '' : `shot=${shot}`, extra].filter(Boolean).join('&');
    await page.goto(`${base}/sahne.html?${query}`);
    await page.waitForSelector('html[data-scene-ready="true"]', { timeout: READY_TIMEOUT_MS });
    await page.screenshot({ path: `${out}/${shot}.png` });
    const info = await page.evaluate(() => (window as unknown as { sceneInfo?: unknown }).sceneInfo);
    console.log(`${shot}: ${Date.now() - started} ms ${JSON.stringify(info)}`);
  }
} finally {
  await browser.close();
  if (failed) process.exitCode = 1;
}
