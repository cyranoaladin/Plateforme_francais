import { describe, expect, it } from 'vitest';
import { generateRapportEcritDocument } from '@/lib/pdf/generator';

describe('report generator', () => {
  it('génère un document rapport écrit', async () => {
    const out = await generateRapportEcritDocument(
      'user-1',
      {
        note: 14,
        mention: 'Bien',
        rubriques: [{ titre: 'Analyse', note: 7, max: 10, appreciation: 'Correct' }],
        bilan: { global: 'Bon travail', points_forts: ['analyse'], axes_amelioration: ['style'] },
        conseil_final: 'Continue',
      },
      'Jean',
    );

    expect(out.html).toContain('Bon travail');
    expect(out.url).toContain('/api/v1/documents/');
  });
});
