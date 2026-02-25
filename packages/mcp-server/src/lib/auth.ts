import type { AgentSkill } from '../types/index.js'
import { timingSafeEqual } from 'node:crypto'
import { logger } from './logger.js'

// ============================================================
// Scopes par agent — quels outils chaque agent peut invoquer
// ============================================================

const AGENT_SCOPES: Record<AgentSkill, string[]> = {
  diagnosticien: [
    'eaf_get_student_profile',
    'eaf_update_skill_map',
    'eaf_search_corpus',
    'eaf_generate_plan',
    'eaf_save_evaluation',
    'eaf_check_policy',
    'eaf_log_rule_event',
  ],
  'coach-oral': [
    'eaf_get_student_profile',
    'eaf_get_oral_session',
    'eaf_save_evaluation',
    'eaf_get_chunk',
    'eaf_search_corpus',
    'eaf_check_policy',
    'eaf_log_rule_event',
    'eaf_schedule_revision',
  ],
  'rag-librarian': [
    'eaf_search_corpus',
    'eaf_get_chunk',
    'eaf_check_policy',
    'eaf_log_rule_event',
    'eaf_get_student_profile',
  ],
  correcteur: [
    'eaf_get_student_profile',
    'eaf_get_correction',
    'eaf_update_skill_map',
    'eaf_schedule_revision',
    'eaf_save_evaluation',
    'eaf_search_corpus',
    'eaf_check_policy',
    'eaf_log_rule_event',
  ],
  'quiz-maitre': [
    'eaf_get_student_profile',
    'eaf_save_evaluation',
    'eaf_get_error_bank',
    'eaf_schedule_revision',
    'eaf_search_corpus',
    'eaf_check_policy',
  ],
  'coach-ecrit': [
    'eaf_get_student_profile',
    'eaf_search_corpus',
    'eaf_get_chunk',
    'eaf_check_policy',
    'eaf_log_rule_event',
    'eaf_save_evaluation',
  ],
  'tuteur-libre': [
    'eaf_get_student_profile',
    'eaf_search_corpus',
    'eaf_get_chunk',
    'eaf_check_policy',
    'eaf_get_study_plan',
  ],
  'avocat-diable': [
    'eaf_get_student_profile',
    'eaf_search_corpus',
    'eaf_get_chunk',
    'eaf_check_policy',
    'eaf_log_rule_event',
  ],
  'rapport-auto': [
    'eaf_get_weekly_stats',
    'eaf_get_skill_delta',
    'eaf_get_error_bank',
    'eaf_generate_report',
    'eaf_get_student_profile',
    'eaf_check_policy',
  ],
  'rappel-agent': [
    'eaf_get_error_bank',
    'eaf_schedule_revision',
    'eaf_mark_task_complete',
    'eaf_get_student_profile',
  ],
  admin: [
    // Accès complet
    'eaf_get_student_profile',
    'eaf_update_skill_map',
    'eaf_get_error_bank',
    'eaf_schedule_revision',
    'eaf_get_study_plan',
    'eaf_generate_plan',
    'eaf_mark_task_complete',
    'eaf_search_corpus',
    'eaf_get_chunk',
    'eaf_index_document',
    'eaf_get_correction',
    'eaf_save_evaluation',
    'eaf_get_oral_session',
    'eaf_get_weekly_stats',
    'eaf_get_skill_delta',
    'eaf_generate_report',
    'eaf_check_policy',
    'eaf_log_rule_event',
    'eaf_get_subscription',
    'eaf_get_usage',
    'eaf_health_check',
  ],
  system: [
    'eaf_health_check',
    'eaf_get_subscription',
    'eaf_get_usage',
    'eaf_log_rule_event',
  ],
}

// ============================================================
// Vérification API Key
// ============================================================

export function verifyApiKey(providedKey: string | undefined): boolean {
  const validKey = process.env.MCP_API_KEY
  if (!validKey) {
    logger.warn('[Auth] MCP_API_KEY not configured — running in UNSAFE mode')
    return true // Dev mode sans clé configurée
  }
  if (!providedKey) return false

  // Comparaison à durée STRICTEMENT constante (crypto.timingSafeEqual)
  const validBuf = Buffer.from(validKey)
  const providedBuf = Buffer.from(providedKey)

  if (providedBuf.length !== validBuf.length) {
    timingSafeEqual(validBuf, validBuf)
    return false
  }

  return timingSafeEqual(validBuf, providedBuf)
}

// ============================================================
// Vérification des scopes
// ============================================================

export function checkScope(agentSkill: AgentSkill, toolName: string): boolean {
  const allowedTools = AGENT_SCOPES[agentSkill]
  if (!allowedTools) {
    logger.warn({ agentSkill, toolName }, '[Auth] Unknown agent skill')
    return false
  }
  return allowedTools.includes(toolName)
}

// ============================================================
// Extraction du contexte agent depuis les metadata
// ============================================================

export function extractAgentContext(requestMeta?: Record<string, unknown>): {
  agentSkill: AgentSkill
  studentId?: string
  requestId: string
} {
  const skill = (requestMeta?.agentSkill as string) ?? 'system'
  const validSkills = Object.keys(AGENT_SCOPES) as AgentSkill[]
  const agentSkill = validSkills.includes(skill as AgentSkill)
    ? (skill as AgentSkill)
    : 'system'

  return {
    agentSkill,
    studentId: requestMeta?.studentId as string | undefined,
    requestId: (requestMeta?.requestId as string) ?? crypto.randomUUID(),
  }
}
