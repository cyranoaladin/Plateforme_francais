import { beforeEach, describe, expect, it, vi } from 'vitest';

type MemoryEvent = {
  id: string;
  userId: string;
  type: string;
  feature: string;
  createdAt: string;
};

type FallbackState = { users: unknown[]; sessions: unknown[]; events: MemoryEvent[] };
type Updater = (prev: FallbackState) => FallbackState;

const state: { events: MemoryEvent[] } = { events: [] };

vi.mock('@/lib/db/client', () => ({ isDatabaseAvailable: vi.fn().mockResolvedValue(false), prisma: {} }));
vi.mock('@/lib/db/fallback-store', () => ({
  readFallbackStore: vi.fn(async () => ({ users: [], sessions: [], events: state.events })),
  writeFallbackStore: vi.fn(async (updater: Updater) => {
    const next = updater({ users: [], sessions: [], events: state.events });
    state.events = next.events;
  }),
}));

describe('DB memory-events', () => {
  beforeEach(() => { state.events = []; });

  it('insert + list events en fallback', async () => {
    const repo = await import('@/lib/db/repositories/memoryRepo');
    await repo.createMemoryEventRecord({
      id: 'e1',
      userId: 'u1',
      type: 'interaction',
      feature: 'x',
      createdAt: new Date().toISOString(),
    } satisfies MemoryEvent);
    const out = await repo.listMemoryEventsByUser('u1');
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe('e1');
  });
});
