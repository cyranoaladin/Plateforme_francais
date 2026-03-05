import { defineConfig, devices } from '@playwright/test';

const e2ePort = Number(process.env.E2E_PORT ?? '3110');
const e2eBaseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;
const reuseExistingServer = process.env.E2E_REUSE_EXISTING_SERVER === '1';

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
      command: `sh -c "npx prisma migrate deploy && npm run db:seed && npm run build:ci && npm run start -- --hostname 127.0.0.1 --port ${e2ePort}"`,
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
