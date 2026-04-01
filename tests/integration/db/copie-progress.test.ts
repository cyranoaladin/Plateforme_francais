import { beforeEach, describe, expect, it, vi } from 'vitest';

type Copie = { id: string; status: string };
type ProgressEvent = {
  id: string;
  copieId: string;
  stage: string;
  message: string;
  progress: number | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
};
type EpreuvesState = { epreuves: unknown[]; copies: Copie[]; progressEvents: ProgressEvent[] };
type Updater = (prev: EpreuvesState) => EpreuvesState;

const state: EpreuvesState = { epreuves: [], copies: [], progressEvents: [] };

vi.mock('@/lib/db/client', () => ({ isDatabaseAvailable: vi.fn().mockResolvedValue(false), prisma: {} }));
vi.mock('@/lib/epreuves/fallback-store', () => ({
  readEpreuvesFallbackStore: vi.fn(async () => ({
    epreuves: state.epreuves,
    copies: state.copies,
    progressEvents: state.progressEvents,
  })),
  writeEpreuvesFallbackStore: vi.fn(async (updater: Updater) => {
    const next = updater({
      epreuves: state.epreuves,
      copies: state.copies,
      progressEvents: state.progressEvents,
    });
    state.epreuves = next.epreuves;
    state.copies = next.copies;
    state.progressEvents = next.progressEvents;
  }),
}));

describe('DB copie progress events', () => {
  beforeEach(() => {
    state.epreuves = [];
    state.copies = [];
    state.progressEvents = [];
  });

  it('persists ordered progress events for a copy', async () => {
    const repo = await import('@/lib/epreuves/repository');

    await repo.appendCopieProgressEvent({
      copieId: 'copie-1',
      stage: 'queued',
      message: 'Copie déposée.',
      progress: 0,
    });
    await repo.appendCopieProgressEvent({
      copieId: 'copie-1',
      stage: 'ocr_started',
      message: 'OCR en cours.',
      progress: 25,
    });

    const events = await repo.listCopieProgressEvents('copie-1');

    expect(events).toHaveLength(2);
    expect(events.map((item) => item.stage)).toEqual(['queued', 'ocr_started']);
    expect(events[0]?.message).toBe('Copie déposée.');
    expect(events[1]?.progress).toBe(25);
  });
});
