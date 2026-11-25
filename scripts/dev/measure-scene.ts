/**
 * Measures how long the 3D scene takes to draw a frame, on the graphics card of this machine, for several
 * variants of the page. Used to find what costs time before changing anything.
 * The browser keeps its frame limit, so a scene that is fast enough shows the refresh rate of the screen.
 * Usage: tsx scripts/dev/measure-scene.ts [--base http://localhost:5180] [--size 1920x1080] [query ...]
 * Each query is what follows "sahne.html?"; with none given, a standard set is measured.
 */
import { chromium, type Page } from '@playwright/test';

const args = process.argv.slice(2);
function option(name: string, fallback: string): string {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = args[index + 1] ?? fallback;
  args.splice(index, 2);
  return value;
}

const base = option('base', 'http://localhost:5180');
const [width, height] = option('size', '1920x1080').split('x').map(Number);
const queries = args.length > 0 ? args : ['', 'q=low', 'only=room', 'only=figure'];
const READY_TIMEOUT_MS = 120_000;
const FRAMES = 120;
/** How long the player walks from the door to reach the table, and how long the camera takes to settle there. */
const WALK_MS = 4000;
const BRIEFING_SETTLE_MS = 2500;

interface Measurement {
  /** Mean, median and slowest time between two frames, in milliseconds. */
  mean: number;
  median: number;
  slowest: number;
  info: unknown;
  renderer: string;
}

/** Times the frames of the page as it is now. */
async function measure(page: Page): Promise<Measurement> {
  // Given as text: the script runner would otherwise wrap the functions in helpers the page does not have.
  return (await page.evaluate(`new Promise((resolve) => {
      const times = [];
      let last = performance.now();
      function tick() {
        const now = performance.now();
        times.push(now - last);
        last = now;
        if (times.length < ${FRAMES}) return requestAnimationFrame(tick);
        const sorted = [...times].sort((a, b) => a - b);
        const probe = document.createElement('canvas').getContext('webgl2');
        const extension = probe && probe.getExtension('WEBGL_debug_renderer_info');
        resolve({
          mean: times.reduce((sum, time) => sum + time, 0) / times.length,
          median: sorted[Math.floor(sorted.length / 2)],
          slowest: sorted[sorted.length - 1],
          info: window.sceneInfo,
          renderer: extension ? String(probe.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : 'unknown',
        });
      }
      requestAnimationFrame(tick);
    })`)) as Measurement;
}

function report(label: string, result: Measurement): void {
  // The mean is what the player gets: a few very slow frames among many fast ones still make a slow game.
  const fps = result.mean > 0 ? (1000 / result.mean).toFixed(0) : '?';
  console.log(`${label.padEnd(30)} ${fps} fps (mean ${result.mean.toFixed(1)} ms, median ${result.median.toFixed(1)} ms, slowest ${result.slowest.toFixed(0)} ms)  ${JSON.stringify(result.info)}`);
}

// The real graphics card, not the software renderer the tests use: this measures what a player gets.
const browser = await chromium.launch({ headless: false, args: ['--ignore-gpu-blocklist'] });
let renderer = 'unknown';
try {
  const page = await browser.newPage({ viewport: { width: width ?? 1920, height: height ?? 1080 } });
  for (const query of queries) {
    await page.goto(`${base}/sahne.html?${query}`);
    await page.waitForSelector('html[data-scene-ready="true"]', { timeout: READY_TIMEOUT_MS });
    const first = await measure(page);
    report(query || '(game, at the door)', first);
    if (query.includes('only=') || query.includes('shot=')) continue;
    // The costly places: close to the figure, whose hair then fills much of the screen, and the briefing.
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(WALK_MS);
    await page.keyboard.up('KeyW');
    report('  at the table', await measure(page));
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(BRIEFING_SETTLE_MS);
    report('  during the briefing', await measure(page));
    renderer = first.renderer;
  }
  console.log(`Graphics: ${renderer}`);
} finally {
  await browser.close();
}
