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
