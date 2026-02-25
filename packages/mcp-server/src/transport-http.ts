import { createServer as createHttpServer } from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import type { Server as MCPServer } from '@modelcontextprotocol/sdk/server/index.js'
import { logger } from './lib/logger.js'

interface HttpTransportOptions {
  port: number
  allowedOrigins: string[]
}

interface HttpTransport {
  start: () => Promise<void>
}

function sanitizeOrigin(origin: string, allowedOrigins: string[]): string | null {
  if (!origin) return null
  if (allowedOrigins.includes('*')) return origin
  return allowedOrigins.includes(origin) ? origin : null
}

export function createHttpTransport(
  mcpServer: MCPServer,
  options: HttpTransportOptions,
): HttpTransport {
  const { port, allowedOrigins } = options

  const server = createHttpServer((req, res) => {
    const origin = req.headers.origin ?? ''
    const allowedOrigin = sanitizeOrigin(origin, allowedOrigins)
    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
      res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID')
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const authHeader = req.headers.authorization ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    const expected = process.env.MCP_API_KEY ?? ''

    if (expected) {
      if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Unauthorized' }))
        return
      }

      const expectedBuf = Buffer.from(expected)
      const tokenBuf = Buffer.alloc(expectedBuf.length)
      Buffer.from(token).copy(tokenBuf, 0, 0, expectedBuf.length)
      if (!timingSafeEqual(expectedBuf, tokenBuf) || token.length !== expected.length) {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Unauthorized' }))
        return
      }
    }

    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', version: '1.0.0', toolCount: 27 }))
      return
    }

    if (req.url === '/mcp' && req.method === 'POST') {
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', async () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString()) as {
            id: string | number | null
            method: string
            params?: unknown
          }
          const requestId = req.headers['x-request-id']
          if (typeof requestId === 'string') {
            logger.debug({ requestId, method: body.method }, '[MCP HTTP] request')
          }

          const result = await handleJsonRpc(mcpServer, body)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }))
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Internal error'
          logger.error({ error }, '[MCP HTTP] error')
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32603, message },
          }))
        }
      })
      return
    }

    res.writeHead(404)
    res.end()
  })

  return {
    start: () =>
      new Promise((resolve, reject) => {
        server.listen(port, () => {
          logger.info({ port }, '[MCP HTTP] listening')
          resolve()
        })
        server.on('error', reject)
      }),
  }
}

async function handleJsonRpc(
  mcpServer: MCPServer,
  body: { method: string; params?: unknown },
): Promise<unknown> {
  const internal = mcpServer as unknown as { _requestHandlers?: Map<string, (payload: unknown) => Promise<unknown>> }
  const handler = internal._requestHandlers?.get(body.method)
  if (!handler) {
    throw new Error(`Method unknown: ${body.method}`)
  }
  return handler({ method: body.method, params: body.params })
}
