import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

/** The service worker precaches files up to this size; the largest are the map data and the content database. */
const PRECACHE_MAX_FILE_BYTES = 8 * 1024 * 1024;
/** The map renderers are single large chunks loaded on demand; warn only above their size. */
const CHUNK_WARNING_LIMIT_KB = 1500;

const APP_NAME = 'History Journeys';
/** Dark stone of the interface; shown while the application starts. */
const APP_BACKGROUND_COLOR = '#1b1612';

export default defineConfig({
  // Relative base so the same build works on any static host and inside a Store package.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Everything the application needs offline, including the map data and the content database.
        globPatterns: ['**/*.{js,css,html,woff2,wasm,json,sqlite,png,svg,webp}'],
        maximumFileSizeToCacheInBytes: PRECACHE_MAX_FILE_BYTES,
      },
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        description: 'Tarihî figürler arasında harita ve kartlarla yolculuk.',
        lang: 'tr',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'any',
        background_color: APP_BACKGROUND_COLOR,
        theme_color: APP_BACKGROUND_COLOR,
        categories: ['games', 'education'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: { target: 'es2022', chunkSizeWarningLimit: CHUNK_WARNING_LIMIT_KB },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
