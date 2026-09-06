import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * Regression test for the report generator pipeline.
 *
 * generateRapportEcritDocument() performs real filesystem and database I/O
 * when STORAGE_PROVIDER is not 's3' (see src/lib/pdf/generator.ts). This test
 * previously called it with zero mocking, which caused every test run to
 * write a real HTML file to disk under `<cwd>/.data/uploads/documents/user-1/`
 * (the default COPIES_DIR-derived path — production-shaped, same layout as
 * /opt/eaf/shared/uploads). Over time this leaked hundreds of stray files
 * onto disk. See tests/unit/pdf/generator.test.ts for the established mocking
 * pattern this test now follows, and tests/setup-fs-write-guard.ts for the
 * project-wide guard that now fails the suite if any test writes to a
 * production-shaped path regardless of mocking mistakes like this one.
 */

const { isDatabaseAvailableMock, getStorageProviderMock } = vi.hoisted(() => ({
  isDatabaseAvailableMock: vi.fn().mockResolvedValue(false),
  getStorageProviderMock: vi.fn().mockReturnValue('local'),
}));

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: isDatabaseAvailableMock,
  prisma: {
    studentProfile: { findUnique: vi.fn() },
    documentDeposit: { create: vi.fn() },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/storage/provider', () => ({
  getStorageProvider: getStorageProviderMock,
}));

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('report generator', () => {
  beforeEach(() => {
    isDatabaseAvailableMock.mockResolvedValue(false);
    getStorageProviderMock.mockReturnValue('local');
  });

  it('génère un document rapport écrit sans écrire sur le disque réel', async () => {
    const fs = await import('fs');
    const { generateRapportEcritDocument } = await import('@/lib/pdf/generator');

    const out = await generateRapportEcritDocument(
      'user-1',
      {
        note: 14,
        mention: 'Bien',
        rubriques: [{ titre: 'Analyse', note: 7, max: 10, appreciation: 'Correct' }],
        bilan: { global: 'Bon travail', points_forts: ['analyse'], axes_amelioration: ['style'] },
        conseil_final: 'Continue',
      },
      'Jean',
    );

    expect(out.html).toContain('Bon travail');
    expect(out.url).toContain('/api/v1/documents/');

    // The real fs module must never be touched: writeFile/mkdir only run
    // against the mock above.
    expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.promises.mkdir).toHaveBeenCalledTimes(1);
  });
});
