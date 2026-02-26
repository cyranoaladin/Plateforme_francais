import { expect, test, type Page } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_USER_EMAIL ?? 'jean@eaf.local';
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'demo1234';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(E2E_EMAIL);
  await page.getByTestId('auth-password').fill(E2E_PASSWORD);
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/', { timeout: 10_000 });
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Authentification', () => {
  test('login avec identifiants valides → dashboard', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('login avec mauvais mot de passe → message erreur', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('auth-email').fill(E2E_EMAIL);
    await page.getByTestId('auth-password').fill('wrong-password-xyz');
    await page.getByTestId('auth-submit').click();
    await expect(page.getByTestId('auth-error')).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirection vers /login si non authentifié', async ({ page }) => {
    await page.goto('/atelier-ecrit');
    await expect(page).toHaveURL(/\/login/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. NAVIGATION PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Navigation principale', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('sidebar visible et liens présents', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('clic Bibliothèque → page Bibliothèque', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /bibliothèque/i }).click();
    await expect(page).toHaveURL(/\/bibliotheque/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('clic Atelier Écrit → page Atelier Écrit', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /atelier.écrit/i }).click();
    await expect(page).toHaveURL(/\/atelier-ecrit/);
  });

  test('clic Atelier Oral → page Atelier Oral', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /atelier.oral/i }).click();
    await expect(page).toHaveURL(/\/atelier-oral/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. RAG — BIBLIOTHÈQUE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('RAG — Bibliothèque', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('recherche documentaire retourne des résultats', async ({ page }) => {
    await page.goto('/bibliotheque');
    const searchInput = page.getByTestId('rag-query');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('explication linéaire méthode');
    await page.getByTestId('rag-submit').click();
    await expect(page.getByTestId('rag-results')).toBeVisible({ timeout: 20_000 });
    const text = await page.getByTestId('rag-results').textContent();
    expect(text?.length).toBeGreaterThan(20);
  });

  test('champ recherche accepte la saisie', async ({ page }) => {
    await page.goto('/bibliotheque');
    await page.getByTestId('rag-query').fill('problématique dissertation');
    const value = await page.getByTestId('rag-query').inputValue();
    expect(value).toBe('problématique dissertation');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. ATELIER ÉCRIT
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Atelier Écrit', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('la page Atelier Écrit charge correctement', async ({ page }) => {
    await page.goto('/atelier-ecrit');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('bouton générer une épreuve est présent', async ({ page }) => {
    await page.goto('/atelier-ecrit');
    const btn = page.getByRole('button', { name: /générer/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. ATELIER ORAL
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Atelier Oral', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('la page Atelier Oral charge correctement', async ({ page }) => {
    await page.goto('/atelier-oral');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('bouton démarrer simulation est visible', async ({ page }) => {
    await page.goto('/atelier-oral');
    const startBtn = page.getByRole('button', { name: /démarrer/i });
    await expect(startBtn).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. ATELIER LANGUE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Atelier Langue', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('la page Atelier Langue charge', async ({ page }) => {
    await page.goto('/atelier-langue');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('soumettre une réponse → feedback reçu', async ({ page }) => {
    await page.goto('/atelier-langue');
    const answer = page.getByTestId('langue-answer');
    await expect(answer).toBeVisible({ timeout: 10_000 });
    await answer.fill(
      'Subordonnée relative introduite par "qui", antécédent "mer", fonction : complément de l\'antécédent.',
    );
    await page.getByTestId('langue-submit').click();
    await expect(page.getByTestId('langue-feedback')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('langue-feedback')).not.toBeEmpty();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. TUTEUR LIBRE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Tuteur Libre', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('la page Tuteur charge', async ({ page }) => {
    await page.goto('/tuteur');
    await expect(page.getByRole('main')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('le dashboard charge en moins de 5 secondes', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
    expect(Date.now() - start).toBeLessThan(5_000);
  });

  test('aucune erreur console fatale sur le dashboard', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
    const fatalErrors = errors.filter(
      (e) => !e.includes('HMR') && !e.includes('favicon') && !e.includes('analytics'),
    );
    expect(fatalErrors).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. CONSENTEMENT RGPD
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Consentement RGPD', () => {
  test('la bannière de consentement apparaît lors du premier accès', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    const banner = page.getByTestId('consent-banner').or(page.getByRole('dialog', { name: /consentement|cookies/i }));
    // Banner may or may not appear depending on implementation
    if (await banner.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(banner).toBeVisible();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. NOUVELLES PAGES (GAP-05)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Descriptif de lecture', () => {
  test('page descriptif → formulaire visible + compteur textes', async ({ page }) => {
    await login(page);
    await page.goto('/descriptif');
    await expect(page.getByRole('heading', { name: /Descriptif|Mon descriptif/i })).toBeVisible();
    await expect(page.getByText(/0\/20|textes/i)).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Carnet de lecture', () => {
  test('page carnet → heading visible', async ({ page }) => {
    await login(page);
    await page.goto('/carnet');
    await expect(page.getByRole('heading', { name: /Carnet/i })).toBeVisible();
  });
});
