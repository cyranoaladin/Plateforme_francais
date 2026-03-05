import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(process.env.E2E_USER_EMAIL ?? 'jean@eaf.local');
  await page.getByTestId('auth-password').fill(process.env.E2E_USER_PASSWORD ?? 'demo1234');
  await page.getByTestId('auth-submit').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

test('Question légitime → réponse tuteur + citations éventuelles', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.goto('/tuteur');

  await page.getByRole('textbox').fill('Comment analyser une métaphore dans un poème de Rimbaud ?');
  await page.getByRole('button', { name: /envoyer|send/i }).click();

  const assistant = page.locator('[data-role="assistant"], .message-assistant').last();
  await expect(assistant).toBeVisible({ timeout: 30_000 });
  const text = await assistant.textContent();
  expect((text ?? '').length).toBeGreaterThan(20);
});
