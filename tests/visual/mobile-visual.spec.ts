import { test, expect } from '@playwright/test';

/**
 * Mobile visual regression tests for key pages (iPhone 14 viewport).
 *
 * Light mode only — dark mobile variants can be added in a future lot.
 *
 * Usage:
 *   npx playwright test --config=playwright.visual.config.ts --project=mobile-visual
 */

const SCREENSHOT_OPTS = {
  fullPage: true,
  maxDiffPixelRatio: 0.01,
} as const;

// ── Public pages (no auth) ──────────────────────────────────────────
const publicPages = [
  { name: 'landing', path: '/' },
  { name: 'pricing', path: '/pricing' },
  { name: 'login', path: '/login' },
  { name: 'contact', path: '/contact' },
] as const;

// ── Connected pages (auth via storageState) ─────────────────────────
const connectedPages = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'bibliotheque', path: '/bibliotheque' },
  { name: 'mon-parcours', path: '/mon-parcours' },
  { name: 'atelier-ecrit', path: '/atelier-ecrit' },
] as const;

async function dismissConsent(page: import('@playwright/test').Page) {
  const consentBtn = page.locator('[data-testid="consent-accept"], button:has-text("Accepter")');
  if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consentBtn.click();
    await page.waitForTimeout(500);
  }
}

async function waitForPageReady(page: import('@playwright/test').Page) {
  await page
    .locator('main, [role="main"], [data-testid="page-content"]')
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {
      // Fallback: some pages may not have <main>
    });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

// ── Public page tests (light mode, mobile) ──────────────────────────
for (const { name, path } of publicPages) {
  test(`mobile: ${name} page`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    await dismissConsent(page);
    await expect(page).toHaveScreenshot(`mobile-${name}.png`, SCREENSHOT_OPTS);
  });
}

// ── Connected page tests (light mode, mobile) ──────────────────────
for (const { name, path } of connectedPages) {
  test(`mobile: connected/${name} page`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    await dismissConsent(page);
    await waitForPageReady(page);
    await expect(page).toHaveScreenshot(`mobile-connected-${name}.png`, SCREENSHOT_OPTS);
  });
}
