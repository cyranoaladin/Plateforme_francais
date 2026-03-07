import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Prisma, SkillTrend, WeakStatus, type EafSkill, type RevisionPhase as PrismaRevisionPhase, type WeakSeverity } from '@prisma/client';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import type { WeeklyReport } from '@/lib/types/premium';

export type RevisionPhase = 'j2' | 'j7' | 'j21';
export type SkillAxis = 'ecrit' | 'oral' | 'langue' | 'oeuvres' | 'methode';

export type RevisionAttempt = {
  date: string;
  phase: RevisionPhase;
  success: boolean;
  notes?: string;
};

export type ErrorBankItem = {
  id: string;
  studentId: string;
  errorType: string;
  category: string;
  microSkillId: string;
  example: string;
  correction: string;
  sourceInteractionId: string;
  sourceAgent: string;
  createdAt: string;
  dueDates: {
    j2: string;
    j7: string;
    j21: string;
  };
  revisionHistory: RevisionAttempt[];
  resolved: boolean;
};

export type SkillPoint = {
  microSkillId: string;
  score: number;
};

export type SkillMap = {
  studentId: string;
  axes: Record<SkillAxis, SkillPoint[]>;
  updatedAt: string;
};

export type PlannedSession = {
  id: string;
  title?: string;
  type?: string;
  completed?: boolean;
};

export type StudyPlan = {
  studentId: string;
  weeks?: Array<{
    week: number;
    sessions: PlannedSession[];
  }>;
  slots?: PlannedSession[];
  createdAt?: string;
  updatedAt?: string;
};

export type PremiumStore = {
  errorBankV2: ErrorBankItem[];
  skillMaps: Record<string, SkillMap>;
  plansByStudent: Record<string, StudyPlan>;
  diagnostics: Record<string, unknown[]>;
  weeklyReports: Record<string, WeeklyReport[]>;
};

const STORE_PATH = path.resolve(process.cwd(), '.data/premium-store.json');

const DEFAULT_PROFILE_DATA = {
  displayName: 'Élève',
  classLevel: 'Première générale',
  targetScore: '14/20',
  onboardingCompleted: false,
  selectedOeuvres: [] as string[],
  parcoursProgress: [] as string[],
  badges: [] as string[],
  preferredObjects: [] as string[],
  weakSkills: [] as string[],
};

const MICRO_SKILL_MAP: Record<string, { axis: SkillAxis; skill: EafSkill }> = {
  ecrit_problematique: { axis: 'ecrit', skill: 'ECRIT_DISSERT_THESE' },
  ecrit_plan: { axis: 'ecrit', skill: 'ECRIT_COMMENT_PLAN' },
  ecrit_citations: { axis: 'ecrit', skill: 'ECRIT_COMMENT_CITATIONS' },
  ecrit_expression: { axis: 'ecrit', skill: 'TRANS_LANGUE_STYLE' },
  ecrit_transitions: { axis: 'ecrit', skill: 'ECRIT_DISSERT_TRANSITION' },
  ecrit_conclusion: { axis: 'ecrit', skill: 'ECRIT_COMMENT_ANALYSE' },
  ecrit_commentaire: { axis: 'ecrit', skill: 'ECRIT_COMMENT_ANALYSE' },
  ecrit_dissertation: { axis: 'ecrit', skill: 'ECRIT_DISSERT_THESE' },
  oral_lecture: { axis: 'oral', skill: 'ORAL_LECTURE_FLUIDITE' },
  oral_mouvements: { axis: 'oral', skill: 'ORAL_EXPLIC_MOUVEMENT' },
  oral_explication: { axis: 'oral', skill: 'ORAL_EXPLIC_ANALYSE' },
  oral_procedes: { axis: 'oral', skill: 'ORAL_EXPLIC_CITATIONS' },
  oral_grammaire: { axis: 'oral', skill: 'ORAL_GRAMM_ANALYSE' },
  oral_entretien: { axis: 'oral', skill: 'ORAL_ENTRETIEN_CONNAISSANCE' },
  langue_phrase_complexe: { axis: 'langue', skill: 'TRANS_LANGUE_SYNTAXE' },
  langue_interrogation: { axis: 'langue', skill: 'TRANS_LANGUE_SYNTAXE' },
  langue_negation: { axis: 'langue', skill: 'TRANS_LANGUE_GRAMMAIRE' },
  langue_relatives: { axis: 'langue', skill: 'TRANS_LANGUE_SYNTAXE' },
  langue_conjonctives: { axis: 'langue', skill: 'TRANS_LANGUE_SYNTAXE' },
  langue_concordance: { axis: 'langue', skill: 'TRANS_LANGUE_GRAMMAIRE' },
  langue_connecteurs: { axis: 'langue', skill: 'TRANS_LANGUE_STYLE' },
  oeuvres_reperes: { axis: 'oeuvres', skill: 'TRANS_CULTURE_GENERALE' },
  oeuvres_themes: { axis: 'oeuvres', skill: 'TRANS_CULTURE_GENERALE' },
  oeuvres_citations: { axis: 'oeuvres', skill: 'ECRIT_COMMENT_CITATIONS' },
  oeuvres_comparaisons: { axis: 'oeuvres', skill: 'TRANS_CULTURE_GENERALE' },
  oeuvres_cursives: { axis: 'oeuvres', skill: 'TRANS_CULTURE_GENERALE' },
  methode_temps: { axis: 'methode', skill: 'TRANS_TEMPS_GESTION' },
  methode_brouillon: { axis: 'methode', skill: 'TRANS_TEMPS_GESTION' },
  methode_relecture: { axis: 'methode', skill: 'TRANS_TEMPS_GESTION' },
  methode_orthographe: { axis: 'methode', skill: 'TRANS_LANGUE_GRAMMAIRE' },
  methode_strategie: { axis: 'methode', skill: 'TRANS_TEMPS_GESTION' },
};

