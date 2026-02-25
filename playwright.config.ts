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
  webServer: {
    command: `sh -c "npm run build:ci && npm run start -- --hostname 127.0.0.1 --port ${e2ePort}"`,
    url: e2eBaseUrl,
    reuseExistingServer: true,
    cwd: '/home/alaeddine/Documents/Plateforme_Francais/eaf_platform',
    timeout: 180000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
