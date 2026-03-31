import { Prisma, type AgentTypeEnum, type SummaryType } from '@prisma/client';
import { estimateTokens } from '@/lib/llm/token-estimate';
import type { Skill } from '@/lib/llm/skills/types';
import type { MemoryProfile } from '@/lib/memory/context-builder';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { getCurrentAnneeScolaire } from '@/lib/date/current-school-year';

const DEFAULT_PROFILE_DATA = {
  displayName: 'Élève',
  classLevel: 'Première générale',
  anneeScolaire: getCurrentAnneeScolaire(),
  targetScore: '14/20',
  onboardingCompleted: false,
  selectedOeuvres: [] as string[],
  parcoursProgress: [] as string[],
  badges: [] as string[],
  preferredObjects: [] as string[],
  weakSkills: [] as string[],
};

const SKILL_TO_AGENT_TYPE: Partial<Record<Skill, AgentTypeEnum>> = {
  bibliothecaire: 'BIBLIOTHECAIRE',
  coach_ecrit: 'COACH_ECRIT',
  coach_oral: 'COACH_EXPLICATION',
  correcteur: 'CORRECTEUR',
  quiz_maitre: 'QUIZ_MAITRE',
  tuteur_libre: 'TUTEUR_LIBRE',
  oral_tirage: 'TIRAGE_ORAL',
  coach_lecture: 'COACH_LECTURE',
  coach_explication: 'COACH_EXPLICATION',
  grammaire_ciblee: 'GRAMMAIRE_CIBLEE',
  oral_entretien: 'ENTRETIEN_OEUVRE',
  oral_bilan_officiel: 'BILAN_ORAL',
  ecrit_diagnostic: 'DIAGNOSTIC_ECRIT',
  ecrit_plans: 'COACH_ECRIT',
  ecrit_contraction: 'COACH_ECRIT',
  ecrit_essai: 'COACH_ECRIT',
  ecrit_langue: 'ECRIT_LANGUE',
  ecrit_baremage: 'COACH_ECRIT',
  revision_fiches: 'QUIZ_ADAPTATIF',
  quiz_adaptatif: 'QUIZ_ADAPTATIF',
  spaced_repetition: 'QUIZ_ADAPTATIF',
  oral_prep30: 'SHADOW_PREP',
  citations_procedes: 'COACH_EXPLICATION',
  carnet_lecture: 'QUIZ_ADAPTATIF',
  sr_planner: 'QUIZ_ADAPTATIF',
  support_produit: 'SUPPORT_PRODUIT',
  examinateur_virtuel: 'EXAMINATEUR_VIRTUEL',
  pastiche: 'PASTICHE',
};

function trimSummary(value: string, max = 1200): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

async function resolveProfileId(userId: string): Promise<string | null> {
  if (!await isDatabaseAvailable()) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return null;
  }

  const profile = await prisma.studentProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      ...DEFAULT_PROFILE_DATA,
    },
    select: { id: true },
  });

  return profile.id;
}

function buildSummaryContent(profile: MemoryProfile, summaryType: SummaryType): string {
  if (summaryType === 'RECENT_SESSIONS') {
    return profile.recentSessionsSummary ?? 'Aucune session récente consolidée.';
  }

  if (summaryType === 'WEAK_SKILLS') {
    if (profile.weakSkills.length === 0) {
      return 'Aucun signal faible actif identifié.';
    }
    return profile.weakSkills
      .slice(0, 8)
      .map((item) => `${item.skill} (${item.severity}) — ${item.pattern}, fréquence ${item.frequency}`)
      .join('\n');
  }

  if (summaryType === 'ORAL') {
    return [
      `Niveau global: ${profile.globalLevel}`,
      `Moyenne orale: ${profile.avgOralScore ?? 'n/a'}/20`,
      profile.currentWorkMastery ? `Œuvre en cours: ${profile.currentWorkMastery.workTitle} (${profile.currentWorkMastery.masteryLevel})` : '',
      profile.weakSkills.filter((item) => item.skill.startsWith('ORAL_')).slice(0, 5).map((item) => `${item.skill}: ${item.pattern}`).join('\n'),
    ].filter(Boolean).join('\n');
  }

  if (summaryType === 'ECRIT') {
    return [
      `Niveau global: ${profile.globalLevel}`,
      `Moyenne écrite: ${profile.avgEcritScore ?? 'n/a'}/20`,
      profile.weakSkills.filter((item) => item.skill.startsWith('ECRIT_') || item.skill.startsWith('TRANS_')).slice(0, 5).map((item) => `${item.skill}: ${item.pattern}`).join('\n'),
    ].filter(Boolean).join('\n');
  }

  return [
    `Niveau global: ${profile.globalLevel}`,
    `Moyenne orale: ${profile.avgOralScore ?? 'n/a'}/20`,
    `Moyenne écrite: ${profile.avgEcritScore ?? 'n/a'}/20`,
    `Total de traces récentes: ${profile.totalSessions}`,
    profile.recentSessionsSummary ? `Historique récent: ${profile.recentSessionsSummary}` : '',
    profile.currentWorkMastery ? `Maîtrise œuvre: ${profile.currentWorkMastery.workTitle}` : '',
  ].filter(Boolean).join('\n');
}

