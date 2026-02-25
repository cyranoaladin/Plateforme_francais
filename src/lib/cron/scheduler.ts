import cron from 'node-cron';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { generateWeeklyReport } from '@/lib/agents/rapport-auto';
import { getOrRefreshPlan7Days } from '@/lib/agents/planner';
import { getDueErrorBankItems } from '@/lib/store/premium-store';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { listUsers } from '@/lib/db/repositories/userRepo';
import { sendTransactionalEmail } from '@/lib/email/client';
import { sendPushNotification } from '@/lib/notifications/push';
import { logger } from '@/lib/logger';
import { checkBudgetAlerts } from '@/lib/llm/cost-tracker';

async function activeUsersInLast14Days() {
  const now = Date.now();
  const cutoff = now - 14 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(cutoff);

  if (await isDatabaseAvailable()) {
    const users = await prisma.user.findMany({
      where: {
        memoryEvents: {
          some: {
            createdAt: {
              gte: cutoffDate,
            },
          },
        },
      },
      include: {
        profile: true,
      },
      take: 1000,
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      profile: {
        displayName: user.profile?.displayName ?? 'Élève',
        classLevel: user.profile?.classLevel ?? 'Première générale',
        targetScore: user.profile?.targetScore ?? '14/20',
        establishment: user.profile?.establishment ?? undefined,
        eafDate: user.profile?.eafDate?.toISOString(),
        onboardingCompleted: user.profile?.onboardingCompleted ?? false,
        selectedOeuvres: user.profile?.selectedOeuvres ?? [],
        classCode: user.profile?.classCode ?? undefined,
        parcoursProgress: user.profile?.parcoursProgress ?? [],
        badges: user.profile?.badges ?? [],
        preferredObjects: user.profile?.preferredObjects ?? [],
        weakSkills: user.profile?.weakSkills ?? ['Problématisation', 'Grammaire'],
        xp: user.profile?.xp ?? 0,
        level: user.profile?.level ?? 1,
        xpToNextLevel: user.profile?.xpToNextLevel ?? 100,
      },
    }));
  }

  const users = await listUsers();

  const active = [];
  for (const user of users) {
    const events = await listMemoryEventsByUser(user.id, 20);
    const hasRecent = events.some((item) => new Date(item.createdAt).getTime() >= cutoff);
    if (hasRecent) {
      active.push(user);
    }
  }

  return active;
}

function isNoSessionToday(events: Array<{ createdAt: string }>): boolean {
  const now = new Date();
  const todayKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
  return !events.some((event) => {
    const date = new Date(event.createdAt);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
    return key === todayKey;
  });
}

export function startScheduler() {
  logger.info({ route: 'scheduler' }, 'scheduler.start');

  cron.schedule('0 8 * * *', async () => {
    const users = await listUsers();
    for (const user of users) {
      try {
        const due = await getDueErrorBankItems(user.id);
        if (due.length === 0) continue;
        await sendPushNotification(
          user.id,
          '📚 Rappel Nexus',
          `Tu as ${due.length} révisions en attente aujourd'hui.`,
          '/cahier-erreurs',
        );
      } catch (error) {
        logger.warn({ error, userId: user.id, route: 'scheduler.8h' }, 'scheduler.job_failed');
      }
    }
  });

  cron.schedule('0 19 * * *', async () => {
    const users = await listUsers();
    for (const user of users) {
      try {
        const events = await listMemoryEventsByUser(user.id, 40);
        if (!isNoSessionToday(events)) continue;
        await sendPushNotification(
          user.id,
          '🔥 Streak Nexus',
          "Ta série est en danger. Lance une session aujourd'hui.",
          '/',
        );
      } catch (error) {
        logger.warn({ error, userId: user.id, route: 'scheduler.19h' }, 'scheduler.job_failed');
      }
    }
  });

  cron.schedule('0 20 * * 0', async () => {
    const users = await activeUsersInLast14Days();
    for (const user of users) {
      try {
        const report = await generateWeeklyReport(user.id);
        const displayName = user.profile?.displayName ?? 'Eleve';
        void sendTransactionalEmail({
          to: user.email,
          subject: 'Ton rapport hebdomadaire Nexus est prêt',
          html: `<p>Bonjour ${displayName},</p><p>Ton rapport hebdomadaire (${report.weekLabel}) est prêt. Connecte-toi pour le consulter.</p>`,
        }).catch(() => undefined);
        await sendPushNotification(
          user.id,
          '📊 Rapport Nexus',
          'Ton rapport hebdomadaire est prêt.',
          '/analytics',
        );
        logger.info({ userId: user.id, reportId: report.id, route: 'scheduler.20h.sunday' }, 'scheduler.report_ready');
      } catch (error) {
        logger.warn({ error, userId: user.id, route: 'scheduler.20h.sunday' }, 'scheduler.job_failed');
      }
    }
  });

  cron.schedule('0 6 * * 1', async () => {
    const users = await activeUsersInLast14Days();
    for (const user of users) {
      try {
        await getOrRefreshPlan7Days(user.id);
      } catch (error) {
        logger.warn({ error, userId: user.id, route: 'scheduler.6h.monday' }, 'scheduler.job_failed');
      }
    }
  });

  cron.schedule('0 * * * *', async () => {
    try {
      await checkBudgetAlerts();
    } catch (error) {
      logger.warn({ error, route: 'scheduler.hourly_budget' }, 'scheduler.job_failed');
    }
  });

  cron.schedule('0 3 1 * *', async () => {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

      await prisma.usageCounter.deleteMany();
      await prisma.llmCostLog.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } },
      });
      await prisma.memoryEvent.deleteMany({
        where: { createdAt: { lt: oneYearAgo } },
      });
    } catch (error) {
      logger.warn({ error, route: 'scheduler.monthly_cleanup' }, 'scheduler.job_failed');
    }
  });
}

/**
 * En production, les jobs sont déclenchés par /api/v1/cron/* via CRON_SECRET.
 * startScheduler() n'est appelé que pour le développement local via `npm run scheduler`.
 */
export const CRON_ROUTES = {
  weeklyReports: '/api/v1/cron/weekly-reports',
  revisionReminders: '/api/v1/cron/revision-reminders',
} as const;

if (process.env.START_SCHEDULER === 'true') {
  startScheduler();
}
