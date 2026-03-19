import { test as setup, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, '..', '.auth', 'visual-user.json');

setup('authenticate for visual tests', async ({ page }) => {
  const email = `visual.${Date.now()}.${Math.floor(Math.random() * 10000)}@eaf.local`;
  const password = 'ProTest2026!';

  await page.request.post('/api/v1/auth/register', {
    data: {
      email,
      password,
      displayName: 'Visual User',
      acceptedCgu: true,
      cguVersion: '2026-03',
    },
  });

  await page.goto('/dashboard');
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

  // Save storage state (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});
