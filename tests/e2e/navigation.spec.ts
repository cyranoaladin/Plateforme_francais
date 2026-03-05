import { test, expect, type Page } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_USER_EMAIL ?? 'jean@eaf.local';
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'demo1234';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(E2E_EMAIL);
  await page.getByTestId('auth-password').fill(E2E_PASSWORD);
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

test.describe('Navigation principale', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('tous les liens de la sidebar mènent à une page valide', async ({ page }) => {
    const routes = [
      '/',
      '/tuteur',
      '/atelier-oral',
      '/atelier-ecrit',
      '/mon-parcours',
      '/descriptif',
      '/carnet',
      '/profil',
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 });
      const title = await page.title();
      expect(title.toLowerCase()).not.toContain('404');
      expect(title.toLowerCase()).not.toContain('erreur');
    }
  });

  test('dashboard affiche le compte à rebours EAF', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/J-\d+ avant les épreuves du bac de français/i)).toBeVisible({ timeout: 10_000 });
  });

  test('les comptes à rebours affichent des valeurs positives en 2026', async ({ page }) => {
    await page.goto('/');
    const ecritEl = page.getByText(/J-\d+ avant les épreuves du bac de français/i).first();
    await expect(ecritEl).toBeVisible({ timeout: 10_000 });
    const ecritText = await ecritEl.textContent();
    const match = ecritText?.match(/J-(\d+)/);
    expect(match).toBeTruthy();
    const joursRestants = parseInt(match![1], 10);
    expect(joursRestants).toBeGreaterThan(0);
    expect(joursRestants).toBeLessThan(500);
  });

  test('aucune page ne génère d\'erreur runtime fatale', async ({ page }) => {
    const criticalRoutes = ['/', '/tuteur', '/atelier-oral', '/descriptif', '/carnet', '/profil'];
    for (const route of criticalRoutes) {
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(`[${route}] ${err.message}`));
      await page.goto(route);
      await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 });
      expect(pageErrors, `Erreurs runtime sur ${route}: ${pageErrors.join(', ')}`).toHaveLength(0);
    }
  });
});

test.describe('Tuteur IA — interactions', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('envoyer un message reçoit une réponse IA sans URL', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/tuteur');
    const input = page.getByRole('textbox');
    await input.fill("Qu'est-ce qu'une subordonnée relative ?");
    await page.locator('form button[type="submit"]').click();

    await page.waitForTimeout(2_000);
    const messages = page.locator('[role="status"]');
    await expect(messages.last()).toBeVisible({ timeout: 30_000 });

    const text = await messages.last().textContent();
    expect(text).not.toMatch(/https?:\/\//);
    expect(text?.length).toBeGreaterThan(20);
  });

  test('la réponse du tuteur contient une référence aux œuvres du programme', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/tuteur');
    await page.getByRole('textbox').fill('Parlez-moi de Rimbaud et du Cahier de Douai.');
    await page.locator('form button[type="submit"]').click();

    const messages = page.locator('[role="status"]');
    await expect(messages.last()).toBeVisible({ timeout: 30_000 });
    const text = await messages.last().textContent();
    expect((text ?? '').length).toBeGreaterThan(20);
    expect(text).not.toMatch(/https?:\/\//);
  });
});
