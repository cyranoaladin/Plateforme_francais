import { defineConfig, devices } from '@playwright/test';

const e2ePort = Number(process.env.E2E_PORT ?? '3110');
const e2eBaseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;
const reuseExistingServer = process.env.E2E_REUSE_EXISTING_SERVER === '1';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: process.env.CI ? 1 : 2,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  use: {
    baseURL: e2eBaseUrl,
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
      command: `sh -c "E2E_DISABLE_RATE_LIMIT=1 npx prisma db push --accept-data-loss && E2E_DISABLE_RATE_LIMIT=1 npm run db:seed && E2E_DISABLE_RATE_LIMIT=1 npm run build:ci && E2E_DISABLE_RATE_LIMIT=1 npm run start -- --hostname 127.0.0.1 --port ${e2ePort}"`,
      url: e2eBaseUrl,
      reuseExistingServer,
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
