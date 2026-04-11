import { beforeEach, describe, expect, it, vi } from 'vitest';

const tx = {
  activationCode: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
};

vi.mock('@/lib/db/client', () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx)),
  },
}));

describe('redeemActivationCode handles legacy plans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BILLING_CODE_PEPPER = 'test-pepper';
    tx.subscription.findUnique.mockResolvedValue(null);
    tx.subscription.upsert.mockResolvedValue({});
    tx.activationCode.update.mockResolvedValue({});
  });

  it('normalises a MAX activation code to PRO after enum migration', async () => {
    const { hashCode, redeemActivationCode } = await import('@/lib/billing/redeem');
    tx.activationCode.findUnique.mockResolvedValue({
      id: 'code-1',
      codeHash: hashCode('EAFMAXCODE123'),
      status: 'CREATED',
      plan: 'MAX',
      durationDays: 30,
      expiresAt: null,
    });

    const result = await redeemActivationCode('user-1', 'EAFMAXCODE123');
    expect(result.plan).toBe('PRO');
    expect(tx.subscription.upsert).toHaveBeenCalled();
    expect(tx.activationCode.update).toHaveBeenCalled();
  });
});
