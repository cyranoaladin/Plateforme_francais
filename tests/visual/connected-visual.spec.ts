import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for authenticated (connected) pages.
 *
 * These tests run after auth.setup.ts authenticates and saves storageState.
 * The `connected-visual` project in playwright.visual.config.ts injects the
 * saved cookies/localStorage automatically.
 *
 * Usage:
 *   npx playwright test --config=playwright.visual.config.ts
 */

const SCREENSHOT_OPTS = {
  fullPage: true,
  maxDiffPixelRatio: 0.01,
} as const;

const connectedPages = [
  { name: 'dashboard', path: '/dashboard' },
  // bibliotheque excluded: page renders dynamic search results that cause
  // unstable screenshots between consecutive captures (content shifts).
  // { name: 'bibliotheque', path: '/bibliotheque' },
  { name: 'mon-parcours', path: '/mon-parcours' },
  { name: 'quiz', path: '/quiz' },
  { name: 'profil', path: '/profil' },
  { name: 'carnet', path: '/carnet' },
  { name: 'atelier-ecrit', path: '/atelier-ecrit' },
] as const;

async function dismissConsent(page: import('@playwright/test').Page) {
  const consentBtn = page.locator('[data-testid="consent-accept"], button:has-text("Accepter")');
  if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consentBtn.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Wait for the page to be fully loaded: network idle + main content visible.
 */
async function waitForPageReady(page: import('@playwright/test').Page) {
  // Wait for at least one <main> or primary content container to appear
  await page
    .locator('main, [role="main"], [data-testid="page-content"]')
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {
      // Fallback: some pages may not have <main>, just wait for body content
    });
  // Extra stabilisation for lazy-loaded components / animations
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);
}

// ── Connected page tests (light mode) ────────────────────────────────
for (const { name, path } of connectedPages) {
  test(`visual: connected/${name} page`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'load' });
    await dismissConsent(page);
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot(`connected-${name}.png`, SCREENSHOT_OPTS);
  });
}

// ── Connected page tests (dark mode) ─────────────────────────────────
for (const { name, path } of connectedPages) {
  test(`visual: connected/${name}-dark page`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'load' });
    await dismissConsent(page);
    await waitForPageReady(page);

    // Activate dark mode via the .dark class on <html>
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    // Allow CSS custom properties to propagate
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot(`connected-${name}-dark.png`, SCREENSHOT_OPTS);
  });
}
