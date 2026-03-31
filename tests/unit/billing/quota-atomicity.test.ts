import { beforeEach, describe, expect, it, vi } from 'vitest';

const redisMock = {
  ping: vi.fn(),
  eval: vi.fn(),
  get: vi.fn(),
};

vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: () => redisMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

describe('consumeQuota atomicity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');
    redisMock.ping.mockResolvedValue('PONG');
  });

  it('allows only one concurrent request when the limit is 1', async () => {
    redisMock.eval
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(-1);
    redisMock.get.mockResolvedValue('1');

    const { consumeQuota } = await import('@/lib/billing/usage');

    const [r1, r2] = await Promise.allSettled([
      consumeQuota('user-1', 'ORAL_SESSIONS', { limit: 1, period: 'week' }),
      consumeQuota('user-1', 'ORAL_SESSIONS', { limit: 1, period: 'week' }),
    ]);

    const passed = [r1, r2].filter((result) => result.status === 'fulfilled').length;
    const failed = [r1, r2].filter((result) => result.status === 'rejected').length;

    expect(passed).toBe(1);
    expect(failed).toBe(1);
  });
});
