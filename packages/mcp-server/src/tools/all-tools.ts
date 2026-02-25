import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { getDb } from '../lib/db.js'

export const GetCorrectionSchema = z.object({
  copieId: z.string().min(1),
  studentId: z.string().min(1),
  includeOcrText: z.boolean().default(false),
})

export async function getCorrection(input: z.infer<typeof GetCorrectionSchema>) {
  const db = getDb()
  const copie = await db.copieDeposee.findFirst({
    where: { id: input.copieId, userId: input.studentId },
    include: { epreuve: true },
  })

  if (!copie) throw new Error(`Copie introuvable : ${input.copieId}`)

  return {
    id: copie.id,
    status: copie.status,
    epreuveType: copie.epreuve.type,
    oeuvre: copie.epreuve.type,
    submittedAt: copie.createdAt.toISOString(),
    correction: copie.correction ?? null,
    ...(input.includeOcrText ? { ocrText: copie.ocrText ?? null } : {}),
  }
}

export const SaveEvaluationSchema = z.object({
  studentId: z.string().min(1),
  evaluationType: z.enum(['quiz', 'langue', 'oral_phase', 'diagnostic']),
  score: z.number().min(0),
  maxScore: z.number().min(1),
  details: z.array(z.object({
    topicId: z.string(),
    correct: z.boolean(),
    studentAnswer: z.string(),
    correctAnswer: z.string(),
    explanation: z.string(),
  })),
  sessionId: z.string().optional(),
  triggerBadgeCheck: z.boolean().default(true),
})

export async function saveEvaluation(input: z.infer<typeof SaveEvaluationSchema>) {
  const db = getDb()
  const evaluation = await db.evaluation.create({
    data: {
      userId: input.studentId,
      kind: input.evaluationType,
      score: input.score,
      maxScore: input.maxScore,
      status: 'completed',
      payload: input.details,
    },
  })

  const ratio = input.score / input.maxScore
  const xpGained = Math.max(1, Math.round(10 * ratio))
  await db.studentProfile.update({
    where: { userId: input.studentId },
    data: { xp: { increment: xpGained } },
  }).catch(() => null)

  return {
    saved: true,
    evaluationId: evaluation.id,
    skillMapUpdated: false,
    xpGained,
    newBadges: [] as Array<{ id: string; label: string; icon: string }>,
    levelUp: undefined,
  }
}

export const GetOralSessionSchema = z.object({
  sessionId: z.string().min(1),
  studentId: z.string().min(1),
})

export async function getOralSession(input: z.infer<typeof GetOralSessionSchema>) {
  const db = getDb()
  const session = await db.oralSession.findFirst({
    where: { id: input.sessionId, userId: input.studentId },
  })

  if (!session) throw new Error(`Session orale introuvable : ${input.sessionId}`)

  return {
    id: session.id,
    oeuvre: session.oeuvre,
    extraitTitle: session.extrait,
    startedAt: session.createdAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    status: session.endedAt ? 'done' : 'pending',
    phases: [],
    totalScore: session.score ?? 0,
    totalMax: session.maxScore ?? 20,
    relancesJury: [],
    bilan: '',
  }
}

export const GeneratePlanSchema = z.object({
  studentId: z.string().min(1),
  forceRegenerate: z.boolean().default(false),
  constraints: z.object({
    availableDaysThisWeek: z.number().int().min(1).max(7).default(5),
    maxMinutesPerDay: z.number().int().min(15).max(180).default(45),
    focusAxis: z.string().optional(),
    avoidAxis: z.string().optional(),
  }).optional(),
})

export async function generatePlan(input: z.infer<typeof GeneratePlanSchema>) {
  const db = getDb()
  await db.memoryEvent.create({
    data: {
      userId: input.studentId,
      type: 'study_plan_generated',
      feature: 'planner',
      payload: { constraints: input.constraints ?? {} },
    },
  })

  return {
    generatedAt: new Date().toISOString(),
    weekLabel: getWeekLabel(new Date()),
    days: [],
    weeklyObjective: 'Consolider la progression sur les axes prioritaires',
  }
}

export const MarkTaskCompleteSchema = z.object({
  taskId: z.string().min(1),
  studentId: z.string().min(1),
  completedAt: z.string().optional(),
})

export async function markTaskComplete(input: z.infer<typeof MarkTaskCompleteSchema>) {
  const db = getDb()
  await db.memoryEvent.create({
    data: {
      userId: input.studentId,
      type: 'task_completed',
      feature: 'planner',
      payload: { taskId: input.taskId, completedAt: input.completedAt ?? new Date().toISOString() },
    },
  })

  await db.studentProfile.update({
    where: { userId: input.studentId },
    data: { xp: { increment: 5 } },
  }).catch(() => null)

  return {
    marked: true,
    xpGained: 5,
    streakUpdated: false,
    newStreak: 0,
    adherenceRate: 0,
  }
}

export const GetWeeklyStatsSchema = z.object({
  studentId: z.string().min(1),
  weekOffset: z.number().int().min(-52).max(0).default(0),
})

