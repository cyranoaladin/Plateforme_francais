import pino from 'pino'

const level = process.env.MCP_LOG_LEVEL ?? 'info'
const pretty = process.env.LOG_PRETTY === 'true' && process.env.NODE_ENV !== 'production'

export const logger = pino(
  {
    level,
    base: { service: 'nexus-eaf-mcp', version: '1.0.0' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ['*.password', '*.apiKey', '*.token', '*.secret', '*.authorization'],
      censor: '[REDACTED]',
    },
  },
  pretty
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,service',
        },
      })
    : undefined
)

// Logger pour les appels d'outils
export function logToolCall(params: {
  tool: string
  agentSkill: string
  studentId?: string
  durationMs: number
  success: boolean
  error?: string
}) {
  const log = params.success ? logger.info.bind(logger) : logger.warn.bind(logger)
  log(
    {
      tool: params.tool,
      agent: params.agentSkill,
      studentId: params.studentId,
      durationMs: params.durationMs,
      success: params.success,
      error: params.error,
    },
    `[TOOL] ${params.tool} ${params.success ? '✓' : '✗'} ${params.durationMs}ms`
  )
}

// Logger pour les événements compliance
export function logComplianceEvent(params: {
  ruleId: string
  action: 'allow' | 'deny' | 'sanitize' | 'warn'
  agentSkill: string
  studentId?: string
  reason: string
}) {
  const isBlock = params.action === 'deny'
  const log = isBlock ? logger.warn.bind(logger) : logger.info.bind(logger)
  log(
    {
      compliance: true,
      ruleId: params.ruleId,
      action: params.action,
      agent: params.agentSkill,
      studentId: params.studentId,
    },
    `[COMPLIANCE] ${params.ruleId} → ${params.action.toUpperCase()} — ${params.reason}`
  )
}
