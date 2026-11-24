/**
 * Development helper: opens a page of the running preview server in headless
 * Chromium, prints console messages and saves a screenshot.
 *
 * Usage: node scripts/dev/inspect.mjs <hash> <output.png> [width] [height] [waitMs]
 * The server address comes from the BASE_URL environment variable (default: the preview server).
 */
import { chromium } from '@playwright/test';

const [hash = '', output = 'tmp/screens/inspect.png', width = '1440', height = '900', waitMs = '2500'] =
  process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) }, locale: 'tr-TR' });
page.on('console', (message) => console.log(`[${message.type()}] ${message.text()}`));
page.on('pageerror', (error) => console.log(`[pageerror] ${error.stack}`));
page.on('requestfailed', (request) => console.log(`[requestfailed] ${request.url()}`));
const baseUrl = process.env.BASE_URL ?? 'http://localhost:4173';
try {
  await page.goto(`${baseUrl}/${hash}`);
  await page.waitForTimeout(Number(waitMs));
  await page.screenshot({ path: output });
} finally {
  await browser.close();
}
