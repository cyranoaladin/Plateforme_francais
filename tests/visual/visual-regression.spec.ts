import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for key public surfaces.
 *
 * Usage:
 *   npx playwright test --config=playwright.visual.config.ts
 *
 * First run creates baseline screenshots under tests/visual/*.spec.ts-snapshots/.
 * Subsequent runs compare against them with a 1 % pixel tolerance.
 *
 * To update baselines after intentional UI changes:
 *   npx playwright test --config=playwright.visual.config.ts --update-snapshots
 */

const SCREENSHOT_OPTS = {
  fullPage: true,
  maxDiffPixelRatio: 0.01,
} as const;

const pages = [
  { name: 'landing', path: '/' },
  { name: 'pricing', path: '/pricing' },
  { name: 'login', path: '/login' },
  { name: 'contact', path: '/contact' },
  { name: 'mentions-legales', path: '/mentions-legales' },
  { name: 'cgu', path: '/cgu' },
] as const;

async function dismissConsent(page: import('@playwright/test').Page) {
  const consentBtn = page.locator('[data-testid="consent-accept"], button:has-text("Accepter")');
  if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await consentBtn.click();
    await page.waitForTimeout(500);
  }
}

// ── Light mode tests ─────────────────────────────────────────────────
for (const { name, path } of pages) {
  test(`visual: ${name} page`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    await dismissConsent(page);
    await expect(page).toHaveScreenshot(`${name}.png`, SCREENSHOT_OPTS);
  });
}

// ── Dark mode tests ──────────────────────────────────────────────────
// Each test injects the `.dark` class on `<html>` before capturing.
for (const { name, path } of pages) {
  test(`visual: ${name}-dark page`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    await dismissConsent(page);

    // Activate dark mode via the .dark class on <html>
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    // Allow CSS custom properties to propagate
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot(`${name}-dark.png`, SCREENSHOT_OPTS);
  });
}
