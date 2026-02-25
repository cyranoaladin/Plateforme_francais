import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { WeeklyReport } from '@/lib/types/premium'

export type RevisionPhase = 'j2' | 'j7' | 'j21'
export type SkillAxis = 'ecrit' | 'oral' | 'langue' | 'oeuvres' | 'methode'

export type RevisionAttempt = {
  date: string
  phase: RevisionPhase
  success: boolean
  notes?: string
}

export type ErrorBankItem = {
  id: string
  studentId: string
  errorType: string
  category: string
  microSkillId: string
  example: string
  correction: string
  sourceInteractionId: string
  sourceAgent: string
  createdAt: string
  dueDates: {
    j2: string
    j7: string
    j21: string
  }
  revisionHistory: RevisionAttempt[]
  resolved: boolean
}

export type SkillPoint = {
  microSkillId: string
  score: number
}

export type SkillMap = {
  studentId: string
  axes: Record<SkillAxis, SkillPoint[]>
  updatedAt: string
}

export type PlannedSession = {
  id: string
  title?: string
  type?: string
  completed?: boolean
}

export type StudyPlan = {
  studentId: string
  weeks?: Array<{
    week: number
    sessions: PlannedSession[]
  }>
  slots?: PlannedSession[]
  createdAt?: string
  updatedAt?: string
}

export type PremiumStore = {
  errorBankV2: ErrorBankItem[]
  skillMaps: Record<string, SkillMap>
  plansByStudent: Record<string, StudyPlan>
  diagnostics: Record<string, unknown[]>
  weeklyReports: Record<string, WeeklyReport[]>
}

const STORE_PATH = path.resolve(process.cwd(), '.data/premium-store.json')

let memoryStore: PremiumStore = {
  errorBankV2: [],
  skillMaps: {},
  plansByStudent: {},
  diagnostics: {},
  weeklyReports: {},
}

let queue: Promise<void> = Promise.resolve()

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn)
  queue = next.then(() => undefined, () => undefined)
  return next
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
}

async function loadStoreFromDisk(): Promise<PremiumStore> {
  await ensureDataDir()
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw) as Partial<PremiumStore>
    return {
      errorBankV2: parsed.errorBankV2 ?? [],
      skillMaps: parsed.skillMaps ?? {},
      plansByStudent: parsed.plansByStudent ?? {},
      diagnostics: parsed.diagnostics ?? {},
      weeklyReports: parsed.weeklyReports ?? {},
    }
  } catch {
    return memoryStore
  }
}

async function saveStoreToDisk(store: PremiumStore): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

function addDays(baseIso: string, days: number): string {
  const d = new Date(baseIso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString()
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
  }
}

export async function writePremiumStore(updater: (current: PremiumStore) => PremiumStore): Promise<void> {
  await withLock(async () => {
    const current = await loadStoreFromDisk()
    const next = updater(current)
    memoryStore = next
    await saveStoreToDisk(next)
  })
}

export async function addErrorBankItem(input: {
  studentId: string
  errorType: string
  category: string
  microSkillId: string
  example: string
  correction: string
  sourceInteractionId: string
  sourceAgent: string
}): Promise<ErrorBankItem> {
  const createdAt = new Date().toISOString()
  const item: ErrorBankItem = {
    id: randomUUID(),
    createdAt,
    dueDates: {
      j2: addDays(createdAt, 2),
      j7: addDays(createdAt, 7),
      j21: addDays(createdAt, 21),
    },
    revisionHistory: [],
    resolved: false,
    ...input,
  }

  await writePremiumStore((current) => ({
    ...current,
    errorBankV2: [...current.errorBankV2, item],
  }))

  return item
}

export async function recordRevisionAttempt(errorId: string, attempt: RevisionAttempt): Promise<void> {
  await writePremiumStore((current) => ({
    ...current,
    errorBankV2: current.errorBankV2.map((item) => {
      if (item.id !== errorId) return item
      const revisionHistory = [...item.revisionHistory, attempt]
      const successCount = revisionHistory.filter((a) => a.success).length
      return {
        ...item,
        revisionHistory,
        resolved: successCount >= 3 ? true : item.resolved,
      }
    }),
  }))
}

