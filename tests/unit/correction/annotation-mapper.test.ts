import { describe, expect, it } from 'vitest';
import { mapAnnotationsToRegions } from '@/lib/correction/annotation-mapper';

describe('mapAnnotationsToRegions', () => {
  it('retourne une region par annotation avec bornes valides', () => {
    const regions = mapAnnotationsToRegions('Texte OCR de test', [
      { extrait: 'Texte OCR', commentaire: 'ok', type: 'remarque' },
      { extrait: 'inexistant', commentaire: 'ko', type: 'erreur' },
    ]);

    expect(regions).toHaveLength(2);
    regions.forEach((r) => {
      expect(r.topPct).toBeGreaterThanOrEqual(0);
      expect(r.topPct).toBeLessThanOrEqual(100);
      expect(r.heightPct).toBeGreaterThan(0);
      expect(r.leftPct).toBeGreaterThanOrEqual(0);
      expect(r.widthPct).toBeGreaterThan(0);
    });
  });

  it('donne une confidence plus haute quand l extrait existe dans l OCR', () => {
    const [matched, unmatched] = mapAnnotationsToRegions('bonjour monde', [
      { extrait: 'bonjour', commentaire: 'ok', type: 'bravo' },
      { extrait: 'xyz', commentaire: 'ko', type: 'erreur' },
    ]);

    expect(matched.confidence).toBeGreaterThan(unmatched.confidence);
  });
});
