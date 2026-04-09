import path from 'path';

export function getRessourcesRoot(): string {
  // Priority 1 : variable d'environnement explicite (prod et dev configurés)
  if (process.env.RESSOURCES_ROOT?.trim()) {
    return process.env.RESSOURCES_ROOT.trim();
  }
  // Priority 2 : chemin prod VPS
  if (process.env.NODE_ENV === 'production') {
    return '/srv/eaf_ressources';
  }
  // Priority 3 : dev local — résolution RUNTIME uniquement, jamais au build
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { join } = require('path') as typeof import('path');
  return join(process.cwd(), '..', 'eaf_ressources');
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
