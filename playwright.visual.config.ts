import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

/**
 * Playwright configuration for visual regression tests only.
 *
 * Separated from the main e2e config to allow independent runs:
 *   npm run test:visual
 *   npm run test:visual:update
 *
 * Projects:
 *   - setup: authenticates and saves storageState for connected tests
 *   - public-visual: public pages (no auth needed)
 *   - connected-visual: authenticated pages (depends on setup)
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
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'public-visual',
      testMatch: /visual-regression\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'connected-visual',
      testMatch: /connected-visual\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, 'tests', '.auth', 'visual-user.json'),
      },
    },
    {
      name: 'mobile-visual',
      testMatch: /mobile-visual\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        storageState: path.join(__dirname, 'tests', '.auth', 'visual-user.json'),
      },
    },
  ],
});
