// ============================================================
// Types partagés — Nexus Réussite EAF MCP Server
// ============================================================

// --- Plans d'abonnement ---
export type SubscriptionPlan = 'FREE' | 'MONTHLY' | 'LIFETIME'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'

// --- Axes de compétences (SkillMap) ---
export type SkillAxis = 'ecrit' | 'oral' | 'langue' | 'oeuvres' | 'methode'

export interface SkillMapEntry {
  axis: SkillAxis
  score: number            // 0.0 à 1.0
  lastUpdated: string      // ISO date
  trend: 'up' | 'down' | 'stable'
}

export interface SkillMap {
  axes: SkillMapEntry[]
  updatedAt: string
}

// --- Profil élève ---
export interface StudentProfile {
  id: string
  userId: string
  displayName: string
  eafDate: string | null
  daysUntilEaf: number | null
  selectedOeuvres: string[]
  weakSkills: string[]
  plan: SubscriptionPlan
  xp: number
  level: number
  streak: number
  maxStreak: number
  skillMap?: SkillMap
}

// --- ErrorBank ---
export type ErrorType =
  | 'contresens'
  | 'hors_sujet'
  | 'problematique_floue'
  | 'plan_desequilibre'
  | 'citation_incorrecte'
  | 'analyse_superficielle'
  | 'registre_incorrect'
  | 'grammaire_conjugaison'
  | 'grammaire_syntaxe'
  | 'procede_mal_nomme'
  | 'oral_debit'
  | 'oral_couverture_mouvements'
  | 'oral_hors_temps'

export type ErrorSeverity = 'minor' | 'major' | 'critical'

export interface ErrorBankItem {
  id: string
  errorType: ErrorType
  errorContext: string
  nextRevision: string
  revisionCount: number
  severity: ErrorSeverity
  microExercise: string | null
  archivedAt: string | null
  createdAt: string
}

// --- Corpus RAG ---
export type AuthorityLevel = 'A' | 'B' | 'C' | 'D'
export type DocType = 'bareme' | 'programme' | 'annale' | 'methodologie' | 'oeuvre' | 'autre'

export interface CorpusChunk {
  id: string
  title: string
  excerpt: string
  sourceUrl: string
  authorityLevel: AuthorityLevel
  score: number
  docType: DocType
  publishedAt: string | null
  legalBasis: string | null
}

// --- Parcours / Planning ---
export type TaskType = 'ecrit' | 'oral' | 'langue' | 'quiz' | 'revision'
export type TaskPriority = 'urgent' | 'high' | 'normal'

export interface StudyTask {
  id: string
  type: TaskType
  title: string
  rationale: string
  estimatedMinutes: number
  priority: TaskPriority
  isErrorBankRevision: boolean
  completed: boolean
  link: string
}

export interface StudyDay {
  date: string
  dayLabel: string
  tasks: StudyTask[]
}

// --- Évaluations ---
export type EpreuveType = 'commentaire' | 'dissertation'
export type CorrectionStatus = 'pending' | 'processing' | 'done' | 'error'
export type OralPhase = 'lecture' | 'explication' | 'grammaire' | 'entretien'

export interface CriterionResult {
  id: string
  label: string
  score: number
  maxScore: number
  evidence: string
  feedback: string
}

export interface OralPhaseResult {
  phase: OralPhase
  score: number
  maxScore: number
  feedback: string
  pointsForts: string[]
  axesProgres: string[]
}

// --- Compliance ---
export type ComplianceRuleId =
  | 'R-AIACT-01'
  | 'R-AIACT-02'
  | 'R-FRAUD-01'
  | 'R-RGPD-01'
  | 'R-RGPD-02'
  | 'R-COPY-01'
  | 'R-COPY-02'
  | 'R-CITE-01'
  | 'R-SCOPE-01'

export interface ComplianceViolation {
  ruleId: ComplianceRuleId
  severity: 'block' | 'warn'
  reason: string
  remediation: string
}

// --- Agents ---
export type AgentSkill =
  | 'diagnosticien'
  | 'coach-oral'
  | 'rag-librarian'
  | 'correcteur'
  | 'quiz-maitre'
  | 'coach-ecrit'
  | 'tuteur-libre'
  | 'avocat-diable'
  | 'rapport-auto'
  | 'rappel-agent'
  | 'admin'
  | 'system'

// --- Réponse MCP standard ---
export interface MCPToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  errorCode?: string
}

// --- Contexte d'appel ---
export interface CallContext {
  agentSkill: AgentSkill
  studentId?: string
  requestId: string
  timestamp: string
}
