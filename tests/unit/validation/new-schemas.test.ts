import { describe, it, expect } from 'vitest';
import {
  descriptifUpsertSchema,
  carnetEntrySchema,
  updateOeuvreChoisieSchema,
} from '@/lib/validation/schemas';

describe('descriptifUpsertSchema', () => {
  const validItem = {
    objetEtude: 'poesie',
    oeuvre: 'Cahier de Douai',
    auteur: 'Rimbaud',
    typeExtrait: 'extrait_oeuvre',
    titre: 'Le Dormeur du val',
  };

  it('valide un tableau de 1 à 60 items', () => {
    expect(descriptifUpsertSchema.safeParse({ textes: [validItem] }).success).toBe(true);
    expect(descriptifUpsertSchema.safeParse({ textes: [] }).success).toBe(false);
    const big = Array.from({ length: 61 }, () => validItem);
    expect(descriptifUpsertSchema.safeParse({ textes: big }).success).toBe(false);
  });

  it('refuse un objetEtude invalide', () => {
    const item = { ...validItem, objetEtude: 'philosophie' };
    expect(descriptifUpsertSchema.safeParse({ textes: [item] }).success).toBe(false);
  });

  it('refuse un typeExtrait invalide', () => {
    const item = { ...validItem, typeExtrait: 'inconnu' };
    expect(descriptifUpsertSchema.safeParse({ textes: [item] }).success).toBe(false);
  });

  it('accepte premieresLignes comme optionnel', () => {
    const itemWithLignes = { ...validItem, premieresLignes: 'Il dort...' };
    expect(descriptifUpsertSchema.safeParse({ textes: [itemWithLignes] }).success).toBe(true);
    expect(descriptifUpsertSchema.safeParse({ textes: [validItem] }).success).toBe(true);
  });

  it('refuse un titre vide', () => {
    const item = { ...validItem, titre: '' };
    expect(descriptifUpsertSchema.safeParse({ textes: [item] }).success).toBe(false);
  });

  it('refuse un titre > 200 caractères', () => {
    const item = { ...validItem, titre: 'x'.repeat(201) };
    expect(descriptifUpsertSchema.safeParse({ textes: [item] }).success).toBe(false);
  });

  it('refuse une oeuvre > 200 caractères', () => {
    const item = { ...validItem, oeuvre: 'x'.repeat(201) };
    expect(descriptifUpsertSchema.safeParse({ textes: [item] }).success).toBe(false);
  });

  it('valide tous les objetEtude officiels', () => {
    for (const objetEtude of ['poesie', 'roman', 'theatre', 'litterature_idees']) {
      const item = { ...validItem, objetEtude };
      expect(descriptifUpsertSchema.safeParse({ textes: [item] }).success).toBe(true);
    }
  });

  it('valide les deux types d\'extrait', () => {
    for (const typeExtrait of ['extrait_oeuvre', 'extrait_parcours']) {
      const item = { ...validItem, typeExtrait };
      expect(descriptifUpsertSchema.safeParse({ textes: [item] }).success).toBe(true);
    }
  });
});

describe('carnetEntrySchema', () => {
  const validEntry = {
    oeuvre: 'Cahier de Douai',
    auteur: 'Arthur Rimbaud',
    type: 'citation',
    contenu: 'Le cœur voleur',
  };

  it('valide les 5 types autorisés', () => {
    for (const type of ['citation', 'note', 'reaction', 'resume', 'lien_culturel']) {
      expect(carnetEntrySchema.safeParse({ ...validEntry, type }).success).toBe(true);
    }
  });

  it('refuse un type invalide', () => {
    expect(carnetEntrySchema.safeParse({ ...validEntry, type: 'poeme' }).success).toBe(false);
  });

  it('refuse un contenu vide', () => {
    expect(carnetEntrySchema.safeParse({ ...validEntry, contenu: '' }).success).toBe(false);
  });

  it('refuse un contenu > 2000 caractères', () => {
    expect(carnetEntrySchema.safeParse({ ...validEntry, contenu: 'x'.repeat(2001) }).success).toBe(false);
  });

  it('accepte exactement 2000 caractères', () => {
    expect(carnetEntrySchema.safeParse({ ...validEntry, contenu: 'x'.repeat(2000) }).success).toBe(true);
  });

  it('refuse page > 20 caractères', () => {
    expect(carnetEntrySchema.safeParse({ ...validEntry, page: 'x'.repeat(21) }).success).toBe(false);
  });

  it('accepte page comme optionnel', () => {
    expect(carnetEntrySchema.safeParse({ ...validEntry }).success).toBe(true);
    expect(carnetEntrySchema.safeParse({ ...validEntry, page: '42' }).success).toBe(true);
  });

  it('accepte tags comme tableau optionnel', () => {
    expect(carnetEntrySchema.safeParse({ ...validEntry, tags: ['analyse', 'thème'] }).success).toBe(true);
    expect(carnetEntrySchema.safeParse({ ...validEntry, tags: [] }).success).toBe(true);
  });
});

describe('updateOeuvreChoisieSchema', () => {
  it('valide une chaîne de 1 à 300 caractères', () => {
    expect(updateOeuvreChoisieSchema.safeParse({ oeuvreChoisieEntretien: 'Cahier de Douai' }).success).toBe(true);
    expect(updateOeuvreChoisieSchema.safeParse({ oeuvreChoisieEntretien: 'x'.repeat(300) }).success).toBe(true);
  });

  it('refuse une chaîne vide', () => {
    expect(updateOeuvreChoisieSchema.safeParse({ oeuvreChoisieEntretien: '' }).success).toBe(false);
  });

  it('refuse une chaîne > 300 caractères', () => {
    expect(updateOeuvreChoisieSchema.safeParse({ oeuvreChoisieEntretien: 'x'.repeat(301) }).success).toBe(false);
  });

  it('refuse un champ manquant', () => {
    expect(updateOeuvreChoisieSchema.safeParse({}).success).toBe(false);
  });

  it('valide une chaîne de longueur 1', () => {
    expect(updateOeuvreChoisieSchema.safeParse({ oeuvreChoisieEntretien: 'A' }).success).toBe(true);
  });
});