export async function createAgentInteractionRecord(input: {
  userId: string;
  skill: Skill;
  sessionId?: string;
  inputSummary: string;
  outputSummary: string;
  feedbackScore?: number | null;
  feedbackLabel?: string | null;
  tokensUsed: number;
  latencyMs: number;
  ragSourcesCount?: number;
}): Promise<void> {
  const profileId = await resolveProfileId(input.userId);
  const agentType = SKILL_TO_AGENT_TYPE[input.skill];
  if (!profileId || !agentType) {
    return;
  }

  await prisma.agentInteraction.create({
    data: {
      profileId,
      sessionId: input.sessionId,
      agentType,
      inputSummary: trimSummary(input.inputSummary),
      outputSummary: trimSummary(input.outputSummary),
      feedbackScore: input.feedbackScore ?? undefined,
      feedbackLabel: input.feedbackLabel ?? undefined,
      tokensUsed: input.tokensUsed,
      latencyMs: input.latencyMs,
      ragSourcesCount: input.ragSourcesCount ?? 0,
    },
  });
}

export async function touchWorkMastery(input: {
  userId: string;
  workId?: string | null;
  normalizedScore?: number | null;
  strongThemes?: string[];
  weakThemes?: string[];
  citationsKnown?: string[];
}): Promise<void> {
  if (!input.workId) {
    return;
  }

  const profileId = await resolveProfileId(input.userId);
  if (!profileId) {
    return;
  }

  const existing = await prisma.workMastery.findUnique({
    where: { profileId_workId: { profileId, workId: input.workId } },
  });

  const nextMasteryLevel = input.normalizedScore == null
    ? existing?.masteryLevel ?? 0
    : existing
      ? Number(((existing.masteryLevel * 0.7) + (input.normalizedScore * 0.3)).toFixed(3))
      : Number(input.normalizedScore.toFixed(3));

  const strongThemes = Array.from(new Set([
    ...safeArray(existing?.strongThemes),
    ...(input.strongThemes ?? []),
  ])).slice(0, 8);

  const weakThemes = Array.from(new Set([
    ...safeArray(existing?.weakThemes),
    ...(input.weakThemes ?? []),
  ])).slice(0, 8);

  const citationsKnown = Array.from(new Set([
    ...safeArray(existing?.citationsKnown),
    ...(input.citationsKnown ?? []),
  ])).slice(0, 12);

  await prisma.workMastery.upsert({
    where: { profileId_workId: { profileId, workId: input.workId } },
    update: {
      masteryLevel: nextMasteryLevel,
      strongThemes: strongThemes as Prisma.InputJsonValue,
      weakThemes: weakThemes as Prisma.InputJsonValue,
      citationsKnown: citationsKnown as Prisma.InputJsonValue,
      sessionsCount: { increment: 1 },
      lastSessionAt: new Date(),
    },
    create: {
      profileId,
      workId: input.workId,
      masteryLevel: nextMasteryLevel,
      strongThemes: strongThemes as Prisma.InputJsonValue,
      weakThemes: weakThemes as Prisma.InputJsonValue,
      citationsKnown: citationsKnown as Prisma.InputJsonValue,
      sessionsCount: 1,
      lastSessionAt: new Date(),
    },
  });
}

export async function refreshMemorySummaries(input: {
  userId: string;
  profile: MemoryProfile;
}): Promise<void> {
  const profileId = await resolveProfileId(input.userId);
  if (!profileId) {
    return;
  }

  const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const summaryTypes: SummaryType[] = ['FULL', 'ORAL', 'ECRIT', 'RECENT_SESSIONS', 'WEAK_SKILLS'];

  await prisma.$transaction(
    summaryTypes.map((summaryType) => {
      const content = trimSummary(buildSummaryContent(input.profile, summaryType), 4000);
      const tokenCount = estimateTokens([{ content }]);

      return prisma.memorySummary.upsert({
        where: { profileId_summaryType: { profileId, summaryType } },
        update: {
          content,
          tokenCount,
          generatedAt: new Date(),
          validUntil,
          version: { increment: 1 },
        },
        create: {
          profileId,
          summaryType,
          content,
          tokenCount,
          validUntil,
        },
      });
    }),
  );
}
