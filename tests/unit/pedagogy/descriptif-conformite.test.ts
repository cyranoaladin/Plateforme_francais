import { describe, it, expect } from 'vitest';
import { DESCRIPTIF_REGLEMENTAIRE, OBJETS_ETUDE } from '@/data/programme-eaf-2025';

describe('Descriptif de lecture — conformité réglementaire', () => {
  it('requiert 16 textes minimum au total', () => {
    expect(DESCRIPTIF_REGLEMENTAIRE.totalTextesMinimum).toBe(16);
  });

  it('requiert 2 extraits d\'œuvre par objet d\'étude', () => {
    expect(DESCRIPTIF_REGLEMENTAIRE.parObjetEtude.extraitsOeuvreMinimum).toBe(2);
  });

  it('requiert 1 texte de parcours par objet d\'étude', () => {
    expect(DESCRIPTIF_REGLEMENTAIRE.parObjetEtude.extraitsParcours).toBe(1);
  });

  it('a exactement 4 objets d\'étude', () => {
    expect(OBJETS_ETUDE).toHaveLength(4);
  });

  it('chaque objet d\'étude a 3 œuvres au programme', () => {
    for (const objet of OBJETS_ETUDE) {
      expect(objet.oeuvres).toHaveLength(3);
    }
  });

  it('programme 2025 contient Rimbaud en poésie', () => {
    const poesie = OBJETS_ETUDE.find(o => o.id === 'POESIE');
    expect(poesie?.oeuvres.some(o => o.auteur.includes('Rimbaud'))).toBe(true);
  });

  it('programme 2025 contient Balzac en roman', () => {
    const roman = OBJETS_ETUDE.find(o => o.id === 'ROMAN_RECIT');
    expect(roman?.oeuvres.some(o => o.auteur.includes('Balzac'))).toBe(true);
  });
});
