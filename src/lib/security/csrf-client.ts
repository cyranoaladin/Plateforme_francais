export function getCsrfTokenFromDocument(): string {
  if (typeof document === 'undefined') {
    return '';
  }

  const cookieEntry = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('eaf_csrf='));

  if (!cookieEntry) {
    return '';
  }

  return decodeURIComponent(cookieEntry.slice('eaf_csrf='.length));
}

const CSRF_BOOTSTRAP_RETRIES = 10;
const CSRF_BOOTSTRAP_POLL_MS = 50;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCsrfToken(): Promise<string> {
  const existing = getCsrfTokenFromDocument();
  if (existing) {
    return existing;
  }

  for (let index = 0; index < CSRF_BOOTSTRAP_RETRIES; index += 1) {
    await sleep(CSRF_BOOTSTRAP_POLL_MS);
    const token = getCsrfTokenFromDocument();
    if (token) {
      return token;
    }
  }

  const response = await fetch('/api/v1/csrf', { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error('Impossible de récupérer le jeton CSRF.');
  }

  const bootstrapped = getCsrfTokenFromDocument();
  if (!bootstrapped) {
    throw new Error('Jeton CSRF indisponible après initialisation.');
  }

  return bootstrapped;
}

/**
 * Ensures a CSRF token is available client-side.
 * Reads from cookie first; if absent, bootstraps via /api/v1/csrf.
 */
export async function ensurePublicCsrfToken(): Promise<string> {
  return getCsrfToken();
}
