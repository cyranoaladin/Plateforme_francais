import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindCopieById = vi.fn();
const mockFindEpreuveById = vi.fn();
const mockUpdateCopieStatus = vi.fn();
const mockAppendCopieProgressEvent = vi.fn();
const mockExtractTextFromCopie = vi.fn();
const mockCorrigerCopie = vi.fn();
const mockProcessInteraction = vi.fn();
const mockCreateEvaluation = vi.fn();
const mockCreateMemoryEventRecord = vi.fn();

vi.mock('@/lib/epreuves/repository', () => ({
  findCopieById: mockFindCopieById,
  findEpreuveById: mockFindEpreuveById,
  updateCopieStatus: mockUpdateCopieStatus,
  appendCopieProgressEvent: mockAppendCopieProgressEvent,
}));

vi.mock('@/lib/correction/ocr', () => ({
  extractTextFromCopie: mockExtractTextFromCopie,
  getUserSafeOcrText: vi.fn((text: string | null | undefined) => {
    const value = text?.trim();
    if (!value || value.startsWith('[ocr')) return null;
    return value;
  }),
  isOcrFailureText: vi.fn((text: string | null | undefined) => (text ?? '').startsWith('[ocr')),
}));

vi.mock('@/lib/correction/correcteur', () => ({
  corrigerCopie: mockCorrigerCopie,
}));

vi.mock('@/lib/agents/student-modeler', () => ({
  processInteraction: mockProcessInteraction,
}));

vi.mock('@/lib/db/repositories/evaluationRepo', () => ({
  createEvaluation: mockCreateEvaluation,
}));

vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  createMemoryEventRecord: mockCreateMemoryEventRecord,
}));

vi.mock('@/lib/memory/store', () => ({
  createMemoryEvent: vi.fn().mockReturnValue({}),
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
      ocrText: null,
    });
    mockFindEpreuveById.mockResolvedValue({
      id: 'ep-1',
      type: 'commentaire',
      sujet: 'Sujet',
    });
    mockExtractTextFromCopie.mockResolvedValue('Texte OCR');
    mockProcessInteraction.mockResolvedValue({});
    mockAppendCopieProgressEvent.mockResolvedValue(undefined);
    mockCreateEvaluation.mockResolvedValue(undefined);
    mockCreateMemoryEventRecord.mockResolvedValue(undefined);
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

  it('réutilise le texte OCR persisté sans relire le fichier source', async () => {
    mockFindCopieById.mockResolvedValue({
      id: 'copie-1',
      epreuveId: 'ep-1',
      userId: 'u1',
      filePath: 'uploads/copies/u1/missing.pdf',
      fileType: 'application/pdf',
      ocrText: 'Texte OCR déjà stocké',
    });
    mockCorrigerCopie.mockResolvedValue({
      note: 12,
      mention: 'Assez bien',
      bilan: { global: 'Analyse correcte.', points_forts: ['Idées présentes'], axes_amelioration: ['Approfondir'] },
      rubriques: [],
      annotations: [],
      corrige_type: 'commentaire',
      conseil_final: 'Continue.',
    });

    const { processCorrection } = await import('@/lib/epreuves/worker');
    await processCorrection('copie-1', 1);

    expect(mockExtractTextFromCopie).not.toHaveBeenCalled();
    expect(mockCorrigerCopie).toHaveBeenCalledWith(
      expect.objectContaining({
        texteOCR: 'Texte OCR déjà stocké',
      }),
    );
    expect(mockUpdateCopieStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        copieId: 'copie-1',
        status: 'done',
      }),
    );
  });

  it('publie les jalons de progression dans l ordre nominal', async () => {
    mockCorrigerCopie.mockResolvedValue({
      note: 14,
      mention: 'Bien',
      bilan: { global: 'Bonne copie.', points_forts: ['Structure'], axes_amelioration: ['Préciser'] },
      rubriques: [],
      annotations: [],
      corrige_type: 'commentaire',
      conseil_final: 'Continue.',
    });

    const { processCorrection } = await import('@/lib/epreuves/worker');
    await processCorrection('copie-1', 1);

    expect(mockAppendCopieProgressEvent.mock.calls.map(([arg]) => arg.stage)).toEqual([
      'ocr_started',
      'ocr_done',
      'correction_started',
      'correction_done',
      'report_ready',
    ]);
  });

  it('publie un jalon failed lorsque la correction termine en erreur finale', async () => {
    mockCorrigerCopie.mockRejectedValue(new Error('hard failure'));

    const { processCorrection } = await import('@/lib/epreuves/worker');
    await processCorrection('copie-1', 3);

    expect(mockAppendCopieProgressEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        copieId: 'copie-1',
        stage: 'failed',
      }),
    );
  });
});
