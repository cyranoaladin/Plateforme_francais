import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { getDb } from '../../lib/db.js'
import type { StudentProfile, SkillAxis, SkillMap } from '../../types/index.js'

export const GetStudentProfileSchema = z.object({
  studentId: z.string().min(1, 'studentId requis'),
  includeSkillMap: z.boolean().default(true),
  includeHistory: z.boolean().default(false),
})

export type GetStudentProfileInput = z.infer<typeof GetStudentProfileSchema>

function toSkillAxis(value: string): SkillAxis {
  if (value === 'ecrit' || value === 'oral' || value === 'langue' || value === 'oeuvres' || value === 'methode') {
    return value
  }
  return 'methode'
}

export async function getStudentProfile(input: GetStudentProfileInput): Promise<StudentProfile> {
  const db = getDb()

  const user = await db.user.findUnique({
    where: { id: input.studentId },
    include: {
      profile: true,
      memoryEvents: input.includeHistory
        ? {
            orderBy: { createdAt: 'desc' },
            take: 20,
          }
        : false,
    },
  })

  if (!user) {
    throw new Error(`Élève introuvable : ${input.studentId}`)
  }

  const profile = (
    (user as unknown as { profile?: Record<string, unknown> | null }).profile
    ?? (user as unknown as { studentProfile?: Record<string, unknown> | null }).studentProfile
    ?? null
  )

  const eafDateRaw = profile?.eafDate
  const eafDate = eafDateRaw ? new Date(String(eafDateRaw)) : null
  const now = new Date()
  const daysUntilEaf = eafDate
    ? Math.max(0, Math.ceil((eafDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  let subscription: { plan?: string } | null = null
  try {
    subscription = await db.subscription.findUnique({
      where: { userId: input.studentId },
    })
  } catch {
    subscription = null
  }

  const plan = (subscription?.plan as 'FREE' | 'MONTHLY' | 'LIFETIME' | undefined) ?? 'FREE'

  let skillMap: SkillMap | undefined
  if (input.includeSkillMap) {
    const raw = profile?.skillMap
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        skillMap = parsed as SkillMap
      } catch {
        skillMap = undefined
      }
    }
  }

  return {
    id: user.id,
    userId: user.id,
    displayName: String(profile?.displayName ?? user.email.split('@')[0] ?? 'eleve'),
    eafDate: eafDate?.toISOString() ?? null,
    daysUntilEaf,
    selectedOeuvres: Array.isArray(profile?.selectedOeuvres) ? (profile?.selectedOeuvres as string[]) : [],
    weakSkills: Array.isArray(profile?.weakSkills) ? (profile?.weakSkills as string[]) : [],
    plan,
    xp: Number(profile?.xp ?? 0),
    level: Number(profile?.level ?? 1),
    streak: Number(profile?.streak ?? 0),
    maxStreak: Number(profile?.maxStreak ?? 0),
    skillMap,
  }
}

export const UpdateSkillMapSchema = z.object({
  studentId: z.string().min(1),
  sourceInteractionId: z.string().min(1, 'sourceInteractionId requis pour traçabilité'),
  sourceType: z.enum(['correction', 'oral_session', 'quiz', 'diagnostic', 'revision']),
  updates: z.array(z.object({
    microSkillId: z.string(),
    newScore: z.number().min(0).max(1),
    evidence: z.string().min(1),
  })).min(1),
  computeDrift: z.boolean().default(true),
})

export type UpdateSkillMapInput = z.infer<typeof UpdateSkillMapSchema>

export interface UpdateSkillMapResult {
  updated: boolean
  microSkillsUpdated: number
  newWeakSkills: string[]
  removedWeakSkills: string[]
  driftDetected?: {
    axis: string
    stuckSince: string
    recommendedIntervention: string
  }
}

export async function updateSkillMap(input: UpdateSkillMapInput): Promise<UpdateSkillMapResult> {
  const db = getDb()

  const profile = await db.studentProfile.findUnique({
    where: { userId: input.studentId },
  })

  if (!profile) {
    throw new Error(`Profil introuvable pour l'élève : ${input.studentId}`)
  }

  const currentWeakSkills = profile.weakSkills ?? []
  const WEAK_THRESHOLD = 0.45

  const updatesByAxis = new Map<SkillAxis, number>()
  for (const update of input.updates) {
    const axis = toSkillAxis(update.microSkillId.split('_')[0] ?? '')
    updatesByAxis.set(axis, update.newScore)
  }

  const newWeakSkillsList = Array.from(updatesByAxis.entries())
    .filter(([, score]) => score < WEAK_THRESHOLD)
    .map(([axis]) => axis)

  const newWeakSkills = newWeakSkillsList.filter((s) => !currentWeakSkills.includes(s))
  const removedWeakSkills = currentWeakSkills.filter((s) => !newWeakSkillsList.includes(s as SkillAxis))

  await db.studentProfile.update({
    where: { userId: input.studentId },
    data: {
      weakSkills: Array.from(new Set([...currentWeakSkills, ...newWeakSkills])).filter(
        (skill) => !removedWeakSkills.includes(skill)
      ),
    },
  })

  await db.memoryEvent.create({
    data: {
      userId: input.studentId,
      type: 'skill_map_update',
      feature: input.sourceType,
      payload: {
        sourceInteractionId: input.sourceInteractionId,
        updatesCount: input.updates.length,
        newWeakSkills,
        removedWeakSkills,
      } as Prisma.InputJsonValue,
    },
  })

  return {
    updated: true,
    microSkillsUpdated: input.updates.length,
    newWeakSkills,
    removedWeakSkills,
  }
}
