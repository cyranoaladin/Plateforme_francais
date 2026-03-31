import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUnique, info } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  info: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  prisma: {
    studentProfile: {
      findUnique,
    },
  },
}));

vi.mock('@/data/extraits-oeuvres', () => ({
  EXTRAITS_OEUVRES: [
    {
      oeuvre: 'Andromaque',
      extrait: 'Oreste venait chercher Hermione.',
      questionGrammaire: 'Analysez la subordonnée circonstancielle.',
    },
  ],
}));

vi.mock('@/lib/logger', () => ({
  logger: { info, warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { pickOralExtrait } from '@/lib/oral/service';

describe('pickOralExtrait', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses corpus fallback when descriptif is incomplete in simulation mode', async () => {
    findUnique.mockResolvedValue({
      descriptifTextes: [],
    });

    const result = await pickOralExtrait({
      oeuvre: 'Andromaque',
      userId: 'u1',
      mode: 'SIMULATION',
    });

    expect(result.texte).toContain('Oreste');
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', count: 0, oeuvre: 'Andromaque' }),
      expect.stringContaining('oral.pickExtrait.incomplete_descriptif'),
    );
  });
});
