import { z } from 'zod'
import type { ComplianceRuleId, ComplianceViolation, AgentSkill } from '../types/index.js'
import { logComplianceEvent } from './logger.js'
import { getDb } from './db.js'

// ============================================================
// RÈGLES IMMUABLES — NE JAMAIS MODIFIER SANS VALIDATION LÉGALE
// ============================================================

const COMPLIANCE_RULES: Record<
  ComplianceRuleId,
  {
    description: string
    check: (ctx: PolicyCheckContext) => ViolationResult | null
  }
> = {
  'R-AIACT-01': {
    description: 'Interdiction inférence émotionnelle (AI Act — systèmes IA dans l\'éducation)',
    check: (ctx) => {
      if (!ctx.llmOutput) return null
      const emotionalPatterns = [
        /tu sembles (stressé|anxieux|confiant|motivé|découragé|fatigué)/i,
        /je (sens|détecte|perçois) que tu/i,
        /tu paraiss/i,
        /ton niveau d'(anxiété|stress|confiance)/i,
        /émotionnellement/i,
        /psychologiquement/i,
      ]
      for (const pattern of emotionalPatterns) {
        if (pattern.test(ctx.llmOutput)) {
          return {
            ruleId: 'R-AIACT-01',
            severity: 'block',
            reason: `Inférence émotionnelle détectée : "${ctx.llmOutput.match(pattern)?.[0]}"`,
            remediation:
              'Reformuler sans inférence d\'état émotionnel. Décrire uniquement les performances observables.',
          }
        }
      }
      return null
    },
  },

  'R-AIACT-02': {
    description: 'Aucun proctoring ou surveillance comportementale',
    check: (ctx) => {
      if (!ctx.requestContext?.userInput) return null
      const proctoringPatterns = [/surveill/i, /proctoring/i, /détect.*triche/i, /copie.*détect/i]
      for (const pattern of proctoringPatterns) {
        if (pattern.test(ctx.requestContext.userInput)) {
          return {
            ruleId: 'R-AIACT-02',
            severity: 'block',
            reason: 'Tentative d\'activation d\'un système de surveillance',
            remediation: 'La plateforme n\'implémente pas de proctoring (AI Act compliance).',
          }
        }
      }
      return null
    },
  },

  'R-FRAUD-01': {
    description: 'Pas de rédaction complète de copie (mode examen verrouillé)',
    check: (ctx) => {
      if (!ctx.llmOutput) return null
      // Détection: réponse longue ET contenant une structure explicite de dissertation/commentaire
      const wordCount = ctx.llmOutput.split(/\s+/).length
      const hasEssayStructure =
        /introduction|développement|conclusion|première partie|transition/i.test(ctx.llmOutput)
      const isExamMode = ctx.requestContext?.mode === 'examen'

      if (wordCount > 180 && hasEssayStructure && isExamMode) {
        return {
          ruleId: 'R-FRAUD-01',
          severity: 'block',
          reason: `Output potentiellement une rédaction complète (${wordCount} mots, structure essay détectée en mode examen)`,
          remediation:
            'Fournir uniquement des pistes, exemples partiels, ou plan. Jamais de texte complet rédigé.',
        }
      }
      return null
    },
  },

  'R-RGPD-01': {
    description: 'Consentement parental obligatoire pour les mineurs de moins de 15 ans',
    check: (ctx) => {
      if (ctx.requestContext?.studentAge === undefined) return null
      if (ctx.requestContext.studentAge < 15) {
        // La vérification du consentement parental se fait en amont (onboarding)
        // Ici on logue uniquement pour l'audit trail
        logComplianceEvent({
          ruleId: 'R-RGPD-01',
          action: 'warn',
          agentSkill: ctx.agentSkill,
          studentId: ctx.studentId,
          reason: `Élève mineur (${ctx.requestContext.studentAge} ans) — vérifier consentement parental`,
        })
      }
      return null // warn uniquement, pas de block (le block est géré à l'onboarding)
    },
  },

  'R-RGPD-02': {
    description: 'Minimisation et finalité des données',
    check: () => null, // Vérification structurelle, pas de pattern matching
  },

  'R-COPY-01': {
    description: 'Pas d\'ingestion d\'œuvres sous droits en intégral',
    check: (ctx) => {
      if (ctx.requestContext?.skill !== 'admin') return null
      // Vérifié dans l'outil eaf_index_document directement
      return null
    },
  },

  'R-COPY-02': {
    description: 'Extraits avec champ legal_basis obligatoire',
    check: () => null,
  },

  'R-CITE-01': {
    description: 'Toute réponse normative doit citer une source officielle',
    check: (ctx) => {
      if (!ctx.llmOutput) return null
      if (ctx.requestContext?.skill !== 'rag-librarian') return null

      const hasNormativeContent =
        /barème|programme officiel|bulletin officiel|éduscol|critère d'évaluation/i.test(
          ctx.llmOutput
        )
      const hasCitation = /\[Source:|source:|eduscol|education\.gouv/i.test(ctx.llmOutput)

      if (hasNormativeContent && !hasCitation) {
        return {
          ruleId: 'R-CITE-01',
          severity: 'warn',
          reason: 'Réponse normative sans citation de source officielle détectée',
          remediation:
            'Ajouter une citation avec [Source: titre] pour chaque affirmation normative.',
        }
      }
      return null
    },
  },

  'R-SCOPE-01': {
    description: 'La plateforme couvre uniquement la voie générale EAF',
    check: (ctx) => {
      if (!ctx.requestContext?.userInput) return null
      const outOfScope = /voie technologique|bac pro|BTN|BTS|CAP|baccalauréat technologique|STI2D|STMG|STL|STD2A/i.test(
        ctx.requestContext.userInput
      )
      if (outOfScope) {
        return {
          ruleId: 'R-SCOPE-01',
          severity: 'warn',
          reason: 'Demande hors scope détectée (voie non générale)',
          remediation:
            'Nexus Réussite EAF couvre uniquement la voie générale. Rediriger poliment l\'élève.',
        }
      }
      return null
    },
  },
}

