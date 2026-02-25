import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { evaluateBadges, BADGES } from '@/lib/gamification/badges';
import type { StudentProfile, MemoryEvent } from '@/lib/auth/types';

function makeProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    displayName: 'Élève Test',
    classLevel: 'Première',
    targetScore: '14',
    onboardingCompleted: true,
    selectedOeuvres: [],
    parcoursProgress: [],
    badges: [],
    preferredObjects: [],
    weakSkills: [],
    ...overrides,
  };
}

function makeEvent(daysAgo: number): MemoryEvent {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return {
    id: `ev-${daysAgo}`,
    userId: 'user-1',
    type: 'interaction' as const,
    feature: 'atelier_ecrit',
    payload: {},
    createdAt: d.toISOString(),
  };
}

describe('evaluateBadges — triggers', () => {
  it('attribue first_copy au premier dépôt', () => {
    const { badges, newBadges } = evaluateBadges({ profile: makeProfile(), trigger: 'first_copy' });
    expect(badges).toContain(BADGES.first_copy);
    expect(newBadges).toContain(BADGES.first_copy);
  });

  it('attribue quiz_perfect sur quiz parfait', () => {
    const { badges } = evaluateBadges({ profile: makeProfile(), trigger: 'quiz_perfect' });
    expect(badges).toContain(BADGES.quiz_perfect);
  });

  it("attribue oral_done à la fin d'une simulation orale", () => {
    const { badges } = evaluateBadges({ profile: makeProfile(), trigger: 'oral_done' });
    expect(badges).toContain(BADGES.oral_done);
  });

  it('attribue score_15 si note strictement > 15', () => {
    const { badges } = evaluateBadges({ profile: makeProfile(), trigger: 'score', score: 15.5 });
    expect(badges).toContain(BADGES.score_15);
  });

  it("N'attribue PAS score_15 si note = 15", () => {
    const { badges } = evaluateBadges({ profile: makeProfile(), trigger: 'score', score: 15 });
    expect(badges).not.toContain(BADGES.score_15);
  });

  it("N'attribue PAS score_15 si note < 15", () => {
    const { badges } = evaluateBadges({ profile: makeProfile(), trigger: 'score', score: 14.9 });
    expect(badges).not.toContain(BADGES.score_15);
  });
});

describe('evaluateBadges — streak', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('attribue streak_7 après 7 jours consécutifs', () => {
    vi.setSystemTime(new Date('2026-03-10T14:00:00Z'));
    const timeline = [0, 1, 2, 3, 4, 5, 6].map(makeEvent);
    const { badges } = evaluateBadges({ profile: makeProfile(), timeline });
    expect(badges).toContain(BADGES.streak_7);
  });

  it("N'attribue PAS streak_7 si gap > 1 jour dans la série", () => {
    vi.setSystemTime(new Date('2026-03-10T14:00:00Z'));
    // Série 0,1,2, puis trou jour 3, puis 4,5,6,7
    const timeline = [0, 1, 2, 4, 5, 6, 7].map(makeEvent);
    const { badges } = evaluateBadges({ profile: makeProfile(), timeline });
    expect(badges).not.toContain(BADGES.streak_7);
  });

  it("autorise un gap d'1 jour (pas d'activité aujourd'hui)", () => {
    vi.setSystemTime(new Date('2026-03-10T14:00:00Z'));
    const timeline = [1, 2, 3, 4, 5, 6, 7].map(makeEvent);
    const { badges } = evaluateBadges({ profile: makeProfile(), timeline });
    expect(badges).toContain(BADGES.streak_7);
  });

  it("N'attribue PAS streak_7 avec moins de 7 jours consécutifs", () => {
    vi.setSystemTime(new Date('2026-03-10T14:00:00Z'));
    const timeline = [0, 1, 2, 3, 4, 5].map(makeEvent);
    const { badges } = evaluateBadges({ profile: makeProfile(), timeline });
    expect(badges).not.toContain(BADGES.streak_7);
  });

  it('la streak est bornée à 365 jours max — ne boucle pas indéfiniment', () => {
    vi.setSystemTime(new Date('2026-03-10T14:00:00Z'));
    const timeline = Array.from({ length: 400 }, (_, i) => makeEvent(i));
    const start = Date.now();
    evaluateBadges({ profile: makeProfile(), timeline });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});

describe('evaluateBadges — anti-duplication', () => {
  it('ne duplique pas un badge déjà présent', () => {
    const profile = makeProfile({ badges: [BADGES.first_copy] });
    const { badges, newBadges } = evaluateBadges({ profile, trigger: 'first_copy' });
    const count = badges.filter((b: string) => b === BADGES.first_copy).length;
    expect(count).toBe(1);
    expect(newBadges).not.toContain(BADGES.first_copy);
  });

  it('newBadges ne contient que les badges vraiment nouveaux', () => {
    const profile = makeProfile({ badges: [BADGES.first_copy, BADGES.oral_done] });
    const { newBadges } = evaluateBadges({ profile, trigger: 'score', score: 16 });
    expect(newBadges).toContain(BADGES.score_15);
    expect(newBadges).not.toContain(BADGES.first_copy);
    expect(newBadges).not.toContain(BADGES.oral_done);
  });
});
