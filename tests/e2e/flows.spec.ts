import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email = 'jean@eaf.local', password = 'demo1234') {
  await page.goto('/login');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/');
}

async function registerAndLogin(page: Page) {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 10000)}@eaf.local`;
  const password = 'demo1234';

  await page.goto('/login');
  await page.getByRole('button', { name: 'Inscription' }).click();
  await page.getByLabel('Nom affiché').fill('E2E Eleve');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL('/');

  return { email, password };
}

async function csrfToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    const value = document.cookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('eaf_csrf='));
    return value ? decodeURIComponent(value.slice('eaf_csrf='.length)) : '';
  });
}

test('upload copie puis polling jusqu au statut done', async ({ page }) => {
  await login(page);
  await page.goto('/atelier-ecrit');

  await page.getByRole('button', { name: 'Générer mon sujet' }).click();
  await expect(page.getByText('Déposer ma copie')).toBeVisible();

  const fixturePath = `${process.cwd()}/tests/fixtures/copie-test.png`;
  await page.locator('input[type="file"]').first().setInputFiles(fixturePath);

  await page.getByRole('button', { name: 'Lancer la correction IA' }).click();
  await expect(page.getByText(/Correction en cours par l'IA/)).toBeVisible({ timeout: 10000 });

  await expect(page.getByRole('link', { name: 'Voir mon rapport de correction' })).toBeVisible({ timeout: 90000 });
  await page.getByRole('link', { name: 'Voir mon rapport de correction' }).click();
  await expect(page.getByRole('heading', { name: 'Rapport de correction' })).toBeVisible();
});

test('parcours onboarding puis quiz puis oral simulé', async ({ page }) => {
  test.setTimeout(90000);
  await registerAndLogin(page);

  await page.goto('/onboarding');
  await page.getByPlaceholder('Prénom et nom').fill('E2E Eleve');
  await page.locator('input[placeholder=\"Classe\"]').fill('Première générale');

  const eafDate = new Date();
  eafDate.setDate(eafDate.getDate() + 60);
  const eafDateStr = eafDate.toISOString().slice(0, 10);
  await page.locator('input[type="date"]').fill(eafDateStr);

  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.locator('label').filter({ hasText: 'Le Mariage forcé' }).first().click();
  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.getByRole('button', { name: 'Terminer' }).click();

  await expect(page).toHaveURL('/', { timeout: 10000 });
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();

  await page.goto('/quiz');
  await page.getByRole('button', { name: 'Générer' }).click();
  await expect(page.locator('input[type="radio"]').first()).toBeVisible();

  const radios = page.locator('input[type="radio"]');
  const radioCount = await radios.count();
  for (let i = 0; i < radioCount; i += 4) {
    await radios.nth(i).check();
  }

  await page.getByRole('button', { name: 'Valider' }).click();
  await expect(page.getByText(/Score:\s*\d+%/)).toBeVisible();

  await page.goto('/atelier-oral');
  await expect(page.getByRole('heading', { name: 'Atelier Oral IA' })).toBeVisible();

  const token = await csrfToken(page);
  const started = await page.evaluate(async (csrf) => {
    const response = await fetch('/api/v1/oral/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
      },
      body: JSON.stringify({ oeuvre: 'Le Mariage forcé' }),
    });

    if (!response.ok) {
      return { error: `start oral failed: ${response.status} ${await response.text()}` };
    }

    const payload = (await response.json()) as { sessionId: string };
    return payload;
  }, token);

  if ('error' in started) {
    throw new Error(started.error);
  }

  const steps = ['LECTURE', 'EXPLICATION', 'GRAMMAIRE', 'ENTRETIEN'] as const;
  for (const step of steps) {
    const interaction = await page.evaluate(async ({ sessionId, csrf, currentStep }) => {
      const response = await fetch(`/api/v1/oral/session/${sessionId}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf,
        },
        body: JSON.stringify({
          step: currentStep,
          transcript: `Réponse API test pour ${currentStep}.`,
          duration: 45,
        }),
      });

      if (!response.ok) {
        return { error: `interact oral failed: ${response.status} ${await response.text()}` };
      }

      return { ok: true };
    }, { sessionId: started.sessionId, csrf: token, currentStep: step });

    if ('error' in interaction) {
      throw new Error(interaction.error);
    }
  }

  const ended = await page.evaluate(async ({ sessionId, csrf }) => {
    const response = await fetch(`/api/v1/oral/session/${sessionId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return { error: `end oral failed: ${response.status} ${await response.text()}` };
    }

    return (await response.json()) as { note: number };
  }, { sessionId: started.sessionId, csrf: token });

  if ('error' in ended) {
    throw new Error(ended.error);
  }

  expect(typeof ended.note).toBe('number');
});

// ═══════════════════════════════════════════════════════════════════════════
// GAP-05 — Critical E2E tests
// ═══════════════════════════════════════════════════════════════════════════

test('login → dashboard affiche compte à rebours EAF', async ({ page }) => {
  await login(page);
  await page.goto('/');
  await expect(page.getByText(/J-\d+ avant l.écrit/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/J-\d+ avant les oraux/)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('text=/\\/20/').first()).toBeVisible({ timeout: 10_000 });
});

test('démarrer session orale → tirage affiche un extrait et le chrono de 30 min', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.goto('/atelier-oral');

  const oeuvreSelect = page.locator('select').first();
  await oeuvreSelect.selectOption({ index: 1 });

  await page.getByTestId('start-session-btn').click();

  await expect(
    page.getByTestId('extrait-texte').or(page.locator('[aria-label="Extrait"]')),
  ).toBeVisible({ timeout: 20_000 });

  await expect(
    page.getByText(/30:00|29:|Préparation/i),
  ).toBeVisible({ timeout: 20_000 });
});

test('envoyer message tuteur → réponse IA reçue sans URL', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.goto('/tuteur');

  const query = 'Comment analyser une métaphore dans un poème de Rimbaud ?';
  await page.getByRole('textbox').fill(query);
  await page.getByRole('button', { name: /Envoyer|Send/i }).click();

  await expect(
    page.locator('.message-assistant, [data-role="assistant"]').last(),
  ).toBeVisible({ timeout: 30_000 });

  const responseText = await page
    .locator('.message-assistant, [data-role="assistant"]')
    .last()
    .textContent();
  expect(responseText).not.toMatch(/https?:\/\//);
});