const SKILL_TO_MICRO_FALLBACK: Partial<Record<EafSkill, string>> = {
  ECRIT_COMMENT_PLAN: 'ecrit_plan',
  ECRIT_COMMENT_ANALYSE: 'ecrit_commentaire',
  ECRIT_COMMENT_CITATIONS: 'ecrit_citations',
  ECRIT_DISSERT_THESE: 'ecrit_problematique',
  ECRIT_DISSERT_TRANSITION: 'ecrit_transitions',
  ECRIT_DISSERT_EXEMPLES: 'ecrit_citations',
  ORAL_LECTURE_FLUIDITE: 'oral_lecture',
  ORAL_LECTURE_EXPRESSIVITE: 'oral_lecture',
  ORAL_EXPLIC_MOUVEMENT: 'oral_mouvements',
  ORAL_EXPLIC_ANALYSE: 'oral_explication',
  ORAL_EXPLIC_CITATIONS: 'oral_procedes',
  ORAL_EXPLIC_OUVERTURE: 'oral_explication',
  ORAL_GRAMM_IDENTIFICATION: 'oral_grammaire',
  ORAL_GRAMM_ANALYSE: 'oral_grammaire',
  ORAL_ENTRETIEN_CONNAISSANCE: 'oral_entretien',
  ORAL_ENTRETIEN_REACTIVITE: 'oral_entretien',
  ORAL_ENTRETIEN_CULTURE: 'oeuvres_reperes',
  ORAL_ENTRETIEN_CRITIQUE: 'oral_entretien',
  TRANS_LANGUE_GRAMMAIRE: 'langue_negation',
  TRANS_LANGUE_STYLE: 'langue_connecteurs',
  TRANS_LANGUE_SYNTAXE: 'langue_phrase_complexe',
  TRANS_TEMPS_GESTION: 'methode_temps',
  TRANS_CULTURE_GENERALE: 'oeuvres_reperes',
};

let memoryStore: PremiumStore = {
  errorBankV2: [],
  skillMaps: {},
  plansByStudent: {},
  diagnostics: {},
  weeklyReports: {},
};

let queue: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.then(() => undefined, () => undefined);
  return next;
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function loadStoreFromDisk(): Promise<PremiumStore> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PremiumStore>;
    return {
      errorBankV2: parsed.errorBankV2 ?? [],
      skillMaps: parsed.skillMaps ?? {},
      plansByStudent: parsed.plansByStudent ?? {},
      diagnostics: parsed.diagnostics ?? {},
      weeklyReports: parsed.weeklyReports ?? {},
    };
  } catch {
    return memoryStore;
  }
}

