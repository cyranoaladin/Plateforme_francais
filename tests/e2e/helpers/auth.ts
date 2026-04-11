import { type Page } from '@playwright/test';

export const TEST_USERS = {
  eleve: { email: 'test-eleve@nexus-eaf.local', password: 'NexusTest2026!', role: 'eleve' as const },
  enseignant: { email: 'test-enseignant@nexus-eaf.local', password: 'NexusTest2026!', role: 'enseignant' as const },
  parent: { email: 'test-parent@nexus-eaf.local', password: 'NexusTest2026!', role: 'parent' as const },
};

export async function loginAs(page: Page, role: keyof typeof TEST_USERS) {
  const user = TEST_USERS[role];
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.locator('button[type="submit"]').click();
  // Wait until the browser actually leaves /login (the old regex matched :// in the base URL
  // and returned immediately even when login failed — causing 401s on subsequent requests).
  await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
  return user;
}