export async function getWeeklyStats(input: z.infer<typeof GetWeeklyStatsSchema>) {
  const db = getDb()
  const end = new Date()
  end.setDate(end.getDate() + input.weekOffset * 7)
  const start = new Date(end)
  start.setDate(end.getDate() - 7)

  // Évaluations complétées sur la période
  const evaluations = await db.evaluation.findMany({
    where: { userId: input.studentId, createdAt: { gte: start, lte: end } },
  })

  // Sessions planifiées : MemoryEvent de type task_planned/task_completed
  const plannedEvents = await db.memoryEvent.findMany({
    where: {
      userId: input.studentId,
      type: { in: ['task_planned', 'task_completed'] },
      createdAt: { gte: start, lte: end },
    },
  })

  const planned = plannedEvents.filter((event) => event.type === 'task_planned').length
  const completed = plannedEvents.filter((event) => event.type === 'task_completed').length

  const effectivePlanned = planned > 0 ? planned : Math.max(evaluations.length, 1)
  const effectiveCompleted = completed > 0 ? completed : evaluations.length
  const adherenceRate = effectivePlanned > 0
    ? Math.min(1, effectiveCompleted / effectivePlanned)
    : 0

  // Breakdown par type d'activité
  const activitiesBreakdown: Record<string, { count: number; avgScore: number | null }> = {}
  for (const ev of evaluations) {
    const kind = ev.kind
    if (!activitiesBreakdown[kind]) {
      activitiesBreakdown[kind] = { count: 0, avgScore: null }
    }
    activitiesBreakdown[kind].count++
    const prevAvg = activitiesBreakdown[kind].avgScore ?? 0
    activitiesBreakdown[kind].avgScore = Number(
      ((prevAvg * (activitiesBreakdown[kind].count - 1) + (ev.score / ev.maxScore)) /
        activitiesBreakdown[kind].count).toFixed(2)
    )
  }

  const xpEvents = await db.memoryEvent.findMany({
    where: { userId: input.studentId, type: 'xp_gained', createdAt: { gte: start, lte: end } },
  })
  const xpGained = xpEvents.reduce((sum, event) => {
    const payload = event.payload as { xp?: number } | null
    return sum + (payload?.xp ?? 0)
  }, 0)

  return {
    weekLabel: getWeekLabel(start),
    sessionsCompleted: effectiveCompleted,
    sessionsPlanned: effectivePlanned,
    adherenceRate: Number(adherenceRate.toFixed(2)),
    totalMinutes: evaluations.length * 30,
    activitiesBreakdown,
    errorBankStats: {
      newErrors: 0,
      revisionsCompleted: completed,
      revisionsSuccess: Math.round(completed * 0.7),
    },
    xpGained,
    streakChange: 0,
  }
}

export const GetSkillDeltaSchema = z.object({
  studentId: z.string().min(1),
  fromDate: z.string(),
  toDate: z.string().optional(),
  axes: z.array(z.string()).optional(),
})