export async function getErrorBankItems(studentId: string): Promise<ErrorBankItem[]> {
  const current = await loadStoreFromDisk()
  return current.errorBankV2.filter((item) => item.studentId === studentId)
}

export async function getDueErrorBankItems(studentId: string): Promise<ErrorBankItem[]> {
  const now = Date.now()
  const items = await getErrorBankItems(studentId)
  return items.filter((item) => {
    if (item.resolved) return false
    const attempts = item.revisionHistory.length
    if (attempts === 0) return new Date(item.dueDates.j2).getTime() <= now
    if (attempts === 1) return new Date(item.dueDates.j7).getTime() <= now
    if (attempts === 2) return new Date(item.dueDates.j21).getTime() <= now
    return false
  })
}

export function createDefaultSkillMap(studentId: string): SkillMap {
  return createEmptySkillMap(studentId)
}

export async function getOrCreateSkillMap(studentId: string): Promise<SkillMap> {
  const current = await loadStoreFromDisk()
  const existing = current.skillMaps[studentId]
  if (existing) return existing

  const created = createEmptySkillMap(studentId)
  await writePremiumStore((store) => ({
    ...store,
    skillMaps: { ...store.skillMaps, [studentId]: created },
  }))
  return created
}

export async function updateSkillMap(
  studentId: string,
  updates: Array<{ microSkillId: string; score: number }>,
): Promise<SkillMap> {
  const map = await getOrCreateSkillMap(studentId)
  const next: SkillMap = {
    ...map,
    axes: { ...map.axes },
    updatedAt: new Date().toISOString(),
  }

  for (const update of updates) {
    const axis = update.microSkillId.split('_')[0] as SkillAxis
    if (!next.axes[axis]) continue
    const boundedScore = Math.max(0, Math.min(1, update.score))
    const index = next.axes[axis].findIndex((item) => item.microSkillId === update.microSkillId)
    if (index >= 0) {
      next.axes[axis][index] = { microSkillId: update.microSkillId, score: boundedScore }
    } else {
      next.axes[axis] = [...next.axes[axis], { microSkillId: update.microSkillId, score: boundedScore }]
    }
  }

  await writePremiumStore((current) => ({
    ...current,
    skillMaps: {
      ...current.skillMaps,
      [studentId]: next,
    },
  }))
  return next
}

export async function saveStudyPlan(plan: StudyPlan): Promise<void> {
  await writePremiumStore((current) => ({
    ...current,
    plansByStudent: { ...current.plansByStudent, [plan.studentId]: plan },
  }))
}

export async function getPlan7Days(studentId: string): Promise<StudyPlan | null> {
  const current = await loadStoreFromDisk()
  return current.plansByStudent[studentId] ?? null
}

export async function saveDiagnosticResult(result: { studentId: string; [key: string]: unknown }): Promise<void> {
  await writePremiumStore((current) => {
    const currentList = current.diagnostics[result.studentId] ?? []
    return {
      ...current,
      diagnostics: {
        ...current.diagnostics,
        [result.studentId]: [...currentList, result],
      },
    }
  })
}

export async function getLatestWeeklyReport(studentId: string): Promise<WeeklyReport | null> {
  const current = await loadStoreFromDisk()
  const reports = current.weeklyReports[studentId] ?? []
  return reports.length > 0 ? reports[reports.length - 1] : null
}

export async function saveWeeklyReport(report: WeeklyReport): Promise<void> {
  await writePremiumStore((current) => {
    const list = current.weeklyReports[report.studentId] ?? []
    return {
      ...current,
      weeklyReports: {
        ...current.weeklyReports,
        [report.studentId]: [...list, report],
      },
    }
  })
}
