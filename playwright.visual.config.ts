import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for visual regression tests only.
 *
 * Separated from the main e2e config to allow independent runs:
 *   npm run test:visual
 *   npm run test:visual:update
 */

const port = Number(process.env.E2E_PORT ?? '3110');
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2,
  retries: 0,
  timeout: 30_000,

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },

  use: {
    baseURL,
    // Deterministic viewport for stable screenshots
    viewport: { width: 1280, height: 720 },
    // Disable animations to reduce flakiness
    actionTimeout: 10_000,
  },

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run build:ci && npm run start -- --hostname 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
      },

  projects: [
    {
      name: 'visual-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
