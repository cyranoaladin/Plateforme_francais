import path from 'node:path';

export function getUploadsBaseDir(): string {
  return process.env['COPIES_DIR']?.trim()
    || path.join(/* turbopackIgnore: true */ process.cwd(), '.data', 'uploads');
}

export function resolveUploadsPath(...segments: string[]): string {
  return path.join(getUploadsBaseDir(), ...segments);
}
