import { type Page } from '@playwright/test';

/**
 * Comptes de test E2E - DOIVENT correspondre aux comptes créés par `npm run db:seed`
 * 
 * Seed créé dans scripts/seed.ts :
 * - Admin (admin@eaf.local)
 * - Camille Duval (eleve.free@eaf.local) — Plan FREE
 * - Lucas Martin (eleve.pro@eaf.local) — Plan PREMIUM  
 * - Emma Benali (eleve.masterium@eaf.local) — Plan PRO
 * - Jean Dupont (jean@eaf.local) — Legacy
 */
export const TEST_USERS = {
  // Rôles principaux
  admin: { email: 'admin@eaf.local', password: 'AdminTest2026!', role: 'admin' as const },
  eleveFree: { email: 'eleve.free@eaf.local', password: 'FreeTest2026!', role: 'eleve' as const },
  elevePremium: { email: 'eleve.pro@eaf.local', password: 'ProTest2026!', role: 'eleve' as const },
  eleveMasterium: { email: 'eleve.masterium@eaf.local', password: 'MasteriumTest2026!', role: 'eleve' as const },
  legacy: { email: 'jean@eaf.local', password: 'demo1234', role: 'eleve' as const },
};

export async function loginAs(page: Page, role: keyof typeof TEST_USERS) {
  const user = TEST_USERS[role];
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.locator('button[type="submit"]').click();
  // Wait until the browser actually leaves /login
  await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
  return user;
}
