import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { type StudentProfile } from '@/lib/auth/types';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { sendParentNotificationEmail, sendTeacherNotificationEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';
import { createMemoryEvent } from '@/lib/memory/store';
import { ensureLinkedRoleAccount } from '@/lib/auth/linked-role-accounts';
import { buildProfileScoreSummary } from '@/lib/profile/profile-score-summary';
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

  const profileScoreSummary = buildProfileScoreSummary(scores, scores.length > 0 ? new Date().toISOString() : null);

  const studyPlan = {
    tasks: [
      { id: 'sp-oral', description: 'Simulation orale 12+8 min', dueDate: addDays(1), estimatedMinutes: 25, skill: 'oral', priority: 'high' as const },
      { id: 'sp-gram', description: 'Question de grammaire sur phrase courte', dueDate: addDays(2), estimatedMinutes: 20, skill: 'grammaire', priority: 'medium' as const },
      { id: 'sp-ecrit', description: 'Plan détaillé de dissertation', dueDate: addDays(3), estimatedMinutes: 30, skill: 'ecrit', priority: 'medium' as const },
    ],
  };

  const response = {
    ...auth.user.profile,
    skillMap: profileScoreSummary.skillMap,
    hasEvaluationData: profileScoreSummary.hasEvaluationData,
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

  try {
    const nextProfile: StudentProfile = {
      ...auth.user.profile,
      ...parsed.data,
      eafDate: parsed.data.eafDate ?? auth.user.profile.eafDate,
      selectedOeuvres: parsed.data.selectedOeuvres ?? auth.user.profile.selectedOeuvres,
      parcoursProgress: parsed.data.parcoursProgress ?? auth.user.profile.parcoursProgress,
      preferredObjects: parsed.data.preferredObjects ?? auth.user.profile.preferredObjects,
      weakSkills: parsed.data.weakSkills ?? auth.user.profile.weakSkills,
      lecturesCursives: parsed.data.lecturesCursives ?? auth.user.profile.lecturesCursives ?? [],
      parentEmail: parsed.data.parentEmail?.trim().toLowerCase() ?? auth.user.profile.parentEmail ?? null,
      teacherEmail: parsed.data.teacherEmail?.trim().toLowerCase() ?? auth.user.profile.teacherEmail ?? null,
    };

    const oldParentEmail = auth.user.profile.parentEmail as string | null | undefined;
    const oldTeacherEmail = auth.user.profile.teacherEmail as string | null | undefined;

    await updateUserProfile(auth.user.id, nextProfile);

    // Non-blocking: don't let memory event failure block profile save
    createMemoryEventRecord(
      createMemoryEvent(auth.user.id, {
        type: 'interaction',
        feature: 'profile_update',
      }),
    ).catch((err) => {
      logger.warn({ err, userId: auth.user.id }, 'profile.memoryEvent.failed');
    });

    // Send notification if parentEmail was added or changed
    const newParentEmail = nextProfile.parentEmail as string | null | undefined;
    if (newParentEmail && newParentEmail !== oldParentEmail) {
      ensureLinkedRoleAccount({
        email: newParentEmail,
        role: 'parent',
        studentDisplayName: nextProfile.displayName,
      }).then((parentAccount) => {
        if (parentAccount.status === 'existing') {
          sendParentNotificationEmail({
            parentEmail: newParentEmail,
            studentFirstName: nextProfile.displayName?.trim().split(' ')[0] || '',
          }).then((r) => {
            if (r.success) logger.info({ emailId: r.id, type: 'parent-notification-profile' }, 'E-mail parent envoyé depuis mise à jour profil');
          }).catch((err) => {
            logger.error({ err, type: 'parent-notification-profile' }, 'Échec envoi e-mail parent depuis profil');
          });
        }
      }).catch((err) => {
        logger.error({ err, type: 'parent-linked-account' }, 'Échec création compte parent lié');
      });
    }

    // Send notification if teacherEmail was added or changed
    const newTeacherEmail = nextProfile.teacherEmail as string | null | undefined;
    if (newTeacherEmail && newTeacherEmail !== oldTeacherEmail) {
      ensureLinkedRoleAccount({
        email: newTeacherEmail,
        role: 'enseignant',
        studentDisplayName: nextProfile.displayName,
      }).then((teacherAccount) => {
        if (teacherAccount.status === 'existing') {
          sendTeacherNotificationEmail({
            teacherEmail: newTeacherEmail,
            studentFirstName: nextProfile.displayName?.trim().split(' ')[0] || '',
          }).then((r) => {
            if (r.success) logger.info({ emailId: r.id, type: 'teacher-notification-profile' }, 'E-mail enseignant envoyé depuis mise à jour profil');
          }).catch((err) => {
            logger.error({ err, type: 'teacher-notification-profile' }, 'Échec envoi e-mail enseignant depuis profil');
          });
        }
      }).catch((err) => {
        logger.error({ err, type: 'teacher-linked-account' }, 'Échec création compte enseignant lié');
      });
    }

    return NextResponse.json(nextProfile, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil';
    logger.error({ err, userId: auth.user.id }, 'profile.update.failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
