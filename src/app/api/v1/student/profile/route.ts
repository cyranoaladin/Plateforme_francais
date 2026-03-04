import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { type StudentProfile } from '@/lib/auth/types';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { studentProfileBodySchema } from '@/lib/validation/schemas';

export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const timeline = await listMemoryEventsByUser(auth.user.id, 250);
  const evals = timeline.filter((event) => event.type === 'evaluation');
  const scores = evals
    .map((event) => {
      const score = event.payload?.score;
      const max = event.payload?.max;
      if (typeof score === 'number' && typeof max === 'number' && max > 0) {
        return (score / max) * 20;
      }
      return typeof score === 'number' ? score : null;
    })
    .filter((value): value is number => typeof value === 'number');
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 10;

  const weak = evals
    .flatMap((event) => (Array.isArray(event.payload?.weakSkills) ? event.payload.weakSkills : []))
    .reduce<Record<string, number>>((acc, skill) => {
      acc[skill] = (acc[skill] ?? 0) + 1;
      return acc;
    }, {});

  const errorBank = Object.entries(weak)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({
      type,
      description: `Point à renforcer : ${type}.`,
      count,
      firstSeen: timeline[timeline.length - 1]?.createdAt ?? new Date().toISOString(),
    }));

  const now = new Date();
  const addDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const studyPlan = {
    tasks: [
      { id: 'sp-oral', description: 'Simulation orale 12+8 min', dueDate: addDays(1), estimatedMinutes: 25, skill: 'oral', priority: 'high' as const },
      { id: 'sp-gram', description: 'Question de grammaire sur phrase courte', dueDate: addDays(2), estimatedMinutes: 20, skill: 'grammaire', priority: 'medium' as const },
      { id: 'sp-ecrit', description: 'Plan détaillé de dissertation', dueDate: addDays(3), estimatedMinutes: 30, skill: 'ecrit', priority: 'medium' as const },
    ],
  };

  const response = {
    ...auth.user.profile,
    skillMap: {
      ecrit: Number(avg.toFixed(1)),
      oral: Number((avg + 0.4).toFixed(1)),
      grammaire: Number((avg - 0.2).toFixed(1)),
      lectureCursive: Number((avg + 0.1).toFixed(1)),
      lastUpdated: new Date().toISOString(),
    },
    errorBank,
    studyPlan,
    streak: auth.user.profile.parcoursProgress.length,
    totalSessions: timeline.filter((event) => event.type === 'navigation').length,
    totalCopies: timeline.filter((event) => event.feature.includes('copie')).length,
  };

  return NextResponse.json(response, { status: 200 });
}

export async function PUT(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, studentProfileBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const nextProfile: StudentProfile = {
    ...auth.user.profile,
    ...parsed.data,
    eafDate: parsed.data.eafDate ?? auth.user.profile.eafDate,
    selectedOeuvres: parsed.data.selectedOeuvres ?? auth.user.profile.selectedOeuvres,
    parcoursProgress: parsed.data.parcoursProgress ?? auth.user.profile.parcoursProgress,
    preferredObjects: parsed.data.preferredObjects ?? auth.user.profile.preferredObjects,
    weakSkills: parsed.data.weakSkills ?? auth.user.profile.weakSkills,
  };

  await updateUserProfile(auth.user.id, nextProfile);

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'interaction',
      feature: 'profile_update',
    }),
  );

  return NextResponse.json(nextProfile, { status: 200 });
}
