import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const PASSWORD = 'Audit2026!';
const ACCOUNT_PATH = path.join(process.cwd(), 'test-results', 'dashboard-student-account.json');
let auditEmail: string | null = null;

async function registerAuditStudent(page: Page) {
  const email = `audit-ui-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test-nexus.dev`;

  await page.goto('/login?mode=register');
  await page.getByLabel('Prénom ou nom affiché').fill('Audit UI');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(PASSWORD);
  await page.getByLabel('Confirmer le mot de passe').fill(PASSWORD);
  await page.locator('label:has-text("J’accepte les") input[type="checkbox"]').check();
  await page.getByTestId('auth-submit').click();
  await page.waitForURL('**/onboarding');
  await page.goto('/dashboard');

  return { email };
}

async function loginAuditStudent(page: Page, email: string) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(PASSWORD);
  await page.getByTestId('auth-submit').click();
  await page.waitForURL(/\/(dashboard|onboarding)/);
  await page.goto('/dashboard');
}

async function loadStoredAuditEmail(): Promise<string | null> {
  try {
    const raw = await fs.readFile(ACCOUNT_PATH, 'utf8');
    const payload = JSON.parse(raw) as { email?: string };
    return payload.email ?? null;
  } catch {
    return null;
  }
}

async function persistAuditEmail(email: string) {
  await fs.mkdir(path.dirname(ACCOUNT_PATH), { recursive: true });
  await fs.writeFile(ACCOUNT_PATH, JSON.stringify({ email }), 'utf8');
}

async function ensureAuditSession(page: Page) {
  const storedEmail = auditEmail ?? await loadStoredAuditEmail();
  if (storedEmail) {
    auditEmail = storedEmail;
    await loginAuditStudent(page, storedEmail);
    return;
  }

  const account = await registerAuditStudent(page);
  auditEmail = account.email;
  await persistAuditEmail(account.email);
}

test.describe('dashboard eleve UI', () => {
  test('desktop puis mobile dark: pilotage clair, etats vides honnetes et nav mobile compacte', async ({ page }) => {
    await ensureAuditSession(page);

    await expect(page.getByText('Pilotage du jour')).toBeVisible();
    await expect(page.getByRole('heading', { name: /voilà la priorité qui doit faire bouger ta semaine/i })).toBeVisible();
    await expect(page.getByText('Ce que tu dois faire maintenant')).toBeVisible();
    await expect(page.getByText('Premier diagnostic à construire')).toBeVisible();
    await expect(page.getByText('Accès rapide', { exact: true })).toBeVisible();

    await page.screenshot({ path: test.info().outputPath('dashboard-student-desktop.png'), fullPage: true });

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');

    await expect(page.getByRole('button', { name: 'Plus d’actions' })).toBeVisible();
    await page.getByRole('button', { name: 'Plus d’actions' }).click();
    await expect(page.getByRole('link', { name: 'Parcours', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Profil', exact: true })).toBeVisible();
    await expect(page.getByText('Affichage')).toBeVisible();

    await page.screenshot({ path: test.info().outputPath('dashboard-student-mobile-dark.png') });
  });
});