async function saveStoreToDisk(store: PremiumStore): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function addDays(baseIso: string, days: number): string {
  const d = new Date(baseIso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function createEmptySkillMap(studentId: string): SkillMap {
  return {
    studentId,
    updatedAt: new Date().toISOString(),
    axes: {
      ecrit: [],
      oral: [],
      langue: [],
      oeuvres: [],
      methode: [],
    },
  };
}

function toPrismaRevisionPhase(phase: RevisionPhase): PrismaRevisionPhase {
  return phase.toUpperCase() as PrismaRevisionPhase;
}

function toLocalRevisionPhase(phase: PrismaRevisionPhase): RevisionPhase {
  return phase.toLowerCase() as RevisionPhase;
}

function inferAxis(microSkillId: string): SkillAxis {
  return MICRO_SKILL_MAP[microSkillId]?.axis ?? ((microSkillId.split('_')[0] as SkillAxis) || 'methode');
}

function mapMicroSkill(microSkillId: string): { axis: SkillAxis; skill: EafSkill } {
  const mapped = MICRO_SKILL_MAP[microSkillId];
  if (mapped) {
    return mapped;
  }

  const axis = inferAxis(microSkillId);
  if (axis === 'oral') return { axis, skill: 'ORAL_EXPLIC_ANALYSE' };
  if (axis === 'langue') return { axis, skill: 'TRANS_LANGUE_GRAMMAIRE' };
  if (axis === 'oeuvres') return { axis, skill: 'TRANS_CULTURE_GENERALE' };
  if (axis === 'methode') return { axis, skill: 'TRANS_TEMPS_GESTION' };
  return { axis: 'ecrit', skill: 'ECRIT_COMMENT_ANALYSE' };
}

function mapStoredMicroSkill(microSkillKey: string | null, skill: EafSkill): string {
  return microSkillKey ?? SKILL_TO_MICRO_FALLBACK[skill] ?? 'methode_temps';
}

function skillTrend(previousScore: number | null, nextScore: number): SkillTrend {
  if (previousScore === null) return 'STABLE';
  if (nextScore > previousScore + 0.05) return 'IMPROVING';
  if (nextScore < previousScore - 0.05) return 'DECLINING';
  return 'STABLE';
}

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function parseWeakSkillExamples(value: Prisma.JsonValue): Array<{ example: string; correction: string }> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }
      return {
        example: safeString((item as Record<string, unknown>).example),
        correction: safeString((item as Record<string, unknown>).correction),
      };
    })
    .filter((item): item is { example: string; correction: string } => item !== null);
}

async function resolveProfileId(studentId: string): Promise<string | null> {
  if (!await isDatabaseAvailable()) {
    return null;
  }

  const profile = await prisma.studentProfile.upsert({
    where: { userId: studentId },
    update: {},
    create: {
      user: { connect: { id: studentId } },
      ...DEFAULT_PROFILE_DATA,
    },
    select: { id: true },
  });

  return profile.id;
}

async function getSkillMapFromDb(studentId: string, profileId: string): Promise<SkillMap> {
  const entries = await prisma.skillMapEntry.findMany({
    where: { profileId },
    orderBy: { lastObservedAt: 'desc' },
  });

  if (entries.length === 0) {
    return createEmptySkillMap(studentId);
  }

  const axes = createEmptySkillMap(studentId).axes;
  let updatedAt = '1970-01-01T00:00:00.000Z';

  for (const entry of entries) {
    const microSkillId = mapStoredMicroSkill(entry.microSkillKey, entry.skill);
    const axis = inferAxis(microSkillId);
    axes[axis] = [...axes[axis], { microSkillId, score: entry.score }];
    const lastObservedAt = entry.lastObservedAt?.toISOString();
    if (lastObservedAt && lastObservedAt > updatedAt) {
      updatedAt = lastObservedAt;
    }
  }

  return {
    studentId,
    axes,
    updatedAt: updatedAt === '1970-01-01T00:00:00.000Z' ? new Date().toISOString() : updatedAt,
  };
}

