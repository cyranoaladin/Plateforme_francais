import { type StudentProfile } from '@/lib/auth/types';
import { type MemoryEvent } from '@/lib/auth/types';

export const BADGES = {
  first_copy: 'Première copie déposée 📝',
  quiz_perfect: 'Quiz parfait ⭐',
  streak_7: '7 jours de suite 🔥',
  oral_done: 'Oral simulé terminé 🎤',
  score_15: 'Note > 15 🏆',
} as const;

export type BadgeKey = keyof typeof BADGES;

type EvaluateInput = {
  profile: StudentProfile;
  trigger?: 'first_copy' | 'quiz_perfect' | 'oral_done' | 'score';
  score?: number;
  timeline?: MemoryEvent[];
};

function toDayKey(date: Date): string {
  // Format ISO YYYY-MM-DD UTC pour cohérence
  return date.toISOString().slice(0, 10);
}

function computeStreak(events: MemoryEvent[]): number {
  if (events.length === 0) return 0;

  const daySet = new Set(
    events.map((event) => toDayKey(new Date(event.createdAt))),
  );

  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  // Autoriser un gap d'un jour (l'élève n'a pas encore fait d'activité aujourd'hui)
  const todayKey = toDayKey(cursor);
  if (!daySet.has(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!daySet.has(toDayKey(cursor))) return 0;
  }

  let streak = 0;
  // Limite de sécurité : on ne remonte pas au-delà de 365 jours
  const limit = 365;

  for (let i = 0; i < limit; i++) {
    const key = toDayKey(cursor);
    if (!daySet.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export function evaluateBadges(input: EvaluateInput): { badges: string[]; newBadges: string[] } {
  const current = new Set(input.profile.badges ?? []);

  if (input.trigger === 'first_copy') {
    current.add(BADGES.first_copy);
  }

  if (input.trigger === 'quiz_perfect') {
    current.add(BADGES.quiz_perfect);
  }

  if (input.trigger === 'oral_done') {
    current.add(BADGES.oral_done);
  }

  if (input.trigger === 'score' && typeof input.score === 'number' && input.score > 15) {
    current.add(BADGES.score_15);
  }

  if (input.timeline && computeStreak(input.timeline) >= 7) {
    current.add(BADGES.streak_7);
  }

  const next = Array.from(current);
  const previous = new Set(input.profile.badges ?? []);
  const newBadges = next.filter((badge) => !previous.has(badge));

  return { badges: next, newBadges };
}
