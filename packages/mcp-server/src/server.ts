import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { logger, logToolCall } from './lib/logger.js'
import { extractAgentContext, checkScope } from './lib/auth.js'
import { checkRateLimit } from './lib/redis.js'
import { checkDbHealth } from './lib/db.js'
import { checkRedisHealth } from './lib/redis.js'
import type { AgentSkill } from './types/index.js'

// Outils — Student
import {
  GetStudentProfileSchema, getStudentProfile,
  UpdateSkillMapSchema, updateSkillMap,
} from './tools/student/get-profile.js'
import {
  GetErrorBankSchema, getErrorBank,
  ScheduleRevisionSchema, scheduleRevision,
  GetStudyPlanSchema, getStudyPlan,
} from './tools/student/error-bank.js'

// Outils — RAG
import {
  SearchCorpusSchema, searchCorpus,
  GetChunkSchema, getChunk,
  IndexDocumentSchema, indexDocument,
} from './tools/rag/search-corpus.js'

// Outils — All others
import {
  GetCorrectionSchema, getCorrection,
  SaveEvaluationSchema, saveEvaluation,
  GetOralSessionSchema, getOralSession,
  GeneratePlanSchema, generatePlan,
  MarkTaskCompleteSchema, markTaskComplete,
  GetWeeklyStatsSchema, getWeeklyStats,
  GetSkillDeltaSchema, getSkillDelta,
  GenerateReportSchema, generateReport,
  PolicyCheckInputSchema, checkPolicy,
  LogRuleEventSchema, logRuleEvent,
  GetSubscriptionSchema, getSubscription,
  GetUsageSchema, getUsage,
} from './tools/all-tools.js'

// Ressources
import {
  RESOURCES,
  getStudentProfileResource,
  getEafRulesResource,
  getComplianceRulesResource,
} from './resources/index.js'

// Prompts
import {
  PROMPTS,
  getDiagnosticPrompt,
  getCorrectionFeedbackPrompt,
  getOralDebriefPrompt,
} from './prompts/index.js'

// ============================================================
// Définition de tous les outils (schémas JSON pour le LLM)
// ============================================================

