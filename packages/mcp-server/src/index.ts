#!/usr/bin/env node
/**
 * Nexus Réussite EAF — MCP Server
 * Point d'entrée principal
 *
 * Usage:
 *   stdio (Claude Desktop, dev) : node dist/index.js
 *   HTTP  (production PM2)      : MCP_TRANSPORT=http node dist/index.js
 */

import 'dotenv/config'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { logger } from './lib/logger.js'
import { createServer } from './server.js'
import { disconnectDb } from './lib/db.js'
import { disconnectRedis } from './lib/redis.js'

const transport = process.env.MCP_TRANSPORT ?? 'stdio'

async function main() {
  logger.info(
    {
      transport,
      port: process.env.MCP_PORT ?? 3100,
      logLevel: process.env.MCP_LOG_LEVEL ?? 'info',
      nodeVersion: process.version,
    },
    '🚀 Nexus EAF MCP Server démarrage...'
  )

  const server = createServer()

  if (transport === 'stdio') {
    // Mode stdio — pour Claude Desktop, MCP Inspector, développement
    const stdioTransport = new StdioServerTransport()
    await server.connect(stdioTransport)
    logger.info('📡 Transport stdio actif — en attente de commandes...')
  } else if (transport === 'http') {
    // Mode HTTP/SSE — pour production avec PM2
    // Import dynamique pour éviter la dépendance si non utilisé
    const { createHttpTransport } = await import('./transport-http.js').catch(() => {
      logger.error('[MCP] Transport HTTP non disponible. Installer @modelcontextprotocol/sdk >= 1.1')
      process.exit(1)
    })

    const httpTransport = createHttpTransport(server, {
      port: parseInt(process.env.MCP_PORT ?? '3100'),
      allowedOrigins: (process.env.MCP_ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
    })

    await httpTransport.start()
    logger.info(`📡 Transport HTTP actif sur port ${process.env.MCP_PORT ?? 3100}`)
  } else {
    logger.error(`Transport inconnu : ${transport}. Utiliser "stdio" ou "http"`)
    process.exit(1)
  }
}

// Gestion propre des signaux d'arrêt
async function shutdown(signal: string) {
  logger.info(`[MCP] Signal ${signal} reçu — arrêt propre...`)
  try {
    await disconnectDb()
    await disconnectRedis()
    logger.info('[MCP] Connexions fermées. Au revoir. 👋')
    process.exit(0)
  } catch (err) {
    logger.error({ err }, '[MCP] Erreur pendant l\'arrêt')
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('uncaughtException', (err) => {
  logger.error({ err }, '[MCP] Exception non capturée')
  process.exit(1)
})
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, '[MCP] Promesse rejetée non gérée')
})

main().catch((err) => {
  logger.error({ err }, '[MCP] Erreur fatale au démarrage')
  process.exit(1)
})
