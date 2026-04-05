import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PUBLIC_PAGES = ['/', '/connexion', '/inscription', '/pricing'];

for (const path of PUBLIC_PAGES) {
  test(`a11y: ${path} — 0 violation critique`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log(`Violations sur ${path}:`);
      results.violations.forEach((v) => {
        console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
      });
    }

    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical, `Violations critiques sur ${path}`).toHaveLength(0);
  });
}
