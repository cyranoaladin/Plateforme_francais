import { defineConfig, devices } from '@playwright/test';

const e2ePort = Number(process.env.E2E_PORT ?? '3110');
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: e2eBaseUrl,
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
      command: `sh -c "npm run db:seed && npm run build:ci && npm run start -- --hostname 127.0.0.1 --port ${e2ePort}"`,
      url: e2eBaseUrl,
      reuseExistingServer: process.env.CI ? false : true,
      cwd: process.cwd(),
      timeout: 180000,
    },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
