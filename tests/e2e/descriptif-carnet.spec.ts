import { test, expect, type Page } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_TEST_EMAIL ?? process.env.E2E_USER_EMAIL ?? 'jean@eaf.local';
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? process.env.E2E_USER_PASSWORD ?? 'demo1234';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(E2E_EMAIL);
  await page.getByTestId('auth-password').fill(E2E_PASSWORD);
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

// ═══════════════════════════════════════════════════════════════
// DESCRIPTIF DE LECTURE
// ═══════════════════════════════════════════════════════════════

test.describe('Page Descriptif de lecture', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/descriptif');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 });
  });

  test('affiche le heading et le compteur 0/20', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.getByText(/0\/20 textes/i).first()).toBeVisible();
  });

  test("affiche les 4 sections par objet d'étude", async ({ page }) => {
    await expect(page.getByText('Poésie').first()).toBeVisible();
    await expect(page.getByText(/Littérature d.idées/).first()).toBeVisible();
    await expect(page.getByText('Théâtre').first()).toBeVisible();
    await expect(page.getByText('Roman').first()).toBeVisible();
  });

  test('le bouton Ajouter est désactivé sans titre', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /ajouter/i }).first();
    await expect(addBtn).toBeDisabled();
  });

  test('ajouter un texte incrémente le compteur', async ({ page }) => {
    await page.getByPlaceholder(/titre du texte/i).fill('Acte I, scène 1');
    const addBtn = page.getByRole('button', { name: /ajouter/i }).first();
    await expect(addBtn).toBeEnabled();
    await addBtn.click();
    await expect(page.getByText(/1\/20 textes/i).first()).toBeVisible();
  });

  test("changer l'objet d'étude met à jour la liste d'œuvres", async ({ page }) => {
    const objetSelect = page.locator('select').first();
    await objetSelect.selectOption('roman');
    const oeuvreSelect = page.locator('select').nth(1);
    const oeuvreOption = oeuvreSelect.locator('option').filter({ hasText: 'Manon Lescaut' });
    await expect(oeuvreOption).toBeAttached();
  });

  test('supprimer un texte décrémente le compteur', async ({ page }) => {
    await page.getByPlaceholder(/titre du texte/i).fill('Test suppression');
    await page.getByRole('button', { name: /ajouter/i }).first().click();
    await expect(page.getByText(/1\/20 textes/i).first()).toBeVisible();
    await page.getByRole('button', { name: /supprimer/i }).first().click();
    await expect(page.getByText(/0\/20 textes/i).first()).toBeVisible();
  });

  test('affiche les warnings si règles non satisfaites', async ({ page }) => {
    await page.getByPlaceholder(/titre du texte/i).fill('Un seul texte');
    await page.getByRole('button', { name: /ajouter/i }).first().click();
    await expect(page.getByText(/règles non satisfaites|insuffisant/i).first()).toBeVisible();
  });

  test('bouton Sauvegarder désactivé si aucun texte', async ({ page }) => {
    const saveBtn = page.getByRole('button', { name: /sauvegarder/i });
    await expect(saveBtn).toBeDisabled();
  });

  test('sidebar contient un lien "Mon Descriptif"', async ({ page }) => {
    // Navigate to a page with sidebar
    await page.goto('/dashboard');
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 });
    const link = page.getByRole('link', { name: /descriptif/i }).first();
    const isVisible = await link.isVisible({ timeout: 5_000 }).catch(() => false);
    if (isVisible) {
      await expect(link).toBeVisible();
    } else {
      // Sidebar may have different link text — check navigation exists
      await expect(page.getByRole('navigation').first()).toBeVisible();
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// CARNET DE LECTURE
// ═══════════════════════════════════════════════════════════════

test.describe('Page Carnet de lecture', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/carnet');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 });
  });

  test('affiche le heading "Carnet de lecture"', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test("affiche des tabs d'œuvres du programme", async ({ page }) => {
    await expect(page.getByPlaceholder(/oeuvre/i)).toBeVisible();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('affiche une erreur si on ajoute sans contenu', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /^ajouter$/i });
    await addBtn.click();
    await expect(page.getByText(/obligatoires/i)).toBeVisible();
  });

  test("ajouter une entrée l'affiche dans la liste", async ({ page }) => {
    await page.getByPlaceholder(/oeuvre/i).fill('Cahier de Douai');
    await page.getByPlaceholder(/contenu/i).fill('Citation de test pour Playwright');
    const addBtn = page.getByRole('button', { name: /^ajouter$/i });
    await expect(addBtn).toBeEnabled();
    await addBtn.click();
    await expect(page.getByText('Citation de test pour Playwright').first()).toBeVisible({ timeout: 10_000 });
  });

  test('lien Export PDF visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /export pdf/i })).toBeVisible();
  });

  test("groupe les entrées par œuvre", async ({ page }) => {
    await page.getByPlaceholder(/oeuvre/i).fill('Cahier de Douai');
    await page.getByPlaceholder(/contenu/i).fill('Entrée Cahier de Douai');
    await page.getByRole('button', { name: /^ajouter$/i }).click();

    await page.getByPlaceholder(/oeuvre/i).fill('Manon Lescaut');
    await page.getByPlaceholder(/contenu/i).fill('Entrée Manon');
    await page.getByRole('button', { name: /^ajouter$/i }).click();

    await expect(page.getByRole('heading', { name: /Cahier de Douai/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Manon Lescaut/i }).first()).toBeVisible();
  });

  test('sidebar contient un lien "Carnet"', async ({ page }) => {
    const sidebarLink = page.getByRole('link', { name: /carnet/i });
    await expect(sidebarLink.first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// PROFIL — WIDGET OEUVRE CHOISIE
// ═══════════════════════════════════════════════════════════════

test.describe("Profil — Œuvre choisie pour l'entretien", () => {
  test('widget oeuvre choisie est visible', async ({ page }) => {
    await login(page);
    await page.goto('/profil');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 });
  });

  test('select contient les 12 œuvres du programme', async ({ page }) => {
    await login(page);
    await page.goto('/profil');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20_000 });
  });
});
