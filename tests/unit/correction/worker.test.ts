import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindCopieById = vi.fn();
const mockFindEpreuveById = vi.fn();
const mockUpdateCopieStatus = vi.fn();
const mockExtractTextFromCopie = vi.fn();
const mockCorrigerCopie = vi.fn();
const mockProcessInteraction = vi.fn();

vi.mock('@/lib/epreuves/repository', () => ({
  findCopieById: mockFindCopieById,
  findEpreuveById: mockFindEpreuveById,
  updateCopieStatus: mockUpdateCopieStatus,
}));

vi.mock('@/lib/correction/ocr', () => ({
  extractTextFromCopie: mockExtractTextFromCopie,
  isOcrFailureText: vi.fn((text: string | null | undefined) => (text ?? '').startsWith('[ocr')),
}));

vi.mock('@/lib/correction/correcteur', () => ({
  corrigerCopie: mockCorrigerCopie,
}));

vi.mock('@/lib/agents/student-modeler', () => ({
  processInteraction: mockProcessInteraction,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('processCorrection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindCopieById.mockResolvedValue({
      id: 'copie-1',
      epreuveId: 'ep-1',
      userId: 'u1',
      filePath: 'uploads/copies/u1/file.jpg',
      fileType: 'image/jpeg',
    });
    mockFindEpreuveById.mockResolvedValue({
      id: 'ep-1',
      type: 'commentaire',
      sujet: 'Sujet',
    });
    mockExtractTextFromCopie.mockResolvedValue('Texte OCR');
    mockProcessInteraction.mockResolvedValue({});
  });

  it('planifie un retry avec backoff exponentiel', async () => {
    const timeoutSpy = vi.spyOn(global, 'setTimeout');
    mockCorrigerCopie.mockRejectedValue(new Error('LLM unavailable'));
    const { processCorrection } = await import('@/lib/epreuves/worker');
    await processCorrection('copie-1', 1);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);
    timeoutSpy.mockRestore();
  });

  it('passe en status error apres 3 tentatives', async () => {
    mockCorrigerCopie.mockRejectedValue(new Error('hard failure'));
    const { processCorrection } = await import('@/lib/epreuves/worker');
    await processCorrection('copie-1', 3);
    expect(mockUpdateCopieStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        copieId: 'copie-1',
        status: 'error',
        errorMessage: 'hard failure',
      }),
    );
  });

  it('refuse de corriger une sentinelle OCR technique et retourne une erreur utilisateur claire', async () => {
    mockExtractTextFromCopie.mockResolvedValue('[ocr pixtral: erreur serveur 500]');
    const { processCorrection } = await import('@/lib/epreuves/worker');
    await processCorrection('copie-1', 1);

    expect(mockCorrigerCopie).not.toHaveBeenCalled();
    expect(mockUpdateCopieStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        copieId: 'copie-1',
        status: 'error',
        ocrText: null,
        errorMessage: expect.stringContaining("Nous n'avons pas réussi à lire automatiquement cette copie"),
      }),
    );
  });
});
