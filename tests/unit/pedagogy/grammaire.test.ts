import { describe, it, expect } from 'vitest';
import { BAREME_GRAMMAIRE } from '@/data/baremes-officiels';

describe('Question de grammaire — règles officielles', () => {
  it('le barème est sur 2 points exactement', () => {
    expect(BAREME_GRAMMAIRE.total).toBe(2);
  });

  it('le barème a exactement 3 niveaux (pas 4)', () => {
    expect(BAREME_GRAMMAIRE.criteres[0].niveaux).toHaveLength(3);
  });

  it('le niveau 3 (complet) donne 2 points', () => {
    const n3 = BAREME_GRAMMAIRE.criteres[0].niveaux.find((n: { level: number; points: number; description: string }) => n.level === 3);
    expect(n3?.points).toBe(2);
  });

  it('le skill grammaire interdit explicitement l\'interprétation stylistique', async () => {
    const { grammaireCibleeSkill } = await import('@/lib/llm/skills/oral-grammaire-ciblee');
    const prompt = grammaireCibleeSkill.prompt ?? '';
    // Le prompt doit interdire l'interprétation, pas la demander
    expect(prompt).toContain('NE PAS');
    expect(prompt).toMatch(/demander une interprétation/);
    // Le prompt ne doit pas contenir d'instructions positives d'interprétation
    expect(prompt).not.toMatch(/Analysez l'effet stylistique/i);
    expect(prompt).not.toMatch(/Interprétez le sens/i);
  });

  it('le skill grammaire mentionne la Note de Service officielle', async () => {
    const { grammaireCibleeSkill } = await import('@/lib/llm/skills/oral-grammaire-ciblee');
    const prompt = grammaireCibleeSkill.prompt ?? '';
    expect(prompt).toContain('2019-042');
  });
});
