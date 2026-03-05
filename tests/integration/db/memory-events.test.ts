import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = { events: [] as any[] };

vi.mock('@/lib/db/client', () => ({ isDatabaseAvailable: vi.fn().mockResolvedValue(false), prisma: {} }));
vi.mock('@/lib/db/fallback-store', () => ({
  readFallbackStore: vi.fn(async () => ({ users: [], sessions: [], events: state.events })),
  writeFallbackStore: vi.fn(async (updater: any) => {
    const next = updater({ users: [], sessions: [], events: state.events });
    state.events = next.events;
  }),
}));

describe('DB memory-events', () => {
  beforeEach(() => { state.events = []; });

  it('insert + list events en fallback', async () => {
    const repo = await import('@/lib/db/repositories/memoryRepo');
    await repo.createMemoryEventRecord({
      id: 'e1', userId: 'u1', type: 'interaction', feature: 'x', createdAt: new Date().toISOString(),
    } as any);
    const out = await repo.listMemoryEventsByUser('u1');
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe('e1');
  });
});
