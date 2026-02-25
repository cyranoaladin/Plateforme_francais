import { PrismaClient } from '@prisma/client'
import { logger } from './logger.js'

// Singleton Prisma — une seule connexion pour tout le MCP Server
let prismaInstance: PrismaClient | null = null

export function getDb(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient()

    logger.info('[DB] Prisma client initialized')
  }

  return prismaInstance
}

export async function disconnectDb(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
    logger.info('[DB] Prisma client disconnected')
  }
}

// Vérification santé DB
export async function checkDbHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
  const start = Date.now()
  try {
    await getDb().$queryRaw`SELECT 1`
    return { healthy: true, latencyMs: Date.now() - start }
  } catch (err) {
    logger.error({ err }, '[DB] Health check failed')
    return { healthy: false, latencyMs: Date.now() - start }
  }
}