function mapWeakSkillRecordToItem(
  studentId: string,
  entry: {
    id: string;
    pattern: string;
    category: string;
    microSkillKey: string | null;
    skill: EafSkill;
    examples: Prisma.JsonValue;
    sourceInteractionId: string | null;
    sourceAgent: string | null;
    firstDetectedAt: Date;
    status: WeakStatus;
    revisions: Array<{ phase: PrismaRevisionPhase; success: boolean; notes: string | null; createdAt: Date }>;
  },
): ErrorBankItem {
  const examples = parseWeakSkillExamples(entry.examples);
  const createdAt = entry.firstDetectedAt.toISOString();
  return {
    id: entry.id,
    studentId,
    errorType: entry.pattern,
    category: entry.category,
    microSkillId: mapStoredMicroSkill(entry.microSkillKey, entry.skill),
    example: examples[0]?.example ?? '',
    correction: examples[0]?.correction ?? '',
    sourceInteractionId: entry.sourceInteractionId ?? '',
    sourceAgent: entry.sourceAgent ?? '',
    createdAt,
    dueDates: {
      j2: addDays(createdAt, 2),
      j7: addDays(createdAt, 7),
      j21: addDays(createdAt, 21),
    },
    revisionHistory: entry.revisions
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((revision) => ({
        date: revision.createdAt.toISOString(),
        phase: toLocalRevisionPhase(revision.phase),
        success: revision.success,
        notes: revision.notes ?? undefined,
      })),
    resolved: entry.status === 'RESOLVED',
  };
}

function weakSeverityForError(input: {
  errorType: string;
  category: string;
  microSkillId: string;
}): WeakSeverity {
  const text = `${input.errorType} ${input.category} ${input.microSkillId}`.toLowerCase();
  if (text.includes('problematique') || text.includes('hors_sujet') || text.includes('entretien')) {
    return 'HIGH';
  }
  if (text.includes('grammaire') || text.includes('syntaxe')) {
    return 'MEDIUM';
  }
  return 'LOW';
}

export async function writePremiumStore(updater: (current: PremiumStore) => PremiumStore): Promise<void> {
  await withLock(async () => {
    const current = await loadStoreFromDisk();
    const next = updater(current);
    memoryStore = next;
    await saveStoreToDisk(next);
  });
}

export async function addErrorBankItem(input: {
  studentId: string;
  errorType: string;
  category: string;
  microSkillId: string;
  example: string;
  correction: string;
  sourceInteractionId: string;
  sourceAgent: string;
}): Promise<ErrorBankItem> {
  const createdAt = new Date().toISOString();
  const item: ErrorBankItem = {
    id: randomUUID(),
    studentId: input.studentId,
    errorType: input.errorType,
    category: input.category,
    microSkillId: input.microSkillId,
    example: input.example,
    correction: input.correction,
    sourceInteractionId: input.sourceInteractionId,
    sourceAgent: input.sourceAgent,
    createdAt,
    dueDates: {
      j2: addDays(createdAt, 2),
      j7: addDays(createdAt, 7),
      j21: addDays(createdAt, 21),
    },
    revisionHistory: [],
    resolved: false,
  };

  const profileId = await resolveProfileId(input.studentId);
  if (profileId) {
    const mapping = mapMicroSkill(input.microSkillId);
    await prisma.weakSkillEntry.create({
      data: {
        id: item.id,
        profileId,
        microSkillKey: input.microSkillId,
        skill: mapping.skill,
        pattern: input.errorType,
        category: input.category,
        examples: [{ example: input.example, correction: input.correction }] as Prisma.InputJsonValue,
        severity: weakSeverityForError(input),
        sourceInteractionId: input.sourceInteractionId,
        sourceAgent: input.sourceAgent,
        firstDetectedAt: new Date(createdAt),
        lastOccurrence: new Date(createdAt),
      },
    });
    return item;
  }

  await writePremiumStore((current) => ({
    ...current,
    errorBankV2: [...current.errorBankV2, item],
  }));

  return item;
}