export async function getSkillDelta(input: z.infer<typeof GetSkillDeltaSchema>) {
  const db = getDb()
  const fromDate = new Date(input.fromDate)
  const toDate = input.toDate ? new Date(input.toDate) : new Date()

  const evaluations = await db.evaluation.findMany({
    where: {
      userId: input.studentId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (evaluations.length === 0) {
    return {
      deltas: [],
      overallDelta: 0,
      strongestImprovement: 'aucune donnée',
      mostNeededWork: 'aucune donnée',
      evaluationsAnalyzed: 0,
    }
  }

  const axisScores: Record<string, { first: number; last: number; count: number }> = {}

  for (const evaluation of evaluations) {
    const payload = evaluation.payload as Record<string, unknown> | null
    if (!payload) continue

    const skillUpdates = (payload.skillUpdates ?? payload.updates) as Array<{
      axis?: string
      microSkillId?: string
      score?: number
      newScore?: number
    }> | undefined

    if (!Array.isArray(skillUpdates)) continue

    for (const update of skillUpdates) {
      const axis = update.axis ?? update.microSkillId?.split('_')[0]
      const score = update.score ?? update.newScore
      if (!axis || score === undefined) continue
      if (input.axes && !input.axes.includes(axis)) continue

      if (!axisScores[axis]) {
        axisScores[axis] = { first: score, last: score, count: 1 }
      } else {
        axisScores[axis].last = score
        axisScores[axis].count++
      }
    }
  }

  const deltas = Object.entries(axisScores).map(([axis, { first, last, count }]) => ({
    axis,
    fromScore: Number(first.toFixed(2)),
    toScore: Number(last.toFixed(2)),
    delta: Number((last - first).toFixed(2)),
    evaluationsCount: count,
  }))

  const overallDelta = deltas.length > 0
    ? Number((deltas.reduce((sum, delta) => sum + delta.delta, 0) / deltas.length).toFixed(2))
    : 0

  const sorted = [...deltas].sort((a, b) => b.delta - a.delta)
  const strongestImprovement = sorted[0]?.axis ?? 'aucune'
  const mostNeededWork = sorted[sorted.length - 1]?.axis ?? 'aucune'

  return {
    deltas,
    overallDelta,
    strongestImprovement,
    mostNeededWork,
    evaluationsAnalyzed: evaluations.length,
  }
}

export const GenerateReportSchema = z.object({
  studentId: z.string().min(1),
  weekOffset: z.number().int().default(-1),
  forceRegenerate: z.boolean().default(false),
})

export async function generateReport(input: z.infer<typeof GenerateReportSchema>) {
  const reportJobId = crypto.randomUUID()
  const db = getDb()
  await db.memoryEvent.create({
    data: {
      userId: input.studentId,
      type: 'report_requested',
      feature: 'rapport-auto',
      payload: { reportJobId, weekOffset: input.weekOffset },
    },
  })
  return {
    reportJobId,
    estimatedDurationSeconds: 30,
    pollUrl: `/api/v1/rapport/status/${reportJobId}`,
  }
}

export { checkPolicy, PolicyCheckInputSchema } from '../lib/policy-gate.js'

export const LogRuleEventSchema = z.object({
  ruleId: z.string().min(1),
  action: z.enum(['allow', 'deny', 'sanitize', 'warn']),
  reason: z.string().min(1),
  skill: z.string().min(1),
  studentId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function logRuleEvent(input: z.infer<typeof LogRuleEventSchema>) {
  const db = getDb()
  await db.memoryEvent.create({
    data: {
      userId: input.studentId ?? 'system',
      type: 'compliance_event',
      feature: input.skill,
      payload: {
        ruleId: input.ruleId,
        action: input.action,
        reason: input.reason,
        metadata: input.metadata ?? {},
      } as Prisma.InputJsonValue,
    },
  }).catch(() => null)

  return { logged: true, logId: crypto.randomUUID() }
}

export const GetSubscriptionSchema = z.object({
  studentId: z.string().min(1),
  feature: z.string().optional(),
})

const PLAN_LIMITS = {
  FREE: {
    epreuvesPerMonth: 3,
    correctionsPerMonth: 1,
    oralSessionsPerMonth: 2,
    tuteurMessagesPerDay: 10,
    quizPerDay: 3,
    adaptiveParcours: false,
    avocatDuDiable: false,
    spacedRepetition: false,
    rapportHebdo: false,
    graphRag: false,
  },
  MONTHLY: {
    epreuvesPerMonth: null,
    correctionsPerMonth: null,
    oralSessionsPerMonth: null,
    tuteurMessagesPerDay: null,
    quizPerDay: null,
    adaptiveParcours: true,
    avocatDuDiable: true,
    spacedRepetition: true,
    rapportHebdo: true,
    graphRag: false,
  },
  LIFETIME: {
    epreuvesPerMonth: null,
    correctionsPerMonth: null,
    oralSessionsPerMonth: null,
    tuteurMessagesPerDay: null,
    quizPerDay: null,
    adaptiveParcours: true,
    avocatDuDiable: true,
    spacedRepetition: true,
    rapportHebdo: true,
    graphRag: true,
  },
} as const

export async function getSubscription(input: z.infer<typeof GetSubscriptionSchema>) {
  const db = getDb()
  const subscription = await db.subscription.findUnique({
    where: { userId: input.studentId },
  }).catch(() => null)

  const plan = (subscription?.plan ?? 'FREE') as keyof typeof PLAN_LIMITS
  const limits = PLAN_LIMITS[plan]

  let featureCheck: { feature: string; allowed: boolean; reason?: string; upgradeUrl?: string } | undefined
  if (input.feature) {
    const value = limits[input.feature as keyof typeof limits]
    featureCheck = {
      feature: input.feature,
      allowed: value !== false,
      reason: value === false ? `Feature non disponible en plan ${plan}` : undefined,
      upgradeUrl: value === false ? '/pricing' : undefined,
    }
  }

  return {
    plan,
    status: subscription?.status ?? 'active',
    trialEndsAt: subscription?.trialEnd?.toISOString() ?? undefined,
    currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? undefined,
    featureCheck,
    usageToday: {},
  }
}

export const GetUsageSchema = z.object({
  studentId: z.string().min(1),
  period: z.enum(['today', 'month']).default('today'),
})

export async function getUsage(input: z.infer<typeof GetUsageSchema>) {
  const db = getDb()
  const prefix = input.period === 'today' ? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 7)
  const usage = await db.usageCounter.findMany({
    where: {
      userId: input.studentId,
      periodKey: { startsWith: prefix },
    },
  }).catch(() => [])

  return {
    period: input.period,
    usage: Object.fromEntries(
      usage.map((u) => [
        u.feature,
        {
          used: u.count,
          limit: null as number | null,
        },
      ])
    ),
  }
}

function getWeekLabel(date: Date): string {
  const monday = new Date(date)
  monday.setDate(date.getDate() - date.getDay() + 1)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  return `Semaine du ${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${friday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
}
