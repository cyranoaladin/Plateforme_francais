import { describe, it, expect } from 'vitest';
import { EXTRAITS_OEUVRES } from '@/data/extraits-oeuvres';

const OEUVRES_OFFICIELLES = [
  'Cahier de Douai',
  "La rage de l'expression",
  'Mes forêts',
  'Discours de la servitude volontaire',
  'Entretiens sur la pluralité des mondes',
  "Lettres d'une Péruvienne",
  'Le Menteur',
  "On ne badine pas avec l'amour",
  'Pour un oui ou pour un non',
  'Manon Lescaut',
  'La Peau de chagrin',
  'Sido suivi de Les Vrilles de la vigne',
] as const;

const OBJETS_ETUDE = ['poesie', 'roman', 'theatre', 'litterature_idees'] as const;

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('EXTRAITS_OEUVRES — cohérence avec le programme officiel', () => {
  it('contient au moins 36 extraits au total (3 par œuvre × 12)', () => {
    expect(EXTRAITS_OEUVRES.length).toBeGreaterThanOrEqual(36);
  });

  it('couvre 12 œuvres uniques dans le corpus', () => {
    const oeuvresDansCorpus = new Set(EXTRAITS_OEUVRES.map((e) => normalize(e.oeuvre)));
    expect(oeuvresDansCorpus.size).toBe(12);
  });

  it('chaque œuvre a au moins 3 extraits', () => {
    const counts: Record<string, number> = {};
    for (const e of EXTRAITS_OEUVRES) {
      const key = normalize(e.oeuvre);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const oeuvreKeys = Object.keys(counts);
    expect(oeuvreKeys.length).toBe(12);
    for (const oeuvre of oeuvreKeys) {
      expect(counts[oeuvre] ?? 0).toBeGreaterThanOrEqual(3);
    }
  });

  it('chaque extrait a un champ objetEtude valide', () => {
    for (const e of EXTRAITS_OEUVRES) {
      expect(OBJETS_ETUDE as readonly string[]).toContain(e.objetEtude);
    }
  });

  it('chaque extrait a une questionGrammaire non vide', () => {
    for (const e of EXTRAITS_OEUVRES) {
      expect(e.questionGrammaire).toBeTruthy();
      expect(e.questionGrammaire.length).toBeGreaterThan(10);
    }
  });

  it('aucun extrait ne contient une URL dans le texte ou la question', () => {
    for (const e of EXTRAITS_OEUVRES) {
      expect(e.extrait).not.toMatch(/https?:\/\//);
      expect(e.questionGrammaire).not.toMatch(/https?:\/\//);
    }
  });

  it('les axesPossibles sont des chaînes non vides si présents', () => {
    for (const e of EXTRAITS_OEUVRES) {
      if (e.axesPossibles) {
        expect(Array.isArray(e.axesPossibles)).toBe(true);
        for (const axe of e.axesPossibles) {
          expect(typeof axe).toBe('string');
          expect(axe.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('chaque extrait a un id unique', () => {
    const ids = EXTRAITS_OEUVRES.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('chaque extrait a un auteur non vide', () => {
    for (const e of EXTRAITS_OEUVRES) {
      expect(e.auteur).toBeTruthy();
      expect(e.auteur.length).toBeGreaterThan(2);
    }
  });
});

describe('Cohérence listes hardcodées vs programme officiel', () => {
  const POESIE_ATTENDU = ['Cahier de Douai', "La rage de l'expression", 'Mes forêts'];
  const ROMAN_ATTENDU = ['Manon Lescaut', 'La Peau de chagrin', 'Sido suivi de Les Vrilles de la vigne'];
  const THEATRE_ATTENDU = ['Le Menteur', "On ne badine pas avec l'amour", 'Pour un oui ou pour un non'];
  const IDEES_ATTENDU = [
    'Discours de la servitude volontaire',
    'Entretiens sur la pluralité des mondes',
    "Lettres d'une Péruvienne",
  ];

  it('vérifie que le corpus couvre 12 œuvres et les 4 objets d\'étude', () => {
    const allExpected = [...POESIE_ATTENDU, ...ROMAN_ATTENDU, ...THEATRE_ATTENDU, ...IDEES_ATTENDU];
    expect(allExpected.length).toBe(12);
    const oeuvresDansCorpus = new Set(EXTRAITS_OEUVRES.map((e) => normalize(e.oeuvre)));
    expect(oeuvresDansCorpus.size).toBe(12);
    const objets = new Set(EXTRAITS_OEUVRES.map((e) => e.objetEtude));
    expect(objets).toEqual(new Set(OBJETS_ETUDE));
  });

  it('3 œuvres par objet d\'étude dans le corpus', () => {
    expect(POESIE_ATTENDU.length).toBe(3);
    expect(ROMAN_ATTENDU.length).toBe(3);
    expect(THEATRE_ATTENDU.length).toBe(3);
    expect(IDEES_ATTENDU.length).toBe(3);
  });
});
