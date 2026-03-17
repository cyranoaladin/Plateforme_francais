import { test as setup, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, '..', '.auth', 'visual-user.json');

setup('authenticate for visual tests', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill login form using test IDs from the login page
  await page.getByTestId('auth-email').fill('eleve.pro@eaf.local');
  await page.getByTestId('auth-password').fill('ProTest2026!');
  await page.getByTestId('auth-submit').click();

  // Wait for redirect away from login
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

  // Save storage state (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});