// ============================================================
// Types internes
// ============================================================

type ViolationResult = Omit<ComplianceViolation, never>

interface PolicyCheckContext {
  agentSkill: AgentSkill
  studentId?: string
  ruleIds?: ComplianceRuleId[]
  requestContext?: {
    skill?: string
    userInput?: string
    studentAge?: number
    mode?: 'entrainement' | 'examen'
  }
  llmOutput?: string
  outputType?: 'feedback' | 'exercice' | 'question' | 'correction'
}

interface PolicyCheckResult {
  allowed: boolean
  violations: ComplianceViolation[]
  sanitizedOutput?: string
}

// ============================================================
// Fonction principale
// ============================================================

export async function checkPolicy(ctx: PolicyCheckContext): Promise<PolicyCheckResult> {
  const rulesToCheck = ctx.ruleIds ?? (Object.keys(COMPLIANCE_RULES) as ComplianceRuleId[])
  const violations: ComplianceViolation[] = []

  for (const ruleId of rulesToCheck) {
    const rule = COMPLIANCE_RULES[ruleId]
    if (!rule) continue

    const violation = rule.check(ctx)
    if (violation) {
      violations.push(violation)

      logComplianceEvent({
        ruleId: violation.ruleId,
        action: violation.severity === 'block' ? 'deny' : 'warn',
        agentSkill: ctx.agentSkill,
        studentId: ctx.studentId,
        reason: violation.reason,
      })
    }
  }

  const hasBlockingViolation = violations.some((v) => v.severity === 'block')
  const allowed = !hasBlockingViolation

  // Tentative de sanitisation pour les violations "warn" uniquement
  let sanitizedOutput: string | undefined
  if (!hasBlockingViolation && violations.length > 0 && ctx.llmOutput) {
    sanitizedOutput = sanitizeOutput(ctx.llmOutput, violations)
    if (sanitizedOutput !== ctx.llmOutput) {
      logComplianceEvent({
        ruleId: violations[0].ruleId,
        action: 'sanitize',
        agentSkill: ctx.agentSkill,
        studentId: ctx.studentId,
        reason: 'Output sanitisé automatiquement',
      })
    }
  }

  // Persister l'événement en DB si violation
  if (violations.length > 0) {
    await logComplianceEventToDb({
      agentSkill: ctx.agentSkill,
      studentId: ctx.studentId,
      violations,
      allowed,
    })
  }

  return { allowed, violations, sanitizedOutput }
}

function sanitizeOutput(output: string, violations: ComplianceViolation[]): string {
  let sanitized = output

  for (const violation of violations) {
    if (violation.ruleId === 'R-AIACT-01') {
      // Supprimer les inférences émotionnelles
      sanitized = sanitized
        .replace(/tu sembles (stressé|anxieux|confiant|motivé|découragé|fatigué)/gi, '')
        .replace(/je (sens|détecte|perçois) que tu/gi, 'il semble que tu')
    }
  }

  return sanitized.trim()
}

async function logComplianceEventToDb(params: {
  agentSkill: AgentSkill
  studentId?: string
  violations: ComplianceViolation[]
  allowed: boolean
}) {
  try {
    const db = getDb()
    const payload = {
      ruleIds: params.violations.map((v) => v.ruleId),
      action: params.allowed ? 'allow' : 'deny',
    }
    await db.memoryEvent.create({
      data: {
        userId: params.studentId ?? 'system',
        type: 'compliance_log',
        feature: params.agentSkill,
        payload,
      },
    })
  } catch {
    // Non-bloquant — le log DB est best-effort
  }
}

// Exporter les règles pour la ressource nexus://system/compliance-rules
export function getComplianceRulesMarkdown(): string {
  const rules = Object.entries(COMPLIANCE_RULES).map(([id, rule]) => {
    return `### ${id}\n**Description :** ${rule.description}\n`
  })

  return `# Règles de Compliance Immuables — Nexus Réussite EAF\n\n${rules.join('\n')}`
}

// Schéma Zod pour validation des inputs
export const PolicyCheckInputSchema = z.object({
  checkType: z.enum(['pre_generation', 'post_generation']),
  ruleIds: z.array(z.string()).optional(),
  requestContext: z
    .object({
      skill: z.string().optional(),
      userInput: z.string().optional(),
      studentAge: z.number().optional(),
      mode: z.enum(['entrainement', 'examen']).optional(),
    })
    .optional(),
  llmOutput: z.string().optional(),
  outputType: z.enum(['feedback', 'exercice', 'question', 'correction']).optional(),
})
