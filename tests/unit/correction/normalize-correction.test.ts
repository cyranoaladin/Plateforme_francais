import { describe, expect, it } from 'vitest';
import { normalizeCorrectionPayload } from '@/lib/correction/normalize-correction';

describe('normalizeCorrectionPayload', () => {
  it('reconstruit un bilan exploitable quand la correction est partielle', () => {
    const normalized = normalizeCorrectionPayload({
      note: 11,
      rubriques: [{ titre: 'Analyse', note: 5, max: 8 }],
      conseil_final: null,
    });

    expect(normalized).toEqual(
      expect.objectContaining({
        note: 11,
        mention: 'Passable',
        bilan: expect.objectContaining({
          global: expect.any(String),
          points_forts: expect.any(Array),
          axes_amelioration: expect.any(Array),
        }),
        rubriques: [
          expect.objectContaining({
            titre: 'Analyse',
            note: 5,
            max: 8,
            appreciation: expect.any(String),
            conseils: expect.any(Array),
          }),
        ],
        annotations: [],
        corrige_type: '',
        conseil_final: expect.any(String),
      }),
    );

    expect(normalized?.bilan.global.length).toBeGreaterThan(0);
    expect(normalized?.bilan.axes_amelioration.length).toBeGreaterThan(0);
  });

  it('retourne null pour une correction absente', () => {
    expect(normalizeCorrectionPayload(null)).toBeNull();
  });
});
