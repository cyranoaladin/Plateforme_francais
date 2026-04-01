import { describe, expect, it } from 'vitest';
import { getOeuvresForYear, getProgrammeSelection } from '@/data/oeuvres-programme';

describe('getOeuvresForYear', () => {
  it('retourne les oeuvres du programme pour une année connue', () => {
    const works = getOeuvresForYear('2025-2026');
    expect(works.length).toBeGreaterThan(0);
    expect(works).toContain("On ne badine pas avec l'amour — Alfred de Musset");
  });

  it('retourne un fallback sur la dernière année disponible si l’année n’est pas connue', () => {
    const works = getOeuvresForYear('2030-2031');
    expect(works).toContain('Chrétien de Troyes, Le Chevalier de la charrette');
    expect(works).toContain('Simone Schwarz-Bart, Pluie et vent sur Télumée Miracle');
  });

  it("n'affiche pas d'avertissement pour le programme officiel 2026-2027", () => {
    const selection = getProgrammeSelection('2026-2027');

    expect(selection.showProgrammeWarning).toBe(false);
    expect(selection.availableWorks).toContain('Zola, Pot-Bouille');
    expect(selection.warningMessage).toBeUndefined();
  });

  it("signale explicitement le fallback quand l'année demandée n'est pas encore renseignée", () => {
    const selection = getProgrammeSelection('2027-2028');

    expect(selection.showProgrammeWarning).toBe(true);
    expect(selection.availableWorks).toContain('Zola, Pot-Bouille');
    expect(selection.warningMessage).toContain("programme 2026-2027");
  });
});
