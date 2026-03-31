import { beforeEach, describe, expect, it, vi } from 'vitest';

const warn = vi.fn();

vi.mock('@/lib/logger', () => ({
  logger: { warn, info: vi.fn(), error: vi.fn() },
}));

describe('requireQuota with undefined entry', () => {
  beforeEach(() => {
    warn.mockReset();
  });

  it('logs a warning when quota entry is undefined', async () => {
    const { requireQuota } = await import('@/lib/billing/usage');

    await requireQuota('user-1', 'ORAL_SESSIONS', undefined);

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', entitlement: 'ORAL_SESSIONS' }),
      expect.stringContaining('quota:missing_config'),
    );
  });
});