const TOOL_DEFINITIONS = [
  // --- Student ---
  {
    name: 'eaf_get_student_profile',
    description: 'Récupère le profil pédagogique complet d\'un élève : SkillMap 5 axes, œuvres, date EAF, plan abonnement, XP, streak, révisions en attente.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string', description: 'ID unique de l\'élève (cuid)' },
        includeSkillMap: { type: 'boolean', description: 'Inclure la carte de compétences (défaut: true)' },
        includeHistory: { type: 'boolean', description: 'Inclure les 20 derniers événements (défaut: false)' },
      },
      required: ['studentId'],
    },
  },
  {
    name: 'eaf_update_skill_map',
    description: 'Met à jour les scores de compétences après une interaction. Détecte la stagnation (drift > 14j). Appeler après chaque correction, oral, quiz.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        sourceInteractionId: { type: 'string', description: 'ID de l\'interaction qui justifie la mise à jour (obligatoire pour traçabilité)' },
        sourceType: { type: 'string', enum: ['correction', 'oral_session', 'quiz', 'diagnostic', 'revision'] },
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              microSkillId: { type: 'string', description: 'ex: "ecrit_problematique", "oral_lecture"' },
              newScore: { type: 'number', minimum: 0, maximum: 1 },
              evidence: { type: 'string', description: 'Justification de la mise à jour' },
            },
            required: ['microSkillId', 'newScore', 'evidence'],
          },
        },
        computeDrift: { type: 'boolean', description: 'Calculer stagnation (défaut: true)' },
      },
      required: ['studentId', 'sourceInteractionId', 'sourceType', 'updates'],
    },
  },
  {
    name: 'eaf_get_error_bank',
    description: 'Récupère les erreurs de l\'élève avec scheduling Spaced Repetition. Par défaut retourne les révisions dues aujourd\'hui.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        filter: { type: 'string', enum: ['due_today', 'all_active', 'archived'], default: 'due_today' },
        errorTypes: { type: 'array', items: { type: 'string' }, description: 'Filtrer par type d\'erreur' },
        limit: { type: 'number', default: 10 },
      },
      required: ['studentId'],
    },
  },
  {
    name: 'eaf_schedule_revision',
    description: 'Crée une révision Spaced Repetition dans l\'ErrorBank après détection d\'une erreur. Schedule J+2/J+7/J+21 selon sévérité.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        errorType: { type: 'string', description: 'Type : contresens|hors_sujet|problematique_floue|plan_desequilibre|...' },
        errorContext: { type: 'string', description: 'Extrait exact de la copie concernée (10-500 chars)' },
        sourceInteractionId: { type: 'string' },
        severity: { type: 'string', enum: ['minor', 'major', 'critical'], default: 'major' },
      },
      required: ['studentId', 'errorType', 'errorContext', 'sourceInteractionId'],
    },
  },
  {
    name: 'eaf_get_study_plan',
    description: 'Récupère le plan de travail rolling 7j de l\'élève. Inclut les tâches du jour et les révisions ErrorBank urgentes.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        scope: { type: 'string', enum: ['today', 'week', 'full'], default: 'today' },
      },
      required: ['studentId'],
    },
  },
  // --- RAG ---
  {
    name: 'eaf_search_corpus',
    description: 'Recherche hybride (vectorielle pgvector + BM25) dans le corpus officiel EAF. Retourne chunks avec scores et sources. OBLIGATOIRE avant toute réponse normative.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Question en langage naturel' },
        filters: {
          type: 'object',
          properties: {
            authorityLevel: { type: 'string', enum: ['A', 'B', 'C', 'D'], description: 'A=Éduscol officiel' },
            docType: { type: 'string', enum: ['bareme', 'programme', 'annale', 'methodologie', 'oeuvre', 'autre'] },
            objetEtude: { type: 'string' },
            sessionYear: { type: 'number' },
          },
        },
        topK: { type: 'number', default: 8, maximum: 20 },
        rerank: { type: 'boolean', default: true },
        requireAuthorityA: { type: 'boolean', default: false, description: 'Si true, retourne vide si aucune source officielle A trouvée' },
      },
      required: ['query'],
    },
  },
  {
    name: 'eaf_get_chunk',
    description: 'Récupère un fragment de document par ID avec son contexte complet. Utile après search_corpus pour obtenir plus de détails.',
    inputSchema: {
      type: 'object',
      properties: {
        chunkId: { type: 'string' },
        includeNeighbors: { type: 'boolean', default: false },
        neighborWindow: { type: 'number', default: 1, maximum: 3 },
      },
      required: ['chunkId'],
    },
  },
  {
    name: 'eaf_index_document',
    description: '[ADMIN UNIQUEMENT] Indexe un nouveau document officiel dans le corpus RAG. Vérifie les droits d\'auteur (R-COPY-01) avant ingestion.',
    inputSchema: {
      type: 'object',
      properties: {
        sourceUrl: { type: 'string' },
        sourceOrg: { type: 'string' },
        authorityLevel: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
        docType: { type: 'string', enum: ['bareme', 'programme', 'annale', 'methodologie', 'oeuvre', 'autre'] },
        license: { type: 'string', enum: ['domaine_public', 'licence_expresse', 'citation_pedagogique'] },
        legalBasis: { type: 'string' },
        sessionYear: { type: 'number' },
        forceReindex: { type: 'boolean', default: false },
      },
      required: ['sourceUrl', 'sourceOrg', 'authorityLevel', 'docType', 'license', 'legalBasis', 'sessionYear'],
    },
  },
  // --- Evaluation ---
  {
    name: 'eaf_get_correction',
    description: 'Récupère le résultat complet d\'une correction de copie avec grille par critère et actions prioritaires.',
    inputSchema: {
      type: 'object',
      properties: {
        copieId: { type: 'string' },
        studentId: { type: 'string' },
        includeOcrText: { type: 'boolean', default: false },
      },
      required: ['copieId', 'studentId'],
    },
  },
  {
    name: 'eaf_save_evaluation',
    description: 'Enregistre le résultat d\'un quiz ou exercice. Met à jour l\'XP, vérifie les badges. Retourner après chaque évaluation.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        evaluationType: { type: 'string', enum: ['quiz', 'langue', 'oral_phase', 'diagnostic'] },
        score: { type: 'number' },
        maxScore: { type: 'number' },
        details: { type: 'array', items: { type: 'object' } },
        sessionId: { type: 'string' },
        triggerBadgeCheck: { type: 'boolean', default: true },
      },
      required: ['studentId', 'evaluationType', 'score', 'maxScore', 'details'],
    },
  },
  {
    name: 'eaf_get_oral_session',
    description: 'Récupère les données d\'une session de simulation orale avec grille 2/8/2/8.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        studentId: { type: 'string' },
      },
      required: ['sessionId', 'studentId'],
    },
  },
  // --- Planning ---
  {
    name: 'eaf_generate_plan',
    description: 'Génère le plan de travail rolling 7j adapté au profil cognitif, aux erreurs en attente, et au nombre de jours avant l\'EAF.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        forceRegenerate: { type: 'boolean', default: false },
        constraints: {
          type: 'object',
          properties: {
            availableDaysThisWeek: { type: 'number', default: 5 },
            maxMinutesPerDay: { type: 'number', default: 45 },
            focusAxis: { type: 'string' },
            avoidAxis: { type: 'string' },
          },
        },
      },
      required: ['studentId'],
    },
  },
  {
    name: 'eaf_mark_task_complete',
    description: 'Marque une tâche du plan comme complétée. Met à jour le streak et l\'adhérence. Appeler à la fin de chaque session.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        taskId: { type: 'string' },
        completedAt: { type: 'string' },
        result: { type: 'object' },
      },
      required: ['studentId', 'taskId'],
    },
  },
  // --- Analytics ---
  {
    name: 'eaf_get_weekly_stats',
    description: 'Statistiques agrégées de la semaine : sessions, adhérence, XP, ErrorBank. Utilisé par l\'agent Rapport Auto.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        weekOffset: { type: 'number', default: 0, description: '0=semaine courante, -1=semaine précédente' },
      },
      required: ['studentId'],
    },
  },
  {
    name: 'eaf_get_skill_delta',
    description: 'Évolution des compétences entre deux dates. Utilisé pour le dashboard et les rapports.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        fromDate: { type: 'string', description: 'Date ISO de début' },
        toDate: { type: 'string', description: 'Date ISO de fin (défaut: maintenant)' },
        axes: { type: 'array', items: { type: 'string' } },
      },
      required: ['studentId', 'fromDate'],
    },
  },
  {
    name: 'eaf_generate_report',
    description: 'Lance la génération asynchrone du rapport hebdomadaire PDF. Retourne un jobId pour polling.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        weekOffset: { type: 'number', default: -1 },
        forceRegenerate: { type: 'boolean', default: false },
      },
      required: ['studentId'],
    },
  },
  // --- Compliance ---
  {
    name: 'eaf_check_policy',
    description: 'Vérifie la conformité d\'un output LLM ou d\'une action. OBLIGATOIRE avant/après toute génération sensible. Vérifie R-AIACT-01, R-FRAUD-01, R-RGPD-01, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        checkType: { type: 'string', enum: ['pre_generation', 'post_generation'] },
        ruleIds: { type: 'array', items: { type: 'string' } },
        requestContext: { type: 'object' },
        llmOutput: { type: 'string' },
        outputType: { type: 'string', enum: ['feedback', 'exercice', 'question', 'correction'] },
      },
      required: ['checkType'],
    },
  },
  {
    name: 'eaf_log_rule_event',
    description: 'Enregistre un événement de compliance dans l\'audit trail immuable.',
    inputSchema: {
      type: 'object',
      properties: {
        ruleId: { type: 'string' },
        action: { type: 'string', enum: ['allow', 'deny', 'sanitize', 'warn'] },
        reason: { type: 'string' },
        skill: { type: 'string' },
        studentId: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['ruleId', 'action', 'reason', 'skill'],
    },
  },
  // --- Billing ---
  {
    name: 'eaf_get_subscription',
    description: 'Vérifie le plan actif et si une feature est disponible. Retourner avant d\'invoquer une feature premium.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        feature: { type: 'string', description: 'Feature à vérifier : avocatDuDiable|rapportHebdo|adaptiveParcours|...' },
      },
      required: ['studentId'],
    },
  },
  {
    name: 'eaf_get_usage',
    description: 'Retourne les compteurs d\'usage (journaliers/mensuels) pour un élève.',
    inputSchema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        period: { type: 'string', enum: ['today', 'month'], default: 'today' },
      },
      required: ['studentId'],
    },
  },
]

