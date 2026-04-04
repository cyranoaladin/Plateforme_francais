import { describe, it, expect, vi } from 'vitest';

describe('Storage paths', () => {
  it('utilise COPIES_DIR si défini', async () => {
    vi.stubEnv('COPIES_DIR', '/opt/custom/uploads');
    vi.resetModules();
    const { getUploadsBaseDir } = await import('@/lib/storage/paths');
    expect(getUploadsBaseDir()).toBe('/opt/custom/uploads');
    vi.unstubAllEnvs();
  });

  it('utilise le chemin .data/uploads par défaut', async () => {
    vi.unstubAllEnvs();
    vi.resetModules();
    const { getUploadsBaseDir } = await import('@/lib/storage/paths');
    expect(getUploadsBaseDir()).toContain('.data/uploads');
  });

  it('resolveUploadsPath construit le bon chemin', async () => {
    vi.stubEnv('COPIES_DIR', '/uploads');
    vi.resetModules();
    const { resolveUploadsPath } = await import('@/lib/storage/paths');
    const result = resolveUploadsPath('copies', 'file.png');
    expect(result).toContain('copies');
    expect(result).toContain('file.png');
    vi.unstubAllEnvs();
  });
});
