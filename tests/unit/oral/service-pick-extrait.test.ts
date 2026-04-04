import { beforeEach, describe, expect, it, vi } from 'vitest';

const { texteDescriptifFindMany, info } = vi.hoisted(() => ({
  texteDescriptifFindMany: vi.fn(),
  info: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  prisma: {
    texteDescriptif: {
      findMany: texteDescriptifFindMany,
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

  it('uses corpus fallback when descriptif is empty in simulation mode', async () => {
    texteDescriptifFindMany.mockResolvedValue([]);

    const result = await pickOralExtrait({
      oeuvre: 'Andromaque',
      userId: 'u1',
      mode: 'SIMULATION',
    });

    expect(result.texte).toContain('Oreste');
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', oeuvre: 'Andromaque' }),
      expect.stringContaining('oral.pickExtrait.no_descriptif'),
    );
  });

  it('uses TexteDescriptif entries when available', async () => {
    texteDescriptifFindMany.mockResolvedValue([
      {
        id: 'd1',
        oeuvreAuteur: 'Andromaque — Racine',
        titreExtrait: 'Acte I sc 1',
        incipit: 'Oui puisque je retrouve un ami si fidèle',
        contenuTexte: null,
        position: 1,
      },
    ]);

    const result = await pickOralExtrait({
      oeuvre: 'Andromaque',
      userId: 'u1',
      mode: 'SIMULATION',
    });

    expect(result.texte).toContain('Oui puisque je retrouve');
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'texte_descriptif' }),
      expect.stringContaining('oral.pickExtrait.from_texte_descriptif'),
    );
  });
});