// ============================================================
// Routeur principal des outils
// ============================================================

async function routeTool(name: string, args: Record<string, unknown>, agentSkill: string, studentId?: string) {
  switch (name) {
    case 'eaf_get_student_profile':
      return getStudentProfile(GetStudentProfileSchema.parse(args))
    case 'eaf_update_skill_map':
      return updateSkillMap(UpdateSkillMapSchema.parse(args))
    case 'eaf_get_error_bank':
      return getErrorBank(GetErrorBankSchema.parse(args))
    case 'eaf_schedule_revision':
      return scheduleRevision(ScheduleRevisionSchema.parse(args))
    case 'eaf_get_study_plan':
      return getStudyPlan(GetStudyPlanSchema.parse(args))
    case 'eaf_search_corpus':
      return searchCorpus(SearchCorpusSchema.parse(args))
    case 'eaf_get_chunk':
      return getChunk(GetChunkSchema.parse(args))
    case 'eaf_index_document':
      if (agentSkill !== 'admin') throw new McpError(ErrorCode.MethodNotFound, 'eaf_index_document est réservé aux admins')
      return indexDocument(IndexDocumentSchema.parse(args))
    case 'eaf_get_correction':
      return getCorrection(GetCorrectionSchema.parse(args))
    case 'eaf_save_evaluation':
      return saveEvaluation(SaveEvaluationSchema.parse(args))
    case 'eaf_get_oral_session':
      return getOralSession(GetOralSessionSchema.parse(args))
    case 'eaf_generate_plan':
      return generatePlan(GeneratePlanSchema.parse(args))
    case 'eaf_mark_task_complete':
      return markTaskComplete(MarkTaskCompleteSchema.parse(args))
    case 'eaf_get_weekly_stats':
      return getWeeklyStats(GetWeeklyStatsSchema.parse(args))
    case 'eaf_get_skill_delta':
      return getSkillDelta(GetSkillDeltaSchema.parse(args))
    case 'eaf_generate_report':
      return generateReport(GenerateReportSchema.parse(args))
    case 'eaf_check_policy': {
      const input = PolicyCheckInputSchema.parse(args)
      return checkPolicy({
        ruleIds: input.ruleIds as unknown as undefined,
        requestContext: input.requestContext,
        llmOutput: input.llmOutput,
        outputType: input.outputType,
        agentSkill: agentSkill as AgentSkill,
        studentId,
      })
    }
    case 'eaf_log_rule_event':
      return logRuleEvent(LogRuleEventSchema.parse(args))
    case 'eaf_get_subscription':
      return getSubscription(GetSubscriptionSchema.parse(args))
    case 'eaf_get_usage':
      return getUsage(GetUsageSchema.parse(args))
    default:
      throw new McpError(ErrorCode.MethodNotFound, `Outil inconnu : ${name}`)
  }
}

