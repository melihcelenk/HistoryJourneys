import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * End-to-end tests run against the production build, on a desktop and a phone
 * viewport. Tests save screenshots to tmp/screens for visual review.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'tmp/test-results',
  fullyParallel: true,
  // The map renders with software WebGL in headless Chromium; too many browsers at once starve each other.
  workers: 3,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'tr-TR',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // `npm run test:e2e` builds first; the server only serves the dist folder.
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
