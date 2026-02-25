import { z } from 'zod'
import { getDb } from '../../lib/db.js'
import type { ErrorBankItem, ErrorType, ErrorSeverity, StudyTask } from '../../types/index.js'

interface ErrorBankRepo {
  findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
  findFirst: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
  count: (args: Record<string, unknown>) => Promise<number>
  create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
}

function getErrorBankRepo(): ErrorBankRepo | null {
  const db = getDb() as unknown as { errorBankItem?: ErrorBankRepo }
  return db.errorBankItem ?? null
}

export const GetErrorBankSchema = z.object({
  studentId: z.string().min(1),
  filter: z.enum(['due_today', 'all_active', 'archived']).default('due_today'),
  errorTypes: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(50).default(10),
})

export type GetErrorBankInput = z.infer<typeof GetErrorBankSchema>

export interface GetErrorBankResult {
  dueToday: ErrorBankItem[]
  totalActive: number
  totalArchived: number
  nextRevisionDate: string | null
}

export async function getErrorBank(input: GetErrorBankInput): Promise<GetErrorBankResult> {
  const repo = getErrorBankRepo()
  if (!repo) {
    return { dueToday: [], totalActive: 0, totalArchived: 0, nextRevisionDate: null }
  }

  const now = new Date()
  const where: Record<string, unknown> = { studentId: input.studentId }

  if (input.filter === 'due_today') {
    where.nextRevision = { lte: now }
    where.archivedAt = null
  } else if (input.filter === 'all_active') {
    where.archivedAt = null
  } else {
    where.archivedAt = { not: null }
  }

  if (input.errorTypes?.length) where.errorType = { in: input.errorTypes }

  const items = await repo.findMany({
    where,
    orderBy: [{ nextRevision: 'asc' }, { createdAt: 'asc' }],
    take: input.limit,
  })

  const totalActive = await repo.count({ where: { studentId: input.studentId, archivedAt: null } })
  const totalArchived = await repo.count({ where: { studentId: input.studentId, archivedAt: { not: null } } })
  const nextItem = await repo.findFirst({
    where: { studentId: input.studentId, archivedAt: null, nextRevision: { gt: now } },
    orderBy: { nextRevision: 'asc' },
  })

  return {
    dueToday: items.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ''),
      errorType: String(item.errorType ?? 'analyse_superficielle') as ErrorType,
      errorContext: String(item.errorContext ?? ''),
      nextRevision: new Date(String(item.nextRevision ?? now.toISOString())).toISOString(),
      revisionCount: Number(item.revisionCount ?? 0),
      severity: String(item.severity ?? 'major') as ErrorSeverity,
      microExercise: (item.microExercise as string | null | undefined) ?? null,
      archivedAt: item.archivedAt ? new Date(String(item.archivedAt)).toISOString() : null,
      createdAt: new Date(String(item.createdAt ?? now.toISOString())).toISOString(),
    })),
    totalActive,
    totalArchived,
    nextRevisionDate: nextItem?.nextRevision ? new Date(String(nextItem.nextRevision)).toISOString() : null,
  }
}

export const ScheduleRevisionSchema = z.object({
  studentId: z.string().min(1),
  errorType: z.string().min(1),
  errorContext: z.string().min(10).max(500),
  sourceInteractionId: z.string().min(1),
  severity: z.enum(['minor', 'major', 'critical']).default('major'),
})

export type ScheduleRevisionInput = z.infer<typeof ScheduleRevisionSchema>

interface ScheduleRevisionResult {
  created: boolean
  errorBankItemId: string
  scheduledRevisions: string[]
  pushNotificationScheduled: boolean
}

const REVISION_SCHEDULE: Record<ErrorSeverity, number[]> = {
  minor: [7, 21],
  major: [2, 7, 21],
  critical: [1, 3, 7, 21],
}

export async function scheduleRevision(input: ScheduleRevisionInput): Promise<ScheduleRevisionResult> {
  const repo = getErrorBankRepo()
  if (!repo) throw new Error('ErrorBank indisponible')

  const now = new Date()
  const schedule = REVISION_SCHEDULE[input.severity]
  const firstRevision = new Date(now)
  firstRevision.setDate(firstRevision.getDate() + schedule[0])

  const item = await repo.create({
    data: {
      studentId: input.studentId,
      errorType: input.errorType,
      errorContext: input.errorContext,
      sourceInteractionId: input.sourceInteractionId,
      severity: input.severity,
      nextRevision: firstRevision,
      revisionCount: 0,
      revisionSchedule: schedule,
    },
  })

  const scheduledRevisions = schedule.map((days: number) => {
    const date = new Date(now)
    date.setDate(date.getDate() + days)
    return date.toISOString()
  })

  const db = getDb() as unknown as { pushSubscription?: { findFirst: (args: Record<string, unknown>) => Promise<unknown> } }
  const hasPushSub = db.pushSubscription
    ? await db.pushSubscription.findFirst({ where: { userId: input.studentId } }).catch(() => null)
    : null

  return {
    created: true,
    errorBankItemId: String(item.id ?? ''),
    scheduledRevisions,
    pushNotificationScheduled: hasPushSub !== null,
  }
}

export const GetStudyPlanSchema = z.object({
  studentId: z.string().min(1),
  scope: z.enum(['today', 'week', 'full']).default('today'),
})

export type GetStudyPlanInput = z.infer<typeof GetStudyPlanSchema>

interface GetStudyPlanResult {
  generatedAt: string
  weekLabel: string
  todayTasks: (StudyTask & { isErrorBankRevision: boolean })[]
  weeklyObjective: string
  adherenceRate: number
}

export async function getStudyPlan(input: GetStudyPlanInput): Promise<GetStudyPlanResult> {
  const db = getDb()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const plan = await db.memoryEvent.findFirst({
    where: { userId: input.studentId, type: 'study_plan_generated' },
    orderBy: { createdAt: 'desc' },
  })

  if (!plan) {
    return {
      generatedAt: new Date().toISOString(),
      weekLabel: getWeekLabel(today),
      todayTasks: [],
      weeklyObjective: 'Aucun plan généré — lancer le Planner',
      adherenceRate: 0,
    }
  }

  return {
    generatedAt: plan.createdAt.toISOString(),
    weekLabel: getWeekLabel(today),
    todayTasks: [],
    weeklyObjective: 'Continuer les tâches prioritaires du jour',
    adherenceRate: 0,
  }
}

function getWeekLabel(date: Date): string {
  const monday = new Date(date)
  monday.setDate(date.getDate() - date.getDay() + 1)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  return `Semaine du ${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${friday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
}
