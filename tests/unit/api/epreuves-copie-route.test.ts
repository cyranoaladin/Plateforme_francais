import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 60 }),
}));

vi.mock('@/lib/security/file-validator', () => ({
  InvalidFileTypeError: class InvalidFileTypeError extends Error {},
  validateUpload: vi.fn().mockReturnValue({ mime: 'application/pdf' }),
}));

vi.mock('@/lib/billing/context', () => ({
  getBillingContext: vi.fn(),
  BillingContextUnavailableError: class BillingContextUnavailableError extends Error {},
}));

vi.mock('@/lib/billing/usage', () => ({
  consumeQuota: vi.fn(),
  QuotaExceededError: class QuotaExceededError extends Error {
    limit: number | 'unlimited';
    period: string;

    constructor(_entitlement: string, limit: number | 'unlimited', _current: number, period: string) {
      super('quota exceeded');
      this.limit = limit;
      this.period = period;
    }
  },
}));

vi.mock('@/lib/epreuves/repository', () => ({
  findEpreuveById: vi.fn(),
  createCopie: vi.fn(),
  appendCopieProgressEvent: vi.fn(),
}));

vi.mock('@/lib/storage/copies', () => ({
  saveCopieFile: vi.fn(),
}));

vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  createMemoryEventRecord: vi.fn(),
  listMemoryEventsByUser: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/db/repositories/userRepo', () => ({
  updateUserProfile: vi.fn(),
}));

vi.mock('@/lib/gamification/badges', () => ({
  evaluateBadges: vi.fn().mockReturnValue({ badges: [], newBadges: [] }),
}));

vi.mock('@/lib/memory/store', () => ({
  createMemoryEvent: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/epreuves/worker', () => ({
  runCorrectionWorker: vi.fn(),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getBillingContext } from '@/lib/billing/context';
import { consumeQuota } from '@/lib/billing/usage';
import { appendCopieProgressEvent, createCopie, findEpreuveById } from '@/lib/epreuves/repository';

describe('POST /api/v1/epreuves/[epreuveId]/copie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'user-free', profile: {} } },
      errorResponse: null,
    } as never);
    vi.mocked(findEpreuveById).mockResolvedValue({
      id: 'ep-1',
      userId: 'user-free',
      type: 'commentaire',
      sujet: 'Sujet',
      texte: '',
      consignes: '',
      bareme: {},
      generatedAt: new Date().toISOString(),
    });
    vi.mocked(getBillingContext).mockResolvedValue({
      planId: 'FREE',
      isActive: true,
      endsAt: null,
      config: {
        id: 'FREE',
        label: 'Gratuit',
        priceTnd: 0,
        billingCycle: 'free',
        quotas: {
          WRITTEN_CORRECTIONS: { limit: 2, period: 'month' },
          OCR_COPIES: { limit: 0, period: 'month' },
        },
        flags: {},
        rateLimits: { oralStartPerHour: 6 },
      },
    } as never);
    vi.mocked(createCopie).mockResolvedValue({
      id: 'copie-1',
      epreuveId: 'ep-1',
      userId: 'user-free',
      filePath: 'uploads/copie.pdf',
      fileType: 'application/pdf',
      status: 'pending',
      ocrText: null,
      correction: null,
      createdAt: new Date().toISOString(),
      correctedAt: null,
    } as never);
  });

  it('refuse le depot de copie quand OCR_COPIES est bloque sur FREE', async () => {
    const { QuotaExceededError } = await import('@/lib/billing/usage');
    vi.mocked(consumeQuota)
      .mockResolvedValueOnce({ current: 1, limit: 2, remaining: 1 })
      .mockRejectedValueOnce(new QuotaExceededError('OCR_COPIES', 0, 0, 'month'));

    const { POST } = await import('@/app/api/v1/epreuves/[epreuveId]/copie/route');
    const formData = new FormData();
    formData.append('file', new File(['fake pdf'], 'copy.pdf', { type: 'application/pdf' }));

    const request = new Request('http://localhost/api/v1/epreuves/ep-1/copie', {
      method: 'POST',
      headers: { 'X-CSRF-Token': 'tok' },
      body: formData,
    });

    const response = await POST(request, { params: Promise.resolve({ epreuveId: 'ep-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(402);
    expect(payload.code).toBe('QUOTA_EXCEEDED');
    expect(payload.upgradeUrl).toBe('/pricing');
    expect(String(payload.error)).toMatch(/limite OCR/i);
    expect(consumeQuota).toHaveBeenNthCalledWith(1, 'user-free', 'WRITTEN_CORRECTIONS', { limit: 2, period: 'month' });
    expect(consumeQuota).toHaveBeenNthCalledWith(2, 'user-free', 'OCR_COPIES', { limit: 0, period: 'month' });
  });

  it('enregistre un événement queued quand la copie est acceptée', async () => {
    vi.mocked(consumeQuota)
      .mockResolvedValueOnce({ current: 1, limit: 2, remaining: 1 })
      .mockResolvedValueOnce({ current: 1, limit: 2, remaining: 1 });

    const { saveCopieFile } = await import('@/lib/storage/copies');
    const { runCorrectionWorker } = await import('@/lib/epreuves/worker');
    vi.mocked(saveCopieFile).mockResolvedValue({
      filePath: 'uploads/copie.pdf',
      fileType: 'application/pdf',
    } as never);

    const { POST } = await import('@/app/api/v1/epreuves/[epreuveId]/copie/route');
    const formData = new FormData();
    formData.append('file', new File(['fake pdf'], 'copy.pdf', { type: 'application/pdf' }));

    const request = new Request('http://localhost/api/v1/epreuves/ep-1/copie', {
      method: 'POST',
      headers: { 'X-CSRF-Token': 'tok' },
      body: formData,
    });

    const response = await POST(request, { params: Promise.resolve({ epreuveId: 'ep-1' }) });
    expect(response.status).toBe(202);
    expect(appendCopieProgressEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        copieId: 'copie-1',
        stage: 'queued',
      }),
    );
    expect(runCorrectionWorker).toHaveBeenCalledWith('copie-1');
  });
});
