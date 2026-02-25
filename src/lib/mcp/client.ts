/**
 * Client MCP Nexus EAF.
 * Server-side only.
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

interface MCPCallOptions {
  agentSkill: AgentSkill
  studentId?: string
  requestId?: string
}

class NexusMCPClient {
  private readonly baseUrl: string
  private readonly apiKey: string

  constructor() {
    this.baseUrl = process.env.MCP_SERVER_URL ?? 'http://localhost:3100'
    this.apiKey = process.env.MCP_API_KEY ?? ''
  }

  async callTool<TResult = unknown>(
    toolName: MCPToolName,
    params: Record<string, unknown>,
    options: MCPCallOptions,
  ): Promise<TResult> {
    const requestId = options.requestId ?? `req-${Date.now()}`

    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'X-Request-ID': requestId,
      },
      body: JSON.stringify({
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
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      throw new Error(`[MCP] HTTP ${response.status} - ${toolName}`)
    }

    const data = (await response.json()) as {
      result?: { content?: Array<{ type: string; text: string }> }
      error?: { code: number; message: string }
    }

    if (data.error) {
      throw new Error(`[MCP] ${toolName}: ${data.error.message}`)
    }

    const text = data.result?.content?.[0]?.text
    if (!text) {
      throw new Error(`[MCP] Invalid response for ${toolName}`)
    }

    return JSON.parse(text) as TResult
  }

  student = {
    getProfile: (studentId: string, agentSkill: AgentSkill) =>
      this.callTool('eaf_get_student_profile', { studentId }, { agentSkill, studentId }),

    updateSkillMap: (
      params: Record<string, unknown>,
      agentSkill: AgentSkill,
      studentId: string,
    ) => this.callTool('eaf_update_skill_map', params, { agentSkill, studentId }),

    getErrorBank: (studentId: string, agentSkill: AgentSkill) =>
      this.callTool('eaf_get_error_bank', { studentId }, { agentSkill, studentId }),

    scheduleRevision: (params: Record<string, unknown>, agentSkill: AgentSkill) =>
      this.callTool('eaf_schedule_revision', params, {
        agentSkill,
        studentId: params.studentId as string | undefined,
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

    getUsage: (studentId: string) =>
      this.callTool('eaf_get_usage', { studentId }, { agentSkill: 'system', studentId }),
  }

  evaluation = {
    getCorrection: (copieId: string, studentId: string) =>
      this.callTool('eaf_get_correction', { copieId, studentId }, { agentSkill: 'correcteur', studentId }),

    saveEvaluation: (params: Record<string, unknown>, studentId: string) =>
      this.callTool('eaf_save_evaluation', params, { agentSkill: 'correcteur', studentId }),

    getOralSession: (sessionId: string, studentId: string) =>
      this.callTool('eaf_get_oral_session', { sessionId, studentId }, { agentSkill: 'coach-oral', studentId }),
  }

  planning = {
    generatePlan: (studentId: string, options?: Record<string, unknown>) =>
      this.callTool('eaf_generate_plan', { studentId, ...(options ?? {}) }, { agentSkill: 'diagnosticien', studentId }),

    markTaskComplete: (params: Record<string, unknown>, studentId: string) =>
      this.callTool('eaf_mark_task_complete', params, { agentSkill: 'rappel-agent', studentId }),
  }

  analytics = {
    getWeeklyStats: (studentId: string, weekOffset = 0) =>
      this.callTool('eaf_get_weekly_stats', { studentId, weekOffset }, { agentSkill: 'rapport-auto', studentId }),

    getSkillDelta: (studentId: string, fromDate: string, toDate?: string) =>
      this.callTool('eaf_get_skill_delta', { studentId, fromDate, toDate }, { agentSkill: 'rapport-auto', studentId }),

    generateReport: (studentId: string, weekOffset = -1) =>
      this.callTool('eaf_generate_report', { studentId, weekOffset }, { agentSkill: 'rapport-auto', studentId }),
  }
}

let singleton: NexusMCPClient | null = null

export function getMcpClient(): NexusMCPClient {
  if (!singleton) singleton = new NexusMCPClient()
  return singleton
}

export const mcpClient = getMcpClient()
