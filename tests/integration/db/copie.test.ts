import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = { copies: [] as any[] };

vi.mock('@/lib/db/client', () => ({ isDatabaseAvailable: vi.fn().mockResolvedValue(false), prisma: {} }));
vi.mock('@/lib/epreuves/fallback-store', () => ({
  readEpreuvesFallbackStore: vi.fn(async () => ({ epreuves: [], copies: state.copies })),
  writeEpreuvesFallbackStore: vi.fn(async (updater: any) => {
    const next = updater({ epreuves: [], copies: state.copies });
    state.copies = next.copies;
  }),
}));

describe('DB copie', () => {
  beforeEach(() => { state.copies = []; });

  it('create copie en pending puis update status', async () => {
    const repo = await import('@/lib/epreuves/repository');
    const created = await repo.createCopie({ epreuveId: 'ep1', userId: 'u1', filePath: 'f', fileType: 'image/jpeg' });
    expect(created.status).toBe('pending');

    await repo.updateCopieStatus({ copieId: created.id, status: 'processing' });
    const updated = await repo.findCopieById(created.id);
    expect(updated?.status).toBe('processing');
  });
});
