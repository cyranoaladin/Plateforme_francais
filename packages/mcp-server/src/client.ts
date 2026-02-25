/**
 * Client MCP — Nexus Réussite EAF
 * À placer dans src/lib/mcp/client.ts dans l'application Next.js
 *
 * Remplace les appels Prisma directs dans l'orchestrateur par
 * des appels MCP standardisés avec logging et rate limiting centralisés.
 */

type MCPToolName =
  | 'eaf_get_student_profile'
  | 'eaf_update_skill_map'
  | 'eaf_get_error_bank'
  | 'eaf_schedule_revision'
  | 'eaf_get_study_plan'
  | 'eaf_search_corpus'
  | 'eaf_get_chunk'
  | 'eaf_index_document'
  | 'eaf_get_correction'
  | 'eaf_save_evaluation'
  | 'eaf_get_oral_session'
  | 'eaf_generate_plan'
  | 'eaf_mark_task_complete'
  | 'eaf_get_weekly_stats'
  | 'eaf_get_skill_delta'
  | 'eaf_generate_report'
  | 'eaf_check_policy'
  | 'eaf_log_rule_event'
  | 'eaf_get_subscription'
  | 'eaf_get_usage'

type AgentSkill =
  | 'diagnosticien' | 'coach-oral' | 'rag-librarian' | 'correcteur'
  | 'quiz-maitre' | 'coach-ecrit' | 'tuteur-libre' | 'avocat-diable'
  | 'rapport-auto' | 'rappel-agent' | 'admin' | 'system'

interface MCPCallOptions {
  agentSkill: AgentSkill
  studentId?: string
  requestId?: string
}

class NexusMCPClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.MCP_SERVER_URL ?? 'http://localhost:3100'
    this.apiKey = process.env.MCP_API_KEY ?? ''
  }

  /**
   * Appelle un outil MCP via HTTP.
   * En développement avec stdio, utiliser NexusMCPStdioClient à la place.
   */
  async callTool<TResult = unknown>(
    toolName: MCPToolName,
    params: Record<string, unknown>,
    options: MCPCallOptions
  ): Promise<TResult> {
    const requestId = options.requestId ?? crypto.randomUUID()

    const body = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: {
          ...params,
          _meta: {
            agentSkill: options.agentSkill,
            studentId: options.studentId,
            requestId,
          },
        },
      },
    }

    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'X-Request-ID': requestId,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      throw new Error(`[MCP] HTTP ${response.status} — ${toolName}`)
    }

    const data = await response.json() as {
      result?: { content: [{ type: string; text: string }] }
      error?: { code: number; message: string }
    }

    if (data.error) {
      throw new Error(`[MCP] Erreur outil ${toolName} : ${data.error.message}`)
    }

    if (!data.result?.content?.[0]?.text) {
      throw new Error(`[MCP] Réponse invalide pour ${toolName}`)
    }

    return JSON.parse(data.result.content[0].text) as TResult
  }

  /**
   * Lit une ressource MCP (profil, règles corpus, compliance)
   */
  async readResource(uri: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
        method: 'resources/read',
        params: { uri },
      }),
    })

    const data = await response.json() as {
      result?: { contents: [{ text: string }] }
    }
    return data.result?.contents?.[0]?.text ?? ''
  }

  // ============================================================
  // Méthodes de commodité (API fluente)
  // ============================================================

  student = {
    getProfile: (studentId: string, agentSkill: AgentSkill) =>
      this.callTool('eaf_get_student_profile', { studentId }, { agentSkill, studentId }),

    updateSkillMap: (
      params: Record<string, unknown>,
      agentSkill: AgentSkill,
      studentId: string
    ) => this.callTool('eaf_update_skill_map', params, { agentSkill, studentId }),

    getErrorBank: (studentId: string, agentSkill: AgentSkill) =>
      this.callTool('eaf_get_error_bank', { studentId }, { agentSkill, studentId }),

    scheduleRevision: (params: Record<string, unknown>, agentSkill: AgentSkill) =>
      this.callTool('eaf_schedule_revision', params, {
        agentSkill,
        studentId: params.studentId as string,
      }),

    getStudyPlan: (studentId: string, agentSkill: AgentSkill) =>
      this.callTool('eaf_get_study_plan', { studentId }, { agentSkill, studentId }),
  }

  rag = {
    search: (query: string, options: Record<string, unknown>, agentSkill: AgentSkill) =>
      this.callTool('eaf_search_corpus', { query, ...options }, { agentSkill }),

    getChunk: (chunkId: string, agentSkill: AgentSkill) =>
      this.callTool('eaf_get_chunk', { chunkId }, { agentSkill }),
  }

  compliance = {
    checkPolicy: (params: Record<string, unknown>, agentSkill: AgentSkill, studentId?: string) =>
      this.callTool('eaf_check_policy', params, { agentSkill, studentId }),

    logEvent: (params: Record<string, unknown>, agentSkill: AgentSkill) =>
      this.callTool('eaf_log_rule_event', params, { agentSkill }),
  }

  billing = {
    getSubscription: (studentId: string, feature?: string) =>
      this.callTool('eaf_get_subscription', { studentId, feature }, { agentSkill: 'system', studentId }),
  }
}

// Singleton — une seule instance pour toute l'app
export const mcpClient = new NexusMCPClient()

// ============================================================
// Exemple d'intégration dans l'orchestrateur LLM
// ============================================================
//
// AVANT (appel Prisma direct dans orchestrator.ts) :
//
//   const profile = await prisma.studentProfile.findUnique({
//     where: { userId: studentId }
//   })
//
// APRÈS (via MCP avec logging et scope centralisés) :
//
//   const profile = await mcpClient.student.getProfile(studentId, 'diagnosticien')
//
// ============================================================
