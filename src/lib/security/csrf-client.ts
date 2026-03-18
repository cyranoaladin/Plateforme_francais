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

/**
 * Ensures a CSRF token is available client-side.
 * Reads from cookie first; if absent, bootstraps via /api/v1/csrf.
 */
export async function ensurePublicCsrfToken(): Promise<string> {
  const existing = getCsrfTokenFromDocument();
  if (existing) {
    return existing;
  }

  await fetch('/api/v1/csrf', { credentials: 'same-origin' });
  return getCsrfTokenFromDocument();
}
