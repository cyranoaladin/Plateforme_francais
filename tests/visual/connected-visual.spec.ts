import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for authenticated (connected) pages.
 *
 * These tests are currently skipped because they require an authenticated
 * session. Once auth fixtures are available (e.g. via storageState or a
 * login helper), remove the `test.skip` calls to enable them.
 *
 * To add auth support later:
 *   1. Create a `tests/visual/auth.setup.ts` that logs in and saves
 *      storageState to a file.
 *   2. Add a `setup` project in playwright.visual.config.ts that runs
 *      auth.setup.ts before this file.
 *   3. Use `test.use({ storageState: '...' })` in this file.
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
  { name: 'bibliotheque', path: '/bibliotheque' },
  { name: 'mon-parcours', path: '/mon-parcours' },
  { name: 'quiz', path: '/quiz' },
  { name: 'profil', path: '/profil' },
  { name: 'carnet', path: '/carnet' },
] as const;

async function dismissConsent(page: import('@playwright/test').Page) {
  const consentBtn = page.locator('[data-testid="consent-accept"], button:has-text("Accepter")');
  if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consentBtn.click();
    await page.waitForTimeout(500);
  }
}

// ── Connected page tests (light mode) ────────────────────────────────
// Skipped: requires authenticated session (storageState / auth fixture).
for (const { name, path } of connectedPages) {
  test.skip(`visual: connected/${name} page`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    await dismissConsent(page);
    await expect(page).toHaveScreenshot(`connected-${name}.png`, SCREENSHOT_OPTS);
  });
}

// ── Connected page tests (dark mode) ─────────────────────────────────
// Skipped: requires authenticated session (storageState / auth fixture).
for (const { name, path } of connectedPages) {
  test.skip(`visual: connected/${name}-dark page`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    await dismissConsent(page);

    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot(`connected-${name}-dark.png`, SCREENSHOT_OPTS);
  });
}
