export type SkillAxis = 'ecrit' | 'oral' | 'langue' | 'oeuvres' | 'methode'

export type PlannedSession = {
  id: string
  week?: number
  day?: number
  type?: string
  durationMin?: number
  objectives?: string[]
  resourceIds?: string[]
  completed?: boolean
  title?: string
}

export type SkillMap = {
  studentId: string
  axes: Record<SkillAxis, Array<{ microSkillId: string; score: number }>>
  updatedAt: string
}

export type StudyPlan = {
  studentId: string
  weeks: Array<{ week: number; sessions: PlannedSession[] }>
  slots?: PlannedSession[]
  createdAt: string
  updatedAt: string
}

export type DiagnosticRequest = {
  studentId: string
  displayName?: string
  age?: number
  progressionMode: string
  selfAssessment?: {
    ecrit: number
    oral: number
    langue: number
  }
  sampleWriting?: string
  sampleOralTranscript?: string
}

export type DiagnosticResult = {
  id: string
  studentId: string
  completedAt: string
  durationMinutes: number
  input: Record<string, unknown>
  skillMap: SkillMap
  priorities: string[]
  risks: string[]
  studyPlanId: string
  llmProvider: 'ollama' | 'openai' | 'mock' | 'mistral_reasoning' | 'mistral_large' | 'mistral_standard' | 'mistral_micro' | 'mistral_ocr'
}

export type WeeklyReport = {
  id: string
  studentId: string
  weekLabel: string
  generatedAt: string
  skillMapDelta: Array<{ axis: SkillAxis; current: number; delta: number }>
  sessionsStats: { planned: number; completed: number; adherenceRate: number }
  topErrors: Array<{ errorType: string; context: string }>
  prediction: string
  nextWeekFocus: string[]
  pdfUrl: string
}

export type AgentResponse = {
  skill: string
  status: 'ok' | 'error'
  data: Record<string, unknown>
  citations: Array<{ title: string; url: string }>
  logs: Array<Record<string, unknown>>
}

export type RubricResult = {
  criteria: Array<{
    id: string
    label: string
    score: number
    max: number
    evidence?: string
  }>
}

export type ErrorType =
  | 'problematique_floue'
  | 'plan_desequilibre'
  | 'citation_absente'
  | 'syntaxe_erreur'
  | 'transition_absente'
  | 'hors_sujet'
  | 'lecture_monotone'
  | 'procede_mal_nomme'
  | 'grammaire_erreur'
  | 'entretien_superficiel'
  | 'autre'
