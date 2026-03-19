import { NextResponse } from 'next/server'

export async function GET() {
  const mcpUrl = process.env.MCP_SERVER_URL ?? 'http://localhost:3100'

  try {
    const start = Date.now()
    const response = await fetch(`${mcpUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5_000),
      headers: {
        Authorization: `Bearer ${process.env.MCP_API_KEY ?? ''}`,
      },
    })
    const latencyMs = Date.now() - start

    if (!response.ok) {
      return NextResponse.json(
        { status: 'degraded', mcpUrl, latencyMs, error: `HTTP ${response.status}` },
        { status: 503 },
      )
    }

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
    return NextResponse.json({
      status: 'healthy',
      mcpUrl,
      latencyMs,
      mcpVersion: data.version ?? 'unknown',
      tools: data.toolCount ?? 27,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unreachable',
        mcpUrl,
        error: error instanceof Error ? error.message : 'MCP Server unreachable',
        hint: 'Demarrer le MCP Server avec : npm run mcp:dev',
      },
      { status: 503 },
    )
  }
}
