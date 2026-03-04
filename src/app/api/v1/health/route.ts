import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db/client";

export async function GET() {
  const dbStatus = await isDatabaseAvailable();
  let mcpStatus = "unknown";
  const mcpUrl = process.env.MCP_SERVER_URL ?? 'http://localhost:3100';
  
  try {
    const res = await fetch(`${mcpUrl}/health`, {
       method: 'GET',
       signal: AbortSignal.timeout(2000),
       headers: { Authorization: `Bearer ${process.env.MCP_API_KEY ?? ''}` }
    });
    mcpStatus = res.ok ? "healthy" : "degraded";
  } catch {
    mcpStatus = "unreachable";
  }

  return NextResponse.json(
    {
      status: dbStatus ? "ok" : "degraded",
      service: "eaf-platform",
      database: dbStatus ? "connected" : "unavailable",
      mcpServer: mcpStatus,
      checkedAt: new Date().toISOString(),
    },
    { status: dbStatus ? 200 : 503 },
  );
}