export async function recordRevisionAttempt(errorId: string, attempt: RevisionAttempt): Promise<void> {
  if (await isDatabaseAvailable()) {
    const entry = await prisma.weakSkillEntry.findUnique({
      where: { id: errorId },
      include: { revisions: true },
    });
    if (entry) {
      await prisma.weakSkillRevision.create({
        data: {
          weakSkillEntryId: errorId,
          phase: toPrismaRevisionPhase(attempt.phase),
          success: attempt.success,
          notes: attempt.notes,
          createdAt: new Date(attempt.date),
        },
      });

      const successCount = entry.revisions.filter((item) => item.success).length + (attempt.success ? 1 : 0);
      await prisma.weakSkillEntry.update({
        where: { id: errorId },
        data: {
          status: successCount >= 3 ? 'RESOLVED' : attempt.success ? 'IMPROVING' : entry.status,
          resolvedAt: successCount >= 3 ? new Date(attempt.date) : null,
        },
      });
      return;
    }
  }

  await writePremiumStore((current) => ({
    ...current,
    errorBankV2: current.errorBankV2.map((item) => {
      if (item.id !== errorId) return item;
      const revisionHistory = [...item.revisionHistory, attempt];
      const successCount = revisionHistory.filter((entry) => entry.success).length;
      return {
        ...item,
        revisionHistory,
        resolved: successCount >= 3 ? true : item.resolved,
      };
    }),
  }));
}

export async function getErrorBankItems(studentId: string): Promise<ErrorBankItem[]> {
  const profileId = await resolveProfileId(studentId);
  if (profileId) {
    const items = await prisma.weakSkillEntry.findMany({
      where: { profileId },
      include: { revisions: true },
      orderBy: { firstDetectedAt: 'desc' },
    });
    return items.map((entry) => mapWeakSkillRecordToItem(studentId, entry));
  }

  const current = await loadStoreFromDisk();
  return current.errorBankV2.filter((item) => item.studentId === studentId);
}

export async function getDueErrorBankItems(studentId: string): Promise<ErrorBankItem[]> {
  const now = Date.now();
  const items = await getErrorBankItems(studentId);
  return items.filter((item) => {
    if (item.resolved) return false;
    const attempts = item.revisionHistory.length;
    if (attempts === 0) return new Date(item.dueDates.j2).getTime() <= now;
    if (attempts === 1) return new Date(item.dueDates.j7).getTime() <= now;
    if (attempts === 2) return new Date(item.dueDates.j21).getTime() <= now;
    return false;
  });
}

export function createDefaultSkillMap(studentId: string): SkillMap {
  return createEmptySkillMap(studentId);
}

export async function getOrCreateSkillMap(studentId: string): Promise<SkillMap> {
  const profileId = await resolveProfileId(studentId);
  if (profileId) {
    return getSkillMapFromDb(studentId, profileId);
  }

  const current = await loadStoreFromDisk();
  const existing = current.skillMaps[studentId];
  if (existing) return existing;

  const created = createEmptySkillMap(studentId);
  await writePremiumStore((store) => ({
    ...store,
    skillMaps: { ...store.skillMaps, [studentId]: created },
  }));
  return created;
}

export async function updateSkillMap(
  studentId: string,
  updates: Array<{ microSkillId: string; score: number }>,
): Promise<SkillMap> {
  const profileId = await resolveProfileId(studentId);
  if (profileId) {
    const keys = updates.map((item) => item.microSkillId);
    const existing = await prisma.skillMapEntry.findMany({
      where: { profileId, microSkillKey: { in: keys } },
    });
    const existingByKey = new Map(existing.map((entry) => [entry.microSkillKey ?? '', entry]));
    const now = new Date();

    await prisma.$transaction(
      updates.map((update) => {
        const boundedScore = Math.max(0, Math.min(1, update.score));
        const mapping = mapMicroSkill(update.microSkillId);
        const current = existingByKey.get(update.microSkillId);

        if (current) {
          return prisma.skillMapEntry.update({
            where: { id: current.id },
            data: {
              skill: mapping.skill,
              score: boundedScore,
              confidence: Math.min(1, current.confidence + 0.1),
              trend: skillTrend(current.score, boundedScore),
              observationCount: { increment: 1 },
              lastObservedAt: now,
            },
          });
        }

        return prisma.skillMapEntry.create({
          data: {
            profileId,
            microSkillKey: update.microSkillId,
            skill: mapping.skill,
            score: boundedScore,
            confidence: 0.3,
            trend: 'STABLE',
            observationCount: 1,
            lastObservedAt: now,
          },
        });
      }),
    );

    return getSkillMapFromDb(studentId, profileId);
  }

  const map = await getOrCreateSkillMap(studentId);
  const next: SkillMap = {
    ...map,
    axes: { ...map.axes },
    updatedAt: new Date().toISOString(),
  };

  for (const update of updates) {
    const axis = inferAxis(update.microSkillId);
    const boundedScore = Math.max(0, Math.min(1, update.score));
    const index = next.axes[axis].findIndex((item) => item.microSkillId === update.microSkillId);
    if (index >= 0) {
      next.axes[axis][index] = { microSkillId: update.microSkillId, score: boundedScore };
    } else {
      next.axes[axis] = [...next.axes[axis], { microSkillId: update.microSkillId, score: boundedScore }];
    }
  }

  await writePremiumStore((current) => ({
    ...current,
    skillMaps: {
      ...current.skillMaps,
      [studentId]: next,
    },
  }));
  return next;
}

