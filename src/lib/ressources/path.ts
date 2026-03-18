import { existsSync } from 'fs';
import path from 'path';

const appRoot = process.env.APP_ROOT?.trim()
  ? path.resolve(process.env.APP_ROOT)
  : process.cwd();

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function getRessourcesRoot(): string {
  const explicitRoot = process.env.RESSOURCES_ROOT?.trim();
  if (explicitRoot) {
    return path.resolve(explicitRoot);
  }

  const candidates = dedupe([
    path.resolve(appRoot, '..', 'eaf_ressources'),
    path.resolve(process.cwd(), '..', 'eaf_ressources'),
  ]);

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
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
