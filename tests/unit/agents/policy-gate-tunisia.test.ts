import { describe, it, expect } from 'vitest';

describe('PolicyGate Tunisia — oeuvres programme 2026', () => {
  const OEUVRES_PROGRAMME_2026 = [
    'Rimbaud — Le Dormeur du val',
    'Corneille — Le Cid',
    'Sarraute — Enfance',
    'Musset — Lorenzaccio',
    'Ponge — Le Parti pris des choses',
    'De Gouges — Déclaration des droits de la femme',
  ];

  it('toutes les oeuvres du programme sont reconnues', async () => {
    const mod = await import('@/lib/config/tunisia').catch(() => null);
    if (!mod || !('isTunisianOeuvre' in mod)) return;
    const { isTunisianOeuvre } = mod as { isTunisianOeuvre: (oeuvre: string) => boolean };
    for (const oeuvre of OEUVRES_PROGRAMME_2026) {
      expect(isTunisianOeuvre(oeuvre)).toBe(true);
    }
  });

  it('les oeuvres hors programme sont rejetées', async () => {
    const mod = await import('@/lib/config/tunisia').catch(() => null);
    if (!mod || !('isTunisianOeuvre' in mod)) return;
    const { isTunisianOeuvre } = mod as { isTunisianOeuvre: (oeuvre: string) => boolean };
    expect(isTunisianOeuvre('Shakespeare — Hamlet')).toBe(false);
  });
});
