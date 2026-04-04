import path from 'path';

const appRoot = process.env.APP_ROOT?.trim()
  ? path.resolve(process.env.APP_ROOT)
  : process.cwd();

export function getRessourcesRoot(): string {
  // Always use environment variable or production path
  const explicitRoot = process.env.RESSOURCES_ROOT?.trim();
  if (explicitRoot) {
    return explicitRoot;
  }

  if (process.env.NODE_ENV === 'production') {
    return '/srv/eaf_ressources';
  }

  // Dev: fallback should never be used in production
  throw new Error('RESSOURCES_ROOT environment variable must be set in development');
}

export function resolveRessourcePath(relativePath: string): string {
  const normalizedPath = relativePath.replace(/^[/\\]+/, '');
  return path.resolve(getRessourcesRoot(), normalizedPath);
}

export function resolveCatalogFilePath(filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const normalizedPath = filePath.replace(/\\/g, '/');
  const relativePath = normalizedPath.startsWith('ressources/')
    ? normalizedPath.slice('ressources/'.length)
    : normalizedPath;

  return resolveRessourcePath(relativePath);
}

export function isWithinRessourcesRoot(targetPath: string): boolean {
  const ressourcesRoot = path.resolve(getRessourcesRoot()) + path.sep;
  return path.resolve(targetPath).startsWith(ressourcesRoot);
}