export async function saveStudyPlan(plan: StudyPlan): Promise<void> {
  const profileId = await resolveProfileId(plan.studentId);
  if (profileId) {
    await prisma.studyPlanSnapshot.upsert({
      where: { profileId },
      update: {
        payload: plan as Prisma.InputJsonValue,
      },
      create: {
        profileId,
        payload: plan as Prisma.InputJsonValue,
      },
    });
    return;
  }

  await writePremiumStore((current) => ({
    ...current,
    plansByStudent: { ...current.plansByStudent, [plan.studentId]: plan },
  }));
}

export async function getPlan7Days(studentId: string): Promise<StudyPlan | null> {
  const profileId = await resolveProfileId(studentId);
  if (profileId) {
    const snapshot = await prisma.studyPlanSnapshot.findUnique({
      where: { profileId },
      select: { payload: true },
    });
    return (snapshot?.payload as StudyPlan | null) ?? null;
  }

  const current = await loadStoreFromDisk();
  return current.plansByStudent[studentId] ?? null;
}

export async function saveDiagnosticResult(result: { studentId: string; id?: string; completedAt?: string; [key: string]: unknown }): Promise<void> {
  const profileId = await resolveProfileId(result.studentId);
  if (profileId) {
    await prisma.diagnosticSnapshot.create({
      data: {
        id: typeof result.id === 'string' ? result.id : randomUUID(),
        profileId,
        payload: result as Prisma.InputJsonValue,
        completedAt: result.completedAt ? new Date(result.completedAt) : new Date(),
      },
    });
    return;
  }

  await writePremiumStore((current) => {
    const currentList = current.diagnostics[result.studentId] ?? [];
    return {
      ...current,
      diagnostics: {
        ...current.diagnostics,
        [result.studentId]: [...currentList, result],
      },
    };
  });
}

export async function getLatestWeeklyReport(studentId: string): Promise<WeeklyReport | null> {
  const profileId = await resolveProfileId(studentId);
  if (profileId) {
    const report = await prisma.weeklyReportSnapshot.findFirst({
      where: { profileId },
      orderBy: { generatedAt: 'desc' },
      select: { payload: true },
    });
    return (report?.payload as WeeklyReport | null) ?? null;
  }

  const current = await loadStoreFromDisk();
  const reports = current.weeklyReports[studentId] ?? [];
  return reports.length > 0 ? reports[reports.length - 1] : null;
}

export async function saveWeeklyReport(report: WeeklyReport): Promise<void> {
  const profileId = await resolveProfileId(report.studentId);
  if (profileId) {
    await prisma.weeklyReportSnapshot.create({
      data: {
        id: report.id,
        profileId,
        weekLabel: report.weekLabel,
        payload: report as Prisma.InputJsonValue,
        generatedAt: new Date(report.generatedAt),
      },
    });
    return;
  }

  await writePremiumStore((current) => {
    const list = current.weeklyReports[report.studentId] ?? [];
    return {
      ...current,
      weeklyReports: {
        ...current.weeklyReports,
        [report.studentId]: [...list, report],
      },
    };
  });
}
