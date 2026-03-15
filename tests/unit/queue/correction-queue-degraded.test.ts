import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests garde-fous : vérifier comportement fail-closed en production
 * pour la queue de correction lorsque Redis/BullMQ est indisponible.
 *
 * Objectif : documenter et protéger contre régression async worker fallback.
 * Scope : Lot 1-A / F-012
 */

const mockQueueAdd = vi.fn();

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
    add = mockQueueAdd;
    getWaitingCount = vi.fn().mockResolvedValue(0);
    getActiveCount = vi.fn().mockResolvedValue(0);
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

describe('Correction Queue - Degraded fail-closed', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockQueueAdd.mockReset();
    mockQueueAdd.mockResolvedValue({ id: 'job-1' });
  });

  describe('enqueueCorrectionJob en production', () => {
    it('throw CorrectionQueueUnavailableError si BullMQ échoue (production)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockQueueAdd.mockRejectedValueOnce(new Error('Redis connection refused'));

      const { enqueueCorrectionJob, CorrectionQueueUnavailableError } = await import(
        '@/lib/queue/correction-queue'
      );

      await expect(
        enqueueCorrectionJob({
          copieId: 'copie-fail',
          userId: 'user-1',
          epreuveId: 'ep-1',
        }),
      ).rejects.toThrow(CorrectionQueueUnavailableError);
    });

    it('fallback inline autorisé en dev si BullMQ échoue', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockQueueAdd.mockRejectedValueOnce(new Error('Redis down in dev'));

      const { enqueueCorrectionJob } = await import(
        '@/lib/queue/correction-queue'
      );
      const { runCorrectionWorker } = await import('@/lib/epreuves/worker');

      await enqueueCorrectionJob({
        copieId: 'copie-dev',
        userId: 'user-1',
        epreuveId: 'ep-1',
      });

      // En dev, fallback inline déclenché
      expect(runCorrectionWorker).toHaveBeenCalledWith('copie-dev');
    });

    it('enqueue normalement si BullMQ disponible (production)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockQueueAdd.mockResolvedValueOnce({ id: 'job-prod-ok' });

      const { enqueueCorrectionJob } = await import(
        '@/lib/queue/correction-queue'
      );

      await enqueueCorrectionJob({
        copieId: 'copie-ok',
        userId: 'user-1',
        epreuveId: 'ep-1',
      });

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'process-copie',
        expect.objectContaining({ copieId: 'copie-ok' }),
        expect.objectContaining({ jobId: 'copie-ok' }),
      );
    });
  });

  describe('Worker availability check', () => {
    it('détecte queue unavailable en production sans fallback silencieux', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockQueueAdd.mockRejectedValue(new Error('Connection timeout'));

      const { enqueueCorrectionJob, CorrectionQueueUnavailableError } = await import(
        '@/lib/queue/correction-queue'
      );

      // Vérifier que plusieurs tentatives échouent aussi (pas de fallback caché)
      for (let i = 0; i < 3; i++) {
        await expect(
          enqueueCorrectionJob({
            copieId: `copie-retry-${i}`,
            userId: 'user-1',
            epreuveId: 'ep-1',
          }),
        ).rejects.toThrow(CorrectionQueueUnavailableError);
      }

      const { runCorrectionWorker } = await import('@/lib/epreuves/worker');
      // Pas de fallback inline déclenché en prod
      expect(runCorrectionWorker).not.toHaveBeenCalled();
    });
  });
});
