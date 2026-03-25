const PUBLIC_STANDALONE_PATHS = new Set([
  '/',
  '/login',
  '/bienvenue',
  '/pricing',
  '/contact',
  '/mentions-legales',
  '/cgu',
  '/politique-de-confidentialite',
  '/premium-landing',
]);

export function isStandaloneAppShellPath(pathname: string): boolean {
  return (
    PUBLIC_STANDALONE_PATHS.has(pathname) ||
    pathname === '/onboarding' ||
    pathname.startsWith('/paiement/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/enseignant') ||
    pathname.startsWith('/parent')
  );
}

export function usesStudentAppShell(pathname: string): boolean {
  return !isStandaloneAppShellPath(pathname);
}
