import { beforeEach, describe, expect, it, vi } from 'vitest';

const redisMock = {
  incr: vi.fn(),
  expire: vi.fn(),
};

vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: () => redisMock,
}));

describe('checkLLMQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisMock.expire.mockResolvedValue(1);
  });

  it('autorise quand quota rpm et daily non depasses', async () => {
    redisMock.incr.mockResolvedValueOnce(10).mockResolvedValueOnce(3); // daily, rpm
    const { checkLLMQuota } = await import('@/lib/security/llm-rate-limiter');
    await expect(checkLLMQuota('u1', 'tuteur_libre')).resolves.toBeUndefined();
    expect(redisMock.expire).toHaveBeenCalledTimes(2);
  });

  it('rejette quand quota quotidien est depasse', async () => {
    redisMock.incr.mockResolvedValueOnce(201).mockResolvedValueOnce(1);
    const { checkLLMQuota, QuotaExceededError } = await import('@/lib/security/llm-rate-limiter');
    await expect(checkLLMQuota('u1', 'tuteur_libre')).rejects.toBeInstanceOf(QuotaExceededError);
  });

  it('rejette quand quota minute est depasse', async () => {
    redisMock.incr.mockResolvedValueOnce(10).mockResolvedValueOnce(11);
    const { checkLLMQuota, QuotaExceededError } = await import('@/lib/security/llm-rate-limiter');
    await expect(checkLLMQuota('u1', 'coach_oral')).rejects.toBeInstanceOf(QuotaExceededError);
  });
});

