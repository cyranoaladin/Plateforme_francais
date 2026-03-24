import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockIsDatabaseAvailable,
  mockFindUnique,
  mockUpdate,
  mockPhaseUpsert,
  mockTranscriptUpsert,
  mockBilanUpsert,
} = vi.hoisted(() => ({
  mockIsDatabaseAvailable: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockPhaseUpsert: vi.fn(),
  mockTranscriptUpsert: vi.fn(),
  mockBilanUpsert: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: mockIsDatabaseAvailable,
  prisma: {
    oralSession: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    oralPhaseScore: {
      upsert: mockPhaseUpsert,
    },
    oralTranscript: {
      upsert: mockTranscriptUpsert,
    },
    oralBilan: {
      upsert: mockBilanUpsert,
    },
  },
}));

describe('oral repository persistence', () => {
  beforeEach(() => {
    mockIsDatabaseAvailable.mockResolvedValue(true);
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockPhaseUpsert.mockReset();
    mockTranscriptUpsert.mockReset();
    mockBilanUpsert.mockReset();
  });

  it('appendOralInteraction met à jour la session et persiste le score de phase', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'session-1',
      feedback: {
        interactions: [],
      },
    });
    mockUpdate.mockResolvedValue(undefined);
    mockPhaseUpsert.mockResolvedValue(undefined);

    const { appendOralInteraction } = await import('@/lib/oral/repository');

    await appendOralInteraction({
      sessionId: 'session-1',
      interaction: {
        step: 'LECTURE',
        transcript: 'Lecture test',
        duration: 90,
        createdAt: '2026-03-24T00:00:00.000Z',
        feedback: {
          feedback: 'Lecture correcte',
          score: 1.5,
          max: 2,
          points_forts: ['Ponctuation'],
          axes: ['Fluidité'],
          citations: [
            {
              title: 'Extrait — Lettres',
              source_interne: 'corpus',
              snippet: 'Passage de test',
            },
          ],
        },
      },
    });

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockPhaseUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sessionId_phase: {
            sessionId: 'session-1',
            phase: 'LECTURE',
          },
        },
      })
    );
  });

  it('finalizeOralSession persiste le transcript structuré et le bilan officiel', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'session-1',
      feedback: {
        interactions: [
          {
            step: 'LECTURE',
            transcript: 'Lecture test',
            duration: 90,
            createdAt: '2026-03-24T00:00:00.000Z',
            feedback: {
              feedback: 'Lecture correcte',
              score: 1.5,
              max: 2,
              points_forts: ['Ponctuation'],
              axes: ['Fluidité'],
            },
          },
          {
            step: 'EXPLICATION',
            transcript: 'Explication test',
            duration: 420,
            createdAt: '2026-03-24T00:05:00.000Z',
            feedback: {
              feedback: 'Explication correcte',
              score: 5,
              max: 8,
              points_forts: ['Structure'],
              axes: ['Citations'],
            },
          },
        ],
      },
    });
    mockUpdate.mockResolvedValue(undefined);
    mockTranscriptUpsert.mockResolvedValue(undefined);
    mockBilanUpsert.mockResolvedValue(undefined);

    const { finalizeOralSession } = await import('@/lib/oral/repository');

    await finalizeOralSession({
      sessionId: 'session-1',
      finalFeedback: {
        mention: 'Assez bien',
        bilan_global: 'Bilan test',
        conseil_final: 'Conseil test',
      },
      score: 12.5,
      maxScore: 20,
    });

    expect(mockTranscriptUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionId: 'session-1' },
        create: expect.objectContaining({
          fullText: expect.stringContaining('[LECTURE] Lecture test'),
          byPhase: expect.objectContaining({
            LECTURE: 'Lecture test',
            EXPLICATION: 'Explication test',
          }),
        }),
      })
    );
    expect(mockBilanUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionId: 'session-1' },
        create: expect.objectContaining({
          note: 12.5,
          mention: 'Assez bien',
          bilanGlobal: 'Bilan test',
          conseilFinal: 'Conseil test',
        }),
      })
    );
  });
});
