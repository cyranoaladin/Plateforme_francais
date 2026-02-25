import { describe, it, expect, vi } from 'vitest';

const mockAdd = vi.fn().mockResolvedValue({ id: 'job-1' });

vi.mock('ioredis', () => {
  return {
    default: class MockRedis {
      incr = vi.fn().mockResolvedValue(1);
      expire = vi.fn().mockResolvedValue(1);
      ttl = vi.fn().mockResolvedValue(55);
    },
  };
});

vi.mock('bullmq', () => ({
  Queue: class MockQueue {
    add = mockAdd;
    getWaitingCount = vi.fn().mockResolvedValue(2);
    getActiveCount = vi.fn().mockResolvedValue(1);
    getDelayedCount = vi.fn().mockResolvedValue(0);
    getPrioritizedCount = vi.fn().mockResolvedValue(0);
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/epreuves/worker', () => ({
  runCorrectionWorker: vi.fn(),
}));

describe('correction-queue', () => {
  it('getRedisClient retourne une instance avec incr', async () => {
    const { getRedisClient } = await import('@/lib/queue/correction-queue');
    const client = getRedisClient();
    expect(client).toBeDefined();
    expect(typeof client.incr).toBe('function');
  });

  it('getRedisClient retourne la même instance (singleton)', async () => {
    const { getRedisClient } = await import('@/lib/queue/correction-queue');
    const a = getRedisClient();
    const b = getRedisClient();
    expect(a).toBe(b);
  });

  it('enqueueCorrectionJob ajoute un job dans la queue', async () => {
    const { enqueueCorrectionJob } = await import('@/lib/queue/correction-queue');
    await enqueueCorrectionJob({
      copieId: 'copie-1',
      userId: 'user-1',
      epreuveId: 'ep-1',
    });
    expect(mockAdd).toHaveBeenCalledWith(
      'process-copie',
      expect.objectContaining({ copieId: 'copie-1' }),
      expect.any(Object),
    );
  });

  it('getCorrectionQueueLength retourne le total des jobs', async () => {
    const { getCorrectionQueueLength } = await import('@/lib/queue/correction-queue');
    const count = await getCorrectionQueueLength();
    expect(count).toBe(3);
  });

  it('CORRECTION_QUEUE_NAME est défini', async () => {
    const { CORRECTION_QUEUE_NAME } = await import('@/lib/queue/correction-queue');
    expect(CORRECTION_QUEUE_NAME).toBe('correction-jobs');
  });
});
