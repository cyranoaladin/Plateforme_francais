import { beforeEach, describe, expect, it, vi } from 'vitest';

const { profileFindUnique, descriptifFindMany, textPrepareFindMany, info } = vi.hoisted(() => ({
  profileFindUnique: vi.fn(),
  descriptifFindMany: vi.fn(),
  textPrepareFindMany: vi.fn(),
  info: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  prisma: {
    studentProfile: {
      findUnique: profileFindUnique,
    },
    descriptifTexte: {
      findMany: descriptifFindMany,
    },
    textePrepare: {
      findMany: textPrepareFindMany,
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
    profileFindUnique.mockResolvedValue({ id: 'profile-1' });
    descriptifFindMany.mockResolvedValue([]);
    textPrepareFindMany.mockResolvedValue([]);

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

  it('uses DescriptifTexte entries when available', async () => {
    profileFindUnique.mockResolvedValue({ id: 'profile-1' });
    descriptifFindMany.mockResolvedValue([
      { id: 'd1', oeuvre: 'Andromaque', auteur: 'Racine', titre: 'Acte I sc 1', premieresLignes: 'Oui puisque je retrouve un ami si fidèle' },
    ]);

    const result = await pickOralExtrait({
      oeuvre: 'Andromaque',
      userId: 'u1',
      mode: 'SIMULATION',
    });

    expect(result.texte).toContain('Oui puisque je retrouve');
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'descriptif_texte' }),
      expect.stringContaining('oral.pickExtrait.from_descriptif_texte'),
    );
  });

  it('falls back to TextePrepare when no DescriptifTexte but TextePrepare exists', async () => {
    profileFindUnique.mockResolvedValue({ id: 'profile-1' });
    descriptifFindMany.mockResolvedValue([]);
    textPrepareFindMany.mockResolvedValue([
      { id: 'tp1', oeuvreAuteur: 'Andromaque — Racine', titreExtrait: 'Acte V', incipit: 'Grâce aux Dieux' },
    ]);

    const result = await pickOralExtrait({
      oeuvre: 'Andromaque',
      userId: 'u1',
      mode: 'SIMULATION',
    });

    expect(result.texte).toContain('Grâce aux Dieux');
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'texte_prepare' }),
      expect.stringContaining('oral.pickExtrait.from_texte_prepare'),
    );
  });
});
