import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: BASE_URL,
  },
  // Starts DB + migrations + build + Next server automatically (and tears down on SIGTERM).
  webServer: {
    command: 'node scripts/pw_webserver_tunisia.mjs',
    url: `${BASE_URL}/api/health`,
    timeout: 180_000,
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