// ============================================================
// Création du serveur MCP
// ============================================================

export function createServer(): Server {
  const server = new Server(
    {
      name: 'nexus-eaf-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  )

  // Handler : liste des outils
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS,
  }))

  // Handler : appel d'un outil
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params
    const args = (rawArgs ?? {}) as Record<string, unknown>

    // Extraire le contexte agent (passé via les meta ou les args)
    const agentContext = extractAgentContext(args._meta as Record<string, unknown> | undefined)
    const { agentSkill, studentId, requestId } = agentContext

    // Vérification du scope
    if (!checkScope(agentSkill, name)) {
      logger.warn({ tool: name, agentSkill, requestId }, '[Auth] Scope refusé')
      throw new McpError(
        ErrorCode.MethodNotFound,
        `L'agent '${agentSkill}' n'est pas autorisé à utiliser l'outil '${name}'`
      )
    }

    // Rate limiting
    if (studentId) {
      const maxPerMin = parseInt(process.env.MCP_RATE_LIMIT_PER_MINUTE ?? '100')
      const rateKey = `mcp:rate:${studentId}:${Math.floor(Date.now() / 60000)}`
      const { allowed, remaining } = await checkRateLimit(rateKey, maxPerMin, 60)

      if (!allowed) {
        throw new McpError(ErrorCode.InternalError, `Rate limit dépassé. ${remaining} requêtes restantes. Réessayer dans 60s.`)
      }
    }

    // Exécution avec timing
    const start = Date.now()
    try {
      // Nettoyer les args (supprimer les meta internes)
      const cleanArgs = { ...args }
      delete cleanArgs._meta

      const result = await routeTool(name, cleanArgs, agentSkill, studentId)
      const durationMs = Date.now() - start

      logToolCall({ tool: name, agentSkill, studentId, durationMs, success: true })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      }
    } catch (error) {
      const durationMs = Date.now() - start
      const message = error instanceof Error ? error.message : String(error)

      logToolCall({ tool: name, agentSkill, studentId, durationMs, success: false, error: message })

      if (error instanceof McpError) throw error
      if (error instanceof z.ZodError) {
        throw new McpError(ErrorCode.InvalidParams, `Paramètres invalides : ${error.issues.map((e) => e.message).join(', ')}`)
      }

      throw new McpError(ErrorCode.InternalError, `Erreur outil ${name} : ${message}`)
    }
  })

  // Handler : liste des ressources
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCES,
  }))

  // Handler : lecture d'une ressource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params

    // Profil élève
    const profileMatch = uri.match(/^nexus:\/\/student\/(.+)\/profile$/)
    if (profileMatch) {
      const content = await getStudentProfileResource(profileMatch[1])
      return { contents: [{ uri, mimeType: 'text/markdown', text: content }] }
    }

    if (uri === 'nexus://corpus/eaf-rules') {
      return { contents: [{ uri, mimeType: 'text/markdown', text: getEafRulesResource() }] }
    }

    if (uri === 'nexus://system/compliance-rules') {
      return { contents: [{ uri, mimeType: 'text/markdown', text: getComplianceRulesResource() }] }
    }

    throw new McpError(ErrorCode.InvalidRequest, `Ressource inconnue : ${uri}`)
  })

  // Handler : liste des prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS,
  }))

  // Handler : récupération d'un prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: promptArgs } = request.params

    let content = ''

    switch (name) {
      case 'eaf_diagnostic_prompt':
        content = await getDiagnosticPrompt(
          promptArgs?.studentId as string,
          promptArgs?.progressionMode as string | undefined
        )
        break

      case 'eaf_correction_feedback_prompt':
        content = getCorrectionFeedbackPrompt(
          promptArgs?.epreuveType as 'commentaire' | 'dissertation',
          promptArgs?.oeuvre as string
        )
        break

      case 'eaf_oral_debrief_prompt':
        content = getOralDebriefPrompt(
          promptArgs?.sessionId as string,
          promptArgs?.phase as string | undefined
        )
        break

      default:
        throw new McpError(ErrorCode.InvalidRequest, `Prompt inconnu : ${name}`)
    }

    return {
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: content },
        },
      ],
    }
  })

  // Health check au démarrage
  server.oninitialized = async () => {
    const dbHealth = await checkDbHealth()
    const redisHealth = await checkRedisHealth()

    logger.info(
      {
        db: dbHealth.healthy ? '✓' : '✗',
        dbLatency: `${dbHealth.latencyMs}ms`,
        redis: redisHealth.healthy ? '✓' : '✗',
        redisLatency: `${redisHealth.latencyMs}ms`,
      },
      '[MCP] Nexus EAF MCP Server prêt'
    )

    if (!dbHealth.healthy) {
      logger.error('[MCP] ⚠️ Base de données inaccessible — vérifier DATABASE_URL')
    }
  }

  return server
}
