import { describe, it, expect } from 'vitest';
import { evaluateBadges, BADGES } from '@/lib/gamification/badges';
import type { StudentProfile, MemoryEvent } from '@/lib/auth/types';

function makeProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    displayName: 'Test Élève',
    classLevel: 'Première générale',
    targetScore: '14/20',
    onboardingCompleted: false,
    selectedOeuvres: [],
    parcoursProgress: [],
    badges: [],
    preferredObjects: [],
    weakSkills: [],
    ...overrides,
  } as StudentProfile;
}

function makeEvent(daysAgo: number): MemoryEvent {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(12, 0, 0, 0);
  return {
    id: `event-${daysAgo}`,
    userId: 'user-test',
    type: 'session',
    feature: 'test',
    payload: {},
    createdAt: d.toISOString(),
  } as unknown as MemoryEvent;
}

describe('evaluateBadges', () => {
  it('attribue first_copy sur trigger first_copy', () => {
    const { badges, newBadges } = evaluateBadges({
      profile: makeProfile(),
      trigger: 'first_copy',
    });
    expect(badges).toContain(BADGES.first_copy);
    expect(newBadges).toHaveLength(1);
  });

  it('attribue score_15 si note > 15', () => {
    const { badges } = evaluateBadges({
      profile: makeProfile(),
      trigger: 'score',
      score: 16,
    });
    expect(badges).toContain(BADGES.score_15);
  });

  it("n'attribue pas score_15 si note = 15", () => {
    const { badges } = evaluateBadges({
      profile: makeProfile(),
      trigger: 'score',
      score: 15,
    });
    expect(badges).not.toContain(BADGES.score_15);
  });

  it('attribue oral_done sur trigger oral_done', () => {
    const { badges } = evaluateBadges({
      profile: makeProfile(),
      trigger: 'oral_done',
    });
    expect(badges).toContain(BADGES.oral_done);
  });

  it('attribue streak_7 après 7 jours consécutifs', () => {
    const timeline = [0, 1, 2, 3, 4, 5, 6].map(makeEvent);
    const { badges } = evaluateBadges({ profile: makeProfile(), timeline });
    expect(badges).toContain(BADGES.streak_7);
  });

  it('ne duplique pas un badge déjà existant', () => {
    const { newBadges } = evaluateBadges({
      profile: makeProfile({ badges: [BADGES.first_copy] }),
      trigger: 'first_copy',
    });
    expect(newBadges).toHaveLength(0);
  });

  it('streak_7 pas attribué si gap > 1 jour', () => {
    const timeline = [0, 1, 2, 4, 5, 6, 7].map(makeEvent);
    const { badges } = evaluateBadges({ profile: makeProfile(), timeline });
    expect(badges).not.toContain(BADGES.streak_7);
  });

  it('retourne un tableau vide de newBadges si aucun trigger', () => {
    const { newBadges } = evaluateBadges({ profile: makeProfile() });
    expect(newBadges).toHaveLength(0);
  });
});
